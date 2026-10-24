import { Temporal } from "@js-temporal/polyfill";
import { describe, it, expect } from "vitest";
import type { OutOfRangeBehavior } from "./out-of-range";
import { createWeekWindowPolicy } from "./weeks-window";

const T = Temporal;
const pd = (s: string) => T.PlainDate.from(s);

function policyFor(
  behavior: OutOfRangeBehavior,
  bounds: { min?: string; max?: string } = {
    min: "2025-12-01",
    max: "2026-01-10",
  },
) {
  return createWeekWindowPolicy({
    weekCount: 8,
    behavior,
    min: bounds.min ? pd(bounds.min) : undefined,
    max: bounds.max ? pd(bounds.max) : undefined,
    weekStartDay: 0,
    T,
  });
}

const shown = (firstWeek: string, weekCount = 8) => ({
  firstWeek: pd(firstWeek),
  weekCount,
});

describe("WeekWindowPolicy.shift", () => {
  it.each([
    {
      description: "unbounded — always allowed",
      behavior: "unbounded" as const,
      from: shown("2026-06-01"),
      direction: 1 as const,
      expected: { allowed: true },
    },
    {
      description: "stop — refused when the target window has no in-range week",
      behavior: "stop" as const,
      from: shown("2025-12-28"),
      direction: 1 as const,
      expected: { allowed: false },
    },
    {
      description:
        "stop-shrink — refused when the target window has no in-range week",
      behavior: "stop-shrink" as const,
      from: shown("2025-12-28"),
      direction: 1 as const,
      expected: { allowed: false },
    },
    {
      description: "snap — refused when already at the clamp position",
      behavior: "snap" as const,
      from: shown("2025-11-16"),
      direction: 1 as const,
      expected: { allowed: false },
    },
    {
      description: "snap — allowed away from the clamp position",
      behavior: "snap" as const,
      from: shown("2025-11-16"),
      direction: -1 as const,
      expected: { allowed: true },
    },
  ])("$description", ({ behavior, from, direction, expected }) => {
    expect(policyFor(behavior).shift(from, direction) !== null).toBe(
      expected.allowed,
    );
  });

  it("shifts by the rows currently shown, not the weekCount prop", () => {
    const next = policyFor("stop-shrink", {
      min: "2025-01-01",
      max: "2026-03-14",
    }).shift(shown("2026-03-01", 2), -1);
    expect(next?.firstWeek.toString()).toBe("2026-02-15");
  });

  it.each([
    {
      description: "min only, stop — Prev refused below the bound",
      behavior: "stop" as const,
      bounds: { min: "2026-03-01" },
      direction: -1 as const,
      expected: { allowed: false },
    },
    {
      description: "max only, stop — Next refused past the bound",
      behavior: "stop" as const,
      bounds: { max: "2026-03-14" },
      direction: 1 as const,
      expected: { allowed: false },
    },
  ])("$description", ({ behavior, bounds, direction, expected }) => {
    expect(
      policyFor(behavior, bounds).shift(shown("2026-03-01"), direction) !==
        null,
    ).toBe(expected.allowed);
  });
});

describe("WeekWindowPolicy.moveTo", () => {
  it.each([
    {
      description: "stop — refused when no row is in range",
      behavior: "stop" as const,
      target: "2026-06-07",
      expected: null,
    },
    {
      description: "stop — allowed when part of the window is in range",
      behavior: "stop" as const,
      target: "2026-01-04",
      expected: "2026-01-04",
    },
    {
      description: "snap — pulls back instead of refusing",
      behavior: "snap" as const,
      target: "2026-06-07",
      expected: "2025-11-16",
    },
  ])("$description", ({ behavior, target, expected }) => {
    expect(
      policyFor(behavior).moveTo(pd(target))?.firstWeek.toString() ?? null,
    ).toBe(expected);
  });
});
