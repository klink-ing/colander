import { Temporal } from "@js-temporal/polyfill";
import { describe, expect, it } from "vite-plus/test";
import { computeDayCellState, dayCellStateEqual } from "./day-cell-state";
import type { DayCellInputs } from "./day-cell-state";
import type { OutsideDays } from "./types";

const T = Temporal;
const d = (iso: string) => T.PlainDate.from(iso);

const inputs = (overrides: Partial<DayCellInputs> = {}): DayCellInputs => ({
  T,
  today: d("2026-03-10"),
  orientation: "horizontal",
  rootState: {} as DayCellInputs["rootState"],
  selectionMode: "single",
  selectedDates: [],
  rangeStart: undefined,
  rangeEnd: undefined,
  previewStart: undefined,
  previewEnd: undefined,
  disabled: false,
  isDateDisabled: undefined,
  focusedDate: d("2026-03-15"),
  tabTargetDate: d("2026-03-15"),
  outsideDays: "enabled",
  ...overrides,
});

const march = { columnIndex: 0, month: { year: 2026, month: 3 } };

describe("computeDayCellState", () => {
  it.each([
    {
      description:
        "today, selected, focused and tab target in the viewed month",
      date: "2026-03-10",
      overrides: {
        selectedDates: [d("2026-03-10")],
        focusedDate: d("2026-03-10"),
        tabTargetDate: d("2026-03-10"),
      },
      expected: {
        today: true,
        selected: true,
        focused: true,
        isTabTarget: true,
        outsideMonth: false,
        disabled: false,
      },
    },
    {
      description: "isDateDisabled disables the cell",
      date: "2026-03-12",
      overrides: { isDateDisabled: (x: Temporal.PlainDate) => x.day === 12 },
      expected: { disabled: true, selected: false },
    },
    {
      description: "range mode never reports selected, only range state",
      date: "2026-03-12",
      overrides: {
        selectionMode: "range" as const,
        selectedDates: [d("2026-03-12")],
        rangeStart: d("2026-03-11"),
        rangeEnd: d("2026-03-13"),
      },
      expected: {
        selected: false,
        inRange: true,
        rangeBoundary: false,
        rangeIndex: 1,
        rangeLength: 3,
        rangeHasStart: true,
        rangeHasEnd: true,
      },
    },
    {
      description: "half-open range: only the start is set",
      date: "2026-03-11",
      overrides: {
        selectionMode: "range" as const,
        rangeStart: d("2026-03-11"),
      },
      expected: {
        rangeStart: true,
        rangeEnd: false,
        inRange: true,
        rangeIndex: 0,
        rangeLength: 1,
        rangeHasStart: true,
        rangeHasEnd: false,
      },
    },
    {
      description: "preview range marks its boundary",
      date: "2026-03-14",
      overrides: {
        selectionMode: "range" as const,
        previewStart: d("2026-03-12"),
        previewEnd: d("2026-03-14"),
      },
      expected: {
        rangePreviewEnd: true,
        rangePreviewBoundary: true,
        rangePreviewInRange: true,
        rangePreviewIndex: 2,
        rangePreviewLength: 3,
      },
    },
  ])("$description", ({ date, overrides, expected }) => {
    const state = computeDayCellState(d(date), march, inputs(overrides));
    expect(state).toMatchObject(expected);
  });

  it.each([
    {
      description: "enabled: outside day is a normal cell",
      outsideDays: "enabled" as OutsideDays,
      expected: {
        outsideMonth: true,
        hidden: false,
        disabled: false,
        inRange: true,
      },
    },
    {
      description: "readOnly: outside day is disabled but keeps range state",
      outsideDays: "readOnly" as OutsideDays,
      expected: {
        outsideMonth: true,
        hidden: false,
        disabled: true,
        inRange: true,
      },
    },
    {
      description: "disabled: outside day is disabled and drops range state",
      outsideDays: "disabled" as OutsideDays,
      expected: {
        outsideMonth: true,
        hidden: false,
        disabled: true,
        inRange: false,
      },
    },
    {
      description: "hidden: outside day is hidden, not today, no range state",
      outsideDays: "hidden" as OutsideDays,
      expected: {
        outsideMonth: true,
        hidden: true,
        disabled: true,
        today: false,
        inRange: false,
      },
    },
  ])("outside day, $description", ({ outsideDays, expected }) => {
    const state = computeDayCellState(
      d("2026-04-02"),
      march,
      inputs({
        outsideDays,
        selectionMode: "range",
        rangeStart: d("2026-04-01"),
        rangeEnd: d("2026-04-03"),
        selectedDates: [d("2026-04-02")],
        focusedDate: d("2026-04-02"),
        tabTargetDate: d("2026-04-02"),
      }),
    );
    expect(state).toMatchObject({
      ...expected,
      selected: false,
      focused: outsideDays === "enabled",
      isTabTarget: outsideDays === "enabled",
    });
  });
});

describe("dayCellStateEqual", () => {
  const state = () => computeDayCellState(d("2026-03-12"), march, inputs());

  it.each([
    { description: "identical states", change: {}, expected: true },
    {
      description: "root/orientation differ",
      change: { orientation: "vertical" as const },
      expected: true,
    },
    {
      description: "selected differs",
      change: { selected: true },
      expected: false,
    },
    {
      description: "tab target differs",
      change: { isTabTarget: true },
      expected: false,
    },
    {
      description: "range index differs",
      change: { rangeIndex: 2 },
      expected: false,
    },
    {
      description: "preview length differs",
      change: { rangePreviewLength: 4 },
      expected: false,
    },
  ])("$description", ({ change, expected }) => {
    expect(dayCellStateEqual(state(), { ...state(), ...change })).toBe(
      expected,
    );
  });
});
