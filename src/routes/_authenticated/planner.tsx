import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { addDays, addWeeks, format, isSameDay, isToday, startOfWeek } from "date-fns";
import { AlertTriangle, CalendarRange, ChevronLeft, ChevronRight, Plus, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, Field, KIND_META, Panel, PageHeader, selectCls, type Kind } from "@/components/medos/ui";
import { useRemove, useRows, useSave, type CalEvent, type Module } from "@/lib/data";
import { findConflicts, findNextFreeSlot } from "@/lib/schedule";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({ meta: [{ title: "Smart Planner — MedOS" }, { name: "description", content: "Weekly calendar with conflict detection." }] }),
  component: Planner,
});

function Planner() {
  const { data: events = [] } = useRows<CalEvent>("events");
  const modules = useRows<Module>("modules").data ?? [];
  const save = useSave("events", "");
  const [week, setWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [editing, setEditing] = useState<Partial<CalEvent> | null>(null);
  const [filter, setFilter] = useState<Kind | "all">("all");

  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const weekEvents = events.filter((e) => {
    const d = new Date(e.starts_at);
    return d >= week && d < addDays(week, 7);
  });
  const conflicts = useMemo(() => findConflicts(events), [events]);
  const weekConflicts = weekEvents.filter((e) => conflicts.has(e.id));
  const movable = weekConflicts.filter((e) => e.kind === "study");

  async function reschedule(e: CalEvent) {
    const slot = findNextFreeSlot(e, events);
    if (!slot) return toast.error("No free slot found in the next 7 days.");
    await save.mutateAsync({ id: e.id, ...slot });
    toast.success(`Moved “${e.title}” to ${format(new Date(slot.starts_at), "EEE HH:mm")}`);
  }
  async function rescheduleAll() {
    let pool = [...events];
    for (const e of movable) {
      const slot = findNextFreeSlot(e, pool);
      if (!slot) continue;
      await save.mutateAsync({ id: e.id, ...slot });
      pool = pool.map((p) => (p.id === e.id ? { ...p, ...slot } : p));
    }
    toast.success("Study sessions rearranged");
  }

  return (
    <>
      <PageHeader eyebrow="Smart Planner" title={`Week of ${format(week, "d MMM")}`} action={
        <>
          <Button variant="outline" size="icon" onClick={() => setWeek(addWeeks(week, -1))} aria-label="Previous week"><ChevronLeft /></Button>
          <Button variant="outline" onClick={() => setWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Today</Button>
          <Button variant="outline" size="icon" onClick={() => setWeek(addWeeks(week, 1))} aria-label="Next week"><ChevronRight /></Button>
          <Button onClick={() => setEditing({ kind: "study" })}><Plus /> Event</Button>
        </>
      } />

      {weekConflicts.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-warning/30 bg-warning-soft p-4 sm:flex-row sm:items-center sm:justify-between animate-rise">
          <p className="flex items-center gap-2 text-sm text-warning"><AlertTriangle className="size-4" /> {weekConflicts.length} events overlap this week.</p>
          {movable.length > 0 && <Button size="sm" onClick={rescheduleAll}><Wand2 /> Rearrange study sessions</Button>}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", ...Object.keys(KIND_META)] as const).map((k) => (
          <button key={k} onClick={() => setFilter(k as Kind | "all")} className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", filter === k ? "border-foreground bg-foreground text-background" : "bg-card text-muted-foreground")}>
            {k !== "all" && <span className={cn("size-2 rounded-full", KIND_META[k as Kind].dot)} />}
            {k === "all" ? "All" : KIND_META[k as Kind].label}
          </button>
        ))}
      </div>

      {!events.length ? (
        <Panel><EmptyState icon={CalendarRange} title="Your week is a blank page" action={<Button onClick={() => setEditing({ kind: "lecture" })}><Plus /> Add your first lecture</Button>}>Add lectures, study blocks, shifts, appointments and rest.</EmptyState></Panel>
      ) : (
        <div className="grid gap-3 md:grid-cols-7">
          {days.map((d) => {
            const list = weekEvents.filter((e) => isSameDay(new Date(e.starts_at), d) && (filter === "all" || e.kind === filter));
            return (
              <div key={d.toISOString()} className={cn("surface min-h-24 p-2.5", isToday(d) && "ring-2 ring-primary/40")}>
                <button onClick={() => { const s = new Date(d); s.setHours(14); const en = new Date(d); en.setHours(15); setEditing({ kind: "study", starts_at: s.toISOString(), ends_at: en.toISOString() }); }} className="mb-2 flex w-full items-baseline justify-between px-1 text-left">
                  <span className="eyebrow">{format(d, "EEE")}</span>
                  <span className={cn("font-display text-lg", isToday(d) && "text-primary")}>{format(d, "d")}</span>
                </button>
                <div className="grid gap-1.5">
                  {list.map((e) => (
                    <button key={e.id} onClick={() => setEditing(e)} className={cn("rounded-md border border-l-4 bg-background p-2 text-left transition-shadow hover:shadow-soft", KIND_META[e.kind as Kind].bar, conflicts.has(e.id) && "ring-1 ring-warning")}>
                      <p className="text-[11px] tabular-nums text-muted-foreground">{format(new Date(e.starts_at), "HH:mm")}–{format(new Date(e.ends_at), "HH:mm")}</p>
                      <p className="text-xs font-semibold leading-tight">{e.title}</p>
                      {conflicts.has(e.id) && e.kind === "study" && (
                        <span role="button" tabIndex={0} onClick={(ev) => { ev.stopPropagation(); reschedule(e); }} className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-primary"><Wand2 className="size-3" /> Move</span>
                      )}
                    </button>
                  ))}
                  {!list.length && <p className="px-1 text-[11px] text-muted-foreground">Free</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <EventDialog ev={editing} modules={modules} events={events} onClose={() => setEditing(null)} />
    </>
  );
}

const toLocal = (iso?: string | null) => (iso ? format(new Date(iso), "yyyy-MM-dd'T'HH:mm") : "");

function EventDialog({ ev, modules, events, onClose }: { ev: Partial<CalEvent> | null; modules: Module[]; events: CalEvent[]; onClose: () => void }) {
  const save = useSave("events", ev?.id ? "Event updated" : "Event added");
  const remove = useRemove("events");
  const [err, setErr] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const title = String(f.get("title") ?? "").trim();
    const s = String(f.get("starts_at")), en = String(f.get("ends_at"));
    if (!title) return setErr("Title is required.");
    if (!s || !en) return setErr("Set a start and end time.");
    const starts_at = new Date(s).toISOString(), ends_at = new Date(en).toISOString();
    if (ends_at <= starts_at) return setErr("End time must be after the start.");
    const clash = findConflicts([...events.filter((x) => x.id !== ev?.id), { id: "__new", starts_at, ends_at }]).has("__new");
    await save.mutateAsync({ id: ev?.id, title, kind: String(f.get("kind")), starts_at, ends_at, location: String(f.get("location") || "") || null, notes: String(f.get("notes") || "") || null, module_id: String(f.get("module_id") || "") || null });
    if (clash) toast.warning("Saved — but this overlaps another event.");
    onClose();
  }
  return (
    <Dialog open={!!ev} onOpenChange={(o) => { if (!o) { onClose(); setErr(""); } }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{ev?.id ? "Edit event" : "New event"}</DialogTitle></DialogHeader>
        {ev && (
          <form onSubmit={submit} className="grid gap-4" key={ev.id ?? "new"}>
            <Field label="Title" error={err}><Input name="title" defaultValue={ev.title} maxLength={200} autoFocus /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type"><select name="kind" className={selectCls} defaultValue={ev.kind ?? "study"}>{Object.entries(KIND_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></Field>
              <Field label="Module"><select name="module_id" className={selectCls} defaultValue={ev.module_id ?? ""}><option value="">—</option>{modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
              <Field label="Starts"><Input type="datetime-local" name="starts_at" defaultValue={toLocal(ev.starts_at)} /></Field>
              <Field label="Ends"><Input type="datetime-local" name="ends_at" defaultValue={toLocal(ev.ends_at)} /></Field>
            </div>
            <Field label="Location"><Input name="location" defaultValue={ev.location ?? ""} /></Field>
            <Field label="Notes"><Textarea name="notes" defaultValue={ev.notes ?? ""} rows={2} /></Field>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={save.isPending}>Save</Button>
              {ev.id && <Button type="button" variant="outline" onClick={async () => { if (confirm("Delete this event?")) { await remove.mutateAsync(ev.id!); onClose(); } }}>Delete</Button>}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
