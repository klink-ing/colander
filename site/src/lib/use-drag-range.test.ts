/**
 * Unit tests for the drag range logic.
 * Tests the core range adjustment algorithm independently of the DnD library.
 */

import { Temporal } from "@js-temporal/polyfill";
import { describe, it, expect } from "vitest";

type Edge = "start" | "end";

/**
 * Pure function extracted from the drag range hook's applyDropTarget logic.
 * Given a current range, the edge being dragged, a target date, and whether
 * range reversal is allowed, returns the new range and edge.
 */
function computeDragResult(opts: {
  description: string;
  start: string;
  end: string;
  edge: Edge;
  target: string;
  allowRangeReversal: boolean;
  expected: {
    start: string;
    end: string;
    edge: Edge;
  };
}) {
  const T = Temporal;
  const start = T.PlainDate.from(opts.start);
  const end = T.PlainDate.from(opts.end);
  const target = T.PlainDate.from(opts.target);
  let edge = opts.edge;

  let newStart: Temporal.PlainDate;
  let newEnd: Temporal.PlainDate;

  if (edge === "start") {
    if (T.PlainDate.compare(target, end) <= 0) {
      newStart = target;
      newEnd = end;
    } else if (opts.allowRangeReversal) {
      newStart = end;
      newEnd = target;
      edge = "end";
    } else {
      newStart = end;
      newEnd = end;
    }
  } else {
    if (T.PlainDate.compare(target, start) >= 0) {
      newStart = start;
      newEnd = target;
    } else if (opts.allowRangeReversal) {
      newStart = target;
      newEnd = start;
      edge = "start";
    } else {
      newStart = start;
      newEnd = start;
    }
  }

  return {
    start: newStart.toString(),
    end: newEnd.toString(),
    edge,
  };
}

describe("drag range adjustment logic", () => {
  describe("dragging start handle", () => {
    it.each([
      {
        description: "move start earlier within range",
        start: "2024-03-10",
        end: "2024-03-15",
        edge: "start" as Edge,
        target: "2024-03-08",
        allowRangeReversal: false,
        expected: {
          start: "2024-03-08",
          end: "2024-03-15",
          edge: "start" as Edge,
        },
      },
      {
        description: "move start later within range",
        start: "2024-03-10",
        end: "2024-03-15",
        edge: "start" as Edge,
        target: "2024-03-12",
        allowRangeReversal: false,
        expected: {
          start: "2024-03-12",
          end: "2024-03-15",
          edge: "start" as Edge,
        },
      },
      {
        description: "move start to same as end (single day range)",
        start: "2024-03-10",
        end: "2024-03-15",
        edge: "start" as Edge,
        target: "2024-03-15",
        allowRangeReversal: false,
        expected: {
          start: "2024-03-15",
          end: "2024-03-15",
          edge: "start" as Edge,
        },
      },
      {
        description: "move start past end WITHOUT reversal (clamps to end)",
        start: "2024-03-10",
        end: "2024-03-15",
        edge: "start" as Edge,
        target: "2024-03-20",
        allowRangeReversal: false,
        expected: {
          start: "2024-03-15",
          end: "2024-03-15",
          edge: "start" as Edge,
        },
      },
      {
        description: "move start past end WITH reversal (swaps edge to end)",
        start: "2024-03-10",
        end: "2024-03-15",
        edge: "start" as Edge,
        target: "2024-03-20",
        allowRangeReversal: true,
        expected: {
          start: "2024-03-15",
          end: "2024-03-20",
          edge: "end" as Edge,
        },
      },
    ])("$description", (testCase) => {
      const result = computeDragResult(testCase);
      expect(result).toEqual(testCase.expected);
    });
  });

  describe("dragging end handle", () => {
    it.each([
      {
        description: "move end later within range",
        start: "2024-03-10",
        end: "2024-03-15",
        edge: "end" as Edge,
        target: "2024-03-20",
        allowRangeReversal: false,
        expected: {
          start: "2024-03-10",
          end: "2024-03-20",
          edge: "end" as Edge,
        },
      },
      {
        description: "move end earlier within range",
        start: "2024-03-10",
        end: "2024-03-15",
        edge: "end" as Edge,
        target: "2024-03-12",
        allowRangeReversal: false,
        expected: {
          start: "2024-03-10",
          end: "2024-03-12",
          edge: "end" as Edge,
        },
      },
      {
        description: "move end to same as start (single day range)",
        start: "2024-03-10",
        end: "2024-03-15",
        edge: "end" as Edge,
        target: "2024-03-10",
        allowRangeReversal: false,
        expected: {
          start: "2024-03-10",
          end: "2024-03-10",
          edge: "end" as Edge,
        },
      },
      {
        description: "move end before start WITHOUT reversal (clamps to start)",
        start: "2024-03-10",
        end: "2024-03-15",
        edge: "end" as Edge,
        target: "2024-03-05",
        allowRangeReversal: false,
        expected: {
          start: "2024-03-10",
          end: "2024-03-10",
          edge: "end" as Edge,
        },
      },
      {
        description:
          "move end before start WITH reversal (swaps edge to start)",
        start: "2024-03-10",
        end: "2024-03-15",
        edge: "end" as Edge,
        target: "2024-03-05",
        allowRangeReversal: true,
        expected: {
          start: "2024-03-05",
          end: "2024-03-10",
          edge: "start" as Edge,
        },
      },
    ])("$description", (testCase) => {
      const result = computeDragResult(testCase);
      expect(result).toEqual(testCase.expected);
    });
  });

  describe("edge cases", () => {
    it.each([
      {
        description: "target same as current start (no-op)",
        start: "2024-03-10",
        end: "2024-03-15",
        edge: "start" as Edge,
        target: "2024-03-10",
        allowRangeReversal: false,
        expected: {
          start: "2024-03-10",
          end: "2024-03-15",
          edge: "start" as Edge,
        },
      },
      {
        description: "target same as current end (no-op)",
        start: "2024-03-10",
        end: "2024-03-15",
        edge: "end" as Edge,
        target: "2024-03-15",
        allowRangeReversal: false,
        expected: {
          start: "2024-03-10",
          end: "2024-03-15",
          edge: "end" as Edge,
        },
      },
      {
        description: "single day range, drag start earlier",
        start: "2024-03-10",
        end: "2024-03-10",
        edge: "start" as Edge,
        target: "2024-03-05",
        allowRangeReversal: false,
        expected: {
          start: "2024-03-05",
          end: "2024-03-10",
          edge: "start" as Edge,
        },
      },
      {
        description: "single day range, drag end later",
        start: "2024-03-10",
        end: "2024-03-10",
        edge: "end" as Edge,
        target: "2024-03-15",
        allowRangeReversal: false,
        expected: {
          start: "2024-03-10",
          end: "2024-03-15",
          edge: "end" as Edge,
        },
      },
      {
        description: "single day range, drag start past end with reversal",
        start: "2024-03-10",
        end: "2024-03-10",
        edge: "start" as Edge,
        target: "2024-03-15",
        allowRangeReversal: true,
        expected: {
          start: "2024-03-10",
          end: "2024-03-15",
          edge: "end" as Edge,
        },
      },
      {
        description: "cross-month drag",
        start: "2024-03-28",
        end: "2024-03-31",
        edge: "end" as Edge,
        target: "2024-04-05",
        allowRangeReversal: false,
        expected: {
          start: "2024-03-28",
          end: "2024-04-05",
          edge: "end" as Edge,
        },
      },
    ])("$description", (testCase) => {
      const result = computeDragResult(testCase);
      expect(result).toEqual(testCase.expected);
    });
  });
});
