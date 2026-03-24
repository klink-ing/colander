import { createContext, useContext } from "react";
import type { Temporal } from "@js-temporal/polyfill";

/** Shared context provided by both MonthView.Root and WeeksView.Root. */
export interface ViewContextValue {
  /** Which view type is active. */
  viewType: "month" | "weeks";
  /** The logically focused date in the grid. */
  focusedDate: Temporal.PlainDate;
  /** Moves the logically focused date. */
  setFocusedDate: (date: Temporal.PlainDate) => void;
  /** The date that should receive `tabIndex={0}` for roving tabindex. */
  tabTargetDate: Temporal.PlainDate;
  /** Whether the grid currently holds DOM focus. */
  gridHasFocus: boolean;
  /** Tracks whether the grid currently holds DOM focus. */
  setGridHasFocus: (v: boolean) => void;
}

/** @internal React context for the active view (MonthView or WeeksView). */
export const ViewContext = createContext<ViewContextValue | null>(null);

/** Returns the nearest view context (MonthView or WeeksView). */
export function useViewContext(): ViewContextValue {
  const ctx = useContext(ViewContext);
  if (!ctx)
    throw new Error(
      "useViewContext must be used within MonthView or WeeksView",
    );
  return ctx;
}
