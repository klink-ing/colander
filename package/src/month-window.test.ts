import { Temporal } from "@js-temporal/polyfill";
import { describe, expect, it } from "vite-plus/test";
import { createMonthWindowPolicy } from "./month-window";
import type { MonthWindowPolicyInput } from "./month-window";

const T = Temporal;

const policy = (overrides: Partial<MonthWindowPolicyInput> = {}) =>
  createMonthWindowPolicy({
    numberOfMonths: 1,
    behavior: "stop",
    min: undefined,
    max: undefined,
    T,
    ...overrides,
  });

const date = (iso: string) => T.PlainDate.from(iso);

describe("MonthWindowPolicy.step", () => {
  it.each([
    {
      description: "next across a year boundary",
      start: { year: 2026, month: 12 },
      direction: "next" as const,
      expected: {
        start: { year: 2027, month: 1 },
        entering: { year: 2027, month: 1 },
        firstDay: "2027-01-01",
        blocked: false,
      },
    },
    {
      description: "prev across a year boundary",
      start: { year: 2026, month: 1 },
      direction: "prev" as const,
      expected: {
        start: { year: 2025, month: 12 },
        entering: { year: 2025, month: 12 },
        firstDay: "2025-12-01",
        blocked: false,
      },
    },
    {
      description:
        "next with two months visible enters the month after the window",
      start: { year: 2026, month: 3 },
      direction: "next" as const,
      numberOfMonths: 2,
      expected: {
        start: { year: 2026, month: 4 },
        entering: { year: 2026, month: 5 },
        firstDay: "2026-04-01",
        blocked: false,
      },
    },
  ])("$description", ({ start, direction, numberOfMonths, expected }) => {
    const step = policy({ numberOfMonths: numberOfMonths ?? 1 }).step(
      start,
      direction,
    );
    expect({ ...step, firstDay: step.firstDay.toString() }).toEqual(expected);
  });

  it.each([
    {
      description: "stop: prev into the min month is allowed (min mid-month)",
      direction: "prev" as const,
      start: { year: 2026, month: 4 },
      min: "2026-03-20",
      expected: false,
    },
    {
      description: "stop: prev before the min month is blocked",
      direction: "prev" as const,
      start: { year: 2026, month: 3 },
      min: "2026-03-20",
      expected: true,
    },
    {
      description: "stop: next into the max month is allowed",
      direction: "next" as const,
      start: { year: 2026, month: 2 },
      max: "2026-03-05",
      expected: false,
    },
    {
      description: "stop: next past the max month is blocked",
      direction: "next" as const,
      start: { year: 2026, month: 3 },
      max: "2026-03-05",
      expected: true,
    },
    {
      description: "stop: the window's last month is what must stay within max",
      direction: "next" as const,
      start: { year: 2026, month: 2 },
      numberOfMonths: 2,
      max: "2026-03-31",
      expected: true,
    },
    {
      description: "stop: min only never blocks next",
      direction: "next" as const,
      start: { year: 2030, month: 1 },
      min: "2026-03-20",
      expected: false,
    },
    {
      description: "stop: max only never blocks prev",
      direction: "prev" as const,
      start: { year: 2020, month: 1 },
      max: "2026-03-20",
      expected: false,
    },
    {
      description: "unbounded: never blocks past min",
      direction: "prev" as const,
      behavior: "unbounded" as const,
      start: { year: 2026, month: 3 },
      min: "2026-03-20",
      expected: false,
    },
    {
      description: "unbounded: never blocks past max",
      direction: "next" as const,
      behavior: "unbounded" as const,
      start: { year: 2026, month: 3 },
      max: "2026-03-05",
      expected: false,
    },
  ])(
    "$description",
    ({ direction, start, min, max, numberOfMonths, behavior, expected }) => {
      const blocked = policy({
        numberOfMonths: numberOfMonths ?? 1,
        behavior: behavior ?? "stop",
        min: min ? date(min) : undefined,
        max: max ? date(max) : undefined,
      }).step(start, direction).blocked;
      expect(blocked).toBe(expected);
    },
  );
});

describe("MonthWindowPolicy.isVisible", () => {
  it.each([
    {
      description: "the first month",
      target: { year: 2026, month: 3 },
      expected: true,
    },
    {
      description: "the last month",
      target: { year: 2026, month: 5 },
      expected: true,
    },
    {
      description: "the month before the window",
      target: { year: 2026, month: 2 },
      expected: false,
    },
    {
      description: "the month after the window",
      target: { year: 2026, month: 6 },
      expected: false,
    },
    {
      description: "the same month number in another year",
      target: { year: 2027, month: 3 },
      expected: false,
    },
  ])("$description", ({ target, expected }) => {
    expect(
      policy({ numberOfMonths: 3 }).isVisible({ year: 2026, month: 3 }, target),
    ).toBe(expected);
  });
});

describe("MonthWindowPolicy.reveal", () => {
  it.each([
    {
      description: "keeps the window when the target is visible",
      target: { year: 2026, month: 4 },
      expected: { year: 2026, month: 3 },
    },
    {
      description: "target before the window becomes the first month",
      target: { year: 2026, month: 1 },
      expected: { year: 2026, month: 1 },
    },
    {
      description: "target after the window becomes the last month",
      target: { year: 2026, month: 8 },
      expected: { year: 2026, month: 7 },
    },
    {
      description: "target after the window across a year boundary",
      target: { year: 2027, month: 2 },
      expected: { year: 2027, month: 1 },
    },
  ])("$description", ({ target, expected }) => {
    expect(
      policy({ numberOfMonths: 2 }).reveal({ year: 2026, month: 3 }, target),
    ).toEqual(expected);
  });
});
