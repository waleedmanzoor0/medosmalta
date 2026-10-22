import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { addDays, format, startOfDay, startOfWeek } from "date-fns";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { BarChart3 } from "lucide-react";
import { PageHeader, EmptyState, selectCls, StatusPill } from "@/components/medos/ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useRows, useProfile, type CalEvent, type Module, type Topic, type QuizAttempt, type Task } from "@/lib/data";
import { dailySchedule, scheduledHours, weightedAccuracy } from "@/lib/analytics";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Progress Analytics — MedOS" }, { name: "description", content: "Scheduled study time, curriculum mastery, quiz accuracy and weekly goals." }, { property: "og:title", content: "Progress Analytics — MedOS" }, { property: "og:description", content: "Scheduled study time, curriculum mastery, quiz accuracy and weekly goals." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Analytics,
});

function Analytics() {
  const eventQuery = useRows<CalEvent>("events"), moduleQuery = useRows<Module>("modules"), topicQuery = useRows<Topic>("topics"), attemptQuery = useRows<QuizAttempt>("quiz_attempts"), taskQuery = useRows<Task>("tasks");
  const { data: me } = useProfile();
  const [days, setDays] = useState(28);
  const [module, setModule] = useState("all");
  const [samples, setSamples] = useState(false);
  const now = new Date(), end = addDays(startOfDay(now), 1), start = addDays(end, -days);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }), weekEnd = addDays(weekStart, 7);
  const include = (r: { is_sample: boolean; module_id?: string | null }) => (samples || !r.is_sample) && (module === "all" || r.module_id === module);
  const events = (eventQuery.data ?? []).filter(include);
  const topics = (topicQuery.data ?? []).filter(include);
  const attempts = (attemptQuery.data ?? []).filter(a => include(a) && new Date(a.created_at) >= start && new Date(a.created_at) < end);
  const tasks = (taskQuery.data ?? []).filter(include);
  const modules = (moduleQuery.data ?? []).filter(m => (samples || !m.is_sample) && (module === "all" || m.id === module));
  const daily = dailySchedule(events, start, days);
  const hours = scheduledHours(events, start, end);
  const activeDays = daily.filter(d => d.hours > 0).length;
  const accuracy = weightedAccuracy(attempts);
  const mastered = topics.filter(t => t.status === "mastered").length;
  const weekly = Array.from({ length: 4 }, (_, i) => { const a = addDays(weekStart, (i - 3) * 7); return { label: format(a, "d MMM"), hours: scheduledHours(events, a, addDays(a, 7)) }; });
  const weekHours = scheduledHours(events, weekStart, weekEnd);
  const goal = Number(me?.profile?.weekly_study_goal_hours ?? 20);
  const completed = tasks.filter(t => t.completed && t.completed_at && new Date(t.completed_at) >= start && new Date(t.completed_at) < end).length;
  const queries = [eventQuery, moduleQuery, topicQuery, attemptQuery, taskQuery];
  const dueTopics = topics.filter(t => t.status === "needs_revision" || (t.next_review_at && t.next_review_at <= format(now, "yyyy-MM-dd")));
  const hasData = events.length || topics.length || attempts.length || tasks.length;
  return <>
    <PageHeader eyebrow="The long view" title="Progress Analytics" />
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <select aria-label="Analytics period" className={`${selectCls} w-40`} value={days} onChange={e => setDays(Number(e.target.value))}><option value={7}>Last 7 days</option><option value={28}>Last 28 days</option><option value={90}>Last 90 days</option></select>
      <select aria-label="Analytics module" className={`${selectCls} w-56 max-w-full`} value={module} onChange={e => setModule(e.target.value)}><option value="all">All modules</option>{(moduleQuery.data ?? []).filter(m => samples || !m.is_sample).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
      <label className="flex items-center gap-2 text-xs text-muted-foreground"><Checkbox checked={samples} onCheckedChange={v => { setSamples(v === true); setModule("all"); }} /> Include sample data</label>
    </div>
    {queries.some(q => q.isLoading) ? <p role="status">Loading your progress…</p> : queries.some(q => q.isError) ? <p role="alert" className="text-destructive">Your progress could not be loaded. Please refresh to try again.</p> : <>
      {!hasData && <div className="mb-6"><EmptyState icon={BarChart3} title="Your progress starts here" action={<Button asChild variant="outline"><Link to="/planner">Open planner</Link></Button>} /></div>}
      <div className="grid grid-cols-2 gap-x-5 gap-y-6 border-y py-5 lg:grid-cols-4">
        {[{ label: "Scheduled study", value: `${hours.toFixed(1)}h`, detail: `${format(start, "d MMM")}–${format(now, "d MMM")}` }, { label: "Days with study planned", value: `${activeDays} / ${days}`, detail: "Calendar study blocks" }, { label: "Quiz accuracy", value: accuracy === null ? "—" : `${accuracy.toFixed(0)}%`, detail: `${attempts.length} saved attempts` }, { label: "Topics mastered", value: `${mastered} / ${topics.length}`, detail: "Current self-reported status" }].map(s => <div key={s.label}><p className="text-xs text-muted-foreground">{s.label}</p><p className="mt-1 font-display text-3xl tabular-nums">{s.value}</p><p className="mt-1 text-xs text-muted-foreground">{s.detail}</p></div>)}
      </div>
      <section className="grid gap-8 border-b py-7 lg:grid-cols-2">
        <div><h2 className="mb-4 text-sm font-semibold">Scheduled study by day</h2><div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={daily}><XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={35} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} /><Tooltip formatter={v => [`${Number(v).toFixed(1)}h`, "Scheduled study"]} /><Bar dataKey="hours" fill="var(--primary)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
        <div><div className="mb-4 flex flex-wrap justify-between gap-2"><h2 className="text-sm font-semibold">Weekly study goal</h2><Link to="/settings" className="text-xs text-primary">{goal}h per week →</Link></div><p className="mb-3 font-display text-3xl">{weekHours.toFixed(1)}h <span className="text-sm text-muted-foreground">scheduled this week</span></p><progress className="money-meter" max={goal} value={Math.min(weekHours, goal)} /><div className="stagger mt-4 divide-y">{weekly.map(w => <div key={w.label} className="flex justify-between py-2 text-sm"><span className="text-muted-foreground">Week of {w.label}</span><span>{w.hours.toFixed(1)}h / {goal}h</span></div>)}</div></div>
      </section>
      <section className="border-b py-7"><h2 className="mb-4 text-sm font-semibold">Study & mastery by module</h2><div className="overflow-x-auto"><table className="w-full min-w-[500px] text-left text-sm"><thead><tr className="border-b text-xs text-muted-foreground"><th className="py-2 font-medium">Module</th><th className="py-2 font-medium">Scheduled hours</th><th className="py-2 font-medium">Mastered topics</th><th className="py-2 font-medium">Quiz accuracy</th></tr></thead><tbody>{modules.map(m => { const mt = topics.filter(t => t.module_id === m.id), ma = attempts.filter(a => a.module_id === m.id), score = weightedAccuracy(ma); return <tr key={m.id} className="border-b"><td className="max-w-64 break-words py-3 pr-4 font-medium">{m.name}</td><td>{scheduledHours(events.filter(e => e.module_id === m.id), start, end).toFixed(1)}h</td><td>{mt.filter(t => t.status === "mastered").length} / {mt.length}</td><td>{score === null ? "—" : `${score.toFixed(0)}%`}</td></tr>; })}{module === "all" && <tr><td className="py-3 text-muted-foreground">Mixed / unassigned</td><td>{scheduledHours(events.filter(e => !e.module_id), start, end).toFixed(1)}h</td><td>—</td><td>{weightedAccuracy(attempts.filter(a => !a.module_id))?.toFixed(0) ?? "—"}{attempts.some(a => !a.module_id) ? "%" : ""}</td></tr>}</tbody></table></div></section>
      <section className="grid gap-8 py-7 lg:grid-cols-2"><div><h2 className="mb-4 text-sm font-semibold">Quiz performance</h2>{attempts.length ? <ul className="stagger divide-y">{attempts.slice(0, 10).map(a => <li key={a.id} className="flex justify-between gap-3 py-3 text-sm"><div><p>{(moduleQuery.data ?? []).find(m => m.id === a.module_id)?.name ?? "Mixed / unassigned quiz"}</p><p className="text-xs text-muted-foreground">{format(new Date(a.created_at), "d MMM yyyy, HH:mm")}</p></div><span className="shrink-0 tabular-nums">{a.correct_count} / {a.total_count} · {a.total_count ? Math.round(a.correct_count / a.total_count * 100) : 0}%</span></li>)}</ul> : <p className="text-sm text-muted-foreground">No saved quiz attempts in this period.</p>}<Link to="/revision" className="mt-3 inline-block text-xs text-primary">Revision Centre →</Link></div><div><h2 className="mb-4 text-sm font-semibold">Current revision priorities</h2>{dueTopics.length ? <ul className="stagger divide-y">{dueTopics.slice(0, 6).map(t => <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3"><span className="text-sm">{t.title}</span><StatusPill status={t.status} /></li>)}</ul> : <p className="text-sm text-muted-foreground">No topics currently due for revision.</p>}<div className="mt-5 flex flex-wrap gap-5 border-t pt-4 text-xs text-muted-foreground"><span><strong className="text-foreground">{completed}</strong> tasks completed in this period</span><span><strong className="text-foreground">{topics.filter(t => t.is_difficult).length}</strong> difficult topics</span></div></div></section>
    </>}
  </>;
}