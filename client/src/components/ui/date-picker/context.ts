import { createContext, useContext } from "react";
import type { Temporal } from "@js-temporal/polyfill";
import type { DatePickerContextValue } from "./types";

export const DatePickerContext =
  createContext<DatePickerContextValue | null>(null);

export function useDatePicker() {
  const ctx = useContext(DatePickerContext);
  if (!ctx)
    throw new Error(
      "DatePicker compound components must be used within DatePicker.Root",
    );
  return ctx;
}

export const WeekDataContext = createContext<{
  days: Temporal.PlainDate[];
  weekIndex: number;
} | null>(null);
