import { Temporal } from "@js-temporal/polyfill";
import { render, screen, cleanup } from "@testing-library/react";
import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeEach,
} from "vite-plus/test";
import {
  Grid,
  GridBody,
  WeekTemplate,
  DayCellTemplate,
  DayButton,
} from "./grid";
import { MonthView } from "./month-view";
import { useViewContext } from "./view-context";
import { WeeksView } from "./weeks-view";

const T = Temporal;

function FocusDisplay() {
  const view = useViewContext();
  return <span data-testid="focus">{view.focusedDate.toString()}</span>;
}

const days = (
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

// 2026-03-31T20:00Z is 2026-04-01 in Auckland (NZDT, +13) and 2026-03-31 in Pago Pago (-11).
// 2026-04-04T20:00Z is Sunday 2026-04-05 in Auckland (NZST, +12) and Saturday 2026-04-04 in Pago Pago.
describe("today follows the provider time zone", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it.each([
    {
      description: "ahead of the clock's UTC date",
      timeZone: "Pacific/Auckland",
      expected: { today: "2026-04-01", todayCell: "1" },
    },
    {
      description: "behind the clock's UTC date",
      timeZone: "Pacific/Pago_Pago",
      expected: { today: "2026-03-31", todayCell: "31" },
    },
  ])("MonthView: $description", ({ timeZone, expected }) => {
    vi.setSystemTime(new Date("2026-03-31T20:00:00Z"));
    const { container } = render(
      <MonthView temporal={T} timeZone={timeZone}>
        <FocusDisplay />
        {days}
      </MonthView>,
    );

    expect(screen.getByTestId("focus").textContent).toBe(expected.today);
    const marked = container.querySelectorAll("td[data-today]");
    expect(marked.length).toBe(1);
    expect(marked[0]?.textContent).toBe(expected.todayCell);
    expect(marked[0]?.hasAttribute("data-outside-month")).toBe(false);
  });

  it.each([
    {
      description: "ahead of the clock's UTC date",
      timeZone: "Pacific/Auckland",
      expected: { firstCell: "5", todayCell: "5" },
    },
    {
      description: "behind the clock's UTC date",
      timeZone: "Pacific/Pago_Pago",
      expected: { firstCell: "29", todayCell: "4" },
    },
  ])("WeeksView: $description", ({ timeZone, expected }) => {
    vi.setSystemTime(new Date("2026-04-04T20:00:00Z"));
    const { container } = render(
      <WeeksView temporal={T} timeZone={timeZone} weekCount={1}>
        {days}
      </WeeksView>,
    );

    expect(container.querySelector("td[role='gridcell']")?.textContent).toBe(
      expected.firstCell,
    );
    const marked = container.querySelectorAll("td[data-today]");
    expect(marked.length).toBe(1);
    expect(marked[0]?.textContent).toBe(expected.todayCell);
  });
});
