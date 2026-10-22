import { describe, expect, it } from "vitest";
import { budgetProgress, euro, moneySummary } from "./money";

describe("Money Hub", () => {
  it("separates monthly income and expenses with exact cent totals", () => {
    const result = moneySummary([
      { kind: "income", amount: 100, occurred_on: "2026-10-01", category: "Work" },
      { kind: "expense", amount: 0.1, occurred_on: "2026-10-02", category: "Study" },
      { kind: "expense", amount: 0.2, occurred_on: "2026-10-03", category: "Study" },
      { kind: "expense", amount: 90, occurred_on: "2026-09-03", category: "Study" },
    ], "2026-10");
    expect(result).toEqual({ income: 100, expenses: 0.3, balance: 99.7, categories: [{ category: "Study", amount: 0.3 }] });
  });
  it("keeps overspending visible and caps the progress meter", () => {
    expect(budgetProgress(100, 125)).toEqual({ remaining: -25, percent: 100, over: true });
  });
  it("uses euros", () => expect(euro(12.5)).toBe("€12.50"));
});