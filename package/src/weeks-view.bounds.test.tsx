import { Temporal } from "@js-temporal/polyfill";
import {
  render,
  screen,
  act,
  cleanup,
  fireEvent,
} from "@testing-library/react";
import { createRef } from "react";
import { describe, it, expect, afterEach } from "vitest";
import {
  Grid,
  GridBody,
  WeekTemplate,
  DayCellTemplate,
  DayButton,
} from "./grid";
import type { OutOfRangeBehavior } from "./out-of-range";
import { useViewContext } from "./view-context";
import { NextWeeksButton, PrevWeeksButton } from "./weeks-navigation";
import { WeeksView, type WeeksViewRootHandle } from "./weeks-view";
import { useWeeksViewState } from "./weeks-view-context";

const T = Temporal;
const pd = (s: string) => T.PlainDate.from(s);

function WindowDisplay() {
  const { windowInfo } = useWeeksViewState();
  return (
    <div>
      <span data-testid="start">{windowInfo.windowStart.toString()}</span>
      <span data-testid="count">{windowInfo.weekCount}</span>
    </div>
  );
}

function FocusDisplay() {
  return (
    <span data-testid="focus">{useViewContext().focusedDate.toString()}</span>
  );
}

interface Setup {
  behavior: OutOfRangeBehavior;
  weekCount: number;
  firstWeek: string;
  min?: string;
  max?: string;
  value?: string;
  handle?: React.RefObject<WeeksViewRootHandle | null>;
}

function renderWindow({
  behavior,
  weekCount,
  firstWeek,
  min,
  max,
  value,
  handle,
}: Setup) {
  return render(
    <WeeksView
      ref={handle}
      temporal={T}
      weekCount={weekCount}
      defaultFirstWeek={pd(firstWeek)}
      outOfRangeBehavior={behavior}
      {...(min && { min: pd(min) })}
      {...(max && { max: pd(max) })}
      {...(value && { defaultValue: pd(value) })}
    >
      <FocusDisplay />
      <WindowDisplay />
      <PrevWeeksButton data-testid="prev" />
      <NextWeeksButton data-testid="next" />
      <Grid>
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
}

const start = () => screen.getByTestId("start").textContent;
const click = (id: string) =>
  act(() => {
    screen.getByTestId(id).click();
  });

afterEach(cleanup);

describe("WeeksView window bounds: stop holds for every way of moving", () => {
  it.each([
    {
      description: "scrollToWeek refuses to leave the bound under stop",
      behavior: "stop" as const,
      expected: { start: "2026-03-01" },
    },
    {
      description: "scrollToWeek refuses to leave the bound under stop-shrink",
      behavior: "stop-shrink" as const,
      expected: { start: "2026-03-01" },
    },
  ])("$description", ({ behavior, expected }) => {
    const handle = createRef<WeeksViewRootHandle>();
    renderWindow({
      behavior,
      weekCount: 2,
      firstWeek: "2026-03-01",
      min: "2026-03-01",
      max: "2026-03-14",
      handle,
    });

    act(() => handle.current?.scrollToWeek(pd("2026-06-07")));

    expect(start()).toBe(expected.start);
  });

  it("scrollToWeek still moves when the target window keeps an in-range day", () => {
    const handle = createRef<WeeksViewRootHandle>();
    renderWindow({
      behavior: "stop",
      weekCount: 2,
      firstWeek: "2026-03-01",
      min: "2026-03-01",
      max: "2026-03-21",
      handle,
    });

    act(() => handle.current?.scrollToWeek(pd("2026-03-08")));

    expect(start()).toBe("2026-03-08");
  });
});

describe("WeeksView window bounds: a single bound is honored", () => {
  it.each([
    {
      description: "min only, stop: Prev cannot page before min",
      behavior: "stop" as const,
      bounds: { min: "2026-03-01" },
      button: "prev",
      expected: { start: "2026-03-01", disabled: true },
    },
    {
      description: "max only, stop: Next cannot page past max",
      behavior: "stop" as const,
      bounds: { max: "2026-03-14" },
      button: "next",
      expected: { start: "2026-03-01", disabled: true },
    },
    {
      description: "max only, snap: Next snaps back instead of overshooting",
      behavior: "snap" as const,
      bounds: { max: "2026-03-14" },
      button: "next",
      expected: { start: "2026-03-01", disabled: true },
    },
  ])("$description", ({ behavior, bounds, button, expected }) => {
    renderWindow({
      behavior,
      weekCount: 2,
      firstWeek: "2026-03-01",
      ...bounds,
    });

    expect((screen.getByTestId(button) as HTMLButtonElement).disabled).toBe(
      expected.disabled,
    );
    click(button);
    expect(start()).toBe(expected.start);
  });
});

describe("WeeksView window bounds: a shrunk window pages by the rows it shows", () => {
  // 4-row prop, but max 03-14 trims the window to the 2 rows 03-01..03-14.
  const shrunk = {
    behavior: "stop-shrink" as const,
    weekCount: 4,
    firstWeek: "2026-03-01",
    min: "2026-01-01",
    max: "2026-03-14",
  };

  it("Prev shifts by the shown row count", () => {
    renderWindow(shrunk);
    expect(screen.getByTestId("count").textContent).toBe("2");

    click("prev");

    expect(start()).toBe("2026-02-15");
  });

  it("PageUp moves focus by the shown row count", () => {
    renderWindow({ ...shrunk, value: "2026-03-08" });

    fireEvent.keyDown(screen.getByRole("grid"), { key: "PageUp" });

    expect(screen.getByTestId("focus").textContent).toBe("2026-02-22");
  });
});

describe("WeeksView window bounds: buttons act on the window that is shown", () => {
  it("Prev from an over-shoot initial window moves from the snapped window", () => {
    // 03-22 overshoots max, so the shown window is the snapped 03-01 one.
    renderWindow({
      behavior: "snap",
      weekCount: 2,
      firstWeek: "2026-03-22",
      max: "2026-03-14",
    });
    expect(start()).toBe("2026-03-01");
    expect((screen.getByTestId("prev") as HTMLButtonElement).disabled).toBe(
      false,
    );

    click("prev");

    expect(start()).toBe("2026-02-15");
  });
});
