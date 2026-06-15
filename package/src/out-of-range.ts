import type { Temporal } from "@js-temporal/polyfill";
import type { TemporalNamespace, WeekStartDay } from "./types";

/**
 * Controls how a {@link WeeksView} window behaves when navigation would move it
 * past the `min`/`max` bounds.
 *
 * `min`/`max` always restrict which **days are selectable**. `outOfRangeBehavior`
 * is a separate concern: it decides whether the **visible window** may scroll
 * beyond those bounds, and how the edge is handled.
 *
 * - `"unbounded"` — Navigation is never restricted by `min`/`max`; any range of
 *   weeks can be viewed. Out-of-range days simply render disabled. (Default.)
 * - `"stop"` — Navigation halts at the boundary: the Prev/Next button is
 *   disabled once the next step would show a window containing no in-range day.
 * - `"stop-shrink"` — Like `"stop"`, but near the edge the window **shrinks** to
 *   fewer week rows instead of showing rows that are entirely out of range.
 * - `"snap"` — A jump that would overshoot **snaps** the window so its edge
 *   aligns to the last/first in-range week, rather than stopping or overshooting.
 * - `"snap-shrink"` — Snap to the boundary, then **shrink** the window to just
 *   the in-range weeks.
 *
 * `"snap"` and `"snap-shrink"` are identical **unless the selectable range spans
 * fewer weeks than `weekCount`** — i.e. the window is taller than the range.
 * Snapping can only pin *one* edge to a bound; if the range is narrower than the
 * window, the opposite edge still overhangs into out-of-range weeks. `"snap"`
 * keeps the full `weekCount` (padding the overhang with all-disabled week rows),
 * while `"snap-shrink"` trims those rows so only the in-range weeks show.
 *
 * Example with `weekCount: 6` and a `min`/`max` that span just 2 weeks: `"snap"`
 * shows 6 rows (4 of them fully disabled), `"snap-shrink"` shows 2 rows. When
 * the range is ≥ `weekCount` weeks wide, the snapped window already fits, so the
 * two behave the same.
 */
export type OutOfRangeBehavior =
  | "unbounded"
  | "stop"
  | "stop-shrink"
  | "snap"
  | "snap-shrink";

/**
 * Controls how {@link MonthView} navigation behaves when it would move the
 * visible month(s) past the `min`/`max` bounds.
 *
 * `min`/`max` always restrict which **days are selectable**. This decides
 * whether you can still **view** months outside them.
 *
 * - `"unbounded"` — Prev/Next are never disabled by `min`/`max`; you can page to
 *   any month. Out-of-range days render disabled. (Default.)
 * - `"stop"` — Prev/Next become disabled once the destination month crosses the
 *   boundary.
 *
 * MonthView renders fixed month grids, so the `"…-shrink"`/`"snap…"` modes that
 * {@link OutOfRangeBehavior} offers for WeeksView's flexible window don't apply.
 */
export type MonthOutOfRangeBehavior = "unbounded" | "stop";

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
  return (
    T.PlainDate.compare(weekStart, max) <= 0 &&
    T.PlainDate.compare(weekEnd, min) >= 0
  );
}

/**
 * Returns the start of the week (per weekStartDay) that contains the given date.
 * Uses dayOfWeek % 7 → Sun=0…Sat=6 convention.
 */
function weekStartContaining(
  date: Temporal.PlainDate,
  weekStartDay: WeekStartDay,
  _T: TemporalNamespace,
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

export interface ApplyOutOfRangeInput {
  targetFirstWeek: Temporal.PlainDate;
  weekCount: number;
  behavior: OutOfRangeBehavior;
  min?: Temporal.PlainDate;
  max?: Temporal.PlainDate;
  weekStartDay: WeekStartDay;
  T: TemporalNamespace;
}

/**
 * Given a target firstWeek and weekCount, apply the out-of-range behavior and return
 * the adjusted { firstWeek, weekCount }.
 */
export function applyOutOfRange({
  targetFirstWeek,
  weekCount,
  behavior,
  min,
  max,
  weekStartDay,
  T,
}: ApplyOutOfRangeInput): { firstWeek: Temporal.PlainDate; weekCount: number } {
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
  behavior: OutOfRangeBehavior;
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
    // (i.e. applying the out-of-range behavior to the target produces the same firstWeek)
    const applied = applyOutOfRange({
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
