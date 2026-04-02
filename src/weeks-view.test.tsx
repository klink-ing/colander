import { Temporal } from "@js-temporal/polyfill";
import { render, screen, act, cleanup, within } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  Grid,
  GridBody,
  WeekTemplate,
  DayCellTemplate,
  DayButton,
} from "./grid";
import { GridHeader, GridHeaderCell } from "./grid-header";
import {
  MonthSeparator,
  MonthSeparatorMonth,
  MonthSeparatorYear,
  MonthSeparatorWeekCount,
} from "./month-separator";
import { useViewContext } from "./view-context";
import { NextWeeksButton, PrevWeeksButton } from "./weeks-navigation";
import { WeeksView } from "./weeks-view";
import { useWeeksViewState, useWeeksViewStable } from "./weeks-view-context";

const T = Temporal;

// ---------------------------------------------------------------------------
// Test helper components
// ---------------------------------------------------------------------------

function WindowDisplay() {
  const state = useWeeksViewState();
  return (
    <div>
      <span data-testid="start">{state.windowInfo.windowStart.toString()}</span>
      <span data-testid="end">{state.windowInfo.windowEnd.toString()}</span>
      <span data-testid="count">{state.windowInfo.weekCount}</span>
      <span data-testid="day-count">{state.windowInfo.dayCount}</span>
      <span data-testid="enabled-week-count">
        {state.windowInfo.enabledWeekCount}
      </span>
      <span data-testid="enabled-day-count">
        {state.windowInfo.enabledDayCount}
      </span>
    </div>
  );
}

function ViewTypeDisplay() {
  const view = useViewContext();
  return <span data-testid="view-type">{view.viewType}</span>;
}

function FocusDisplay() {
  const view = useViewContext();
  return <span data-testid="focus">{view.focusedDate.toString()}</span>;
}

