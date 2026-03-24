import { createContext } from "react";
import type { Temporal } from "@js-temporal/polyfill";

/** @internal Provides the days and index of the current week row to child components. */
export const WeekDataContext = createContext<{
  days: Temporal.PlainDate[];
  weekIndex: number;
  /** The year/month this week belongs to (for outsideMonth checks in multi-month). */
  gridMonth?: { year: number; month: number };
  /** 1-based CSS grid row index for this week row (WeeksView only). */
  gridRow?: number;
} | null>(null);

/** Layout direction for the calendar grid. */
export type GridOrientation = "horizontal" | "vertical";

/** @internal Provides the resolved grid orientation to descendant cells. */
export const GridContext = createContext<{ orientation: GridOrientation }>({
  orientation: "horizontal",
});

/** @internal Provides the date and column index from a `DayCellTemplate` to its child `DayButton`. */
export const DayCellDataContext = createContext<{
  date: Temporal.PlainDate;
  columnIndex?: number;
  outsideDisabled?: boolean;
} | null>(null);

/** @internal Provides per-grid month data to WeekTemplate and DayCellTemplate. */
export const GridMonthContext = createContext<{
  weeks: Temporal.PlainDate[][];
  year: number;
  month: number;
} | null>(null);
