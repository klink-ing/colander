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
  computeAdjacentMonth,
  focusedDateForMonth,
  getMonthWeeks,
  resolveFocusTarget,
  selectedToZdt,
  shiftWindowToMonth,
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
  const { timeZone, weekStartDay, isDateDisabled } = calStable;

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

  // Always-current ref so callbacks/effects don't re-subscribe on every
  // onMonthChange identity change.
  const onMonthChangeRef = useRef(onMonthChange);
  onMonthChangeRef.current = onMonthChange;

  // Request the parent move the view to `{year, month}` (controlled mode).
  // Built in ISO — `year`/`month` are ISO numbers, and the locale calendar
  // only affects display (see MonthYearString). Passing `calendar` here would
  // reinterpret the ISO numbers as locale-calendar fields (e.g. Buddhist),
  // shifting the value by centuries.
  const notifyMonth = useCallback(
    (year: number, month: number) => {
      onMonthChangeRef.current?.(T.PlainYearMonth.from({ year, month }));
    },
    [T],
  );

  // Whether `{year, month}` falls within the currently displayed window.
  const isMonthVisible = useCallback(
    (targetYear: number, targetMonth: number) => {
      for (let i = 0; i < numberOfMonths; i++) {
        const totalMonths =
          currentMonth.year * 12 + (currentMonth.month - 1) + i;
        const y = Math.floor(totalMonths / 12);
        const m = (totalMonths % 12) + 1;
        if (targetYear === y && targetMonth === m) return true;
      }
      return false;
    },
    [currentMonth.year, currentMonth.month, numberOfMonths],
  );

  // --- navigateToMonth: shift the window by the minimum needed to reveal the
  // target month (keeps keyboard crossing symmetric with the Prev/Next
  // buttons, which step one month at a time). ---
  const navigateToMonth = useCallback(
    (targetYear: number, targetMonth: number) => {
      if (isMonthControlled) return; // controlled mode: parent manages
      setInternalMonth((prev) => {
        const next = shiftWindowToMonth(
          prev,
          { year: targetYear, month: targetMonth },
          numberOfMonths,
        );
        if (next.year === prev.year && next.month === prev.month) return prev;
        return next;
      });
    },
    [isMonthControlled, numberOfMonths],
  );

  // Button navigation in controlled mode notifies the parent directly, then
  // moves focus into the target month. This ref holds that focus value so the
  // focus-sync effect skips re-notifying for it. Keyed by the value (not a
  // one-shot flag) so it can't strand and suppress a later keyboard crossing
  // if the button's focus move is a no-op or the parent ignores the change.
  const skipFocusSyncForRef = useRef<Temporal.PlainDate | null>(null);
  const prevFocusedRef = useRef(focusedDate);

  // Clear a stale skip target whenever the parent actually moves the view.
  useEffect(() => {
    skipFocusSyncForRef.current = null;
  }, [monthProp?.year, monthProp?.month]);

  // Sync month when the focused date crosses a month boundary. Uncontrolled:
  // shift internal state. Controlled: ask the parent to move the view, but
  // only when focus actually moved out of the visible window (keyboard nav) —
  // never as an echo of an external `month` update or a button click.
  useEffect(() => {
    const prevFocused = prevFocusedRef.current;
    prevFocusedRef.current = focusedDate;
    if (isMonthControlled) {
      if (skipFocusSyncForRef.current === focusedDate) {
        skipFocusSyncForRef.current = null;
        return;
      }
      if (prevFocused === focusedDate) return;
      if (isMonthVisible(focusedDate.year, focusedDate.month)) return;
      // Emit the minimally-shifted first-visible month (what the parent binds
      // to `month`), not the focused month — so a controlled window scrolls by
      // the minimum, matching uncontrolled mode and the nav buttons.
      const next = shiftWindowToMonth(
        { year: currentMonth.year, month: currentMonth.month },
        { year: focusedDate.year, month: focusedDate.month },
        numberOfMonths,
      );
      notifyMonth(next.year, next.month);
      return;
    }
    navigateToMonth(focusedDate.year, focusedDate.month);
  }, [
    focusedDate,
    navigateToMonth,
    isMonthControlled,
    isMonthVisible,
    notifyMonth,
    currentMonth.year,
    currentMonth.month,
    numberOfMonths,
  ]);

  // --- Month navigation callbacks ---
  const goNextMonth = useCallback(() => {
    if (isMonthControlled) {
      const { year, month, firstDay } = computeAdjacentMonth(
        { year: monthProp!.year, month: monthProp!.month },
        "next",
        T,
      );
      // Notify the parent directly; the follow-on focus move is suppressed in
      // the focus-sync effect (keyed on the value) so onMonthChange fires once.
      const nextFocus = focusedDateForMonth(
        focusedDate,
        { year, month },
        firstDay,
      );
      skipFocusSyncForRef.current = nextFocus;
      notifyMonth(year, month);
      setFocusedDate(nextFocus);
      return;
    }
    setInternalMonth((m) => {
      const { year, month, firstDay } = computeAdjacentMonth(m, "next", T);
      setFocusedDate((prev) =>
        focusedDateForMonth(prev, { year, month }, firstDay),
      );
      return { year, month };
    });
  }, [T, isMonthControlled, monthProp, notifyMonth, focusedDate]);

  const goPrevMonth = useCallback(() => {
    if (isMonthControlled) {
      const { year, month, firstDay } = computeAdjacentMonth(
        { year: monthProp!.year, month: monthProp!.month },
        "prev",
        T,
      );
      const nextFocus = focusedDateForMonth(
        focusedDate,
        { year, month },
        firstDay,
      );
      skipFocusSyncForRef.current = nextFocus;
      notifyMonth(year, month);
      setFocusedDate(nextFocus);
      return;
    }
    setInternalMonth((m) => {
      const { year, month, firstDay } = computeAdjacentMonth(m, "prev", T);
      setFocusedDate((prev) =>
        focusedDateForMonth(prev, { year, month }, firstDay),
      );
      return { year, month };
    });
  }, [T, isMonthControlled, monthProp, notifyMonth, focusedDate]);

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

  // --- viewingYearMonth (for the render-prop rootState) ---
  // ISO — the locale calendar only affects display, not this value.
  const viewingYearMonth = useMemo(
    () =>
      T.PlainYearMonth.from({
        year: currentMonth.year,
        month: currentMonth.month,
      }),
    [currentMonth, T],
  );

  // --- Fire onMonthChange when uncontrolled navigation moves the view (not on
  // mount). In controlled mode the parent owns `month`, so notification flows
  // from button clicks (goNext/goPrevMonth) and the focus-sync effect instead;
  // firing here would just echo the parent's own update back to it. ---
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (isMonthControlled) return;
    onMonthChangeRef.current?.(viewingYearMonth);
  }, [viewingYearMonth, isMonthControlled]);

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
