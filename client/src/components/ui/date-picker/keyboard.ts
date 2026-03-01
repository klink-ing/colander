import type { Temporal } from "@js-temporal/polyfill";
import type { TemporalNamespace } from "./types";

export type KeyboardNavResult =
  | { action: "move"; date: Temporal.PlainDate }
  | { action: "select" }
  | { action: "none" };

export interface KeyboardNavInput {
  key: string;
  shiftKey: boolean;
  focusedDate: Temporal.PlainDate;
  minValue: Temporal.PlainDate | undefined;
  maxValue: Temporal.PlainDate | undefined;
  disabled: boolean;
  isDateDisabled?: (date: Temporal.PlainDate) => boolean;
  T: TemporalNamespace;
}

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
  if (minValue && T.PlainDate.compare(clamped, minValue) < 0) clamped = minValue;
  if (maxValue && T.PlainDate.compare(clamped, maxValue) > 0) clamped = maxValue;
  if (T.PlainDate.compare(clamped, focusedDate) === 0) return { action: "none" };
  return { action: "move", date: clamped };
}

export function computeNextFocusDate(input: KeyboardNavInput): KeyboardNavResult {
  const { key, shiftKey, focusedDate, minValue, maxValue, disabled, isDateDisabled, T } = input;

  if (disabled) return { action: "none" };

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
      const sundayDow = focusedDate.dayOfWeek % 7;
      nextDate = focusedDate.subtract({ days: sundayDow });
      break;
    }
    case "End": {
      const sundayDow = focusedDate.dayOfWeek % 7;
      nextDate = focusedDate.add({ days: 6 - sundayDow });
      break;
    }
    case "PageUp": {
      const target = computeMonthJumpTarget(focusedDate, shiftKey ? -12 : -1, T);
      return clampToBounds(target, focusedDate, minValue, maxValue, T);
    }
    case "PageDown": {
      const target = computeMonthJumpTarget(focusedDate, shiftKey ? 12 : 1, T);
      return clampToBounds(target, focusedDate, minValue, maxValue, T);
    }
    case "Enter":
    case " ":
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
