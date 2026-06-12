import type { Temporal } from "@js-temporal/polyfill";
/**
 * @internal WeeksGrid — renders continuous week rows for WeeksView.
 * Not exported from the public API.
 */
import React, { useMemo, Children, isValidElement } from "react";
import { useCalendarStable } from "./calendar-context";
import type { WeekDescriptor } from "./compute-weeks-in-window";
import { WeekDataContext, GridMonthContext } from "./context";
import {
  MonthSeparatorDataContext,
  MonthSeparator,
  MonthSeparatorRow,
} from "./month-separator";
import type { MonthSeparatorState } from "./month-separator";
import type { TemporalNamespace, WeekStartDay } from "./types";
import { useWeeksViewState } from "./weeks-view-context";

/**
 * Expand a WeekDescriptor into the 7 PlainDate values for that week.
 */
function weekDays(
  week: WeekDescriptor,
  _T: TemporalNamespace,
): Temporal.PlainDate[] {
  const days: Temporal.PlainDate[] = [];
  let d = week.startDate;
  for (let i = 0; i < 7; i++) {
    days.push(d);
    if (i < 6) d = d.add({ days: 1 });
  }
  return days;
}

/**
 * Check if a React element is a MonthSeparator (or wraps one).
 */
function isSeparatorElement(child: React.ReactNode): boolean {
  if (!isValidElement(child)) return false;
  return (
    child.type === MonthSeparator ||
    child.type === MonthSeparatorRow ||
    child.type === (MonthSeparator as any)
  );
}

/**
 * Renders the `<tbody>` contents for a WeeksView grid.
 * Iterates over the weeks array and provides WeekDataContext per row.
 * Renders MonthSeparator children at month boundaries with proper context.
 */
/**
 * Compute the 0-based column index of a date within a week row.
 * If hasWeekNumbers, column 0 is the week number column, and day columns are 1-7.
 * Otherwise day columns are 0-6.
 */
function dayColumnIndex(
  date: Temporal.PlainDate,
  weekStartDay: WeekStartDay,
  hasWeekNumbers: boolean,
): number {
  const dow = date.dayOfWeek % 7; // 0=Sun
  const col = (dow - weekStartDay + 7) % 7;
  return hasWeekNumbers ? col + 1 : col;
}

