// Schedule helpers — "is this task due today?" and "was it completed today?"
// in the user's timezone. Used by both the Tasks screen filter and the
// nightly cron's missed-tick check.

import type { Task } from "@/data/types";

// Convert a UTC ISO string to a Date as if read in `tz`. Browsers / RN both
// support Intl.DateTimeFormat with timeZone in 2026.
function toLocal(date: Date, tz: string): { y: number; m: number; d: number; weekdayIso: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const y = Number(get("year"));
  const m = Number(get("month"));
  const d = Number(get("day"));
  const weekday = get("weekday");
  // Mon=1..Sun=7 (ISO). en-US short returns Mon/Tue/Wed/Thu/Fri/Sat/Sun.
  const map: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return { y, m, d, weekdayIso: map[weekday] ?? 1 };
}

export function isCompletedToday(task: Task, tz: string, now: Date = new Date()): boolean {
  if (!task.lastCompletedAt) return false;
  const last = toLocal(new Date(task.lastCompletedAt), tz);
  const today = toLocal(now, tz);
  return last.y === today.y && last.m === today.m && last.d === today.d;
}

export function isDueToday(task: Task, tz: string, now: Date = new Date()): boolean {
  const today = toLocal(now, tz);
  switch (task.freq) {
    case "daily":
      return true;
    case "dow":
      return task.dows.includes(today.weekdayIso);
    case "weekly":
      // For weekly, "due" is whether it hasn't been completed in the last 7 days.
      if (!task.lastCompletedAt) return true;
      return Date.now() - new Date(task.lastCompletedAt).getTime() >= 7 * 86400 * 1000;
    case "monthly":
      if (!task.lastCompletedAt) return true;
      return Date.now() - new Date(task.lastCompletedAt).getTime() >= 30 * 86400 * 1000;
  }
}
