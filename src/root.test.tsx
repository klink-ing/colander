// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { Temporal } from "@js-temporal/polyfill";
import { Root } from "./root";
import { useDatePicker } from "./context";
import type { DateRange, ValueChangeMeta } from "./types";

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
