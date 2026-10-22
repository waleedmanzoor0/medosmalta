import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { BookOpen, Flag, Pencil, Plus, Search, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, Field, Panel, PageHeader, selectCls, STATUS_META, StatusPill, type Status } from "@/components/medos/ui";
import { useRemove, useRows, useSave, type Module, type Topic } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/study")({
  head: () => ({ meta: [{ title: "Study Hub — MedOS" }, { name: "description", content: "Modules, lectures, topics and learning objectives." }, { property: "og:title", content: "Study Hub — MedOS" }, { property: "og:description", content: "Modules, lectures, topics and learning objectives." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: StudyHub,
});

function StudyHub() {
  const { data: modules = [], isLoading } = useRows<Module>("modules");
  const topics = useRows<Topic>("topics").data ?? [];
  const removeModule = useRemove("modules");
  const removeTopic = useRemove("topics");
  const saveTopic = useSave("topics", "");
  const [sel, setSel] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [editMod, setEditMod] = useState<Partial<Module> | null>(null);
  const [editTopic, setEditTopic] = useState<Partial<Topic> | null>(null);

  const current = modules.find((m) => m.id === sel) ?? modules[0];
  const list = useMemo(
    () =>
      topics.filter(
        (t) =>
          t.module_id === current?.id &&
          (status === "all" || t.status === status) &&
          [t.title, t.subject, t.lecture].join(" ").toLowerCase().includes(q.toLowerCase()),
      ),
    [topics, current, status, q],
  );

  const progress = (id: string) => {
    const ts = topics.filter((t) => t.module_id === id);
    return { total: ts.length, mastered: ts.filter((t) => t.status === "mastered").length };
  };

  return (
    <>
      <PageHeader eyebrow="Study Hub" title="Your curriculum" action={<Button variant="outline" onClick={() => setEditMod({})}><Plus /> Module</Button>}>
        Organise modules into subjects, lectures and topics. Track each topic honestly.
      </PageHeader>
      <p className="mb-5 flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">
        <ShieldAlert className="mt-0.5 size-3.5 shrink-0" /> Never record patient-identifiable information. Add a source reference for anything you note as fact.
      </p>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : !modules.length ? (
        <Panel><EmptyState icon={BookOpen} title="No modules yet" action={<Button onClick={() => setEditMod({})}><Plus /> Create your first module</Button>}>Start with a module like “Human Anatomy I”.</EmptyState></Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 lg:mx-0 lg:grid lg:content-start lg:overflow-visible lg:px-0">
            {modules.map((m) => {
              const p = progress(m.id);
              const active = current?.id === m.id;
              return (
                <button key={m.id} onClick={() => setSel(m.id)} className={cn("surface min-w-52 p-4 text-left transition-all", active ? "ring-2 ring-primary" : "hover:shadow-lift")}>
                  <p className="eyebrow">{m.code || "Module"}{m.year_of_study ? ` · Year ${m.year_of_study}` : ""}</p>
                  <p className="mt-1 font-semibold">{m.name}</p>
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${p.total ? (p.mastered / p.total) * 100 : 0}%` }} /></div>
                  <p className="mt-1.5 text-xs text-muted-foreground">{p.mastered}/{p.total} mastered</p>
                </button>
              );
            })}
          </div>

          {current && (
            <Panel
              title={current.name}
              action={
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditMod(current)} aria-label="Edit module"><Pencil /></Button>
                  <Button variant="ghost" size="icon" onClick={() => confirm("Delete this module and all its topics?") && removeModule.mutate(current.id)} aria-label="Delete module"><Trash2 /></Button>
                  <Button size="sm" onClick={() => setEditTopic({ module_id: current.id })}><Plus /> Topic</Button>
                </div>
              }
            >
              <div className="mb-4 flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search topics, subjects, lectures" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
                <select className={cn(selectCls, "sm:w-44")} value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="all">All statuses</option>
                  {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              {!list.length ? (
                <EmptyState icon={BookOpen} title="No topics here">Add topics with learning objectives and sources.</EmptyState>
              ) : (
                <ul className="stagger grid gap-2">
                  {list.map((t) => (
                    <li key={t.id} className="rounded-lg border bg-background p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">{[t.subject, t.lecture].filter(Boolean).join(" · ") || "General"}</p>
                          <p className="flex items-center gap-1.5 font-medium">{t.title}{t.is_difficult && <Flag className="size-3.5 text-destructive" />}</p>
                          {t.learning_objectives && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.learning_objectives}</p>}
                          {t.source_reference && <p className="mt-1 text-xs text-muted-foreground">Source: {t.source_reference}</p>}
                        </div>
                        <div className="flex shrink-0 items-center">
                          <Button variant="ghost" size="icon" onClick={() => setEditTopic(t)} aria-label="Edit topic"><Pencil /></Button>
                          <Button variant="ghost" size="icon" onClick={() => confirm("Delete this topic?") && removeTopic.mutate(t.id)} aria-label="Delete topic"><Trash2 /></Button>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(Object.keys(STATUS_META) as Status[]).map((s) => (
                          <button key={s} onClick={() => saveTopic.mutate({ id: t.id, status: s })} className={cn("rounded-full transition-opacity", t.status === s ? "opacity-100" : "opacity-40 hover:opacity-80")}>
                            <StatusPill status={s} />
                          </button>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}
        </div>
      )}
      <ModuleDialog mod={editMod} onClose={() => setEditMod(null)} onCreated={setSel} />
      <TopicDialog topic={editTopic} modules={modules} onClose={() => setEditTopic(null)} />
    </>
  );
}

function ModuleDialog({ mod, onClose }: { mod: Partial<Module> | null; onClose: () => void; onCreated: (id: string) => void }) {
  const save = useSave("modules", mod?.id ? "Module updated" : "Module created");
  const [err, setErr] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "").trim();
    if (!name) return setErr("Module name is required.");
    const y = String(f.get("year_of_study") || "");
    await save.mutateAsync({ id: mod?.id, name, code: String(f.get("code") || "") || null, year_of_study: y ? Number(y) : null });
    onClose();
  }
  return (
    <Dialog open={!!mod} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{mod?.id ? "Edit module" : "New module"}</DialogTitle></DialogHeader>
        {mod && (
          <form onSubmit={submit} className="grid gap-4">
            <Field label="Name" error={err}><Input name="name" defaultValue={mod.name} maxLength={120} autoFocus /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Code"><Input name="code" defaultValue={mod.code ?? ""} placeholder="ANA1001" /></Field>
              <Field label="Year"><select name="year_of_study" className={selectCls} defaultValue={mod.year_of_study ?? ""}><option value="">—</option>{[1, 2, 3, 4, 5, 6].map((y) => <option key={y}>{y}</option>)}</select></Field>
            </div>
            <Button type="submit" disabled={save.isPending}>Save</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TopicDialog({ topic, modules, onClose }: { topic: Partial<Topic> | null; modules: Module[]; onClose: () => void }) {
  const save = useSave("topics", topic?.id ? "Topic updated" : "Topic added");
  const [err, setErr] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const title = String(f.get("title") ?? "").trim();
    if (!title) return setErr("Topic title is required.");
    const s = (k: string) => String(f.get(k) || "").trim() || null;
    await save.mutateAsync({
      id: topic?.id, module_id: String(f.get("module_id")), title, subject: s("subject"), lecture: s("lecture"),
      learning_objectives: s("learning_objectives"), notes: s("notes"), source_reference: s("source_reference"),
      status: String(f.get("status")), is_difficult: f.get("is_difficult") === "on", next_review_at: s("next_review_at"),
    });
    onClose();
  }
  return (
    <Dialog open={!!topic} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{topic?.id ? "Edit topic" : "New topic"}</DialogTitle></DialogHeader>
        {topic && (
          <form onSubmit={submit} className="grid gap-4">
            <Field label="Title" error={err}><Input name="title" defaultValue={topic.title} maxLength={200} autoFocus /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Module"><select name="module_id" className={selectCls} defaultValue={topic.module_id}>{modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
              <Field label="Status"><select name="status" className={selectCls} defaultValue={topic.status ?? "not_started"}>{Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></Field>
              <Field label="Subject"><Input name="subject" defaultValue={topic.subject ?? ""} placeholder="Upper limb" /></Field>
              <Field label="Lecture"><Input name="lecture" defaultValue={topic.lecture ?? ""} placeholder="Lecture 3" /></Field>
            </div>
            <Field label="Learning objectives"><Textarea name="learning_objectives" defaultValue={topic.learning_objectives ?? ""} rows={3} /></Field>
            <Field label="Notes" hint="Your own words. Don't include patient details."><Textarea name="notes" defaultValue={topic.notes ?? ""} rows={3} /></Field>
            <Field label="Source reference" hint="Textbook, page, lecture slide or guideline."><Input name="source_reference" defaultValue={topic.source_reference ?? ""} /></Field>
            <div className="grid grid-cols-2 items-end gap-3">
              <Field label="Next review"><Input type="date" name="next_review_at" defaultValue={topic.next_review_at ?? ""} /></Field>
              <label className="flex h-9 items-center gap-2 text-sm"><input type="checkbox" name="is_difficult" defaultChecked={!!topic.is_difficult} className="size-4 accent-primary" /> Difficult topic</label>
            </div>
            <Button type="submit" disabled={save.isPending}>Save</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
