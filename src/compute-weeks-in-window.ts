import type { Temporal } from "@js-temporal/polyfill";
import type { TemporalNamespace, WeekStartDay } from "./types";

export interface WeekDescriptor {
  startDate: Temporal.PlainDate;
  endDate: Temporal.PlainDate;
  weekIndex: number;
  month: number;
  year: number;
}

/**
 * Computes an array of week descriptors for a continuous window.
 * `firstWeek` is snapped back to the nearest `weekStartDay`.
 */
export function computeWeeksInWindow(
  firstWeek: Temporal.PlainDate,
  weekCount: number,
  weekStartDay: WeekStartDay,
  T: TemporalNamespace,
): WeekDescriptor[] {
  // Snap firstWeek back to the start of its week
  const dow = firstWeek.dayOfWeek % 7; // 0=Sun
  const offset = (dow - weekStartDay + 7) % 7;
  let weekStart = firstWeek.subtract({ days: offset });

  const weeks: WeekDescriptor[] = [];
  for (let i = 0; i < weekCount; i++) {
    const endDate = weekStart.add({ days: 6 });
    weeks.push({
      startDate: weekStart,
      endDate,
      weekIndex: i,
      month: weekStart.month,
      year: weekStart.year,
    });
    weekStart = weekStart.add({ weeks: 1 });
  }
  return weeks;
}
