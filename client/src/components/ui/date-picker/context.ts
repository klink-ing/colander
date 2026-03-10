import { createContext, useContext } from "react";
import type { Temporal } from "@js-temporal/polyfill";
import type { DatePickerContextValue, ValueFormat, RootState } from "./types";

/** @internal React context carrying all DatePicker state. */
export const DatePickerContext = createContext<DatePickerContextValue | null>(
  null,
);

/**
 * Returns the nearest `DatePicker.Root` context.
 *
 * @throws If called outside a `DatePicker.Root` tree.
 */
export function useDatePicker<F extends ValueFormat = ValueFormat>() {
  const ctx = useContext(DatePickerContext);
  if (!ctx)
    throw new Error(
      "DatePicker compound components must be used within DatePicker.Root",
    );
  return ctx as unknown as Omit<DatePickerContextValue, "rootState"> & {
    rootState: RootState<F>;
  };
}

/** @internal Provides the days and index of the current week row to child components. */
export const WeekDataContext = createContext<{
  days: Temporal.PlainDate[];
  weekIndex: number;
} | null>(null);

/** Layout direction for the calendar grid. */
export type GridOrientation = "horizontal" | "vertical";

/** @internal Provides the resolved grid orientation to descendant cells. */
export const GridContext = createContext<{ orientation: GridOrientation }>({
  orientation: "vertical",
});

/** @internal Provides the date and column index from a `DayCellTemplate` to its child `DayButton`. */
export const DayCellDataContext = createContext<{
  date: Temporal.PlainDate;
  columnIndex?: number;
} | null>(null);
