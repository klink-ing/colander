import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { Temporal } from "@js-temporal/polyfill";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StateAttributesMapping } from "node_modules/@base-ui/react/esm/utils/getStateAttributesProps";
import {
  DatePickerStableContext,
  DatePickerStateContext,
} from "./context";
import type {
  DatePickerStableContextValue,
  DatePickerStateContextValue,
  DateRange,
  DateValueObject,
  RawValueForFormat,
  RootProps,
  RootState,
  TemporalNamespace,
  ValueFormat,
} from "./types";
import {
  calendarForLocale,
  computeAdjacentMonth,
  focusedDateForMonth,
  fromZonedDateTime,
  getMonthWeeks,
  getSystemTimeZone,
  resolveFocusTarget,
  resolveTemporal,
  selectedToZdt,
  toZonedDateTime,
} from "./utils";

interface UseRootStateParamsBase<F extends ValueFormat> {
  format: F;
  min?: RawValueForFormat<F>;
  max?: RawValueForFormat<F>;
  disabled: boolean;
  readOnly: boolean;
  isDateDisabled?: (date: Temporal.PlainDate) => boolean;
  timeZone: string;
  locale: string;
  temporal: TemporalNamespace;
  weekStartDay: number;
  fixedWeeks: boolean;
  onMonthChange?: (month: Temporal.PlainYearMonth) => void;
}

type UseRootStateParams<F extends ValueFormat> = UseRootStateParamsBase<F> &
  (
    | {
        selectionMode: "single";
        value?: RawValueForFormat<F>;
        defaultValue?: RawValueForFormat<F>;
        onValueChange?: (value: RawValueForFormat<F> | undefined) => void;
      }
    | {
        selectionMode: "range";
        value?: DateRange<F>;
        defaultValue?: DateRange<F>;
        onValueChange?: (value: DateRange<F> | undefined) => void;
      }
    | {
        selectionMode: "multiple";
        value?: RawValueForFormat<F>[];
        defaultValue?: RawValueForFormat<F>[];
        onValueChange?: (value: RawValueForFormat<F>[]) => void;
      }
  );

function isDateRange<F extends ValueFormat>(
  v: RawValueForFormat<F> | DateRange<F>,
): v is DateRange<F> {
  return v != null && typeof v === "object" && "start" in v && "end" in v;
}

function tagRaw<F extends ValueFormat>(
  raw: RawValueForFormat<F> | undefined,
  format: ValueFormat,
): DateValueObject | undefined {
  if (raw == null) return undefined;
  return { format, value: raw } as DateValueObject;
}

