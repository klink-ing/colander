import type { Temporal } from "@js-temporal/polyfill";
import type {
  TemporalNamespace,
  DateValueObject,
  ValueFormat,
  WeekStartDay,
} from "./types";

/**
 * Returns the default calendar system for a given locale (e.g. `"gregory"` for `"en-US"`).
 *
 * @param locale - A BCP 47 locale string. Falls back to the runtime default when empty.
 */
export function calendarForLocale(locale: string): string {
  return new Intl.DateTimeFormat(locale || undefined).resolvedOptions()
    .calendar;
}

/**
 * Resolves a {@link TemporalNamespace} instance.
 *
 * Returns `provided` when given, otherwise checks `globalThis.Temporal`.
 * Throws if neither is available.
 *
 * @param provided - An explicit Temporal polyfill or namespace.
 */
export function resolveTemporal(
  provided?: TemporalNamespace,
): TemporalNamespace {
  if (provided) return provided;
  if (typeof globalThis !== "undefined" && (globalThis as any).Temporal) {
    return (globalThis as any).Temporal;
  }
  throw new Error(
    "DatePicker: Temporal is not available. Pass a Temporal polyfill via the `temporal` prop, or use a browser that supports the Temporal API natively.",
  );
}

/**
 * Returns the IANA time zone identifier of the host environment (e.g. `"America/New_York"`).
 *
 * @param T - Temporal namespace.
 */
export function getSystemTimeZone(T: TemporalNamespace): string {
  return T.Now.timeZoneId();
}

/**
 * Converts any {@link DateValueObject} into a `Temporal.ZonedDateTime`.
 *
 * Handles all supported value formats (`PlainDate`, `PlainDateTime`,
 * `PlainMonthDay`, `PlainTime`, `PlainYearMonth`, `ZonedDateTime`,
 * `object`, and `Date`). For partial types (`PlainMonthDay`, `PlainTime`)
 * the missing components are filled from the current date/time.
 *
 * @param tagged - The tagged date value to convert.
 * @param timeZone - IANA time zone used for the resulting `ZonedDateTime`.
 * @param T - Temporal namespace.
 */
export function toZonedDateTime(
  tagged: DateValueObject,
  timeZone: string,
  T: TemporalNamespace,
): Temporal.ZonedDateTime {
  const now = T.Now.zonedDateTimeISO(timeZone);
  switch (tagged.format) {
    case "PlainDate":
      return tagged.value.toZonedDateTime(timeZone);
    case "PlainDateTime":
      return tagged.value.toZonedDateTime(timeZone);
    case "PlainMonthDay": {
      const pd = tagged.value.toPlainDate({ year: now.year });
      return pd.toZonedDateTime(timeZone);
    }
    case "PlainTime":
      return now
        .toPlainDate()
        .toPlainDateTime(tagged.value)
        .toZonedDateTime(timeZone);
    case "PlainYearMonth":
      return tagged.value.toPlainDate({ day: 1 }).toZonedDateTime(timeZone);
    case "ZonedDateTime":
      return tagged.value;
    case "object": {
      const obj = tagged.value;
      return T.PlainDateTime.from({
        year: obj.year ?? now.year,
        month: obj.month ?? now.month,
        day: obj.day ?? now.day,
        hour: obj.hour ?? 0,
        minute: obj.minute ?? 0,
        second: obj.second ?? 0,
      }).toZonedDateTime(obj.timeZone ?? timeZone);
    }
    case "Date": {
      const d = tagged.value;
      return T.PlainDateTime.from({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        day: d.getDate(),
        hour: d.getHours(),
        minute: d.getMinutes(),
        second: d.getSeconds(),
      }).toZonedDateTime(timeZone);
    }
  }
}

/**
 * Converts a `Temporal.ZonedDateTime` back into a {@link DateValueObject}
 * of the requested format.
 *
 * This is the inverse of {@link toZonedDateTime}.
 *
 * @param zdt - The zoned date-time to convert from.
 * @param format - The target {@link ValueFormat}.
 * @param T - Temporal namespace.
 */
export function fromZonedDateTime(
  zdt: Temporal.ZonedDateTime,
  format: ValueFormat,
  T: TemporalNamespace,
): DateValueObject {
  switch (format) {
    case "PlainDate":
      return { format, value: zdt.toPlainDate() };
    case "PlainDateTime":
      return { format, value: zdt.toPlainDateTime() };
    case "PlainMonthDay":
      return {
        format,
        value: T.PlainMonthDay.from({ month: zdt.month, day: zdt.day }),
      };
    case "PlainTime":
      return { format, value: zdt.toPlainTime() };
    case "PlainYearMonth":
      return {
        format,
        value: T.PlainYearMonth.from({ year: zdt.year, month: zdt.month }),
      };
    case "ZonedDateTime":
      return { format, value: zdt };
    case "object":
      return {
        format,
        value: {
          year: zdt.year,
          month: zdt.month,
          day: zdt.day,
          hour: zdt.hour,
          minute: zdt.minute,
          second: zdt.second,
          timeZone: zdt.timeZoneId,
        },
      };
    case "Date":
      return { format, value: new Date(zdt.epochMilliseconds) };
  }
}

