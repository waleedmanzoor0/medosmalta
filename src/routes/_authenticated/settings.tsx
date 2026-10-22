import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Panel, PageHeader } from "@/components/medos/ui";
import { exportAll, friendlyError, loadSampleData, removeSampleData, useProfile, useSave } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings & data — MedOS" }, { name: "description", content: "Profile, sample data and exports." }] }),
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
    if (!(goal > 0 && goal <= 100)) return toast.error("Weekly goal must be between 1 and 100 hours.");
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
          <p className="mb-4 text-sm text-muted-foreground">Download everything you've stored — modules, topics, tasks, events and flashcards.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => run("json", () => exportAll("json"), "Export ready")} disabled={!!busy}><Download /> JSON</Button>
            <Button variant="outline" onClick={() => run("csv", () => exportAll("csv"), "Export ready")} disabled={!!busy}><Download /> CSV files</Button>
          </div>
        </Panel>
        <Panel title="Privacy & accuracy">
          <ul className="grid gap-2 text-sm text-muted-foreground">
            <li>Your records are private to your account.</li>
            <li>Do not store patient-identifiable information.</li>
            <li>Record a source for clinical facts. Future AI-generated content will be clearly marked as unverified.</li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
