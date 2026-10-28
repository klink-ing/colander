import { Temporal } from "@js-temporal/polyfill";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { MonthView } from "./month-view";
import type { MonthViewProps } from "./month-view";
import { useMonthViewStable, useMonthViewState } from "./month-view-context";
import { useViewContext } from "./view-context";

const T = Temporal;

let go: { next: () => void; prev: () => void };

function Probe() {
  const { goNextMonth, goPrevMonth } = useMonthViewStable();
  const { currentMonth } = useMonthViewState();
  const { focusedDate } = useViewContext();
  go = { next: goNextMonth, prev: goPrevMonth };
  return (
    <>
      <span data-testid="month">
        {currentMonth.year}-{String(currentMonth.month).padStart(2, "0")}
      </span>
      <span data-testid="focus">{focusedDate.toString()}</span>
    </>
  );
}

const base = {
  temporal: T,
  timeZone: "UTC",
  defaultValue: T.PlainDate.from("2026-03-15"),
} as const;

const month = () => screen.getByTestId("month").textContent;
const focus = () => screen.getByTestId("focus").textContent;

afterEach(cleanup);

describe("MonthView goNextMonth/goPrevMonth honor outOfRangeBehavior", () => {
  it.each([
    {
      description: "stop: goPrevMonth into the min month moves",
      props: {
        min: T.PlainDate.from("2026-02-10"),
        outOfRangeBehavior: "stop",
      },
      call: "prev" as const,
      expected: { month: "2026-02", focus: "2026-02-01" },
    },
    {
      description: "stop: goPrevMonth before the min month does nothing",
      props: {
        min: T.PlainDate.from("2026-03-10"),
        outOfRangeBehavior: "stop",
      },
      call: "prev" as const,
      expected: { month: "2026-03", focus: "2026-03-15" },
    },
    {
      description: "stop: goNextMonth past the max month does nothing",
      props: {
        max: T.PlainDate.from("2026-03-20"),
        outOfRangeBehavior: "stop",
      },
      call: "next" as const,
      expected: { month: "2026-03", focus: "2026-03-15" },
    },
    {
      description: "stop: goNextMonth with only min set still moves",
      props: {
        min: T.PlainDate.from("2026-03-10"),
        outOfRangeBehavior: "stop",
      },
      call: "next" as const,
      expected: { month: "2026-04", focus: "2026-04-01" },
    },
    {
      description: "unbounded: goNextMonth moves past max",
      props: { max: T.PlainDate.from("2026-03-20") },
      call: "next" as const,
      expected: { month: "2026-04", focus: "2026-04-01" },
    },
  ] satisfies {
    description: string;
    props: Partial<MonthViewProps>;
    call: "next" | "prev";
    expected: { month: string; focus: string };
  }[])("uncontrolled, $description", ({ props, call, expected }) => {
    render(
      <MonthView {...base} {...props}>
        <Probe />
      </MonthView>,
    );

    act(() => go[call]());

    expect({ month: month(), focus: focus() }).toEqual(expected);
  });

  it.each([
    {
      description: "stop: blocked step does not notify the parent",
      props: {
        max: T.PlainDate.from("2026-03-20"),
        outOfRangeBehavior: "stop",
      },
      expected: { calls: 0 },
    },
    {
      description: "unbounded: step notifies the parent once",
      props: { max: T.PlainDate.from("2026-03-20") },
      expected: { calls: 1 },
    },
  ] satisfies {
    description: string;
    props: Partial<MonthViewProps>;
    expected: { calls: number };
  }[])("controlled, $description", ({ props, expected }) => {
    const onMonthChange = vi.fn();
    render(
      <MonthView
        {...base}
        {...props}
        month={T.PlainYearMonth.from("2026-03")}
        onMonthChange={onMonthChange}
      >
        <Probe />
      </MonthView>,
    );

    act(() => go.next());

    expect({ calls: onMonthChange.mock.calls.length }).toEqual(expected);
    expect(month()).toBe("2026-03");
  });
});
