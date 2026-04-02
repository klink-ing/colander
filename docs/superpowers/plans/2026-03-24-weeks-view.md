# Weeks View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a continuous-weeks calendar view alongside the existing month grid, with shared selection state via a new CalendarProvider.

**Architecture:** Extract shared state from Root into CalendarProvider. Refactor Root into MonthView (breaking rename). Add WeeksView as a new compound component tree sharing CalendarProvider context. Grid delegates internally based on view type. New components: MonthSeparator, PrevWeeksButton, NextWeeksButton, WeeksView.WeekCount.

**Tech Stack:** React 18+, @base-ui/react (useRender pattern), @js-temporal/polyfill, TypeScript, Vitest

**Spec:** `docs/superpowers/specs/2026-03-24-weeks-view-design.md`

---

## File Structure

### New files

| File                             | Responsibility                                                                                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/calendar-provider.tsx`      | CalendarProvider context + provider component                                                                                                                                 |
| `src/calendar-context.ts`        | CalendarStable + CalendarState context definitions, hooks                                                                                                                     |
| `src/calendar-types.ts`          | Shared types: CalendarProviderProps, CalendarStableContextValue, CalendarStateContextValue                                                                                    |
| `src/view-context.ts`            | ViewContext — shared view-level interface (focusedDate, setFocusedDate, tabTargetDate, viewType) that both MonthView and WeeksView provide. Shared components read from this. |
| `src/month-view.tsx`             | MonthView.Root + MonthView convenience wrapper                                                                                                                                |
| `src/month-view-context.ts`      | MonthViewStable + MonthViewState context definitions, hooks                                                                                                                   |
| `src/month-view-types.ts`        | MonthViewRootProps, MonthViewStableContextValue, MonthViewStateContextValue                                                                                                   |
| `src/weeks-view.tsx`             | WeeksView.Root + WeeksView convenience wrapper                                                                                                                                |
| `src/weeks-view-context.ts`      | WeeksViewStable + WeeksViewState context definitions, hooks                                                                                                                   |
| `src/weeks-view-types.ts`        | WeeksViewRootProps, FirstWeekSpec, WindowInfo, overflow types                                                                                                                 |
| `src/weeks-view-state.ts`        | useWeeksViewState hook (week window computation, navigation)                                                                                                                  |
| `src/weeks-grid.ts`              | Internal WeeksGrid renderer (used by Grid in weeks view context)                                                                                                              |
| `src/month-separator.tsx`        | MonthSeparator + .Month, .Year, .WeekCount child components                                                                                                                   |
| `src/weeks-navigation.tsx`       | PrevWeeksButton, NextWeeksButton, WeeksView.WeekCount                                                                                                                         |
| `src/weeks-keyboard.ts`          | Weeks-specific keyboard navigation logic                                                                                                                                      |
| `src/compute-weeks-in-window.ts` | Pure utility: computeWeeksInWindow()                                                                                                                                          |
| `src/resolve-first-week.ts`      | Pure utilities: resolveFirstWeek(), resolveFirstWeekSpec()                                                                                                                    |
| `src/overflow.ts`                | Overflow behavior computation (stop, snap, shrink)                                                                                                                            |

### New test files

| File                                  | Tests for                                                 |
| ------------------------------------- | --------------------------------------------------------- |
| `src/compute-weeks-in-window.test.ts` | computeWeeksInWindow pure function                        |
| `src/resolve-first-week.test.ts`      | resolveFirstWeek, resolveFirstWeekSpec pure functions     |
| `src/overflow.test.ts`                | Overflow behavior computations                            |
| `src/weeks-keyboard.test.ts`          | Weeks-specific keyboard navigation                        |
| `src/weeks-view.test.tsx`             | WeeksView.Root integration (rendering, state, navigation) |
| `src/month-separator.test.tsx`        | MonthSeparator rendering and state                        |
| `src/calendar-provider.test.tsx`      | CalendarProvider + shared state                           |
| `src/month-view.test.tsx`             | MonthView refactor (regression tests)                     |

### Modified files

| File                     | Changes                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| `src/types.ts`           | Move shared types to calendar-types.ts, add view-specific types                                      |
| `src/context.ts`         | Remove DatePickerStableContext/DatePickerStateContext (moved to calendar-context.ts + view contexts) |
| `src/use-root-state.ts`  | Split into calendar state + month-view state                                                         |
| `src/root.tsx`           | Delete (replaced by month-view.tsx)                                                                  |
| `src/grid.tsx`           | Add view type detection, delegate to MonthGrid or WeeksGrid internally                               |
| `src/keyboard.ts`        | Extract shared keyboard logic, add view-type dispatch                                                |
| `src/navigation.tsx`     | PrevMonthButton/NextMonthButton read from MonthView context                                          |
| `src/day-cell.tsx`       | Read from CalendarProvider context instead of DatePicker context                                     |
| `src/week-number.tsx`    | Read from CalendarProvider context                                                                   |
| `src/selected-range.tsx` | Read from CalendarProvider context                                                                   |
| `src/range-preview.tsx`  | Read from CalendarProvider context                                                                   |
| `src/drag-handle.tsx`    | Read from CalendarProvider context                                                                   |
| `src/grid-header.tsx`    | Read from CalendarProvider context                                                                   |
| `src/factory.tsx`        | Update to use MonthView/WeeksView, return both view types                                            |
| `src/index.ts`           | Update all exports                                                                                   |
| `src/utils.ts`           | Add week window utilities                                                                            |

---

## Phase 1: Pure Utilities (no React, no context)

### Task 1: computeWeeksInWindow utility

**Files:**

- Create: `src/compute-weeks-in-window.ts`
- Test: `src/compute-weeks-in-window.test.ts`

- [ ] **Step 1: Write failing tests for computeWeeksInWindow**

```ts
// src/compute-weeks-in-window.test.ts
import { describe, it, expect } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import { computeWeeksInWindow } from "./compute-weeks-in-window";

const T = Temporal;

