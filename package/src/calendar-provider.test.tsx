import { Temporal } from "@js-temporal/polyfill";
import { render, act, cleanup } from "@testing-library/react";
import type { ComponentProps } from "react";
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

describe("CalendarProvider — controlled-value integrity (M7)", () => {
  it.each([
    {
      description: "range value that is not a { start, end } DateRange",
      selectionMode: "range" as const,
      value: "2026-03-15",
      expected: { matches: /range/i },
    },
    {
      description: "multiple value that is not an array",
      selectionMode: "multiple" as const,
      value: T.PlainDate.from("2026-03-15"),
      expected: { matches: /multiple|array/i },
    },
  ])(
    "warns instead of silently going uncontrolled for a malformed $description",
    ({ selectionMode, value, expected }) => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(
        // selectionMode is a union here (it.each), which can't narrow the
        // discriminated props union — and value is intentionally wrong-shaped.
        <CalendarProvider
          {...({
            temporal: T,
            selectionMode,
            value,
            onValueChange: vi.fn(),
          } as unknown as ComponentProps<typeof CalendarProvider>)}
        >
          <div />
        </CalendarProvider>,
      );
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("[DatePicker]"),
      );
      expect(warn.mock.calls[0]?.[0]).toMatch(expected.matches);
      warn.mockRestore();
    },
  );

  it("warns once (not every render) for an out-of-bounds controlled value and never fires onValueChange", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const onChange = vi.fn();
    const make = (onValueChange: () => void) => (
      <CalendarProvider
        temporal={T}
        format="PlainDate"
        selectionMode="single"
        value={T.PlainDate.from("2020-06-15")}
        min={T.PlainDate.from("2026-01-01")}
        max={T.PlainDate.from("2026-12-31")}
        onValueChange={onValueChange}
      >
        <div />
      </CalendarProvider>
    );
    const { rerender } = render(make(onChange));
    // Re-render with a fresh inline onValueChange (the common case): the
    // out-of-bounds effect re-runs, but the warning must not repeat.
    rerender(make(vi.fn()));
    expect(onChange).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("still clears and fires onValueChange for an out-of-bounds uncontrolled defaultValue", () => {
    const onChange = vi.fn();
    render(
      <CalendarProvider
        temporal={T}
        format="PlainDate"
        selectionMode="single"
        defaultValue={T.PlainDate.from("2020-06-15")}
        min={T.PlainDate.from("2026-01-01")}
        max={T.PlainDate.from("2026-12-31")}
        onValueChange={onChange}
      >
        <div />
      </CalendarProvider>,
    );
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(null, expect.anything());
  });
});
