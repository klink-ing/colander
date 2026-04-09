import { createContext, useContext } from "react";
import type {
  MonthViewStableContextValue,
  MonthViewStateContextValue,
} from "./month-view-types";

/** @internal React context for MonthView stable values (config + callbacks). */
export const MonthViewStableContext =
  createContext<MonthViewStableContextValue | null>(null);

/** @internal React context for MonthView volatile state. */
export const MonthViewStateContext =
  createContext<MonthViewStateContextValue | null>(null);

/** Returns the MonthView stable context (config + callbacks). */
export function useMonthViewStable(): MonthViewStableContextValue {
  const ctx = useContext(MonthViewStableContext);
  if (!ctx) {
    throw new Error("useMonthViewStable must be used within MonthView.Root");
  }
  return ctx;
}

/** Returns the MonthView state context (volatile grid data). */
export function useMonthViewState(): MonthViewStateContextValue {
  const ctx = useContext(MonthViewStateContext);
  if (!ctx) {
    throw new Error("useMonthViewState must be used within MonthView.Root");
  }
  return ctx;
}
