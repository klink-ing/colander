import { createContext, useContext } from "react";
import type { Temporal } from "@js-temporal/polyfill";
import type {
  DatePickerStableContextValue,
  DatePickerStateContextValue,
  DatePickerContextValue,
  ValueFormat,
  RootState,
} from "./types";

/** @internal React context carrying stable DatePicker values (callbacks, config, refs). */
export const DatePickerStableContext =
  createContext<DatePickerStableContextValue | null>(null);

/** @internal React context carrying volatile DatePicker state. */
export const DatePickerStateContext =
  createContext<DatePickerStateContextValue | null>(null);

const ERROR_MSG =
  "DatePicker compound components must be used within DatePicker.Root";

/** Returns only the stable (callbacks/config) part of DatePicker context. */
export function useDatePickerStable() {
  const ctx = useContext(DatePickerStableContext);
  if (!ctx) throw new Error(ERROR_MSG);
  return ctx;
}

/** Returns only the volatile state part of DatePicker context. */
export function useDatePickerState() {
  const ctx = useContext(DatePickerStateContext);
  if (!ctx) throw new Error(ERROR_MSG);
  return ctx;
}

/**
 * Returns the nearest `DatePicker.Root` context (combined stable + state).
 *
 * @throws If called outside a `DatePicker.Root` tree.
 */
export function useDatePicker<F extends ValueFormat = ValueFormat>() {
  const stable = useDatePickerStable();
  const state = useDatePickerState();
  const combined = { ...stable, ...state } as unknown as Omit<
    DatePickerContextValue,
    "rootState"
  > & {
    rootState: RootState<F>;
  };
  return combined;
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
