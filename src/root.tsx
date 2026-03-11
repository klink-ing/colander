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
  ValueChangeMeta,
  WeekStartDay,
  InsideRangeAction,
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
  weekStartDay: WeekStartDay;
  fixedWeeks: boolean;
  onMonthChange?: (month: Temporal.PlainYearMonth) => void;
}

type UseRootStateParams<F extends ValueFormat> = UseRootStateParamsBase<F> &
  (
    | {
        selectionMode: "single";
        value?: RawValueForFormat<F> | null;
        defaultValue?: RawValueForFormat<F>;
        onValueChange?: (
          value: RawValueForFormat<F> | null,
          meta: ValueChangeMeta<RawValueForFormat<F> | null>,
        ) => void;
      }
    | {
        selectionMode: "range";
        value?: DateRange<F> | null;
        defaultValue?: DateRange<F>;
        onValueChange?: (
          value: DateRange<F> | null,
          meta: ValueChangeMeta<DateRange<F> | null>,
        ) => void;
        insideRangeAction?: InsideRangeAction;
      }
    | {
        selectionMode: "multiple";
        value?: RawValueForFormat<F>[] | null;
        defaultValue?: RawValueForFormat<F>[];
        onValueChange?: (
          value: RawValueForFormat<F>[],
          meta: ValueChangeMeta<RawValueForFormat<F>[]>,
        ) => void;
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

/** Resolve nearest-* variants to a concrete "start" | "end" | "reset" action. */
function resolveInsideAction(
  action: InsideRangeAction,
  date: Temporal.PlainDate,
  start: Temporal.PlainDate,
  end: Temporal.PlainDate,
): "start" | "end" | "reset" {
  if (action === "start" || action === "end" || action === "reset")
    return action;

  // nearest-start or nearest-end: compare distance to each boundary
  const daysFromStart = Math.abs(date.since(start).days);
  const daysFromEnd = Math.abs(date.since(end).days);

  if (daysFromStart < daysFromEnd) return "start";
  if (daysFromEnd < daysFromStart) return "end";
  // Tie: use the suffix
  return action === "nearest-start" ? "start" : "end";
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
    setInternalDates((prev) => {
      const clamped = prev.slice(0, maxDatesForMode);
      if (clamped.length === prev.length) return prev;

      // Build "previous" from pre-clamped state (mode just changed, so
      // we approximate as the new mode's shape from prev dates).
      const noDate = { date: undefined };

      // Fire callback with truncated value
      if (selectionMode === "single") {
        const prevVal =
          prev.length > 0 ? plainToFormatValue(prev[0]) : null;
        const newVal =
          clamped.length > 0 ? plainToFormatValue(clamped[0]) : null;
        (
          onValueChange as
            | ((
                v: RawValueForFormat<F> | null,
                m: ValueChangeMeta<RawValueForFormat<F> | null>,
              ) => void)
            | undefined
        )?.(newVal, { ...noDate, previous: prevVal });
      } else if (selectionMode === "range") {
        const prevRange: DateRange<F> | null =
          prev.length >= 2
            ? {
                start: plainToFormatValue(prev[0]),
                end: plainToFormatValue(prev[1]),
              }
            : null;
        let newRange: DateRange<F> | null = null;
        if (clamped.length >= 2) {
          newRange = {
            start: plainToFormatValue(clamped[0]),
            end: plainToFormatValue(clamped[1]),
          };
        } else if (clamped.length === 1) {
          newRange = {
            start: plainToFormatValue(clamped[0]),
            end: plainToFormatValue(clamped[0]),
          };
        }
        (
          onValueChange as
            | ((
                v: DateRange<F> | null,
                m: ValueChangeMeta<DateRange<F> | null>,
              ) => void)
            | undefined
        )?.(newRange, { ...noDate, previous: prevRange });
      } else {
        const prevArr = prev.map(plainToFormatValue);
        (
          onValueChange as
            | ((
                v: RawValueForFormat<F>[],
                m: ValueChangeMeta<RawValueForFormat<F>[]>,
              ) => void)
            | undefined
        )?.(clamped.map(plainToFormatValue), {
          ...noDate,
          previous: prevArr,
        });
      }
      return clamped;
    });
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
      if (readOnly) return;
      if (isDateDisabled(date)) return;

      if (isMultiple) {
        const prevArr = currentMultipleFormatted();
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
        setInternalDates(newDates);
        (
          onValueChange as
            | ((
                v: RawValueForFormat<F>[],
                m: ValueChangeMeta<RawValueForFormat<F>[]>,
              ) => void)
            | undefined
        )?.(newDates.map(plainToFormatValue), {
          date,
          previous: prevArr,
        });
        return;
      }

      let newDates: Temporal.PlainDate[];

      if (isRange && committedStart && committedEnd) {
        const prevRange = currentRangeFormatted();
        const isSingleDay =
          T.PlainDate.compare(committedStart, committedEnd) === 0;

        if (isSingleDay && T.PlainDate.compare(date, committedStart) === 0) {
          // Clicking the single selected date clears the range.
          // Always clear internalDates so stale state doesn't resurface
          // if the component drops from controlled to uncontrolled.
          setInternalDates([]);
          (
            onValueChange as
              | ((
                  v: DateRange<F> | null,
                  m: ValueChangeMeta<DateRange<F> | null>,
                ) => void)
              | undefined
          )?.(null, { date, previous: prevRange });
          return;
        }

        const beforeStart = T.PlainDate.compare(date, committedStart) < 0;
        const afterEnd = T.PlainDate.compare(date, committedEnd) > 0;

        if (beforeStart) {
          newDates = [date, committedEnd];
        } else if (afterEnd) {
          newDates = [committedStart, date];
        } else {
          // Date is inside the range — apply insideRangeAction
          const action = resolveInsideAction(
            insideRangeAction,
            date,
            committedStart,
            committedEnd,
          );
          if (action === "start") {
            newDates = [date, committedEnd];
          } else if (action === "end") {
            newDates = [committedStart, date];
          } else {
            newDates = [date, date];
          }
        }

        setInternalDates(newDates);
        setCurrentMonth({ year: date.year, month: date.month });
        (
          onValueChange as
            | ((
                v: DateRange<F> | null,
                m: ValueChangeMeta<DateRange<F> | null>,
              ) => void)
            | undefined
        )?.({
          start: plainToFormatValue(newDates[0]),
          end: plainToFormatValue(newDates[1]),
        }, { date, previous: prevRange });
        return;
      }

      if (isRange) {
        const prevRange = currentRangeFormatted();
        newDates = [date, date];
        setInternalDates(newDates);
        setCurrentMonth({ year: date.year, month: date.month });
        (
          onValueChange as
            | ((
                v: DateRange<F> | null,
                m: ValueChangeMeta<DateRange<F> | null>,
              ) => void)
            | undefined
        )?.({
          start: plainToFormatValue(newDates[0]),
          end: plainToFormatValue(newDates[1]),
        }, { date, previous: prevRange });
        return;
      }

      // Single mode
      const prevSingle = currentSingleFormatted();
      newDates = [date];
      setInternalDates(newDates);
      setCurrentMonth({ year: date.year, month: date.month });

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
        onValueChange as
          | ((
              v: DateValueObject["value"],
              m: ValueChangeMeta<RawValueForFormat<F> | null>,
            ) => void)
          | undefined
      )?.(newTagged.value, { date, previous: prevSingle });
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
    ],
  );

  const setRange = useCallback(
    (start: Temporal.PlainDate, end: Temporal.PlainDate) => {
      if (readOnly || isMultiple) return;
      // Normalize so start <= end
      const [lo, hi] =
        T.PlainDate.compare(start, end) <= 0
          ? [start, end]
          : [end, start];
      const effectiveEnd = isRange ? hi : lo;
      setInternalDates(
        isRange ? [lo, effectiveEnd] : [lo],
      );
      if (isRange) {
        const prevRange = currentRangeFormatted();
        (
          onValueChange as
            | ((
                v: DateRange<F> | null,
                m: ValueChangeMeta<DateRange<F> | null>,
              ) => void)
            | undefined
        )?.({
          start: plainToFormatValue(lo),
          end: plainToFormatValue(effectiveEnd),
        }, { date: undefined, previous: prevRange });
      } else {
        const prevSingle = currentSingleFormatted();
        const zdt = lo
          .toPlainDateTime({ hour: 0, minute: 0, second: 0 })
          .toZonedDateTime(timeZone);
        const tagged = fromZonedDateTime(zdt, resolvedFormat, T);
        (
          onValueChange as
            | ((
                v: DateValueObject["value"],
                m: ValueChangeMeta<RawValueForFormat<F> | null>,
              ) => void)
            | undefined
        )?.(tagged.value, { date: undefined, previous: prevSingle });
      }
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
    insideRangeAction,
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
    ...(selectionMode === "range" ? { insideRangeAction } : {}),
  } as UseRootStateParams<F>);

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
