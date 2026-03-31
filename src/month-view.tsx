import type { Temporal } from "@js-temporal/polyfill";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCalendarStable, useCalendarState } from "./calendar-context";
import { CalendarProvider } from "./calendar-provider";
import type { CalendarProviderProps } from "./calendar-types";
import {
  MonthViewStableContext,
  MonthViewStateContext,
} from "./month-view-context";
import type {
  MonthViewRootProps,
  MonthViewStableContextValue,
  MonthViewStateContextValue,
} from "./month-view-types";
import type { MonthData, RootState, ValueFormat } from "./types";
import {
  calendarForLocale,
  computeAdjacentMonth,
  focusedDateForMonth,
  getMonthWeeks,
  resolveFocusTarget,
  selectedToZdt,
  toZonedDateTime,
} from "./utils";
import { ViewContext, type ViewContextValue } from "./view-context";

// ---------------------------------------------------------------------------
// MonthView.Root — placed inside CalendarProvider
// ---------------------------------------------------------------------------

function MonthViewRoot(props: MonthViewRootProps) {
  const {
    numberOfMonths: numberOfMonthsProp,
    fixedWeeks: fixedWeeksProp,
    outsideDays: outsideDaysProp,
    overflowBehavior: overflowBehaviorProp,
    month: monthProp,
    defaultMonth: defaultMonthProp,
    onMonthChange,
    children,
  } = props;

  const numberOfMonths = Math.max(1, Math.min(numberOfMonthsProp ?? 1, 12));
  const fixedWeeks = fixedWeeksProp ?? false;
  const outsideDays = outsideDaysProp ?? "enabled";
  const overflowBehavior = overflowBehaviorProp ?? "unbounded";

  // Read calendar-level context
  const calStable = useCalendarStable();
  const calState = useCalendarState();

  const T = calStable.temporal;
  const { timeZone, locale, weekStartDay, isDateDisabled } = calStable;

  // --- Month navigation state (controlled/uncontrolled) ---
  const isMonthControlled = monthProp !== undefined;

  const [internalMonth, setInternalMonth] = useState<{
    year: number;
    month: number;
  }>(() => {
    if (monthProp) return { year: monthProp.year, month: monthProp.month };
    if (defaultMonthProp)
      return { year: defaultMonthProp.year, month: defaultMonthProp.month };
    // Derive from selection or today
    if (calState.selected) {
      const zdt = toZonedDateTime(calState.selected, timeZone, T);
      return { year: zdt.year, month: zdt.month };
    }
    const now = T.Now.zonedDateTimeISO(timeZone);
    return { year: now.year, month: now.month };
  });

  const currentMonth = isMonthControlled
    ? { year: monthProp.year, month: monthProp.month }
    : internalMonth;

  // --- Focus state ---
  const [focusedDate, setFocusedDate] = useState<Temporal.PlainDate>(() => {
    if (calState.selected) {
      return toZonedDateTime(calState.selected, timeZone, T).toPlainDate();
    }
    return T.Now.plainDateISO();
  });

  const [gridHasFocus, setGridHasFocus] = useState(false);
  const gridFocusedRef = useRef(false);

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

  // --- navigateToMonth: only shift if target not already visible ---
  const navigateToMonth = useCallback(
    (targetYear: number, targetMonth: number) => {
      if (isMonthControlled) return; // controlled mode: parent manages
      setInternalMonth((prev) => {
        for (let i = 0; i < numberOfMonths; i++) {
          const totalMonths = prev.year * 12 + (prev.month - 1) + i;
          const y = Math.floor(totalMonths / 12);
          const m = (totalMonths % 12) + 1;
          if (targetYear === y && targetMonth === m) {
            return prev; // Already visible
          }
        }
        return { year: targetYear, month: targetMonth };
      });
    },
    [isMonthControlled, numberOfMonths],
  );

  // Sync month when focused date crosses a month boundary
  useEffect(() => {
    navigateToMonth(focusedDate.year, focusedDate.month);
  }, [focusedDate, navigateToMonth]);

  // --- Month navigation callbacks ---
  const goNextMonth = useCallback(() => {
    if (isMonthControlled) {
      // Fire onMonthChange with the next month
      const { year, month, firstDay } = computeAdjacentMonth(
        { year: monthProp!.year, month: monthProp!.month },
        "next",
        T,
      );
      setFocusedDate((prev) =>
        focusedDateForMonth(prev, { year, month }, firstDay),
      );
      // The effect on viewingYearMonth will fire onMonthChange
      return;
    }
    setInternalMonth((m) => {
      const { year, month, firstDay } = computeAdjacentMonth(m, "next", T);
      setFocusedDate((prev) =>
        focusedDateForMonth(prev, { year, month }, firstDay),
      );
      return { year, month };
    });
  }, [T, isMonthControlled, monthProp]);

  const goPrevMonth = useCallback(() => {
    if (isMonthControlled) {
      const { year, month, firstDay } = computeAdjacentMonth(
        { year: monthProp!.year, month: monthProp!.month },
        "prev",
        T,
      );
      setFocusedDate((prev) =>
        focusedDateForMonth(prev, { year, month }, firstDay),
      );
      return;
    }
    setInternalMonth((m) => {
      const { year, month, firstDay } = computeAdjacentMonth(m, "prev", T);
      setFocusedDate((prev) =>
        focusedDateForMonth(prev, { year, month }, firstDay),
      );
      return { year, month };
    });
  }, [T, isMonthControlled, monthProp]);

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

  const weeks = allMonths[0].weeks;

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
    [currentMonth, focusedDate.day, selectedZdt, T.PlainDateTime.from],
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

  // --- viewingYearMonth (for onMonthChange callback) ---
  const localeCalendar = useMemo(() => calendarForLocale(locale), [locale]);

  const viewingYearMonth = useMemo(
    () =>
      T.PlainYearMonth.from({
        year: currentMonth.year,
        month: currentMonth.month,
        calendar: localeCalendar,
      }),
    [currentMonth, T, localeCalendar],
  );

  // --- Fire onMonthChange (not on mount) ---
  const onMonthChangeRef = useRef(onMonthChange);
  onMonthChangeRef.current = onMonthChange;
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    onMonthChangeRef.current?.(viewingYearMonth);
  }, [viewingYearMonth]);

  // --- rootState (for render functions) ---
  const { selected, selectedDates, rangeStart, rangeEnd } = calState;

  const rootState = useMemo<RootState>(
    () => ({
      hasSelection: selectedDates.length > 0,
      selected: selected?.value,
      selectedDates: selectedDates as any,
      rangeStart: rangeStart as any,
      rangeEnd: rangeEnd as any,
      focused: focusedDate,
      viewing: viewingYearMonth,
      timeZone,
      locale,
      readOnly: calStable.readOnly,
    }),
    [
      selectedDates,
      selected,
      rangeStart,
      rangeEnd,
      focusedDate,
      viewingYearMonth,
      timeZone,
      locale,
      calStable.readOnly,
    ],
  );

  // --- Context values ---
  const stableCtx = useMemo<MonthViewStableContextValue>(
    () => ({
      numberOfMonths,
      fixedWeeks,
      outsideDays,
      overflowBehavior,
      goNextMonth,
      goPrevMonth,
      setGridLabelId,
      gridFocusedRef,
    }),
    [
      numberOfMonths,
      fixedWeeks,
      outsideDays,
      overflowBehavior,
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

  return (
    <MonthViewStableContext.Provider value={stableCtx}>
      <MonthViewStateContext.Provider value={stateCtx}>
        <ViewContext.Provider value={viewCtx}>{children}</ViewContext.Provider>
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
    overflowBehavior,
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
        overflowBehavior={overflowBehavior}
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
