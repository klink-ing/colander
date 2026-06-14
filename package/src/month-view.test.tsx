import { Temporal } from "@js-temporal/polyfill";
import { render, act } from "@testing-library/react";
import { useState } from "react";
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { useCalendarStable } from "./calendar-context";
import { Grid } from "./grid";
import { MonthView } from "./month-view";
import { useMonthViewState } from "./month-view-context";
import {
  MonthYearString,
  PrevMonthButton,
  NextMonthButton,
} from "./navigation";
import { Temporal as MiniTemporal } from "./temporal-polyfill";
import type { DateRange, ValueChangeMeta, MonthData } from "./types";
import { useViewContext } from "./view-context";

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
    setRange: (start: Temporal.PlainDate, end: Temporal.PlainDate) => void,
  ) => void;
}) {
  const { setRange } = useCalendarStable();
  onCapture(setRange);
  return null;
}

/** Helper that captures a select function (onSelect + setFocusedDate) from context. */
function SelectTrigger({
  onCapture,
}: {
  onCapture: (onSelect: (date: Temporal.PlainDate) => void) => void;
}) {
  const { onSelect } = useCalendarStable();
  const { setFocusedDate } = useViewContext();
  onCapture((date: Temporal.PlainDate) => {
    setFocusedDate(date);
    onSelect(date);
  });
  return null;
}

