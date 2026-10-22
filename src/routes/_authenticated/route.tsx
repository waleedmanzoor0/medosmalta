import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, CalendarRange, CheckSquare, Layers, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Logo } from "../index";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { redirect: location.href } });
    return { user: data.user };
  },
  component: AppShell,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", short: "Today", icon: LayoutDashboard },
  { to: "/study", label: "Study Hub", short: "Study", icon: BookOpen },
  { to: "/revision", label: "Revision Centre", short: "Revise", icon: Layers },
  { to: "/planner", label: "Smart Planner", short: "Planner", icon: CalendarRange },
  { to: "/tasks", label: "Tasks", short: "Tasks", icon: CheckSquare },
  { to: "/settings", label: "Settings & data", short: "More", icon: Settings },
] as const;

function AppShell() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data } = useProfile();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-sidebar px-4 py-6 lg:flex">
        <div className="px-2"><Logo /></div>
        <nav className="mt-10 grid gap-1">
          {NAV.map((n) => {
            const active = path.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors", active ? "bg-card text-foreground shadow-soft" : "text-sidebar-foreground hover:bg-sidebar-accent")}>
                <n.icon className={cn("size-4", active && "text-primary")} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-xl border bg-card p-3">
          <p className="truncate text-sm font-semibold">{data?.profile?.display_name || "Student"}</p>
          <p className="truncate text-xs text-muted-foreground">@{data?.email.split("@")[0]}</p>
          <button onClick={signOut} className="mt-3 flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground">
            <LogOut className="size-3.5" /> Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between px-5 pt-5 lg:hidden">
          <Logo />
        </div>
        <main className="mx-auto max-w-6xl px-5 pb-28 pt-6 lg:px-10 lg:pb-12 lg:pt-10">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-6 rounded-2xl border bg-card/95 p-1.5 shadow-lift backdrop-blur lg:hidden">
        {NAV.map((n) => {
          const active = path.startsWith(n.to);
          return (
            <Link key={n.to} to={n.to} className={cn("flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-semibold", active ? "bg-primary-soft text-accent-foreground" : "text-muted-foreground")}>
              <n.icon className="size-5" />
              {n.short}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
