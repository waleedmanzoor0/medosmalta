import { describe, expect, it } from "vitest";
import { dailySchedule, scheduledHours, weightedAccuracy } from "./analytics";

describe("Progress Analytics", () => {
  const events = [
    { kind: "study", starts_at: "2026-10-21T23:00:00", ends_at: "2026-10-22T01:00:00" },
    { kind: "work", starts_at: "2026-10-22T09:00:00", ends_at: "2026-10-22T17:00:00" },
  ];
  it("splits scheduled study across midnight without including work", () => {
    expect(dailySchedule(events, new Date("2026-10-21T00:00:00"), 2).map(d => d.hours)).toEqual([1, 1]);
  });
  it("clips scheduled hours to the selected interval", () => {
    expect(scheduledHours(events, new Date("2026-10-22T00:30:00"), new Date("2026-10-23T00:00:00"))).toBe(0.5);
  });
  it("weights quiz scores by questions, not attempt averages", () => {
    expect(weightedAccuracy([{ correct_count: 1, total_count: 1 }, { correct_count: 0, total_count: 9 }])).toBe(10);
    expect(weightedAccuracy([])).toBeNull();
  });
});