describe("rangeMode", () => {
  const march5 = Temporal.PlainDate.from("2026-03-05");
  const march15 = Temporal.PlainDate.from("2026-03-15");
  const march25 = Temporal.PlainDate.from("2026-03-25");

  type RangeChangeFn = (
    value: DateRange<"PlainDate"> | null,
    meta: ValueChangeMeta<DateRange<"PlainDate"> | null>,
  ) => void;

  function renderRangeRoot(
    rangeMode:
      | "adjust-start"
      | "adjust-end"
      | "nearest-start"
      | "nearest-end"
      | "reset",
    onValueChange: RangeChangeFn,
  ) {
    let selectFn: (date: Temporal.PlainDate) => void = () => {};
    const result = render(
      <MonthView
        {...defaultProps}
        selectionMode="range"
        defaultValue={{ start: march10, end: march20 }}
        onValueChange={onValueChange}
        rangeMode={rangeMode}
      >
        <SelectTrigger
          onCapture={(fn) => {
            selectFn = fn;
          }}
        />
      </MonthView>,
    );
    return { ...result, select: selectFn };
  }

  it.each<{
    description: string;
    action:
      | "adjust-start"
      | "adjust-end"
      | "nearest-start"
      | "nearest-end"
      | "reset";
    clickDate: Temporal.PlainDate;
    expected: { start: string; end: string };
  }>([
    {
      description: '"adjust-start" moves range start to clicked date',
      action: "adjust-start",
      clickDate: march15,
      expected: { start: "2026-03-15", end: "2026-03-20" },
    },
    {
      description: '"adjust-end" moves range end to clicked date',
      action: "adjust-end",
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

    act(() => {
      select(clickDate);
    });

    const [value] = onValueChange.mock.calls[0]!;
    expect(value!.start!.toString()).toBe(expected.start);
    expect(value!.end!.toString()).toBe(expected.end);

    unmount();
  });

  it("clicking before range always extends start regardless of mode", () => {
    const onValueChange = vi.fn<RangeChangeFn>();
    const { unmount, select } = renderRangeRoot("adjust-end", onValueChange);

    act(() => {
      select(march5);
    });

    const [value] = onValueChange.mock.calls[0]!;
    expect(value?.start?.toString()).toBe("2026-03-05");
    expect(value?.end?.toString()).toBe("2026-03-20");

    unmount();
  });

  it("clicking after range always extends end regardless of mode", () => {
    const onValueChange = vi.fn<RangeChangeFn>();
    const { unmount, select } = renderRangeRoot("adjust-start", onValueChange);

    act(() => {
      select(march25);
    });

    const [value] = onValueChange.mock.calls[0]!;
    expect(value?.start?.toString()).toBe("2026-03-10");
    expect(value?.end?.toString()).toBe("2026-03-25");

    unmount();
  });

  it("clicking on start boundary of multi-day range collapses to single-day", () => {
    const onValueChange = vi.fn<RangeChangeFn>();
    const { unmount, select } = renderRangeRoot("nearest-end", onValueChange);

    act(() => {
      select(march10);
    });

    const [value] = onValueChange.mock.calls[0]!;
    expect(value!.start!.toString()).toBe("2026-03-10");
    expect(value!.end!.toString()).toBe("2026-03-10");

    unmount();
  });

  it("clicking on end boundary of multi-day range collapses to single-day", () => {
    const onValueChange = vi.fn<RangeChangeFn>();
    const { unmount, select } = renderRangeRoot("nearest-end", onValueChange);

    act(() => {
      select(march20);
    });

    const [value] = onValueChange.mock.calls[0]!;
    expect(value!.start!.toString()).toBe("2026-03-20");
    expect(value!.end!.toString()).toBe("2026-03-20");

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
      <MonthView
        {...defaultProps}
        selectionMode="range"
        onValueChange={onValueChange}
      >
        <SetRangeTrigger
          onCapture={(fn) => {
            captured = fn;
          }}
        />
      </MonthView>,
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
      <MonthView
        {...defaultProps}
        selectionMode="range"
        onValueChange={onValueChange}
      >
        <SetRangeTrigger
          onCapture={(fn) => {
            captured = fn;
          }}
        />
      </MonthView>,
    );

    // Call with end before start
    act(() => {
      captured(march20, march10);
    });

    const [value] = onValueChange.mock.calls[0] as [
      DateRange<"PlainDate">,
      ValueChangeMeta<DateRange<"PlainDate"> | null>,
    ];
    expect(
      Temporal.PlainDate.compare(value.start!, value.end!),
    ).toBeLessThanOrEqual(0);
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
      <MonthView
        {...defaultProps}
        selectionMode="range"
        onValueChange={onValueChange}
      >
        <SetRangeTrigger
          onCapture={(fn) => {
            captured = fn;
          }}
        />
      </MonthView>,
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

/** Helper that captures allMonths, currentMonth, and focusedDate from context. */
function MonthDataCapture({
  onCapture,
}: {
  onCapture: (data: {
    allMonths: MonthData[];
    currentMonth: { year: number; month: number };
    focusedDate: string;
  }) => void;
}) {
  const { allMonths, currentMonth } = useMonthViewState();
  const { focusedDate } = useViewContext();
  onCapture({
    allMonths,
    currentMonth: { year: currentMonth.year, month: currentMonth.month },
    focusedDate: focusedDate.toString(),
  });
  return null;
}

describe("numberOfMonths", () => {
  const march15 = Temporal.PlainDate.from("2026-03-15");
  const april15 = Temporal.PlainDate.from("2026-04-15");

  it("computes correct number of months in allMonths", () => {
    let captured: { allMonths: MonthData[] } | undefined;

    const { unmount } = render(
      <MonthView {...defaultProps} defaultValue={march15} numberOfMonths={3}>
        <MonthDataCapture
          onCapture={(d) => {
            captured = d;
          }}
        />
      </MonthView>,
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
      <MonthView {...defaultProps} defaultValue={march15}>
        <MonthDataCapture
          onCapture={(d) => {
            captured = d;
          }}
        />
      </MonthView>,
    );

    expect(captured!.allMonths).toHaveLength(1);
    expect(captured!.allMonths[0]!.year).toBe(2026);
    expect(captured!.allMonths[0]!.month).toBe(3);

    unmount();
  });

  it("does not shift currentMonth when selecting a date already in a visible month", () => {
    let selectFn: (date: Temporal.PlainDate) => void = () => {};
    let captured: { currentMonth: { year: number; month: number } } | undefined;

    const { unmount } = render(
      <MonthView {...defaultProps} defaultValue={march15} numberOfMonths={2}>
        <SelectTrigger
          onCapture={(fn) => {
            selectFn = fn;
          }}
        />
        <MonthDataCapture
          onCapture={(d) => {
            captured = d;
          }}
        />
      </MonthView>,
    );

    expect(captured!.currentMonth).toEqual({ year: 2026, month: 3 });

    // Select a date in April (second visible month) — should NOT shift
    act(() => {
      selectFn(april15);
    });

    expect(captured!.currentMonth).toEqual({ year: 2026, month: 3 });

    unmount();
  });

  it("shifts currentMonth when selecting outside all visible months", () => {
    let selectFn: (date: Temporal.PlainDate) => void = () => {};
    let captured: { currentMonth: { year: number; month: number } } | undefined;

    const { unmount } = render(
      <MonthView {...defaultProps} defaultValue={march15} numberOfMonths={2}>
        <SelectTrigger
          onCapture={(fn) => {
            selectFn = fn;
          }}
        />
        <MonthDataCapture
          onCapture={(d) => {
            captured = d;
          }}
        />
      </MonthView>,
    );

    // Select June — outside the visible [March, April] window. Minimal shift
    // makes June the last pane, so the start moves to May ([May, June]).
    const june15 = Temporal.PlainDate.from("2026-06-15");
    act(() => {
      selectFn(june15);
    });

    expect(captured!.currentMonth).toEqual({ year: 2026, month: 5 });

    unmount();
  });

  it("each month in allMonths has valid week data", () => {
    let captured: { allMonths: MonthData[] } | undefined;

    const { unmount } = render(
      <MonthView {...defaultProps} defaultValue={march15} numberOfMonths={2}>
        <MonthDataCapture
          onCapture={(d) => {
            captured = d;
          }}
        />
      </MonthView>,
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
      <MonthView {...defaultProps} defaultValue={dec15} numberOfMonths={2}>
        <MonthDataCapture
          onCapture={(d) => {
            captured = d;
          }}
        />
      </MonthView>,
    );

    expect(captured!.allMonths.map((m) => `${m.year}-${m.month}`)).toEqual([
      "2026-12",
      "2027-1",
    ]);

    unmount();
  });

  it("renders separate grid labels for each month", () => {
    const { container, unmount } = render(
      <MonthView {...defaultProps} defaultValue={march15} numberOfMonths={2}>
        <MonthYearString monthIndex={0} />
        <MonthYearString monthIndex={1} />
        <Grid monthIndex={0} />
        <Grid monthIndex={1} />
      </MonthView>,
    );

    const grids = container.querySelectorAll('[role="grid"]');
    expect(grids).toHaveLength(2);

    const labelledBy0 = grids[0]!.getAttribute("aria-labelledby");
    const labelledBy1 = grids[1]!.getAttribute("aria-labelledby");
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
      <MonthView {...defaultProps} defaultValue={march15} numberOfMonths={2}>
        <Grid monthIndex={0} />
        <Grid monthIndex={1} />
      </MonthView>,
    );

    const grids = container.querySelectorAll('[role="grid"]');
    const grid0Dates = grids[0]!.querySelectorAll("[data-date]");
    const grid1Dates = grids[1]!.querySelectorAll("[data-date]");

    expect(grid0Dates.length).toBeGreaterThan(0);
    expect(grid1Dates.length).toBeGreaterThan(0);

    const grid0HasMarch = Array.from(grid0Dates).some((el) =>
      el.getAttribute("data-date")?.startsWith("2026-03"),
    );
    const grid1HasApril = Array.from(grid1Dates).some((el) =>
      el.getAttribute("data-date")?.startsWith("2026-04"),
    );
    expect(grid0HasMarch).toBe(true);
    expect(grid1HasApril).toBe(true);

    unmount();
  });

  it("updates allMonths when numberOfMonths prop changes", () => {
    let captured: { allMonths: MonthData[] } | undefined;

    const { rerender, unmount } = render(
      <MonthView {...defaultProps} defaultValue={march15} numberOfMonths={1}>
        <MonthDataCapture
          onCapture={(d) => {
            captured = d;
          }}
        />
      </MonthView>,
    );

    expect(captured!.allMonths).toHaveLength(1);

    rerender(
      <MonthView {...defaultProps} defaultValue={march15} numberOfMonths={3}>
        <MonthDataCapture
          onCapture={(d) => {
            captured = d;
          }}
        />
      </MonthView>,
    );

    expect(captured!.allMonths).toHaveLength(3);
    expect(captured!.allMonths.map((m) => `${m.year}-${m.month}`)).toEqual([
      "2026-3",
      "2026-4",
      "2026-5",
    ]);

    unmount();
  });

  it("clamps numberOfMonths to 1–12 range", () => {
    let captured: { allMonths: MonthData[] } | undefined;

    const { unmount } = render(
      <MonthView {...defaultProps} defaultValue={march15} numberOfMonths={0}>
        <MonthDataCapture
          onCapture={(d) => {
            captured = d;
          }}
        />
      </MonthView>,
    );

    // 0 should be clamped to 1
    expect(captured!.allMonths).toHaveLength(1);

    unmount();
  });

  it("keyboard PageDown from last visible month shifts view", () => {
    let captured:
      | { currentMonth: { year: number; month: number }; focusedDate: string }
      | undefined;

    const { container, unmount } = render(
      <MonthView {...defaultProps} defaultValue={march15} numberOfMonths={2}>
        <MonthDataCapture
          onCapture={(d) => {
            captured = d;
          }}
        />
        <Grid monthIndex={0} />
        <Grid monthIndex={1} />
      </MonthView>,
    );

    // Initially March+April, focused on March 15
    expect(captured!.currentMonth).toEqual({ year: 2026, month: 3 });
    expect(captured!.focusedDate).toBe("2026-03-15");

    // Press PageDown to move focus to April 15 — still within visible range
    const grid = container.querySelector('[role="grid"]')!;
    act(() => {
      grid.dispatchEvent(
        new KeyboardEvent("keydown", { key: "PageDown", bubbles: true }),
      );
    });

    expect(captured!.focusedDate).toBe("2026-04-15");
    // April is the second visible month, so currentMonth stays at March
    expect(captured!.currentMonth).toEqual({ year: 2026, month: 3 });

    // Press PageDown again — May is one month past the window, so the start
    // shifts by the minimum to April, making May the second pane ([April, May]).
    act(() => {
      grid.dispatchEvent(
        new KeyboardEvent("keydown", { key: "PageDown", bubbles: true }),
      );
    });

    expect(captured!.focusedDate).toBe("2026-05-15");
    expect(captured!.currentMonth).toEqual({ year: 2026, month: 4 });

    unmount();
  });

  it("keyboard PageUp from first visible month shifts view", () => {
    let captured:
      | { currentMonth: { year: number; month: number }; focusedDate: string }
      | undefined;

    const { container, unmount } = render(
      <MonthView {...defaultProps} defaultValue={april15} numberOfMonths={2}>
        <MonthDataCapture
          onCapture={(d) => {
            captured = d;
          }}
        />
        <Grid monthIndex={0} />
      </MonthView>,
    );

    // Initially April+May, focused on April 15
    expect(captured!.currentMonth).toEqual({ year: 2026, month: 4 });

    // Press PageUp to move focus to March 15 — outside visible range
    const grid = container.querySelector('[role="grid"]')!;
    act(() => {
      grid.dispatchEvent(
        new KeyboardEvent("keydown", { key: "PageUp", bubbles: true }),
      );
    });

    expect(captured!.focusedDate).toBe("2026-03-15");
    expect(captured!.currentMonth).toEqual({ year: 2026, month: 3 });

    unmount();
  });

  it("outsideMonth is relative to each grid's month", () => {
    const { container, unmount } = render(
      <MonthView {...defaultProps} defaultValue={march15} numberOfMonths={2}>
        <Grid monthIndex={0} />
        <Grid monthIndex={1} />
      </MonthView>,
    );

    const grids = container.querySelectorAll('[role="grid"]');

    // In grid 0 (March), outside-month dates should not be March dates
    const grid0OutsideMonth = Array.from(
      grids[0]!.querySelectorAll("[data-outside-month]"),
    );
    for (const el of grid0OutsideMonth) {
      const dateStr = el.getAttribute("data-date")!;
      expect(dateStr.startsWith("2026-03")).toBe(false);
    }

    // In grid 1 (April), outside-month dates should not be April dates
    const grid1OutsideMonth = Array.from(
      grids[1]!.querySelectorAll("[data-outside-month]"),
    );
    for (const el of grid1OutsideMonth) {
      const dateStr = el.getAttribute("data-date")!;
      expect(dateStr.startsWith("2026-04")).toBe(false);
    }

    unmount();
  });

  describe("navigation buttons with multi-month", () => {
    it("next button computes destination from last visible month", () => {
      const { container, unmount } = render(
        <MonthView {...defaultProps} defaultValue={march15} numberOfMonths={3}>
          <NextMonthButton data-testid="next" />
        </MonthView>,
      );

      // With numberOfMonths=3 viewing March, the last visible month is May.
      // "Next" should point to June 2026.
      const btn = container.querySelector('[data-testid="next"]')!;
      expect(btn.getAttribute("disabled")).toBeNull();

      unmount();
    });

    it("prev button computes destination from first visible month", () => {
      const { container, unmount } = render(
        <MonthView {...defaultProps} defaultValue={march15} numberOfMonths={3}>
          <PrevMonthButton data-testid="prev" />
        </MonthView>,
      );

      // "Prev" should point to February 2026 (one before first visible).
      const btn = container.querySelector('[data-testid="prev"]')!;
      expect(btn.getAttribute("disabled")).toBeNull();

      unmount();
    });

    it("next button disabled when last visible month reaches max", () => {
      const maxDate = Temporal.PlainDate.from("2026-05-31");
      const { container, unmount } = render(
        <MonthView
          {...defaultProps}
          defaultValue={march15}
          numberOfMonths={3}
          max={maxDate}
        >
          <NextMonthButton data-testid="next" />
        </MonthView>,
      );

      // Last visible month is May, max is May 31 → next (June) is beyond max
      const btn = container.querySelector('[data-testid="next"]')!;
      expect(btn.getAttribute("disabled")).toBe("");

      unmount();
    });

    it("prev button disabled when first visible month reaches min", () => {
      const minDate = Temporal.PlainDate.from("2026-03-01");
      const { container, unmount } = render(
        <MonthView
          {...defaultProps}
          defaultValue={march15}
          numberOfMonths={2}
          min={minDate}
        >
          <PrevMonthButton data-testid="prev" />
        </MonthView>,
      );

      // First visible month is March, min is March 1 → prev (Feb) is before min
      const btn = container.querySelector('[data-testid="prev"]')!;
      expect(btn.getAttribute("disabled")).toBe("");

      unmount();
    });

    it("clicking next shifts view by one month", () => {
      let captured:
        | { currentMonth: { year: number; month: number } }
        | undefined;

      const { container, unmount } = render(
        <MonthView {...defaultProps} defaultValue={march15} numberOfMonths={2}>
          <MonthDataCapture
            onCapture={(d) => {
              captured = d;
            }}
          />
          <NextMonthButton data-testid="next" />
        </MonthView>,
      );

      expect(captured!.currentMonth).toEqual({ year: 2026, month: 3 });

      act(() => {
        container
          .querySelector('[data-testid="next"]')!
          .dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });

      // Shifts by 1 month, not by numberOfMonths
      expect(captured!.currentMonth).toEqual({ year: 2026, month: 4 });

      unmount();
    });

    it("clicking prev shifts view by one month", () => {
      let captured:
        | { currentMonth: { year: number; month: number } }
        | undefined;

      const { container, unmount } = render(
        <MonthView {...defaultProps} defaultValue={march15} numberOfMonths={2}>
          <MonthDataCapture
            onCapture={(d) => {
              captured = d;
            }}
          />
          <PrevMonthButton data-testid="prev" />
        </MonthView>,
      );

      act(() => {
        container
          .querySelector('[data-testid="prev"]')!
          .dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });

      expect(captured!.currentMonth).toEqual({ year: 2026, month: 2 });

      unmount();
    });
  });

  describe("range selection across months", () => {
    it("range spanning two visible months shows inRange on intermediate dates", () => {
      const rangeStart = Temporal.PlainDate.from("2026-03-25");
      const rangeEnd = Temporal.PlainDate.from("2026-04-05");

      const { container, unmount } = render(
        <MonthView
          {...defaultProps}
          selectionMode="range"
          value={{ start: rangeStart, end: rangeEnd }}
          numberOfMonths={2}
        >
          <Grid monthIndex={0} />
          <Grid monthIndex={1} />
        </MonthView>,
      );

      const grids = container.querySelectorAll('[role="grid"]');

      // Grid 0 (March): March 25-31 should be in range
      const grid0InRange = Array.from(
        grids[0]!.querySelectorAll("[data-in-range]"),
      );
      const grid0InRangeDates = grid0InRange.map((el) =>
        el.getAttribute("data-date"),
      );
      expect(grid0InRangeDates).toContain("2026-03-25");
      expect(grid0InRangeDates).toContain("2026-03-31");

      // Grid 1 (April): April 1-5 should be in range
      const grid1InRange = Array.from(
        grids[1]!.querySelectorAll("[data-in-range]"),
      );
      const grid1InRangeDates = grid1InRange.map((el) =>
        el.getAttribute("data-date"),
      );
      expect(grid1InRangeDates).toContain("2026-04-01");
      expect(grid1InRangeDates).toContain("2026-04-05");

      unmount();
    });

    it("range-start and range-end markers appear in correct grids", () => {
      const rangeStart = Temporal.PlainDate.from("2026-03-20");
      const rangeEnd = Temporal.PlainDate.from("2026-04-10");

      const { container, unmount } = render(
        <MonthView
          {...defaultProps}
          selectionMode="range"
          value={{ start: rangeStart, end: rangeEnd }}
          numberOfMonths={2}
        >
          <Grid monthIndex={0} />
          <Grid monthIndex={1} />
        </MonthView>,
      );

      const grids = container.querySelectorAll('[role="grid"]');

      // range-start should be in grid 0 (March 20)
      const grid0RangeStart = grids[0]!.querySelector(
        '[data-range-start][data-date="2026-03-20"]',
      );
      expect(grid0RangeStart).toBeTruthy();

      // range-end should be in grid 1 (April 10)
      const grid1RangeEnd = grids[1]!.querySelector(
        '[data-range-end][data-date="2026-04-10"]',
      );
      expect(grid1RangeEnd).toBeTruthy();

      unmount();
    });
  });

  describe("grid state attributes", () => {
    it("each grid exposes correct month and year in state", () => {
      const { container, unmount } = render(
        <MonthView {...defaultProps} defaultValue={march15} numberOfMonths={2}>
          <Grid monthIndex={0} />
          <Grid monthIndex={1} />
        </MonthView>,
      );

      const grids = container.querySelectorAll('[role="grid"]');

      // Grid state attributes reflect each grid's month
      expect(grids[0]!.getAttribute("data-weeks-in-month")).toBeTruthy();
      expect(grids[0]!.getAttribute("data-days-per-week")).toBe("7");
      expect(grids[1]!.getAttribute("data-weeks-in-month")).toBeTruthy();
      expect(grids[1]!.getAttribute("data-days-per-week")).toBe("7");

      unmount();
    });

    it("CSS custom properties set per grid", () => {
      const { container, unmount } = render(
        <MonthView {...defaultProps} defaultValue={march15} numberOfMonths={2}>
          <Grid monthIndex={0} />
          <Grid monthIndex={1} />
        </MonthView>,
      );

      const grids = container.querySelectorAll('[role="grid"]');

      // Each grid should have its own CSS custom properties
      const style0 = (grids[0] as HTMLElement).style;
      const style1 = (grids[1] as HTMLElement).style;
      expect(style0.getPropertyValue("--calendar-days-per-week")).toBe("7");
      expect(style1.getPropertyValue("--calendar-days-per-week")).toBe("7");
      expect(style0.getPropertyValue("--calendar-weeks-in-month")).toBeTruthy();
      expect(style1.getPropertyValue("--calendar-weeks-in-month")).toBeTruthy();

      unmount();
    });
  });

  describe("backward compatibility", () => {
    it("single-month without monthIndex works unchanged", () => {
      const { container, unmount } = render(
        <MonthView {...defaultProps} defaultValue={march15}>
          <MonthYearString />
          <Grid />
        </MonthView>,
      );

      const grids = container.querySelectorAll('[role="grid"]');
      expect(grids).toHaveLength(1);

      // Grid should have aria-labelledby pointing to the MonthYearString
      const labelledBy = grids[0]!.getAttribute("aria-labelledby");
      expect(labelledBy).toBeTruthy();
      const label = document.getElementById(labelledBy!);
      expect(label?.textContent).toContain("March");

      unmount();
    });

    it("explicit monthIndex={0} on single-month setup works", () => {
      const { container, unmount } = render(
        <MonthView {...defaultProps} defaultValue={march15} numberOfMonths={1}>
          <MonthYearString monthIndex={0} />
          <Grid monthIndex={0} />
        </MonthView>,
      );

      const grids = container.querySelectorAll('[role="grid"]');
      expect(grids).toHaveLength(1);

      const dates = Array.from(grids[0]!.querySelectorAll("[data-date]"));
      const hasMarch = dates.some((el) =>
        el.getAttribute("data-date")?.startsWith("2026-03"),
      );
      expect(hasMarch).toBe(true);

      unmount();
    });
  });

  describe("onMonthChange with multi-month", () => {
    it("fires when navigation shifts visible months", () => {
      const onMonthChange = vi.fn();

      const { container, unmount } = render(
        <MonthView
          {...defaultProps}
          defaultValue={march15}
          numberOfMonths={2}
          onMonthChange={onMonthChange}
        >
          <NextMonthButton data-testid="next" />
        </MonthView>,
      );

      // Should not fire on mount
      expect(onMonthChange).not.toHaveBeenCalled();

      act(() => {
        container
          .querySelector('[data-testid="next"]')!
          .dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });

      expect(onMonthChange).toHaveBeenCalledTimes(1);
      const arg = onMonthChange.mock.calls[0]![0];
      // Should report the new first visible month (April)
      expect(arg.month).toBe(4);
      expect(arg.year).toBe(2026);

      unmount();
    });

    it("does not fire when selection stays within visible months", () => {
      const onMonthChange = vi.fn();
      let selectFn: (date: Temporal.PlainDate) => void = () => {};

      const { unmount } = render(
        <MonthView
          {...defaultProps}
          defaultValue={march15}
          numberOfMonths={2}
          onMonthChange={onMonthChange}
        >
          <SelectTrigger
            onCapture={(fn) => {
              selectFn = fn;
            }}
          />
        </MonthView>,
      );

      // Select within April (second visible month) — shouldn't trigger month change
      act(() => {
        selectFn(april15);
      });

      expect(onMonthChange).not.toHaveBeenCalled();

      unmount();
    });
  });

  describe("controlled month", () => {
    const march = Temporal.PlainYearMonth.from("2026-03");

    it("next button fires onMonthChange and keeps the view until the parent updates", () => {
      const onMonthChange = vi.fn();
      const { container, unmount } = render(
        <MonthView
          {...defaultProps}
          month={march}
          onMonthChange={onMonthChange}
        >
          <MonthYearString data-testid="label" />
          <NextMonthButton data-testid="next" />
        </MonthView>,
      );

      act(() => {
        container
          .querySelector('[data-testid="next"]')!
          .dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });

      expect(onMonthChange).toHaveBeenCalledTimes(1);
      const arg = onMonthChange.mock.calls[0]![0];
      expect(arg.year).toBe(2026);
      expect(arg.month).toBe(4);
      // Controlled: the view must not move on its own
      expect(
        container.querySelector('[data-testid="label"]')!.textContent,
      ).toContain("March");

      unmount();
    });

    it("next button advances by one month with numberOfMonths > 1", () => {
      // Regression: the adjacent month (April) is already visible in a
      // [March, April] window, so notification must come from the button
      // itself, not the focus-sync effect (which suppresses visible months).
      const onMonthChange = vi.fn();
      const { container, unmount } = render(
        <MonthView
          {...defaultProps}
          month={march}
          numberOfMonths={2}
          onMonthChange={onMonthChange}
        >
          <NextMonthButton data-testid="next" />
        </MonthView>,
      );

      act(() => {
        container
          .querySelector('[data-testid="next"]')!
          .dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });

      expect(onMonthChange).toHaveBeenCalledTimes(1);
      const arg = onMonthChange.mock.calls[0]![0];
      expect(arg.year).toBe(2026);
      expect(arg.month).toBe(4);

      unmount();
    });

    it("still fires a later keyboard crossing after a no-op button click", () => {
      // Regression for a value-keyed skip: focus already sits in the adjacent
      // (visible) month and the parent ignores the click, so the button's
      // focus move is a no-op. A subsequent keyboard crossing must NOT be
      // wrongly suppressed.
      const onMonthChange = vi.fn();
      let selectFn: (date: Temporal.PlainDate) => void = () => {};

      const { container, unmount } = render(
        <MonthView
          {...defaultProps}
          month={march}
          defaultValue={april15}
          numberOfMonths={2}
          onMonthChange={onMonthChange}
        >
          <SelectTrigger
            onCapture={(fn) => {
              selectFn = fn;
            }}
          />
          <NextMonthButton data-testid="next" />
        </MonthView>,
      );

      // Click next: target April is already the focused/visible month and the
      // parent (vi.fn) ignores it → focus move is a no-op.
      act(() => {
        container
          .querySelector('[data-testid="next"]')!
          .dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
      expect(onMonthChange).toHaveBeenCalledTimes(1); // April, from the button

      // Keyboard crossing into a non-visible month must still notify. With a
      // 2-month window starting March, focusing May shifts the start to April
      // (May becomes the second pane) — the minimum shift, not a jump to May.
      act(() => {
        selectFn(Temporal.PlainDate.from("2026-05-15"));
      });
      expect(onMonthChange).toHaveBeenCalledTimes(2);
      const arg = onMonthChange.mock.calls[1]![0];
      expect(arg.year).toBe(2026);
      expect(arg.month).toBe(4);

      unmount();
    });

    it("prev button fires onMonthChange with the preceding month", () => {
      const onMonthChange = vi.fn();
      const { container, unmount } = render(
        <MonthView
          {...defaultProps}
          month={march}
          onMonthChange={onMonthChange}
        >
          <PrevMonthButton data-testid="prev" />
        </MonthView>,
      );

      act(() => {
        container
          .querySelector('[data-testid="prev"]')!
          .dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });

      expect(onMonthChange).toHaveBeenCalledTimes(1);
      const arg = onMonthChange.mock.calls[0]![0];
      expect(arg.year).toBe(2026);
      expect(arg.month).toBe(2);

      unmount();
    });

    it("round-trips with a stateful parent", () => {
      function Harness() {
        const [month, setMonth] = useState(march);
        return (
          <MonthView {...defaultProps} month={month} onMonthChange={setMonth}>
            <MonthYearString data-testid="label" />
            <NextMonthButton data-testid="next" />
          </MonthView>
        );
      }

      const { container, unmount } = render(<Harness />);
      expect(
        container.querySelector('[data-testid="label"]')!.textContent,
      ).toContain("March");

      act(() => {
        container
          .querySelector('[data-testid="next"]')!
          .dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });

      expect(
        container.querySelector('[data-testid="label"]')!.textContent,
      ).toContain("April");

      unmount();
    });

    it("fires onMonthChange when focus moves into a non-visible month", () => {
      const onMonthChange = vi.fn();
      let selectFn: (date: Temporal.PlainDate) => void = () => {};

      const { unmount } = render(
        <MonthView
          {...defaultProps}
          month={march}
          onMonthChange={onMonthChange}
        >
          <SelectTrigger
            onCapture={(fn) => {
              selectFn = fn;
            }}
          />
        </MonthView>,
      );

      act(() => {
        selectFn(april15);
      });

      expect(onMonthChange).toHaveBeenCalledTimes(1);
      const arg = onMonthChange.mock.calls[0]![0];
      expect(arg.year).toBe(2026);
      expect(arg.month).toBe(4);

      unmount();
    });

    it("does not fire when the focused month is already visible", () => {
      const onMonthChange = vi.fn();
      let selectFn: (date: Temporal.PlainDate) => void = () => {};

      const { unmount } = render(
        <MonthView
          {...defaultProps}
          month={march}
          numberOfMonths={2}
          onMonthChange={onMonthChange}
        >
          <SelectTrigger
            onCapture={(fn) => {
              selectFn = fn;
            }}
          />
        </MonthView>,
      );

      // April is the second visible month — no notification needed
      act(() => {
        selectFn(april15);
      });

      expect(onMonthChange).not.toHaveBeenCalled();

      unmount();
    });

    it("crossing past the last visible month shifts by the minimum", () => {
      // [March, April] + focus into May → start becomes April ([April, May]),
      // not a jump to May — matching the Next button and uncontrolled mode.
      const onMonthChange = vi.fn();
      let selectFn: (date: Temporal.PlainDate) => void = () => {};

      const { unmount } = render(
        <MonthView
          {...defaultProps}
          month={march}
          numberOfMonths={2}
          onMonthChange={onMonthChange}
        >
          <SelectTrigger
            onCapture={(fn) => {
              selectFn = fn;
            }}
          />
        </MonthView>,
      );

      act(() => {
        selectFn(Temporal.PlainDate.from("2026-05-15"));
      });

      expect(onMonthChange).toHaveBeenCalledTimes(1);
      const arg = onMonthChange.mock.calls[0]![0];
      expect(arg.year).toBe(2026);
      expect(arg.month).toBe(4);

      unmount();
    });
  });

  describe("uncontrolled multi-month focus crossing", () => {
    const captureWindow = (
      selectDate: Temporal.PlainDate,
      numberOfMonths: number,
    ) => {
      let captured:
        | {
            allMonths: MonthData[];
            currentMonth: { year: number; month: number };
          }
        | undefined;
      let selectFn: (date: Temporal.PlainDate) => void = () => {};

      const { unmount } = render(
        <MonthView
          {...defaultProps}
          defaultValue={Temporal.PlainDate.from("2026-03-15")}
          numberOfMonths={numberOfMonths}
        >
          <SelectTrigger
            onCapture={(fn) => {
              selectFn = fn;
            }}
          />
          <MonthDataCapture
            onCapture={(d) => {
              captured = d;
            }}
          />
        </MonthView>,
      );

      act(() => {
        selectFn(selectDate);
      });

      const months = captured!.allMonths.map((m) => `${m.year}-${m.month}`);
      unmount();
      return months;
    };

    it("one month past the window scrolls by one (focused becomes last pane)", () => {
      // [March, April], focus May → [April, May], NOT [May, June].
      expect(captureWindow(Temporal.PlainDate.from("2026-05-10"), 2)).toEqual([
        "2026-4",
        "2026-5",
      ]);
    });

    it("two months past the window keeps focused as the last pane", () => {
      // [March, April], focus June → [May, June].
      expect(captureWindow(Temporal.PlainDate.from("2026-06-10"), 2)).toEqual([
        "2026-5",
        "2026-6",
      ]);
    });

    it("before the window makes the focused month the first pane", () => {
      // [March, April], focus January → [January, February].
      expect(captureWindow(Temporal.PlainDate.from("2026-01-10"), 2)).toEqual([
        "2026-1",
        "2026-2",
      ]);
    });
  });

  describe("focusedDate across months", () => {
    it("preserves focusedDate when numberOfMonths increases", () => {
      let captured: { focusedDate: string } | undefined;

      const { rerender, unmount } = render(
        <MonthView {...defaultProps} defaultValue={march15} numberOfMonths={1}>
          <MonthDataCapture
            onCapture={(d) => {
              captured = d;
            }}
          />
        </MonthView>,
      );

      expect(captured!.focusedDate).toBe("2026-03-15");

      rerender(
        <MonthView {...defaultProps} defaultValue={march15} numberOfMonths={3}>
          <MonthDataCapture
            onCapture={(d) => {
              captured = d;
            }}
          />
        </MonthView>,
      );

      // focusedDate should not change when numberOfMonths grows
      expect(captured!.focusedDate).toBe("2026-03-15");

      unmount();
    });

    it("preserves focusedDate when numberOfMonths decreases", () => {
      let captured: { focusedDate: string } | undefined;

      const { rerender, unmount } = render(
        <MonthView {...defaultProps} defaultValue={march15} numberOfMonths={3}>
          <MonthDataCapture
            onCapture={(d) => {
              captured = d;
            }}
          />
        </MonthView>,
      );

      expect(captured!.focusedDate).toBe("2026-03-15");

      rerender(
        <MonthView {...defaultProps} defaultValue={march15} numberOfMonths={1}>
          <MonthDataCapture
            onCapture={(d) => {
              captured = d;
            }}
          />
        </MonthView>,
      );

      expect(captured!.focusedDate).toBe("2026-03-15");

      unmount();
    });

    it("arrow key within visible months does not shift view", () => {
      let captured:
        | { currentMonth: { year: number; month: number }; focusedDate: string }
        | undefined;

      // Focus on March 31, with April also visible
      const march31 = Temporal.PlainDate.from("2026-03-31");
      const { container, unmount } = render(
        <MonthView {...defaultProps} defaultValue={march31} numberOfMonths={2}>
          <MonthDataCapture
            onCapture={(d) => {
              captured = d;
            }}
          />
          <Grid monthIndex={0} />
        </MonthView>,
      );

      expect(captured!.focusedDate).toBe("2026-03-31");
      expect(captured!.currentMonth).toEqual({ year: 2026, month: 3 });

      // ArrowRight → April 1, still within visible range
      const grid = container.querySelector('[role="grid"]')!;
      act(() => {
        grid.dispatchEvent(
          new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
        );
      });

      expect(captured!.focusedDate).toBe("2026-04-01");
      expect(captured!.currentMonth).toEqual({ year: 2026, month: 3 });

      unmount();
    });
  });
});

describe("non-Gregorian locale (th-TH)", () => {
  // th-TH defaults to the Buddhist calendar (ISO year + 543). All
  // PlainYearMonth values the component exposes must be ISO; the locale
  // calendar only affects display.
  const thProps = { ...defaultProps, locale: "th-TH" } as const;
  const march15 = Temporal.PlainDate.from("2026-03-15");

  /** Captures rootState.viewing from MonthView context. */
  function ViewingCapture({
    onCapture,
  }: {
    onCapture: (viewing: Temporal.PlainYearMonth) => void;
  }) {
    const { rootState } = useMonthViewState();
    onCapture(rootState.viewing as Temporal.PlainYearMonth);
    return null;
  }

  it("onMonthChange emits an ISO PlainYearMonth, not the locale calendar", () => {
    const onMonthChange = vi.fn();
    const { container, unmount } = render(
      <MonthView
        {...thProps}
        defaultValue={march15}
        onMonthChange={onMonthChange}
      >
        <NextMonthButton data-testid="next" />
      </MonthView>,
    );

    act(() => {
      container
        .querySelector('[data-testid="next"]')!
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onMonthChange).toHaveBeenCalledTimes(1);
    const arg = onMonthChange.mock.calls[0]![0];
    // ISO April 2026 — NOT Buddhist-2026 (which is ISO 1483-06).
    expect(arg.toString()).toBe("2026-04");
    expect(arg.year).toBe(2026);
    expect(arg.month).toBe(4);

    unmount();
  });

  it("rootState.viewing is an ISO PlainYearMonth", () => {
    let viewing: Temporal.PlainYearMonth | undefined;
    const { unmount } = render(
      <MonthView {...thProps} defaultValue={march15}>
        <ViewingCapture
          onCapture={(v) => {
            viewing = v;
          }}
        />
      </MonthView>,
    );

    expect(viewing!.toString()).toBe("2026-03");

    unmount();
  });

  it("NavButtonState.target is an ISO PlainYearMonth", () => {
    let nextTarget: Temporal.PlainYearMonth | undefined;
    const { unmount } = render(
      <MonthView {...thProps} defaultValue={march15}>
        <NextMonthButton
          render={(props, state) => {
            nextTarget = state.target;
            return <button {...props} />;
          }}
        />
      </MonthView>,
    );

    // Next from ISO March 2026 → ISO April 2026, not Buddhist.
    expect(nextTarget!.toString()).toBe("2026-04");

    unmount();
  });

  it("still renders the month label in the locale calendar", () => {
    const { container, unmount } = render(
      <MonthView {...thProps} defaultValue={march15}>
        <MonthYearString data-testid="label" />
      </MonthView>,
    );

    // ISO 2026 → Buddhist Era 2569.
    expect(
      container.querySelector('[data-testid="label"]')!.textContent,
    ).toContain("2569");

    unmount();
  });

  it("renders the locale-calendar label with the bundled shim", () => {
    // The label path now formats via PlainDate.toLocaleString, so the
    // Gregorian-only mini shim must still localize display through Intl.
    const { container, unmount } = render(
      <MonthView
        {...thProps}
        temporal={MiniTemporal}
        defaultValue={MiniTemporal.PlainDate.from("2026-03-15")}
      >
        <MonthYearString data-testid="label" />
      </MonthView>,
    );

    expect(
      container.querySelector('[data-testid="label"]')!.textContent,
    ).toContain("2569");

    unmount();
  });

  it("controlled round-trips without a century jump", () => {
    function Harness() {
      const [month, setMonth] = useState(
        Temporal.PlainYearMonth.from("2026-03"),
      );
      return (
        <MonthView {...thProps} month={month} onMonthChange={setMonth}>
          <MonthYearString data-testid="label" />
          <NextMonthButton data-testid="next" />
        </MonthView>
      );
    }

    const { container, unmount } = render(<Harness />);
    const label = () =>
      container.querySelector('[data-testid="label"]')!.textContent ?? "";
    expect(label()).toContain("2569"); // March 2569 BE

    act(() => {
      container
        .querySelector('[data-testid="next"]')!
        .dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Advanced one month, still Buddhist 2569 — not jumped ~543 years.
    expect(label()).toContain("2569");
    expect(label()).not.toContain("3112");

    unmount();
  });
});

describe("outsideDays", () => {
  const march15 = Temporal.PlainDate.from("2026-03-15");

  describe('outsideDays="enabled" (default)', () => {
    it("outside-month cells are visible and interactive", () => {
      const { container, unmount } = render(
        <MonthView {...defaultProps} defaultValue={march15}>
          <Grid />
        </MonthView>,
      );

      const outsideCells = Array.from(
        container.querySelectorAll("td[data-outside-month]"),
      );
      expect(outsideCells.length).toBeGreaterThan(0);

      // None should have data-hidden
      for (const cell of outsideCells) {
        expect(cell.getAttribute("data-hidden")).toBeNull();
      }

      // All outside-month td cells should contain a button
      for (const cell of outsideCells) {
        expect(cell.querySelector("button")).not.toBeNull();
      }

      // Buttons should not be disabled
      for (const cell of outsideCells) {
        const btn = cell.querySelector("button");
        expect(btn?.disabled).toBe(false);
      }

      unmount();
    });
  });

  describe('outsideDays="readOnly"', () => {
    it("outside-month buttons render but are disabled", () => {
      const { container, unmount } = render(
        <MonthView
          {...defaultProps}
          defaultValue={march15}
          outsideDays="readOnly"
        >
          <Grid />
        </MonthView>,
      );

      const outsideCells = Array.from(
        container.querySelectorAll("td[data-outside-month]"),
      );
      expect(outsideCells.length).toBeGreaterThan(0);

      for (const cell of outsideCells) {
        expect(cell.getAttribute("data-hidden")).toBeNull();
        expect(cell.getAttribute("data-disabled")).not.toBeNull();
        const btn = cell.querySelector("button");
        expect(btn).not.toBeNull();
        expect(btn?.disabled).toBe(true);
      }

      unmount();
    });

    it("range attributes still paint through outside-month cells", () => {
      // March 2026 starts on Sunday — so the grid has no leading padding.
      // But it ends on Tuesday Mar 31, so April 1–4 are outside-month padding.
      // Use a range that extends into April to verify range attrs paint through.
      const march25 = Temporal.PlainDate.from("2026-03-25");
      const april3 = Temporal.PlainDate.from("2026-04-03");

      const { container, unmount } = render(
        <MonthView
          {...defaultProps}
          selectionMode="range"
          value={{ start: march25, end: april3 }}
          outsideDays="readOnly"
        >
          <Grid />
        </MonthView>,
      );

      // April 1 in the March grid is outside-month
      const april1Cell = container.querySelector('[data-date="2026-04-01"]');
      expect(april1Cell).not.toBeNull();
      expect(april1Cell!.getAttribute("data-outside-month")).not.toBeNull();
      expect(april1Cell!.getAttribute("data-in-range")).not.toBeNull();

      unmount();
    });
  });

  describe('outsideDays="disabled"', () => {
    it("outside-month buttons render but are disabled, no range attrs", () => {
      // March 2026 ends on Tue Mar 31, so April 1–4 appear as outside-month padding.
      const march25 = Temporal.PlainDate.from("2026-03-25");
      const april3 = Temporal.PlainDate.from("2026-04-03");

      const { container, unmount } = render(
        <MonthView
          {...defaultProps}
          selectionMode="range"
          value={{ start: march25, end: april3 }}
          outsideDays="disabled"
        >
          <Grid />
        </MonthView>,
      );

      const outsideCells = Array.from(
        container.querySelectorAll("td[data-outside-month]"),
      );
      expect(outsideCells.length).toBeGreaterThan(0);

      for (const cell of outsideCells) {
        expect(cell.getAttribute("data-hidden")).toBeNull();
        expect(cell.getAttribute("data-disabled")).not.toBeNull();
        expect(cell.querySelector("button")).not.toBeNull();
        // No range attributes
        expect(cell.getAttribute("data-in-range")).toBeNull();
        expect(cell.getAttribute("data-range-start")).toBeNull();
        expect(cell.getAttribute("data-range-end")).toBeNull();
        expect(cell.getAttribute("data-range-boundary")).toBeNull();
      }

      unmount();
    });
  });

  describe('outsideDays="hidden"', () => {
    it("outside-month cells are empty with data-hidden and aria-hidden", () => {
      const { container, unmount } = render(
        <MonthView
          {...defaultProps}
          defaultValue={march15}
          outsideDays="hidden"
        >
          <Grid />
        </MonthView>,
      );

      const hiddenCells = Array.from(
        container.querySelectorAll("[data-hidden]"),
      );
      expect(hiddenCells.length).toBeGreaterThan(0);

      for (const cell of hiddenCells) {
        expect(cell.getAttribute("data-outside-month")).not.toBeNull();
        expect(cell.querySelector("button")).toBeNull();
        expect(cell.getAttribute("aria-hidden")).toBe("true");
      }

      unmount();
    });

    it("hidden cells have no range attributes", () => {
      const march5 = Temporal.PlainDate.from("2026-03-05");
      const march25 = Temporal.PlainDate.from("2026-03-25");

      const { container, unmount } = render(
        <MonthView
          {...defaultProps}
          selectionMode="range"
          value={{ start: march5, end: march25 }}
          outsideDays="hidden"
        >
          <Grid />
        </MonthView>,
      );

      const hiddenCells = Array.from(
        container.querySelectorAll("[data-hidden]"),
      );
      expect(hiddenCells.length).toBeGreaterThan(0);

      for (const cell of hiddenCells) {
        expect(cell.getAttribute("data-in-range")).toBeNull();
        expect(cell.getAttribute("data-range-start")).toBeNull();
        expect(cell.getAttribute("data-range-end")).toBeNull();
        expect(cell.getAttribute("data-range-boundary")).toBeNull();
        expect(cell.getAttribute("data-selected")).toBeNull();
      }

      unmount();
    });

    it("in-month cells still show range attributes", () => {
      const march5 = Temporal.PlainDate.from("2026-03-05");
      const march25 = Temporal.PlainDate.from("2026-03-25");

      const { container, unmount } = render(
        <MonthView
          {...defaultProps}
          selectionMode="range"
          value={{ start: march5, end: march25 }}
          outsideDays="hidden"
        >
          <Grid />
        </MonthView>,
      );

      const rangeStart = container.querySelector("[data-range-start]");
      expect(rangeStart).not.toBeNull();
      expect(rangeStart!.getAttribute("data-date")).toBe("2026-03-05");

      const rangeEnd = container.querySelector("[data-range-end]");
      expect(rangeEnd).not.toBeNull();
      expect(rangeEnd!.getAttribute("data-date")).toBe("2026-03-25");

      const inRangeCells = Array.from(
        container.querySelectorAll("[data-in-range]"),
      );
      expect(inRangeCells.length).toBeGreaterThan(0);

      for (const cell of inRangeCells) {
        expect(cell.getAttribute("data-hidden")).toBeNull();
      }

      unmount();
    });

    it("works with multi-month: each grid hides its own outside-month cells", () => {
      const { container, unmount } = render(
        <MonthView
          {...defaultProps}
          defaultValue={march15}
          numberOfMonths={2}
          outsideDays="hidden"
        >
          <Grid monthIndex={0} />
          <Grid monthIndex={1} />
        </MonthView>,
      );

      const grids = Array.from(container.querySelectorAll("[role='grid']"));
      expect(grids.length).toBe(2);

      for (const grid of grids) {
        const hiddenInGrid = grid.querySelectorAll("[data-hidden]");
        Array.from(hiddenInGrid).forEach((cell) => {
          expect(cell.querySelector("button")).toBeNull();
        });
      }

      unmount();
    });

    it("range spanning months clips per grid", () => {
      const march25 = Temporal.PlainDate.from("2026-03-25");
      const april5 = Temporal.PlainDate.from("2026-04-05");

      const { container, unmount } = render(
        <MonthView
          {...defaultProps}
          selectionMode="range"
          value={{ start: march25, end: april5 }}
          numberOfMonths={2}
          outsideDays="hidden"
        >
          <Grid monthIndex={0} />
          <Grid monthIndex={1} />
        </MonthView>,
      );

      const grids = Array.from(container.querySelectorAll("[role='grid']"));

      const grid0Hidden = Array.from(
        grids[0]!.querySelectorAll("[data-hidden]"),
      );
      for (const cell of grid0Hidden) {
        expect(cell.getAttribute("data-in-range")).toBeNull();
      }

      const grid1Hidden = Array.from(
        grids[1]!.querySelectorAll("[data-hidden]"),
      );
      for (const cell of grid1Hidden) {
        expect(cell.getAttribute("data-in-range")).toBeNull();
      }

      const rangeStartInGrid0 = grids[0]!.querySelector("[data-range-start]");
      expect(rangeStartInGrid0).not.toBeNull();
      expect(rangeStartInGrid0!.getAttribute("data-date")).toBe("2026-03-25");

      const rangeEndInGrid1 = grids[1]!.querySelector("[data-range-end]");
      expect(rangeEndInGrid1).not.toBeNull();
      expect(rangeEndInGrid1!.getAttribute("data-date")).toBe("2026-04-05");

      unmount();
    });

    it("fixedWeeks + hidden renders empty rows for padding weeks", () => {
      const feb15 = Temporal.PlainDate.from("2026-02-15");

      const { container, unmount } = render(
        <MonthView
          {...defaultProps}
          defaultValue={feb15}
          fixedWeeks
          outsideDays="hidden"
        >
          <Grid />
        </MonthView>,
      );

      const rows = container.querySelectorAll("tbody tr");
      expect(rows.length).toBe(6);

      const lastRow = rows[rows.length - 1]!;
      const cells = lastRow.querySelectorAll("td");
      const allHidden = Array.from(cells).every(
        (cell) => cell.getAttribute("data-hidden") !== null,
      );
      expect(allHidden).toBe(true);

      unmount();
    });
  });

  describe("range clipping per grid", () => {
    it("disabled clips range in SelectedRange but readonly does not", () => {
      const march25 = Temporal.PlainDate.from("2026-03-25");
      const april5 = Temporal.PlainDate.from("2026-04-05");

      // "disabled" — outside-month cells should NOT have range attrs
      const { container: c1, unmount: u1 } = render(
        <MonthView
          {...defaultProps}
          selectionMode="range"
          value={{ start: march25, end: april5 }}
          numberOfMonths={2}
          outsideDays="disabled"
        >
          <Grid monthIndex={0} />
          <Grid monthIndex={1} />
        </MonthView>,
      );

      const grids1 = Array.from(c1.querySelectorAll("[role='grid']"));
      // Grid 0 (March): April dates should have no range attrs
      const outsideInGrid0 = Array.from(
        grids1[0]!.querySelectorAll("[data-outside-month]"),
      );
      for (const cell of outsideInGrid0) {
        expect(cell.getAttribute("data-in-range")).toBeNull();
      }

      u1();

      // "readonly" — outside-month cells SHOULD have range attrs
      const { container: c2, unmount: u2 } = render(
        <MonthView
          {...defaultProps}
          selectionMode="range"
          value={{ start: march25, end: april5 }}
          numberOfMonths={2}
          outsideDays="readOnly"
        >
          <Grid monthIndex={0} />
          <Grid monthIndex={1} />
        </MonthView>,
      );

      const grids2 = Array.from(c2.querySelectorAll("[role='grid']"));
      // Grid 0 (March): April dates should still have range attrs with readonly
      const outsideInGrid0Readonly = Array.from(
        grids2[0]!.querySelectorAll("[data-outside-month][data-in-range]"),
      );
      expect(outsideInGrid0Readonly.length).toBeGreaterThan(0);

      u2();
    });
  });
});
