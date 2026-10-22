import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type TableName = "modules" | "topics" | "tasks" | "events" | "flashcards" | "profiles";
export type Module = Tables<"modules">;
export type Topic = Tables<"topics">;
export type Task = Tables<"tasks">;
export type CalEvent = Tables<"events">;
export type Profile = Tables<"profiles">;

const orderBy: Record<TableName, { col: string; asc: boolean }> = {
  modules: { col: "created_at", asc: true },
  topics: { col: "created_at", asc: true },
  tasks: { col: "due_date", asc: true },
  events: { col: "starts_at", asc: true },
  flashcards: { col: "due_at", asc: true },
  profiles: { col: "created_at", asc: true },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const from = (t: TableName) => supabase.from(t as any) as any;

export function useRows<T>(table: TableName) {
  return useQuery({
    queryKey: [table],
    queryFn: async () => {
      const o = orderBy[table];
      const { data, error } = await from(table).select("*").order(o.col, { ascending: o.asc, nullsFirst: false });
      if (error) throw error;
      return data as T[];
    },
  });
}

export function useSave(table: TableName, label = "Saved") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: { id?: string | undefined; [k: string]: unknown }) => {
      const { id, ...rest } = row;
      const q = id ? from(table).update(rest).eq("id", id) : from(table).insert(rest);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [table] });
      if (label) toast.success(label);
    },
    onError: (e: Error) => toast.error(friendlyError(e)),
  });
}

export function useRemove(table: TableName) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(friendlyError(e)),
  });
}

export function friendlyError(e: { message?: string }) {
  const m = e.message ?? "";
  if (m.includes("check constraint")) return "Some values are invalid — please check the form.";
  if (m.includes("JWT") || m.includes("permission")) return "Your session expired. Please sign in again.";
  if (m.includes("Failed to fetch")) return "Can't reach the server. Check your connection.";
  return m || "Something went wrong.";
}

export function useProfile() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      return { profile: data as Profile | null, email: u.user.email ?? "", id: u.user.id };
    },
  });
}

/* ---------- Sample data ---------- */

function at(dayOffset: number, h: number, m = 0) {
  const d = new Date();
  const dow = (d.getDay() + 6) % 7; // Monday=0
  d.setDate(d.getDate() - dow + dayOffset);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}
function dateIn(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function loadSampleData() {
  const mods = [
    { name: "Human Anatomy I", code: "ANA1001", year_of_study: 1, color: "emerald", is_sample: true },
    { name: "Physiology I", code: "PHY1002", year_of_study: 1, color: "amber", is_sample: true },
    { name: "Biochemistry", code: "BCH1003", year_of_study: 1, color: "slate", is_sample: true },
  ];
  const { data: m, error } = await supabase.from("modules").insert(mods).select("id,name");
  if (error) throw error;
  const [ana, phy, bch] = m as [{ id: string }, { id: string }, { id: string }];
  const topics: TablesInsert<"topics">[] = [
    { module_id: ana.id, subject: "Upper limb", lecture: "Lecture 3", title: "Brachial plexus", learning_objectives: "Describe roots, trunks, divisions, cords and branches.", source_reference: "Course lecture slides, week 3", status: "learning", is_sample: true },
    { module_id: ana.id, subject: "Upper limb", lecture: "Lecture 4", title: "Rotator cuff muscles", status: "needs_revision", next_review_at: dateIn(0), is_sample: true },
    { module_id: ana.id, subject: "Thorax", lecture: "Lecture 6", title: "Mediastinum divisions", status: "not_started", is_sample: true },
    { module_id: phy.id, subject: "Cardiovascular", lecture: "Lecture 2", title: "Cardiac cycle", status: "mastered", is_sample: true },
    { module_id: phy.id, subject: "Cell physiology", lecture: "Lecture 1", title: "Membrane potentials", status: "needs_revision", is_difficult: true, is_sample: true },
    { module_id: bch.id, subject: "Metabolism", lecture: "Lecture 5", title: "Glycolysis regulation", status: "learning", is_sample: true },
  ];
  const tasks: TablesInsert<"tasks">[] = [
    { title: "Anatomy lab report", kind: "assignment", priority: "high", due_date: dateIn(3), module_id: ana.id, is_sample: true },
    { title: "Review physiology lecture notes", kind: "task", priority: "medium", due_date: dateIn(1), module_id: phy.id, is_sample: true },
    { title: "Weekly grocery shop", kind: "routine", priority: "low", due_date: dateIn(2), recurrence: "weekly", is_sample: true },
    { title: "Submit biochem problem set", kind: "assignment", priority: "high", due_date: dateIn(6), module_id: bch.id, is_sample: true },
    { title: "Morning flashcard session", kind: "routine", priority: "medium", due_date: dateIn(0), recurrence: "daily", is_sample: true },
  ];
  const events: TablesInsert<"events">[] = [];
  for (let d = 0; d < 5; d++) {
    events.push({ title: d % 2 ? "Physiology lecture" : "Anatomy lecture", kind: "lecture", starts_at: at(d, 9), ends_at: at(d, 11), module_id: d % 2 ? phy.id : ana.id, location: "Medical School", is_sample: true });
    events.push({ title: "Independent study", kind: "study", starts_at: at(d, 14), ends_at: at(d, 16), is_sample: true });
  }
  events.push({ title: "Café shift", kind: "work", starts_at: at(2, 15), ends_at: at(2, 20), location: "Valletta", is_sample: true });
  events.push({ title: "Café shift", kind: "work", starts_at: at(5, 10), ends_at: at(5, 16), location: "Valletta", is_sample: true });
  events.push({ title: "GP registration", kind: "appointment", starts_at: at(3, 17), ends_at: at(3, 18), is_sample: true });
  events.push({ title: "Beach walk", kind: "rest", starts_at: at(6, 10), ends_at: at(6, 12), is_sample: true });
  const r = await Promise.all([
    supabase.from("topics").insert(topics),
    supabase.from("tasks").insert(tasks),
    supabase.from("events").insert(events),
  ]);
  const err = r.find((x) => x.error)?.error;
  if (err) throw err;
}

export async function removeSampleData() {
  for (const t of ["events", "tasks", "topics", "flashcards", "modules"] as const) {
    const { error } = await supabase.from(t).delete().eq("is_sample", true);
    if (error) throw error;
  }
}

/* ---------- Export ---------- */

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
}

export async function exportAll(format: "json" | "csv") {
  const tables = ["modules", "topics", "tasks", "events", "flashcards"] as const;
  const out: Record<string, unknown[]> = {};
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select("*");
    if (error) throw error;
    out[t] = data ?? [];
  }
  const stamp = new Date().toISOString().slice(0, 10);
  if (format === "json") download(`medos-export-${stamp}.json`, JSON.stringify(out, null, 2), "application/json");
  else for (const t of tables) if (out[t].length) download(`medos-${t}-${stamp}.csv`, toCsv(out[t] as Record<string, unknown>[]), "text/csv");
}
