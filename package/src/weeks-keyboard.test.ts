import { Temporal } from "@js-temporal/polyfill";
import { describe, it, expect } from "vitest";
import { computeWeeksKeyNav, type WeeksKeyNavInput } from "./weeks-keyboard";

const T = Temporal;
const pd = (s: string) => T.PlainDate.from(s);

const baseInput: WeeksKeyNavInput = {
  key: "",
  shiftKey: false,
  focusedDate: pd("2026-03-15"),
  windowStart: pd("2026-03-01"),
  weekCount: 8,
  minValue: undefined,
  maxValue: undefined,
  disabled: false,
  readOnly: false,
  isDateDisabled: undefined,
  scrollBy: "row",
  T,
  weekStartDay: 0,
};

describe("computeWeeksKeyNav", () => {
  it("ArrowRight moves focus +1 day", () => {
    const result = computeWeeksKeyNav({ ...baseInput, key: "ArrowRight" });
    expect(result).toEqual({
      action: "move",
      date: pd("2026-03-16"),
      windowShift: 0,
      followFocus: false,
    });
  });

  it("ArrowLeft moves focus -1 day", () => {
    const result = computeWeeksKeyNav({ ...baseInput, key: "ArrowLeft" });
    expect(result).toEqual({
      action: "move",
      date: pd("2026-03-14"),
      windowShift: 0,
      followFocus: false,
    });
  });

  it("ArrowDown moves focus +1 week", () => {
    const result = computeWeeksKeyNav({ ...baseInput, key: "ArrowDown" });
    expect(result).toEqual({
      action: "move",
      date: pd("2026-03-22"),
      windowShift: 0,
      followFocus: false,
    });
  });

  it("ArrowDown at bottom of window with scrollBy=row shifts window by 1", () => {
    // Window: Mar 1 to Apr 25 (8 weeks). Focus on Apr 22 (Wed of last week).
    // ArrowDown → Apr 29, outside window → shift by 1
    const result = computeWeeksKeyNav({
      ...baseInput,
      key: "ArrowDown",
      focusedDate: pd("2026-04-22"),
    });
    expect(result.action).toBe("move");
    expect(result.windowShift).toBe(1);
    expect(result.followFocus).toBe(false);
  });

  it("ArrowDown at bottom of window with scrollBy=page shifts window by weekCount", () => {
    const result = computeWeeksKeyNav({
      ...baseInput,
      key: "ArrowDown",
      focusedDate: pd("2026-04-22"),
      scrollBy: "page",
    });
    expect(result.action).toBe("move");
    expect(result.windowShift).toBe(8);
    expect(result.followFocus).toBe(false);
  });

  it("PageDown shifts focus and window by weekCount", () => {
    const result = computeWeeksKeyNav({ ...baseInput, key: "PageDown" });
    expect(result).toEqual({
      action: "move",
      date: pd("2026-05-10"),
      windowShift: 8,
      followFocus: false,
    });
  });

  it("Shift+PageDown shifts focus +1 year with followFocus", () => {
    const result = computeWeeksKeyNav({
      ...baseInput,
      key: "PageDown",
      shiftKey: true,
    });
    expect(result.action).toBe("move");
    expect(
      (result as Extract<typeof result, { action: "move" }>).date.toString(),
    ).toBe("2027-03-15");
    expect(result.followFocus).toBe(true);
    expect(result.windowShift).toBe(0);
  });

  it("Home moves focus to first day of window", () => {
    const result = computeWeeksKeyNav({ ...baseInput, key: "Home" });
    expect(result).toEqual({
      action: "move",
      date: pd("2026-03-01"),
      windowShift: 0,
      followFocus: false,
    });
  });

  it("End moves focus to last day of window", () => {
    const result = computeWeeksKeyNav({ ...baseInput, key: "End" });
    // 8 weeks from Mar 1: last day is Apr 25
    expect(result).toEqual({
      action: "move",
      date: pd("2026-04-25"),
      windowShift: 0,
      followFocus: false,
    });
  });

  it("Enter selects", () => {
    const result = computeWeeksKeyNav({ ...baseInput, key: "Enter" });
    expect(result).toEqual({
      action: "select",
      windowShift: 0,
      followFocus: false,
    });
  });

  it("Space selects", () => {
    const result = computeWeeksKeyNav({ ...baseInput, key: " " });
    expect(result).toEqual({
      action: "select",
      windowShift: 0,
      followFocus: false,
    });
  });

  it("disabled calendar returns none", () => {
    const result = computeWeeksKeyNav({
      ...baseInput,
      key: "ArrowRight",
      disabled: true,
    });
    expect(result).toEqual({
      action: "none",
      windowShift: 0,
      followFocus: false,
    });
  });

  it("readOnly blocks selection but allows navigation", () => {
    const selectResult = computeWeeksKeyNav({
      ...baseInput,
      key: "Enter",
      readOnly: true,
    });
    expect(selectResult.action).toBe("none");

    const navResult = computeWeeksKeyNav({
      ...baseInput,
      key: "ArrowRight",
      readOnly: true,
    });
    expect(navResult.action).toBe("move");
  });

  it("Enter on isDateDisabled date returns none", () => {
    const result = computeWeeksKeyNav({
      ...baseInput,
      key: "Enter",
      isDateDisabled: () => true,
    });
    expect(result.action).toBe("none");
  });

  it("arrow keys can move onto disabled dates (focus allowed, selection blocked)", () => {
    const result = computeWeeksKeyNav({
      ...baseInput,
      key: "ArrowRight",
      isDateDisabled: () => true,
    });
    expect(result.action).toBe("move"); // focus is allowed
  });

  it("clamps to maxValue", () => {
    const result = computeWeeksKeyNav({
      ...baseInput,
      key: "ArrowRight",
      focusedDate: pd("2026-03-15"),
      maxValue: pd("2026-03-15"),
    });
    expect(result.action).toBe("none"); // already at max, can't move right
  });

  it("PageUp shifts focus and window backward by weekCount", () => {
    const result = computeWeeksKeyNav({ ...baseInput, key: "PageUp" });
    expect(result).toEqual({
      action: "move",
      date: pd("2026-01-18"),
      windowShift: -8,
      followFocus: false,
    });
  });

  it("Shift+PageUp shifts focus -1 year with followFocus", () => {
    const result = computeWeeksKeyNav({
      ...baseInput,
      key: "PageUp",
      shiftKey: true,
    });
    expect(result.action).toBe("move");
    expect(
      (result as Extract<typeof result, { action: "move" }>).date.toString(),
    ).toBe("2025-03-15");
    expect(result.followFocus).toBe(true);
  });
});
