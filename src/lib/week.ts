/**
 * Chore weeks. The rotation officially started on Thursday 1 October 2026, and
 * every chore week runs Thursday to Wednesday from there.
 *
 * Week boundaries are computed on the flat's calendar (Europe/Berlin), not the
 * server's: Vercel runs in UTC and a laptop in Berlin time, and deriving weeks
 * from local time once made the same week get stored twice (22:00Z vs 00:00Z).
 * A week start is stored as UTC midnight of its Berlin calendar date — the same
 * convention `<input type="date">` values (e.g. calendar blocks) arrive in, so
 * the two compare directly.
 */

const FLAT_TIMEZONE = "Europe/Berlin";
const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

/** Thursday 1 Oct 2026: week 1 of the rotation. */
export const ROTATION_START = new Date(Date.UTC(2026, 9, 1));

const berlinDateParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: FLAT_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const shortDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
});

/** The flat's calendar day containing `date`, as UTC midnight. */
function flatDay(date: Date): number {
  const [y, m, d] = berlinDateParts.format(date).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Weeks since the rotation started (0 = week 1; negative before launch). */
export function rotationIndex(date: Date) {
  return Math.floor((flatDay(date) - ROTATION_START.getTime()) / WEEK_MS);
}

/** Start (Thursday) of the chore week containing `date`. */
export function currentWeekStart(date = new Date()) {
  return new Date(ROTATION_START.getTime() + rotationIndex(date) * WEEK_MS);
}

/** Last day (Wednesday) of the chore week starting `weekStart`. */
export function weekEnd(weekStart: Date) {
  return new Date(weekStart.getTime() + 6 * DAY_MS);
}

/**
 * Who does task `taskOrder` in rotation week `rot`. Shared by the live week and
 * the next-week preview so the two can never disagree. Wraps negative indexes
 * too (JS `%` keeps the sign), which a pre-launch date would otherwise produce.
 */
export function rotationAssignee<T>(pool: T[], rot: number, taskOrder: number): T {
  const n = pool.length;
  return pool[(((rot + taskOrder) % n) + n) % n];
}

export function weekLabel(weekStart: Date) {
  const week = rotationIndex(weekStart) + 1;
  return `Week ${week} · ${shortDate.format(weekStart)} – ${shortDate.format(weekEnd(weekStart))}`;
}
