import React, { forwardRef, useImperativeHandle } from "react";
import type { CalendarProviderProps } from "./calendar-types";
import type { WeeksViewRootProps } from "./weeks-view-types";
import type { FirstWeekSpec, ScrollToWeekSnap } from "./resolve-first-week";
import type { ValueFormat } from "./types";
import { CalendarProvider } from "./calendar-provider";
import {
  WeeksViewStableContext,
  WeeksViewStateContext,
} from "./weeks-view-context";
import { ViewContext } from "./view-context";
import { useWeeksViewRootState } from "./weeks-view-state";

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

const WeeksViewRoot = forwardRef<WeeksViewRootHandle, WeeksViewRootProps>(
  function WeeksViewRoot(props, ref) {
    const { children } = props;
    const { stableCtx, stateCtx, viewCtx, scrollToWeek } =
      useWeeksViewRootState(props);

    useImperativeHandle(ref, () => ({ scrollToWeek }), [scrollToWeek]);

    return (
      <WeeksViewStableContext.Provider value={stableCtx}>
        <WeeksViewStateContext.Provider value={stateCtx}>
          <ViewContext.Provider value={viewCtx}>
            {children}
          </ViewContext.Provider>
        </WeeksViewStateContext.Provider>
      </WeeksViewStableContext.Provider>
    );
  },
);

// ---------------------------------------------------------------------------
// WeeksView convenience wrapper — composes CalendarProvider + WeeksView.Root
// ---------------------------------------------------------------------------

type WeeksViewProps<F extends ValueFormat = "PlainDate"> =
  CalendarProviderProps<F> & WeeksViewRootProps;

const WeeksView = forwardRef<WeeksViewRootHandle, WeeksViewProps>(
  function WeeksView(props, ref) {
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
  },
) as WeeksViewComponent;

// Attach Root as a static property
interface WeeksViewComponent
  extends React.ForwardRefExoticComponent<
    WeeksViewProps & React.RefAttributes<WeeksViewRootHandle>
  > {
  Root: typeof WeeksViewRoot;
}

(WeeksView as WeeksViewComponent).Root = WeeksViewRoot;

export { WeeksView, WeeksViewRoot };
export type { WeeksViewProps };
