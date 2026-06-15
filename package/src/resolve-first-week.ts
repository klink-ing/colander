import type { Temporal } from "@js-temporal/polyfill";
import type { TemporalNamespace, WeekStartDay } from "./types";

/**
 * A flexible specifier for a calendar week. Accepts a `Temporal.PlainDate`,
 * a native `Date`, an ISO week number, a week-of-year, or a month/day pair.
 */
export type FirstWeekSpec =
  | Temporal.PlainDate
  | Date
  | { isoWeek: number; isoYear: number }
  | { week: number; year: number }
  | { month: number; year: number; day?: number };

/** Controls how a scroll target week is positioned within the visible window. */
export type ScrollToWeekSnap = "start" | "center" | "end" | "nearest";

/** Snaps `date` back to the start of its containing week (determined by `weekStartDay`). */
function snapToWeekStart(
  date: Temporal.PlainDate,
  weekStartDay: WeekStartDay,
): Temporal.PlainDate {
  const dow = date.dayOfWeek % 7; // 0=Sun..6=Sat
  const offset = (dow - weekStartDay + 7) % 7;
  return date.subtract({ days: offset });
}

/**
 * Resolves any {@link FirstWeekSpec} variant to the `PlainDate` of the
 * containing week's start (snapped to `weekStartDay`).
 *
 * @param spec - The week specifier to resolve.
 * @param weekStartDay - Day the calendar week starts on (`0` = Sunday).
 * @param T - Temporal namespace.
 * @param timeZone - IANA time zone for native `Date` conversion. Defaults to system time zone.
 */
export function resolveFirstWeekSpec(
  spec: FirstWeekSpec,
  weekStartDay: WeekStartDay,
  T: TemporalNamespace,
  timeZone?: string,
): Temporal.PlainDate {
  // 1. Temporal.PlainDate — identified by its `calendarId` (modern Temporal
  //    and @js-temporal/polyfill 0.5+ expose `calendarId`, not `calendar`).
  //    Convert non-ISO calendars to ISO so the rest of the pipeline — which
  //    is ISO-only — stays consistent; the week snap itself is
  //    calendar-independent.
  if ("calendarId" in spec) {
    const pd = spec as Temporal.PlainDate;
    const iso = pd.calendarId === "iso8601" ? pd : pd.withCalendar("iso8601");
    return snapToWeekStart(iso, weekStartDay);
  }

  // 2. Native Date
  if (spec instanceof Date) {
    const tz = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    const parts = fmt.formatToParts(spec);
    const get = (type: string) =>
      Number(parts.find((p) => p.type === type)?.value ?? 0);
    const plain = T.PlainDate.from({
      year: get("year"),
      month: get("month"),
      day: get("day"),
    });
    return snapToWeekStart(plain, weekStartDay);
  }

  // 3. ISO week spec
  if ("isoWeek" in spec) {
    const { isoWeek, isoYear } = spec;
    // Jan 4 is always in ISO week 1. Find the Monday of that week.
    const jan4 = T.PlainDate.from({ year: isoYear, month: 1, day: 4 });
    const jan4dow = jan4.dayOfWeek; // ISO: 1=Mon..7=Sun
    const isoWeek1Monday = jan4.subtract({ days: jan4dow - 1 });
    const targetMonday = isoWeek1Monday.add({ weeks: isoWeek - 1 });
    return snapToWeekStart(targetMonday, weekStartDay);
  }

  // 4. Week-of-year spec (relative to weekStartDay)
  if ("week" in spec && !("month" in spec)) {
    const { week, year } = spec as { week: number; year: number };
    // Find the first occurrence of weekStartDay in the year
    const jan1 = T.PlainDate.from({ year, month: 1, day: 1 });
    const jan1dow = jan1.dayOfWeek % 7; // 0=Sun..6=Sat
    const daysUntilStart = (weekStartDay - jan1dow + 7) % 7;
    const firstWeekStart = jan1.add({ days: daysUntilStart });
    return firstWeekStart.add({ weeks: week - 1 });
  }

  // 5. Month+year (with optional day)
  const { month, year, day } = spec as {
    month: number;
    year: number;
    day?: number;
  };
  const targetDay = day ?? 1;
  const plain = T.PlainDate.from({ year, month, day: targetDay });
  return snapToWeekStart(plain, weekStartDay);
}

/**
 * Computes a new `firstWeek` date given a scroll target and snap mode.
 *
 * The `weekStartDay` is inferred from `currentFirstWeek` (its day of week).
 *
 * @param currentFirstWeek - The current first visible week (a week-start date).
 * @param weekCount - Number of visible week rows.
 * @param target - The week-start date to scroll to.
 * @param options - Optional snap mode (default `"start"`).
 */
export function resolveFirstWeek(
  currentFirstWeek: Temporal.PlainDate,
  weekCount: number,
  target: Temporal.PlainDate,
  options?: { snap?: ScrollToWeekSnap },
): Temporal.PlainDate {
  const snap = options?.snap ?? "start";

  switch (snap) {
    case "start":
      return target;

    case "center":
      return target.subtract({ weeks: Math.floor(weekCount / 2) });

    case "end":
      return target.subtract({ weeks: weekCount - 1 });

    case "nearest": {
      const lastWeek = currentFirstWeek.add({ weeks: weekCount - 1 });
      const cmp = (a: Temporal.PlainDate, b: Temporal.PlainDate): number => {
        if (a.year !== b.year) return a.year - b.year;
        if (a.month !== b.month) return a.month - b.month;
        return a.day - b.day;
      };

      if (cmp(target, currentFirstWeek) < 0) {
        // Target is above (before) the window — snap to start
        return target;
      }
      if (cmp(target, lastWeek) > 0) {
        // Target is below (after) the window — snap to end
        return target.subtract({ weeks: weekCount - 1 });
      }
      // Already visible — no change
      return currentFirstWeek;
    }
  }
}
