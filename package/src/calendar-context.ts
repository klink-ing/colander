import { createContext, useContext } from "react";
import type { CalendarStableContextValue, CalendarStateContextValue } from "./calendar-types";

/** @internal React context carrying stable CalendarProvider values (callbacks, config). */
export const CalendarStableContext = createContext<CalendarStableContextValue | null>(null);

/** @internal React context carrying volatile CalendarProvider state. */
export const CalendarStateContext = createContext<CalendarStateContextValue | null>(null);

/** Returns the stable (callbacks/config) part of CalendarProvider context. */
export function useCalendarStable(): CalendarStableContextValue {
  const ctx = useContext(CalendarStableContext);
  if (!ctx) throw new Error("useCalendarStable must be used within CalendarProvider");
  return ctx;
}

/** Returns the volatile state part of CalendarProvider context. */
export function useCalendarState(): CalendarStateContextValue {
  const ctx = useContext(CalendarStateContext);
  if (!ctx) throw new Error("useCalendarState must be used within CalendarProvider");
  return ctx;
}
