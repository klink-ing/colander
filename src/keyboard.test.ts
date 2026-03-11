import { describe, it, expect } from "vitest";
import { computeNextFocusDate, computeMonthJumpTarget } from "./keyboard";
import type { KeyboardNavInput } from "./keyboard";
import { temporalVariants } from "./test-temporal";

describe.each(temporalVariants)("computeNextFocusDate ($name)", ({ T }) => {
  const d = (iso: string) => T.PlainDate.from(iso);

  function nav(
    overrides: Partial<KeyboardNavInput> & { key: string },
  ): KeyboardNavInput {
    return {
      shiftKey: false,
      focusedDate: d("2026-03-15"),
      minValue: undefined,
      maxValue: undefined,
      disabled: false,
      T,
      ...overrides,
    };
  }

  function expectMove(input: KeyboardNavInput, expected: string) {
    const result = computeNextFocusDate(input);
    expect(result.action).toBe("move");
    if (result.action === "move") {
      expect(result.date.toString()).toBe(expected);
    }
  }

  function expectNone(input: KeyboardNavInput) {
    expect(computeNextFocusDate(input).action).toBe("none");
  }

  describe("computeNextFocusDate", () => {
  describe("arrow keys", () => {
    it.each([
      ["ArrowRight", "2026-03-15", "2026-03-16"],
      ["ArrowLeft", "2026-03-15", "2026-03-14"],
      ["ArrowDown", "2026-03-15", "2026-03-22"],
      ["ArrowUp", "2026-03-15", "2026-03-08"],
      ["ArrowRight", "2026-03-31", "2026-04-01"],
      ["ArrowLeft", "2026-04-01", "2026-03-31"],
      ["ArrowDown", "2026-03-29", "2026-04-05"],
      ["ArrowUp", "2026-04-05", "2026-03-29"],
      ["ArrowRight", "2026-12-31", "2027-01-01"],
      ["ArrowLeft", "2027-01-01", "2026-12-31"],
    ] as const)("%s from %s → %s", (key, focused, expected) => {
      expectMove(nav({ key, focusedDate: d(focused) }), expected);
    });
  });

  describe("Home — move to Sunday of current week", () => {
    it.each([
      ["2026-03-16", "2026-03-15"],
      ["2026-03-17", "2026-03-15"],
      ["2026-03-18", "2026-03-15"],
      ["2026-03-19", "2026-03-15"],
      ["2026-03-20", "2026-03-15"],
      ["2026-03-21", "2026-03-15"],
      ["2026-04-01", "2026-03-29"],
    ] as const)("from %s → %s", (focused, expected) => {
      expectMove(nav({ key: "Home", focusedDate: d(focused) }), expected);
    });

    it.each(["2026-03-15", "2026-03-22"] as const)(
      "from %s (already Sunday) → none",
      (focused) => {
        expectNone(nav({ key: "Home", focusedDate: d(focused) }));
      },
    );
  });

  describe("End — move to Saturday of current week", () => {
    it.each([
      ["2026-03-15", "2026-03-21"],
      ["2026-03-16", "2026-03-21"],
      ["2026-03-22", "2026-03-28"],
      ["2026-03-29", "2026-04-04"],
    ] as const)("from %s → %s", (focused, expected) => {
      expectMove(nav({ key: "End", focusedDate: d(focused) }), expected);
    });

    it("from 2026-03-21 (already Saturday) → none", () => {
      expectNone(nav({ key: "End", focusedDate: d("2026-03-21") }));
    });
  });

  describe("PageDown — next month", () => {
    it.each([
      ["2026-03-15", "2026-04-15"],
      ["2026-01-31", "2026-02-28"],
      ["2024-01-31", "2024-02-29"],
      ["2026-12-15", "2027-01-15"],
      ["2026-03-31", "2026-04-30"],
      ["2026-05-31", "2026-06-30"],
    ] as const)("from %s → %s (day constrained)", (focused, expected) => {
      expectMove(
        nav({ key: "PageDown", focusedDate: d(focused) }),
        expected,
      );
    });
  });

  describe("PageUp — previous month", () => {
    it.each([
      ["2026-03-15", "2026-02-15"],
      ["2026-03-31", "2026-02-28"],
      ["2024-03-31", "2024-02-29"],
      ["2026-01-15", "2025-12-15"],
      ["2026-05-31", "2026-04-30"],
    ] as const)("from %s → %s (day constrained)", (focused, expected) => {
      expectMove(nav({ key: "PageUp", focusedDate: d(focused) }), expected);
    });
  });

  describe("Shift+PageDown — next year", () => {
    it.each([
      ["2026-03-15", "2027-03-15"],
      ["2024-02-29", "2025-02-28"],
      ["2026-12-31", "2027-12-31"],
    ] as const)(
      "from %s → %s (day constrained for leap year)",
      (focused, expected) => {
        expectMove(
          nav({ key: "PageDown", shiftKey: true, focusedDate: d(focused) }),
          expected,
        );
      },
    );
  });

  describe("Shift+PageUp — previous year", () => {
    it.each([
      ["2026-03-15", "2025-03-15"],
      ["2024-02-29", "2023-02-28"],
      ["2027-01-01", "2026-01-01"],
    ] as const)(
      "from %s → %s (day constrained for leap year)",
      (focused, expected) => {
        expectMove(
          nav({ key: "PageUp", shiftKey: true, focusedDate: d(focused) }),
          expected,
        );
      },
    );
  });

  describe("Enter and Space — select", () => {
    it.each(["Enter", " "] as const)("%s selects focused date", (key) => {
      const result = computeNextFocusDate(nav({ key }));
      expect(result.action).toBe("select");
    });

    it.each(["Enter", " "] as const)(
      "%s does not select when isDateDisabled returns true",
      (key) => {
        expectNone(nav({ key, isDateDisabled: () => true }));
      },
    );
  });

  describe("disabled calendar ignores all keys", () => {
    it.each([
      "ArrowRight",
      "ArrowLeft",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
      "PageUp",
      "PageDown",
      "Enter",
      " ",
    ] as const)("%s returns none when disabled", (key) => {
      expectNone(nav({ key, disabled: true }));
    });
  });

  describe("unrecognized keys return none", () => {
    it.each(["Tab", "Escape", "a", "Delete", "F1"] as const)(
      "%s returns none",
      (key) => {
        expectNone(nav({ key }));
      },
    );
  });

  describe("min bound clamping", () => {
    const min = d("2026-03-10");

    it.each([
      ["ArrowLeft", "2026-03-10"],
      ["ArrowUp", "2026-03-10"],
      ["Home", "2026-03-10"],
    ] as const)(
      "%s from %s is none (already at min boundary)",
      (key, focused) => {
        expectNone(nav({ key, focusedDate: d(focused), minValue: min }));
      },
    );

    it.each([
      ["ArrowLeft", "2026-03-11", "2026-03-10"],
      ["ArrowRight", "2026-03-10", "2026-03-11"],
    ] as const)(
      "%s from %s → %s (at or above min)",
      (key, focused, expected) => {
        expectMove(
          nav({ key, focusedDate: d(focused), minValue: min }),
          expected,
        );
      },
    );

    it("ArrowUp clamps to min when target is below min", () => {
      expectMove(
        nav({ key: "ArrowUp", focusedDate: d("2026-03-12"), minValue: min }),
        "2026-03-10",
      );
    });

    it("Home clamps to min when start-of-week is below min", () => {
      expectMove(
        nav({ key: "Home", focusedDate: d("2026-03-12"), minValue: min }),
        "2026-03-10",
      );
    });

    it("PageUp clamps to min when target month is before min", () => {
      expectMove(
        nav({
          key: "PageUp",
          focusedDate: d("2026-03-05"),
          minValue: d("2026-03-01"),
        }),
        "2026-03-01",
      );
    });

    it("Shift+PageUp clamps to min when target year is before min", () => {
      expectMove(
        nav({
          key: "PageUp",
          shiftKey: true,
          focusedDate: d("2026-03-15"),
          minValue: d("2026-01-01"),
        }),
        "2026-01-01",
      );
    });

    it("PageUp is none when already at min", () => {
      expectNone(
        nav({
          key: "PageUp",
          focusedDate: d("2026-03-01"),
          minValue: d("2026-03-01"),
        }),
      );
    });
  });

  describe("max bound clamping", () => {
    const max = d("2026-03-20");

    it.each([
      ["ArrowRight", "2026-03-20"],
      ["ArrowDown", "2026-03-20"],
      ["End", "2026-03-20"],
    ] as const)(
      "%s from %s is none (already at max boundary)",
      (key, focused) => {
        expectNone(nav({ key, focusedDate: d(focused), maxValue: max }));
      },
    );

    it.each([
      ["ArrowRight", "2026-03-19", "2026-03-20"],
      ["ArrowLeft", "2026-03-20", "2026-03-19"],
    ] as const)(
      "%s from %s → %s (at or below max)",
      (key, focused, expected) => {
        expectMove(
          nav({ key, focusedDate: d(focused), maxValue: max }),
          expected,
        );
      },
    );

    it("ArrowDown clamps to max when target exceeds max", () => {
      expectMove(
        nav({
          key: "ArrowDown",
          focusedDate: d("2026-03-18"),
          maxValue: max,
        }),
        "2026-03-20",
      );
    });

    it("End clamps to max when end-of-week exceeds max", () => {
      expectMove(
        nav({ key: "End", focusedDate: d("2026-03-16"), maxValue: max }),
        "2026-03-20",
      );
    });

    it("PageDown clamps to max when target month exceeds max", () => {
      expectMove(
        nav({
          key: "PageDown",
          focusedDate: d("2026-03-15"),
          maxValue: d("2026-03-31"),
        }),
        "2026-03-31",
      );
    });

    it("Shift+PageDown clamps to max when target year exceeds max", () => {
      expectMove(
        nav({
          key: "PageDown",
          shiftKey: true,
          focusedDate: d("2026-03-15"),
          maxValue: d("2026-12-31"),
        }),
        "2026-12-31",
      );
    });

    it("PageDown is none when already at max", () => {
      expectNone(
        nav({
          key: "PageDown",
          focusedDate: d("2026-03-31"),
          maxValue: d("2026-03-31"),
        }),
      );
    });
  });

  describe("min and max together — narrow window", () => {
    const min = d("2026-03-14");
    const max = d("2026-03-16");

    it("ArrowRight from 2026-03-15 → 2026-03-16 (within window)", () => {
      expectMove(
        nav({
          key: "ArrowRight",
          focusedDate: d("2026-03-15"),
          minValue: min,
          maxValue: max,
        }),
        "2026-03-16",
      );
    });

    it("ArrowLeft from 2026-03-15 → 2026-03-14 (within window)", () => {
      expectMove(
        nav({
          key: "ArrowLeft",
          focusedDate: d("2026-03-15"),
          minValue: min,
          maxValue: max,
        }),
        "2026-03-14",
      );
    });

    it("ArrowRight from max boundary is none", () => {
      expectNone(
        nav({
          key: "ArrowRight",
          focusedDate: max,
          minValue: min,
          maxValue: max,
        }),
      );
    });

    it("ArrowLeft from min boundary is none", () => {
      expectNone(
        nav({
          key: "ArrowLeft",
          focusedDate: min,
          minValue: min,
          maxValue: max,
        }),
      );
    });

    it("PageDown clamps to max in narrow window", () => {
      expectMove(
        nav({
          key: "PageDown",
          focusedDate: d("2026-03-15"),
          minValue: min,
          maxValue: max,
        }),
        "2026-03-16",
      );
    });

    it("PageUp clamps to min in narrow window", () => {
      expectMove(
        nav({
          key: "PageUp",
          focusedDate: d("2026-03-15"),
          minValue: min,
          maxValue: max,
        }),
        "2026-03-14",
      );
    });

    it("ArrowDown from 2026-03-15 clamps to max", () => {
      expectMove(
        nav({
          key: "ArrowDown",
          focusedDate: d("2026-03-15"),
          minValue: min,
          maxValue: max,
        }),
        "2026-03-16",
      );
    });

    it("ArrowUp from 2026-03-15 clamps to min", () => {
      expectMove(
        nav({
          key: "ArrowUp",
          focusedDate: d("2026-03-15"),
          minValue: min,
          maxValue: max,
        }),
        "2026-03-14",
      );
    });
  });

  describe("readOnly suppresses select but allows move", () => {
    it.each(["Enter", " "] as const)(
      "%s returns none when readOnly",
      (key) => {
        expectNone(nav({ key, readOnly: true }));
      },
    );

    it.each([
      "ArrowRight",
      "ArrowLeft",
      "ArrowUp",
      "ArrowDown",
      "PageUp",
      "PageDown",
    ] as const)("%s still works when readOnly", (key) => {
      const result = computeNextFocusDate(nav({ key, readOnly: true }));
      expect(result.action).toBe("move");
    });

    it("Home still works when readOnly (from mid-week)", () => {
      const result = computeNextFocusDate(
        nav({ key: "Home", readOnly: true, focusedDate: d("2026-03-18") }),
      );
      expect(result.action).toBe("move");
    });

    it("End still works when readOnly (from mid-week)", () => {
      const result = computeNextFocusDate(
        nav({ key: "End", readOnly: true, focusedDate: d("2026-03-18") }),
      );
      expect(result.action).toBe("move");
    });
  });

  describe("Home/End with weekStartDay=1 (Monday start)", () => {
    it.each([
      ["2026-03-17", "2026-03-16"],
      ["2026-03-18", "2026-03-16"],
      ["2026-03-21", "2026-03-16"],
      ["2026-03-22", "2026-03-16"],
    ] as const)(
      "Home from %s → %s (Monday start of week)",
      (focused, expected) => {
        expectMove(
          nav({ key: "Home", focusedDate: d(focused), weekStartDay: 1 }),
          expected,
        );
      },
    );

    it("Home from Monday (already at start) → none", () => {
      expectNone(
        nav({ key: "Home", focusedDate: d("2026-03-16"), weekStartDay: 1 }),
      );
    });

    it.each([
      ["2026-03-16", "2026-03-22"],
      ["2026-03-17", "2026-03-22"],
      ["2026-03-21", "2026-03-22"],
    ] as const)(
      "End from %s → %s (Sunday end of week)",
      (focused, expected) => {
        expectMove(
          nav({ key: "End", focusedDate: d(focused), weekStartDay: 1 }),
          expected,
        );
      },
    );

    it("End from Sunday (already at end) → none", () => {
      expectNone(
        nav({ key: "End", focusedDate: d("2026-03-22"), weekStartDay: 1 }),
      );
    });
  });

  describe("Home/End with weekStartDay=6 (Saturday start)", () => {
    it("Home from Sunday (2026-03-15) → Saturday (2026-03-14)", () => {
      expectMove(
        nav({ key: "Home", focusedDate: d("2026-03-15"), weekStartDay: 6 }),
        "2026-03-14",
      );
    });

    it("Home from Saturday (already at start) → none", () => {
      expectNone(
        nav({ key: "Home", focusedDate: d("2026-03-14"), weekStartDay: 6 }),
      );
    });

    it("End from Saturday (2026-03-14) → Friday (2026-03-20)", () => {
      expectMove(
        nav({ key: "End", focusedDate: d("2026-03-14"), weekStartDay: 6 }),
        "2026-03-20",
      );
    });

    it("End from Friday (already at end) → none", () => {
      expectNone(
        nav({ key: "End", focusedDate: d("2026-03-20"), weekStartDay: 6 }),
      );
    });
  });

  describe("computeMonthJumpTarget", () => {
    it.each([
      ["2026-03-15", 1, "2026-04-15"],
      ["2026-03-15", -1, "2026-02-15"],
      ["2026-03-31", 1, "2026-04-30"],
      ["2026-01-31", 1, "2026-02-28"],
      ["2024-01-31", 1, "2024-02-29"],
      ["2026-12-15", 1, "2027-01-15"],
      ["2026-01-15", -1, "2025-12-15"],
      ["2026-03-15", 12, "2027-03-15"],
      ["2026-03-15", -12, "2025-03-15"],
      ["2024-02-29", 12, "2025-02-28"],
      ["2024-02-29", -12, "2023-02-28"],
      ["2026-03-15", 24, "2028-03-15"],
      ["2026-03-15", -24, "2024-03-15"],
    ] as const)("from %s + %d months → %s", (focused, months, expected) => {
      const result = computeMonthJumpTarget(d(focused), months, T);
      expect(result.toString()).toBe(expected);
    });
  });
  });
});
