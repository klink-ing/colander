import type { Temporal } from "@js-temporal/polyfill";
import type { TemporalNamespace, DateValueObject, ValueFormat } from "./types";

export function calendarForLocale(locale: string): string {
  return new Intl.DateTimeFormat(locale || undefined).resolvedOptions()
    .calendar;
}

export function resolveTemporal(
  provided?: TemporalNamespace,
): TemporalNamespace {
  if (provided) return provided;
  if (typeof globalThis !== "undefined" && (globalThis as any).Temporal) {
    return (globalThis as any).Temporal;
  }
  throw new Error(
    "DatePicker: Temporal is not available. Pass a Temporal polyfill via the `temporal` option to createDatePicker, or use a browser that supports the Temporal API natively.",
  );
}

export function getSystemTimeZone(T: TemporalNamespace): string {
  return T.Now.timeZoneId();
}

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

export function selectedToZdt(
  selected: DateValueObject | undefined,
  timeZone: string,
  T: TemporalNamespace,
): Temporal.ZonedDateTime | undefined {
  if (!selected) return undefined;
  return toZonedDateTime(selected, timeZone, T);
}

export function getMonthWeeks(
  year: number,
  month: number,
  T: TemporalNamespace,
): Temporal.PlainDate[][] {
  const firstOfMonth = T.PlainDate.from({ year, month, day: 1 });
  const daysInMonth = firstOfMonth.daysInMonth;
  const lastOfMonth = T.PlainDate.from({ year, month, day: daysInMonth });

  const isoDow = firstOfMonth.dayOfWeek;
  const sundayDow = isoDow % 7;
  const gridStart = firstOfMonth.subtract({ days: sundayDow });

  const isoLast = lastOfMonth.dayOfWeek;
  const sundayLast = isoLast % 7;
  const daysAfter = 6 - sundayLast;
  const gridEnd = lastOfMonth.add({ days: daysAfter });

  const weeks: Temporal.PlainDate[][] = [];
  let current = gridStart;
  while (T.PlainDate.compare(current, gridEnd) <= 0) {
    const week: Temporal.PlainDate[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(current);
      current = current.add({ days: 1 });
    }
    weeks.push(week);
  }
  return weeks;
}

export function zdtToNativeDate(zdt: Temporal.ZonedDateTime): Date {
  return new Date(zdt.epochMilliseconds);
}

export function sameCalendarDay(
  a: Temporal.ZonedDateTime,
  b: Temporal.PlainDate,
): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export function getReferenceSunday(T: TemporalNamespace): Temporal.PlainDate {
  return T.PlainDate.from("2024-01-07");
}

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
  return firstEnabled ?? allDays[0];
}

export function shouldMoveDomFocus(
  isFocused: boolean,
  gridHasFocus: boolean,
): boolean {
  return isFocused && gridHasFocus;
}

export function isInRange(
  date: Temporal.PlainDate,
  rangeStart: Temporal.PlainDate | undefined,
  rangeEnd: Temporal.PlainDate | undefined,
  T: TemporalNamespace,
): boolean {
  if (!rangeStart || !rangeEnd) return false;
  return (
    T.PlainDate.compare(date, rangeStart) > 0 &&
    T.PlainDate.compare(date, rangeEnd) < 0
  );
}

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
  if (!rangeStart || !rangeEnd || weekDays.length === 0) return inactive;

  const weekStart = weekDays[0];
  const weekEnd = weekDays[weekDays.length - 1];

  if (
    T.PlainDate.compare(rangeEnd, weekStart) < 0 ||
    T.PlainDate.compare(rangeStart, weekEnd) > 0
  ) {
    return inactive;
  }

  const extendsBefore = T.PlainDate.compare(rangeStart, weekStart) < 0;
  const extendsAfter = T.PlainDate.compare(rangeEnd, weekEnd) > 0;

  let startIndex = 0;
  if (!extendsBefore) {
    startIndex = weekDays.findIndex(
      (d) => T.PlainDate.compare(d, rangeStart) === 0,
    );
    if (startIndex === -1) return inactive;
  }

  let endIndex = weekDays.length - 1;
  if (!extendsAfter) {
    endIndex = weekDays.findIndex(
      (d) => T.PlainDate.compare(d, rangeEnd) === 0,
    );
    if (endIndex === -1) return inactive;
  }

  return { active: true, startIndex, endIndex, extendsBefore, extendsAfter };
}

export function getWeekdayNames(locale: string, T: TemporalNamespace) {
  const refSunday = getReferenceSunday(T);
  const names: { long: string; short: string; narrow: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const date = refSunday.add({ days: i });
    names.push({
      long: date.toLocaleString(locale, { weekday: "long" }),
      short: date.toLocaleString(locale, { weekday: "short" }),
      narrow: date.toLocaleString(locale, { weekday: "narrow" }),
    });
  }
  return names;
}
