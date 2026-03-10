import type { Temporal } from "@js-temporal/polyfill";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useDatePicker } from "./context";
import { computeNextFocusDate } from "./keyboard";
import type {
  DatePickerContextValue,
  DateRange,
  DateValueObject,
  GridHeaderCellState,
  NavButtonState,
  RawValueForFormat,
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
  getWeekdayNames,
  resolveFocusTarget,
  selectedToZdt,
  toZonedDateTime,
} from "./utils";

interface UseRootStateParams<F extends ValueFormat> {
  format: F;
  selectionMode: "single" | "range";
  value?: RawValueForFormat<F> | DateRange<F>;
  defaultValue?: RawValueForFormat<F> | DateRange<F>;
  onValueChange?:
    | ((value: RawValueForFormat<F> | undefined) => void)
    | ((value: DateRange<F> | undefined) => void);
  min?: RawValueForFormat<F>;
  max?: RawValueForFormat<F>;
  disabled: boolean;
  isDateDisabled?: (date: Temporal.PlainDate) => boolean;
  timeZone: string;
  locale: string;
  temporal: TemporalNamespace;
}

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
    isDateDisabled: isDateDisabledProp,
    timeZone,
    locale,
    temporal: T,
  } = params;

  const disabled = disabledProp ?? false;
  const isRange = selectionMode === "range";

  const singleValue: RawValueForFormat<F> | undefined = isRange
    ? undefined
    : (valueProp as RawValueForFormat<F> | undefined);
  const singleDefault: RawValueForFormat<F> | undefined = isRange
    ? undefined
    : (defaultValueProp as RawValueForFormat<F> | undefined);

  const rangeValue: DateRange<F> | undefined =
    isRange && valueProp != null && isDateRange<F>(valueProp)
      ? valueProp
      : undefined;
  const rangeDefault: DateRange<F> | undefined =
    isRange && defaultValueProp != null && isDateRange<F>(defaultValueProp)
      ? defaultValueProp
      : undefined;

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

  type RangePair =
    | { start: Temporal.PlainDate; end: Temporal.PlainDate }
    | undefined;

  const controlledRange = useMemo<RangePair>(() => {
    if (rangeValue)
      return {
        start: rawToPlain(rangeValue.start),
        end: rawToPlain(rangeValue.end),
      };
    if (singleValue != null) {
      const d = rawToPlain(singleValue);
      return { start: d, end: d };
    }
    return undefined;
  }, [rangeValue, singleValue, rawToPlain]);

  const defaultRange = useMemo<RangePair>(() => {
    if (rangeDefault)
      return {
        start: rawToPlain(rangeDefault.start),
        end: rawToPlain(rangeDefault.end),
      };
    if (singleDefault != null) {
      const d = rawToPlain(singleDefault);
      return { start: d, end: d };
    }
    return undefined;
  }, [rangeDefault, singleDefault, rawToPlain]);

  const [internalRange, setInternalRange] = useState<RangePair>(defaultRange);

  const isControlled = isRange ? rangeValue != null : singleValue != null;
  const committed = isControlled ? controlledRange : internalRange;

  const rangeStart = committed?.start;
  const rangeEnd = committed?.end;
  const committedStart = rangeStart;
  const committedEnd = rangeEnd;

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
    return undefined;
  }, [taggedValue, taggedDefault, rangeValue, rangeDefault, resolvedFormat]);

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
    if (!rangeStart) return undefined;
    const zdt = rangeStart
      .toPlainDateTime({ hour: 0, minute: 0, second: 0 })
      .toZonedDateTime(timeZone);
    return fromZonedDateTime(zdt, resolvedFormat, T);
  }, [taggedValue, rangeStart, timeZone, resolvedFormat, T]);

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
    if (isRange) return;
    const start = committedStart;
    if (!start) return;
    const outOfBounds =
      (minValue && T.PlainDate.compare(start, minValue) < 0) ||
      (maxValue && T.PlainDate.compare(start, maxValue) > 0);
    if (outOfBounds) {
      if (!isControlled) {
        setInternalRange(undefined);
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
  ]);

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

  const onSelect = useCallback(
    (date: Temporal.PlainDate) => {
      if (isDateDisabled(date)) return;

      let newStart: Temporal.PlainDate;
      let newEnd: Temporal.PlainDate;

      if (isRange && committedStart && committedEnd) {
        const beforeStart = T.PlainDate.compare(date, committedStart) < 0;
        const afterEnd = T.PlainDate.compare(date, committedEnd) > 0;

        if (beforeStart) {
          newStart = date;
          newEnd = committedEnd;
        } else if (afterEnd) {
          newStart = committedStart;
          newEnd = date;
        } else {
          newStart = date;
          newEnd = date;
        }
      } else {
        newStart = date;
        newEnd = date;
      }

      if (!isControlled) {
        setInternalRange({ start: newStart, end: newEnd });
      }
      setCurrentMonth({ year: date.year, month: date.month });

      if (isRange) {
        (
          onValueChange as ((v: DateRange<F> | undefined) => void) | undefined
        )?.({
          start: plainToFormatValue(newStart),
          end: plainToFormatValue(newEnd),
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
      isControlled,
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
    ],
  );

  const setRange = useCallback(
    (start: Temporal.PlainDate, end: Temporal.PlainDate) => {
      const effectiveEnd = isRange ? end : start;
      if (!isControlled) {
        setInternalRange({ start, end: effectiveEnd });
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
    () => getMonthWeeks(currentMonth.year, currentMonth.month, T),
    [currentMonth.year, currentMonth.month, T],
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
      hasSelection: isRange ? !!(rangeStart && rangeEnd) : !!selected,
      selected: rawSelected,
      rangeStart: rawRangeStart,
      rangeEnd: rawRangeEnd,
      focused: focusedDate,
      viewing: viewingYearMonth,
      timeZone,
      locale,
    }),
    [
      selected,
      rawSelected,
      rawRangeStart,
      rawRangeEnd,
      focusedDate,
      viewingYearMonth,
      timeZone,
      locale,
      isRange,
      rangeStart,
      rangeEnd,
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

  const ctx = useMemo<DatePickerContextValue>(
    () => ({
      selected,
      onSelect,
      setRange,
      selectionMode,
      rangeStart,
      rangeEnd,
      currentDateTime,
      goToNextMonth,
      goToPrevMonth,
      weeks,
      disabled,
      isDateDisabled,
      minValue,
      maxValue,
      focusedDate,
      tabTargetDate,
      setFocusedDate,
      gridFocusedRef,
      setGridHasFocus,
      timeZone,
      locale,
      temporal: T,
      gridLabelId,
      setGridLabelId,
      rootState: state as unknown as RootState,
    }),
    [
      selected,
      onSelect,
      setRange,
      selectionMode,
      rangeStart,
      rangeEnd,
      currentDateTime,
      goToNextMonth,
      goToPrevMonth,
      weeks,
      disabled,
      isDateDisabled,
      minValue,
      maxValue,
      focusedDate,
      tabTargetDate,
      timeZone,
      locale,
      T,
      gridLabelId,
      state,
    ],
  );

  return { ctx, state };
}

export function useNavButton<F extends ValueFormat = ValueFormat>(
  direction: "prev" | "next",
) {
  const {
    goToPrevMonth,
    goToNextMonth,
    currentDateTime,
    disabled: globalDisabled,
    minValue,
    maxValue,
    locale,
    temporal: T,
    rootState,
  } = useDatePicker<F>();

  const destMonth =
    direction === "prev"
      ? currentDateTime.month === 1
        ? 12
        : currentDateTime.month - 1
      : currentDateTime.month === 12
        ? 1
        : currentDateTime.month + 1;

  const destYear =
    direction === "prev"
      ? currentDateTime.month === 1
        ? currentDateTime.year - 1
        : currentDateTime.year
      : currentDateTime.month === 12
        ? currentDateTime.year + 1
        : currentDateTime.year;

  const boundValue = direction === "prev" ? minValue : maxValue;

  const isDisabled = useMemo(() => {
    if (globalDisabled) return true;
    if (!boundValue) return false;
    if (direction === "prev") {
      return (
        destYear < boundValue.year ||
        (destYear === boundValue.year && destMonth < boundValue.month)
      );
    }
    return (
      destYear > boundValue.year ||
      (destYear === boundValue.year && destMonth > boundValue.month)
    );
  }, [globalDisabled, destYear, destMonth, boundValue, direction]);

  const localeCalendar = useMemo(() => calendarForLocale(locale), [locale]);

  const target = useMemo(
    () =>
      T.PlainYearMonth.from({
        year: destYear,
        month: destMonth,
        calendar: localeCalendar,
      }),
    [destYear, destMonth, T, localeCalendar],
  );

  const state = useMemo<NavButtonState<F>>(
    () => ({ root: rootState, direction, disabled: isDisabled, target }),
    [rootState, direction, isDisabled, target],
  );

  const goFn = direction === "prev" ? goToPrevMonth : goToNextMonth;

  const defaultProps: Record<string, unknown> = {
    type: "button",
    "aria-label": `Go to ${direction === "prev" ? "previous" : "next"} month`,
    disabled: isDisabled,
    onClick: isDisabled ? undefined : goFn,
  };

  return { state, defaultProps };
}

export function useGridKeyboard() {
  const {
    focusedDate,
    setFocusedDate,
    onSelect,
    disabled,
    isDateDisabled,
    minValue,
    maxValue,
    temporal: T,
  } = useDatePicker();

  return useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const result = computeNextFocusDate({
        key: e.key,
        shiftKey: e.shiftKey,
        focusedDate,
        minValue,
        maxValue,
        disabled,
        isDateDisabled,
        T,
      });

      if (result.action === "move") {
        e.preventDefault();
        setFocusedDate(result.date);
      } else if (result.action === "select") {
        e.preventDefault();
        onSelect(focusedDate);
      }
    },
    [
      focusedDate,
      setFocusedDate,
      onSelect,
      disabled,
      isDateDisabled,
      minValue,
      maxValue,
      T,
    ],
  );
}

export function useGridHeaderCellState<F extends ValueFormat = ValueFormat>(
  index: number,
) {
  const { locale, temporal: T, rootState } = useDatePicker<F>();

  const weekdayNames = useMemo(() => getWeekdayNames(locale, T), [locale, T]);

  const state = useMemo<GridHeaderCellState<F>>(
    () => ({
      root: rootState,
      dayOfWeek: index,
      long: weekdayNames[index].long,
      short: weekdayNames[index].short,
      narrow: weekdayNames[index].narrow,
    }),
    [rootState, index, weekdayNames],
  );

  const defaultProps: Record<string, unknown> = {
    scope: "col",
    abbr: state.long,
    "aria-label": state.long,
    children: state.narrow,
  };

  return { state, defaultProps };
}
