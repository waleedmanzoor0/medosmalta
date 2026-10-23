import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { eventDueForReminder, EVENT_LEAD_MIN, maltaParts, taskDueForReminder } from "@/lib/reminders";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/firebase_messaging";

export const Route = createFileRoute("/api/public/jobs/send-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFailure = await authenticateCronRequest(request);
        if (authFailure) return authFailure;
        const lovableKey = process.env["LOVABLE_API_KEY"];
        const connKey = process.env["FIREBASE_MESSAGING_API_KEY"];
        if (!lovableKey || !connKey) return new Response("Push not configured", { status: 500 });
        const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
        const now = new Date();
        const soon = new Date(now.getTime() + EVENT_LEAD_MIN * 60_000).toISOString();
        const today = maltaParts(now).date;

        const [{ data: events }, { data: tasks }, { data: devices }] = await Promise.all([
          db.from("events").select("id,user_id,title,starts_at,location,is_sample").gt("starts_at", now.toISOString()).lte("starts_at", soon).eq("is_sample", false),
          db.from("tasks").select("id,user_id,title,due_date,completed,is_sample").eq("due_date", today).eq("completed", false).eq("is_sample", false),
          db.from("push_devices").select("id,user_id,token"),
        ]);

        const jobs: { user_id: string; ref_kind: "event" | "task"; ref_id: string; fire_key: string; title: string; body: string; path: string }[] = [];
        for (const e of events ?? []) {
          if (!eventDueForReminder(e.starts_at, now)) continue;
          const t = new Date(e.starts_at).toLocaleTimeString("en-GB", { timeZone: "Europe/Malta", hour: "2-digit", minute: "2-digit" });
          jobs.push({ user_id: e.user_id, ref_kind: "event", ref_id: e.id, fire_key: e.starts_at, title: `Starting at ${t}: ${e.title}`, body: e.location ? `In ~30 min · ${e.location}` : "In about 30 minutes", path: "/planner" });
        }
        for (const k of tasks ?? []) {
          if (!taskDueForReminder(k.due_date, k.completed, now)) continue;
          jobs.push({ user_id: k.user_id, ref_kind: "task", ref_id: k.id, fire_key: k.due_date!, title: `Due today: ${k.title}`, body: "Task reminder from MedOS", path: "/tasks" });
        }

        let sent = 0;
        for (const j of jobs) {
          // Claim the reminder first so it never fires twice.
          const { error } = await db.from("push_reminders").insert({ user_id: j.user_id, ref_kind: j.ref_kind, ref_id: j.ref_id, fire_key: j.fire_key });
          if (error) continue;
          for (const d of (devices ?? []).filter((x) => x.user_id === j.user_id)) {
            const res = await fetch(`${GATEWAY_URL}/v1/projects/_/messages:send`, {
              method: "POST",
              headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": connKey, "Content-Type": "application/json" },
              body: JSON.stringify({ message: { token: d.token, notification: { title: j.title, body: j.body }, data: { path: j.path } } }),
            });
            if (res.ok) sent++;
            else {
              console.error(`FCM send failed [${res.status}]: ${await res.text()}`);
              if (res.status === 404 || res.status === 400) await db.from("push_devices").delete().eq("id", d.id);
            }
          }
        }
        return Response.json({ reminders: jobs.length, sent });
      },
    },
  },
});