export function WeeksGrid(props: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hasWeekNumbers?: boolean;
}) {
  const { children, className, style, hasWeekNumbers = false } = props;
  const { temporal: T, weekStartDay } = useCalendarStable();
  const { weeks } = useWeeksViewState();

  // Separate children into separator template and week row templates.
  // Also detect if week numbers are present by checking for WeekNumberCell-like children.
  const separatorTemplate: React.ReactNode[] = [];
  const weekRowChildren: React.ReactNode[] = [];
  Children.forEach(children, (child) => {
    if (isSeparatorElement(child)) {
      separatorTemplate.push(child);
    } else {
      weekRowChildren.push(child);
    }
  });

  // Pre-compute days arrays for all weeks (memoised on weeks identity).
  const weekDaysArrays = useMemo(
    () => weeks.map((w) => weekDays(w, T)),
    [weeks, T],
  );

  const totalColumns = hasWeekNumbers ? 8 : 7;

  // Pre-compute month boundary data for separators.
  // A separator appears before the first week where ANY day is in a new month.
  const monthBoundaries = useMemo(() => {
    const boundaries: Array<{ index: number; data: MonthSeparatorState }> = [];
    // Track which months we've already created separators for
    const seenMonths = new Set<string>();

    for (let i = 0; i < weeks.length; i++) {
      const days = weekDaysArrays[i]!;
      const isFirstWeek = i === 0;

      // Find all distinct months in this week's days
      const monthsInWeek: Array<{ month: number; year: number; key: string }> =
        [];
      for (const day of days) {
        const monthKey = `${day.year}-${day.month}`;
        if (
          !seenMonths.has(monthKey) &&
          !monthsInWeek.some((m) => m.key === monthKey)
        ) {
          monthsInWeek.push({
            month: day.month,
            year: day.year,
            key: monthKey,
          });
        }
      }

      // If the first week spans two months, only show the second (newer) month
      const monthsToShow =
        isFirstWeek && monthsInWeek.length > 1
          ? monthsInWeek.slice(1)
          : monthsInWeek;

      // Mark all months in this week as seen (even skipped ones)
      for (const m of monthsInWeek) {
        seenMonths.add(m.key);
      }

      for (const { month: newMonth, year: newYear } of monthsToShow) {
        // Compute the column of the 1st of this month in the week row
        const firstOfMonth = T.PlainDate.from({
          year: newYear,
          month: newMonth,
          day: 1,
        });
        const firstDayCol = dayColumnIndex(
          firstOfMonth,
          weekStartDay,
          hasWeekNumbers,
        );

        // Check if the 1st day of this month is actually visible in the window
        const windowStart = weekDaysArrays[0]?.[0];
        const windowEnd = weekDaysArrays[weekDaysArrays.length - 1]?.[6];
        const firstDayVisible =
          windowStart && windowEnd
            ? T.PlainDate.compare(firstOfMonth, windowStart) >= 0 &&
              T.PlainDate.compare(firstOfMonth, windowEnd) <= 0
            : false;

        // Count weeks visible before (weeks above that belong to previous month)
        let weeksVisibleBefore = 0;
        for (let j = i - 1; j >= 0; j--) {
          // Check if all days in that week are before this month
          const prevDays = weekDaysArrays[j]!;
          const hasThisMonth = prevDays.some(
            (d) => d.month === newMonth && d.year === newYear,
          );
          if (!hasThisMonth) {
            weeksVisibleBefore++;
          } else {
            break;
          }
        }

        // Count weeks visible after (weeks containing days of this month)
        let weeksVisibleAfter = 0;
        for (let j = i; j < weeks.length; j++) {
          const wDays = weekDaysArrays[j]!;
          const hasThisMonth = wDays.some(
            (d) => d.month === newMonth && d.year === newYear,
          );
          if (hasThisMonth) {
            weeksVisibleAfter++;
          } else {
            break;
          }
        }

        // Determine firstOfYear
        const isNewYear =
          boundaries.length > 0
            ? boundaries[boundaries.length - 1]!.data.year !== newYear
            : newMonth === 1;

        boundaries.push({
          index: i,
          data: {
            month: newMonth,
            year: newYear,
            firstOfYear: isFirstWeek ? newMonth === 1 : isNewYear,
            firstVisible: boundaries.length === 0,
            weeksVisibleBefore,
            weeksVisibleAfter,
            firstDayColumn: firstDayCol,
            totalColumns,
            firstDayVisible,
            fullWeeksVisibleAfter: 0, // computed in second pass
            gridRowStart: 0, // computed in second pass
          },
        });
      }
    }

    // Second pass: compute fullWeeksVisibleAfter and gridRowStart.
    // fullWeeksVisibleAfter = week rows between this separator and the next
    // (or end of window). gridRowStart = 1-based row in the grid body
    // (accounting for header row offset +1).
    for (let b = 0; b < boundaries.length; b++) {
      const current = boundaries[b]!;
      const nextIndex =
        b + 1 < boundaries.length ? boundaries[b + 1]!.index : weeks.length;
      current.data.fullWeeksVisibleAfter = nextIndex - current.index;
      // Grid row: header is row 1, week rows start at row 2.
      // gridRowStart matches the week row it labels: index + 2 (1-based + header).
      current.data.gridRowStart = current.index + 2;
    }

    return boundaries;
  }, [weeks, weekDaysArrays, weekStartDay, hasWeekNumbers, totalColumns, T]);

  // Build the boundary lookup — multiple boundaries can exist at the same week index
  const boundariesAtIndex = useMemo(() => {
    const map = new Map<number, MonthSeparatorState[]>();
    for (const b of monthBoundaries) {
      const existing = map.get(b.index);
      if (existing) {
        existing.push(b.data);
      } else {
        map.set(b.index, [b.data]);
      }
    }
    return map;
  }, [monthBoundaries]);

  const rows: React.ReactNode[] = [];

  for (let i = 0; i < weeks.length; i++) {
    const week = weeks[i]!;
    const days = weekDaysArrays[i]!;
    const separators = boundariesAtIndex.get(i);

    // Render separators at month boundaries
    if (separators && separatorTemplate.length > 0) {
      for (const separatorData of separators) {
        rows.push(
          <MonthSeparatorDataContext.Provider
            key={`sep-${separatorData.year}-${separatorData.month}`}
            value={separatorData}
          >
            {separatorTemplate}
          </MonthSeparatorDataContext.Provider>,
        );
      }
    }

    // Provide WeekDataContext so DayCellTemplate and children work.
    // gridRowIndex: 1-based row index in the CSS grid (header is row 1, weeks start at row 2).
    const weekGridRow = i + 2; // +1 for 1-based, +1 for header
    rows.push(
      <WeekDataContext.Provider
        key={week.startDate.toString()}
        value={{ days, weekIndex: week.weekIndex, gridRowIndex: weekGridRow }}
      >
        <GridMonthContext.Provider
          value={{
            weeks: [days],
            year: week.year,
            month: week.month,
          }}
        >
          {weekRowChildren}
        </GridMonthContext.Provider>
      </WeekDataContext.Provider>,
    );
  }

  return (
    <tbody className={className} style={style}>
      {rows}
    </tbody>
  );
}
