import type { Temporal } from "@js-temporal/polyfill";
import type { MonthOverflowBehavior } from "./overflow";
import type { MonthData, OutsideDays, RootState } from "./types";

// ---------------------------------------------------------------------------
// MonthView.Root props
// ---------------------------------------------------------------------------

/** Props accepted by `MonthView.Root`. */
export interface MonthViewRootProps {
  /**
   * Number of months to display simultaneously (1–12).
   * @default 1
   */
  numberOfMonths?: number | undefined;
  /**
   * When `true`, always render 6 week rows per month grid.
   * Prevents layout shifts when navigating between months.
   * @default false
   */
  fixedWeeks?: boolean | undefined;
  /**
   * Controls how days from adjacent months are displayed.
   * @default "enabled"
   */
  outsideDays?: OutsideDays | undefined;
  /**
   * How month navigation behaves at `min`/`max` bounds.
   * - `"unbounded"` — navigation is always allowed.
   * - `"stop"` — navigation buttons disable at the boundary.
   * @default "unbounded"
   */
  overflowBehavior?: MonthOverflowBehavior | undefined;
  /**
   * The controlled visible month. When provided, the component is controlled.
   *
   * Interpreted in the ISO calendar (the year/month are read as ISO values).
   * The `locale` only affects how the month is displayed, so this value
   * round-trips directly with {@link onMonthChange}.
   */
  month?: Temporal.PlainYearMonth | undefined;
  /**
   * The initial visible month (uncontrolled). Interpreted in the ISO calendar.
   */
  defaultMonth?: Temporal.PlainYearMonth | undefined;
  /**
   * Called when the visible month changes via navigation or focus movement.
   * Not called on initial mount. The argument is an ISO `PlainYearMonth`.
   */
  onMonthChange?: ((month: Temporal.PlainYearMonth) => void) | undefined;
  /** React children. */
  children?: React.ReactNode | undefined;
}

// ---------------------------------------------------------------------------
// MonthView context values
// ---------------------------------------------------------------------------

/** Stable values (config + callbacks) provided by MonthView.Root. */
export interface MonthViewStableContextValue {
  /** Number of simultaneously visible months. */
  numberOfMonths: number;
  /** Whether month grids always render 6 week rows. */
  fixedWeeks: boolean;
  /** How outside-month days are displayed. */
  outsideDays: OutsideDays;
  /** How month navigation behaves at bounds. */
  overflowBehavior: MonthOverflowBehavior;
  /** Navigate to the next month(s). */
  goNextMonth: () => void;
  /** Navigate to the previous month(s). */
  goPrevMonth: () => void;
  /** Register (or clear) the id of a label element for `aria-labelledby`, keyed by month index. */
  setGridLabelId: (monthIndex: number, id: string | undefined) => void;
  /** Ref tracking whether the grid currently holds DOM focus (avoids state re-renders). */
  gridFocusedRef: React.RefObject<boolean>;
}

/** Volatile state provided by MonthView.Root. */
export interface MonthViewStateContextValue {
  /** The primary displayed month (year + month). */
  currentMonth: { year: number; month: number };
  /** 2D array of weeks for the first visible month grid. */
  weeks: Temporal.PlainDate[][];
  /** Pre-computed data for all visible months (length = `numberOfMonths`). */
  allMonths: MonthData[];
  /** Date-time representing the viewed month with time from the selection (for "today" highlighting). */
  currentDateTime: Temporal.PlainDateTime;
  /** Map of month index to label element id (for per-grid `aria-labelledby`). */
  gridLabelIds: Record<number, string>;
  /** The root component's state object for render functions. */
  rootState: RootState;
}
