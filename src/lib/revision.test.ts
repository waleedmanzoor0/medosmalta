import { describe, expect, it } from "vitest";
import { isDue, questionOptions, quizScore, scheduleReview } from "./revision";

describe("revision", () => {
  const now = new Date("2026-10-22T12:00:00Z");
  const fresh = { interval_days: 0, repetitions: 0, ease_factor: 2.5 };
  it("uses the SuperMemo first and second successful intervals", () => {
    const first = scheduleReview(fresh, "good", now);
    expect(first.interval_days).toBe(1);
    expect(first.due_at).toBe("2026-10-23T12:00:00.000Z");
    expect(scheduleReview(first, "good", now).interval_days).toBe(6);
  });
  it("resets repetitions after a forgotten answer", () => {
    const next = scheduleReview({ interval_days: 15, repetitions: 3, ease_factor: 2.5 }, "again", now);
    expect(next.repetitions).toBe(0);
    expect(next.interval_days).toBe(1);
  });
  it("includes cards at the due boundary but not future cards", () => {
    expect(isDue(now.toISOString(), now)).toBe(true);
    expect(isDue("2026-10-22T12:00:01Z", now)).toBe(false);
  });
  it("scores actual selected answers", () => {
    expect(quizScore([{ selected: 0, correct: 0 }, { selected: 2, correct: 1 }])).toEqual({ correct_count: 1, total_count: 2 });
  });
  it("rejects malformed or empty question options", () => {
    expect(questionOptions(["A", "B", "C", "D"])).toHaveLength(4);
    expect(questionOptions(["A", "B", "", "D"])).toEqual([]);
    expect(questionOptions(["A", "B"])).toEqual([]);
  });
});