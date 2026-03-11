// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { Temporal } from "@js-temporal/polyfill";
import { Root } from "./root";
import { useDatePicker } from "./context";
import { Grid, DayCellTemplate, DayButton } from "./grid";
import { MonthYearString } from "./navigation";
import type { DateRange, ValueChangeMeta, MonthData } from "./types";

const temporal = {
  Now: Temporal.Now,
  PlainDate: Temporal.PlainDate,
  PlainDateTime: Temporal.PlainDateTime,
  PlainMonthDay: Temporal.PlainMonthDay,
  PlainYearMonth: Temporal.PlainYearMonth,
};

const defaultProps = {
  temporal,
  locale: "en-US",
  timeZone: "America/New_York",
  format: "PlainDate" as const,
} as const;

const march10 = Temporal.PlainDate.from("2026-03-10");
const march20 = Temporal.PlainDate.from("2026-03-20");

/** Helper that captures `setRange` from context. */
function SetRangeTrigger({
  onCapture,
}: {
  onCapture: (
    setRange: (
      start: Temporal.PlainDate,
      end: Temporal.PlainDate,
    ) => void,
  ) => void;
}) {
  const { setRange } = useDatePicker();
  onCapture(setRange);
  return null;
}

/** Helper that captures `onSelect` from context. */
function SelectTrigger({
  onCapture,
}: {
  onCapture: (onSelect: (date: Temporal.PlainDate) => void) => void;
}) {
  const { onSelect } = useDatePicker();
  onCapture(onSelect);
  return null;
}

describe("insideRangeAction", () => {
  const march5 = Temporal.PlainDate.from("2026-03-05");
  const march15 = Temporal.PlainDate.from("2026-03-15");
  const march25 = Temporal.PlainDate.from("2026-03-25");

  type RangeChangeFn = (
    value: DateRange<"PlainDate"> | null,
    meta: ValueChangeMeta<DateRange<"PlainDate"> | null>,
  ) => void;

  function renderRangeRoot(
    insideRangeAction: "start" | "end" | "nearest-start" | "nearest-end" | "reset",
    onValueChange: RangeChangeFn,
  ) {
    let selectFn: (date: Temporal.PlainDate) => void = () => {};
    const result = render(
      <Root
        {...defaultProps}
        selectionMode="range"
        defaultValue={{ start: march10, end: march20 }}
        onValueChange={onValueChange}
        insideRangeAction={insideRangeAction}
      >
        <SelectTrigger onCapture={(fn) => { selectFn = fn; }} />
      </Root>,
    );
    return { ...result, select: selectFn };
  }

  it.each<{
    description: string;
    action: "start" | "end" | "nearest-start" | "nearest-end" | "reset";
    clickDate: Temporal.PlainDate;
    expected: { start: string; end: string };
  }>([
    {
      description: '"start" moves range start to clicked date',
      action: "start",
      clickDate: march15,
      expected: { start: "2026-03-15", end: "2026-03-20" },
    },
    {
      description: '"end" moves range end to clicked date',
      action: "end",
      clickDate: march15,
      expected: { start: "2026-03-10", end: "2026-03-15" },
    },
    {
      description: '"reset" collapses range to single-day at clicked date',
      action: "reset",
      clickDate: march15,
      expected: { start: "2026-03-15", end: "2026-03-15" },
    },
    {
      description: '"nearest-end" moves end when date is closer to end',
      action: "nearest-end",
      clickDate: Temporal.PlainDate.from("2026-03-18"),
      expected: { start: "2026-03-10", end: "2026-03-18" },
    },
    {
      description: '"nearest-start" moves start when date is closer to start',
      action: "nearest-start",
      clickDate: Temporal.PlainDate.from("2026-03-12"),
      expected: { start: "2026-03-12", end: "2026-03-20" },
    },
    {
      description: '"nearest-end" tie goes to end',
      action: "nearest-end",
      clickDate: march15,
      expected: { start: "2026-03-10", end: "2026-03-15" },
    },
    {
      description: '"nearest-start" tie goes to start',
      action: "nearest-start",
      clickDate: march15,
      expected: { start: "2026-03-15", end: "2026-03-20" },
    },
  ])("$description", ({ action, clickDate, expected }) => {
    const onValueChange = vi.fn<RangeChangeFn>();
    const { unmount, select } = renderRangeRoot(action, onValueChange);

    act(() => { select(clickDate); });

    const [value] = onValueChange.mock.calls[0];
    expect(value!.start.toString()).toBe(expected.start);
    expect(value!.end.toString()).toBe(expected.end);

    unmount();
  });

  it("clicking before range always extends start regardless of action", () => {
    const onValueChange = vi.fn<RangeChangeFn>();
    const { unmount, select } = renderRangeRoot("end", onValueChange);

    act(() => { select(march5); });

    const [value] = onValueChange.mock.calls[0];
    expect(value?.start.toString()).toBe("2026-03-05");
    expect(value?.end.toString()).toBe("2026-03-20");

    unmount();
  });

  it("clicking after range always extends end regardless of action", () => {
    const onValueChange = vi.fn<RangeChangeFn>();
    const { unmount, select } = renderRangeRoot("start", onValueChange);

    act(() => { select(march25); });

    const [value] = onValueChange.mock.calls[0];
    expect(value?.start.toString()).toBe("2026-03-10");
    expect(value?.end.toString()).toBe("2026-03-25");

    unmount();
  });
});

