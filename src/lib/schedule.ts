// Pure scheduling helpers: conflict detection, slot finding, recurrence.
export type TimedItem = { id: string; starts_at: string; ends_at: string };

export function overlaps(a: TimedItem, b: TimedItem) {
  return new Date(a.starts_at) < new Date(b.ends_at) && new Date(b.starts_at) < new Date(a.ends_at);
}

/** Returns ids of every event that overlaps another. */
export function findConflicts(items: TimedItem[]): Set<string> {
  const sorted = [...items].sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));
  const out = new Set<string>();
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      if (new Date(sorted[j].starts_at) >= new Date(sorted[i].ends_at)) break;
      out.add(sorted[i].id);
      out.add(sorted[j].id);
    }
  }
  return out;
}

/**
 * Finds the earliest free slot of the same length as `item`, starting at its current
 * start, within day hours [dayStart, dayEnd), searching up to `days` days ahead.
 * Steps in 15-minute increments.
 */
export function findNextFreeSlot(
  item: TimedItem,
  others: TimedItem[],
  opts: { dayStart?: number; dayEnd?: number; days?: number } = {},
): { starts_at: string; ends_at: string } | null {
  const { dayStart = 8, dayEnd = 22, days = 7 } = opts;
  const len = +new Date(item.ends_at) - +new Date(item.starts_at);
  const blockers = others.filter((o) => o.id !== item.id);
  const step = 15 * 60 * 1000;
  let cursor = new Date(item.starts_at);
  const limit = new Date(cursor);
  limit.setDate(limit.getDate() + days);
  while (cursor < limit) {
    const h = cursor.getHours() + cursor.getMinutes() / 60;
    const endCandidate = new Date(+cursor + len);
    const endH =
      endCandidate.getHours() + endCandidate.getMinutes() / 60 + (endCandidate.getDate() !== cursor.getDate() ? 24 : 0);
    if (h < dayStart) {
      cursor.setHours(dayStart, 0, 0, 0);
      continue;
    }
    if (endH > dayEnd) {
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(dayStart, 0, 0, 0);
      continue;
    }
    const cand = { id: item.id, starts_at: cursor.toISOString(), ends_at: endCandidate.toISOString() };
    if (!blockers.some((b) => overlaps(cand, b))) return { starts_at: cand.starts_at, ends_at: cand.ends_at };
    cursor = new Date(+cursor + step);
  }
  return null;
}

/** Next due date (YYYY-MM-DD) for a recurring task. */
export function nextDueDate(due: string | null, recurrence: string, today = new Date()): string | null {
  if (recurrence === "none") return null;
  const base = due ? new Date(due + "T12:00:00") : new Date(today);
  if (recurrence === "daily") base.setDate(base.getDate() + 1);
  else if (recurrence === "weekly") base.setDate(base.getDate() + 7);
  else if (recurrence === "monthly") base.setMonth(base.getMonth() + 1);
  else return null;
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, "0");
  const d = String(base.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function hoursBetween(a: string, b: string) {
  return (+new Date(b) - +new Date(a)) / 3_600_000;
}