function useRootState<F extends ValueFormat>(params: UseRootStateParams<F>) {
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

  const disabled = disabledProp ?? false;
  const readOnly = readOnlyProp ?? false;
  const isRange = selectionMode === "range";
  const isMultiple = selectionMode === "multiple";

  const singleValue: RawValueForFormat<F> | undefined =
    !isRange && !isMultiple
      ? (valueProp as RawValueForFormat<F> | undefined)
      : undefined;
  const singleDefault: RawValueForFormat<F> | undefined =
    !isRange && !isMultiple
      ? (defaultValueProp as RawValueForFormat<F> | undefined)
      : undefined;

  const rangeValue: DateRange<F> | undefined =
    isRange && valueProp != null && isDateRange<F>(valueProp as any)
      ? (valueProp as DateRange<F>)
      : undefined;
  const rangeDefault: DateRange<F> | undefined =
    isRange && defaultValueProp != null && isDateRange<F>(defaultValueProp as any)
      ? (defaultValueProp as DateRange<F>)
      : undefined;

  const multipleValue: RawValueForFormat<F>[] | undefined =
    isMultiple && Array.isArray(valueProp) ? valueProp : undefined;
  const multipleDefault: RawValueForFormat<F>[] | undefined =
    isMultiple && Array.isArray(defaultValueProp) ? defaultValueProp : undefined;

  const taggedValue = useMemo(
    () => tagRaw(singleValue, resolvedFormat),
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
      if (multipleValue)
        return sortDates(multipleValue.map(rawToPlain));
      return undefined;
    }
    if (rangeValue)
      return [rawToPlain(rangeValue.start), rawToPlain(rangeValue.end)];
    if (singleValue != null) return [rawToPlain(singleValue)];
    return undefined;
  }, [
    isMultiple,
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

  const isControlled = isMultiple
    ? multipleValue != null
    : isRange
      ? rangeValue != null
      : singleValue != null;
  const committedDates = isControlled
    ? (controlledDates ?? [])
    : internalDates;

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

  // Auto-truncate internal dates when selection mode changes
  const prevModeRef = useRef(selectionMode);
  useEffect(() => {
    if (prevModeRef.current === selectionMode) return;
    prevModeRef.current = selectionMode;
    setInternalDates((prev) => {
      const clamped = prev.slice(0, maxDatesForMode);
      if (clamped.length === prev.length) return prev;
      // Fire callback with truncated value
      if (selectionMode === "single") {
        (
          onValueChange as
            | ((v: RawValueForFormat<F> | undefined) => void)
            | undefined
        )?.(clamped.length > 0 ? plainToFormatValue(clamped[0]) : undefined);
      } else if (selectionMode === "range") {
        if (clamped.length >= 2) {
          (
            onValueChange as
              | ((v: DateRange<F> | undefined) => void)
              | undefined
          )?.({
            start: plainToFormatValue(clamped[0]),
            end: plainToFormatValue(clamped[1]),
          });
        } else if (clamped.length === 1) {
          (
            onValueChange as
              | ((v: DateRange<F> | undefined) => void)
              | undefined
          )?.({
            start: plainToFormatValue(clamped[0]),
            end: plainToFormatValue(clamped[0]),
          });
        } else {
          (
            onValueChange as
              | ((v: DateRange<F> | undefined) => void)
              | undefined
          )?.(undefined);
        }
      } else {
        (
          onValueChange as
            | ((v: RawValueForFormat<F>[]) => void)
            | undefined
        )?.(clamped.map(plainToFormatValue));
      }
      return clamped;
    });
  });

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

  const [gridLabelId, setGridLabelId] = useState<string | undefined>(undefined);
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

  useEffect(() => {
    if (taggedValue) {
      const zdt = toZonedDateTime(taggedValue, timeZone, T);
      setCurrentMonth({ year: zdt.year, month: zdt.month });
    }
  }, [taggedValue, timeZone, T]);

  useEffect(() => {
    setCurrentMonth((prev) => {
      if (focusedDate.year !== prev.year || focusedDate.month !== prev.month) {
        return { year: focusedDate.year, month: focusedDate.month };
      }
      return prev;
    });
  }, [focusedDate]);

  useEffect(() => {
    if (isRange || isMultiple) return;
    const start = committedStart;
    if (!start) return;
    const outOfBounds =
      (minValue && T.PlainDate.compare(start, minValue) < 0) ||
      (maxValue && T.PlainDate.compare(start, maxValue) > 0);
    if (outOfBounds) {
      if (!isControlled) {
        setInternalDates([]);
      }
      (
        onValueChange as
          | ((v: RawValueForFormat<F> | undefined) => void)
          | undefined
      )?.(undefined);
    }
  }, [
    minValue,
    maxValue,
    committedStart,
    isControlled,
    onValueChange,
    T,
    isRange,
    isMultiple,
  ]);

  const onSelect = useCallback(
    (date: Temporal.PlainDate) => {
      if (readOnly) return;
      if (isDateDisabled(date)) return;

      if (isMultiple) {
        const idx = committedDates.findIndex(
          (d) => T.PlainDate.compare(d, date) === 0,
        );
        let newDates: Temporal.PlainDate[];
        if (idx >= 0) {
          newDates = [
            ...committedDates.slice(0, idx),
            ...committedDates.slice(idx + 1),
          ];
        } else {
          newDates = sortDates([...committedDates, date]);
        }
        if (!isControlled) setInternalDates(newDates);
        (
          onValueChange as
            | ((v: RawValueForFormat<F>[]) => void)
            | undefined
        )?.(newDates.map(plainToFormatValue));
        return;
      }

      let newDates: Temporal.PlainDate[];

      if (isRange && committedStart && committedEnd) {
        const beforeStart = T.PlainDate.compare(date, committedStart) < 0;
        const afterEnd = T.PlainDate.compare(date, committedEnd) > 0;

        if (beforeStart) {
          newDates = [date, committedEnd];
        } else if (afterEnd) {
          newDates = [committedStart, date];
        } else {
          newDates = [date, date];
        }
      } else if (isRange) {
        newDates = [date, date];
      } else {
        newDates = [date];
      }

      if (!isControlled) {
        setInternalDates(newDates);
      }
      setCurrentMonth({ year: date.year, month: date.month });

      if (isRange) {
        (
          onValueChange as ((v: DateRange<F> | undefined) => void) | undefined
        )?.({
          start: plainToFormatValue(newDates[0]),
          end: plainToFormatValue(newDates[1]),
        });
      } else {
        const prevTime = selectedZdt
          ? {
              hour: selectedZdt.hour,
              minute: selectedZdt.minute,
              second: selectedZdt.second,
            }
          : { hour: 0, minute: 0, second: 0 };
        const newZdt = date.toPlainDateTime(prevTime).toZonedDateTime(timeZone);
        const newTagged = fromZonedDateTime(newZdt, resolvedFormat, T);
        (
          onValueChange as ((v: DateValueObject["value"]) => void) | undefined
        )?.(newTagged.value);
      }
    },
    [
      readOnly,
      isControlled,
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
    ],
  );

  const setRange = useCallback(
    (start: Temporal.PlainDate, end: Temporal.PlainDate) => {
      if (readOnly || isMultiple) return;
      const effectiveEnd = isRange ? end : start;
      if (!isControlled) {
        setInternalDates(
          isRange ? [start, effectiveEnd] : [start],
        );
      }
      if (isRange) {
        (
          onValueChange as ((v: DateRange<F> | undefined) => void) | undefined
        )?.({
          start: plainToFormatValue(start),
          end: plainToFormatValue(effectiveEnd),
        });
      } else {
        const zdt = start
          .toPlainDateTime({ hour: 0, minute: 0, second: 0 })
          .toZonedDateTime(timeZone);
        const tagged = fromZonedDateTime(zdt, resolvedFormat, T);
        (
          onValueChange as ((v: DateValueObject["value"]) => void) | undefined
        )?.(tagged.value);
      }
    },
    [
      readOnly,
      isMultiple,
      isControlled,
      isRange,
      onValueChange,
      plainToFormatValue,
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

  const weeks = useMemo(
    () =>
      getMonthWeeks(currentMonth.year, currentMonth.month, T, {
        weekStartDay: params.weekStartDay,
        fixedWeeks: params.fixedWeeks,
      }),
    [currentMonth.year, currentMonth.month, T, params.weekStartDay, params.fixedWeeks],
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
    }),
    [
      onSelect,
      setRange,
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
      gridLabelId,
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
      gridLabelId,
      state,
    ],
  );

  return { stableCtx, stateCtx, state };
}

