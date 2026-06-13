import type { Temporal } from "@js-temporal/polyfill";
import type { WeekDescriptor } from "./compute-weeks-in-window";
import type { OverflowBehavior } from "./overflow";
import type { FirstWeekSpec, ScrollToWeekSnap } from "./resolve-first-week";

// ---------------------------------------------------------------------------
// WeeksView.Root props
// ---------------------------------------------------------------------------

/** Props accepted by `WeeksView.Root`. */
export interface WeeksViewRootProps {
  /** Number of week rows to display simultaneously. */
  weekCount: number;
  /** The controlled first visible week. When provided, the component is controlled. */
  firstWeek?: FirstWeekSpec | undefined;
  /** The initial first visible week (uncontrolled). */
  defaultFirstWeek?: FirstWeekSpec | undefined;
  /** Called when the first visible week changes via navigation or focus movement. */
  onFirstWeekChange?: ((date: Temporal.PlainDate) => void) | undefined;
  /**
   * How much to scroll per navigation step.
   * - `"row"` — scroll one week row at a time.
   * - `"page"` — scroll a full page (all visible rows) at a time.
   * @default "row"
   */
  scrollBy?: "row" | "page" | undefined;
  /**
   * How navigation behaves at `min`/`max` bounds.
   * @default "unbounded"
   */
  overflowBehavior?: OverflowBehavior | undefined;
  /** Called when the visible window changes. */
  onWindowChange?: ((info: WindowInfo) => void) | undefined;
  /** React children. */
  children?: React.ReactNode | undefined;
}

// ---------------------------------------------------------------------------
// WindowInfo
// ---------------------------------------------------------------------------

/** A month/year pair visible in the weeks window. */
export interface VisibleMonth {
  month: number;
  year: number;
}

/** Describes the currently visible window of weeks. */
export interface WindowInfo {
  /** The first date of the visible window. */
  windowStart: Temporal.PlainDate;
  /** The last date of the visible window. */
  windowEnd: Temporal.PlainDate;
  /** Number of week rows in the window (the prop value, not actual when shrunk). */
  weekCount: number;
  /** Total number of calendar days in the window. */
  dayCount: number;
  /** Number of weeks that contain at least one enabled date. */
  enabledWeekCount: number;
  /** Number of enabled (selectable) dates in the window. */
  enabledDayCount: number;
  /** Distinct months visible in the window, in chronological order. */
  visibleMonths: VisibleMonth[];
}

// ---------------------------------------------------------------------------
// WeeksView context values
// ---------------------------------------------------------------------------

/** Stable values (config + callbacks) provided by `WeeksView.Root`. */
export interface WeeksViewStableContextValue {
  /** Number of week rows to display (the prop value). */
  weekCount: number;
  /** How much to scroll per navigation step. */
  scrollBy: "row" | "page";
  /** How navigation behaves at bounds. */
  overflowBehavior: OverflowBehavior;
  /** Navigate to the next week(s). Optionally override the shift amount (in weeks). */
  goNext: (shiftBy?: number) => void;
  /** Navigate to the previous week(s). Optionally override the shift amount (in weeks). */
  goPrev: (shiftBy?: number) => void;
  /** Imperatively scroll so that the target week is visible at the given snap position. */
  scrollToWeek: (
    target: FirstWeekSpec,
    options?: { snap?: ScrollToWeekSnap },
  ) => void;
  /** Ref tracking whether the grid currently holds DOM focus (avoids state re-renders). */
  gridFocusedRef: React.MutableRefObject<boolean>;
  /** Register (or clear) the id of a label element for `aria-labelledby`. */
  setGridLabelId: (id: string | undefined) => void;
}

/** Volatile state provided by `WeeksView.Root`. */
export interface WeeksViewStateContextValue {
  /** The logically focused date in the grid. */
  focusedDate: Temporal.PlainDate;
  /** Information about the currently visible window. */
  windowInfo: WindowInfo;
  /** Label element id for `aria-labelledby` on the grid. */
  gridLabelIds: Record<number, string>;
  /** Computed week descriptors for all visible rows. */
  weeks: WeekDescriptor[];
  /** Date-time representing the current moment (for "today" highlighting). */
  currentDateTime: Temporal.PlainDateTime;
}
