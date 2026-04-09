import type { Temporal } from "@js-temporal/polyfill";
import React, { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { CalendarProvider } from "./calendar-provider";
import type { CalendarProviderProps } from "./calendar-types";
import { MonthViewStableContext, MonthViewStateContext } from "./month-view-context";
import type { FirstWeekSpec, ScrollToWeekSnap } from "./resolve-first-week";
import type { RootState, ValueFormat } from "./types";
import { ViewContext } from "./view-context";
import { WeeksViewStableContext, WeeksViewStateContext } from "./weeks-view-context";
import { useWeeksViewRootState } from "./weeks-view-state";
import type { WeeksViewRootProps } from "./weeks-view-types";

// ---------------------------------------------------------------------------
// WeeksView.Root — placed inside CalendarProvider
// ---------------------------------------------------------------------------

/** Imperative handle exposed by WeeksView.Root via ref. */
export interface WeeksViewRootHandle {
  scrollToWeek: (target: FirstWeekSpec, options?: { snap?: ScrollToWeekSnap }) => void;
}

function WeeksViewRootFn(props: WeeksViewRootProps, ref: React.ForwardedRef<WeeksViewRootHandle>) {
  const { children } = props;
  const { stableCtx, stateCtx, viewCtx, scrollToWeek } = useWeeksViewRootState(props);

  useImperativeHandle(ref, () => ({ scrollToWeek }), [scrollToWeek]);

  const gridFocusedRef = useRef(false);

  // Provide MonthViewStableContext/MonthViewStateContext shims so shared
  // components (WeeksNavButton, WeekCount, etc.) that read rootState via
  // useMonthViewState() can function outside the Grid in WeeksView.
  const monthViewStableShim = useMemo(
    () => ({
      numberOfMonths: 1,
      fixedWeeks: false,
      outsideDays: "enabled" as const,
      overflowBehavior: "unbounded" as const,
      goNextMonth: () => {},
      goPrevMonth: () => {},
      setGridLabelId: () => {},
      gridFocusedRef,
    }),
    [],
  );

  const monthViewStateShim = useMemo(
    () => ({
      currentMonth: {
        year: stateCtx.currentDateTime.year,
        month: stateCtx.currentDateTime.month,
      },
      weeks: [] as Temporal.PlainDate[][],
      allMonths: [],
      currentDateTime: stateCtx.currentDateTime,
      gridLabelIds: stateCtx.gridLabelIds,
      rootState: {} as RootState,
    }),
    [stateCtx.currentDateTime, stateCtx.gridLabelIds],
  );

  return (
    <MonthViewStableContext.Provider value={monthViewStableShim}>
      <MonthViewStateContext.Provider value={monthViewStateShim}>
        <WeeksViewStableContext.Provider value={stableCtx}>
          <WeeksViewStateContext.Provider value={stateCtx}>
            <ViewContext.Provider value={viewCtx}>{children}</ViewContext.Provider>
          </WeeksViewStateContext.Provider>
        </WeeksViewStableContext.Provider>
      </MonthViewStateContext.Provider>
    </MonthViewStableContext.Provider>
  );
}

const WeeksViewRoot = forwardRef(WeeksViewRootFn);

// ---------------------------------------------------------------------------
// WeeksView convenience wrapper — composes CalendarProvider + WeeksView.Root
// ---------------------------------------------------------------------------

type WeeksViewProps<F extends ValueFormat = "PlainDate"> = CalendarProviderProps<F> &
  WeeksViewRootProps;

function WeeksViewFn(props: WeeksViewProps, ref: React.ForwardedRef<WeeksViewRootHandle>) {
  const {
    weekCount,
    firstWeek,
    defaultFirstWeek,
    onFirstWeekChange,
    scrollBy,
    overflowBehavior,
    onWindowChange,
    children,
    ...calendarProps
  } = props as WeeksViewProps & { children?: React.ReactNode };

  return (
    <CalendarProvider {...(calendarProps as CalendarProviderProps)}>
      <WeeksViewRoot
        ref={ref}
        weekCount={weekCount}
        firstWeek={firstWeek}
        defaultFirstWeek={defaultFirstWeek}
        onFirstWeekChange={onFirstWeekChange}
        scrollBy={scrollBy}
        overflowBehavior={overflowBehavior}
        onWindowChange={onWindowChange}
      >
        {children}
      </WeeksViewRoot>
    </CalendarProvider>
  );
}

const WeeksView = forwardRef(WeeksViewFn) as WeeksViewComponent;

// Attach Root as a static property
interface WeeksViewComponent extends React.ForwardRefExoticComponent<
  WeeksViewProps & React.RefAttributes<WeeksViewRootHandle>
> {
  Root: typeof WeeksViewRoot;
}

(WeeksView as WeeksViewComponent).Root = WeeksViewRoot;

export { WeeksView, WeeksViewRoot };
export type { WeeksViewProps };
