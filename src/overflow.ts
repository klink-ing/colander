import type { Temporal } from "@js-temporal/polyfill";
import type { TemporalNamespace, WeekStartDay } from "./types";

export type OverflowBehavior =
  | "unbounded"
  | "stop"
  | "stop-shrink"
  | "snap"
  | "snap-shrink";

export type MonthOverflowBehavior = "unbounded" | "stop";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Returns true if any day in the 7-day span starting at weekStart falls within [min, max]. */
function weekHasValidDay(
  weekStart: Temporal.PlainDate,
  min: Temporal.PlainDate,
  max: Temporal.PlainDate,
  T: TemporalNamespace,
): boolean {
  // Week spans [weekStart, weekStart+6]. Overlaps with [min, max] iff
  // weekStart <= max AND weekStart+6 >= min.
  const weekEnd = weekStart.add({ days: 6 });
  return T.PlainDate.compare(weekStart, max) <= 0 && T.PlainDate.compare(weekEnd, min) >= 0;
}

/**
 * Returns the start of the week (per weekStartDay) that contains the given date.
 * Uses dayOfWeek % 7 → Sun=0…Sat=6 convention.
 */
function weekStartContaining(
  date: Temporal.PlainDate,
  weekStartDay: WeekStartDay,
  T: TemporalNamespace,
): Temporal.PlainDate {
  const dow = date.dayOfWeek % 7; // Sun=0…Sat=6
  const daysFromStart = (dow - weekStartDay + 7) % 7;
  return date.subtract({ days: daysFromStart });
}

/** Find the week start (per weekStartDay) whose 7-day span contains min. */
function findFirstValidWeekStart(
  min: Temporal.PlainDate,
  weekStartDay: WeekStartDay,
  T: TemporalNamespace,
): Temporal.PlainDate {
  return weekStartContaining(min, weekStartDay, T);
}

/** Find the week start (per weekStartDay) whose 7-day span contains max. */
function findLastValidWeekStart(
  max: Temporal.PlainDate,
  weekStartDay: WeekStartDay,
  T: TemporalNamespace,
): Temporal.PlainDate {
  return weekStartContaining(max, weekStartDay, T);
}

/**
 * Trim leading and trailing fully-disabled weeks from a window.
 * Returns new { firstWeek, weekCount }.
 */
function shrinkWindow(
  firstWeek: Temporal.PlainDate,
  weekCount: number,
  min: Temporal.PlainDate,
  max: Temporal.PlainDate,
  T: TemporalNamespace,
): { firstWeek: Temporal.PlainDate; weekCount: number } {
  let start = 0;
  let end = weekCount - 1;

  // Trim leading disabled weeks
  while (start <= end) {
    const ws = firstWeek.add({ days: start * 7 });
    if (weekHasValidDay(ws, min, max, T)) break;
    start++;
  }

  // Trim trailing disabled weeks
  while (end >= start) {
    const ws = firstWeek.add({ days: end * 7 });
    if (weekHasValidDay(ws, min, max, T)) break;
    end--;
  }

  if (start > end) {
    // No valid weeks at all — return as-is (degenerate case)
    return { firstWeek, weekCount };
  }

  return {
    firstWeek: firstWeek.add({ days: start * 7 }),
    weekCount: end - start + 1,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ApplyOverflowInput {
  targetFirstWeek: Temporal.PlainDate;
  weekCount: number;
  behavior: OverflowBehavior;
  min?: Temporal.PlainDate;
  max?: Temporal.PlainDate;
  weekStartDay: WeekStartDay;
  T: TemporalNamespace;
}

/**
 * Given a target firstWeek and weekCount, apply overflow behavior and return
 * the adjusted { firstWeek, weekCount }.
 */
export function applyOverflow({
  targetFirstWeek,
  weekCount,
  behavior,
  min,
  max,
  weekStartDay,
  T,
}: ApplyOverflowInput): { firstWeek: Temporal.PlainDate; weekCount: number } {
  // Without bounds, all modes behave as unbounded
  if (!min || !max || behavior === "unbounded") {
    return { firstWeek: targetFirstWeek, weekCount };
  }

  if (behavior === "stop") {
    // Caller checks canShift; here just return the target as-is
    return { firstWeek: targetFirstWeek, weekCount };
  }

  if (behavior === "stop-shrink") {
    return shrinkWindow(targetFirstWeek, weekCount, min, max, T);
  }

  if (behavior === "snap" || behavior === "snap-shrink") {
    // Compute the snapped position: window ends at lastValidWeekStart
    const lastValid = findLastValidWeekStart(max, weekStartDay, T);

    // The snapped firstWeek positions the window so it ends at lastValid
    // i.e. firstWeek = lastValid - (weekCount - 1) * 7
    const snappedFirst = lastValid.subtract({ days: (weekCount - 1) * 7 });

    // Determine which firstWeek to use: if target is already within bounds
    // (doesn't overshoot max), use the target; otherwise snap.
    // "Overshoots max" means the target window extends past the last valid week.
    // The last week of the target window is targetFirstWeek + (weekCount-1)*7.
    const targetLastWeek = targetFirstWeek.add({ days: (weekCount - 1) * 7 });

    let resolvedFirst: Temporal.PlainDate;
    if (T.PlainDate.compare(targetLastWeek, lastValid) <= 0) {
      // Target window fits within max — also check if it goes before min
      const firstValid = findFirstValidWeekStart(min, weekStartDay, T);
      if (T.PlainDate.compare(targetFirstWeek, firstValid) >= 0) {
        resolvedFirst = targetFirstWeek;
      } else {
        // Overshoots min: snap forward so window starts at firstValid
        resolvedFirst = firstValid;
      }
    } else {
      // Overshoots max: snap back
      resolvedFirst = snappedFirst;
    }

    if (behavior === "snap-shrink") {
      return shrinkWindow(resolvedFirst, weekCount, min, max, T);
    }
    return { firstWeek: resolvedFirst, weekCount };
  }

  return { firstWeek: targetFirstWeek, weekCount };
}

export interface CanShiftInput {
  currentFirstWeek: Temporal.PlainDate;
  weekCount: number;
  direction: 1 | -1;
  shiftBy?: number;
  behavior: OverflowBehavior;
  min?: Temporal.PlainDate;
  max?: Temporal.PlainDate;
  weekStartDay: WeekStartDay;
  T: TemporalNamespace;
}

/**
 * Returns whether the navigation button for the given direction should be enabled.
 */
export function canShift({
  currentFirstWeek,
  weekCount,
  direction,
  shiftBy,
  behavior,
  min,
  max,
  weekStartDay,
  T,
}: CanShiftInput): boolean {
  if (behavior === "unbounded" || !min || !max) {
    return true;
  }

  const shift = shiftBy ?? weekCount;
  const targetFirstWeek = currentFirstWeek.add({ days: direction * shift * 7 });

  if (behavior === "stop" || behavior === "stop-shrink") {
    // Check if any week in the target window has valid days
    for (let i = 0; i < weekCount; i++) {
      const ws = targetFirstWeek.add({ days: i * 7 });
      if (weekHasValidDay(ws, min, max, T)) return true;
    }
    return false;
  }

  if (behavior === "snap" || behavior === "snap-shrink") {
    // Disabled when the current position is already the snapped position
    // (i.e. applying overflow to the target produces the same firstWeek)
    const applied = applyOverflow({
      targetFirstWeek,
      weekCount,
      behavior,
      min,
      max,
      weekStartDay,
      T,
    });
    return T.PlainDate.compare(applied.firstWeek, currentFirstWeek) !== 0;
  }

  return true;
}
