import type { Temporal } from "@js-temporal/polyfill";
import type { MonthOutOfRangeBehavior } from "./out-of-range";
import type { TemporalNamespace } from "./types";
import { computeAdjacentMonth, shiftWindowToMonth } from "./utils";

/** An ISO year + month. */
export interface MonthRef {
  year: number;
  month: number;
}

/** One step of the visible month window. */
export interface MonthStep {
  /** The window's first month after the step. */
  start: MonthRef;
  /** The month that enters view (before the window for `prev`, after it for `next`). */
  entering: MonthRef;
  /** First day of `start`, the focus target when focus isn't already in `start`. */
  firstDay: Temporal.PlainDate;
  /** Whether `stop` forbids the step because `entering` lies beyond `min`/`max`. */
  blocked: boolean;
}

/** The one seam for moving the MonthView window. */
export interface MonthWindowPolicy {
  /** Steps the window one month towards `direction`. */
  step(start: MonthRef, direction: "prev" | "next"): MonthStep;
  /** Whether `target` is inside the window starting at `start`. */
  isVisible(start: MonthRef, target: MonthRef): boolean;
  /** The window start that reveals `target` with the smallest shift. */
  reveal(start: MonthRef, target: MonthRef): MonthRef;
}

export interface MonthWindowPolicyInput {
  numberOfMonths: number;
  behavior: MonthOutOfRangeBehavior;
  min: Temporal.PlainDate | undefined;
  max: Temporal.PlainDate | undefined;
  T: TemporalNamespace;
}

const monthIndex = (m: MonthRef): number => m.year * 12 + (m.month - 1);

/**
 * Builds the policy for a MonthView window of `numberOfMonths` months.
 *
 * `unbounded` never blocks a step: `min`/`max` only gate which days are
 * selectable, not which months can be viewed. Any other behavior is `stop`,
 * which blocks a step whose entering month lies beyond the bound's month.
 */
export function createMonthWindowPolicy(
  input: MonthWindowPolicyInput,
): MonthWindowPolicy {
  const { numberOfMonths, behavior, min, max, T } = input;

  return {
    step(start, direction) {
      const adjacent = computeAdjacentMonth(start, direction, T);
      const newStart = { year: adjacent.year, month: adjacent.month };
      const entering =
        direction === "prev" ? newStart : monthAt(newStart, numberOfMonths - 1);

      let blocked = false;
      if (behavior !== "unbounded") {
        const bound = direction === "prev" ? min : max;
        if (bound) {
          const diff = monthIndex(entering) - monthIndex(bound);
          blocked = direction === "prev" ? diff < 0 : diff > 0;
        }
      }
      return {
        start: newStart,
        entering,
        firstDay: adjacent.firstDay,
        blocked,
      };
    },

    isVisible(start, target) {
      const offset = monthIndex(target) - monthIndex(start);
      return offset >= 0 && offset < numberOfMonths;
    },

    reveal(start, target) {
      return shiftWindowToMonth(start, target, numberOfMonths);
    },
  };
}

function monthAt(start: MonthRef, offset: number): MonthRef {
  const index = monthIndex(start) + offset;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}
