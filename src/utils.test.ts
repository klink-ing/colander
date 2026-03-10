import { describe, it, expect } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import {
  calendarForLocale,
  resolveTemporal,
  getSystemTimeZone,
  toZonedDateTime,
  fromZonedDateTime,
  selectedToZdt,
  getMonthWeeks,
  zdtToNativeDate,
  sameCalendarDay,
  getReferenceSunday,
  computeAdjacentMonth,
  focusedDateForMonth,
  resolveFocusTarget,
  shouldMoveDomFocus,
  isInRange,
  computeWeekRangeInfo,
  getWeekdayNames,
} from "./utils";
import type { TemporalNamespace } from "./types";

const T: TemporalNamespace = {
  Now: Temporal.Now,
  PlainDate: Temporal.PlainDate,
  PlainDateTime: Temporal.PlainDateTime,
  PlainMonthDay: Temporal.PlainMonthDay,
  PlainYearMonth: Temporal.PlainYearMonth,
};

function date(iso: string): Temporal.PlainDate {
  return Temporal.PlainDate.from(iso);
}

describe("calendarForLocale", () => {
  it("returns 'gregory' for en-US", () => {
    expect(calendarForLocale("en-US")).toBe("gregory");
  });

  it("returns a calendar string for an empty locale (runtime default)", () => {
    const result = calendarForLocale("");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("resolveTemporal", () => {
  it("returns the provided namespace when given", () => {
    expect(resolveTemporal(T)).toBe(T);
  });

  it("throws when no namespace is provided and globalThis.Temporal is absent", () => {
    const orig = (globalThis as any).Temporal;
    delete (globalThis as any).Temporal;
    try {
      expect(() => resolveTemporal()).toThrow("Temporal is not available");
    } finally {
      if (orig) (globalThis as any).Temporal = orig;
    }
  });
});

describe("getSystemTimeZone", () => {
  it("returns a non-empty IANA time zone string", () => {
    const tz = getSystemTimeZone(T);
    expect(typeof tz).toBe("string");
    expect(tz.length).toBeGreaterThan(0);
  });
});

describe("toZonedDateTime", () => {
  const tz = "America/New_York";

  it("converts PlainDate to ZonedDateTime", () => {
    const pd = Temporal.PlainDate.from("2026-03-15");
    const zdt = toZonedDateTime({ format: "PlainDate", value: pd }, tz, T);
    expect(zdt.year).toBe(2026);
    expect(zdt.month).toBe(3);
    expect(zdt.day).toBe(15);
    expect(zdt.timeZoneId).toBe(tz);
  });

  it("converts PlainDateTime to ZonedDateTime", () => {
    const pdt = Temporal.PlainDateTime.from("2026-03-15T10:30:00");
    const zdt = toZonedDateTime({ format: "PlainDateTime", value: pdt }, tz, T);
    expect(zdt.year).toBe(2026);
    expect(zdt.hour).toBe(10);
    expect(zdt.minute).toBe(30);
    expect(zdt.timeZoneId).toBe(tz);
  });

  it("converts PlainMonthDay to ZonedDateTime (uses current year)", () => {
    const pmd = Temporal.PlainMonthDay.from({ month: 7, day: 4 });
    const zdt = toZonedDateTime({ format: "PlainMonthDay", value: pmd }, tz, T);
    expect(zdt.month).toBe(7);
    expect(zdt.day).toBe(4);
    expect(zdt.timeZoneId).toBe(tz);
  });

  it("converts PlainTime to ZonedDateTime (uses current date)", () => {
    const pt = Temporal.PlainTime.from("14:30:00");
    const zdt = toZonedDateTime({ format: "PlainTime", value: pt }, tz, T);
    expect(zdt.hour).toBe(14);
    expect(zdt.minute).toBe(30);
    expect(zdt.timeZoneId).toBe(tz);
  });

  it("converts PlainYearMonth to ZonedDateTime (day 1)", () => {
    const pym = Temporal.PlainYearMonth.from({ year: 2026, month: 6 });
    const zdt = toZonedDateTime(
      { format: "PlainYearMonth", value: pym },
      tz,
      T,
    );
    expect(zdt.year).toBe(2026);
    expect(zdt.month).toBe(6);
    expect(zdt.day).toBe(1);
  });

  it("passes through ZonedDateTime unchanged", () => {
    const orig = Temporal.PlainDate.from("2026-03-15").toZonedDateTime(tz);
    const zdt = toZonedDateTime(
      { format: "ZonedDateTime", value: orig },
      tz,
      T,
    );
    expect(Temporal.ZonedDateTime.compare(zdt, orig)).toBe(0);
  });

  it("converts a plain object to ZonedDateTime", () => {
    const obj = { year: 2026, month: 3, day: 15, hour: 10, minute: 0 };
    const zdt = toZonedDateTime({ format: "object", value: obj }, tz, T);
    expect(zdt.year).toBe(2026);
    expect(zdt.month).toBe(3);
    expect(zdt.day).toBe(15);
    expect(zdt.hour).toBe(10);
  });

  it("converts a plain object with partial fields (fills defaults)", () => {
    const zdt = toZonedDateTime({ format: "object", value: {} }, tz, T);
    expect(zdt.timeZoneId).toBe(tz);
    expect(zdt.year).toBeGreaterThan(2000);
  });

  it("converts a plain object with custom timeZone", () => {
    const obj = {
      year: 2026,
      month: 1,
      day: 1,
      timeZone: "Europe/London",
    };
    const zdt = toZonedDateTime({ format: "object", value: obj }, tz, T);
    expect(zdt.timeZoneId).toBe("Europe/London");
  });

  it("converts a native Date to ZonedDateTime", () => {
    const nativeDate = new Date(2026, 2, 15, 10, 30, 0);
    const zdt = toZonedDateTime(
      { format: "Date", value: nativeDate },
      tz,
      T,
    );
    expect(zdt.year).toBe(2026);
    expect(zdt.month).toBe(3);
    expect(zdt.day).toBe(15);
    expect(zdt.hour).toBe(10);
    expect(zdt.minute).toBe(30);
  });
});

describe("fromZonedDateTime", () => {
  const tz = "America/New_York";
  const zdt = Temporal.PlainDateTime.from(
    "2026-03-15T10:30:45",
  ).toZonedDateTime(tz);

  it("extracts PlainDate", () => {
    const result = fromZonedDateTime(zdt, "PlainDate", T);
    expect(result.format).toBe("PlainDate");
    expect(result.value.toString()).toBe("2026-03-15");
  });

  it("extracts PlainDateTime", () => {
    const result = fromZonedDateTime(zdt, "PlainDateTime", T);
    expect(result.format).toBe("PlainDateTime");
    expect((result.value as Temporal.PlainDateTime).hour).toBe(10);
  });

  it("extracts PlainMonthDay", () => {
    const result = fromZonedDateTime(zdt, "PlainMonthDay", T);
    expect(result.format).toBe("PlainMonthDay");
    const pmd = result.value as Temporal.PlainMonthDay;
    expect(pmd.monthCode).toBe("M03");
    expect(pmd.day).toBe(15);
  });

  it("extracts PlainTime", () => {
    const result = fromZonedDateTime(zdt, "PlainTime", T);
    expect(result.format).toBe("PlainTime");
    const pt = result.value as Temporal.PlainTime;
    expect(pt.hour).toBe(10);
    expect(pt.minute).toBe(30);
    expect(pt.second).toBe(45);
  });

  it("extracts PlainYearMonth", () => {
    const result = fromZonedDateTime(zdt, "PlainYearMonth", T);
    expect(result.format).toBe("PlainYearMonth");
    const pym = result.value as Temporal.PlainYearMonth;
    expect(pym.year).toBe(2026);
    expect(pym.month).toBe(3);
  });

  it("passes through ZonedDateTime", () => {
    const result = fromZonedDateTime(zdt, "ZonedDateTime", T);
    expect(result.format).toBe("ZonedDateTime");
    expect(Temporal.ZonedDateTime.compare(result.value as any, zdt)).toBe(0);
  });

  it("extracts a plain object with all fields", () => {
    const result = fromZonedDateTime(zdt, "object", T);
    expect(result.format).toBe("object");
    const obj = result.value as any;
    expect(obj.year).toBe(2026);
    expect(obj.month).toBe(3);
    expect(obj.day).toBe(15);
    expect(obj.hour).toBe(10);
    expect(obj.minute).toBe(30);
    expect(obj.second).toBe(45);
    expect(obj.timeZone).toBe(tz);
  });

  it("extracts a native Date", () => {
    const result = fromZonedDateTime(zdt, "Date", T);
    expect(result.format).toBe("Date");
    expect(result.value).toBeInstanceOf(Date);
    expect((result.value as Date).getFullYear()).toBe(2026);
  });

  it("round-trips: toZonedDateTime → fromZonedDateTime preserves PlainDate", () => {
    const pd = Temporal.PlainDate.from("2026-06-20");
    const intermediate = toZonedDateTime(
      { format: "PlainDate", value: pd },
      tz,
      T,
    );
    const result = fromZonedDateTime(intermediate, "PlainDate", T);
    expect(result.value.toString()).toBe("2026-06-20");
  });
});

describe("selectedToZdt", () => {
  const tz = "UTC";

  it("returns undefined when selected is undefined", () => {
    expect(selectedToZdt(undefined, tz, T)).toBeUndefined();
  });

  it("converts a DateValueObject to ZonedDateTime", () => {
    const pd = Temporal.PlainDate.from("2026-03-15");
    const result = selectedToZdt({ format: "PlainDate", value: pd }, tz, T);
    expect(result).toBeDefined();
    expect(result!.year).toBe(2026);
    expect(result!.month).toBe(3);
    expect(result!.day).toBe(15);
  });
});

describe("zdtToNativeDate", () => {
  it("converts a ZonedDateTime to a native Date with the correct epoch", () => {
    const zdt = Temporal.PlainDateTime.from(
      "2026-01-01T00:00:00",
    ).toZonedDateTime("UTC");
    const native = zdtToNativeDate(zdt);
    expect(native).toBeInstanceOf(Date);
    expect(native.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("preserves millisecond precision", () => {
    const zdt = Temporal.PlainDateTime.from(
      "2026-06-15T12:30:00",
    ).toZonedDateTime("UTC");
    const native = zdtToNativeDate(zdt);
    expect(native.getUTCHours()).toBe(12);
    expect(native.getUTCMinutes()).toBe(30);
  });
});

describe("sameCalendarDay", () => {
  it("returns true when year, month, and day match", () => {
    const zdt = Temporal.PlainDateTime.from(
      "2026-03-15T10:00:00",
    ).toZonedDateTime("UTC");
    const pd = Temporal.PlainDate.from("2026-03-15");
    expect(sameCalendarDay(zdt, pd)).toBe(true);
  });

  it("returns true even when times differ", () => {
    const zdt = Temporal.PlainDateTime.from(
      "2026-03-15T23:59:59",
    ).toZonedDateTime("UTC");
    const pd = Temporal.PlainDate.from("2026-03-15");
    expect(sameCalendarDay(zdt, pd)).toBe(true);
  });

  it("returns false when days differ", () => {
    const zdt = Temporal.PlainDateTime.from(
      "2026-03-15T10:00:00",
    ).toZonedDateTime("UTC");
    const pd = Temporal.PlainDate.from("2026-03-16");
    expect(sameCalendarDay(zdt, pd)).toBe(false);
  });

  it("returns false when months differ", () => {
    const zdt = Temporal.PlainDateTime.from(
      "2026-03-15T10:00:00",
    ).toZonedDateTime("UTC");
    const pd = Temporal.PlainDate.from("2026-04-15");
    expect(sameCalendarDay(zdt, pd)).toBe(false);
  });

  it("returns false when years differ", () => {
    const zdt = Temporal.PlainDateTime.from(
      "2026-03-15T10:00:00",
    ).toZonedDateTime("UTC");
    const pd = Temporal.PlainDate.from("2027-03-15");
    expect(sameCalendarDay(zdt, pd)).toBe(false);
  });
});

describe("getReferenceSunday", () => {
  it("returns 2024-01-07", () => {
    expect(getReferenceSunday(T).toString()).toBe("2024-01-07");
  });

  it("is actually a Sunday (ISO dayOfWeek 7)", () => {
    expect(getReferenceSunday(T).dayOfWeek).toBe(7);
  });
});

describe("getWeekdayNames", () => {
  it("returns exactly 7 entries", () => {
    expect(getWeekdayNames("en-US", T)).toHaveLength(7);
  });

  it("starts with Sunday for en-US", () => {
    const names = getWeekdayNames("en-US", T);
    expect(names[0].long).toBe("Sunday");
    expect(names[0].short).toBe("Sun");
    expect(names[0].narrow).toBe("S");
  });

  it("ends with Saturday for en-US", () => {
    const names = getWeekdayNames("en-US", T);
    expect(names[6].long).toBe("Saturday");
  });

  it("contains all 7 unique long names", () => {
    const names = getWeekdayNames("en-US", T);
    const longs = names.map((n) => n.long);
    expect(new Set(longs).size).toBe(7);
  });

  it("each entry has long, short, and narrow properties", () => {
    const names = getWeekdayNames("en-US", T);
    for (const name of names) {
      expect(typeof name.long).toBe("string");
      expect(typeof name.short).toBe("string");
      expect(typeof name.narrow).toBe("string");
      expect(name.long.length).toBeGreaterThan(0);
      expect(name.short.length).toBeGreaterThan(0);
      expect(name.narrow.length).toBeGreaterThan(0);
    }
  });

  it("produces localized names for a non-English locale", () => {
    const names = getWeekdayNames("de-DE", T);
    expect(names[0].long).toBe("Sonntag");
  });
});

describe("computeAdjacentMonth", () => {
  it.each<{
    description: string;
    current: { year: number; month: number };
    direction: "prev" | "next";
    expected: { year: number; month: number; firstDay: string };
  }>([
    { description: "mid-year next", current: { year: 2026, month: 3 }, direction: "next", expected: { year: 2026, month: 4, firstDay: "2026-04-01" } },
    { description: "mid-year prev", current: { year: 2026, month: 3 }, direction: "prev", expected: { year: 2026, month: 2, firstDay: "2026-02-01" } },
    { description: "Dec→Jan wrap", current: { year: 2026, month: 12 }, direction: "next", expected: { year: 2027, month: 1, firstDay: "2027-01-01" } },
    { description: "Jan→Dec wrap", current: { year: 2027, month: 1 }, direction: "prev", expected: { year: 2026, month: 12, firstDay: "2026-12-01" } },
  ])(
    "$description",
    ({ current, direction, expected }) => {
      const result = computeAdjacentMonth(current, direction, T);
      expect(result.year).toBe(expected.year);
      expect(result.month).toBe(expected.month);
      expect(result.firstDay.toString()).toBe(expected.firstDay);
    },
  );
});

describe("focusedDateForMonth", () => {
  it.each<{
    description: string;
    focused: string;
    targetMonth: { year: number; month: number };
    firstDay: string;
    expected: string;
  }>([
    { description: "falls back to firstDay when in a different month", focused: "2026-03-15", targetMonth: { year: 2026, month: 4 }, firstDay: "2026-04-01", expected: "2026-04-01" },
    { description: "preserves focused when already in target month", focused: "2026-04-10", targetMonth: { year: 2026, month: 4 }, firstDay: "2026-04-01", expected: "2026-04-10" },
    { description: "falls back to firstDay when in a different year", focused: "2025-12-20", targetMonth: { year: 2026, month: 1 }, firstDay: "2026-01-01", expected: "2026-01-01" },
    { description: "preserves focused at month boundary (day 1)", focused: "2026-05-01", targetMonth: { year: 2026, month: 5 }, firstDay: "2026-05-01", expected: "2026-05-01" },
    { description: "preserves focused at month boundary (last day)", focused: "2026-05-31", targetMonth: { year: 2026, month: 5 }, firstDay: "2026-05-01", expected: "2026-05-31" },
  ])(
    "$description",
    ({ focused, targetMonth, firstDay, expected }) => {
      const result = focusedDateForMonth(
        date(focused),
        targetMonth,
        date(firstDay),
      );
      expect(result.toString()).toBe(expected);
    },
  );
});

describe("getMonthWeeks", () => {
  it("returns weeks with 7 days each", () => {
    const weeks = getMonthWeeks(2026, 3, T);
    for (const week of weeks) {
      expect(week).toHaveLength(7);
    }
  });

  it("returns between 4 and 6 weeks for any month", () => {
    for (let month = 1; month <= 12; month++) {
      const weeks = getMonthWeeks(2026, month, T);
      expect(weeks.length).toBeGreaterThanOrEqual(4);
      expect(weeks.length).toBeLessThanOrEqual(6);
    }
  });

  it("starts each week on Sunday (dayOfWeek === 7 in ISO)", () => {
    const weeks = getMonthWeeks(2026, 3, T);
    for (const week of weeks) {
      expect(week[0].dayOfWeek).toBe(7);
    }
  });

  it("ends each week on Saturday (dayOfWeek === 6 in ISO)", () => {
    const weeks = getMonthWeeks(2026, 3, T);
    for (const week of weeks) {
      expect(week[6].dayOfWeek).toBe(6);
    }
  });

  it("includes the first and last day of the month", () => {
    const weeks = getMonthWeeks(2026, 3, T);
    const allDays = weeks.flat();
    const hasFirst = allDays.some((d) => d.toString() === "2026-03-01");
    const hasLast = allDays.some((d) => d.toString() === "2026-03-31");
    expect(hasFirst).toBe(true);
    expect(hasLast).toBe(true);
  });

  it("February 2026 has exactly 4 weeks (starts on Sunday)", () => {
    const weeks = getMonthWeeks(2026, 2, T);
    expect(weeks.length).toBe(4);
  });

  it("month navigation + focus: simulates prev/next and verifies a focusable day exists", () => {
    const current = { year: 2026, month: 3 };
    const focusedDate = date("2026-03-15");

    const next = computeAdjacentMonth(current, "next", T);
    const newFocused = focusedDateForMonth(focusedDate, next, next.firstDay);
    const nextWeeks = getMonthWeeks(next.year, next.month, T);
    const allNextDays = nextWeeks.flat();

    expect(
      allNextDays.some((d) => Temporal.PlainDate.compare(d, newFocused) === 0),
    ).toBe(true);

    const prev = computeAdjacentMonth(current, "prev", T);
    const prevFocused = focusedDateForMonth(focusedDate, prev, prev.firstDay);
    const prevWeeks = getMonthWeeks(prev.year, prev.month, T);
    const allPrevDays = prevWeeks.flat();

    expect(
      allPrevDays.some((d) => Temporal.PlainDate.compare(d, prevFocused) === 0),
    ).toBe(true);
  });
});

describe("resolveFocusTarget", () => {
  const noDisabled = () => false;
  const marchWeeks = getMonthWeeks(2026, 3, T);
  const march = { year: 2026, month: 3 };

  it("priority 1: returns focusedDate when it is in the grid", () => {
    const result = resolveFocusTarget(
      date("2026-03-15"),
      undefined,
      marchWeeks,
      march,
      noDisabled,
      T,
    );
    expect(result.toString()).toBe("2026-03-15");
  });

  it("priority 1: returns focusedDate even if selectedDate differs", () => {
    const result = resolveFocusTarget(
      date("2026-03-10"),
      date("2026-03-20"),
      marchWeeks,
      march,
      noDisabled,
      T,
    );
    expect(result.toString()).toBe("2026-03-10");
  });

  it("priority 2: falls back to selectedDate when focusedDate is not in grid", () => {
    const result = resolveFocusTarget(
      date("2026-04-15"),
      date("2026-03-20"),
      marchWeeks,
      march,
      noDisabled,
      T,
    );
    expect(result.toString()).toBe("2026-03-20");
  });

  it("priority 3: falls back to first enabled day of the month when neither focused nor selected is in grid", () => {
    const result = resolveFocusTarget(
      date("2026-04-15"),
      date("2026-04-20"),
      marchWeeks,
      march,
      noDisabled,
      T,
    );
    expect(result.toString()).toBe("2026-03-01");
  });

  it("priority 3: skips disabled days at the start of the month", () => {
    const disableFirst3 = (d: Temporal.PlainDate) =>
      d.year === 2026 && d.month === 3 && d.day <= 3;
    const result = resolveFocusTarget(
      date("2026-04-15"),
      undefined,
      marchWeeks,
      march,
      disableFirst3,
      T,
    );
    expect(result.toString()).toBe("2026-03-04");
  });

  it("priority 2: selected outside-month day in grid is still valid", () => {
    const allDays = marchWeeks.flat();
    const outsideDay = allDays.find((d) => d.month !== 3);
    if (!outsideDay) return;
    const result = resolveFocusTarget(
      date("2026-05-01"),
      outsideDay,
      marchWeeks,
      march,
      noDisabled,
      T,
    );
    expect(result.toString()).toBe(outsideDay.toString());
  });

  it("falls back to first grid day when all current-month days are disabled", () => {
    const allDisabled = (d: Temporal.PlainDate) =>
      d.year === 2026 && d.month === 3;
    const result = resolveFocusTarget(
      date("2026-05-01"),
      undefined,
      marchWeeks,
      march,
      allDisabled,
      T,
    );
    const firstGridDay = marchWeeks[0][0];
    expect(result.toString()).toBe(firstGridDay.toString());
  });

  it("gridHasFocus=false: selectedDate wins over focusedDate when tabbing into grid", () => {
    const result = resolveFocusTarget(
      date("2026-03-01"),
      date("2026-03-20"),
      marchWeeks,
      march,
      noDisabled,
      T,
      false,
    );
    expect(result.toString()).toBe("2026-03-20");
  });

  it("gridHasFocus=false: focusedDate used as fallback when no selectedDate", () => {
    const result = resolveFocusTarget(
      date("2026-03-10"),
      undefined,
      marchWeeks,
      march,
      noDisabled,
      T,
      false,
    );
    expect(result.toString()).toBe("2026-03-10");
  });

  it("gridHasFocus=true: focusedDate wins over selectedDate (keyboard nav)", () => {
    const result = resolveFocusTarget(
      date("2026-03-01"),
      date("2026-03-20"),
      marchWeeks,
      march,
      noDisabled,
      T,
      true,
    );
    expect(result.toString()).toBe("2026-03-01");
  });
});

describe("shouldMoveDomFocus", () => {
  it.each<{
    description: string;
    isFocused: boolean;
    gridHasFocus: boolean;
    expected: boolean;
  }>([
    { description: "focused + grid has focus → true (keyboard nav)", isFocused: true, gridHasFocus: true, expected: true },
    { description: "focused + grid blurred → false (nav button click)", isFocused: true, gridHasFocus: false, expected: false },
    { description: "not focused + grid has focus → false", isFocused: false, gridHasFocus: true, expected: false },
    { description: "not focused + grid blurred → false", isFocused: false, gridHasFocus: false, expected: false },
  ])(
    "$description",
    ({ isFocused, gridHasFocus, expected }) => {
      expect(shouldMoveDomFocus(isFocused, gridHasFocus)).toBe(expected);
    },
  );
});

describe("isInRange", () => {
  const start = date("2026-03-10");
  const end = date("2026-03-20");

  it.each<{
    description: string;
    d: string;
    s: string;
    e: string;
    expected: boolean;
  }>([
    { description: "before range", d: "2026-03-05", s: "2026-03-10", e: "2026-03-20", expected: false },
    { description: "at range start (inclusive)", d: "2026-03-10", s: "2026-03-10", e: "2026-03-20", expected: true },
    { description: "middle of range", d: "2026-03-15", s: "2026-03-10", e: "2026-03-20", expected: true },
    { description: "at range end (inclusive)", d: "2026-03-20", s: "2026-03-10", e: "2026-03-20", expected: true },
    { description: "after range", d: "2026-03-25", s: "2026-03-10", e: "2026-03-20", expected: false },
    { description: "one day before start", d: "2026-03-09", s: "2026-03-10", e: "2026-03-20", expected: false },
    { description: "one day after end", d: "2026-03-21", s: "2026-03-10", e: "2026-03-20", expected: false },
    { description: "two-day range start endpoint", d: "2026-03-10", s: "2026-03-10", e: "2026-03-11", expected: true },
    { description: "two-day range end endpoint", d: "2026-03-11", s: "2026-03-10", e: "2026-03-11", expected: true },
    { description: "single-day range (start = end = date)", d: "2026-03-15", s: "2026-03-15", e: "2026-03-15", expected: true },
  ])("$description", ({ d, s, e, expected }) => {
    expect(isInRange(date(d), date(s), date(e), T)).toBe(expected);
  });

  it("returns false when rangeStart is undefined", () => {
    expect(isInRange(date("2026-03-15"), undefined, end, T)).toBe(false);
  });

  it("returns false when rangeEnd is undefined", () => {
    expect(isInRange(date("2026-03-15"), start, undefined, T)).toBe(false);
  });

  it("returns false when both are undefined", () => {
    expect(isInRange(date("2026-03-15"), undefined, undefined, T)).toBe(false);
  });
});

describe("computeWeekRangeInfo", () => {
  const marchWeeks = getMonthWeeks(2026, 3, T);
  const week1 = marchWeeks[1];

  it("returns inactive when rangeStart is undefined", () => {
    const result = computeWeekRangeInfo(
      week1,
      undefined,
      date("2026-03-15"),
      T,
    );
    expect(result.active).toBe(false);
  });

  it("returns inactive when rangeEnd is undefined", () => {
    const result = computeWeekRangeInfo(
      week1,
      date("2026-03-08"),
      undefined,
      T,
    );
    expect(result.active).toBe(false);
  });

  it("returns inactive when range has no overlap with week", () => {
    const result = computeWeekRangeInfo(
      week1,
      date("2026-04-01"),
      date("2026-04-10"),
      T,
    );
    expect(result.active).toBe(false);
  });

  it("range fully within week", () => {
    const result = computeWeekRangeInfo(
      week1,
      date("2026-03-09"),
      date("2026-03-12"),
      T,
    );
    expect(result.active).toBe(true);
    expect(result.extendsBefore).toBe(false);
    expect(result.extendsAfter).toBe(false);
    const startDay = week1[result.startIndex];
    const endDay = week1[result.endIndex];
    expect(startDay.toString()).toBe("2026-03-09");
    expect(endDay.toString()).toBe("2026-03-12");
  });

  it("range starts before week", () => {
    const result = computeWeekRangeInfo(
      week1,
      date("2026-03-01"),
      date("2026-03-12"),
      T,
    );
    expect(result.active).toBe(true);
    expect(result.extendsBefore).toBe(true);
    expect(result.extendsAfter).toBe(false);
    expect(result.startIndex).toBe(0);
  });

  it("range ends after week", () => {
    const result = computeWeekRangeInfo(
      week1,
      date("2026-03-09"),
      date("2026-03-25"),
      T,
    );
    expect(result.active).toBe(true);
    expect(result.extendsBefore).toBe(false);
    expect(result.extendsAfter).toBe(true);
    expect(result.endIndex).toBe(week1.length - 1);
  });

  it("range spans entire week", () => {
    const result = computeWeekRangeInfo(
      week1,
      date("2026-03-01"),
      date("2026-03-25"),
      T,
    );
    expect(result.active).toBe(true);
    expect(result.extendsBefore).toBe(true);
    expect(result.extendsAfter).toBe(true);
    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(week1.length - 1);
  });

  it("single-day range within week", () => {
    const singleDay = date("2026-03-10");
    const result = computeWeekRangeInfo(week1, singleDay, singleDay, T);
    expect(result.active).toBe(true);
    expect(result.startIndex).toBe(result.endIndex);
    expect(result.extendsBefore).toBe(false);
    expect(result.extendsAfter).toBe(false);
  });

  it("two-day range within week", () => {
    const result = computeWeekRangeInfo(
      week1,
      date("2026-03-10"),
      date("2026-03-11"),
      T,
    );
    expect(result.active).toBe(true);
    expect(result.endIndex - result.startIndex).toBe(1);
  });

  it("returns inactive for empty weekDays array", () => {
    const result = computeWeekRangeInfo(
      [],
      date("2026-03-10"),
      date("2026-03-15"),
      T,
    );
    expect(result.active).toBe(false);
  });
});
