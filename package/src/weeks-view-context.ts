import { createContext, useContext } from "react";
import type { WeeksViewStableContextValue, WeeksViewStateContextValue } from "./weeks-view-types";

/** @internal React context for WeeksView stable values (config + callbacks). */
export const WeeksViewStableContext = createContext<WeeksViewStableContextValue | null>(null);

/** @internal React context for WeeksView volatile state. */
export const WeeksViewStateContext = createContext<WeeksViewStateContextValue | null>(null);

/** Returns the WeeksView stable context (config + callbacks). */
export function useWeeksViewStable(): WeeksViewStableContextValue {
  const ctx = useContext(WeeksViewStableContext);
  if (!ctx) {
    throw new Error("useWeeksViewStable must be used within WeeksView.Root");
  }
  return ctx;
}

/** Returns the WeeksView state context (volatile grid data). */
export function useWeeksViewState(): WeeksViewStateContextValue {
  const ctx = useContext(WeeksViewStateContext);
  if (!ctx) {
    throw new Error("useWeeksViewState must be used within WeeksView.Root");
  }
  return ctx;
}
