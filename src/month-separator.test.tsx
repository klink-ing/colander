import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, within } from "@testing-library/react";
import {
  MonthSeparator,
  MonthSeparatorDataContext,
  type MonthSeparatorState,
} from "./month-separator";

afterEach(cleanup);

const mockData: MonthSeparatorState = {
  month: 3,
  year: 2026,
  firstOfYear: false,
  firstVisible: true,
  weeksVisibleBefore: 2,
  weeksVisibleAfter: 4,
};

function renderInTable(ui: React.ReactElement, data = mockData) {
  return render(
    <table>
      <tbody>
        <MonthSeparatorDataContext.Provider value={data}>
          {ui}
        </MonthSeparatorDataContext.Provider>
      </tbody>
    </table>,
  );
}

describe("MonthSeparator", () => {
  it("renders data attributes from state", () => {
    const { container } = renderInTable(<MonthSeparator />);
    const tr = container.querySelector("tr");
    expect(tr?.getAttribute("data-month")).toBe("3");
    expect(tr?.getAttribute("data-year")).toBe("2026");
    expect(tr?.hasAttribute("data-first-visible")).toBe(true);
    expect(tr?.hasAttribute("data-first-of-year")).toBe(false);
  });

  it("renders td with colspan=7", () => {
    const { container } = renderInTable(<MonthSeparator />);
    const td = container.querySelector("td");
    expect(td?.getAttribute("colspan")).toBe("7");
  });

  it("renders default children (Month + Year) when no children provided", () => {
    const { container } = renderInTable(<MonthSeparator />);
    const view = within(container);
    expect(view.getByText("March")).toBeTruthy();
    expect(view.getByText("2026")).toBeTruthy();
  });

  it("renders custom children instead of defaults", () => {
    const { container } = renderInTable(
      <MonthSeparator>
        <MonthSeparator.WeekCount />
      </MonthSeparator>,
    );
    const view = within(container);
    expect(view.getByText("4")).toBeTruthy();
    expect(view.queryByText("March")).toBeNull();
  });

  describe("data-first-of-year", () => {
    it.each([
      {
        description: "present when firstOfYear is true",
        data: { ...mockData, firstOfYear: true },
        expected: { hasAttr: true },
      },
      {
        description: "absent when firstOfYear is false",
        data: { ...mockData, firstOfYear: false },
        expected: { hasAttr: false },
      },
    ])("$description", ({ data, expected }) => {
      const { container } = renderInTable(<MonthSeparator />, data);
      const tr = container.querySelector("tr");
      expect(tr?.hasAttribute("data-first-of-year")).toBe(expected.hasAttr);
    });
  });

  describe("data-first-visible", () => {
    it.each([
      {
        description: "present when firstVisible is true",
        data: { ...mockData, firstVisible: true },
        expected: { hasAttr: true },
      },
      {
        description: "absent when firstVisible is false",
        data: { ...mockData, firstVisible: false },
        expected: { hasAttr: false },
      },
    ])("$description", ({ data, expected }) => {
      const { container } = renderInTable(<MonthSeparator />, data);
      const tr = container.querySelector("tr");
      expect(tr?.hasAttribute("data-first-visible")).toBe(expected.hasAttr);
    });
  });
});

describe("MonthSeparator.Month", () => {
  it.each([
    { description: "January", data: { ...mockData, month: 1 }, expected: { text: "January" } },
    { description: "June", data: { ...mockData, month: 6 }, expected: { text: "June" } },
    { description: "December", data: { ...mockData, month: 12 }, expected: { text: "December" } },
  ])("renders $description", ({ data, expected }) => {
    const { container } = renderInTable(
      <MonthSeparator>
        <MonthSeparator.Month />
      </MonthSeparator>,
      data,
    );
    expect(within(container).getByText(expected.text)).toBeTruthy();
  });
});

describe("MonthSeparator.Year", () => {
  it("renders the year number", () => {
    const { container } = renderInTable(
      <MonthSeparator>
        <MonthSeparator.Year />
      </MonthSeparator>,
    );
    expect(within(container).getByText("2026")).toBeTruthy();
  });
});

describe("MonthSeparator.WeekCount", () => {
  it("renders weeksVisibleAfter", () => {
    const { container } = renderInTable(
      <MonthSeparator>
        <MonthSeparator.WeekCount />
      </MonthSeparator>,
    );
    expect(within(container).getByText("4")).toBeTruthy();
  });

  it("renders 0 when no weeks visible after", () => {
    const { container } = renderInTable(
      <MonthSeparator>
        <MonthSeparator.WeekCount />
      </MonthSeparator>,
      { ...mockData, weeksVisibleAfter: 0 },
    );
    expect(within(container).getByText("0")).toBeTruthy();
  });
});

describe("MonthSeparator error handling", () => {
  it("throws when used outside context provider", () => {
    expect(() =>
      render(
        <table>
          <tbody>
            <MonthSeparator />
          </tbody>
        </table>,
      ),
    ).toThrow("MonthSeparator child components must be used within");
  });
});