const rootStateAttributesMapping = {
  hasSelection: (v) => (v ? { "data-has-selection": "" } : null),
  selected: () => null,
  selectedDates: () => null,
  rangeStart: () => null,
  rangeEnd: () => null,
  focused: () => null,
  viewing: () => null,
  timeZone: () => null,
  locale: () => null,
  readOnly: (v) => (v ? { "data-readonly": "" } : null),
} as const satisfies StateAttributesMapping<RootState>;

/**
 * Top-level container for the DatePicker. Provides all calendar state
 * (selected value, focused date, navigation, range, etc.) to descendants
 * via React context.
 *
 * Renders a `<div>` by default. Exposes `data-has-selection` when a value
 * is selected.
 */
export function Root<F extends ValueFormat = ValueFormat>(props: RootProps<F>) {
  const {
    ref,
    render,
    children,
    format: formatProp,
    selectionMode: selectionModeProp,
    value,
    defaultValue,
    onValueChange,
    min,
    max,
    disabled,
    readOnly,
    isDateDisabled,
    timeZone: timeZoneProp,
    locale: localeProp,
    temporal: temporalProp,
    weekStartDay: weekStartDayProp,
    fixedWeeks: fixedWeeksProp,
    onMonthChange,
    ...otherProps
  } = props as any;
  const T = useMemo(() => resolveTemporal(temporalProp), [temporalProp]);
  const timeZone = timeZoneProp ?? getSystemTimeZone(T);
  const locale = localeProp ?? "en-US";
  const resolvedFormat: ValueFormat = formatProp ?? "PlainDate";
  const selectionMode = selectionModeProp ?? "single";

  const { stableCtx, stateCtx, state } = useRootState<F>({
    format: resolvedFormat as F,
    selectionMode,
    value,
    defaultValue,
    onValueChange,
    min,
    max,
    disabled: disabled ?? false,
    readOnly: readOnly ?? false,
    isDateDisabled,
    timeZone,
    locale,
    temporal: T,
    weekStartDay: weekStartDayProp ?? 0,
    fixedWeeks: fixedWeeksProp ?? false,
    onMonthChange,
  });

  const rendered = useRender({
    defaultTagName: "div",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping: rootStateAttributesMapping,
    props: mergeProps<"div">(
      { children, ...(disabled ? { "aria-disabled": true } : {}) },
      otherProps,
    ),
  });

  return (
    <DatePickerStableContext.Provider value={stableCtx}>
      <DatePickerStateContext.Provider value={stateCtx}>
        {rendered}
      </DatePickerStateContext.Provider>
    </DatePickerStableContext.Provider>
  );
}