describe("computeWeeksInWindow", () => {
  it.each([
    {
      description: "8 weeks starting from a Sunday",
      firstWeek: T.PlainDate.from("2026-03-01"), // Sunday
      weekCount: 8,
      weekStartDay: 0 as const,
      expected: {
        length: 8,
        firstStart: "2026-03-01",
        firstEnd: "2026-03-07",
        lastStart: "2026-04-19",
        lastEnd: "2026-04-25",
      },
    },
    {
      description: "8 weeks starting mid-week, snaps back to week start",
      firstWeek: T.PlainDate.from("2026-03-04"), // Wednesday
      weekCount: 8,
      weekStartDay: 0 as const,
      expected: {
        length: 8,
        firstStart: "2026-03-01",
        firstEnd: "2026-03-07",
        lastStart: "2026-04-19",
        lastEnd: "2026-04-25",
      },
    },
    {
      description: "Monday week start",
      firstWeek: T.PlainDate.from("2026-03-04"), // Wednesday
      weekCount: 4,
      weekStartDay: 1 as const,
      expected: {
        length: 4,
        firstStart: "2026-03-02",
        firstEnd: "2026-03-08",
        lastStart: "2026-03-23",
        lastEnd: "2026-03-29",
      },
    },
    {
      description: "single week",
      firstWeek: T.PlainDate.from("2026-01-15"),
      weekCount: 1,
      weekStartDay: 0 as const,
      expected: {
        length: 1,
        firstStart: "2026-01-11",
        firstEnd: "2026-01-17",
        lastStart: "2026-01-11",
        lastEnd: "2026-01-17",
      },
    },
  ])("$description", ({ firstWeek, weekCount, weekStartDay, expected }) => {
    const weeks = computeWeeksInWindow(firstWeek, weekCount, weekStartDay, T);
    expect(weeks).toHaveLength(expected.length);
    expect(weeks[0].startDate.toString()).toBe(expected.firstStart);
    expect(weeks[0].endDate.toString()).toBe(expected.firstEnd);
    expect(weeks[weeks.length - 1].startDate.toString()).toBe(
      expected.lastStart,
    );
    expect(weeks[weeks.length - 1].endDate.toString()).toBe(expected.lastEnd);
  });

  it("assigns correct month/year to each week based on majority of days", () => {
    // Week of March 29 - April 4 (Sunday start): 5 days in March, 2 in April
    const weeks = computeWeeksInWindow(T.PlainDate.from("2026-03-29"), 1, 0, T);
    expect(weeks[0].startDate.toString()).toBe("2026-03-29");
    // month/year reflect the start date's month
    expect(weeks[0].month).toBe(3);
    expect(weeks[0].year).toBe(2026);
  });

  it("populates weekIndex sequentially from 0", () => {
    const weeks = computeWeeksInWindow(T.PlainDate.from("2026-03-01"), 5, 0, T);
    weeks.forEach((w, i) => expect(w.weekIndex).toBe(i));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/compute-weeks-in-window.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement computeWeeksInWindow**

```ts
// src/compute-weeks-in-window.ts
import type { Temporal } from "@js-temporal/polyfill";
import type { TemporalNamespace, WeekStartDay } from "./types";

export interface WeekDescriptor {
  startDate: Temporal.PlainDate;
  endDate: Temporal.PlainDate;
  weekIndex: number;
  month: number;
  year: number;
}

/**
 * Computes an array of week descriptors for a continuous window.
 * `firstWeek` is snapped back to the nearest `weekStartDay`.
 */
export function computeWeeksInWindow(
  firstWeek: Temporal.PlainDate,
  weekCount: number,
  weekStartDay: WeekStartDay,
  T: TemporalNamespace,
): WeekDescriptor[] {
  // Snap firstWeek back to the start of its week
  const dow = firstWeek.dayOfWeek % 7; // 0=Sun
  const offset = (dow - weekStartDay + 7) % 7;
  let weekStart = firstWeek.subtract({ days: offset });

  const weeks: WeekDescriptor[] = [];
  for (let i = 0; i < weekCount; i++) {
    const endDate = weekStart.add({ days: 6 });
    weeks.push({
      startDate: weekStart,
      endDate,
      weekIndex: i,
      month: weekStart.month,
      year: weekStart.year,
    });
    weekStart = weekStart.add({ weeks: 1 });
  }
  return weeks;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/compute-weeks-in-window.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/compute-weeks-in-window.ts src/compute-weeks-in-window.test.ts
git commit -m "feat: add computeWeeksInWindow pure utility"
```

---

### Task 2: resolveFirstWeekSpec utility

Converts `FirstWeekSpec` variants to a concrete `Temporal.PlainDate`.

**Files:**

- Create: `src/resolve-first-week.ts`
- Test: `src/resolve-first-week.test.ts`

- [ ] **Step 1: Write failing tests for resolveFirstWeekSpec**

```ts
// src/resolve-first-week.test.ts
import { describe, it, expect } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import { resolveFirstWeekSpec, resolveFirstWeek } from "./resolve-first-week";

const T = Temporal;

describe("resolveFirstWeekSpec", () => {
  it.each([
    {
      description: "PlainDate — returns containing week start (Sunday)",
      spec: T.PlainDate.from("2026-03-04"), // Wednesday
      weekStartDay: 0 as const,
      expected: "2026-03-01", // Sunday
    },
    {
      description: "PlainDate — returns containing week start (Monday)",
      spec: T.PlainDate.from("2026-03-04"), // Wednesday
      weekStartDay: 1 as const,
      expected: "2026-03-02", // Monday
    },
    {
      description: "PlainDate on week start day — no snap",
      spec: T.PlainDate.from("2026-03-01"), // Sunday
      weekStartDay: 0 as const,
      expected: "2026-03-01",
    },
    {
      description: "ISO week spec",
      spec: { isoWeek: 10, isoYear: 2026 },
      weekStartDay: 0 as const,
      // ISO week 10 of 2026 starts Monday March 2
      // But weekStartDay=0 (Sunday), so snap to Sunday March 1
      expected: "2026-03-01",
    },
    {
      description: "week-of-year spec (Sunday start)",
      spec: { week: 1, year: 2026 },
      weekStartDay: 0 as const,
      // First Sunday of 2026 is Jan 4
      expected: "2026-01-04",
    },
    {
      description:
        "month+year spec — first week containing a day in that month",
      spec: { month: 3, year: 2026 },
      weekStartDay: 0 as const,
      // March 1, 2026 is a Sunday — perfect week start
      expected: "2026-03-01",
    },
    {
      description: "month+year+day spec — week containing that day",
      spec: { month: 3, year: 2026, day: 15 },
      weekStartDay: 0 as const,
      // March 15 is a Sunday
      expected: "2026-03-15",
    },
    {
      description: "native Date object",
      spec: new Date(2026, 2, 4), // March 4, 2026
      weekStartDay: 0 as const,
      expected: "2026-03-01",
    },
  ])("$description", ({ spec, weekStartDay, expected }) => {
    const result = resolveFirstWeekSpec(spec, weekStartDay, T);
    expect(result.toString()).toBe(expected);
  });
});

describe("resolveFirstWeek", () => {
  it.each([
    {
      description: "snap start — target week becomes first row",
      currentFirstWeek: T.PlainDate.from("2026-01-04"),
      weekCount: 8,
      target: T.PlainDate.from("2026-03-15"),
      snap: "start" as const,
      expected: "2026-03-15",
    },
    {
      description: "snap center — target week centered in window",
      currentFirstWeek: T.PlainDate.from("2026-01-04"),
      weekCount: 8,
      target: T.PlainDate.from("2026-03-15"),
      snap: "center" as const,
      // 8 weeks, center = floor(8/2) = 4 weeks before target
      expected: "2026-02-15",
    },
    {
      description: "snap end — target week becomes last row",
      currentFirstWeek: T.PlainDate.from("2026-01-04"),
      weekCount: 8,
      target: T.PlainDate.from("2026-03-15"),
      snap: "end" as const,
      // 7 weeks before target
      expected: "2026-01-25",
    },
    {
      description: "snap nearest — already visible, no change",
      currentFirstWeek: T.PlainDate.from("2026-03-01"),
      weekCount: 8,
      target: T.PlainDate.from("2026-03-15"),
      snap: "nearest" as const,
      // Mar 15 is within 8-week window starting Mar 1
      expected: "2026-03-01",
    },
    {
      description: "snap nearest — target above window, becomes first row",
      currentFirstWeek: T.PlainDate.from("2026-04-01"),
      weekCount: 8,
      target: T.PlainDate.from("2026-03-15"),
      snap: "nearest" as const,
      expected: "2026-03-15",
    },
    {
      description: "snap nearest — target below window, becomes last row",
      currentFirstWeek: T.PlainDate.from("2026-01-04"),
      weekCount: 4,
      target: T.PlainDate.from("2026-03-15"),
      snap: "nearest" as const,
      // target is below window, so target becomes last row
      // 3 weeks before target
      expected: "2026-02-22",
    },
    {
      description: "default snap is start",
      currentFirstWeek: T.PlainDate.from("2026-01-04"),
      weekCount: 8,
      target: T.PlainDate.from("2026-03-15"),
      snap: undefined,
      expected: "2026-03-15",
    },
  ])(
    "$description",
    ({ currentFirstWeek, weekCount, target, snap, expected }) => {
      const result = resolveFirstWeek(
        currentFirstWeek,
        weekCount,
        target,
        snap ? { snap } : undefined,
      );
      expect(result.toString()).toBe(expected);
    },
  );
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/resolve-first-week.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement resolveFirstWeekSpec and resolveFirstWeek**

```ts
// src/resolve-first-week.ts
import type { Temporal } from "@js-temporal/polyfill";
import type { TemporalNamespace, WeekStartDay } from "./types";

export type FirstWeekSpec =
  | Temporal.PlainDate
  | Date
  | { isoWeek: number; isoYear: number }
  | { week: number; year: number }
  | { month: number; year: number; day?: number };

/** Snap a date back to the start of its week per weekStartDay. */
function snapToWeekStart(
  date: Temporal.PlainDate,
  weekStartDay: WeekStartDay,
): Temporal.PlainDate {
  const dow = date.dayOfWeek % 7; // 0=Sun
  const offset = (dow - weekStartDay + 7) % 7;
  return date.subtract({ days: offset });
}

/**
 * Resolves any FirstWeekSpec to the PlainDate of the week start.
 * The returned date is always snapped to weekStartDay.
 */
export function resolveFirstWeekSpec(
  spec: FirstWeekSpec,
  weekStartDay: WeekStartDay,
  T: TemporalNamespace,
  timeZone?: string,
): Temporal.PlainDate {
  // PlainDate
  if (
    typeof spec === "object" &&
    "calendar" in spec &&
    "day" in spec &&
    "month" in spec &&
    "year" in spec
  ) {
    return snapToWeekStart(spec as Temporal.PlainDate, weekStartDay);
  }

  // Native Date — convert using timeZone from CalendarProvider per spec.
  // Use the existing zdtToNativeDate/toZonedDateTime pattern from utils.ts in reverse:
  // extract year/month/day in the target timezone, then create PlainDate.
  // See utils.ts for the codebase's established pattern for native Date <-> Temporal conversion.
  if (spec instanceof Date) {
    const tz = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Extract date parts in the target timezone using Intl.DateTimeFormat
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    const parts = fmt.formatToParts(spec);
    const year = Number(parts.find((p) => p.type === "year")!.value);
    const month = Number(parts.find((p) => p.type === "month")!.value);
    const day = Number(parts.find((p) => p.type === "day")!.value);
    const plainDate = T.PlainDate.from({ year, month, day });
    return snapToWeekStart(plainDate, weekStartDay);
  }

  // ISO week
  if ("isoWeek" in spec && "isoYear" in spec) {
    // ISO week 1 contains the year's first Thursday
    // Jan 4 is always in ISO week 1
    const jan4 = T.PlainDate.from({ year: spec.isoYear, month: 1, day: 4 });
    const jan4Dow = jan4.dayOfWeek; // 1=Mon..7=Sun in ISO
    const isoWeek1Monday = jan4.subtract({ days: jan4Dow - 1 });
    const targetMonday = isoWeek1Monday.add({ weeks: spec.isoWeek - 1 });
    return snapToWeekStart(targetMonday, weekStartDay);
  }

  // Week-of-year relative to weekStartDay
  if ("week" in spec && "year" in spec && !("month" in spec)) {
    // Find first weekStartDay of the year
    const jan1 = T.PlainDate.from({ year: spec.year, month: 1, day: 1 });
    const jan1Dow = jan1.dayOfWeek % 7; // 0=Sun
    const daysUntilStart = (weekStartDay - jan1Dow + 7) % 7;
    const firstWeekStart = jan1.add({ days: daysUntilStart });
    return firstWeekStart.add({ weeks: spec.week - 1 });
  }

  // Month + year + optional day
  if ("month" in spec && "year" in spec) {
    const day = spec.day ?? 1;
    const date = T.PlainDate.from({
      year: spec.year,
      month: spec.month,
      day,
    });
    return snapToWeekStart(date, weekStartDay);
  }

  throw new Error("Invalid FirstWeekSpec");
}

export type ScrollToWeekSnap = "start" | "center" | "end" | "nearest";

/**
 * Pure utility: computes the new firstWeek (week start date) given a scroll target.
 * Does not consider overflowBehavior — returns the ideal position.
 */
export function resolveFirstWeek(
  currentFirstWeek: Temporal.PlainDate,
  weekCount: number,
  target: Temporal.PlainDate,
  options?: { snap?: ScrollToWeekSnap },
): Temporal.PlainDate {
  const snap = options?.snap ?? "start";

  // Snap target to its week start (using same weekday as currentFirstWeek)
  const weekStartDay = (currentFirstWeek.dayOfWeek % 7) as WeekStartDay;
  const targetWeekStart = snapToWeekStart(target, weekStartDay);

  switch (snap) {
    case "start":
      return targetWeekStart;
    case "center": {
      const offset = Math.floor(weekCount / 2);
      return targetWeekStart.subtract({ weeks: offset });
    }
    case "end":
      return targetWeekStart.subtract({ weeks: weekCount - 1 });
    case "nearest": {
      // Check if target is already in the current window
      const windowEnd = currentFirstWeek.add({ weeks: weekCount - 1, days: 6 });
      const isAbove =
        Temporal.PlainDate.compare(targetWeekStart, currentFirstWeek) < 0;
      const isBelow =
        Temporal.PlainDate.compare(targetWeekStart, windowEnd) > 0;
      if (!isAbove && !isBelow) {
        return currentFirstWeek; // already visible
      }
      if (isAbove) {
        return targetWeekStart; // becomes first row
      }
      // isBelow — becomes last row
      return targetWeekStart.subtract({ weeks: weekCount - 1 });
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/resolve-first-week.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/resolve-first-week.ts src/resolve-first-week.test.ts
git commit -m "feat: add resolveFirstWeekSpec and resolveFirstWeek utilities"
```

---

### Task 3: Overflow behavior computation

**Files:**

- Create: `src/overflow.ts`
- Test: `src/overflow.test.ts`

- [ ] **Step 1: Write failing tests for overflow computations**

```ts
// src/overflow.test.ts
import { describe, it, expect } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
import { applyOverflow, canShift, type OverflowBehavior } from "./overflow";

const T = Temporal;
const pd = (s: string) => T.PlainDate.from(s);

describe("applyOverflow", () => {
  const min = pd("2025-12-01");
  const max = pd("2026-01-10");

  it.each([
    {
      description: "unbounded — no adjustment",
      targetFirstWeek: pd("2026-02-01"),
      weekCount: 8,
      behavior: "unbounded" as OverflowBehavior,
      expected: { firstWeek: "2026-02-01", weekCount: 8 },
    },
    {
      description: "stop — target has valid weeks, allowed",
      targetFirstWeek: pd("2025-12-07"),
      weekCount: 8,
      behavior: "stop" as OverflowBehavior,
      expected: { firstWeek: "2025-12-07", weekCount: 8 },
    },
    {
      description: "snap — pulls back when target overshoots max",
      targetFirstWeek: pd("2026-01-11"),
      weekCount: 8,
      behavior: "snap" as OverflowBehavior,
      expected: {
        // Last valid week contains Jan 10 (week of Jan 4-10)
        // 8 weeks ending at Jan 10 → starts Nov 16
        firstWeek: "2025-11-16",
        weekCount: 8,
      },
    },
    {
      description: "snap-shrink — pulls back and trims disabled rows",
      targetFirstWeek: pd("2026-01-11"),
      weekCount: 8,
      behavior: "snap-shrink" as OverflowBehavior,
      expected: {
        // Valid weeks: Nov 30-Dec 6 through Jan 4-10 = 6 weeks
        firstWeek: "2025-11-30",
        weekCount: 6,
      },
    },
    {
      description: "stop-shrink — trims disabled rows",
      targetFirstWeek: pd("2025-12-07"),
      weekCount: 8,
      behavior: "stop-shrink" as OverflowBehavior,
      expected: {
        firstWeek: "2025-12-07",
        // Dec 7 + 8 weeks = Feb 1; valid through Jan 10
        // weeks with valid days: Dec 7, Dec 14, Dec 21, Dec 28, Jan 4 = 5
        weekCount: 5,
      },
    },
    {
      description: "no min/max — all modes behave as unbounded",
      targetFirstWeek: pd("2026-06-01"),
      weekCount: 8,
      behavior: "snap" as OverflowBehavior,
      useMinMax: false,
      expected: { firstWeek: "2026-06-01", weekCount: 8 },
    },
  ])(
    "$description",
    ({ targetFirstWeek, weekCount, behavior, useMinMax, expected }) => {
      const result = applyOverflow({
        targetFirstWeek,
        weekCount,
        behavior,
        min: useMinMax === false ? undefined : min,
        max: useMinMax === false ? undefined : max,
        weekStartDay: 0,
        T,
      });
      expect(result.firstWeek.toString()).toBe(expected.firstWeek);
      expect(result.weekCount).toBe(expected.weekCount);
    },
  );
});

describe("canShift", () => {
  const min = pd("2025-12-01");
  const max = pd("2026-01-10");

  it.each([
    {
      description: "unbounded — always true",
      behavior: "unbounded" as OverflowBehavior,
      currentFirstWeek: pd("2026-06-01"),
      direction: 1 as const,
      expected: true,
    },
    {
      description: "stop — false when target has no valid weeks",
      behavior: "stop" as OverflowBehavior,
      currentFirstWeek: pd("2025-12-28"),
      direction: 1 as const,
      // Shifting forward 8 weeks from Dec 28 → Feb 22, no valid days
      expected: false,
    },
    {
      description: "snap — false when already at clamp position",
      behavior: "snap" as OverflowBehavior,
      currentFirstWeek: pd("2025-11-16"),
      direction: 1 as const,
      // Already at max snap position
      expected: false,
    },
  ])("$description", ({ behavior, currentFirstWeek, direction, expected }) => {
    const result = canShift({
      currentFirstWeek,
      weekCount: 8,
      direction,
      behavior,
      min,
      max,
      weekStartDay: 0,
      T,
    });
    expect(result).toBe(expected);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/overflow.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement overflow logic**

```ts
// src/overflow.ts
import type { Temporal } from "@js-temporal/polyfill";
import type { TemporalNamespace, WeekStartDay } from "./types";

export type OverflowBehavior =
  | "unbounded"
  | "stop"
  | "stop-shrink"
  | "snap"
  | "snap-shrink";

export type MonthOverflowBehavior = "unbounded" | "stop";

interface OverflowInput {
  targetFirstWeek: Temporal.PlainDate;
  weekCount: number;
  behavior: OverflowBehavior;
  min: Temporal.PlainDate | undefined;
  max: Temporal.PlainDate | undefined;
  weekStartDay: WeekStartDay;
  T: TemporalNamespace;
}

interface OverflowResult {
  firstWeek: Temporal.PlainDate;
  weekCount: number;
}

/** Check if a week (7-day span starting at weekStart) has ≥1 day within min/max. */
function weekHasValidDay(
  weekStart: Temporal.PlainDate,
  min: Temporal.PlainDate | undefined,
  max: Temporal.PlainDate | undefined,
  T: TemporalNamespace,
): boolean {
  const weekEnd = weekStart.add({ days: 6 });
  if (min && T.PlainDate.compare(weekEnd, min) < 0) return false;
  if (max && T.PlainDate.compare(weekStart, max) > 0) return false;
  return true;
}

/** Find the last week start where the week has valid days. */
function findLastValidWeekStart(
  max: Temporal.PlainDate,
  weekStartDay: WeekStartDay,
  T: TemporalNamespace,
): Temporal.PlainDate {
  const dow = max.dayOfWeek % 7;
  const offset = (dow - weekStartDay + 7) % 7;
  return max.subtract({ days: offset });
}

/** Find the first week start where the week has valid days. */
function findFirstValidWeekStart(
  min: Temporal.PlainDate,
  weekStartDay: WeekStartDay,
  T: TemporalNamespace,
): Temporal.PlainDate {
  const dow = min.dayOfWeek % 7;
  const offset = (dow - weekStartDay + 7) % 7;
  const weekStart = min.subtract({ days: offset });
  return weekStart;
}

/** Count valid weeks in window. */
function countValidWeeks(
  firstWeek: Temporal.PlainDate,
  weekCount: number,
  min: Temporal.PlainDate | undefined,
  max: Temporal.PlainDate | undefined,
  T: TemporalNamespace,
): number {
  let count = 0;
  let ws = firstWeek;
  for (let i = 0; i < weekCount; i++) {
    if (weekHasValidDay(ws, min, max, T)) count++;
    ws = ws.add({ weeks: 1 });
  }
  return count;
}

/** Trim trailing and leading fully-disabled weeks. Returns new firstWeek + weekCount. */
function shrinkWindow(
  firstWeek: Temporal.PlainDate,
  weekCount: number,
  min: Temporal.PlainDate | undefined,
  max: Temporal.PlainDate | undefined,
  T: TemporalNamespace,
): OverflowResult {
  // Find first valid week
  let start = firstWeek;
  let startIdx = 0;
  while (startIdx < weekCount && !weekHasValidDay(start, min, max, T)) {
    start = start.add({ weeks: 1 });
    startIdx++;
  }
  if (startIdx >= weekCount) {
    return { firstWeek, weekCount: 0 };
  }
  // Find last valid week
  let endIdx = weekCount - 1;
  let end = firstWeek.add({ weeks: endIdx });
  while (endIdx > startIdx && !weekHasValidDay(end, min, max, T)) {
    end = end.subtract({ weeks: 1 });
    endIdx--;
  }
  return { firstWeek: start, weekCount: endIdx - startIdx + 1 };
}

export function applyOverflow(input: OverflowInput): OverflowResult {
  const { targetFirstWeek, weekCount, behavior, min, max, weekStartDay, T } =
    input;

  // No bounds → unbounded
  if (!min && !max) {
    return { firstWeek: targetFirstWeek, weekCount };
  }

  if (behavior === "unbounded") {
    return { firstWeek: targetFirstWeek, weekCount };
  }

  if (behavior === "stop" || behavior === "stop-shrink") {
    const validCount = countValidWeeks(targetFirstWeek, weekCount, min, max, T);
    // stop modes don't adjust position — caller checks canShift before calling
    if (behavior === "stop-shrink" && validCount < weekCount) {
      return shrinkWindow(targetFirstWeek, weekCount, min, max, T);
    }
    return { firstWeek: targetFirstWeek, weekCount };
  }

  // snap / snap-shrink
  let adjustedFirst = targetFirstWeek;

  // Pull back if overshooting max
  if (max) {
    const lastValid = findLastValidWeekStart(max, weekStartDay, T);
    const windowEnd = adjustedFirst.add({ weeks: weekCount - 1 });
    if (T.PlainDate.compare(windowEnd, lastValid) > 0) {
      adjustedFirst = lastValid.subtract({ weeks: weekCount - 1 });
    }
  }

  // Push forward if undershooting min
  if (min) {
    const firstValid = findFirstValidWeekStart(min, weekStartDay, T);
    if (T.PlainDate.compare(adjustedFirst, firstValid) < 0) {
      adjustedFirst = firstValid;
    }
  }

  if (behavior === "snap-shrink") {
    return shrinkWindow(adjustedFirst, weekCount, min, max, T);
  }

  return { firstWeek: adjustedFirst, weekCount };
}

interface CanShiftInput {
  currentFirstWeek: Temporal.PlainDate;
  weekCount: number;
  shiftBy?: number; // defaults to weekCount
  direction: 1 | -1;
  behavior: OverflowBehavior;
  min: Temporal.PlainDate | undefined;
  max: Temporal.PlainDate | undefined;
  weekStartDay: WeekStartDay;
  T: TemporalNamespace;
}

export function canShift(input: CanShiftInput): boolean {
  const {
    currentFirstWeek,
    weekCount,
    direction,
    behavior,
    min,
    max,
    weekStartDay,
    T,
  } = input;

  if (behavior === "unbounded") return true;
  if (!min && !max) return true;

  const shiftBy = input.shiftBy ?? weekCount;
  const targetFirstWeek = currentFirstWeek.add({ weeks: direction * shiftBy });

  if (behavior === "stop" || behavior === "stop-shrink") {
    return countValidWeeks(targetFirstWeek, weekCount, min, max, T) > 0;
  }

  // snap / snap-shrink: disabled when shift would result in same position
  const result = applyOverflow({
    targetFirstWeek,
    weekCount,
    behavior,
    min,
    max,
    weekStartDay,
    T,
  });
  return T.PlainDate.compare(result.firstWeek, currentFirstWeek) !== 0;
}
```

- [ ] **Step 4: Run tests, iterate until passing**

Run: `npx vitest run src/overflow.test.ts`
Expected: PASS (may need adjustment of expected values — verify by hand)

- [ ] **Step 5: Commit**

```bash
git add src/overflow.ts src/overflow.test.ts
git commit -m "feat: add overflow behavior computation for weeks view"
```

---

### Task 4: Weeks-specific keyboard navigation

**Files:**

- Create: `src/weeks-keyboard.ts`
- Test: `src/weeks-keyboard.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/weeks-keyboard.test.ts
import { describe, it, expect } from "vitest";
import { Temporal } from "@js-temporal/polyfill";
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
    const result = computeWeeksKeyNav({
      ...baseInput,
      key: "ArrowDown",
      focusedDate: pd("2026-04-22"), // Last week of 8-week window from Mar 1
    });
    expect(result.action).toBe("move");
    expect(result.windowShift).toBe(1);
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
  });

  it("PageDown shifts focus and window by weekCount", () => {
    const result = computeWeeksKeyNav({ ...baseInput, key: "PageDown" });
    expect(result).toEqual({
      action: "move",
      date: pd("2026-05-10"), // +8 weeks
      windowShift: 8,
    });
  });

  it("Shift+PageDown shifts focus +1 year", () => {
    const result = computeWeeksKeyNav({
      ...baseInput,
      key: "PageDown",
      shiftKey: true,
    });
    expect(result.action).toBe("move");
    expect(result.date?.toString()).toBe("2027-03-15");
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
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/weeks-keyboard.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement weeks keyboard navigation**

```ts
// src/weeks-keyboard.ts
import type { Temporal } from "@js-temporal/polyfill";
import type { TemporalNamespace, WeekStartDay } from "./types";

export type WeeksKeyNavResult =
  | {
      action: "move";
      date: Temporal.PlainDate;
      windowShift: number;
      followFocus: boolean;
    }
  | { action: "select"; windowShift: number; followFocus: boolean }
  | { action: "none"; windowShift: number; followFocus: boolean };

export interface WeeksKeyNavInput {
  key: string;
  shiftKey: boolean;
  focusedDate: Temporal.PlainDate;
  windowStart: Temporal.PlainDate;
  weekCount: number;
  minValue: Temporal.PlainDate | undefined;
  maxValue: Temporal.PlainDate | undefined;
  disabled: boolean;
  readOnly?: boolean;
  isDateDisabled?: (date: Temporal.PlainDate) => boolean;
  scrollBy: "row" | "page";
  T: TemporalNamespace;
  weekStartDay: WeekStartDay;
}

function clamp(
  date: Temporal.PlainDate,
  min: Temporal.PlainDate | undefined,
  max: Temporal.PlainDate | undefined,
  T: TemporalNamespace,
): Temporal.PlainDate {
  let d = date;
  if (min && T.PlainDate.compare(d, min) < 0) d = min;
  if (max && T.PlainDate.compare(d, max) > 0) d = max;
  return d;
}

export function computeWeeksKeyNav(input: WeeksKeyNavInput): WeeksKeyNavResult {
  const {
    key,
    shiftKey,
    focusedDate,
    windowStart,
    weekCount,
    minValue,
    maxValue,
    disabled,
    readOnly,
    isDateDisabled,
    scrollBy,
    T,
    weekStartDay,
  } = input;

  const none: WeeksKeyNavResult = {
    action: "none",
    windowShift: 0,
    followFocus: false,
  };
  if (disabled) return none;

  const windowEnd = windowStart.add({ weeks: weekCount, days: -1 });

  /** Check if a date is outside the current window. */
  function isOutsideWindow(d: Temporal.PlainDate): boolean {
    return (
      T.PlainDate.compare(d, windowStart) < 0 ||
      T.PlainDate.compare(d, windowEnd) > 0
    );
  }

  /** Compute window shift when focus leaves the window. */
  function windowShiftFor(target: Temporal.PlainDate): number {
    if (!isOutsideWindow(target)) return 0;
    if (scrollBy === "page") {
      return T.PlainDate.compare(target, windowStart) < 0
        ? -weekCount
        : weekCount;
    }
    // scrollBy "row" — shift by 1 week
    return T.PlainDate.compare(target, windowStart) < 0 ? -1 : 1;
  }

  let nextDate: Temporal.PlainDate | null = null;

  switch (key) {
    case "ArrowRight":
      nextDate = focusedDate.add({ days: 1 });
      break;
    case "ArrowLeft":
      nextDate = focusedDate.subtract({ days: 1 });
      break;
    case "ArrowDown":
      nextDate = focusedDate.add({ weeks: 1 });
      break;
    case "ArrowUp":
      nextDate = focusedDate.subtract({ weeks: 1 });
      break;
    case "Home":
      nextDate = windowStart;
      return {
        action: "move",
        date: nextDate,
        windowShift: 0,
        followFocus: false,
      };
    case "End":
      nextDate = windowEnd;
      return {
        action: "move",
        date: nextDate,
        windowShift: 0,
        followFocus: false,
      };
    case "PageUp":
      if (shiftKey) {
        nextDate = focusedDate.subtract({ years: 1 });
        nextDate = clamp(nextDate, minValue, maxValue, T);
        return {
          action: "move",
          date: nextDate,
          windowShift: 0,
          followFocus: true,
        };
      } else {
        nextDate = focusedDate.subtract({ weeks: weekCount });
        nextDate = clamp(nextDate, minValue, maxValue, T);
        return {
          action: "move",
          date: nextDate,
          windowShift: -weekCount,
          followFocus: false,
        };
      }
    case "PageDown":
      if (shiftKey) {
        nextDate = focusedDate.add({ years: 1 });
        nextDate = clamp(nextDate, minValue, maxValue, T);
        return {
          action: "move",
          date: nextDate,
          windowShift: 0,
          followFocus: true,
        };
      } else {
        nextDate = focusedDate.add({ weeks: weekCount });
        nextDate = clamp(nextDate, minValue, maxValue, T);
        return {
          action: "move",
          date: nextDate,
          windowShift: weekCount,
          followFocus: false,
        };
      }
    case "Enter":
    case " ":
      if (readOnly) return none;
      if (!isDateDisabled?.(focusedDate)) {
        return { action: "select", windowShift: 0 };
      }
      return none;
    default:
      return none;
  }

  if (nextDate) {
    nextDate = clamp(nextDate, minValue, maxValue, T);
    if (T.PlainDate.compare(nextDate, focusedDate) === 0) return none;
    return {
      action: "move",
      date: nextDate,
      windowShift: windowShiftFor(nextDate),
      followFocus: false,
    };
  }

  return none;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/weeks-keyboard.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/weeks-keyboard.ts src/weeks-keyboard.test.ts
git commit -m "feat: add weeks-specific keyboard navigation"
```

---

## Phase 2: Context Extraction & MonthView Refactor

### Task 5: Define calendar-level types and context

Extract shared types from the current `types.ts` and `context.ts` into new calendar-level files. This is a structural move — no behavior changes.

**Files:**

- Create: `src/calendar-types.ts`
- Create: `src/calendar-context.ts`
- Modify: `src/types.ts` — re-export from calendar-types for backwards compat during migration

- [ ] **Step 1: Read current types.ts and context.ts to identify shared vs view-specific types**

Read: `src/types.ts`, `src/context.ts`
Identify which types belong to CalendarProvider (shared) vs MonthView (view-specific).

- [ ] **Step 2: Create calendar-types.ts**

Extract shared types: selection types, value format types, bounds types, locale/temporal types, weekStartDay, state attribute helpers. Keep view-specific types (MonthData, Grid types, etc.) in types.ts.

```ts
// src/calendar-types.ts
// Re-export shared types that CalendarProvider needs.
// This file defines the types for CalendarStableContextValue and CalendarStateContextValue.
// Specific type contents depend on reading the current types.ts — follow the spec's
// useCalendarStable/useCalendarState hook table for what belongs here.
```

- [ ] **Step 3: Create view-context.ts**

Shared view-level context that both MonthView.Root and WeeksView.Root provide. Shared components (DayCellTemplate, DayButton, Grid) read from this instead of view-specific contexts.

```ts
// src/view-context.ts
import { createContext, useContext } from "react";
import type { Temporal } from "@js-temporal/polyfill";

export interface ViewContextValue {
  viewType: "month" | "weeks";
  focusedDate: Temporal.PlainDate;
  setFocusedDate: (date: Temporal.PlainDate) => void;
  tabTargetDate: Temporal.PlainDate;
  gridHasFocus: boolean;
  setGridHasFocus: (v: boolean) => void;
}

export const ViewContext = createContext<ViewContextValue | null>(null);

export function useViewContext(): ViewContextValue {
  const ctx = useContext(ViewContext);
  if (!ctx)
    throw new Error(
      "useViewContext must be used within MonthView or WeeksView",
    );
  return ctx;
}
```

Both `MonthView.Root` and `WeeksView.Root` will provide this context. Shared components use `useViewContext()` for focus-related state and `useCalendarStable()`/`useCalendarState()` for selection/config.

- [ ] **Step 4: Create calendar-context.ts**

```ts
// src/calendar-context.ts
// (Same as previously written)
import { createContext, useContext } from "react";
import type {
  CalendarStableContextValue,
  CalendarStateContextValue,
} from "./calendar-types";

export const CalendarStableContext =
  createContext<CalendarStableContextValue | null>(null);
export const CalendarStateContext =
  createContext<CalendarStateContextValue | null>(null);

export function useCalendarStable(): CalendarStableContextValue {
  const ctx = useContext(CalendarStableContext);
  if (!ctx)
    throw new Error("useCalendarStable must be used within CalendarProvider");
  return ctx;
}

export function useCalendarState(): CalendarStateContextValue {
  const ctx = useContext(CalendarStateContext);
  if (!ctx)
    throw new Error("useCalendarState must be used within CalendarProvider");
  return ctx;
}
```

- [ ] **Step 4: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS (or only pre-existing errors)

- [ ] **Step 5: Commit**

```bash
git add src/calendar-types.ts src/calendar-context.ts src/view-context.ts
git commit -m "feat: define CalendarProvider types, context, and shared ViewContext"
```

---

### Task 6: Create CalendarProvider component

Extract shared state management from `use-root-state.ts` into CalendarProvider.

**Files:**

- Create: `src/calendar-provider.tsx`
- Test: `src/calendar-provider.test.tsx`

- [ ] **Step 1: Write failing test for CalendarProvider**

```tsx
// src/calendar-provider.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Temporal } from "@js-temporal/polyfill";
import { CalendarProvider } from "./calendar-provider";
import { useCalendarStable, useCalendarState } from "./calendar-context";

function StableConsumer() {
  const stable = useCalendarStable();
  return <div data-testid="locale">{stable.locale}</div>;
}

function StateConsumer() {
  const state = useCalendarState();
  return (
    <div data-testid="value">{state.value ? "has-value" : "no-value"}</div>
  );
}

describe("CalendarProvider", () => {
  it("provides stable context to children", () => {
    render(
      <CalendarProvider locale="en-US" T={Temporal}>
        <StableConsumer />
      </CalendarProvider>,
    );
    expect(screen.getByTestId("locale").textContent).toBe("en-US");
  });

  it("provides state context to children", () => {
    render(
      <CalendarProvider locale="en-US" T={Temporal}>
        <StateConsumer />
      </CalendarProvider>,
    );
    expect(screen.getByTestId("value").textContent).toBe("no-value");
  });

  it("throws when hooks used outside provider", () => {
    expect(() => render(<StableConsumer />)).toThrow();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/calendar-provider.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement CalendarProvider**

Build `CalendarProvider` by extracting shared state logic from `use-root-state.ts`. This component:

- Accepts CalendarProviderProps (selection, bounds, locale, temporal, weekStartDay, disabled, readOnly)
- Manages selection state (controlled/uncontrolled)
- Provides `CalendarStableContext` and `CalendarStateContext`
- Does NOT manage focus, navigation, or grid data — those belong to view roots

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/calendar-provider.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/calendar-provider.tsx src/calendar-provider.test.tsx
git commit -m "feat: add CalendarProvider component"
```

---

### Task 7: Define MonthView types and context

**Files:**

- Create: `src/month-view-types.ts`
- Create: `src/month-view-context.ts`

- [ ] **Step 1: Create month-view-types.ts**

Move month-specific types from current types.ts: MonthViewRootProps (numberOfMonths, fixedWeeks, outsideDays, overflowBehavior, month control). Define MonthViewStableContextValue and MonthViewStateContextValue per the spec's hook table.

- [ ] **Step 2: Create month-view-context.ts**

```ts
// src/month-view-context.ts
import { createContext, useContext } from "react";
import type {
  MonthViewStableContextValue,
  MonthViewStateContextValue,
} from "./month-view-types";

export const MonthViewStableContext =
  createContext<MonthViewStableContextValue | null>(null);
export const MonthViewStateContext =
  createContext<MonthViewStateContextValue | null>(null);

export function useMonthViewStable(): MonthViewStableContextValue {
  const ctx = useContext(MonthViewStableContext);
  if (!ctx) throw new Error("useMonthViewStable must be used within MonthView");
  return ctx;
}

export function useMonthViewState(): MonthViewStateContextValue {
  const ctx = useContext(MonthViewStateContext);
  if (!ctx) throw new Error("useMonthViewState must be used within MonthView");
  return ctx;
}
```

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/month-view-types.ts src/month-view-context.ts
git commit -m "feat: define MonthView types and context"
```

---

### Task 8: Create MonthView.Root and MonthView convenience wrapper

Refactor the current Root component into MonthView.Root (reads from CalendarProvider, manages month-specific state) and MonthView (convenience wrapper combining CalendarProvider + MonthView.Root).

**Files:**

- Create: `src/month-view.tsx`
- Test: `src/month-view.test.tsx`
- Modify: `src/root.tsx` — delete
- Modify: `src/use-root-state.ts` — split into calendar + month-view state

- [ ] **Step 1: Write regression tests for MonthView**

Port key tests from `root.test.tsx` to verify that `MonthView` provides identical behavior to the old `Root`. Replace `<Root>` with `<MonthView>` in test renders.

- [ ] **Step 2: Implement MonthView.Root**

MonthView.Root:

- Must be inside CalendarProvider (reads calendar context)
- Manages: currentMonth, focusedDate, grid weeks computation, keyboard navigation
- Provides: MonthViewStableContext + MonthViewStateContext
- Accepts: numberOfMonths, fixedWeeks, outsideDays, overflowBehavior ("unbounded" | "stop")

- [ ] **Step 3: Implement MonthView convenience wrapper**

```tsx
// MonthView composes CalendarProvider + MonthView.Root
export function MonthView(props: MonthViewProps) {
  const {
    numberOfMonths,
    fixedWeeks,
    outsideDays,
    overflowBehavior,
    ...calendarProps
  } = props;
  return (
    <CalendarProvider {...calendarProps}>
      <MonthViewRoot
        numberOfMonths={numberOfMonths}
        fixedWeeks={fixedWeeks}
        outsideDays={outsideDays}
        overflowBehavior={overflowBehavior}
      />
    </CalendarProvider>
  );
}
```

- [ ] **Step 4: Run regression tests**

Run: `npx vitest run src/month-view.test.tsx`
Expected: PASS — same behavior as old Root

- [ ] **Step 5: Commit**

```bash
git add src/month-view.tsx src/month-view.test.tsx
git commit -m "feat: add MonthView.Root and MonthView convenience wrapper"
```

---

### Task 9: Migrate shared components to read from CalendarProvider

Update all shared components to read from CalendarProvider context (useCalendarStable/useCalendarState) instead of the old useDatePicker hooks. This is the big migration step.

**Files:**

- Modify: `src/day-cell.tsx`
- Modify: `src/grid.tsx`
- Modify: `src/grid-header.tsx`
- Modify: `src/week-number.tsx`
- Modify: `src/selected-range.tsx`
- Modify: `src/range-preview.tsx`
- Modify: `src/drag-handle.tsx`
- Modify: `src/navigation.tsx` — PrevMonthButton/NextMonthButton read from MonthView context

- [ ] **Step 1: Update day-cell.tsx**

Replace `useDatePicker()` / `useDatePickerStable()` / `useDatePickerState()` calls with the appropriate calendar-level or view-level hooks. For shared data (selection, locale, disabled), use `useCalendarStable()` / `useCalendarState()`. For view-specific data (focusedDate, tabTargetDate, weeks), read from a view context.

Key pattern: shared components read from `useViewContext()` (defined in Task 5) for focus-related state, and `useCalendarStable()`/`useCalendarState()` for selection/config.

**Important: `computeDayCellState` adaptation for weeks view.** In month view, `outsideMonth` is true for days outside the displayed month. In weeks view, there is no "current month" — every day is in-window. When `useViewContext().viewType === "weeks"`, `outsideMonth` should always be `false` and `outsideDays` modes should not apply. Update `computeDayCellState` to accept a `viewType` parameter and short-circuit outsideMonth logic when in weeks view.

- [ ] **Step 2: Update remaining shared components**

Apply the same pattern to grid.tsx, grid-header.tsx, week-number.tsx, selected-range.tsx, range-preview.tsx, drag-handle.tsx.

- [ ] **Step 3: Update navigation.tsx**

PrevMonthButton and NextMonthButton read from `useMonthViewStable()` for goNextMonth/goPrevMonth. They throw if used outside MonthView context.

- [ ] **Step 4: Run all existing tests**

Run: `npx vitest run`
Expected: PASS — all existing tests still work after context migration

- [ ] **Step 5: Commit**

```bash
git add src/day-cell.tsx src/grid.tsx src/grid-header.tsx src/week-number.tsx \
  src/selected-range.tsx src/range-preview.tsx src/drag-handle.tsx src/navigation.tsx
git commit -m "refactor: migrate shared components to CalendarProvider context"
```

---

### Task 10: Delete old Root, update context.ts, update index.ts

Clean up the old code and update exports.

**Files:**

- Delete: `src/root.tsx`
- Modify: `src/context.ts` — remove DatePickerStableContext/DatePickerStateContext, keep WeekDataContext, GridContext, DayCellDataContext, GridMonthContext
- Modify: `src/index.ts` — replace Root export with MonthView, add CalendarProvider, add new hooks

- [ ] **Step 1: Delete root.tsx and root.test.tsx**

Delete `src/root.tsx` (replaced by `src/month-view.tsx`) and `src/root.test.tsx` (replaced by `src/month-view.test.tsx`). Also delete `src/use-root-state.ts` if fully split into calendar-provider and month-view state.

- [ ] **Step 2: Update context.ts**

Remove the old DatePicker contexts and hooks. Keep the grid-level contexts (WeekDataContext, GridContext, DayCellDataContext, GridMonthContext).

- [ ] **Step 3: Update index.ts**

```ts
// New exports:
export { CalendarProvider } from "./calendar-provider";
export { MonthView } from "./month-view";
// MonthView.Root is accessed as MonthView.Root (compound component pattern)

// Hooks:
export { useCalendarStable, useCalendarState } from "./calendar-context";
export { useMonthViewStable, useMonthViewState } from "./month-view-context";

// Remove: Root, useDatePicker, useDatePickerStable, useDatePickerState
```

- [ ] **Step 4: Run all tests + type check**

Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git rm src/root.tsx src/root.test.tsx src/use-root-state.ts
git add src/context.ts src/index.ts
git commit -m "refactor: remove old Root, update exports for new architecture"
```

---

## Phase 3: WeeksView Implementation

### Task 11: Define WeeksView types and context

**Files:**

- Create: `src/weeks-view-types.ts`
- Create: `src/weeks-view-context.ts`

- [ ] **Step 1: Create weeks-view-types.ts**

Define: WeeksViewRootProps, WeeksViewStableContextValue, WeeksViewStateContextValue, WindowInfo. Import FirstWeekSpec and OverflowBehavior from their respective modules.

- [ ] **Step 2: Create weeks-view-context.ts**

Same pattern as calendar-context.ts and month-view-context.ts. Provide useWeeksViewStable() and useWeeksViewState() hooks.

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/weeks-view-types.ts src/weeks-view-context.ts
git commit -m "feat: define WeeksView types and context"
```

---

### Task 12: Implement WeeksView.Root state management

The core state hook for WeeksView — manages the week window, firstWeek resolution, overflow, and navigation.

**Files:**

- Create: `src/weeks-view-state.ts`

- [ ] **Step 1: Implement useWeeksViewRootState**

This hook:

- Resolves `firstWeek` / `defaultFirstWeek` from `FirstWeekSpec` to a concrete `PlainDate` via `resolveFirstWeekSpec`
- Manages controlled/uncontrolled `firstWeek` state
- Computes the week window via `computeWeeksInWindow`
- Applies overflow behavior via `applyOverflow`
- Computes `WindowInfo` (windowStart, windowEnd, weekCount, dayCount, enabledWeekCount, enabledDayCount)
- Provides `goNext` / `goPrev` navigation functions
- Provides `scrollToWeek` imperative method
- Manages focusedDate within the window
- Calls `onWindowChange` and `onFirstWeekChange` callbacks

```ts
// src/weeks-view-state.ts
// Returns: { stableCtx, stateCtx, scrollToWeek }
```

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/weeks-view-state.ts
git commit -m "feat: add useWeeksViewRootState hook"
```

---

### Task 13: Implement WeeksView.Root and WeeksView convenience wrapper

**Files:**

- Create: `src/weeks-view.tsx`
- Test: `src/weeks-view.test.tsx`

- [ ] **Step 1: Write failing tests for WeeksView**

```tsx
// src/weeks-view.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Temporal } from "@js-temporal/polyfill";
import { WeeksView } from "./weeks-view";
import { useWeeksViewState } from "./weeks-view-context";
import {
  Grid,
  GridBody,
  WeekTemplate,
  DayCellTemplate,
  DayButton,
} from "./index";

const T = Temporal;

function WindowInfoDisplay() {
  const state = useWeeksViewState();
  return (
    <div data-testid="window-info">
      {state.windowInfo.windowStart.toString()}|
      {state.windowInfo.windowEnd.toString()}|{state.windowInfo.weekCount}
    </div>
  );
}

describe("WeeksView", () => {
  it("renders 8 weeks starting from firstWeek", () => {
    render(
      <WeeksView
        T={T}
        weekCount={8}
        defaultFirstWeek={T.PlainDate.from("2026-03-01")}
      >
        <WindowInfoDisplay />
      </WeeksView>,
    );
    const info = screen.getByTestId("window-info").textContent;
    expect(info).toContain("2026-03-01");
    expect(info).toContain("2026-04-25");
    expect(info).toContain("|8");
  });

  it("accepts { month, year } as firstWeek", () => {
    render(
      <WeeksView
        T={T}
        weekCount={4}
        defaultFirstWeek={{ month: 3, year: 2026 }}
      >
        <WindowInfoDisplay />
      </WeeksView>,
    );
    const info = screen.getByTestId("window-info").textContent;
    expect(info).toContain("2026-03-01");
  });

  it("fires onWindowChange on mount", () => {
    const onWindowChange = vi.fn();
    render(
      <WeeksView
        T={T}
        weekCount={4}
        defaultFirstWeek={T.PlainDate.from("2026-03-01")}
        onWindowChange={onWindowChange}
      >
        <div />
      </WeeksView>,
    );
    expect(onWindowChange).toHaveBeenCalledTimes(1);
    expect(onWindowChange.mock.calls[0][0].weekCount).toBe(4);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/weeks-view.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement WeeksView.Root**

```tsx
// src/weeks-view.tsx
// WeeksView.Root:
// - Must be inside CalendarProvider
// - Uses useWeeksViewRootState for state management
// - Provides WeeksViewStableContext + WeeksViewStateContext
// - Provides ViewContext (shared interface for focusedDate, etc.)
// - Renders children via useRender

// WeeksView convenience wrapper:
// - Composes CalendarProvider + WeeksView.Root
// - Merges calendar props + weeks props

// Important: WeeksView.Root must expose scrollToWeek via useImperativeHandle:
// - Forward ref on WeeksView.Root
// - useImperativeHandle(ref, () => ({ scrollToWeek }), [scrollToWeek])
// - Also add scrollToWeek to useWeeksViewStable() context so it's accessible via hook
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/weeks-view.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/weeks-view.tsx src/weeks-view.test.tsx
git commit -m "feat: add WeeksView.Root and WeeksView convenience wrapper"
```

---

### Task 14: Implement WeeksGrid (internal Grid delegate)

Make Grid detect the view type and delegate to the appropriate internal renderer.

**Files:**

- Create: `src/weeks-grid.ts`
- Modify: `src/grid.tsx` — add view type detection and delegation

- [ ] **Step 1: Implement WeeksGrid internal component**

WeeksGrid renders a `<table>` with continuous week rows from the weeks window. It reads week data from `useWeeksViewState()` and renders `WeekTemplate` rows with `MonthSeparator` insertion points.

The key difference from MonthGrid: no per-month `<tbody>` grouping. Instead, a single continuous stream of `<tr>` week rows with `MonthSeparator` `<tr>` elements inserted at month boundaries.

- [ ] **Step 2: Update Grid to detect view context and delegate**

```tsx
// In grid.tsx:
// Try to read MonthView context — if present, render MonthGrid (current behavior)
// Try to read WeeksView context — if present, render WeeksGrid
// If neither, throw
```

- [ ] **Step 3: Run all tests**

Run: `npx vitest run`
Expected: PASS — existing month view tests still pass, weeks view renders

- [ ] **Step 4: Commit**

```bash
git add src/weeks-grid.ts src/grid.tsx
git commit -m "feat: add WeeksGrid internal renderer, Grid delegates by view type"
```

---

### Task 15: Implement MonthSeparator

**Files:**

- Create: `src/month-separator.tsx`
- Test: `src/month-separator.test.tsx`

- [ ] **Step 1: Write failing tests**

Test that MonthSeparator renders at month boundaries with correct state/data attributes: month, year, firstOfYear, firstVisible, weeksVisibleBefore, weeksVisibleAfter.

- [ ] **Step 2: Implement MonthSeparator**

MonthSeparator and child components (.Month, .Year, .WeekCount):

- Renders as `<tr><td colspan="7">...</td></tr>` inside the grid table
- Receives month boundary data via context from WeeksGrid
- Uses `useRender` pattern with state attributes mapping
- Child components read from MonthSeparator's context

```tsx
// src/month-separator.tsx
// MonthSeparator — compound component with .Month, .Year, .WeekCount
// Follows the useRender pattern from Base UI
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `npx vitest run src/month-separator.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/month-separator.tsx src/month-separator.test.tsx
git commit -m "feat: add MonthSeparator compound component"
```

---

### Task 16: Implement PrevWeeksButton, NextWeeksButton, WeeksView.WeekCount

**Files:**

- Create: `src/weeks-navigation.tsx`

- [ ] **Step 1: Implement PrevWeeksButton and NextWeeksButton**

Follow the same pattern as PrevMonthButton/NextMonthButton but read from WeeksView context. Accept optional `shiftBy` prop (defaults to weekCount). Compute disabled state via `canShift` from overflow.ts.

- [ ] **Step 2: Implement WeeksView.WeekCount**

Simple component that reads `windowInfo.weekCount` from `useWeeksViewState()` and renders it. Uses `useRender` pattern.

- [ ] **Step 3: Run type check + existing tests**

Run: `npx vitest run && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/weeks-navigation.tsx
git commit -m "feat: add PrevWeeksButton, NextWeeksButton, WeeksView.WeekCount"
```

---

### Task 17: Integrate weeks keyboard navigation into Grid

**Files:**

- Modify: `src/grid.tsx` — keyboard handler dispatches to weeks-keyboard when in WeeksView

- [ ] **Step 1: Update useGridKeyboard**

When in WeeksView context, use `computeWeeksKeyNav` instead of the existing `computeNextFocusDate`. Handle `windowShift` results by calling `goNext`/`goPrev` or adjusting `firstWeek`.

- [ ] **Step 2: Write integration test**

Test that arrow keys, PageUp/Down, Home/End, and scrollBy modes work correctly within a rendered WeeksView + Grid.

- [ ] **Step 3: Run all tests**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/grid.tsx
git commit -m "feat: integrate weeks keyboard navigation into Grid"
```

---

## Phase 4: Final Integration

### Task 18: Update factory and index exports

**Files:**

- Modify: `src/factory.tsx` — return both MonthView and WeeksView component sets
- Modify: `src/index.ts` — export all new components, types, hooks, utilities

- [ ] **Step 1: Update factory.tsx**

`createDatePicker` returns components for both views. The returned object includes `MonthView`, `WeeksView`, `CalendarProvider`, and all shared components.

- [ ] **Step 2: Update index.ts with all new exports**

```ts
// Components
export { CalendarProvider } from "./calendar-provider";
export { MonthView } from "./month-view";
export { WeeksView } from "./weeks-view";
export { PrevWeeksButton, NextWeeksButton } from "./weeks-navigation";
export { MonthSeparator } from "./month-separator";

// Hooks
export { useCalendarStable, useCalendarState } from "./calendar-context";
export { useMonthViewStable, useMonthViewState } from "./month-view-context";
export { useWeeksViewStable, useWeeksViewState } from "./weeks-view-context";

// Utilities
export { computeWeeksInWindow } from "./compute-weeks-in-window";
export { resolveFirstWeek, resolveFirstWeekSpec } from "./resolve-first-week";

// Types
export type { FirstWeekSpec, ScrollToWeekSnap } from "./resolve-first-week";
export type { WindowInfo } from "./weeks-view-types";
export type { OverflowBehavior, MonthOverflowBehavior } from "./overflow";
export type { WeekDescriptor } from "./compute-weeks-in-window";
```

- [ ] **Step 3: Run full test suite + type check + lint**

Run: `npx vitest run && npx tsc --noEmit && npx biome check .`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/factory.tsx src/index.ts
git commit -m "feat: update factory and exports for weeks view"
```

---

### Task 19: Build verification and dev example

**Files:**

- Modify: `dev/examples/` — add a weeks view example

- [ ] **Step 1: Run the build**

Run: `npm run build`
Expected: PASS — library builds with all new exports

- [ ] **Step 2: Add a dev example**

Create a basic weeks view example in `dev/examples/` that demonstrates:

- WeeksView with weekCount=8
- MonthSeparator with .Month and .Year
- PrevWeeksButton / NextWeeksButton
- Selection working

- [ ] **Step 3: Run dev server and verify visually**

Run: `npm run dev`
Verify: Weeks view renders correctly, navigation works, selection works, month separators appear at boundaries.

- [ ] **Step 4: Commit**

```bash
git add dev/examples/
git commit -m "feat: add weeks view dev example"
```

---

### Task 20: Final test pass and cleanup

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: ALL PASS

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Run linter**

Run: `npx biome check .`
Expected: PASS (fix any issues)

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit any cleanup**

```bash
# Stage only the specific files that were changed during cleanup
git add <changed-files>
git commit -m "chore: final cleanup for weeks view feature"
```
