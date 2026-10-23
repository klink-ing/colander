// @vitest-environment jsdom
import { Temporal } from "@js-temporal/polyfill";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import {
  DayButton,
  DayCellTemplate,
  Grid,
  GridBody,
  WeekTemplate,
} from "./grid";
import { MonthView } from "./month-view";
import { useViewStable, useViewState } from "./view-context";
import { WeeksView } from "./weeks-view";

const T = Temporal;

const counts = { stable: 0, state: 0 };

function StableProbe() {
  useViewStable();
  counts.stable++;
  return null;
}

function StateProbe() {
  useViewState();
  counts.state++;
  return null;
}

const grid = (
  <Grid>
    <GridBody>
      <WeekTemplate>
        <DayCellTemplate>
          <DayButton />
        </DayCellTemplate>
      </WeekTemplate>
    </GridBody>
  </Grid>
);

const views: {
  description: string;
  view: (children: ReactNode) => ReactNode;
}[] = [
  {
    description: "MonthView",
    view: (children) => (
      <MonthView
        temporal={T}
        defaultValue={T.PlainDate.from("2026-03-15")}
        defaultMonth={T.PlainYearMonth.from("2026-03")}
      >
        {children}
      </MonthView>
    ),
  },
  {
    description: "WeeksView",
    view: (children) => (
      <WeeksView
        temporal={T}
        weekCount={4}
        defaultFirstWeek={T.PlainDate.from("2026-03-01")}
        defaultValue={T.PlainDate.from("2026-03-15")}
      >
        {children}
      </WeeksView>
    ),
  },
];

describe.each(views)("$description stable/state view contexts", ({ view }) => {
  function setup() {
    render(
      view(
        <>
          <StableProbe />
          <StateProbe />
          {grid}
        </>,
      ),
    );
    const day = (n: number) =>
      screen.getAllByRole("button").find((b) => b.textContent === String(n))!;
    const reset = () => {
      counts.stable = 0;
      counts.state = 0;
    };
    return { day, reset };
  }

  it.each([
    {
      description: "grid focus does not re-render either context's consumers",
      act: (day: (n: number) => HTMLElement) => day(15).focus(),
      expected: { stable: 0, state: 0 },
    },
    {
      description: "hovering a day does not re-render either",
      act: (day: (n: number) => HTMLElement) => {
        fireEvent.pointerEnter(day(20));
        fireEvent.mouseOver(day(20));
      },
      expected: { stable: 0, state: 0 },
    },
    {
      description: "moving focus re-renders state consumers only",
      act: (day: (n: number) => HTMLElement) => {
        fireEvent.keyDown(day(15), { key: "ArrowRight" });
      },
      expected: { stable: 0, state: 1 },
    },
  ])("$description", ({ act: action, expected }) => {
    const { day, reset } = setup();
    act(() => day(15).focus());
    reset();

    act(() => action(day));

    expect(counts).toEqual(expected);
  });
});
