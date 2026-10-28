import type { Temporal } from "@js-temporal/polyfill";
import { useCallback, useMemo, useRef, useState } from "react";
import { useCalendarStable, useCalendarState } from "./calendar-context";
import { CalendarProvider } from "./calendar-provider";
import type { CalendarProviderProps } from "./calendar-types";
import {
  MonthViewStableContext,
  MonthViewStateContext,
} from "./month-view-context";
import { useMonthNavigation } from "./month-view-navigation";
import type {
  MonthViewRootProps,
  MonthViewStableContextValue,
  MonthViewStateContextValue,
} from "./month-view-types";
import { createMonthWindowPolicy } from "./month-window";
import type { MonthData, RootState, ValueFormat } from "./types";
import {
  getMonthWeeks,
  resolveFocusTarget,
  resolveInitialAnchor,
  selectedToZdt,
} from "./utils";
import {
  ViewContext,
  ViewStableContext,
  ViewStateContext,
  type ViewContextValue,
  type ViewStableContextValue,
  type ViewStateContextValue,
} from "./view-context";

// ---------------------------------------------------------------------------
// MonthView.Root — placed inside CalendarProvider
// ---------------------------------------------------------------------------

function MonthViewRoot(props: MonthViewRootProps) {
  const {
    numberOfMonths: numberOfMonthsProp,
    fixedWeeks: fixedWeeksProp,
    outsideDays: outsideDaysProp,
    outOfRangeBehavior: outOfRangeBehaviorProp,
    month: monthProp,
    defaultMonth: defaultMonthProp,
    onMonthChange,
    children,
  } = props;

  const numberOfMonths = Math.max(1, Math.min(numberOfMonthsProp ?? 1, 12));
  const fixedWeeks = fixedWeeksProp ?? false;
  const outsideDays = outsideDaysProp ?? "enabled";
  const outOfRangeBehavior = outOfRangeBehaviorProp ?? "unbounded";

  // Read calendar-level context
  const calStable = useCalendarStable();
  const calState = useCalendarState();

  const T = calStable.temporal;
  const { timeZone, today, weekStartDay, isDateDisabled } = calStable;

  // --- Focus state ---
  const [focusedDate, setFocusedDate] = useState<Temporal.PlainDate>(() =>
    resolveInitialAnchor(calState.selected, today, timeZone, T),
  );

  const [gridHasFocus, setGridHasFocus] = useState(false);
  const gridFocusedRef = useRef(false);

  // --- Month window and navigation ---
  const { minValue, maxValue } = calStable;
  const windowPolicy = useMemo(
    () =>
      createMonthWindowPolicy({
        numberOfMonths,
        behavior: outOfRangeBehavior,
        min: minValue,
        max: maxValue,
        T,
      }),
    [numberOfMonths, outOfRangeBehavior, minValue, maxValue, T],
  );

  const initialAnchor = useCallback(
    () => resolveInitialAnchor(calState.selected, today, timeZone, T),
    [calState.selected, today, timeZone, T],
  );

  const { currentMonth, viewingYearMonth, goNextMonth, goPrevMonth } =
    useMonthNavigation({
      month: monthProp,
      defaultMonth: defaultMonthProp,
      initialAnchor,
      onMonthChange,
      policy: windowPolicy,
      focusedDate,
      setFocusedDate,
      T,
    });

  // --- Grid label IDs ---
  const [gridLabelIds, setGridLabelIds] = useState<Record<number, string>>({});
  const setGridLabelId = useCallback(
    (monthIndex: number, id: string | undefined) => {
      setGridLabelIds((prev) => {
        if (id === undefined) {
          if (!(monthIndex in prev)) return prev;
          const next = { ...prev };
          delete next[monthIndex];
          return next;
        }
        if (prev[monthIndex] === id) return prev;
        return { ...prev, [monthIndex]: id };
      });
    },
    [],
  );

  // --- Grid computation ---
  const allMonths = useMemo<MonthData[]>(() => {
    const opts = { weekStartDay, fixedWeeks };
    const result: MonthData[] = [];
    for (let i = 0; i < numberOfMonths; i++) {
      const totalMonths = currentMonth.year * 12 + (currentMonth.month - 1) + i;
      const y = Math.floor(totalMonths / 12);
      const m = (totalMonths % 12) + 1;
      result.push({ year: y, month: m, weeks: getMonthWeeks(y, m, T, opts) });
    }
    return result;
  }, [
    currentMonth.year,
    currentMonth.month,
    T,
    weekStartDay,
    fixedWeeks,
    numberOfMonths,
  ]);

  // numberOfMonths >= 1, so allMonths always has at least one entry
  const firstMonth = allMonths[0];
  if (firstMonth === undefined) {
    throw new Error("MonthView: numberOfMonths must be at least 1.");
  }
  const weeks = firstMonth.weeks;

  // --- currentDateTime ---
  const selectedZdt = useMemo(
    () => selectedToZdt(calState.selected, timeZone, T),
    [calState.selected, timeZone, T],
  );

  const currentDateTime = useMemo<Temporal.PlainDateTime>(
    () =>
      T.PlainDateTime.from(
        {
          year: currentMonth.year,
          month: currentMonth.month,
          day: focusedDate.day,
          hour: selectedZdt?.hour ?? 0,
          minute: selectedZdt?.minute ?? 0,
          second: selectedZdt?.second ?? 0,
        },
        { overflow: "constrain" },
      ),
    [currentMonth, focusedDate.day, selectedZdt, T],
  );

  // --- tabTargetDate ---
  const selectedPlain = selectedZdt?.toPlainDate();

  const isDateDisabledFn = useCallback(
    (date: Temporal.PlainDate): boolean => {
      return isDateDisabled?.(date) ?? false;
    },
    [isDateDisabled],
  );

  const tabTargetDate = useMemo(
    () =>
      resolveFocusTarget(
        focusedDate,
        selectedPlain,
        weeks,
        currentMonth,
        isDateDisabledFn,
        T,
        gridHasFocus,
      ),
    [
      focusedDate,
      selectedPlain,
      weeks,
      currentMonth,
      isDateDisabledFn,
      T,
      gridHasFocus,
    ],
  );

  // --- rootState (for render functions) ---
  const rootState = useMemo<RootState>(
    () => ({
      ...calState.baseRootState,
      focused: focusedDate,
      viewing: viewingYearMonth,
    }),
    [calState.baseRootState, focusedDate, viewingYearMonth],
  );

  // --- Context values ---
  const stableCtx = useMemo<MonthViewStableContextValue>(
    () => ({
      numberOfMonths,
      fixedWeeks,
      outsideDays,
      outOfRangeBehavior,
      windowPolicy,
      goNextMonth,
      goPrevMonth,
      setGridLabelId,
      gridFocusedRef,
    }),
    [
      numberOfMonths,
      fixedWeeks,
      outsideDays,
      outOfRangeBehavior,
      windowPolicy,
      goNextMonth,
      goPrevMonth,
      setGridLabelId,
    ],
  );

  const stateCtx = useMemo<MonthViewStateContextValue>(
    () => ({
      currentMonth,
      weeks,
      allMonths,
      currentDateTime,
      gridLabelIds,
      rootState,
    }),
    [currentMonth, weeks, allMonths, currentDateTime, gridLabelIds, rootState],
  );

  const viewCtx = useMemo<ViewContextValue>(
    () => ({
      viewType: "month" as const,
      focusedDate,
      setFocusedDate,
      tabTargetDate,
      gridHasFocus,
      setGridHasFocus,
    }),
    [focusedDate, tabTargetDate, gridHasFocus],
  );

  const viewStableCtx = useMemo<ViewStableContextValue>(
    () => ({ gridFocusedRef, outsideDays }),
    [outsideDays],
  );

  const viewStateCtx = useMemo<ViewStateContextValue>(
    () => ({ currentDateTime, rootState }),
    [currentDateTime, rootState],
  );

  return (
    <MonthViewStableContext.Provider value={stableCtx}>
      <MonthViewStateContext.Provider value={stateCtx}>
        <ViewStableContext.Provider value={viewStableCtx}>
          <ViewStateContext.Provider value={viewStateCtx}>
            <ViewContext.Provider value={viewCtx}>
              {children}
            </ViewContext.Provider>
          </ViewStateContext.Provider>
        </ViewStableContext.Provider>
      </MonthViewStateContext.Provider>
    </MonthViewStableContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// MonthView convenience wrapper — composes CalendarProvider + MonthView.Root
// ---------------------------------------------------------------------------

type MonthViewProps<F extends ValueFormat = "PlainDate"> =
  CalendarProviderProps<F> & MonthViewRootProps;

function MonthView<F extends ValueFormat = "PlainDate">(
  props: MonthViewProps<F>,
) {
  const {
    numberOfMonths,
    fixedWeeks,
    outsideDays,
    outOfRangeBehavior,
    month,
    defaultMonth,
    onMonthChange,
    children,
    ...calendarProps
  } = props as MonthViewProps<F> & { children?: React.ReactNode };

  return (
    <CalendarProvider {...(calendarProps as CalendarProviderProps<F>)}>
      <MonthViewRoot
        numberOfMonths={numberOfMonths}
        fixedWeeks={fixedWeeks}
        outsideDays={outsideDays}
        outOfRangeBehavior={outOfRangeBehavior}
        month={month}
        defaultMonth={defaultMonth}
        onMonthChange={onMonthChange}
      >
        {children}
      </MonthViewRoot>
    </CalendarProvider>
  );
}

MonthView.Root = MonthViewRoot;

export { MonthView, MonthViewRoot };
export type { MonthViewProps };
