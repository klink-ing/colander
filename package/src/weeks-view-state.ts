import type { Temporal } from "@js-temporal/polyfill";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCalendarStable, useCalendarState } from "./calendar-context";
import { computeWeeksInWindow } from "./compute-weeks-in-window";
import { applyOutOfRange, type OutOfRangeBehavior } from "./out-of-range";
import {
  resolveFirstWeekSpec,
  resolveFirstWeek,
  type FirstWeekSpec,
} from "./resolve-first-week";
import type { RootState } from "./types";
import { selectedToZdt, toZonedDateTime } from "./utils";
import type { ViewContextValue } from "./view-context";
import type {
  WeeksViewRootProps,
  WeeksViewStableContextValue,
  WeeksViewStateContextValue,
  WindowInfo,
} from "./weeks-view-types";

/**
 * Core state management hook for WeeksView.Root.
 * Reads calendar-level context and manages weeks-specific state.
 */
export function useWeeksViewRootState(props: WeeksViewRootProps) {
  const {
    weekCount,
    firstWeek: firstWeekProp,
    defaultFirstWeek: defaultFirstWeekProp,
    onFirstWeekChange,
    scrollBy: scrollByProp,
    outOfRangeBehavior: outOfRangeBehaviorProp,
    onWindowChange,
  } = props;

  const scrollBy = scrollByProp ?? "row";
  const outOfRangeBehavior: OutOfRangeBehavior =
    outOfRangeBehaviorProp ?? "unbounded";

  // Read calendar-level context
  const calStable = useCalendarStable();
  const calState = useCalendarState();

  const T = calStable.temporal;
  const { weekStartDay, isDateDisabled, minValue, maxValue, timeZone } =
    calStable;

  // --- Controlled/uncontrolled firstWeek ---
  const isControlled = firstWeekProp !== undefined;

  const resolveSpec = useCallback(
    (spec: FirstWeekSpec): Temporal.PlainDate =>
      resolveFirstWeekSpec(spec, weekStartDay, T),
    [weekStartDay, T],
  );

  const [internalFirstWeek, setInternalFirstWeek] =
    useState<Temporal.PlainDate>(() => {
      if (firstWeekProp !== undefined) return resolveSpec(firstWeekProp);
      if (defaultFirstWeekProp !== undefined)
        return resolveSpec(defaultFirstWeekProp);
      // Derive from selection or today
      if (calState.selected) {
        const plain = toZonedDateTime(
          calState.selected,
          timeZone,
          T,
        ).toPlainDate();
        return resolveSpec(plain);
      }
      return resolveSpec(T.Now.plainDateISO());
    });

  const resolvedFirstWeek = isControlled
    ? resolveSpec(firstWeekProp)
    : internalFirstWeek;

  // --- Compute week window ---
  const rawWeeks = useMemo(
    () => computeWeeksInWindow(resolvedFirstWeek, weekCount, weekStartDay, T),
    [resolvedFirstWeek, weekCount, weekStartDay, T],
  );

  // --- Apply out-of-range behavior ---
  const outOfRangeResult = useMemo(
    () =>
      applyOutOfRange({
        targetFirstWeek: resolvedFirstWeek,
        weekCount,
        behavior: outOfRangeBehavior,
        ...(minValue !== undefined && { min: minValue }),
        ...(maxValue !== undefined && { max: maxValue }),
        weekStartDay,
        T,
      }),
    [
      resolvedFirstWeek,
      weekCount,
      outOfRangeBehavior,
      minValue,
      maxValue,
      weekStartDay,
      T,
    ],
  );

  // Recompute weeks if the out-of-range behavior adjusted the window
  const adjustedWeeks = useMemo(() => {
    const sameFirst =
      T.PlainDate.compare(outOfRangeResult.firstWeek, resolvedFirstWeek) === 0;
    const sameCount = outOfRangeResult.weekCount === weekCount;
    if (sameFirst && sameCount) return rawWeeks;
    return computeWeeksInWindow(
      outOfRangeResult.firstWeek,
      outOfRangeResult.weekCount,
      weekStartDay,
      T,
    );
  }, [
    outOfRangeResult,
    resolvedFirstWeek,
    weekCount,
    rawWeeks,
    weekStartDay,
    T,
  ]);

  // --- Compute WindowInfo ---
  const isDateEnabled = useCallback(
    (date: Temporal.PlainDate): boolean => {
      if (minValue && T.PlainDate.compare(date, minValue) < 0) return false;
      if (maxValue && T.PlainDate.compare(date, maxValue) > 0) return false;
      if (isDateDisabled?.(date)) return false;
      return true;
    },
    [minValue, maxValue, isDateDisabled, T],
  );

  const windowInfo = useMemo<WindowInfo>(() => {
    const weeks = adjustedWeeks;
    const firstWeek = weeks[0];
    const lastWeek = weeks[weeks.length - 1];
    if (firstWeek === undefined || lastWeek === undefined) {
      const today = T.Now.plainDateISO();
      return {
        windowStart: today,
        windowEnd: today,
        weekCount: 0,
        dayCount: 0,
        enabledWeekCount: 0,
        enabledDayCount: 0,
        visibleMonths: [],
      };
    }
    const windowStart = firstWeek.startDate;
    const windowEnd = lastWeek.endDate;
    const wc = weeks.length;
    const dayCount = wc * 7;

    let enabledDayCount = 0;
    let enabledWeekCount = 0;
    for (const week of weeks) {
      let weekHasEnabled = false;
      // Check all 7 days of the week
      let day = week.startDate;
      for (let d = 0; d < 7; d++) {
        if (isDateEnabled(day)) {
          enabledDayCount++;
          weekHasEnabled = true;
        }
        if (d < 6) day = day.add({ days: 1 });
      }
      if (weekHasEnabled) enabledWeekCount++;
    }

    // Compute visible months from all days in the window
    const visibleMonths: WindowInfo["visibleMonths"] = [];
    const seenMonths = new Set<string>();
    for (const week of weeks) {
      let day = week.startDate;
      for (let d = 0; d < 7; d++) {
        const key = `${day.year}-${day.month}`;
        if (!seenMonths.has(key)) {
          seenMonths.add(key);
          visibleMonths.push({ month: day.month, year: day.year });
        }
        if (d < 6) day = day.add({ days: 1 });
      }
    }

    return {
      windowStart,
      windowEnd,
      weekCount: wc,
      dayCount,
      enabledWeekCount,
      enabledDayCount,
      visibleMonths,
    };
  }, [adjustedWeeks, isDateEnabled, T]);

  // --- Focus management ---
  const selectedPlain = useMemo(() => {
    if (!calState.selected) return undefined;
    return selectedToZdt(calState.selected, timeZone, T)?.toPlainDate();
  }, [calState.selected, timeZone, T]);

  const isInWindow = useCallback(
    (date: Temporal.PlainDate): boolean => {
      return (
        T.PlainDate.compare(date, windowInfo.windowStart) >= 0 &&
        T.PlainDate.compare(date, windowInfo.windowEnd) <= 0
      );
    },
    [windowInfo.windowStart, windowInfo.windowEnd, T],
  );

  const [focusedDate, setFocusedDate] = useState<Temporal.PlainDate>(() => {
    if (selectedPlain && isInWindow(selectedPlain)) return selectedPlain;
    return windowInfo.windowStart;
  });

  // When window shifts, ensure focusedDate stays visible
  useEffect(() => {
    setFocusedDate((prev) => {
      if (isInWindow(prev)) return prev;
      // Focus the start of the new window
      return windowInfo.windowStart;
    });
  }, [windowInfo.windowStart, isInWindow]);

  const [gridHasFocus, setGridHasFocus] = useState(false);
  const gridFocusedRef = useRef(false);

  // --- Grid label IDs ---
  const [gridLabelIds, setGridLabelIds] = useState<Record<number, string>>({});
  const setGridLabelId = useCallback((id: string | undefined) => {
    setGridLabelIds((prev) => {
      const key = 0; // WeeksView has a single grid
      if (id === undefined) {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      }
      if (prev[key] === id) return prev;
      return { ...prev, [key]: id };
    });
  }, []);

  // --- tabTargetDate ---
  const tabTargetDate = useMemo(() => {
    const allDays: Temporal.PlainDate[] = [];
    for (const week of adjustedWeeks) {
      let day = week.startDate;
      for (let d = 0; d < 7; d++) {
        allDays.push(day);
        if (d < 6) day = day.add({ days: 1 });
      }
    }
    const inGrid = (d: Temporal.PlainDate) =>
      allDays.some((g) => T.PlainDate.compare(g, d) === 0);

    if (gridHasFocus && inGrid(focusedDate)) return focusedDate;
    if (selectedPlain && inGrid(selectedPlain)) return selectedPlain;
    if (!gridHasFocus && inGrid(focusedDate)) return focusedDate;

    const firstEnabled = allDays.find((d) => isDateEnabled(d));
    return firstEnabled ?? allDays[0] ?? windowInfo.windowStart;
  }, [
    adjustedWeeks,
    focusedDate,
    selectedPlain,
    gridHasFocus,
    isDateEnabled,
    T,
    windowInfo.windowStart,
  ]);

  // --- currentDateTime ---
  const selectedZdt = useMemo(
    () => selectedToZdt(calState.selected, timeZone, T),
    [calState.selected, timeZone, T],
  );

  const currentDateTime = useMemo<Temporal.PlainDateTime>(
    () =>
      T.PlainDateTime.from(
        {
          year: windowInfo.windowStart.year,
          month: windowInfo.windowStart.month,
          day: focusedDate.day,
          hour: selectedZdt?.hour ?? 0,
          minute: selectedZdt?.minute ?? 0,
          second: selectedZdt?.second ?? 0,
        },
        { overflow: "constrain" },
      ),
    [windowInfo.windowStart, focusedDate.day, selectedZdt, T],
  );

  // --- Navigation ---
  // goNext/goPrev default to weekCount. The scrollBy prop only affects
  // keyboard arrow behavior (in weeks-keyboard.ts), NOT button navigation.

  const updateFirstWeek = useCallback(
    (newFirstWeek: Temporal.PlainDate) => {
      if (!isControlled) {
        setInternalFirstWeek(newFirstWeek);
      }
      onFirstWeekChange?.(newFirstWeek);
    },
    [isControlled, onFirstWeekChange],
  );

  const goNext = useCallback(
    (shiftBy?: number) => {
      const shift = shiftBy ?? weekCount;
      const target = resolvedFirstWeek.add({ weeks: shift });
      const adjusted = applyOutOfRange({
        targetFirstWeek: target,
        weekCount,
        behavior: outOfRangeBehavior,
        ...(minValue !== undefined && { min: minValue }),
        ...(maxValue !== undefined && { max: maxValue }),
        weekStartDay,
        T,
      });
      updateFirstWeek(adjusted.firstWeek);
    },
    [
      resolvedFirstWeek,
      weekCount,
      outOfRangeBehavior,
      minValue,
      maxValue,
      weekStartDay,
      T,
      updateFirstWeek,
    ],
  );

  const goPrev = useCallback(
    (shiftBy?: number) => {
      const shift = shiftBy ?? weekCount;
      const target = resolvedFirstWeek.subtract({ weeks: shift });
      const adjusted = applyOutOfRange({
        targetFirstWeek: target,
        weekCount,
        behavior: outOfRangeBehavior,
        ...(minValue !== undefined && { min: minValue }),
        ...(maxValue !== undefined && { max: maxValue }),
        weekStartDay,
        T,
      });
      updateFirstWeek(adjusted.firstWeek);
    },
    [
      resolvedFirstWeek,
      weekCount,
      outOfRangeBehavior,
      minValue,
      maxValue,
      weekStartDay,
      T,
      updateFirstWeek,
    ],
  );

  // --- scrollToWeek ---
  const scrollToWeek = useCallback(
    (
      target: FirstWeekSpec,
      options?: { snap?: "start" | "center" | "end" | "nearest" },
    ) => {
      const resolvedTarget = resolveSpec(target);
      const newFirstWeek = resolveFirstWeek(
        resolvedFirstWeek,
        weekCount,
        resolvedTarget,
        options,
      );
      const adjusted = applyOutOfRange({
        targetFirstWeek: newFirstWeek,
        weekCount,
        behavior: outOfRangeBehavior,
        ...(minValue !== undefined && { min: minValue }),
        ...(maxValue !== undefined && { max: maxValue }),
        weekStartDay,
        T,
      });
      updateFirstWeek(adjusted.firstWeek);
    },
    [
      resolvedFirstWeek,
      weekCount,
      resolveSpec,
      outOfRangeBehavior,
      minValue,
      maxValue,
      weekStartDay,
      T,
      updateFirstWeek,
    ],
  );

  // --- Fire onWindowChange ---
  const onWindowChangeRef = useRef(onWindowChange);
  onWindowChangeRef.current = onWindowChange;
  const prevWindowInfoRef = useRef<WindowInfo | null>(null);

  useEffect(() => {
    const prev = prevWindowInfoRef.current;
    const changed =
      !prev ||
      T.PlainDate.compare(prev.windowStart, windowInfo.windowStart) !== 0 ||
      T.PlainDate.compare(prev.windowEnd, windowInfo.windowEnd) !== 0 ||
      prev.weekCount !== windowInfo.weekCount;
    if (changed) {
      prevWindowInfoRef.current = windowInfo;
      onWindowChangeRef.current?.(windowInfo);
    }
  }, [windowInfo, T]);

  // --- Build context values ---
  const stableCtx = useMemo<WeeksViewStableContextValue>(
    () => ({
      weekCount,
      scrollBy,
      outOfRangeBehavior,
      goNext,
      goPrev,
      scrollToWeek,
      gridFocusedRef,
      setGridLabelId,
    }),
    [
      weekCount,
      scrollBy,
      outOfRangeBehavior,
      goNext,
      goPrev,
      scrollToWeek,
      setGridLabelId,
    ],
  );

  // Real render-prop rootState shared by the MonthViewState shims (WeeksView
  // root + the inner Grid), so components reading `state.root` inside WeeksView
  // see populated values instead of an empty cast.
  const rootState = useMemo<RootState>(
    () => ({
      ...calState.baseRootState,
      focused: focusedDate,
      viewing: T.PlainYearMonth.from({
        year: currentDateTime.year,
        month: currentDateTime.month,
      }),
    }),
    [calState.baseRootState, focusedDate, currentDateTime, T],
  );

  const stateCtx = useMemo<WeeksViewStateContextValue>(
    () => ({
      focusedDate,
      windowInfo,
      gridLabelIds,
      weeks: adjustedWeeks,
      currentDateTime,
      rootState,
    }),
    [
      focusedDate,
      windowInfo,
      gridLabelIds,
      adjustedWeeks,
      currentDateTime,
      rootState,
    ],
  );

  const viewCtx = useMemo<ViewContextValue>(
    () => ({
      viewType: "weeks" as const,
      focusedDate,
      setFocusedDate,
      tabTargetDate,
      gridHasFocus,
      setGridHasFocus,
    }),
    [focusedDate, tabTargetDate, gridHasFocus],
  );

  return { stableCtx, stateCtx, viewCtx, scrollToWeek };
}
