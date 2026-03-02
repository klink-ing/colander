import { describe, it, expect } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import {
  computeAdjacentMonth,
  focusedDateForMonth,
  getMonthWeeks,
  resolveFocusTarget,
} from "./utils";
import type { TemporalNamespace } from "./types";

const T: TemporalNamespace = {
  Now: Temporal.Now,
  PlainDate: Temporal.PlainDate,
  PlainDateTime: Temporal.PlainDateTime,
  PlainMonthDay: Temporal.PlainMonthDay,
  PlainTime: Temporal.PlainTime,
  PlainYearMonth: Temporal.PlainYearMonth,
  ZonedDateTime: Temporal.ZonedDateTime,
};

function date(iso: string): Temporal.PlainDate {
  return Temporal.PlainDate.from(iso);
}

describe("computeAdjacentMonth", () => {
  it("computes the next month from a mid-year month", () => {
    const result = computeAdjacentMonth({ year: 2026, month: 3 }, "next", T);
    expect(result.year).toBe(2026);
    expect(result.month).toBe(4);
    expect(result.firstDay.toString()).toBe("2026-04-01");
  });

  it("computes the previous month from a mid-year month", () => {
    const result = computeAdjacentMonth({ year: 2026, month: 3 }, "prev", T);
    expect(result.year).toBe(2026);
    expect(result.month).toBe(2);
    expect(result.firstDay.toString()).toBe("2026-02-01");
  });

  it("wraps from December to January (next)", () => {
    const result = computeAdjacentMonth({ year: 2026, month: 12 }, "next", T);
    expect(result.year).toBe(2027);
    expect(result.month).toBe(1);
    expect(result.firstDay.toString()).toBe("2027-01-01");
  });

  it("wraps from January to December (prev)", () => {
    const result = computeAdjacentMonth({ year: 2027, month: 1 }, "prev", T);
    expect(result.year).toBe(2026);
    expect(result.month).toBe(12);
    expect(result.firstDay.toString()).toBe("2026-12-01");
  });
});

describe("focusedDateForMonth", () => {
  it("returns firstDay when focused date is in a different month", () => {
    const focused = date("2026-03-15");
    const firstDay = date("2026-04-01");
    const result = focusedDateForMonth(
      focused,
      { year: 2026, month: 4 },
      firstDay,
    );
    expect(result.toString()).toBe("2026-04-01");
  });

  it("preserves focused date when it is already in the target month", () => {
    const focused = date("2026-04-10");
    const firstDay = date("2026-04-01");
    const result = focusedDateForMonth(
      focused,
      { year: 2026, month: 4 },
      firstDay,
    );
    expect(result.toString()).toBe("2026-04-10");
  });

  it("returns firstDay when focused date is in a different year", () => {
    const focused = date("2025-12-20");
    const firstDay = date("2026-01-01");
    const result = focusedDateForMonth(
      focused,
      { year: 2026, month: 1 },
      firstDay,
    );
    expect(result.toString()).toBe("2026-01-01");
  });

  it("preserves focused date at month boundaries (day 1)", () => {
    const focused = date("2026-05-01");
    const firstDay = date("2026-05-01");
    const result = focusedDateForMonth(
      focused,
      { year: 2026, month: 5 },
      firstDay,
    );
    expect(result.toString()).toBe("2026-05-01");
  });

  it("preserves focused date at month boundaries (last day)", () => {
    const focused = date("2026-05-31");
    const firstDay = date("2026-05-01");
    const result = focusedDateForMonth(
      focused,
      { year: 2026, month: 5 },
      firstDay,
    );
    expect(result.toString()).toBe("2026-05-31");
  });
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
});
