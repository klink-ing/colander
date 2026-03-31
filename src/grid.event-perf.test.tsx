import { Temporal } from "@js-temporal/polyfill";
import { render, act, fireEvent } from "@testing-library/react";
import { Profiler, type ProfilerOnRenderCallback } from "react";
// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from "vitest";
import { Grid } from "./grid";
import { MonthView } from "./month-view";

type RenderEntry = {
  id: string;
  phase: "mount" | "update" | "nested-update";
  actualDuration: number;
  baseDuration: number;
};

function createProfiler() {
  const entries: RenderEntry[] = [];
  const onRender: ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
  ) => {
    entries.push({
      id,
      phase: phase as RenderEntry["phase"],
      actualDuration,
      baseDuration,
    });
  };
  return { entries, onRender };
}

const temporal = {
  Now: Temporal.Now,
  PlainDate: Temporal.PlainDate,
  PlainDateTime: Temporal.PlainDateTime,
  PlainMonthDay: Temporal.PlainMonthDay,
  PlainYearMonth: Temporal.PlainYearMonth,
};

const defaultProps = {
  temporal,
  locale: "en-US",
  timeZone: "America/New_York",
  format: "PlainDate" as const,
} as const;

const march15 = Temporal.PlainDate.from("2026-03-15");
const march10 = Temporal.PlainDate.from("2026-03-10");
const march20 = Temporal.PlainDate.from("2026-03-20");

// Generous thresholds — for comparison, not regression.
const CLICK_THRESHOLD_MS = 60;
const HOVER_THRESHOLD_MS = 40;
const SWEEP_THRESHOLD_MS = 200;
const MOUNT_THRESHOLD_MS = 100;

const ITERATIONS = 5;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function p95(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * 0.95) - 1];
}

