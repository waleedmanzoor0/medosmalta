import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { format } from "date-fns";
import { CheckSquare, Pencil, Plus, Repeat, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, Field, Panel, PageHeader, PRIORITY_CLS, selectCls } from "@/components/medos/ui";
import { useRemove, useRows, useSave, type Module, type Task } from "@/lib/data";
import { nextDueDate } from "@/lib/schedule";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({ meta: [{ title: "Tasks — MedOS" }, { name: "description", content: "Tasks, assignments and routines." }, { property: "og:title", content: "Tasks — MedOS" }, { property: "og:description", content: "Tasks, assignments and routines." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: TasksPage,
});

function TasksPage() {
  const { data: tasks = [], isLoading } = useRows<Task>("tasks");
  const modules = useRows<Module>("modules").data ?? [];
  const save = useSave("tasks", "");
  const remove = useRemove("tasks");
  const [q, setQ] = useState("");
  const [show, setShow] = useState<"open" | "done" | "all">("open");
  const [kind, setKind] = useState("all");
  const [editing, setEditing] = useState<Partial<Task> | null>(null);
  const today = format(new Date(), "yyyy-MM-dd");

  const list = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (show === "all" || (show === "open" ? !t.completed : t.completed)) &&
          (kind === "all" || t.kind === kind) &&
          t.title.toLowerCase().includes(q.toLowerCase()),
      ),
    [tasks, show, kind, q],
  );

  async function toggle(t: Task) {
    const done = !t.completed;
    await save.mutateAsync({ id: t.id, completed: done, completed_at: done ? new Date().toISOString() : null });
    if (done && t.recurrence !== "none") {
      await save.mutateAsync({ title: t.title, notes: t.notes, kind: t.kind, priority: t.priority, recurrence: t.recurrence, module_id: t.module_id, due_date: nextDueDate(t.due_date, t.recurrence) });
    }
  }

  return (
    <>
      <PageHeader eyebrow="Task Manager" title="Tasks" action={<Button onClick={() => setEditing({})}><Plus /> New task</Button>}>
        Assignments, priorities and routines. Completing a recurring task schedules the next one.
      </PageHeader>
      <Panel>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search tasks" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className={cn(selectCls, "sm:w-36")} value={show} onChange={(e) => setShow(e.target.value as typeof show)}>
            <option value="open">Open</option><option value="done">Completed</option><option value="all">All</option>
          </select>
          <select className={cn(selectCls, "sm:w-40")} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="all">All types</option><option value="task">Tasks</option><option value="assignment">Assignments</option><option value="routine">Routines</option>
          </select>
        </div>
        {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : list.length === 0 ? (
          <EmptyState icon={CheckSquare} title={tasks.length ? "No tasks match" : "No tasks yet"} action={!tasks.length && <Button onClick={() => setEditing({})}><Plus /> Add a task</Button>}>
            {tasks.length ? "Try a different search or filter." : "Capture assignments, deadlines and daily routines."}
          </EmptyState>
        ) : (
          <ul className="stagger divide-y">
            {list.map((t) => {
              const overdue = !t.completed && t.due_date && t.due_date < today;
              return (
                <li key={t.id} className="group flex items-center gap-3 py-3">
                  <Checkbox checked={t.completed} onCheckedChange={() => toggle(t)} aria-label="Complete task" />
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm font-medium", t.completed && "text-muted-foreground line-through")}>{t.title}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">{t.kind}</span>
                      {t.due_date && <span className={cn(overdue && "font-semibold text-destructive")}>{overdue ? "Overdue · " : ""}{format(new Date(t.due_date + "T12:00"), "EEE d MMM")}</span>}
                      {t.recurrence !== "none" && <span className="flex items-center gap-1"><Repeat className="size-3" />{t.recurrence}</span>}
                      {t.module_id && <span>{modules.find((m) => m.id === t.module_id)?.name}</span>}
                    </div>
                  </div>
                  <span className={cn("hidden rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize sm:inline", PRIORITY_CLS[t.priority])}>{t.priority}</span>
                  <Button variant="ghost" size="icon" onClick={() => setEditing(t)} aria-label="Edit"><Pencil /></Button>
                  <Button variant="ghost" size="icon" onClick={() => confirm("Delete this task?") && remove.mutate(t.id)} aria-label="Delete"><Trash2 /></Button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
      <TaskDialog task={editing} modules={modules} onClose={() => setEditing(null)} />
    </>
  );
}

function TaskDialog({ task, modules, onClose }: { task: Partial<Task> | null; modules: Module[]; onClose: () => void }) {
  const save = useSave("tasks", task?.id ? "Task updated" : "Task added");
  const [err, setErr] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const title = String(f.get("title") ?? "").trim();
    if (!title) return setErr("Give the task a title.");
    const recurrence = String(f.get("recurrence"));
    const due = String(f.get("due_date") || "") || null;
    if (recurrence !== "none" && !due) return setErr("Recurring tasks need a due date.");
    await save.mutateAsync({
      id: task?.id, title, notes: String(f.get("notes") || "") || null, kind: String(f.get("kind")), priority: String(f.get("priority")),
      due_date: due, recurrence, module_id: String(f.get("module_id") || "") || null,
    });
    onClose();
  }
  return (
    <Dialog open={!!task} onOpenChange={(o) => { if (!o) { onClose(); setErr(""); } }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{task?.id ? "Edit task" : "New task"}</DialogTitle></DialogHeader>
        {task && (
          <form onSubmit={submit} className="grid gap-4" key={task.id ?? "new"}>
            <Field label="Title" error={err}><Input name="title" defaultValue={task.title} maxLength={200} autoFocus /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type"><select name="kind" className={selectCls} defaultValue={task.kind ?? "task"}><option value="task">Task</option><option value="assignment">Assignment</option><option value="routine">Routine</option></select></Field>
              <Field label="Priority"><select name="priority" className={selectCls} defaultValue={task.priority ?? "medium"}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></Field>
              <Field label="Due date"><Input type="date" name="due_date" defaultValue={task.due_date ?? ""} /></Field>
              <Field label="Repeats"><select name="recurrence" className={selectCls} defaultValue={task.recurrence ?? "none"}><option value="none">Never</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></Field>
            </div>
            <Field label="Module (optional)"><select name="module_id" className={selectCls} defaultValue={task.module_id ?? ""}><option value="">—</option>{modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>
            <Field label="Notes"><Textarea name="notes" defaultValue={task.notes ?? ""} rows={3} /></Field>
            <Button type="submit" disabled={save.isPending}>Save</Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
