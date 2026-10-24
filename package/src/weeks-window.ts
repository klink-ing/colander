import type { Temporal } from "@js-temporal/polyfill";
import {
  applyOutOfRange,
  windowHasValidWeek,
  type OutOfRangeBehavior,
} from "./out-of-range";
import type { TemporalNamespace, WeekStartDay } from "./types";

/** Inputs that determine how a weeks window may move relative to `min`/`max`. */
export interface WeekWindowPolicyInput {
  /** The `weekCount` prop: the most rows a window will ever show. */
  weekCount: number;
  behavior: OutOfRangeBehavior;
  min: Temporal.PlainDate | undefined;
  max: Temporal.PlainDate | undefined;
  weekStartDay: WeekStartDay;
  T: TemporalNamespace;
}

/** A window as shown: its first week and how many rows it has (≤ the prop). */
export interface EffectiveWindow {
  firstWeek: Temporal.PlainDate;
  weekCount: number;
}

/**
 * The rules for where a WeeksView window may sit. Built once from the bounds and
 * shared by every way of moving the window (buttons, keyboard, `scrollToWeek`).
 */
export interface WeekWindowPolicy {
  /** The window that is shown for a requested first week. Never refuses. */
  resolve(requestedFirstWeek: Temporal.PlainDate): EffectiveWindow;
  /**
   * The window to move to for a requested first week, or `null` when the
   * behavior forbids the move (`stop`/`stop-shrink` with no in-range day in it).
   */
  moveTo(requestedFirstWeek: Temporal.PlainDate): EffectiveWindow | null;
  /**
   * Moves by `shiftBy` weeks (default: the rows currently shown) from the
   * window as shown. `null` when the move is forbidden or would not change
   * the window (`snap` already at the edge).
   */
  shift(
    current: EffectiveWindow,
    direction: 1 | -1,
    shiftBy?: number,
  ): EffectiveWindow | null;
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
  const isStop = behavior === "stop" || behavior === "stop-shrink";
  const isBounded = min !== undefined || max !== undefined;

  const resolve: WeekWindowPolicy["resolve"] = (requestedFirstWeek) =>
    applyOutOfRange({ ...bounds, targetFirstWeek: requestedFirstWeek });

  const moveTo: WeekWindowPolicy["moveTo"] = (requestedFirstWeek) => {
    if (
      isStop &&
      isBounded &&
      !windowHasValidWeek(requestedFirstWeek, weekCount, min, max, T)
    ) {
      return null;
    }
    return resolve(requestedFirstWeek);
  };

  return {
    resolve,
    moveTo,
    shift: (current, direction, shiftBy) => {
      const by = shiftBy ?? current.weekCount;
      const target = current.firstWeek.add({ weeks: direction * by });
      const next = moveTo(target);
      if (next === null) return null;
      const isSnap = behavior === "snap" || behavior === "snap-shrink";
      if (
        isSnap &&
        isBounded &&
        T.PlainDate.compare(next.firstWeek, current.firstWeek) === 0
      ) {
        return null;
      }
      return next;
    },
  };
}