/**
 * Convenience wrapper around {@link toZonedDateTime} that accepts `undefined`.
 *
 * Returns `undefined` when `selected` is not provided, otherwise converts to
 * a `Temporal.ZonedDateTime`.
 *
 * @param selected - The currently selected value, or `undefined`.
 * @param timeZone - IANA time zone.
 * @param T - Temporal namespace.
 */
export function selectedToZdt(
  selected: DateValueObject | undefined,
  timeZone: string,
  T: TemporalNamespace,
): Temporal.ZonedDateTime | undefined {
  if (!selected) return undefined;
  return toZonedDateTime(selected, timeZone, T);
}

/**
 * Builds a 2D array of calendar weeks for a given month.
 *
 * Each inner array has exactly `daysInWeek` entries. The grid is padded
 * with days from adjacent months so every week is complete.
 *
 * @param year - Calendar year.
 * @param month - Calendar month (1–12).
 * @param T - Temporal namespace.
 * @param opts - Optional settings for week start day and fixed weeks.
 * @returns An array of 4–6 weeks, each containing `daysInWeek` `PlainDate` values.
 */
export function getMonthWeeks(
  year: number,
  month: number,
  T: TemporalNamespace,
  opts?: { weekStartDay?: WeekStartDay; fixedWeeks?: boolean },
): Temporal.PlainDate[][] {
  const weekStartDay = opts?.weekStartDay ?? 0;
  const fixedWeeks = opts?.fixedWeeks ?? false;

  const firstOfMonth = T.PlainDate.from({ year, month, day: 1 });
  const daysInWeek = firstOfMonth.daysInWeek;
  const daysInMonth = firstOfMonth.daysInMonth;
  const lastOfMonth = T.PlainDate.from({ year, month, day: daysInMonth });

  const adjustedFirst =
    ((firstOfMonth.dayOfWeek % daysInWeek) - weekStartDay + daysInWeek) %
    daysInWeek;
  const gridStart = firstOfMonth.subtract({ days: adjustedFirst });

  const adjustedLast =
    ((lastOfMonth.dayOfWeek % daysInWeek) - weekStartDay + daysInWeek) %
    daysInWeek;
  const daysAfter = daysInWeek - 1 - adjustedLast;
  const gridEnd = lastOfMonth.add({ days: daysAfter });

  const weeks: Temporal.PlainDate[][] = [];
  let current = gridStart;
  while (T.PlainDate.compare(current, gridEnd) <= 0) {
    const week: Temporal.PlainDate[] = [];
    for (let i = 0; i < daysInWeek; i++) {
      week.push(current);
      current = current.add({ days: 1 });
    }
    weeks.push(week);
  }

  if (fixedWeeks) {
    while (weeks.length < 6) {
      const week: Temporal.PlainDate[] = [];
      for (let i = 0; i < daysInWeek; i++) {
        week.push(current);
        current = current.add({ days: 1 });
      }
      weeks.push(week);
    }
  }

  return weeks;
}

/**
 * Converts a `Temporal.ZonedDateTime` to a native JavaScript `Date`.
 *
 * @param zdt - The zoned date-time to convert.
 */
export function zdtToNativeDate(zdt: Temporal.ZonedDateTime): Date {
  return new Date(zdt.epochMilliseconds);
}

/**
 * Checks whether a `ZonedDateTime` and a `PlainDate` represent the same
 * calendar day (year, month, and day all equal).
 *
 * @param a - A zoned date-time.
 * @param b - A plain date.
 */
export function sameCalendarDay(
  a: Temporal.ZonedDateTime,
  b: Temporal.PlainDate,
): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/**
 * Returns a date falling on the configured week start day, used as an anchor
 * for generating weekday name lists.
 *
 * @param T - Temporal namespace.
 * @param weekStartDay - 0=Sunday (default), 1=Monday, etc.
 */
export function getReferenceWeekStart(
  T: TemporalNamespace,
  weekStartDay = 0,
): Temporal.PlainDate {
  const refSunday = T.PlainDate.from("2024-01-07");
  return refSunday.add({ days: weekStartDay });
}

/**
 * Computes the year/month and first day of the month adjacent to `current`.
 *
 * Handles year boundaries (e.g. Dec → Jan, Jan → Dec).
 *
 * @param current - The reference month.
 * @param direction - `"next"` or `"prev"`.
 * @param T - Temporal namespace.
 */
