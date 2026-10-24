import { Temporal } from "@js-temporal/polyfill";
import { describe, it, expect } from "vitest";
import { applyOutOfRange, type OutOfRangeBehavior } from "./out-of-range";

const T = Temporal;
const pd = (s: string) => T.PlainDate.from(s);

describe("applyOutOfRange", () => {
  const min = pd("2025-12-01");
  const max = pd("2026-01-10");

  it.each([
    {
      description: "unbounded — no adjustment",
      targetFirstWeek: pd("2026-02-01"),
      weekCount: 8,
      behavior: "unbounded" as OutOfRangeBehavior,
      useMinMax: "both" as const,
      expected: { firstWeek: "2026-02-01", weekCount: 8 },
    },
    {
      description: "stop — target has valid weeks, allowed",
      targetFirstWeek: pd("2025-12-07"),
      weekCount: 8,
      behavior: "stop" as OutOfRangeBehavior,
      useMinMax: "both" as const,
      expected: { firstWeek: "2025-12-07", weekCount: 8 },
    },
    {
      description: "snap — pulls back when target overshoots max",
      targetFirstWeek: pd("2026-01-11"),
      weekCount: 8,
      behavior: "snap" as OutOfRangeBehavior,
      useMinMax: "both" as const,
      expected: {
        firstWeek: "2025-11-16",
        weekCount: 8,
      },
    },
    {
      description: "snap-shrink — pulls back and trims disabled rows",
      targetFirstWeek: pd("2026-01-11"),
      weekCount: 8,
      behavior: "snap-shrink" as OutOfRangeBehavior,
      useMinMax: "both" as const,
      expected: {
        firstWeek: "2025-11-30",
        weekCount: 6,
      },
    },
    {
      description: "stop-shrink — trims disabled rows",
      targetFirstWeek: pd("2025-12-07"),
      weekCount: 8,
      behavior: "stop-shrink" as OutOfRangeBehavior,
      useMinMax: "both" as const,
      expected: {
        firstWeek: "2025-12-07",
        weekCount: 5,
      },
    },
    {
      description: "max only, snap — pulls back when target overshoots max",
      targetFirstWeek: pd("2026-01-11"),
      weekCount: 8,
      behavior: "snap" as OutOfRangeBehavior,
      useMinMax: "max" as const,
      expected: { firstWeek: "2025-11-16", weekCount: 8 },
    },
    {
      description: "min only, snap — pulls forward when target undershoots min",
      targetFirstWeek: pd("2025-10-01"),
      weekCount: 8,
      behavior: "snap" as OutOfRangeBehavior,
      useMinMax: "min" as const,
      expected: { firstWeek: "2025-11-30", weekCount: 8 },
    },
    {
      description: "min only, stop-shrink — trims leading disabled rows",
      targetFirstWeek: pd("2025-11-16"),
      weekCount: 8,
      behavior: "stop-shrink" as OutOfRangeBehavior,
      useMinMax: "min" as const,
      expected: { firstWeek: "2025-11-30", weekCount: 6 },
    },
    {
      description: "no min/max — all modes behave as unbounded",
      targetFirstWeek: pd("2026-06-01"),
      weekCount: 8,
      behavior: "snap" as OutOfRangeBehavior,
      useMinMax: "none" as const,
      expected: { firstWeek: "2026-06-01", weekCount: 8 },
    },
  ])(
    "$description",
    ({ targetFirstWeek, weekCount, behavior, useMinMax, expected }) => {
      const result = applyOutOfRange({
        targetFirstWeek,
        weekCount,
        behavior,
        ...((useMinMax === "both" || useMinMax === "min") && { min }),
        ...((useMinMax === "both" || useMinMax === "max") && { max }),
        weekStartDay: 0,
        T,
      });
      expect(result.firstWeek.toString()).toBe(expected.firstWeek);
      expect(result.weekCount).toBe(expected.weekCount);
    },
  );
});
