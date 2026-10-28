import type { Temporal } from "@js-temporal/polyfill";
import {
  applyOutOfRange,
  canShift,
  type OutOfRangeBehavior,
} from "./out-of-range";
import type { TemporalNamespace, WeekStartDay } from "./types";

/** Inputs that determine how a weeks window may move relative to `min`/`max`. */
export interface WeekWindowPolicyInput {
  weekCount: number;
  behavior: OutOfRangeBehavior;
  min: Temporal.PlainDate | undefined;
  max: Temporal.PlainDate | undefined;
  weekStartDay: WeekStartDay;
  T: TemporalNamespace;
}

/**
 * The rules for where a WeeksView window may sit. Built once from the bounds and
 * shared by every way of moving the window (buttons, keyboard, `scrollToWeek`).
 */
export interface WeekWindowPolicy {
  /** Applies the out-of-range behavior to a requested first week. */
  resolve(requestedFirstWeek: Temporal.PlainDate): {
    firstWeek: Temporal.PlainDate;
    weekCount: number;
  };
  /** Whether a Prev/Next step of `shiftBy` weeks (default `weekCount`) is allowed. */
  canShift(
    currentFirstWeek: Temporal.PlainDate,
    direction: 1 | -1,
    shiftBy?: number,
  ): boolean;
}

export function createWeekWindowPolicy({
  weekCount,
  behavior,
  min,
  max,
  weekStartDay,
  T,
}: WeekWindowPolicyInput): WeekWindowPolicy {
  const bounds = {
    weekCount,
    behavior,
    ...(min !== undefined && { min }),
    ...(max !== undefined && { max }),
    weekStartDay,
    T,
  };
  return {
    resolve: (requestedFirstWeek) =>
      applyOutOfRange({ ...bounds, targetFirstWeek: requestedFirstWeek }),
    canShift: (currentFirstWeek, direction, shiftBy) =>
      canShift({
        ...bounds,
        currentFirstWeek,
        direction,
        ...(shiftBy !== undefined && { shiftBy }),
      }),
  };
}