export function computeAdjacentMonth(
  current: { year: number; month: number },
  direction: "prev" | "next",
  T: TemporalNamespace,
): { year: number; month: number; firstDay: Temporal.PlainDate } {
  const d = T.PlainDate.from({
    year: current.year,
    month: current.month,
    day: 1,
  })[direction === "next" ? "add" : "subtract"]({ months: 1 });
  return { year: d.year, month: d.month, firstDay: d };
}

/**
 * Determines the focused date after navigating to a new month.
 *
 * If `currentFocused` is already within `targetMonth`, it is preserved.
 * Otherwise, `firstDay` of the target month is returned.
 *
 * @param currentFocused - The currently focused date.
 * @param targetMonth - The month being navigated to.
 * @param firstDay - The first day of the target month (fallback).
 */
export function focusedDateForMonth(
  currentFocused: Temporal.PlainDate,
  targetMonth: { year: number; month: number },
  firstDay: Temporal.PlainDate,
): Temporal.PlainDate {
  if (
    currentFocused.year === targetMonth.year &&
    currentFocused.month === targetMonth.month
  ) {
    return currentFocused;
  }
  return firstDay;
}

/**
 * Resolves which date should receive focus/tabindex in the calendar grid.
 *
 * Priority when `gridHasFocus` is `true` (keyboard navigation):
 * 1. `focusedDate` if it exists in the grid.
 * 2. `selectedDate` if it exists in the grid.
 * 3. First enabled day of `currentMonth`, then first grid day, then
 *    `focusedDate` itself (empty grid) as last resorts.
 *
 * When `gridHasFocus` is `false` (tab-in), `selectedDate` takes priority
 * over `focusedDate`.
 *
 * @param focusedDate - The date currently tracked as focused.
 * @param selectedDate - The currently selected date, if any.
 * @param weeks - The 2D weeks array from {@link getMonthWeeks}.
 * @param currentMonth - The month being displayed.
 * @param isDateDisabled - Predicate for disabled dates.
 * @param T - Temporal namespace.
 * @param gridHasFocus - Whether the grid currently holds DOM focus.
 */
export function resolveFocusTarget(
  focusedDate: Temporal.PlainDate,
  selectedDate: Temporal.PlainDate | undefined,
  weeks: Temporal.PlainDate[][],
  currentMonth: { year: number; month: number },
  isDateDisabled: (date: Temporal.PlainDate) => boolean,
  T: TemporalNamespace,
  gridHasFocus = true,
): Temporal.PlainDate {
  const allDays = weeks.flat();
  const inGrid = (d: Temporal.PlainDate) =>
    allDays.some((g) => T.PlainDate.compare(g, d) === 0);

  if (gridHasFocus && inGrid(focusedDate)) return focusedDate;

  if (selectedDate && inGrid(selectedDate)) return selectedDate;

  if (!gridHasFocus && inGrid(focusedDate)) return focusedDate;

  const firstEnabled = allDays.find(
    (d) =>
      d.year === currentMonth.year &&
      d.month === currentMonth.month &&
      !isDateDisabled(d),
  );
  return firstEnabled ?? allDays[0] ?? focusedDate;
}

/**
 * Determines whether a day cell should imperatively receive DOM focus.
 *
 * Only returns `true` when the cell is the focused date **and** the grid
 * currently holds DOM focus (i.e. keyboard navigation is active).
 *
 * @param isFocused - Whether this cell is the logically focused date.
 * @param gridHasFocus - Whether the grid currently holds DOM focus.
 */
export function shouldMoveDomFocus(
  isFocused: boolean,
  gridHasFocus: boolean,
): boolean {
  return isFocused && gridHasFocus;
}

/**
 * Returns the normalized position of `date` within the inclusive range
 * `[rangeStart, rangeEnd]` as a number from `0` (start) to `1` (end),
 * or `false` if the date is outside the range.
 * A single-day range returns `0` for that date.
 *
 * @param date - The date to test.
 * @param rangeStart - Start of the range (inclusive). When `undefined` and `rangeEnd` is defined, the range collapses to a single-day range at `rangeEnd`.
 * @param rangeEnd - End of the range (inclusive). When `undefined` and `rangeStart` is defined, the range collapses to a single-day range at `rangeStart`. Returns `false` when both boundaries are `undefined`.
 * @param T - Temporal namespace used for date comparison.
 */
export function isInRange(
  date: Temporal.PlainDate,
  rangeStart: Temporal.PlainDate | undefined,
  rangeEnd: Temporal.PlainDate | undefined,
  T: TemporalNamespace,
): number | false {
  if (!rangeStart && !rangeEnd) return false;
  const effectiveStart = rangeStart ?? rangeEnd!;
  const effectiveEnd = rangeEnd ?? rangeStart!;
  if (
    T.PlainDate.compare(date, effectiveStart) < 0 ||
    T.PlainDate.compare(date, effectiveEnd) > 0
  )
    return false;
  const totalDays = effectiveEnd.since(effectiveStart).days;
  if (totalDays === 0) return 0;
  const offsetDays = date.since(effectiveStart).days;
  return offsetDays / totalDays;
}

