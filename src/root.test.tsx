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
      ValueChangeMeta<DateRange<"PlainDate"> | undefined>,
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
