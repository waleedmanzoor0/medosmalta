import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BookOpen, CalendarRange, CheckSquare, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MedOS — Your operating system for medical school" },
      { name: "description", content: "One calm place for lectures, topics, revision, tasks and work shifts across your medicine degree." },
      { property: "og:title", content: "MedOS — Your operating system for medical school" },
      { property: "og:description", content: "One calm place for lectures, topics, revision, tasks and work shifts across your medicine degree." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: LayoutDashboard, title: "Today, at a glance", text: "Study plan, deadlines, revision due and your next shift." },
  { icon: BookOpen, title: "Study Hub", text: "Modules, lectures, topics and objectives with honest status tracking." },
  { icon: CalendarRange, title: "Smart Planner", text: "A weekly calendar that spots clashes and reschedules study for you." },
  { icon: CheckSquare, title: "Tasks & routines", text: "Assignments, priorities and recurring routines that roll forward." },
];

function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <Button asChild variant="ghost" size="sm">
          <Link to="/auth">Sign in</Link>
        </Button>
      </nav>
      <main className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:pt-20">
        <p className="eyebrow animate-rise">For the six-year journey</p>
        <h1 className="font-display mt-3 max-w-3xl text-5xl leading-[1.05] sm:text-7xl animate-rise">
          Medicine is a marathon. <span className="text-primary">Run it calmly.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground animate-rise">
          MedOS brings lectures, topics, revision, deadlines and part-time shifts into one quiet, private workspace.
        </p>
        <div className="mt-8 flex gap-3 animate-rise">
          <Button asChild size="lg">
            <Link to="/auth">Start your workspace</Link>
          </Button>
        </div>
        <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <div key={f.title} className="surface p-5 animate-rise" style={{ animationDelay: `${i * 70}ms` }}>
              <f.icon className="size-5 text-primary" />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary font-display text-lg text-primary-foreground">M</span>
      <span className="font-display text-xl">MedOS</span>
    </span>
  );
}
