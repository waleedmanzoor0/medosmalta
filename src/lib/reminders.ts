export const EVENT_LEAD_MIN = 30;
export const TASK_REMINDER_HOUR = 8; // Malta time, on the due day

/** Event needs a reminder when it starts within the next 30 minutes (and hasn't started). */
export function eventDueForReminder(startsAt: string, now: Date): boolean {
  const diff = new Date(startsAt).getTime() - now.getTime();
  return diff > 0 && diff <= EVENT_LEAD_MIN * 60_000;
}

/** Malta-local date (yyyy-MM-dd) and hour for a moment. */
export function maltaParts(now: Date): { date: string; hour: number } {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Malta", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" })
      .formatToParts(now)
      .map((x) => [x.type, x.value]),
  );
  return { date: `${p["year"]}-${p["month"]}-${p["day"]}`, hour: Number(p["hour"]) };
}

/** Task needs its morning reminder once it's 08:00+ in Malta on the due day. */
export function taskDueForReminder(dueDate: string | null, completed: boolean, now: Date): boolean {
  if (!dueDate || completed) return false;
  const { date, hour } = maltaParts(now);
  return dueDate === date && hour >= TASK_REMINDER_HOUR;
}
