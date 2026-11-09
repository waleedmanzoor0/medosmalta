import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowRight, BookOpen, CalendarDays, ChartNoAxesCombined, Clock3, GraduationCap, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MedOS — Your medical school, organised" },
      { name: "description", content: "Your private workspace for medical study, revision, planning and everyday life." },
      { name: "theme-color", content: "#101b1a" },
      { property: "og:title", content: "MedOS — Your medical school, organised" },
      { property: "og:description", content: "One calm place for study, revision, planning and life." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Entry,
});

const features = [
  { icon: BookOpen, title: "Study Hub", description: "Keep lecture notes, topics and learning resources organised." },
  { icon: Activity, title: "Revision Centre", description: "Build flashcards, practise quizzes and revisit difficult topics." },
  { icon: CalendarDays, title: "Smart Planner", description: "Bring lectures, study sessions, work and personal plans together." },
  { icon: Clock3, title: "Task Manager", description: "Turn deadlines and small jobs into a clear, manageable plan." },
  { icon: Wallet, title: "Money Hub", description: "Keep an eye on income, spending, budgets and savings in euros." },
  { icon: ChartNoAxesCombined, title: "Progress Analytics", description: "See your planned study time, quiz results and weekly consistency." },
];

function Entry() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) window.location.replace("/dashboard");
      else if (active) setChecking(false);
    }).catch(() => {
      if (active) setChecking(false);
    });
    return () => { active = false; };
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: "radial-gradient(55rem 35rem at 80% -10%, oklch(0.7 0.16 163 / 0.13), transparent 65%), radial-gradient(40rem 30rem at -10% 80%, oklch(0.79 0.15 75 / 0.07), transparent 65%)" }} />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 sm:px-8">
        <header className="flex items-center justify-between border-b border-border/70 py-5">
          <Logo />
          <Link to="/auth" className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm font-semibold transition hover:border-primary/50 hover:bg-primary-soft">
            Open workspace <ArrowRight className="size-4" />
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="max-w-2xl animate-rise">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1.5 text-xs font-semibold tracking-wide text-accent-foreground">
              <span className="size-2 rounded-full bg-primary" /> YOUR PRIVATE MEDICAL STUDENT OS
            </div>
            <h1 className="font-display max-w-2xl text-5xl leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
              Medical school is demanding. <span className="text-primary">Your system shouldn't be.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
              MedOS brings your studying, revision, timetable, tasks and student finances into one thoughtful workspace — designed to help you stay organised through medical school.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/auth" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-soft transition hover:brightness-110">
                {checking ? "Open MedOS" : "Enter your workspace"} <ArrowRight className="size-4" />
              </Link>
              <a href="#features" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-card/60 px-6 py-3 text-sm font-semibold transition hover:bg-muted">
                Explore features
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Private by design · Built for your six-year medicine journey</p>
          </div>

          <div className="animate-rise lg:pl-4">
            <div className="surface overflow-hidden rounded-3xl p-5 sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">A calmer way to study</p>
                  <h2 className="font-display mt-1 text-2xl">Your week, in focus.</h2>
                </div>
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary-soft text-primary"><GraduationCap className="size-5" /></div>
              </div>
              <div className="mt-7 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-primary-soft/70 p-4">
                  <p className="text-xs font-medium text-muted-foreground">Study planned</p>
                  <p className="mt-2 font-display text-3xl">18.5h</p>
                  <p className="mt-1 text-xs text-muted-foreground">This week</p>
                </div>
                <div className="rounded-2xl bg-muted/70 p-4">
                  <p className="text-xs font-medium text-muted-foreground">Revision cards</p>
                  <p className="mt-2 font-display text-3xl">42</p>
                  <p className="mt-1 text-xs text-muted-foreground">Ready to review</p>
                </div>
              </div>
              <div className="mt-5 rounded-2xl border border-border/80 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold">Today at a glance</p>
                  <span className="text-xs text-muted-foreground">A sample view</span>
                </div>
                <div className="space-y-3">
                  {[
                    ["09:00", "Clinical physiology", "Lecture"],
                    ["11:00", "Cardiovascular revision", "Study"],
                    ["14:00", "Complete weekly tasks", "Planning"],
                  ].map(([time, title, type], index) => (
                    <div key={time} className="flex items-center gap-3">
                      <span className="w-12 shrink-0 text-xs tabular-nums text-muted-foreground">{time}</span>
                      <span className={`h-9 w-1 rounded-full ${index === 0 ? "bg-sky-400" : index === 1 ? "bg-primary" : "bg-amber-400"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{title}</p>
                        <p className="text-xs text-muted-foreground">{type}</p>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-center text-[11px] text-muted-foreground">Illustrative preview · Your workspace keeps your own records</p>
            </div>
          </div>
        </section>

        <section id="features" className="pb-16 sm:pb-20">
          <div className="mb-7 max-w-xl">
            <p className="eyebrow">Everything in one place</p>
            <h2 className="font-display mt-2 text-3xl sm:text-4xl">Built around the real student routine.</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Less switching between apps. More headspace for learning, rest and everything outside university.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <article key={title} className="surface lift rounded-2xl p-5">
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary"><Icon className="size-5" /></div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <footer className="flex flex-col items-center justify-between gap-3 border-t border-border/70 py-6 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} MedOS</span>
          <span>A private workspace for your medical journey.</span>
        </footer>
      </div>
    </main>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary font-display text-lg text-primary-foreground">M</span>
      <span className="font-display text-2xl">MedOS</span>
    </span>
  );
}