/**
 * Computes how a date range intersects with a single calendar week row.
 *
 * Used to position and style the range highlight overlay within a week.
 *
 * @param weekDays - Array of 7 `PlainDate` values for the week (Sun–Sat).
 * @param rangeStart - Start of the selected range, or `undefined`.
 * @param rangeEnd - End of the selected range, or `undefined`.
 * @param T - Temporal namespace.
 * @returns An object with `active` (whether the range overlaps this week),
 *   `startIndex` / `endIndex` (0-based column positions), and
 *   `extendsBefore` / `extendsAfter` (whether the range continues beyond the week).
 */
export function computeWeekRangeInfo(
  weekDays: Temporal.PlainDate[],
  rangeStart: Temporal.PlainDate | undefined,
  rangeEnd: Temporal.PlainDate | undefined,
  T: TemporalNamespace,
): {
  active: boolean;
  startIndex: number;
  endIndex: number;
  extendsBefore: boolean;
  extendsAfter: boolean;
} {
  const inactive = {
    active: false,
    startIndex: 0,
    endIndex: 0,
    extendsBefore: false,
    extendsAfter: false,
  };
  if (weekDays.length === 0) return inactive;
  if (!rangeStart && !rangeEnd) return inactive;
  const effectiveStart = rangeStart ?? rangeEnd!;
  const effectiveEnd = rangeEnd ?? rangeStart!;

  const weekStart = weekDays[0];
  const weekEnd = weekDays[weekDays.length - 1];
  if (weekStart === undefined || weekEnd === undefined) return inactive;

  if (
    T.PlainDate.compare(effectiveEnd, weekStart) < 0 ||
    T.PlainDate.compare(effectiveStart, weekEnd) > 0
  ) {
    return inactive;
  }

  const extendsBefore = T.PlainDate.compare(effectiveStart, weekStart) < 0;
  const extendsAfter = T.PlainDate.compare(effectiveEnd, weekEnd) > 0;

  let startIndex = 0;
  if (!extendsBefore) {
    startIndex = weekDays.findIndex(
      (d) => T.PlainDate.compare(d, effectiveStart) === 0,
    );
    if (startIndex === -1) return inactive;
  }

  let endIndex = weekDays.length - 1;
  if (!extendsAfter) {
    endIndex = weekDays.findIndex(
      (d) => T.PlainDate.compare(d, effectiveEnd) === 0,
    );
    if (endIndex === -1) return inactive;
  }

  return { active: true, startIndex, endIndex, extendsBefore, extendsAfter };
}

/**
 * Generates localized weekday names starting from the configured week start day.
 *
 * @param locale - BCP 47 locale string (e.g. `"en-US"`).
 * @param T - Temporal namespace.
 * @param weekStartDay - 0=Sunday (default), 1=Monday, etc.
 * @returns An array of objects with `long`, `short`, and `narrow` name variants,
 *   one per day in the calendar's week (typically 7, but may differ for
 *   non-Gregorian calendars).
 */
export function getWeekdayNames(
  locale: string,
  T: TemporalNamespace,
  weekStartDay = 0,
) {
  const refStart = getReferenceWeekStart(T, weekStartDay);
  const daysInWeek = refStart.daysInWeek;
  const names: { long: string; short: string; narrow: string }[] = [];
  for (let i = 0; i < daysInWeek; i++) {
    const date = refStart.add({ days: i });
    names.push({
      long: date.toLocaleString(locale, { weekday: "long" }),
      short: date.toLocaleString(locale, { weekday: "short" }),
      narrow: date.toLocaleString(locale, { weekday: "narrow" }),
    });
  }
  return names;
}

/**
 * Computes the ISO 8601 week number for a given date.
 *
 * The ISO week number is determined by the Thursday of the date's ISO week.
 *
 * @param date - The date to compute the week number for.
 * @param T - Temporal namespace.
 */
export function getISOWeekNumber(
  date: Temporal.PlainDate,
  T: TemporalNamespace,
): number {
  // ISO dayOfWeek: 1=Mon...7=Sun
  // Find the Thursday of this ISO week
  const thursday = date.add({ days: 4 - date.dayOfWeek });
  // Jan 4 is always in ISO week 1
  const jan4 = T.PlainDate.from({ year: thursday.year, month: 1, day: 4 });
  const jan4Thursday = jan4.add({ days: 4 - jan4.dayOfWeek });
  const daysDiff = thursday.since(jan4Thursday, { largestUnit: "days" }).days;
  return Math.round(daysDiff / 7) + 1;
}
