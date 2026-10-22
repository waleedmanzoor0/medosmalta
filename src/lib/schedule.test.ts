import { describe, expect, it } from "vitest";
import { findConflicts, findNextFreeSlot, nextDueDate } from "./schedule";

const ev = (id: string, s: string, e: string) => ({
  id,
  starts_at: new Date(`2026-10-20T${s}:00`).toISOString(),
  ends_at: new Date(`2026-10-20T${e}:00`).toISOString(),
});

describe("findConflicts", () => {
  it("flags overlapping events", () => {
    const c = findConflicts([ev("a", "09:00", "11:00"), ev("b", "10:30", "12:00"), ev("c", "13:00", "14:00")]);
    expect([...c].sort()).toEqual(["a", "b"]);
  });
  it("back-to-back events are not conflicts", () => {
    expect(findConflicts([ev("a", "09:00", "10:00"), ev("b", "10:00", "11:00")]).size).toBe(0);
  });
});

describe("findNextFreeSlot", () => {
  it("moves a study session to the first gap after a work shift", () => {
    const study = ev("s", "10:00", "11:00");
    const slot = findNextFreeSlot(study, [study, ev("w", "09:00", "13:00")]);
    expect(new Date(slot!.starts_at).getHours()).toBe(13);
    expect(new Date(slot!.ends_at).getHours()).toBe(14);
  });
});

describe("nextDueDate", () => {
  it("weekly adds 7 days", () => expect(nextDueDate("2026-10-22", "weekly")).toBe("2026-10-29"));
  it("monthly adds a month", () => expect(nextDueDate("2026-10-22", "monthly")).toBe("2026-11-22"));
  it("none returns null", () => expect(nextDueDate("2026-10-22", "none")).toBeNull());
});
