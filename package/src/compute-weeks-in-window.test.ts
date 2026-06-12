import { Temporal } from "@js-temporal/polyfill";
import { assert, describe, it, expect } from "vitest";
import { computeWeeksInWindow } from "./compute-weeks-in-window";

const T = Temporal;

describe("computeWeeksInWindow", () => {
  it.each([
    {
      description: "8 weeks starting from a Sunday",
      firstWeek: T.PlainDate.from("2026-03-01"), // Sunday
      weekCount: 8,
      weekStartDay: 0 as const,
      expected: {
        length: 8,
        firstStart: "2026-03-01",
        firstEnd: "2026-03-07",
        lastStart: "2026-04-19",
        lastEnd: "2026-04-25",
      },
    },
    {
      description: "8 weeks starting mid-week, snaps back to week start",
      firstWeek: T.PlainDate.from("2026-03-04"), // Wednesday
      weekCount: 8,
      weekStartDay: 0 as const,
      expected: {
        length: 8,
        firstStart: "2026-03-01",
        firstEnd: "2026-03-07",
        lastStart: "2026-04-19",
        lastEnd: "2026-04-25",
      },
    },
    {
      description: "Monday week start",
      firstWeek: T.PlainDate.from("2026-03-04"), // Wednesday
      weekCount: 4,
      weekStartDay: 1 as const,
      expected: {
        length: 4,
        firstStart: "2026-03-02",
        firstEnd: "2026-03-08",
        lastStart: "2026-03-23",
        lastEnd: "2026-03-29",
      },
    },
    {
      description: "single week",
      firstWeek: T.PlainDate.from("2026-01-15"),
      weekCount: 1,
      weekStartDay: 0 as const,
      expected: {
        length: 1,
        firstStart: "2026-01-11",
        firstEnd: "2026-01-17",
        lastStart: "2026-01-11",
        lastEnd: "2026-01-17",
      },
    },
  ])("$description", ({ firstWeek, weekCount, weekStartDay, expected }) => {
    const weeks = computeWeeksInWindow(firstWeek, weekCount, weekStartDay, T);
    expect(weeks).toHaveLength(expected.length);
    const firstWeekData = weeks[0];
    const lastWeekData = weeks[weeks.length - 1];
    assert(firstWeekData && lastWeekData, "expected at least one week");
    expect(firstWeekData.startDate.toString()).toBe(expected.firstStart);
    expect(firstWeekData.endDate.toString()).toBe(expected.firstEnd);
    expect(lastWeekData.startDate.toString()).toBe(expected.lastStart);
    expect(lastWeekData.endDate.toString()).toBe(expected.lastEnd);
  });

  it("assigns correct month/year to each week based on start date", () => {
    const weeks = computeWeeksInWindow(T.PlainDate.from("2026-03-29"), 1, 0, T);
    const week = weeks[0];
    assert(week, "expected one week");
    expect(week.startDate.toString()).toBe("2026-03-29");
    expect(week.month).toBe(3);
    expect(week.year).toBe(2026);
  });

  it("populates weekIndex sequentially from 0", () => {
    const weeks = computeWeeksInWindow(T.PlainDate.from("2026-03-01"), 5, 0, T);
    weeks.forEach((w, i) => {
      expect(w.weekIndex).toBe(i);
    });
  });
});
