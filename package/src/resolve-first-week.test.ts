import { Temporal } from "@js-temporal/polyfill";
import { describe, it, expect } from "vitest";
import { resolveFirstWeekSpec, resolveFirstWeek } from "./resolve-first-week";

const T = Temporal;

describe("resolveFirstWeekSpec", () => {
  it.each([
    {
      description: "PlainDate — returns containing week start (Sunday)",
      spec: T.PlainDate.from("2026-03-04"), // Wednesday
      weekStartDay: 0 as const,
      expected: "2026-03-01", // Sunday
    },
    {
      description: "PlainDate — returns containing week start (Monday)",
      spec: T.PlainDate.from("2026-03-04"), // Wednesday
      weekStartDay: 1 as const,
      expected: "2026-03-02", // Monday
    },
    {
      description: "PlainDate on week start day — no snap",
      spec: T.PlainDate.from("2026-03-01"), // Sunday
      weekStartDay: 0 as const,
      expected: "2026-03-01",
    },
    {
      description: "ISO week spec",
      spec: { isoWeek: 10, isoYear: 2026 },
      weekStartDay: 0 as const,
      // ISO week 10 of 2026 starts Monday March 2. Snap to Sunday March 1.
      expected: "2026-03-01",
    },
    {
      description: "week-of-year spec (Sunday start)",
      spec: { week: 1, year: 2026 },
      weekStartDay: 0 as const,
      // First Sunday of 2026 is Jan 4
      expected: "2026-01-04",
    },
    {
      description: "month+year spec — first week containing a day in that month",
      spec: { month: 3, year: 2026 },
      weekStartDay: 0 as const,
      expected: "2026-03-01",
    },
    {
      description: "month+year+day spec — week containing that day",
      spec: { month: 3, year: 2026, day: 15 },
      weekStartDay: 0 as const,
      expected: "2026-03-15",
    },
    {
      description: "native Date object",
      spec: new Date(2026, 2, 4), // March 4, 2026 in local time
      weekStartDay: 0 as const,
      expected: "2026-03-01",
    },
  ])("$description", ({ spec, weekStartDay, expected }) => {
    const result = resolveFirstWeekSpec(spec, weekStartDay, T);
    expect(result.toString()).toBe(expected);
  });
});

describe("resolveFirstWeek", () => {
  it.each([
    {
      description: "snap start — target week becomes first row",
      currentFirstWeek: T.PlainDate.from("2026-01-04"),
      weekCount: 8,
      target: T.PlainDate.from("2026-03-15"),
      snap: "start" as const,
      expected: "2026-03-15",
    },
    {
      description: "snap center — target week centered in window",
      currentFirstWeek: T.PlainDate.from("2026-01-04"),
      weekCount: 8,
      target: T.PlainDate.from("2026-03-15"),
      snap: "center" as const,
      expected: "2026-02-15",
    },
    {
      description: "snap end — target week becomes last row",
      currentFirstWeek: T.PlainDate.from("2026-01-04"),
      weekCount: 8,
      target: T.PlainDate.from("2026-03-15"),
      snap: "end" as const,
      expected: "2026-01-25",
    },
    {
      description: "snap nearest — already visible, no change",
      currentFirstWeek: T.PlainDate.from("2026-03-01"),
      weekCount: 8,
      target: T.PlainDate.from("2026-03-15"),
      snap: "nearest" as const,
      expected: "2026-03-01",
    },
    {
      description: "snap nearest — target above window, becomes first row",
      currentFirstWeek: T.PlainDate.from("2026-04-01"),
      weekCount: 8,
      target: T.PlainDate.from("2026-03-15"),
      snap: "nearest" as const,
      expected: "2026-03-15",
    },
    {
      description: "snap nearest — target below window, becomes last row",
      currentFirstWeek: T.PlainDate.from("2026-01-04"),
      weekCount: 4,
      target: T.PlainDate.from("2026-03-15"),
      snap: "nearest" as const,
      expected: "2026-02-22",
    },
    {
      description: "default snap is start",
      currentFirstWeek: T.PlainDate.from("2026-01-04"),
      weekCount: 8,
      target: T.PlainDate.from("2026-03-15"),
      snap: undefined,
      expected: "2026-03-15",
    },
  ])("$description", ({ currentFirstWeek, weekCount, target, snap, expected }) => {
    const result = resolveFirstWeek(
      currentFirstWeek,
      weekCount,
      target,
      snap ? { snap } : undefined,
    );
    expect(result.toString()).toBe(expected);
  });
});
