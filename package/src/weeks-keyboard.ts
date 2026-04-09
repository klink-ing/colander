import type { Temporal } from "@js-temporal/polyfill";
import type { TemporalNamespace, WeekStartDay } from "./types";

/** Result of a weeks-view keyboard navigation action. */
export type WeeksKeyNavResult =
  | {
      action: "move";
      date: Temporal.PlainDate;
      windowShift: number;
      followFocus: boolean;
    }
  | { action: "select"; windowShift: number; followFocus: boolean }
  | { action: "none"; windowShift: number; followFocus: boolean };

/** Input parameters for weeks-view keyboard navigation computation. */
export interface WeeksKeyNavInput {
  /** The `KeyboardEvent.key` value. */
  key: string;
  /** Whether the Shift modifier was held. */
  shiftKey: boolean;
  /** The currently focused date in the grid. */
  focusedDate: Temporal.PlainDate;
  /** The first day of the visible window. */
  windowStart: Temporal.PlainDate;
  /** Number of weeks visible in the window. */
  weekCount: number;
  /** Minimum selectable date bound. */
  minValue: Temporal.PlainDate | undefined;
  /** Maximum selectable date bound. */
  maxValue: Temporal.PlainDate | undefined;
  /** Whether the entire calendar is disabled. */
  disabled: boolean;
  /** Whether the calendar is read-only (navigation allowed, selection blocked). */
  readOnly?: boolean;
  /** Predicate for individually disabled dates. */
  isDateDisabled?: (date: Temporal.PlainDate) => boolean;
  /** Controls how the window scrolls when arrow keys push focus outside. */
  scrollBy: "row" | "page";
  /** Temporal namespace. */
  T: TemporalNamespace;
  /** Day the week starts on (`0` = Sunday). */
  weekStartDay: WeekStartDay;
}

const NONE: WeeksKeyNavResult = {
  action: "none",
  windowShift: 0,
  followFocus: false,
};

/**
 * Pure function that maps a keyboard event to a weeks-view navigation result.
 *
 * Handles Arrow keys (±1 day / ±1 week), Home/End (first/last day of window),
 * PageUp/PageDown (±weekCount weeks, ±1 year with Shift), and Enter/Space (select).
 * Results are clamped to `minValue`/`maxValue` bounds.
 */
export function computeWeeksKeyNav(input: WeeksKeyNavInput): WeeksKeyNavResult {
  const {
    key,
    shiftKey,
    focusedDate,
    windowStart,
    weekCount,
    minValue,
    maxValue,
    disabled,
    readOnly,
    isDateDisabled,
    scrollBy,
    T,
  } = input;

  if (disabled) return NONE;

  // windowEnd is the last day of the visible window (inclusive)
  const windowEnd = windowStart.add({ weeks: weekCount }).subtract({ days: 1 });

  function isOutsideWindow(date: Temporal.PlainDate): boolean {
    return (
      T.PlainDate.compare(date, windowStart) < 0 ||
      T.PlainDate.compare(date, windowEnd) > 0
    );
  }

  function windowShiftFor(target: Temporal.PlainDate): number {
    if (T.PlainDate.compare(target, windowEnd) > 0) {
      return scrollBy === "row" ? 1 : weekCount;
    }
    if (T.PlainDate.compare(target, windowStart) < 0) {
      return scrollBy === "row" ? -1 : -weekCount;
    }
    return 0;
  }

  function clampToMove(
    target: Temporal.PlainDate,
    windowShift: number,
    followFocus: boolean,
  ): WeeksKeyNavResult {
    let clamped = target;
    if (minValue && T.PlainDate.compare(clamped, minValue) < 0)
      clamped = minValue;
    if (maxValue && T.PlainDate.compare(clamped, maxValue) > 0)
      clamped = maxValue;
    if (T.PlainDate.compare(clamped, focusedDate) === 0) return NONE;
    return { action: "move", date: clamped, windowShift, followFocus };
  }

  switch (key) {
    case "ArrowRight": {
      const target = focusedDate.add({ days: 1 });
      const shift = isOutsideWindow(target) ? windowShiftFor(target) : 0;
      return clampToMove(target, shift, false);
    }
    case "ArrowLeft": {
      const target = focusedDate.subtract({ days: 1 });
      const shift = isOutsideWindow(target) ? windowShiftFor(target) : 0;
      return clampToMove(target, shift, false);
    }
    case "ArrowDown": {
      const target = focusedDate.add({ weeks: 1 });
      const shift = isOutsideWindow(target) ? windowShiftFor(target) : 0;
      return clampToMove(target, shift, false);
    }
    case "ArrowUp": {
      const target = focusedDate.subtract({ weeks: 1 });
      const shift = isOutsideWindow(target) ? windowShiftFor(target) : 0;
      return clampToMove(target, shift, false);
    }
    case "Home":
      return clampToMove(windowStart, 0, false);
    case "End":
      return clampToMove(windowEnd, 0, false);
    case "PageDown": {
      if (shiftKey) {
        const target = focusedDate.add({ years: 1 });
        return clampToMove(target, 0, true);
      }
      const target = focusedDate.add({ weeks: weekCount });
      return clampToMove(target, weekCount, false);
    }
    case "PageUp": {
      if (shiftKey) {
        const target = focusedDate.subtract({ years: 1 });
        return clampToMove(target, 0, true);
      }
      const target = focusedDate.subtract({ weeks: weekCount });
      return clampToMove(target, -weekCount, false);
    }
    case "Enter":
    case " ":
      if (readOnly) return NONE;
      if (!isDateDisabled?.(focusedDate)) {
        return { action: "select", windowShift: 0, followFocus: false };
      }
      return NONE;
    default:
      return NONE;
  }
}