describe("setRange normalization", () => {
  it("sorts start and end when called in order", () => {
    const onValueChange = vi.fn();
    let captured: (
      s: Temporal.PlainDate,
      e: Temporal.PlainDate,
    ) => void = () => {};

    const { unmount } = render(
      <Root
        {...defaultProps}
        selectionMode="range"
        onValueChange={onValueChange}
      >
        <SetRangeTrigger
          onCapture={(fn) => {
            captured = fn;
          }}
        />
      </Root>,
    );

    act(() => {
      captured(march10, march20);
    });

    expect(onValueChange).toHaveBeenCalledWith(
      { start: march10, end: march20 },
      expect.objectContaining({ date: undefined }),
    );

    unmount();
  });

  it("normalizes reversed arguments so start <= end", () => {
    const onValueChange = vi.fn();
    let captured: (
      s: Temporal.PlainDate,
      e: Temporal.PlainDate,
    ) => void = () => {};

    const { unmount } = render(
      <Root
        {...defaultProps}
        selectionMode="range"
        onValueChange={onValueChange}
      >
        <SetRangeTrigger
          onCapture={(fn) => {
            captured = fn;
          }}
        />
      </Root>,
    );

    // Call with end before start
    act(() => {
      captured(march20, march10);
    });

    const [value] = onValueChange.mock.calls[0] as [
      DateRange<"PlainDate">,
      ValueChangeMeta<DateRange<"PlainDate"> | null>,
    ];
    expect(Temporal.PlainDate.compare(value.start, value.end)).toBeLessThanOrEqual(0);
    expect(value).toEqual({ start: march10, end: march20 });

    unmount();
  });

  it("handles same date for both start and end", () => {
    const onValueChange = vi.fn();
    let captured: (
      s: Temporal.PlainDate,
      e: Temporal.PlainDate,
    ) => void = () => {};

    const { unmount } = render(
      <Root
        {...defaultProps}
        selectionMode="range"
        onValueChange={onValueChange}
      >
        <SetRangeTrigger
          onCapture={(fn) => {
            captured = fn;
          }}
        />
      </Root>,
    );

    act(() => {
      captured(march10, march10);
    });

    expect(onValueChange).toHaveBeenCalledWith(
      { start: march10, end: march10 },
      expect.objectContaining({ date: undefined }),
    );

    unmount();
  });
});

/** Helper that captures allMonths and currentDateTime from context. */
function MonthDataCapture({
  onCapture,
}: {
  onCapture: (data: {
    allMonths: MonthData[];
    currentMonth: { year: number; month: number };
  }) => void;
}) {
  const { allMonths, currentDateTime } = useDatePicker();
  onCapture({
    allMonths,
    currentMonth: { year: currentDateTime.year, month: currentDateTime.month },
  });
  return null;
}

