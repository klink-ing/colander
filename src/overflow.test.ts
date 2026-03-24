import { describe, it, expect } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import { applyOverflow, canShift, type OverflowBehavior } from "./overflow";

const T = Temporal;
const pd = (s: string) => T.PlainDate.from(s);

describe("applyOverflow", () => {
  const min = pd("2025-12-01");
  const max = pd("2026-01-10");

  it.each([
    {
      description: "unbounded — no adjustment",
      targetFirstWeek: pd("2026-02-01"),
      weekCount: 8,
      behavior: "unbounded" as OverflowBehavior,
      useMinMax: true,
      expected: { firstWeek: "2026-02-01", weekCount: 8 },
    },
    {
      description: "stop — target has valid weeks, allowed",
      targetFirstWeek: pd("2025-12-07"),
      weekCount: 8,
      behavior: "stop" as OverflowBehavior,
      useMinMax: true,
      expected: { firstWeek: "2025-12-07", weekCount: 8 },
    },
    {
      description: "snap — pulls back when target overshoots max",
      targetFirstWeek: pd("2026-01-11"),
      weekCount: 8,
      behavior: "snap" as OverflowBehavior,
      useMinMax: true,
      expected: {
        firstWeek: "2025-11-16",
        weekCount: 8,
      },
    },
    {
      description: "snap-shrink — pulls back and trims disabled rows",
      targetFirstWeek: pd("2026-01-11"),
      weekCount: 8,
      behavior: "snap-shrink" as OverflowBehavior,
      useMinMax: true,
      expected: {
        firstWeek: "2025-11-30",
        weekCount: 6,
      },
    },
    {
      description: "stop-shrink — trims disabled rows",
      targetFirstWeek: pd("2025-12-07"),
      weekCount: 8,
      behavior: "stop-shrink" as OverflowBehavior,
      useMinMax: true,
      expected: {
        firstWeek: "2025-12-07",
        weekCount: 5,
      },
    },
    {
      description: "no min/max — all modes behave as unbounded",
      targetFirstWeek: pd("2026-06-01"),
      weekCount: 8,
      behavior: "snap" as OverflowBehavior,
      useMinMax: false,
      expected: { firstWeek: "2026-06-01", weekCount: 8 },
    },
  ])("$description", ({ targetFirstWeek, weekCount, behavior, useMinMax, expected }) => {
    const result = applyOverflow({
      targetFirstWeek,
      weekCount,
      behavior,
      min: useMinMax ? min : undefined,
      max: useMinMax ? max : undefined,
      weekStartDay: 0,
      T,
    });
    expect(result.firstWeek.toString()).toBe(expected.firstWeek);
    expect(result.weekCount).toBe(expected.weekCount);
  });
});

describe("canShift", () => {
  const min = pd("2025-12-01");
  const max = pd("2026-01-10");

  it.each([
    {
      description: "unbounded — always true",
      behavior: "unbounded" as OverflowBehavior,
      currentFirstWeek: pd("2026-06-01"),
      direction: 1 as const,
      expected: true,
    },
    {
      description: "stop — false when target has no valid weeks",
      behavior: "stop" as OverflowBehavior,
      currentFirstWeek: pd("2025-12-28"),
      direction: 1 as const,
      expected: false,
    },
    {
      description: "snap — false when already at clamp position",
      behavior: "snap" as OverflowBehavior,
      currentFirstWeek: pd("2025-11-16"),
      direction: 1 as const,
      expected: false,
    },
  ])("$description", ({ behavior, currentFirstWeek, direction, expected }) => {
    const result = canShift({
      currentFirstWeek,
      weekCount: 8,
      direction,
      behavior,
      min,
      max,
      weekStartDay: 0,
      T,
    });
    expect(result).toBe(expected);
  });
});
