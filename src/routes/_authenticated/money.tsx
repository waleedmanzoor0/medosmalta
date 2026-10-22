import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { addMonths, format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader, EmptyState, selectCls } from "@/components/medos/ui";
import { MoneyEditor, type MoneyEditorState } from "@/components/medos/money-editor";
import { useRows, useRemove, type MoneyTransaction, type MoneyBudget, type SavingsGoal } from "@/lib/data";
import { budgetProgress, euro, moneySummary } from "@/lib/money";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/money")({
  head: () => ({ meta: [{ title: "Money Hub — MedOS" }, { name: "description", content: "Your income, expenses, monthly budgets and savings goals in euros." }, { property: "og:title", content: "Money Hub — MedOS" }, { property: "og:description", content: "Your income, expenses, monthly budgets and savings goals in euros." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: MoneyHub,
});

function MoneyHub() {
  const transactions = useRows<MoneyTransaction>("money_transactions");
  const budgets = useRows<MoneyBudget>("money_budgets");
  const goals = useRows<SavingsGoal>("savings_goals");
  const removeTransaction = useRemove("money_transactions"), removeBudget = useRemove("money_budgets"), removeGoal = useRemove("savings_goals");
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [editor, setEditor] = useState<MoneyEditorState | null>(null);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");
  const summary = moneySummary(transactions.data ?? [], month);
  const rows = (transactions.data ?? []).filter(r => r.occurred_on.startsWith(month) && (kind === "all" || r.kind === kind) && `${r.title} ${r.category}`.toLowerCase().includes(search.toLowerCase()));
  const monthBudgets = (budgets.data ?? []).filter(b => b.month.startsWith(month));
  const trend = Array.from({ length: 6 }, (_, i) => { const d = addMonths(new Date(`${month}-01T12:00`), i - 5); return { label: format(d, "MMM"), ...moneySummary(transactions.data ?? [], format(d, "yyyy-MM")) }; });
  const busy = transactions.isLoading || budgets.isLoading || goals.isLoading;
  const failed = transactions.isError || budgets.isError || goals.isError;
  function del(type: "transaction" | "budget" | "goal", id: string) { if (window.confirm(`Delete this ${type === "goal" ? "savings goal" : type}?`)) (type === "transaction" ? removeTransaction : type === "budget" ? removeBudget : removeGoal).mutate(id); }
  return <>
    <PageHeader eyebrow="Life in Malta" title="Money Hub" action={<Button onClick={() => setEditor({ type: "transaction" })}><Plus /> Add transaction</Button>} />
    <div className="mb-6 flex items-center gap-2">
      <Button variant="ghost" size="icon" aria-label="Previous month" onClick={() => setMonth(format(addMonths(new Date(`${month}-01T12:00`), -1), "yyyy-MM"))}><ChevronLeft /></Button>
      <Input aria-label="Selected month" type="month" className="w-44" value={month} onChange={e => { if (e.target.value) setMonth(e.target.value); }} />
      <Button variant="ghost" size="icon" aria-label="Next month" onClick={() => setMonth(format(addMonths(new Date(`${month}-01T12:00`), 1), "yyyy-MM"))}><ChevronRight /></Button>
    </div>
    {busy ? <p role="status">Loading your money records…</p> : failed ? <p role="alert" className="text-destructive">Your money records could not be loaded. Please refresh to try again.</p> : <>
      <div className="mb-8 grid grid-cols-1 gap-4 border-y py-5 sm:grid-cols-3">
        {[{ label: "Income", value: summary.income, cls: "text-primary" }, { label: "Expenses", value: summary.expenses, cls: "text-foreground" }, { label: "Net this month", value: summary.balance, cls: summary.balance < 0 ? "text-destructive" : "text-foreground" }].map(s => <div key={s.label}><p className="text-xs text-muted-foreground">{s.label}</p><p className={cn("mt-1 font-display text-3xl tabular-nums", s.cls)}>{euro(s.value)}</p></div>)}
      </div>
      <Tabs defaultValue="transactions"><TabsList className="mb-5"><TabsTrigger value="transactions">Transactions</TabsTrigger><TabsTrigger value="budgets">Budgets</TabsTrigger><TabsTrigger value="goals">Savings goals</TabsTrigger></TabsList>
        <TabsContent value="transactions">
          <div className="mb-4 flex flex-wrap gap-2"><Input aria-label="Search transactions" placeholder="Search transactions" value={search} onChange={e => setSearch(e.target.value)} className="sm:max-w-xs" /><select aria-label="Transaction type" className={cn(selectCls, "w-36")} value={kind} onChange={e => setKind(e.target.value)}><option value="all">All types</option><option value="income">Income</option><option value="expense">Expenses</option></select></div>
          {rows.length ? <div className="divide-y border-y">{rows.map(r => <div key={r.id} className="flex items-center gap-3 py-3">
            <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-md", r.kind === "income" ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground")}>{r.kind === "income" ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}</div>
            <div className="min-w-0 flex-1"><p className="break-words text-sm font-semibold">{r.title}</p><p className="text-xs text-muted-foreground">{r.category} · {format(new Date(`${r.occurred_on}T12:00`), "d MMM")}{r.is_sample ? " · Sample" : ""}</p></div>
            <span className={cn("text-sm font-semibold tabular-nums", r.kind === "income" && "text-primary")}>{r.kind === "income" ? "+" : "−"}{euro(r.amount)}</span>
            <div className="flex flex-col sm:flex-row"><Button size="icon" variant="ghost" aria-label={`Edit ${r.title}`} title="Edit transaction" onClick={() => setEditor({ type: "transaction", row: r })}><Pencil className="size-3.5" /></Button><Button size="icon" variant="ghost" aria-label={`Delete ${r.title}`} title="Delete transaction" onClick={() => del("transaction", r.id)}><Trash2 className="size-3.5" /></Button></div>
          </div>)}</div> : <EmptyState icon={Wallet} title="No transactions this month" action={<Button variant="outline" onClick={() => setEditor({ type: "transaction" })}><Plus /> Add transaction</Button>} />}
        </TabsContent>
        <TabsContent value="budgets"><div className="mb-4 flex justify-end"><Button variant="outline" onClick={() => setEditor({ type: "budget" })}><Plus /> Add budget</Button></div>
          {monthBudgets.length ? <div className="grid gap-4 sm:grid-cols-2">{monthBudgets.map(b => { const spent = summary.categories.find(c => c.category === b.category)?.amount ?? 0; const p = budgetProgress(b.amount, spent); return <article key={b.id} className="rounded-lg border bg-card p-4"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">{b.category}</h2><div><Button variant="ghost" size="icon" aria-label={`Edit ${b.category} budget`} onClick={() => setEditor({ type: "budget", row: b })}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" aria-label={`Delete ${b.category} budget`} onClick={() => del("budget", b.id)}><Trash2 className="size-4" /></Button></div></div><p className="my-2 text-sm">{euro(spent)} <span className="text-muted-foreground">/ {euro(b.amount)}</span></p><progress max={100} value={p.percent} className={cn("money-meter", p.over && "money-meter-over")} /><p className={cn("mt-2 text-xs", p.over ? "text-destructive" : "text-muted-foreground")}>{euro(Math.abs(p.remaining))} {p.over ? "over budget" : "remaining"}</p></article>; })}</div> : <EmptyState icon={Wallet} title="No budgets for this month" />}
        </TabsContent>
        <TabsContent value="goals"><div className="mb-4 flex justify-end"><Button variant="outline" onClick={() => setEditor({ type: "goal" })}><Plus /> Add savings goal</Button></div>
          {(goals.data ?? []).length ? <div className="grid gap-4 sm:grid-cols-2">{goals.data?.map(g => <article key={g.id} className="rounded-lg border bg-card p-4"><div className="flex items-center justify-between gap-2"><h2 className="min-w-0 break-words font-semibold">{g.title}</h2><div className="flex shrink-0"><Button variant="ghost" size="icon" aria-label={`Edit ${g.title}`} onClick={() => setEditor({ type: "goal", row: g })}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" aria-label={`Delete ${g.title}`} onClick={() => del("goal", g.id)}><Trash2 className="size-4" /></Button></div></div><p className="my-3 font-display text-2xl">{euro(g.saved_amount)} <span className="text-sm text-muted-foreground">/ {euro(g.target_amount)}</span></p><progress className="money-meter" max={g.target_amount} value={Math.min(g.target_amount, g.saved_amount)} /><p className="mt-2 text-xs text-muted-foreground">{g.saved_amount >= g.target_amount ? "Goal reached" : `${euro(g.target_amount - g.saved_amount)} to go`}{g.target_date ? ` · ${format(new Date(`${g.target_date}T12:00`), "d MMM yyyy")}` : ""}</p></article>)}</div> : <EmptyState icon={Wallet} title="No savings goals yet" />}
        </TabsContent>
      </Tabs>
      <section className="mt-8 grid gap-8 border-t pt-6 lg:grid-cols-2"><div><h2 className="mb-4 text-sm font-semibold">Six-month cash flow</h2><div className="mb-2 flex gap-4 text-xs text-muted-foreground"><span>Income</span><span>Expenses</span></div><div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={trend}><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} /><Tooltip formatter={v => euro(Number(v))} /><Bar dataKey="income" name="Income" fill="var(--primary)" radius={[4, 4, 0, 0]} /><Bar dataKey="expenses" name="Expenses" fill="var(--chart-3)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div><div><h2 className="mb-4 text-sm font-semibold">Spending by category</h2>{summary.categories.length ? <ul className="stagger divide-y">{summary.categories.map(c => <li key={c.category} className="flex justify-between gap-4 py-3 text-sm"><span>{c.category}</span><span className="tabular-nums">{euro(c.amount)}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">No expenses recorded this month.</p>}</div></section>
    </>}
    {editor && <MoneyEditor state={editor} month={month} close={() => setEditor(null)} />}
  </>;
}