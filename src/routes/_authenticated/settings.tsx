import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Panel, PageHeader } from "@/components/medos/ui";
import { supabase } from "@/integrations/supabase/client";
import { exportAll, friendlyError, loadSampleData, removeSampleData, useProfile, useSave } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings & data — MedOS" }, { name: "description", content: "Profile, sample data and exports." }, { property: "og:title", content: "Settings & data — MedOS" }, { property: "og:description", content: "Profile, sample data and exports." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data } = useProfile();
  const save = useSave("profiles", "Profile saved");
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<void>, ok: string) {
    setBusy(key);
    try {
      await fn();
      await qc.invalidateQueries();
      toast.success(ok);
    } catch (e) {
      toast.error(friendlyError(e as Error));
    } finally {
      setBusy(null);
    }
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const goal = Number(f.get("goal"));
    if (!(goal > 0 && goal <= 100)) {
      toast.error("Weekly goal must be between 1 and 100 hours.");
      return;
    }
    save.mutate({ id: data!.id, display_name: String(f.get("name")).trim() || null, weekly_study_goal_hours: goal });
  }

  return (
    <>
      <PageHeader eyebrow="Settings" title="Settings & data" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Profile">
          {data && (
            <form onSubmit={submit} className="grid gap-4" key={data.id}>
              <Field label="Display name"><Input name="name" defaultValue={data.profile?.display_name ?? ""} maxLength={80} /></Field>
              <Field label="Weekly study goal (hours)"><Input name="goal" type="number" min={1} max={100} step={0.5} defaultValue={String(data.profile?.weekly_study_goal_hours ?? 20)} /></Field>
              <Button type="submit" className="justify-self-start">Save profile</Button>
            </form>
          )}
        </Panel>
        <Panel title="Sample data">
          <p className="mb-4 text-sm text-muted-foreground">Load realistic Year 1 modules, topics, tasks and a week of events. Remove them any time — your own records stay untouched.</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => run("load", loadSampleData, "Sample data added")} disabled={!!busy}><Sparkles /> {busy === "load" ? "Loading…" : "Load sample data"}</Button>
            <Button variant="outline" onClick={() => run("rm", removeSampleData, "Sample data removed")} disabled={!!busy}><Trash2 /> Remove sample data</Button>
          </div>
        </Panel>
        <Panel title="Export your records">
          <p className="mb-4 text-sm text-muted-foreground">Download your modules, topics, tasks, events, flashcards, quiz questions and results.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => run("json", () => exportAll("json"), "Export ready")} disabled={!!busy}><Download /> JSON</Button>
            <Button variant="outline" onClick={() => run("csv", () => exportAll("csv"), "Export ready")} disabled={!!busy}><Download /> CSV files</Button>
          </div>
        </Panel>
        <ChangePassword />
        <Panel title="Privacy & accuracy">
          <ul className="grid gap-2 text-sm text-muted-foreground">
            <li>This workspace has a single owner — new sign-ups are switched off.</li>
            <li>Do not store patient-identifiable information.</li>
            <li>Record a source for clinical facts. Future AI-generated content will be clearly marked as unverified.</li>
          </ul>
        </Panel>
      </div>
    </>
  );
}

function ChangePassword() {
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const current = String(f.get("current") ?? "");
    const next = String(f.get("next") ?? "");
    if (!current) return void toast.error("Enter your current password.");
    if (next.length < 10) return void toast.error("New password must be at least 10 characters.");
    if (next !== String(f.get("confirm"))) return void toast.error("New passwords don't match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: next, current_password: current } as { password: string });
    setBusy(false);
    if (error) return void toast.error(error.message);
    form.reset();
    toast.success("Password changed");
  }
  return (
    <Panel title="Change password">
      <form onSubmit={submit} className="grid gap-3">
        <Field label="Current password"><Input name="current" type="password" autoComplete="current-password" /></Field>
        <Field label="New password"><Input name="next" type="password" autoComplete="new-password" /></Field>
        <Field label="Confirm new password"><Input name="confirm" type="password" autoComplete="new-password" /></Field>
        <Button type="submit" variant="outline" className="justify-self-start" disabled={busy}>Update password</Button>
      </form>
    </Panel>
  );
}
