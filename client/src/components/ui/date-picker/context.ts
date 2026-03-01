import { createContext, useContext } from "react";
import type { Temporal } from "@js-temporal/polyfill";
import type { DatePickerContextValue, ValueFormat, RootState } from "./types";

export const DatePickerContext =
  createContext<DatePickerContextValue | null>(null);

export function useDatePicker<F extends ValueFormat = ValueFormat>() {
  const ctx = useContext(DatePickerContext);
  if (!ctx)
    throw new Error(
      "DatePicker compound components must be used within DatePicker.Root",
    );
  return ctx as unknown as Omit<DatePickerContextValue, "rootState"> & { rootState: RootState<F> };
}

export const WeekDataContext = createContext<{
  days: Temporal.PlainDate[];
  weekIndex: number;
} | null>(null);

export const DayCellDataContext = createContext<{
  date: Temporal.PlainDate;
} | null>(null);