describe("Grid event dispatch profiling", () => {
  beforeAll(() => {
    const { unmount } = render(
      <MonthView {...defaultProps} defaultValue={march15}>
        <Grid />
      </MonthView>,
    );
    unmount();
  });

  it("click event → selection update render cost", () => {
    const durations: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      const { entries, onRender } = createProfiler();

      const { container, unmount } = render(
        <Profiler id="click-event" onRender={onRender}>
          <MonthView {...defaultProps} defaultValue={march15}>
            <Grid />
          </MonthView>
        </Profiler>,
      );

      entries.length = 0;

      const button = container.querySelector<HTMLElement>(
        '[data-testid="button-day-2026-03-20"]',
      )!;
      expect(button).toBeTruthy();

      act(() => {
        fireEvent.click(button);
      });

      const update = entries.find((e) => e.phase === "update");
      if (update) durations.push(update.actualDuration);

      unmount();
    }

    expect(durations.length).toBeGreaterThan(0);
    const med = median(durations);
    const p = p95(durations);
    expect(med).toBeLessThan(CLICK_THRESHOLD_MS);

    console.log(
      `[perf] click→selection: median=${med.toFixed(2)}ms p95=${p.toFixed(2)}ms (${ITERATIONS} runs)`,
    );
  });

  it("pointerenter event → hover preview render cost", () => {
    const durations: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      const { entries, onRender } = createProfiler();

      const { container, unmount } = render(
        <Profiler id="hover-event" onRender={onRender}>
          <MonthView
            {...defaultProps}
            selectionMode="range"
            value={{ start: march10, end: march20 }}
          >
            <Grid />
          </MonthView>
        </Profiler>,
      );

      entries.length = 0;

      const button = container.querySelector<HTMLElement>(
        '[data-testid="button-day-2026-03-25"]',
      )!;
      expect(button).toBeTruthy();

      act(() => {
        fireEvent.pointerEnter(button);
      });

      const update = entries.find((e) => e.phase === "update");
      if (update) durations.push(update.actualDuration);

      unmount();
    }

    expect(durations.length).toBeGreaterThan(0);
    const med = median(durations);
    const p = p95(durations);
    expect(med).toBeLessThan(HOVER_THRESHOLD_MS);

    console.log(
      `[perf] pointerenter→hover: median=${med.toFixed(2)}ms p95=${p.toFixed(2)}ms (${ITERATIONS} runs)`,
    );
  });

  it("rapid hover across 7 cells (simulate mouse sweep)", () => {
    const sweepDurations: number[] = [];

    for (let iter = 0; iter < ITERATIONS; iter++) {
      const { entries, onRender } = createProfiler();

      const { container, unmount } = render(
        <Profiler id="sweep-event" onRender={onRender}>
          <MonthView
            {...defaultProps}
            selectionMode="range"
            value={{ start: march10, end: march20 }}
          >
            <Grid />
          </MonthView>
        </Profiler>,
      );

      entries.length = 0;

      const days = Array.from({ length: 7 }, (_, i) => {
        const day = String(i + 16).padStart(2, "0");
        return container.querySelector<HTMLElement>(
          `[data-testid="button-day-2026-03-${day}"]`,
        )!;
      });

      for (const d of days) expect(d).toBeTruthy();

      act(() => {
        for (const d of days) {
          fireEvent.pointerEnter(d);
        }
      });

      const updates = entries.filter((e) => e.phase === "update");
      const total = updates.reduce((sum, e) => sum + e.actualDuration, 0);
      sweepDurations.push(total);

      unmount();
    }

    const med = median(sweepDurations);
    const p = p95(sweepDurations);
    expect(med).toBeLessThan(SWEEP_THRESHOLD_MS);

    console.log(
      `[perf] 7-cell sweep: median=${med.toFixed(2)}ms p95=${p.toFixed(2)}ms (${ITERATIONS} runs)`,
    );
  });

  it("click in range mode → range update render cost", () => {
    const durations: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      const { entries, onRender } = createProfiler();

      // Mount with a committed range, then click a day to start a new selection
      const { container, unmount } = render(
        <Profiler id="range-click" onRender={onRender}>
          <MonthView
            {...defaultProps}
            selectionMode="range"
            defaultValue={{ start: march10, end: march15 }}
          >
            <Grid />
          </MonthView>
        </Profiler>,
      );

      entries.length = 0;

      // Click a day outside the current range to trigger a new range selection
      const button = container.querySelector<HTMLElement>(
        '[data-testid="button-day-2026-03-25"]',
      )!;
      expect(button).toBeTruthy();

      act(() => {
        fireEvent.click(button);
      });

      const update = entries.find((e) => e.phase === "update");
      if (update) durations.push(update.actualDuration);

      unmount();
    }

    expect(durations.length).toBeGreaterThan(0);
    const med = median(durations);
    const p = p95(durations);
    expect(med).toBeLessThan(CLICK_THRESHOLD_MS);

    console.log(
      `[perf] range click→update: median=${med.toFixed(2)}ms p95=${p.toFixed(2)}ms (${ITERATIONS} runs)`,
    );
  });

  it("mount cost: 42 cells with event listeners", () => {
    const mountDurations: number[] = [];

    for (let i = 0; i < ITERATIONS; i++) {
      const { entries, onRender } = createProfiler();

      const { unmount } = render(
        <Profiler id="mount-cost" onRender={onRender}>
          <MonthView {...defaultProps} defaultValue={march15}>
            <Grid />
          </MonthView>
        </Profiler>,
      );

      const mount = entries.find((e) => e.phase === "mount");
      if (mount) mountDurations.push(mount.actualDuration);

      unmount();
    }

    expect(mountDurations.length).toBeGreaterThan(0);
    const med = median(mountDurations);
    const p = p95(mountDurations);
    expect(med).toBeLessThan(MOUNT_THRESHOLD_MS);

    console.log(
      `[perf] mount (42 cells): median=${med.toFixed(2)}ms p95=${p.toFixed(2)}ms (${ITERATIONS} runs)`,
    );
  });
});