describe("numberOfMonths", () => {
  const march15 = Temporal.PlainDate.from("2026-03-15");
  const april15 = Temporal.PlainDate.from("2026-04-15");

  it("computes correct number of months in allMonths", () => {
    let captured: { allMonths: MonthData[] } | undefined;

    const { unmount } = render(
      <Root {...defaultProps} defaultValue={march15} numberOfMonths={3}>
        <MonthDataCapture onCapture={(d) => { captured = d; }} />
      </Root>,
    );

    expect(captured!.allMonths).toHaveLength(3);
    expect(captured!.allMonths.map((m) => `${m.year}-${m.month}`)).toEqual([
      "2026-3",
      "2026-4",
      "2026-5",
    ]);

    unmount();
  });

  it("defaults to 1 month when numberOfMonths is omitted", () => {
    let captured: { allMonths: MonthData[] } | undefined;

    const { unmount } = render(
      <Root {...defaultProps} defaultValue={march15}>
        <MonthDataCapture onCapture={(d) => { captured = d; }} />
      </Root>,
    );

    expect(captured!.allMonths).toHaveLength(1);
    expect(captured!.allMonths[0].year).toBe(2026);
    expect(captured!.allMonths[0].month).toBe(3);

    unmount();
  });

  it("does not shift currentMonth when selecting a date already in a visible month", () => {
    let selectFn: (date: Temporal.PlainDate) => void = () => {};
    let captured: { currentMonth: { year: number; month: number } } | undefined;

    const { unmount } = render(
      <Root {...defaultProps} defaultValue={march15} numberOfMonths={2}>
        <SelectTrigger onCapture={(fn) => { selectFn = fn; }} />
        <MonthDataCapture onCapture={(d) => { captured = d; }} />
      </Root>,
    );

    expect(captured!.currentMonth).toEqual({ year: 2026, month: 3 });

    // Select a date in April (second visible month) — should NOT shift
    act(() => { selectFn(april15); });

    expect(captured!.currentMonth).toEqual({ year: 2026, month: 3 });

    unmount();
  });

  it("shifts currentMonth when selecting outside all visible months", () => {
    let selectFn: (date: Temporal.PlainDate) => void = () => {};
    let captured: { currentMonth: { year: number; month: number } } | undefined;

    const { unmount } = render(
      <Root {...defaultProps} defaultValue={march15} numberOfMonths={2}>
        <SelectTrigger onCapture={(fn) => { selectFn = fn; }} />
        <MonthDataCapture onCapture={(d) => { captured = d; }} />
      </Root>,
    );

    // Select June — outside visible March+April window
    const june15 = Temporal.PlainDate.from("2026-06-15");
    act(() => { selectFn(june15); });

    expect(captured!.currentMonth).toEqual({ year: 2026, month: 6 });

    unmount();
  });

  it("each month in allMonths has valid week data", () => {
    let captured: { allMonths: MonthData[] } | undefined;

    const { unmount } = render(
      <Root {...defaultProps} defaultValue={march15} numberOfMonths={2}>
        <MonthDataCapture onCapture={(d) => { captured = d; }} />
      </Root>,
    );

    for (const monthData of captured!.allMonths) {
      expect(monthData.weeks.length).toBeGreaterThanOrEqual(4);
      expect(monthData.weeks.length).toBeLessThanOrEqual(6);
      for (const week of monthData.weeks) {
        expect(week).toHaveLength(7);
      }
    }

    unmount();
  });

  it("handles year boundary (December → January)", () => {
    const dec15 = Temporal.PlainDate.from("2026-12-15");
    let captured: { allMonths: MonthData[] } | undefined;

    const { unmount } = render(
      <Root {...defaultProps} defaultValue={dec15} numberOfMonths={2}>
        <MonthDataCapture onCapture={(d) => { captured = d; }} />
      </Root>,
    );

    expect(captured!.allMonths.map((m) => `${m.year}-${m.month}`)).toEqual([
      "2026-12",
      "2027-1",
    ]);

    unmount();
  });

  it("renders separate grid labels for each month", () => {
    const { container, unmount } = render(
      <Root {...defaultProps} defaultValue={march15} numberOfMonths={2}>
        <MonthYearString monthIndex={0} />
        <MonthYearString monthIndex={1} />
        <Grid monthIndex={0} />
        <Grid monthIndex={1} />
      </Root>,
    );

    const grids = container.querySelectorAll('[role="grid"]');
    expect(grids).toHaveLength(2);

    const labelledBy0 = grids[0].getAttribute("aria-labelledby");
    const labelledBy1 = grids[1].getAttribute("aria-labelledby");
    expect(labelledBy0).toBeTruthy();
    expect(labelledBy1).toBeTruthy();
    expect(labelledBy0).not.toBe(labelledBy1);

    const label0El = document.getElementById(labelledBy0!);
    const label1El = document.getElementById(labelledBy1!);
    expect(label0El?.textContent).toContain("March");
    expect(label1El?.textContent).toContain("April");

    unmount();
  });

  it("Grid monthIndex selects correct month data", () => {
    const { container, unmount } = render(
      <Root {...defaultProps} defaultValue={march15} numberOfMonths={2}>
        <Grid monthIndex={0} />
        <Grid monthIndex={1} />
      </Root>,
    );

    const grids = container.querySelectorAll('[role="grid"]');
    const grid0Dates = grids[0].querySelectorAll("[data-date]");
    const grid1Dates = grids[1].querySelectorAll("[data-date]");

    expect(grid0Dates.length).toBeGreaterThan(0);
    expect(grid1Dates.length).toBeGreaterThan(0);

    const grid0HasMarch = Array.from(grid0Dates).some(
      (el) => el.getAttribute("data-date")?.startsWith("2026-03"),
    );
    const grid1HasApril = Array.from(grid1Dates).some(
      (el) => el.getAttribute("data-date")?.startsWith("2026-04"),
    );
    expect(grid0HasMarch).toBe(true);
    expect(grid1HasApril).toBe(true);

    unmount();
  });

  it("outsideMonth is relative to each grid's month", () => {
    const { container, unmount } = render(
      <Root {...defaultProps} defaultValue={march15} numberOfMonths={2}>
        <Grid monthIndex={0} />
        <Grid monthIndex={1} />
      </Root>,
    );

    const grids = container.querySelectorAll('[role="grid"]');

    // In grid 0 (March), outside-month dates should not be March dates
    const grid0OutsideMonth = Array.from(grids[0].querySelectorAll("[data-outside-month]"));
    for (const el of grid0OutsideMonth) {
      const dateStr = el.getAttribute("data-date")!;
      expect(dateStr.startsWith("2026-03")).toBe(false);
    }

    // In grid 1 (April), outside-month dates should not be April dates
    const grid1OutsideMonth = Array.from(grids[1].querySelectorAll("[data-outside-month]"));
    for (const el of grid1OutsideMonth) {
      const dateStr = el.getAttribute("data-date")!;
      expect(dateStr.startsWith("2026-04")).toBe(false);
    }

    unmount();
  });
});
