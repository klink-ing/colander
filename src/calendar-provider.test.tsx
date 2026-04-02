import { Temporal } from "@js-temporal/polyfill";
import { render, act, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useCalendarStable, useCalendarState } from "./calendar-context";
import { CalendarProvider } from "./calendar-provider";

afterEach(cleanup);

const T = Temporal;

function StableConsumer() {
  const stable = useCalendarStable();
  return (
    <div>
      <span data-testid="locale">{stable.locale}</span>
      <span data-testid="mode">{stable.selectionMode}</span>
      <span data-testid="disabled">{String(stable.disabled)}</span>
    </div>
  );
}

function StateConsumer() {
  const state = useCalendarState();
  return (
    <div>
      <span data-testid="has-selection">{state.selected ? "yes" : "no"}</span>
      <span data-testid="range-start">
        {state.rangeStart?.toString() ?? "none"}
      </span>
    </div>
  );
}

function SelectButton() {
  const stable = useCalendarStable();
  return (
    <button
      type="button"
      onClick={() => stable.onSelect(T.PlainDate.from("2026-03-15"))}
    >
      Select
    </button>
  );
}

describe("CalendarProvider", () => {
  it("provides stable context with defaults", () => {
    const { getByTestId } = render(
      <CalendarProvider temporal={T}>
        <StableConsumer />
      </CalendarProvider>,
    );
    expect(getByTestId("locale").textContent).toBe("en-US");
    expect(getByTestId("mode").textContent).toBe("single");
    expect(getByTestId("disabled").textContent).toBe("false");
  });

  it("provides state context — no selection initially", () => {
    const { getByTestId } = render(
      <CalendarProvider temporal={T}>
        <StateConsumer />
      </CalendarProvider>,
    );
    expect(getByTestId("has-selection").textContent).toBe("no");
  });

  it("handles uncontrolled single selection", async () => {
    const { getByTestId, getByText } = render(
      <CalendarProvider temporal={T}>
        <StateConsumer />
        <SelectButton />
      </CalendarProvider>,
    );
    expect(getByTestId("has-selection").textContent).toBe("no");
    await act(async () => {
      getByText("Select").click();
    });
    expect(getByTestId("has-selection").textContent).toBe("yes");
  });

  it("calls onValueChange for controlled single selection", async () => {
    const onChange = vi.fn();
    const { getByText } = render(
      <CalendarProvider
        temporal={T}
        selectionMode="single"
        value={null}
        onValueChange={onChange}
      >
        <SelectButton />
      </CalendarProvider>,
    );
    await act(async () => {
      getByText("Select").click();
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("deselects when clicking an already-selected date in single mode", async () => {
    const onChange = vi.fn();
    const { getByTestId, getByText } = render(
      <CalendarProvider
        temporal={T}
        selectionMode="single"
        onValueChange={onChange}
      >
        <StateConsumer />
        <SelectButton />
      </CalendarProvider>,
    );
    // First click: select
    await act(async () => {
      getByText("Select").click();
    });
    expect(getByTestId("has-selection").textContent).toBe("yes");
    expect(onChange).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ previous: null }),
    );

    // Second click on same date: deselect
    await act(async () => {
      getByText("Select").click();
    });
    expect(getByTestId("has-selection").textContent).toBe("no");
    expect(onChange).toHaveBeenLastCalledWith(
      null,
      expect.objectContaining({ date: T.PlainDate.from("2026-03-15") }),
    );
  });

  it("throws when hooks used outside provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<StableConsumer />)).toThrow();
    spy.mockRestore();
  });
});
