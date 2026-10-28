import { Temporal } from "@js-temporal/polyfill";
import { describe, expect, it } from "vitest";
import {
  computePreviewRange,
  computeRangePreview,
  decodeRange,
} from "./root-selection";

const T = Temporal;
const d = (iso: string) => T.PlainDate.from(iso);
const iso = (r: ReturnType<typeof computeRangePreview>) =>
  r && [r[0].toString(), r[1].toString()];

describe("decodeRange", () => {
  const toPlain = (raw: string) => d(raw);

  it.each([
    {
      description: "both ends",
      range: { start: "2026-03-10", end: "2026-03-12" },
      expected: ["2026-03-10", "2026-03-12"],
    },
    {
      description: "start only keeps a null end",
      range: { start: "2026-03-10", end: null },
      expected: ["2026-03-10", null],
    },
    {
      description: "end only becomes [end, null] (pending start)",
      range: { start: null, end: "2026-03-12" },
      expected: ["2026-03-12", null],
    },
    {
      description: "neither end is empty",
      range: { start: null, end: null },
      expected: [],
    },
  ])("$description", ({ range, expected }) => {
    const decoded = decodeRange(range as never, toPlain as never);
    expect(decoded.map((x) => x?.toString() ?? null)).toEqual(expected);
  });
});

describe("computeRangePreview", () => {
  const base = {
    hoveredDate: d("2026-03-15"),
    committedDates: [d("2026-03-10"), null],
    rangeMode: "start-end" as const,
    allowRangeReversal: true,
    readOnly: false,
    isDateDisabled: () => false,
    T,
  };

  it.each([
    {
      description: "pending end previews start..hovered",
      input: {},
      expected: ["2026-03-10", "2026-03-15"],
    },
    {
      description: "hovering before the start reverses when allowed",
      input: { hoveredDate: d("2026-03-05") },
      expected: ["2026-03-05", "2026-03-10"],
    },
    {
      description: "read-only has no preview",
      input: { readOnly: true },
      expected: null,
    },
    {
      description: "a disabled hovered date has no preview",
      input: { isDateDisabled: (x: Temporal.PlainDate) => x.day === 15 },
      expected: null,
    },
    {
      description:
        "no committed dates: the first click only anchors, so no preview",
      input: { committedDates: [] },
      expected: null,
    },
  ])("$description", ({ input, expected }) => {
    expect(iso(computeRangePreview({ ...base, ...input }))).toEqual(expected);
  });
});

describe("computePreviewRange", () => {
  const range = { start: d("2026-03-10"), end: null } as never;
  const run = (options?: Parameters<typeof computePreviewRange>[5]) => {
    const r = computePreviewRange(
      d("2026-03-15"),
      range,
      "start-end",
      false,
      T,
      options,
    );
    return r && [String(r.start), String(r.end)];
  };

  it.each([
    {
      description: "defaults to every date selectable",
      options: undefined,
      expected: ["2026-03-10", "2026-03-15"],
    },
    {
      description: "honors isDateDisabled",
      options: { isDateDisabled: (x: Temporal.PlainDate) => x.day === 15 },
      expected: null,
    },
    {
      description: "honors readOnly",
      options: { readOnly: true },
      expected: null,
    },
  ])("$description", ({ options, expected }) => {
    expect(run(options)).toEqual(expected);
  });
});
