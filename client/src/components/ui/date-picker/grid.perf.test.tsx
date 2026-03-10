// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from "vitest";
import { Profiler, type ProfilerOnRenderCallback } from "react";
import { render } from "@testing-library/react";
import { Temporal } from "@js-temporal/polyfill";
import { Root } from "./root";
import { useDatePicker, WeekDataContext } from "./context";
import {
  Grid,
  GridBody,
  GridHeader,
  GridHeaderCell,
  DayCellTemplate,
  DayButton,
} from "./grid";

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

// Generous thresholds — these exist to catch regressions, not enforce tight budgets.
// Actual durations in dev mode with the Temporal polyfill will be much slower than
// production. Adjust downward once baseline numbers are established.
const MOUNT_THRESHOLD_MS = 100;
const UPDATE_THRESHOLD_MS = 60;

describe("Grid render profiling", () => {
  // Warm up the Temporal polyfill so first-run JIT cost doesn't skew mount timings
  beforeAll(() => {
    const { unmount } = render(
      <Root {...defaultProps} defaultValue={march15}>
        <Grid />
      </Root>,
    );
    unmount();
  });

  it("initial mount completes within threshold", () => {
    const { entries, onRender } = createProfiler();

    const { unmount } = render(
      <Profiler id="grid-mount" onRender={onRender}>
        <Root {...defaultProps} defaultValue={march15}>
          <Grid />
        </Root>
      </Profiler>,
    );

    const mount = entries.find((e) => e.phase === "mount");
    expect(mount).toBeDefined();
    expect(mount!.actualDuration).toBeLessThan(MOUNT_THRESHOLD_MS);

    // Log for visibility in CI
    console.log(
      `[perf] grid mount: actual=${mount!.actualDuration.toFixed(2)}ms base=${mount!.baseDuration.toFixed(2)}ms`,
    );

    unmount();
  });

  it("re-render on selection change is cheaper than mount", () => {
    const { entries, onRender } = createProfiler();
    let currentValue: Temporal.PlainDate | undefined = march15;

    const { rerender, unmount } = render(
      <Profiler id="grid-select" onRender={onRender}>
        <Root {...defaultProps} value={currentValue}>
          <Grid />
        </Root>
      </Profiler>,
    );

    const mountDuration = entries.find((e) => e.phase === "mount")
      ?.actualDuration;

    // Change selection
    currentValue = march20;
    rerender(
      <Profiler id="grid-select" onRender={onRender}>
        <Root {...defaultProps} value={currentValue}>
          <Grid />
        </Root>
      </Profiler>,
    );

    const updates = entries.filter((e) => e.phase === "update");
    expect(updates.length).toBeGreaterThan(0);

    const updateDuration = updates[updates.length - 1].actualDuration;
    expect(updateDuration).toBeLessThan(UPDATE_THRESHOLD_MS);

    // Updates should be significantly cheaper than mount (memoization working)
    if (mountDuration) {
      expect(updateDuration).toBeLessThan(mountDuration * 0.6);
    }

    console.log(
      `[perf] selection change: mount=${mountDuration?.toFixed(2)}ms update=${updateDuration.toFixed(2)}ms ratio=${mountDuration ? (updateDuration / mountDuration).toFixed(2) : "N/A"}`,
    );

    unmount();
  });

  it("month navigation re-render stays within threshold", () => {
    const { entries, onRender } = createProfiler();

    const { rerender, unmount } = render(
      <Profiler id="grid-nav" onRender={onRender}>
        <Root
          {...defaultProps}
          defaultValue={march15}
        >
          <Grid />
        </Root>
      </Profiler>,
    );

    // Navigate to April by changing value to April 15
    const april15 = Temporal.PlainDate.from("2026-04-15");
    rerender(
      <Profiler id="grid-nav" onRender={onRender}>
        <Root {...defaultProps} value={april15}>
          <Grid />
        </Root>
      </Profiler>,
    );

    const updates = entries.filter((e) => e.phase === "update");
    expect(updates.length).toBeGreaterThan(0);

    const navDuration = updates[updates.length - 1].actualDuration;
    expect(navDuration).toBeLessThan(UPDATE_THRESHOLD_MS);

    console.log(
      `[perf] month navigation: ${navDuration.toFixed(2)}ms`,
    );

    unmount();
  });

  it("range selection re-render stays within threshold", () => {
    const { entries, onRender } = createProfiler();

    const { rerender, unmount } = render(
      <Profiler id="grid-range" onRender={onRender}>
        <Root
          {...defaultProps}
          selectionMode="range"
          value={{ start: march10, end: march15 }}
        >
          <Grid />
        </Root>
      </Profiler>,
    );

    // Expand range
    rerender(
      <Profiler id="grid-range" onRender={onRender}>
        <Root
          {...defaultProps}
          selectionMode="range"
          value={{ start: march10, end: march20 }}
        >
          <Grid />
        </Root>
      </Profiler>,
    );

    const updates = entries.filter((e) => e.phase === "update");
    expect(updates.length).toBeGreaterThan(0);

    const rangeDuration = updates[updates.length - 1].actualDuration;
    expect(rangeDuration).toBeLessThan(UPDATE_THRESHOLD_MS);

    console.log(
      `[perf] range expand: ${rangeDuration.toFixed(2)}ms`,
    );

    unmount();
  });

  it("rapid state changes (simulated drag) complete without accumulating cost", () => {
    const { entries, onRender } = createProfiler();

    const days = Array.from({ length: 10 }, (_, i) =>
      Temporal.PlainDate.from(`2026-03-${String(i + 5).padStart(2, "0")}`),
    );

    const { rerender, unmount } = render(
      <Profiler id="grid-drag" onRender={onRender}>
        <Root
          {...defaultProps}
          selectionMode="range"
          value={{ start: march10, end: days[0] }}
        >
          <Grid />
        </Root>
      </Profiler>,
    );

    // Simulate dragging across 10 days
    for (const day of days.slice(1)) {
      rerender(
        <Profiler id="grid-drag" onRender={onRender}>
          <Root
            {...defaultProps}
            selectionMode="range"
            value={{ start: march10, end: day }}
          >
            <Grid />
          </Root>
        </Profiler>,
      );
    }

    const updates = entries.filter((e) => e.phase === "update");
    const durations = updates.map((e) => e.actualDuration);
    const maxDuration = Math.max(...durations);
    const avgDuration =
      durations.reduce((a, b) => a + b, 0) / durations.length;

    // No single update should be wildly expensive
    expect(maxDuration).toBeLessThan(UPDATE_THRESHOLD_MS);
    // Average should stay reasonable
    expect(avgDuration).toBeLessThan(UPDATE_THRESHOLD_MS / 2);

    console.log(
      `[perf] rapid drag (${durations.length} updates): avg=${avgDuration.toFixed(2)}ms max=${maxDuration.toFixed(2)}ms`,
    );

    unmount();
  });

  it("measures per-week-row re-render cost on selection change", () => {
    // Wrap each week row in its own Profiler to measure which rows re-render.
    // Currently DayCellInstance is NOT wrapped in React.memo, so all rows
    // re-render on every state change. This test documents that behavior
    // and will detect improvements if memo is added later.
    const weekProfilers = Array.from({ length: 6 }, () => createProfiler());

    function ProfiledGrid() {
      const { weeks } = useDatePicker();
      return (
        <>
          <GridHeader>
            <GridHeaderCell />
          </GridHeader>
          <GridBody>
            {weeks.map((weekDays, i) => (
              <Profiler
                key={weekDays[0].toString()}
                id={`week-${i}`}
                onRender={weekProfilers[i].onRender}
              >
                <WeekDataContext.Provider
                  value={{ days: weekDays, weekIndex: i }}
                >
                  <tr>
                    <DayCellTemplate>
                      <DayButton />
                    </DayCellTemplate>
                  </tr>
                </WeekDataContext.Provider>
              </Profiler>
            ))}
          </GridBody>
        </>
      );
    }

    // March 15 is in week index 3 (Sun Mar 15). March 20 is in week index 3 too.
    // Changing from 15→16 keeps selection within the same week row.
    const march16 = Temporal.PlainDate.from("2026-03-16");

    const { rerender, unmount } = render(
      <Root {...defaultProps} value={march15}>
        <Grid>
          <ProfiledGrid />
        </Grid>
      </Root>,
    );

    // Clear mount entries
    for (const p of weekProfilers) p.entries.length = 0;

    // Change selection within the same week
    rerender(
      <Root {...defaultProps} value={march16}>
        <Grid>
          <ProfiledGrid />
        </Grid>
      </Root>,
    );

    const weekUpdateDurations = weekProfilers.map((p) => {
      const updates = p.entries.filter((e) => e.phase === "update");
      return updates.length > 0
        ? updates[updates.length - 1].actualDuration
        : 0;
    });

    // Log per-week durations for analysis
    const weekSummary = weekUpdateDurations
      .map((d, i) => `week${i}=${d.toFixed(2)}ms`)
      .join(" ");
    console.log(`[perf] per-week re-render: ${weekSummary}`);

    // Count how many weeks actually re-rendered (actualDuration > 0.01ms)
    const rerenderedWeeks = weekUpdateDurations.filter(
      (d) => d > 0.01,
    ).length;
    console.log(
      `[perf] weeks re-rendered: ${rerenderedWeeks}/${weekUpdateDurations.length} (ideal: 1-2 with React.memo)`,
    );

    // All updates should complete within threshold
    for (const d of weekUpdateDurations) {
      expect(d).toBeLessThan(UPDATE_THRESHOLD_MS);
    }

    unmount();
  });
});
