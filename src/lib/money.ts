import type { MoneyTransaction } from "./data";

export const EXPENSE_CATEGORIES = ["Rent & bills", "Groceries", "Transport", "Study", "Health", "Leisure", "Other"] as const;
export const INCOME_CATEGORIES = ["Work", "Stipend", "Family support", "Other"] as const;
export const euro = (amount: number) => new Intl.NumberFormat("en-MT", { style: "currency", currency: "EUR" }).format(amount);
const cents = (amount: number) => Math.round(amount * 100);

export function moneySummary(rows: Pick<MoneyTransaction, "kind" | "amount" | "occurred_on" | "category">[], month: string) {
  const selected = rows.filter(r => r.occurred_on.startsWith(month));
  const income = selected.filter(r => r.kind === "income").reduce((s, r) => s + cents(r.amount), 0) / 100;
  const expenses = selected.filter(r => r.kind === "expense").reduce((s, r) => s + cents(r.amount), 0) / 100;
  const categories = [...new Set(selected.filter(r => r.kind === "expense").map(r => r.category))].map(category => ({ category, amount: selected.filter(r => r.kind === "expense" && r.category === category).reduce((s, r) => s + cents(r.amount), 0) / 100 })).sort((a, b) => b.amount - a.amount);
  return { income, expenses, balance: (cents(income) - cents(expenses)) / 100, categories };
}

export function budgetProgress(limit: number, spent: number) {
  return { remaining: (cents(limit) - cents(spent)) / 100, percent: limit > 0 ? Math.min(100, spent / limit * 100) : 0, over: spent > limit };
}