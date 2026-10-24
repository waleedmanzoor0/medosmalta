import { createFileRoute, Link } from "@tanstack/react-router";
import { addDays, format, isSameDay, isToday, startOfWeek } from "date-fns";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Briefcase, CalendarClock, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, KIND_META, Panel, PageHeader, PRIORITY_CLS, StatusPill, type Kind } from "@/components/medos/ui";
import { useProfile, useRows, type CalEvent, type Task, type Topic } from "@/lib/data";
import { hoursBetween } from "@/lib/schedule";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — MedOS" }, { name: "description", content: "Your day in medicine at a glance." }, { property: "og:title", content: "Dashboard — MedOS" }, { property: "og:description", content: "Your day in medicine at a glance." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: me } = useProfile();
  const events = useRows<CalEvent>("events").data ?? [];
  const tasks = useRows<Task>("tasks").data ?? [];
  const topics = useRows<Topic>("topics").data ?? [];
  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");

  const todayEvents = events.filter((e) => isToday(new Date(e.starts_at)));
  const todayPlan = todayEvents.filter((e) => e.kind === "study" || e.kind === "lecture");
  const deadlines = tasks.filter((t) => !t.completed && t.due_date && t.due_date <= format(addDays(now, 14), "yyyy-MM-dd")).slice(0, 6);
  const revision = topics.filter((t) => t.status === "needs_revision" || (t.next_review_at && t.next_review_at <= todayStr)).slice(0, 6);
  const nextShift = events.find((e) => e.kind === "work" && new Date(e.ends_at) > now);

  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const hrs = events.filter((e) => e.kind === "study" && isSameDay(new Date(e.starts_at), d)).reduce((s, e) => s + hoursBetween(e.starts_at, e.ends_at), 0);
    return { day: format(d, "EEE"), hours: Math.round(hrs * 10) / 10 };
  });
  const weekHours = week.reduce((s, d) => s + d.hours, 0);
  const goal = Number(me?.profile?.weekly_study_goal_hours ?? 20);

  const todayTasks = tasks.filter((t) => t.due_date === todayStr || (t.completed_at && isToday(new Date(t.completed_at))));
  const doneItems = todayTasks.filter((t) => t.completed).length + todayEvents.filter((e) => new Date(e.ends_at) < now).length;
  const totalItems = todayTasks.length + todayEvents.length;
  const pct = totalItems ? Math.round((doneItems / totalItems) * 100) : 0;
  const empty = !events.length && !tasks.length && !topics.length;

  return (
    <>
      <PageHeader eyebrow={format(now, "EEEE, d MMMM")} title={`Good ${now.getHours() < 12 ? "morning" : now.getHours() < 18 ? "afternoon" : "evening"}, ${me?.profile?.display_name?.split(" ")[0] ?? ""}`}>
        Here is what today asks of you.
      </PageHeader>

      {empty && (
        <Panel className="mb-6">
          <EmptyState icon={Sparkles} title="Your workspace is empty" action={<Button asChild><Link to="/settings">Load sample data</Link></Button>}>
            Add modules in the Study Hub, plan your week, or load realistic sample data to explore.
          </EmptyState>
        </Panel>
      )}

      <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Panel title="Daily progress" className="lift md:row-span-2 lg:col-span-1">
          <div className="flex items-center gap-5">
            <Ring pct={pct} />
            <div className="text-sm text-muted-foreground">
              <p><span className="font-semibold text-foreground">{doneItems}</span> of {totalItems} items done</p>
              <p className="mt-1">Tasks due today and today's sessions.</p>
            </div>
          </div>
        </Panel>

        <Panel title="This week's study" className="lift md:col-span-1 lg:col-span-3" action={<span className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{weekHours.toFixed(1)}h</span> / {goal}h goal</span>}>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={week}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} formatter={(v) => [`${v}h`, "Study"]} />
                <Bar dataKey="hours" fill="var(--primary)" radius={[6, 6, 2, 2]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (weekHours / goal) * 100)}%` }} />
          </div>
        </Panel>

        <Panel title="Today's study plan" className="lift md:col-span-1 lg:col-span-2" action={<Link to="/planner" className="text-xs font-semibold text-primary">Planner →</Link>}>
          {todayPlan.length ? (
            <ul className="stagger grid gap-2">
              {todayPlan.map((e) => (
                <li key={e.id} className={cn("flex items-center justify-between rounded-lg border border-l-4 bg-background px-3 py-2.5", KIND_META[e.kind as Kind].bar)}>
                  <div><p className="text-sm font-medium">{e.title}</p><p className="text-xs text-muted-foreground">{KIND_META[e.kind as Kind].label}{e.location ? ` · ${e.location}` : ""}</p></div>
                  <span className="text-xs tabular-nums text-muted-foreground">{format(new Date(e.starts_at), "HH:mm")}–{format(new Date(e.ends_at), "HH:mm")}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Nothing scheduled. A good day to add an independent study block.</p>}
        </Panel>

        <Panel title="Next work shift">
          {nextShift ? (
            <div className="flex items-start gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-warning-soft text-warning"><Briefcase className="size-5" /></div>
              <div>
                <p className="font-medium">{nextShift.title}</p>
                <p className="text-sm text-muted-foreground">{format(new Date(nextShift.starts_at), "EEE d MMM, HH:mm")}–{format(new Date(nextShift.ends_at), "HH:mm")}</p>
                {nextShift.location && <p className="text-xs text-muted-foreground">{nextShift.location}</p>}
              </div>
            </div>
          ) : <p className="text-sm text-muted-foreground">No upcoming shifts.</p>}
        </Panel>

        <Panel title="Upcoming deadlines" className="lift md:col-span-2 lg:col-span-3" action={<Link to="/tasks" className="text-xs font-semibold text-primary">All tasks →</Link>}>
          {deadlines.length ? (
            <ul className="stagger divide-y">
              {deadlines.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2"><CalendarClock className="size-4 shrink-0 text-muted-foreground" /><span className="truncate text-sm">{t.title}</span></div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize", PRIORITY_CLS[t.priority])}>{t.priority}</span>
                    <span className={cn("text-xs tabular-nums", t.due_date! < todayStr ? "font-semibold text-destructive" : "text-muted-foreground")}>{format(new Date(t.due_date! + "T12:00"), "d MMM")}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">No deadlines in the next two weeks.</p>}
        </Panel>

        <Panel title="Revision due" className="lift" action={<Link to="/revision" aria-label="Open Revision Centre" className="text-primary"><RotateCcw className="size-4" /></Link>}>
          {revision.length ? (
            <ul className="stagger grid gap-2">
              {revision.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2"><span className="truncate text-sm">{t.title}</span><StatusPill status={t.status} /></li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">You're up to date.</p>}
        </Panel>
      </div>
    </>
  );
}

function Ring({ pct }: { pct: number }) {
  const r = 34, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 80 80" className="size-24 -rotate-90">
      <circle cx="40" cy="40" r={r} fill="none" strokeWidth="8" className="stroke-muted" />
      <circle cx="40" cy="40" r={r} fill="none" strokeWidth="8" strokeLinecap="round" className="stroke-primary transition-all duration-700" strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} />
      <text x="40" y="40" textAnchor="middle" dominantBaseline="central" className="rotate-90 fill-foreground font-display text-lg" style={{ transformOrigin: "40px 40px" }}>{pct}%</text>
    </svg>
  );
}
