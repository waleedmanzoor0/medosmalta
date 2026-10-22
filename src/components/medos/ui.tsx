import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({ eyebrow, title, action, children }: { eyebrow?: string; title: string; action?: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-rise">
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="font-display text-3xl sm:text-4xl">{title}</h1>
        {children && <p className="mt-1 max-w-xl text-sm text-muted-foreground">{children}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </header>
  );
}

export function Panel({ title, action, className, children }: { title?: string; action?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={cn("surface p-5 animate-rise", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary-soft text-accent-foreground">
        <Icon className="size-5" />
      </div>
      <p className="font-medium">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export const KIND_META = {
  lecture: { label: "Lecture", dot: "bg-kind-lecture", bar: "border-l-kind-lecture" },
  study: { label: "Study", dot: "bg-kind-study", bar: "border-l-kind-study" },
  work: { label: "Work shift", dot: "bg-kind-work", bar: "border-l-kind-work" },
  appointment: { label: "Appointment", dot: "bg-kind-appointment", bar: "border-l-kind-appointment" },
  rest: { label: "Rest", dot: "bg-kind-rest", bar: "border-l-kind-rest" },
} as const;
export type Kind = keyof typeof KIND_META;

export const STATUS_META = {
  not_started: { label: "Not started", cls: "bg-muted text-muted-foreground" },
  learning: { label: "Learning", cls: "bg-secondary text-secondary-foreground ring-1 ring-border" },
  needs_revision: { label: "Needs revision", cls: "bg-warning-soft text-warning" },
  mastered: { label: "Mastered", cls: "bg-primary-soft text-accent-foreground" },
} as const;
export type Status = keyof typeof STATUS_META;

export function StatusPill({ status }: { status: string }) {
  const m = STATUS_META[status as Status] ?? STATUS_META.not_started;
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold", m.cls)}>{m.label}</span>;
}

export const PRIORITY_CLS: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning-soft text-warning",
  low: "bg-muted text-muted-foreground",
};

export function Field({ label, error, children, hint }: { label: string; error?: string | undefined; hint?: string | undefined; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-muted-foreground">{hint}</span>}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  );
}

export const selectCls =
  "h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
