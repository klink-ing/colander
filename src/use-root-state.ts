import type { Temporal } from "@js-temporal/polyfill";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  DatePickerStableContextValue,
  DatePickerStateContextValue,
  DateRange,
  DateValueObject,
  InsideRangeAction,
  MonthData,
  RawValueForFormat,
  RootState,
  ValueChangeMeta,
  ValueFormat,
} from "./types";
import {
  calendarForLocale,
  computeAdjacentMonth,
  focusedDateForMonth,
  fromZonedDateTime,
  getMonthWeeks,
  resolveFocusTarget,
  selectedToZdt,
  toZonedDateTime,
} from "./utils";
import {
  isDateRange,
  tagRaw,
  computeSelectionUpdate,
  computeSetRangeUpdate,
  truncateDatesForMode,
  type UseRootStateParams,
} from "./root-selection";

export function useRootState<F extends ValueFormat>(
  params: UseRootStateParams<F>,
) {
  const {
    format: resolvedFormat,
    selectionMode,
    value: valueProp,
    defaultValue: defaultValueProp,
    onValueChange,
    min,
    max,
    disabled: disabledProp,
    readOnly: readOnlyProp,
    isDateDisabled: isDateDisabledProp,
    timeZone,
    locale,
    temporal: T,
    onMonthChange,
  } = params;

  const insideRangeAction: InsideRangeAction =
    selectionMode === "range"
      ? ((params as Extract<UseRootStateParams<F>, { selectionMode: "range" }>)
          .insideRangeAction ?? "nearest-end")
      : "reset";

  const disabled = disabledProp ?? false;
  const readOnly = readOnlyProp ?? false;
  const isRange = selectionMode === "range";
  const isMultiple = selectionMode === "multiple";

  // Extract mode-specific value/default, preserving `null` for controlled-empty.
  const singleValue: RawValueForFormat<F> | null | undefined =
    !isRange && !isMultiple
      ? (valueProp as RawValueForFormat<F> | null | undefined)
      : undefined;
  const singleDefault: RawValueForFormat<F> | undefined =
    !isRange && !isMultiple
      ? (defaultValueProp as RawValueForFormat<F> | undefined)
      : undefined;

  const rangeValue: DateRange<F> | null | undefined = isRange
    ? valueProp === null
      ? null
      : valueProp != null && isDateRange<F>(valueProp as any)
        ? (valueProp as DateRange<F>)
        : undefined
    : undefined;
  const rangeDefault: DateRange<F> | undefined =
    isRange && defaultValueProp != null && isDateRange<F>(defaultValueProp as any)
      ? (defaultValueProp as DateRange<F>)
      : undefined;

  const multipleValue: RawValueForFormat<F>[] | null | undefined = isMultiple
    ? valueProp === null
      ? null
      : Array.isArray(valueProp)
        ? valueProp
        : undefined
    : undefined;
  const multipleDefault: RawValueForFormat<F>[] | undefined =
    isMultiple && Array.isArray(defaultValueProp) ? defaultValueProp : undefined;

  const taggedValue = useMemo(
    () => tagRaw(singleValue ?? undefined, resolvedFormat),
    [singleValue, resolvedFormat],
  );

  const taggedDefault = useMemo(
    () => tagRaw(singleDefault, resolvedFormat),
    [singleDefault, resolvedFormat],
  );

  const minValue: Temporal.PlainDate | undefined = useMemo(() => {
    if (min == null) return undefined;
    const tagged = { format: resolvedFormat, value: min } as DateValueObject;
    return toZonedDateTime(tagged, timeZone, T).toPlainDate();
  }, [min, resolvedFormat, timeZone, T]);

  const maxValue: Temporal.PlainDate | undefined = useMemo(() => {
    if (max == null) return undefined;
    const tagged = { format: resolvedFormat, value: max } as DateValueObject;
    return toZonedDateTime(tagged, timeZone, T).toPlainDate();
  }, [max, resolvedFormat, timeZone, T]);

  const isDateDisabled = useCallback(
    (date: Temporal.PlainDate): boolean => {
      if (disabled) return true;
      if (minValue && T.PlainDate.compare(date, minValue) < 0) return true;
      if (maxValue && T.PlainDate.compare(date, maxValue) > 0) return true;
      return isDateDisabledProp?.(date) ?? false;
    },
    [disabled, minValue, maxValue, isDateDisabledProp, T],
  );

  const rawToPlain = useCallback(
    (raw: RawValueForFormat<F>): Temporal.PlainDate => {
      const tagged = { format: resolvedFormat, value: raw } as DateValueObject;
      return toZonedDateTime(tagged, timeZone, T).toPlainDate();
    },
    [resolvedFormat, timeZone, T],
  );

  const sortDates = useCallback(
    (dates: Temporal.PlainDate[]) =>
      [...dates].sort((a, b) => T.PlainDate.compare(a, b)),
    [T],
  );

  /** Maximum number of dates the current mode allows. */
  const maxDatesForMode = isMultiple
    ? Number.POSITIVE_INFINITY
    : isRange
      ? 2
      : 1;

  const controlledDates = useMemo<Temporal.PlainDate[] | undefined>(() => {
    if (isMultiple) {
      if (multipleValue === null) return [];
      if (multipleValue) return sortDates(multipleValue.map(rawToPlain));
      return undefined;
    }
    if (isRange) {
      if (rangeValue === null) return [];
      if (rangeValue)
        return [rawToPlain(rangeValue.start), rawToPlain(rangeValue.end)];
      return undefined;
    }
    if (singleValue === null) return [];
    if (singleValue !== undefined) return [rawToPlain(singleValue)];
    return undefined;
  }, [
    isMultiple,
    isRange,
    multipleValue,
    rangeValue,
    singleValue,
    rawToPlain,
    sortDates,
  ]);

  const defaultDates = useMemo<Temporal.PlainDate[]>(() => {
    if (isMultiple) {
      if (multipleDefault) return sortDates(multipleDefault.map(rawToPlain));
      return [];
    }
    if (rangeDefault)
      return [rawToPlain(rangeDefault.start), rawToPlain(rangeDefault.end)];
    if (singleDefault != null) return [rawToPlain(singleDefault)];
    return [];
  }, [isMultiple, multipleDefault, rangeDefault, singleDefault, rawToPlain, sortDates]);

  const [internalDates, setInternalDates] =
    useState<Temporal.PlainDate[]>(defaultDates);

  // `controlledDates === undefined` means the value prop was not provided (uncontrolled).
  // `controlledDates` being an array (even empty) means controlled mode — `null` maps to `[]`.
  const isControlled = controlledDates !== undefined;
  const committedDates = isControlled ? controlledDates : internalDates;

  const rangeStart =
    !isMultiple && committedDates.length > 0
      ? committedDates[0]
      : undefined;
  const rangeEnd =
    !isMultiple && committedDates.length > 0
      ? committedDates[committedDates.length - 1]
      : undefined;
  const committedStart = committedDates[0] as Temporal.PlainDate | undefined;
  const committedEnd =
    committedDates.length > 0
      ? committedDates[committedDates.length - 1]
      : undefined;

  const plainToFormatValue = useCallback(
    (plain: Temporal.PlainDate): RawValueForFormat<F> => {
      const zdt = plain
        .toPlainDateTime({ hour: 0, minute: 0, second: 0 })
        .toZonedDateTime(timeZone);
      return fromZonedDateTime(zdt, resolvedFormat, T)
        .value as RawValueForFormat<F>;
    },
    [resolvedFormat, timeZone, T],
  );

  /** Build the current formatted single value (for "previous" in meta). */
  const currentSingleFormatted = useCallback(
    (): RawValueForFormat<F> | null =>
      committedDates.length > 0
        ? plainToFormatValue(committedDates[0])
        : null,
    [committedDates, plainToFormatValue],
  );

  /** Build the current formatted range (for "previous" in meta). */
  const currentRangeFormatted = useCallback(
    (): DateRange<F> | null =>
      committedStart && committedEnd
        ? {
            start: plainToFormatValue(committedStart),
            end: plainToFormatValue(committedEnd),
          }
        : null,
    [committedStart, committedEnd, plainToFormatValue],
  );

  /** Build the current formatted multiple value (for "previous" in meta). */
  const currentMultipleFormatted = useCallback(
    (): RawValueForFormat<F>[] => committedDates.map(plainToFormatValue),
    [committedDates, plainToFormatValue],
  );

  // Auto-truncate internal dates when selection mode changes
  const prevModeRef = useRef(selectionMode);
  useEffect(() => {
    if (prevModeRef.current === selectionMode) return;
    prevModeRef.current = selectionMode;
    setInternalDates((prev) =>
      truncateDatesForMode<F>({
        prev,
        maxDatesForMode,
        selectionMode,
        plainToFormatValue,
        onValueChange,
      }),
    );
  }, [selectionMode, maxDatesForMode, onValueChange, plainToFormatValue]);

  const initSrc = useMemo(() => {
    if (taggedValue) return taggedValue;
    if (taggedDefault) return taggedDefault;
    if (rangeValue)
      return {
        format: resolvedFormat,
        value: rangeValue.start,
      } as DateValueObject;
    if (rangeDefault)
      return {
        format: resolvedFormat,
        value: rangeDefault.start,
      } as DateValueObject;
    if (multipleValue && multipleValue.length > 0)
      return {
        format: resolvedFormat,
        value: multipleValue[0],
      } as DateValueObject;
    if (multipleDefault && multipleDefault.length > 0)
      return {
        format: resolvedFormat,
        value: multipleDefault[0],
      } as DateValueObject;
    return undefined;
  }, [
    taggedValue,
    taggedDefault,
    rangeValue,
    rangeDefault,
    multipleValue,
    multipleDefault,
    resolvedFormat,
  ]);

  const [currentMonth, setCurrentMonth] = useState<{
    year: number;
    month: number;
  }>(() => {
    const init = initSrc
      ? toZonedDateTime(initSrc, timeZone, T)
      : T.Now.zonedDateTimeISO(timeZone);
    return { year: init.year, month: init.month };
  });

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
  const gridFocusedRef = useRef(false);
  const [gridHasFocus, setGridHasFocus] = useState(false);

  const [focusedDate, setFocusedDate] = useState<Temporal.PlainDate>(() => {
    if (initSrc) {
      return toZonedDateTime(initSrc, timeZone, T).toPlainDate();
    }
    return T.Now.plainDateISO();
  });

  const selected: DateValueObject | undefined = useMemo(() => {
    if (taggedValue) return taggedValue;
    if (committedDates.length === 0) return undefined;
    const zdt = committedDates[0]
      .toPlainDateTime({ hour: 0, minute: 0, second: 0 })
      .toZonedDateTime(timeZone);
    return fromZonedDateTime(zdt, resolvedFormat, T);
  }, [taggedValue, committedDates, timeZone, resolvedFormat, T]);

  const selectedZdt = useMemo(
    () => selectedToZdt(selected, timeZone, T),
    [selected, timeZone, T],
  );

  /** Shift currentMonth only if the target month isn't already visible. */
  const navigateToMonth = useCallback(
    (targetYear: number, targetMonth: number) => {
      setCurrentMonth((prev) => {
        const n = params.numberOfMonths;
        for (let i = 0; i < n; i++) {
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
    [params.numberOfMonths],
  );

  useEffect(() => {
    if (taggedValue) {
      const zdt = toZonedDateTime(taggedValue, timeZone, T);
      navigateToMonth(zdt.year, zdt.month);
    }
  }, [taggedValue, timeZone, T, navigateToMonth]);

  useEffect(() => {
    navigateToMonth(focusedDate.year, focusedDate.month);
  }, [focusedDate, navigateToMonth]);

  useEffect(() => {
    if (isRange || isMultiple) return;
    const start = committedStart;
    if (!start) return;
    const outOfBounds =
      (minValue && T.PlainDate.compare(start, minValue) < 0) ||
      (maxValue && T.PlainDate.compare(start, maxValue) > 0);
    if (outOfBounds) {
      const prev = currentSingleFormatted();
      setInternalDates([]);
      (
        onValueChange as
          | ((
              v: RawValueForFormat<F> | null,
              m: ValueChangeMeta<RawValueForFormat<F> | null>,
            ) => void)
          | undefined
      )?.(null, { date: undefined, previous: prev });
    }
  }, [
    minValue,
    maxValue,
    committedStart,
    onValueChange,
    currentSingleFormatted,
    T,
    isRange,
    isMultiple,
  ]);

  const onSelect = useCallback(
    (date: Temporal.PlainDate) => {
      const result = computeSelectionUpdate<F>({
        date,
        readOnly,
        isDateDisabled,
        isMultiple,
        isRange,
        committedDates,
        committedStart,
        committedEnd,
        selectedZdt,
        insideRangeAction,
        sortDates,
        currentSingleFormatted,
        currentRangeFormatted,
        currentMultipleFormatted,
        resolvedFormat,
        timeZone,
        T,
      });
      if (result.skip) return;
      setInternalDates(result.newDates);
      if (!isMultiple) navigateToMonth(date.year, date.month);
      result.fireCallback(onValueChange, plainToFormatValue);
    },
    [
      readOnly,
      isMultiple,
      committedDates,
      selectedZdt,
      onValueChange,
      resolvedFormat,
      isDateDisabled,
      timeZone,
      T,
      isRange,
      committedStart,
      committedEnd,
      plainToFormatValue,
      sortDates,
      insideRangeAction,
      currentSingleFormatted,
      currentRangeFormatted,
      currentMultipleFormatted,
      navigateToMonth,
    ],
  );

  const setRange = useCallback(
    (start: Temporal.PlainDate, end: Temporal.PlainDate) => {
      const result = computeSetRangeUpdate<F>({
        start,
        end,
        readOnly,
        isMultiple,
        isRange,
        currentRangeFormatted,
        currentSingleFormatted,
        resolvedFormat,
        timeZone,
        T,
      });
      if (result.skip) return;
      setInternalDates(result.newDates);
      result.fireCallback(onValueChange, plainToFormatValue);
    },
    [
      readOnly,
      isMultiple,
      isRange,
      onValueChange,
      plainToFormatValue,
      currentRangeFormatted,
      currentSingleFormatted,
      timeZone,
      resolvedFormat,
      T,
    ],
  );

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((m) => {
      const { year, month, firstDay } = computeAdjacentMonth(m, "next", T);
      setFocusedDate((prev) =>
        focusedDateForMonth(prev, { year, month }, firstDay),
      );
      return { year, month };
    });
  }, [T]);

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((m) => {
      const { year, month, firstDay } = computeAdjacentMonth(m, "prev", T);
      setFocusedDate((prev) =>
        focusedDateForMonth(prev, { year, month }, firstDay),
      );
      return { year, month };
    });
  }, [T]);

  const allMonths = useMemo<MonthData[]>(() => {
    const opts = {
      weekStartDay: params.weekStartDay,
      fixedWeeks: params.fixedWeeks,
    };
    const result: MonthData[] = [];
    for (let i = 0; i < params.numberOfMonths; i++) {
      const totalMonths =
        currentMonth.year * 12 + (currentMonth.month - 1) + i;
      const y = Math.floor(totalMonths / 12);
      const m = (totalMonths % 12) + 1;
      result.push({ year: y, month: m, weeks: getMonthWeeks(y, m, T, opts) });
    }
    return result;
  }, [
    currentMonth.year,
    currentMonth.month,
    T,
    params.weekStartDay,
    params.fixedWeeks,
    params.numberOfMonths,
  ]);

  const weeks = allMonths[0].weeks;

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

  const rawSelected = useMemo(
    () => (selected ? (selected.value as RawValueForFormat<F>) : undefined),
    [selected],
  );

  const rawSelectedDates = useMemo(
    () => committedDates.map(plainToFormatValue),
    [committedDates, plainToFormatValue],
  );

  const rawRangeStart = useMemo(
    () => (rangeStart ? plainToFormatValue(rangeStart) : undefined),
    [rangeStart, plainToFormatValue],
  );

  const rawRangeEnd = useMemo(
    () => (rangeEnd ? plainToFormatValue(rangeEnd) : undefined),
    [rangeEnd, plainToFormatValue],
  );

  const state = useMemo<RootState<F>>(
    () => ({
      hasSelection: committedDates.length > 0,
      selected: rawSelected,
      selectedDates: rawSelectedDates,
      rangeStart: rawRangeStart,
      rangeEnd: rawRangeEnd,
      focused: focusedDate,
      viewing: viewingYearMonth,
      timeZone,
      locale,
      readOnly,
    }),
    [
      committedDates.length,
      rawSelected,
      rawSelectedDates,
      rawRangeStart,
      rawRangeEnd,
      focusedDate,
      viewingYearMonth,
      timeZone,
      locale,
      readOnly,
    ],
  );

  const selectedPlain = selectedZdt?.toPlainDate();

  const tabTargetDate = useMemo(
    () =>
      resolveFocusTarget(
        focusedDate,
        selectedPlain,
        weeks,
        currentMonth,
        isDateDisabled,
        T,
        gridHasFocus,
      ),
    [
      focusedDate,
      selectedPlain,
      weeks,
      currentMonth,
      isDateDisabled,
      T,
      gridHasFocus,
    ],
  );

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

  const stableCtx = useMemo<DatePickerStableContextValue>(
    () => ({
      onSelect,
      setRange,
      setFocusedDate,
      goToNextMonth,
      goToPrevMonth,
      setGridHasFocus,
      setGridLabelId,
      selectionMode,
      disabled,
      readOnly,
      isDateDisabled,
      minValue,
      maxValue,
      timeZone,
      locale,
      temporal: T,
      gridFocusedRef,
      weekStartDay: params.weekStartDay,
      numberOfMonths: params.numberOfMonths,
      outsideDays: params.outsideDays,
    }),
    [
      onSelect,
      setRange,
      setGridLabelId,
      goToNextMonth,
      goToPrevMonth,
      selectionMode,
      disabled,
      readOnly,
      isDateDisabled,
      minValue,
      maxValue,
      timeZone,
      locale,
      T,
      params.weekStartDay,
      params.numberOfMonths,
      params.outsideDays,
    ],
  );

  const stateCtx = useMemo<DatePickerStateContextValue>(
    () => ({
      selected,
      selectedDates: committedDates,
      rangeStart,
      rangeEnd,
      focusedDate,
      tabTargetDate,
      currentDateTime,
      weeks,
      allMonths,
      numberOfMonths: params.numberOfMonths,
      gridLabelIds,
      rootState: state as unknown as RootState,
    }),
    [
      selected,
      committedDates,
      rangeStart,
      rangeEnd,
      focusedDate,
      tabTargetDate,
      currentDateTime,
      weeks,
      allMonths,
      params.numberOfMonths,
      gridLabelIds,
      state,
    ],
  );

  return { stableCtx, stateCtx, state };
}
