import React, { forwardRef, useImperativeHandle } from "react";
import { CalendarProvider } from "./calendar-provider";
import type { CalendarProviderProps } from "./calendar-types";
import type { FirstWeekSpec, ScrollToWeekSnap } from "./resolve-first-week";
import type { ValueFormat } from "./types";
import {
  ViewContext,
  ViewStableContext,
  ViewStateContext,
} from "./view-context";
import {
  WeeksViewStableContext,
  WeeksViewStateContext,
} from "./weeks-view-context";
import { useWeeksViewRootState } from "./weeks-view-state";
import type { WeeksViewRootProps } from "./weeks-view-types";

// ---------------------------------------------------------------------------
// WeeksView.Root — placed inside CalendarProvider
// ---------------------------------------------------------------------------

/** Imperative handle exposed by WeeksView.Root via ref. */
export interface WeeksViewRootHandle {
  scrollToWeek: (
    target: FirstWeekSpec,
    options?: { snap?: ScrollToWeekSnap },
  ) => void;
}

function WeeksViewRootFn(
  props: WeeksViewRootProps,
  ref: React.ForwardedRef<WeeksViewRootHandle>,
) {
  const { children } = props;
  const {
    stableCtx,
    stateCtx,
    viewCtx,
    viewStableCtx,
    viewStateCtx,
    scrollToWeek,
  } = useWeeksViewRootState(props);

  useImperativeHandle(ref, () => ({ scrollToWeek }), [scrollToWeek]);

  return (
    <WeeksViewStableContext.Provider value={stableCtx}>
      <WeeksViewStateContext.Provider value={stateCtx}>
        <ViewStableContext.Provider value={viewStableCtx}>
          <ViewStateContext.Provider value={viewStateCtx}>
            <ViewContext.Provider value={viewCtx}>
              {children}
            </ViewContext.Provider>
          </ViewStateContext.Provider>
        </ViewStableContext.Provider>
      </WeeksViewStateContext.Provider>
    </WeeksViewStableContext.Provider>
  );
}

const WeeksViewRoot = forwardRef(WeeksViewRootFn);

// ---------------------------------------------------------------------------
// WeeksView convenience wrapper — composes CalendarProvider + WeeksView.Root
// ---------------------------------------------------------------------------

type WeeksViewProps<F extends ValueFormat = "PlainDate"> =
  CalendarProviderProps<F> & WeeksViewRootProps;

function WeeksViewFn(
  props: WeeksViewProps,
  ref: React.ForwardedRef<WeeksViewRootHandle>,
) {
  const {
    weekCount,
    firstWeek,
    defaultFirstWeek,
    onFirstWeekChange,
    scrollBy,
    outOfRangeBehavior,
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
        outOfRangeBehavior={outOfRangeBehavior}
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
