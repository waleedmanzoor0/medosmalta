import { addDays, format, startOfDay } from "date-fns";
import type { CalEvent, QuizAttempt } from "./data";

// Clip each block to the requested interval; crossing-midnight blocks are split by day.
export function scheduledHours(events: Pick<CalEvent, "kind" | "starts_at" | "ends_at">[], start: Date, end: Date) {
  return events.filter(e => e.kind === "study").reduce((sum, e) => {
    const a = Math.max(new Date(e.starts_at).getTime(), start.getTime());
    const b = Math.min(new Date(e.ends_at).getTime(), end.getTime());
    return sum + Math.max(0, b - a) / 3600000;
  }, 0);
}

export function dailySchedule(events: Pick<CalEvent, "kind" | "starts_at" | "ends_at">[], start: Date, days: number) {
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(startOfDay(start), i);
    return { date: format(day, "yyyy-MM-dd"), label: format(day, "d MMM"), hours: scheduledHours(events, day, addDays(day, 1)) };
  });
}

export function weightedAccuracy(attempts: Pick<QuizAttempt, "correct_count" | "total_count">[]) {
  const total = attempts.reduce((sum, a) => sum + a.total_count, 0);
  return total ? attempts.reduce((sum, a) => sum + a.correct_count, 0) / total * 100 : null;
}