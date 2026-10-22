import { useState, type FormEvent } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, selectCls } from "./ui";
import { useSave, type MoneyTransaction, type MoneyBudget, type SavingsGoal } from "@/lib/data";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/money";

export type MoneyEditorState = { type: "transaction"; row?: MoneyTransaction } | { type: "budget"; row?: MoneyBudget } | { type: "goal"; row?: SavingsGoal };

export function MoneyEditor({ state, month, close }: { state: MoneyEditorState; month: string; close: () => void }) {
  const table = state.type === "transaction" ? "money_transactions" : state.type === "budget" ? "money_budgets" : "savings_goals";
  const save = useSave(table);
  const [kind, setKind] = useState(state.type === "transaction" ? state.row?.kind ?? "expense" : "expense");
  const row = state.row;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const text = (k: string) => String(f.get(k) ?? "").trim();
    const values = state.type === "transaction" ? { title: text("title"), kind, category: text("category"), amount: Number(f.get("amount")), occurred_on: text("date"), notes: text("notes") || null }
      : state.type === "budget" ? { category: text("category"), month: `${text("month")}-01`, amount: Number(f.get("amount")) }
      : { title: text("title"), target_amount: Number(f.get("target")), saved_amount: Number(f.get("saved")), target_date: text("date") || null };
    try { await save.mutateAsync({ ...values, ...(row ? { id: row.id } : {}) }); close(); } catch { /* hook reports errors */ }
  }
  return <Dialog open onOpenChange={open => { if (!open) close(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto" aria-describedby={undefined}>
    <DialogHeader><DialogTitle>{row ? "Edit" : "New"} {state.type === "goal" ? "savings goal" : state.type}</DialogTitle></DialogHeader>
    <form onSubmit={submit} className="grid gap-4">
      {state.type !== "budget" && <Field label="Title"><Input name="title" required maxLength={120} defaultValue={state.row?.title ?? ""} /></Field>}
      {state.type === "transaction" && <Field label="Type"><select className={selectCls} value={kind} onChange={e => setKind(e.target.value)}><option value="expense">Expense</option><option value="income">Income</option></select></Field>}
      {state.type !== "goal" && <Field label="Category"><select key={kind} name="category" className={selectCls} defaultValue={state.row?.category ?? undefined}>{(kind === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => <option key={c}>{c}</option>)}</select></Field>}
      {state.type !== "goal" ? <Field label="Amount (€)"><Input name="amount" type="number" min="0.01" max="9999999999.99" step="0.01" required defaultValue={state.row?.amount} /></Field> : <>
        <Field label="Target amount (€)"><Input name="target" type="number" min="0.01" max="9999999999.99" step="0.01" required defaultValue={state.row?.target_amount} /></Field>
        <Field label="Saved so far (€)"><Input name="saved" type="number" min="0" max="9999999999.99" step="0.01" required defaultValue={state.row?.saved_amount ?? 0} /></Field>
      </>}
      {state.type === "budget" ? <Field label="Month"><Input name="month" type="month" required defaultValue={state.row?.month.slice(0, 7) ?? month} /></Field> : <Field label={state.type === "goal" ? "Target date (optional)" : "Date"}><Input name="date" type="date" required={state.type === "transaction"} defaultValue={state.type === "transaction" ? state.row?.occurred_on ?? format(new Date(), "yyyy-MM-dd") : state.row?.target_date ?? ""} /></Field>}
      {state.type === "transaction" && <Field label="Notes (optional)"><Input name="notes" maxLength={1000} defaultValue={state.row?.notes ?? ""} /></Field>}
      <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving…" : "Save"}</Button>
    </form>
  </DialogContent></Dialog>;
}