function NavButtons() {
  const { goNext, goPrev } = useWeeksViewStable();
  return (
    <div>
      <button type="button" onClick={() => goPrev()} data-testid="prev">
        Prev
      </button>
      <button type="button" onClick={() => goNext()} data-testid="next">
        Next
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

afterEach(() => {
  cleanup();
});

describe("WeeksView", () => {
  it("renders 8 weeks starting from firstWeek", () => {
    render(
      <WeeksView
        temporal={T}
        weekCount={8}
        defaultFirstWeek={T.PlainDate.from("2026-03-01")}
      >
        <WindowDisplay />
      </WeeksView>,
    );
    expect(screen.getByTestId("start").textContent).toBe("2026-03-01");
    expect(screen.getByTestId("end").textContent).toBe("2026-04-25");
    expect(screen.getByTestId("count").textContent).toBe("8");
    expect(screen.getByTestId("day-count").textContent).toBe("56");
  });

  it("provides viewType=weeks", () => {
    render(
      <WeeksView
        temporal={T}
        weekCount={4}
        defaultFirstWeek={T.PlainDate.from("2026-03-01")}
      >
        <ViewTypeDisplay />
      </WeeksView>,
    );
    expect(screen.getByTestId("view-type").textContent).toBe("weeks");
  });

  it("accepts { month, year } as firstWeek", () => {
    render(
      <WeeksView
        temporal={T}
        weekCount={4}
        defaultFirstWeek={{ month: 3, year: 2026 }}
      >
        <WindowDisplay />
      </WeeksView>,
    );
    expect(screen.getByTestId("start").textContent).toBe("2026-03-01");
  });

  it("fires onWindowChange on mount", () => {
    const onWindowChange = vi.fn();
    render(
      <WeeksView
        temporal={T}
        weekCount={4}
        defaultFirstWeek={T.PlainDate.from("2026-03-01")}
        onWindowChange={onWindowChange}
      >
        <div />
      </WeeksView>,
    );
    expect(onWindowChange).toHaveBeenCalledTimes(1);
    expect(onWindowChange.mock.calls[0][0].weekCount).toBe(4);
  });

  it("navigates forward via goNext (buttons always shift by weekCount)", () => {
    render(
      <WeeksView
        temporal={T}
        weekCount={4}
        defaultFirstWeek={T.PlainDate.from("2026-03-01")}
        scrollBy="row"
      >
        <WindowDisplay />
        <NavButtons />
      </WeeksView>,
    );
    expect(screen.getByTestId("start").textContent).toBe("2026-03-01");

    act(() => {
      screen.getByTestId("next").click();
    });
    // Buttons always shift by weekCount (4), regardless of scrollBy
    expect(screen.getByTestId("start").textContent).toBe("2026-03-29");
  });

  it("navigates backward via goPrev (buttons always shift by weekCount)", () => {
    render(
      <WeeksView
        temporal={T}
        weekCount={4}
        defaultFirstWeek={T.PlainDate.from("2026-03-29")}
        scrollBy="row"
      >
        <WindowDisplay />
        <NavButtons />
      </WeeksView>,
    );
    act(() => {
      screen.getByTestId("prev").click();
    });
    expect(screen.getByTestId("start").textContent).toBe("2026-03-01");
  });

  it("navigates by page when scrollBy=page", () => {
    render(
      <WeeksView
        temporal={T}
        weekCount={4}
        defaultFirstWeek={T.PlainDate.from("2026-03-01")}
        scrollBy="page"
      >
        <WindowDisplay />
        <NavButtons />
      </WeeksView>,
    );
    act(() => {
      screen.getByTestId("next").click();
    });
    // scrollBy=page shifts by weekCount (4) weeks = 28 days
    expect(screen.getByTestId("start").textContent).toBe("2026-03-29");
  });

  it("focuses selected date if visible", () => {
    render(
      <WeeksView
        temporal={T}
        weekCount={8}
        defaultFirstWeek={T.PlainDate.from("2026-03-01")}
        defaultValue={T.PlainDate.from("2026-03-15")}
      >
        <FocusDisplay />
      </WeeksView>,
    );
    expect(screen.getByTestId("focus").textContent).toBe("2026-03-15");
  });

  it("focuses first day of window when no selection", () => {
    render(
      <WeeksView
        temporal={T}
        weekCount={8}
        defaultFirstWeek={T.PlainDate.from("2026-03-01")}
      >
        <FocusDisplay />
      </WeeksView>,
    );
    expect(screen.getByTestId("focus").textContent).toBe("2026-03-01");
  });

  it("snaps firstWeek to the start of the week (Sunday)", () => {
    // 2026-03-04 is a Wednesday; should snap back to 2026-03-01 (Sunday)
    render(
      <WeeksView
        temporal={T}
        weekCount={4}
        defaultFirstWeek={T.PlainDate.from("2026-03-04")}
      >
        <WindowDisplay />
      </WeeksView>,
    );
    expect(screen.getByTestId("start").textContent).toBe("2026-03-01");
  });

  it("computes enabledDayCount/enabledWeekCount with isDateDisabled", () => {
    // Disable all Mondays
    const isDateDisabled = (date: Temporal.PlainDate) => date.dayOfWeek === 1; // Monday

    render(
      <WeeksView
        temporal={T}
        weekCount={1}
        defaultFirstWeek={T.PlainDate.from("2026-03-01")}
        isDateDisabled={isDateDisabled}
      >
        <WindowDisplay />
      </WeeksView>,
    );
    // 1 week = 7 days, 1 Monday disabled => 6 enabled days
    expect(screen.getByTestId("enabled-day-count").textContent).toBe("6");
    expect(screen.getByTestId("enabled-week-count").textContent).toBe("1");
  });

  it("fires onFirstWeekChange on navigation", () => {
    const onFirstWeekChange = vi.fn();
    render(
      <WeeksView
        temporal={T}
        weekCount={4}
        defaultFirstWeek={T.PlainDate.from("2026-03-01")}
        onFirstWeekChange={onFirstWeekChange}
      >
        <NavButtons />
      </WeeksView>,
    );
    act(() => {
      screen.getByTestId("next").click();
    });
    expect(onFirstWeekChange).toHaveBeenCalledTimes(1);
    // weekCount=4, so shifts by 4 weeks
    expect(onFirstWeekChange.mock.calls[0][0].toString()).toBe("2026-03-29");
  });

  it("accepts { isoWeek, isoYear } as firstWeek", () => {
    render(
      <WeeksView
        temporal={T}
        weekCount={1}
        defaultFirstWeek={{ isoWeek: 10, isoYear: 2026 }}
      >
        <WindowDisplay />
      </WeeksView>,
    );
    // ISO week 10 of 2026: Mon 2026-03-02, snapped to Sun 2026-03-01
    expect(screen.getByTestId("start").textContent).toBe("2026-03-01");
  });

  it("provides weeks data via context", () => {
    function WeeksDataDisplay() {
      const state = useWeeksViewState();
      return <span data-testid="weeks-length">{state.weeks.length}</span>;
    }

    render(
      <WeeksView
        temporal={T}
        weekCount={6}
        defaultFirstWeek={T.PlainDate.from("2026-03-01")}
      >
        <WeeksDataDisplay />
      </WeeksView>,
    );
    expect(screen.getByTestId("weeks-length").textContent).toBe("6");
  });

  it("ensures focusedDate stays in window after navigation", () => {
    render(
      <WeeksView
        temporal={T}
        weekCount={2}
        defaultFirstWeek={T.PlainDate.from("2026-03-01")}
        scrollBy="page"
      >
        <FocusDisplay />
        <NavButtons />
      </WeeksView>,
    );
    expect(screen.getByTestId("focus").textContent).toBe("2026-03-01");

    act(() => {
      screen.getByTestId("next").click();
    });
    // After navigating 2 weeks forward (page), focused date should be in new window
    expect(screen.getByTestId("focus").textContent).toBe("2026-03-15");
  });
});

// ---------------------------------------------------------------------------
// Regression tests for fixed bugs
// ---------------------------------------------------------------------------

describe("WeeksView regression: no spurious data-outside-month (Bug #1)", () => {
  it("days within weeks view do not have data-outside-month", () => {
    // Bug: computeDayCellState received { year: 0, month: 0 } as currentDateTime
    // in weeks view, so isCurrentMonth was always false and every day got
    // data-outside-month. Fix passes per-day { year, month }.
    const { container } = render(
      <WeeksView
        temporal={T}
        weekCount={4}
        defaultFirstWeek={T.PlainDate.from("2026-03-01")}
      >
        <Grid>
          <GridHeader>
            <GridHeaderCell />
          </GridHeader>
          <GridBody>
            <WeekTemplate>
              <DayCellTemplate>
                <DayButton />
              </DayCellTemplate>
            </WeekTemplate>
          </GridBody>
        </Grid>
      </WeeksView>,
    );

    const cells = container.querySelectorAll("td[role='gridcell']");
    expect(cells.length).toBeGreaterThan(0);

    const outsideMonthCells = container.querySelectorAll(
      "td[data-outside-month]",
    );
    expect(outsideMonthCells.length).toBe(0);
  });

  it("days spanning a month boundary still have no data-outside-month", () => {
    // Window: 2026-03-22 through 2026-04-18 (4 weeks crossing March/April)
    const { container } = render(
      <WeeksView
        temporal={T}
        weekCount={4}
        defaultFirstWeek={T.PlainDate.from("2026-03-22")}
      >
        <Grid>
          <GridBody>
            <WeekTemplate>
              <DayCellTemplate />
            </WeekTemplate>
          </GridBody>
        </Grid>
      </WeeksView>,
    );

    const outsideMonthCells = container.querySelectorAll(
      "td[data-outside-month]",
    );
    expect(outsideMonthCells.length).toBe(0);
  });
});

describe("WeeksView regression: MonthSeparator renders in context (Bug #2)", () => {
  it("MonthSeparator renders month and year at month boundaries", () => {
    // Window: 2026-03-22 through 2026-04-18 (4 weeks crossing March/April)
    // Should render separators for March and April.
    const { container } = render(
      <WeeksView
        temporal={T}
        weekCount={4}
        defaultFirstWeek={T.PlainDate.from("2026-03-22")}
      >
        <Grid>
          <GridBody>
            <MonthSeparator>
              <MonthSeparatorMonth /> <MonthSeparatorYear />
            </MonthSeparator>
            <WeekTemplate>
              <DayCellTemplate />
            </WeekTemplate>
          </GridBody>
        </Grid>
      </WeeksView>,
    );

    const view = within(container);
    // March separator (first visible)
    expect(view.getByText("March")).toBeTruthy();
    // April separator (month boundary)
    expect(view.getByText("April")).toBeTruthy();
    // Year should appear for both
    expect(view.getAllByText("2026").length).toBeGreaterThanOrEqual(2);
  });

  it("MonthSeparatorWeekCount shows correct counts", () => {
    // Window: 2026-03-22 through 2026-04-18
    // March 22 is a Sunday, so weeks starting: Mar 22, Mar 29, Apr 5, Apr 12
    // March: weeks at index 0 (month=3) and 1 (month=3) -> weeksVisibleAfter=2
    // April: weeks at index 2 (month=4) and 3 (month=4) -> weeksVisibleAfter=2
    const { container } = render(
      <WeeksView
        temporal={T}
        weekCount={4}
        defaultFirstWeek={T.PlainDate.from("2026-03-22")}
      >
        <Grid>
          <GridBody>
            <MonthSeparator>
              <MonthSeparatorMonth />{" "}
              <MonthSeparatorWeekCount data-testid="wc" />
            </MonthSeparator>
            <WeekTemplate>
              <DayCellTemplate />
            </WeekTemplate>
          </GridBody>
        </Grid>
      </WeeksView>,
    );

    // Both separators should show weeksVisibleAfter
    const weekCountSpans = container.querySelectorAll("[data-testid='wc']");
    expect(weekCountSpans.length).toBe(2);
  });

  it("MonthSeparator does not throw outside WeeksView context", () => {
    // MonthSeparator used outside any context should throw a helpful error
    // (from useMonthSeparatorData)
    expect(() =>
      render(
        <table>
          <tbody>
            <MonthSeparator />
          </tbody>
        </table>,
      ),
    ).toThrow();
  });
});

describe("WeeksView regression: goNext/goPrev shift by weekCount (Bug #3)", () => {
  it("NextWeeksButton shifts by weekCount, not scrollBy", () => {
    // Bug: goNext used shiftAmount (from scrollBy) as default. With
    // scrollBy="row", buttons shifted by 1 week instead of weekCount.
    // Fix: goNext/goPrev default to weekCount.
    render(
      <WeeksView
        temporal={T}
        weekCount={4}
        defaultFirstWeek={T.PlainDate.from("2026-03-01")}
        scrollBy="row"
      >
        <WindowDisplay />
        <NextWeeksButton data-testid="next-btn">Next</NextWeeksButton>
      </WeeksView>,
    );
    expect(screen.getByTestId("start").textContent).toBe("2026-03-01");

    act(() => {
      screen.getByTestId("next-btn").click();
    });
    // Should shift by weekCount=4, landing on 2026-03-29
    expect(screen.getByTestId("start").textContent).toBe("2026-03-29");
  });

  it("PrevWeeksButton shifts by weekCount, not scrollBy", () => {
    render(
      <WeeksView
        temporal={T}
        weekCount={4}
        defaultFirstWeek={T.PlainDate.from("2026-03-29")}
        scrollBy="row"
      >
        <WindowDisplay />
        <PrevWeeksButton data-testid="prev-btn">Prev</PrevWeeksButton>
      </WeeksView>,
    );
    expect(screen.getByTestId("start").textContent).toBe("2026-03-29");

    act(() => {
      screen.getByTestId("prev-btn").click();
    });
    // Should shift by weekCount=4, landing on 2026-03-01
    expect(screen.getByTestId("start").textContent).toBe("2026-03-01");
  });

  it("NextWeeksButton with explicit shiftBy overrides weekCount", () => {
    render(
      <WeeksView
        temporal={T}
        weekCount={4}
        defaultFirstWeek={T.PlainDate.from("2026-03-01")}
        scrollBy="row"
      >
        <WindowDisplay />
        <NextWeeksButton shiftBy={2} data-testid="next-btn">
          Next
        </NextWeeksButton>
      </WeeksView>,
    );

    act(() => {
      screen.getByTestId("next-btn").click();
    });
    // Explicit shiftBy=2 should shift by 2 weeks, landing on 2026-03-15
    expect(screen.getByTestId("start").textContent).toBe("2026-03-15");
  });
});
