import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/firebase_messaging";

export const sendPushAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ kind: z.enum(["login", "test"]) }).parse(d))
  .handler(async ({ data, context }) => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const connKey = process.env["FIREBASE_MESSAGING_API_KEY"];
    if (!lovableKey || !connKey) throw new Error("Phone alerts are not configured");
    const { data: devices, error } = await context.supabase.from("push_devices").select("id, token");
    if (error) throw new Error(error.message);
    const when = new Date().toLocaleString("en-GB", { timeZone: "Europe/Malta", dateStyle: "medium", timeStyle: "short" });
    const notification =
      data.kind === "login"
        ? { title: "MedOS sign-in", body: `Someone just signed in to MedOS (${when}). If this wasn't you, change your password.` }
        : { title: "MedOS test alert", body: "Phone alerts are working." };
    let sent = 0;
    for (const d of devices ?? []) {
      const res = await fetch(`${GATEWAY_URL}/v1/projects/_/messages:send`, {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": connKey, "Content-Type": "application/json" },
        body: JSON.stringify({ message: { token: d.token, notification, data: { path: "/dashboard" } } }),
      });
      if (res.ok) sent++;
      else {
        const body = await res.text();
        console.error(`FCM send failed [${res.status}]: ${body}`);
        if (res.status === 404 || res.status === 400) await context.supabase.from("push_devices").delete().eq("id", d.id);
      }
    }
    return { sent, devices: devices?.length ?? 0 };
  });
