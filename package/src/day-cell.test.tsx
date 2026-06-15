import { Temporal } from "@js-temporal/polyfill";
import { describe, it, expect } from "vitest";
import {
  dayCellInstancePropsAreEqual,
  dayButtonInnerPropsAreEqual,
} from "./day-cell";

const date = Temporal.PlainDate.from("2026-03-15");

/** Full derived-state object the comparators read, with field overrides. */
function makeDerived(overrides: Record<string, unknown> = {}) {
  return {
    root: {},
    date,
    columnIndex: 0,
    orientation: "horizontal",
    outsideMonth: false,
    hidden: false,
    selected: false,
    today: false,
    disabled: false,
    focused: false,
    rangeStart: false,
    rangeEnd: false,
    rangeBoundary: false,
    inRange: false,
    rangeIndex: false,
    rangeLength: false,
    rangeHasStart: false,
    rangeHasEnd: false,
    rangePreviewStart: false,
    rangePreviewEnd: false,
    rangePreviewBoundary: false,
    rangePreviewInRange: false,
    rangePreviewIndex: false,
    rangePreviewLength: false,
    rangePreviewHasStart: false,
    rangePreviewHasEnd: false,
    isTabTarget: false,
    ...overrides,
  };
}

describe("dayCellInstancePropsAreEqual", () => {
  it("returns false when a pass-through prop (className) changes", () => {
    const _derivedState = makeDerived();
    const prev = { date, _derivedState, className: "a" };
    const next = { date, _derivedState, className: "b" };
    expect(dayCellInstancePropsAreEqual(prev as never, next as never)).toBe(
      false,
    );
  });

  it("returns false when a pass-through handler identity changes", () => {
    const _derivedState = makeDerived();
    const prev = { date, _derivedState, onPointerDown: () => {} };
    const next = { date, _derivedState, onPointerDown: () => {} };
    expect(dayCellInstancePropsAreEqual(prev as never, next as never)).toBe(
      false,
    );
  });

  it("returns true when pass-through props are unchanged", () => {
    const _derivedState = makeDerived();
    const onPointerDown = () => {};
    const prev = { date, _derivedState, className: "a", onPointerDown };
    const next = { date, _derivedState, className: "a", onPointerDown };
    expect(dayCellInstancePropsAreEqual(prev as never, next as never)).toBe(
      true,
    );
  });

  it("still ignores children (fresh React elements every render)", () => {
    const _derivedState = makeDerived();
    const prev = { date, _derivedState, children: <span>a</span> };
    const next = { date, _derivedState, children: <span>b</span> };
    expect(dayCellInstancePropsAreEqual(prev as never, next as never)).toBe(
      true,
    );
  });

  it("returns false when a derived-state field changes", () => {
    const prev = { date, _derivedState: makeDerived({ selected: false }) };
    const next = { date, _derivedState: makeDerived({ selected: true }) };
    expect(dayCellInstancePropsAreEqual(prev as never, next as never)).toBe(
      false,
    );
  });
});

describe("dayButtonInnerPropsAreEqual", () => {
  it("returns false when a pass-through prop changes", () => {
    const _derivedState = makeDerived();
    const prev = { date, _derivedState, "data-x": "1" };
    const next = { date, _derivedState, "data-x": "2" };
    expect(dayButtonInnerPropsAreEqual(prev as never, next as never)).toBe(
      false,
    );
  });

  it("returns true when pass-through props are unchanged", () => {
    const _derivedState = makeDerived();
    const prev = { date, _derivedState, "data-x": "1" };
    const next = { date, _derivedState, "data-x": "1" };
    expect(dayButtonInnerPropsAreEqual(prev as never, next as never)).toBe(
      true,
    );
  });
});
