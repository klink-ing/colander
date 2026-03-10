import type { Temporal } from "@js-temporal/polyfill";
import type { TemporalNamespace } from "./types";

/** Result of a keyboard navigation action. */
export type KeyboardNavResult =
  | { action: "move"; date: Temporal.PlainDate }
  | { action: "select" }
  | { action: "none" };

/** Input parameters for keyboard navigation computation. */
export interface KeyboardNavInput {
  key: string;
  shiftKey: boolean;
  focusedDate: Temporal.PlainDate;
  minValue: Temporal.PlainDate | undefined;
  maxValue: Temporal.PlainDate | undefined;
  disabled: boolean;
  readOnly?: boolean;
  isDateDisabled?: (date: Temporal.PlainDate) => boolean;
  T: TemporalNamespace;
  weekStartDay?: number;
}

/**
 * Computes the target date when jumping by `months` from `focusedDate`.
 *
 * Day-of-month is constrained (e.g. Jan 31 + 1 month → Feb 28/29).
 */
export function computeMonthJumpTarget(
  focusedDate: Temporal.PlainDate,
  months: number,
  T: TemporalNamespace,
): Temporal.PlainDate {
  const totalMonths = focusedDate.year * 12 + (focusedDate.month - 1) + months;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;
  return T.PlainDate.from(
    { year: targetYear, month: targetMonth, day: focusedDate.day },
    { overflow: "constrain" },
  );
}

function clampToBounds(
  target: Temporal.PlainDate,
  focusedDate: Temporal.PlainDate,
  minValue: Temporal.PlainDate | undefined,
  maxValue: Temporal.PlainDate | undefined,
  T: TemporalNamespace,
): KeyboardNavResult {
  let clamped = target;
  if (minValue && T.PlainDate.compare(clamped, minValue) < 0)
    clamped = minValue;
  if (maxValue && T.PlainDate.compare(clamped, maxValue) > 0)
    clamped = maxValue;
  if (T.PlainDate.compare(clamped, focusedDate) === 0)
    return { action: "none" };
  return { action: "move", date: clamped };
}

/**
 * Pure function that maps a keyboard event to a navigation result.
 *
 * Handles Arrow keys (±1 day / ±1 week), Home/End (start/end of week),
 * PageUp/PageDown (±1 month, ±1 year with Shift), and Enter/Space (select).
 * Results are clamped to `minValue`/`maxValue` bounds.
 */
export function computeNextFocusDate(
  input: KeyboardNavInput,
): KeyboardNavResult {
  const {
    key,
    shiftKey,
    focusedDate,
    minValue,
    maxValue,
    disabled,
    readOnly,
    isDateDisabled,
    T,
    weekStartDay = 0,
  } = input;

  if (disabled) return { action: "none" };

  const daysInWeek = focusedDate.daysInWeek;
  let nextDate: Temporal.PlainDate | null = null;

  switch (key) {
    case "ArrowRight":
      nextDate = focusedDate.add({ days: 1 });
      break;
    case "ArrowLeft":
      nextDate = focusedDate.subtract({ days: 1 });
      break;
    case "ArrowDown":
      nextDate = focusedDate.add({ weeks: 1 });
      break;
    case "ArrowUp":
      nextDate = focusedDate.subtract({ weeks: 1 });
      break;
    case "Home": {
      const adjustedDow =
        ((focusedDate.dayOfWeek % daysInWeek) - weekStartDay + daysInWeek) %
        daysInWeek;
      nextDate = focusedDate.subtract({ days: adjustedDow });
      break;
    }
    case "End": {
      const adjustedDow =
        ((focusedDate.dayOfWeek % daysInWeek) - weekStartDay + daysInWeek) %
        daysInWeek;
      nextDate = focusedDate.add({ days: daysInWeek - 1 - adjustedDow });
      break;
    }
    case "PageUp": {
      const target = computeMonthJumpTarget(
        focusedDate,
        shiftKey ? -12 : -1,
        T,
      );
      return clampToBounds(target, focusedDate, minValue, maxValue, T);
    }
    case "PageDown": {
      const target = computeMonthJumpTarget(focusedDate, shiftKey ? 12 : 1, T);
      return clampToBounds(target, focusedDate, minValue, maxValue, T);
    }
    case "Enter":
    case " ":
      if (readOnly) return { action: "none" };
      if (!isDateDisabled?.(focusedDate)) {
        return { action: "select" };
      }
      return { action: "none" };
    default:
      return { action: "none" };
  }

  if (nextDate) {
    return clampToBounds(nextDate, focusedDate, minValue, maxValue, T);
  }

  return { action: "none" };
}
