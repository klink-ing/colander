import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  type KeyboardEvent,
} from "react";
import type { Temporal } from "@js-temporal/polyfill";
import { computeNextFocusDate } from "./keyboard";
import type {
  TemporalNamespace,
  DateValueObject,
  ValueFormat,
  RawValueForFormat,
  DateRange,
  DatePickerContextValue,
  RootState,
  NavButtonState,
  DayCellTemplateState,
  DayButtonState,
  GridHeaderCellState,
} from "./types";
import { useDatePicker } from "./context";
import {
  calendarForLocale,
  toZonedDateTime,
  fromZonedDateTime,
  selectedToZdt,
  getMonthWeeks,
  sameCalendarDay,
  getWeekdayNames,
  computeAdjacentMonth,
  focusedDateForMonth,
  resolveFocusTarget,
  shouldMoveDomFocus,
  isInRange as isInRangeUtil,
} from "./utils";

interface UseRootStateParams<F extends ValueFormat> {
  format: F;
  selectionMode: "single" | "range";
  value?: RawValueForFormat<F> | DateRange<F>;
  defaultValue?: RawValueForFormat<F> | DateRange<F>;
  onValueChange?: ((value: RawValueForFormat<F> | undefined) => void) | ((value: DateRange<F> | undefined) => void);
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

  const [internalSelected, setInternalSelected] = useState<
    DateValueObject | undefined
  >(() => taggedDefault);

  const rangeToPlain = useCallback(
    (raw: RawValueForFormat<F>): Temporal.PlainDate => {
      const tagged = { format: resolvedFormat, value: raw } as DateValueObject;
      return toZonedDateTime(tagged, timeZone, T).toPlainDate();
    },
    [resolvedFormat, timeZone, T],
  );

  const controlledRangeStart = useMemo(
    () => (rangeValue ? rangeToPlain(rangeValue.start) : undefined),
    [rangeValue, rangeToPlain],
  );
  const controlledRangeEnd = useMemo(
    () => (rangeValue ? rangeToPlain(rangeValue.end) : undefined),
    [rangeValue, rangeToPlain],
  );

  const defaultRangeStart = useMemo(
    () => (rangeDefault ? rangeToPlain(rangeDefault.start) : undefined),
    [rangeDefault, rangeToPlain],
  );
  const defaultRangeEnd = useMemo(
    () => (rangeDefault ? rangeToPlain(rangeDefault.end) : undefined),
    [rangeDefault, rangeToPlain],
  );

  const [internalRangeStart, setInternalRangeStart] = useState<
    Temporal.PlainDate | undefined
  >(defaultRangeStart);
  const [internalRangeEnd, setInternalRangeEnd] = useState<
    Temporal.PlainDate | undefined
  >(defaultRangeEnd);

  const [pendingRangeStart, setPendingRangeStart] = useState<
    Temporal.PlainDate | undefined
  >(undefined);

  const committedStart = rangeValue ? controlledRangeStart : internalRangeStart;
  const committedEnd = rangeValue ? controlledRangeEnd : internalRangeEnd;

  const rangeStart = pendingRangeStart ?? committedStart;
  const rangeEnd = pendingRangeStart ? undefined : committedEnd;

  const initSrc = isRange
    ? rangeValue
      ? { format: resolvedFormat, value: rangeValue.start } as DateValueObject
      : rangeDefault
        ? { format: resolvedFormat, value: rangeDefault.start } as DateValueObject
        : undefined
    : undefined;

  const [currentMonth, setCurrentMonth] = useState<{
    year: number;
    month: number;
  }>(() => {
    const src = taggedValue ?? taggedDefault ?? initSrc;
    const init = src
      ? toZonedDateTime(src, timeZone, T)
      : T.Now.zonedDateTimeISO(timeZone);
    return { year: init.year, month: init.month };
  });

  const [gridLabelId, setGridLabelId] = useState<string | undefined>(undefined);
  const gridFocusedRef = useRef(false);
  const [gridHasFocus, setGridHasFocus] = useState(false);

  const [focusedDate, setFocusedDate] = useState<Temporal.PlainDate>(() => {
    const src = taggedValue ?? taggedDefault ?? initSrc;
    if (src) {
      return toZonedDateTime(src, timeZone, T).toPlainDate();
    }
    return T.Now.plainDateISO();
  });

  const selected: DateValueObject | undefined = useMemo(() => {
    if (taggedValue) return taggedValue;
    return internalSelected;
  }, [taggedValue, internalSelected]);

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
    if (!selected || isRange) return;
    const selPlain = toZonedDateTime(selected, timeZone, T).toPlainDate();
    const outOfBounds =
      (minValue && T.PlainDate.compare(selPlain, minValue) < 0) ||
      (maxValue && T.PlainDate.compare(selPlain, maxValue) > 0);
    if (outOfBounds) {
      if (!singleValue) {
        setInternalSelected(undefined);
      }
      (onValueChange as ((v: RawValueForFormat<F> | undefined) => void) | undefined)?.(undefined);
    }
  }, [minValue, maxValue, selected, singleValue, onValueChange, timeZone, T, isRange]);

  const plainToFormatValue = useCallback(
    (plain: Temporal.PlainDate): RawValueForFormat<F> => {
      const zdt = plain.toPlainDateTime({ hour: 0, minute: 0, second: 0 }).toZonedDateTime(timeZone);
      return fromZonedDateTime(zdt, resolvedFormat, T).value as RawValueForFormat<F>;
    },
    [resolvedFormat, timeZone, T],
  );

  const onSelect = useCallback(
    (date: Temporal.PlainDate) => {
      if (isDateDisabled(date)) return;

      if (isRange) {
        const onRangeChange = onValueChange as ((v: DateRange<F> | undefined) => void) | undefined;

        if (pendingRangeStart) {
          let newStart = pendingRangeStart;
          let newEnd = date;
          if (T.PlainDate.compare(newEnd, newStart) < 0) {
            [newStart, newEnd] = [newEnd, newStart];
          }
          setPendingRangeStart(undefined);
          if (!rangeValue) {
            setInternalRangeStart(newStart);
            setInternalRangeEnd(newEnd);
          }
          onRangeChange?.({
            start: plainToFormatValue(newStart),
            end: plainToFormatValue(newEnd),
          });
        } else {
          setPendingRangeStart(date);
          if (!rangeValue) {
            setInternalRangeEnd(undefined);
          }
        }
        return;
      }

      const prevTime = selectedZdt
        ? {
            hour: selectedZdt.hour,
            minute: selectedZdt.minute,
            second: selectedZdt.second,
          }
        : { hour: 0, minute: 0, second: 0 };
      const newZdt = date.toPlainDateTime(prevTime).toZonedDateTime(timeZone);
      const newTagged = fromZonedDateTime(newZdt, resolvedFormat, T);
      if (!singleValue) setInternalSelected(newTagged);
      setCurrentMonth({ year: date.year, month: date.month });
      (onValueChange as ((v: DateValueObject["value"]) => void) | undefined)?.(
        newTagged.value,
      );
    },
    [
      singleValue,
      rangeValue,
      selectedZdt,
      onValueChange,
      resolvedFormat,
      isDateDisabled,
      timeZone,
      T,
      isRange,
      pendingRangeStart,
      plainToFormatValue,
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
    [selected, rawSelected, rawRangeStart, rawRangeEnd, focusedDate, viewingYearMonth, timeZone, locale, isRange, rangeStart, rangeEnd],
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
    [focusedDate, selectedPlain, weeks, currentMonth, isDateDisabled, T, gridHasFocus],
  );

  const ctx = useMemo<DatePickerContextValue>(
    () => ({
      selected,
      onSelect,
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

  const stateAttributesMapping = useMemo(
    () => ({
      hasSelection: (v: boolean) => (v ? { "data-has-selection": "" } : null),
      selected: () => null,
      rangeStart: () => null,
      rangeEnd: () => null,
      focused: () => null,
      viewing: () => null,
      timeZone: () => null,
      locale: () => null,
    }),
    [],
  );

  return { ctx, state, stateAttributesMapping };
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

  const stateAttributesMapping = useMemo(
    () => ({
      root: () => null,
      direction: (v: string) => ({ "data-direction": v }),
      disabled: () => null,
      target: () => null,
    }),
    [],
  );

  const goFn = direction === "prev" ? goToPrevMonth : goToNextMonth;

  const defaultProps: Record<string, unknown> = {
    type: "button",
    "aria-label": `Go to ${direction === "prev" ? "previous" : "next"} month`,
    disabled: isDisabled,
    onClick: isDisabled ? undefined : goFn,
  };

  return { state, stateAttributesMapping, defaultProps };
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

function useDayDerivedState(date: Temporal.PlainDate) {
  const {
    selected,
    currentDateTime,
    disabled,
    isDateDisabled,
    focusedDate,
    rangeStart,
    rangeEnd,
    timeZone,
    temporal: T,
  } = useDatePicker();

  const today = useMemo(() => T.Now.plainDateISO(), [T]);
  const selZdt = selectedToZdt(selected, timeZone, T);
  const isSelected = selZdt ? sameCalendarDay(selZdt, date) : false;
  const isCurrentMonth =
    date.year === currentDateTime.year && date.month === currentDateTime.month;
  const isToday = T.PlainDate.compare(date, today) === 0;
  const isDisabled = disabled || (isDateDisabled?.(date) ?? false);
  const isFocused = T.PlainDate.compare(date, focusedDate) === 0;

  const isRangeStart = rangeStart
    ? T.PlainDate.compare(date, rangeStart) === 0
    : false;
  const isRangeEnd = rangeEnd
    ? T.PlainDate.compare(date, rangeEnd) === 0
    : false;
  const isInRangeDay = isInRangeUtil(date, rangeStart, rangeEnd, T);

  return { isSelected, isCurrentMonth, isToday, isDisabled, isFocused, isRangeStart, isRangeEnd, isInRangeDay };
}

const dayStateAttributesMapping = {
  root: () => null,
  selected: (v: boolean) => (v ? { "data-selected": "" } : null),
  today: (v: boolean) => (v ? { "data-today": "" } : null),
  disabled: (v: boolean) => (v ? { "data-disabled": "" } : null),
  outsideMonth: (v: boolean) => (v ? { "data-outside-month": "" } : null),
  focused: (v: boolean) => (v ? { "data-focused": "" } : null),
  rangeStart: (v: boolean) => (v ? { "data-range-start": "" } : null),
  rangeEnd: (v: boolean) => (v ? { "data-range-end": "" } : null),
  inRange: (v: boolean) => (v ? { "data-in-range": "" } : null),
};

export function useDayCellState<F extends ValueFormat = ValueFormat>(
  date: Temporal.PlainDate,
) {
  const { rootState } = useDatePicker<F>();
  const { isSelected, isCurrentMonth, isToday, isDisabled, isFocused, isRangeStart, isRangeEnd, isInRangeDay } =
    useDayDerivedState(date);

  const state = useMemo<DayCellTemplateState<F>>(
    () => ({
      root: rootState,
      selected: isSelected,
      today: isToday,
      disabled: isDisabled,
      outsideMonth: !isCurrentMonth,
      focused: isFocused,
      rangeStart: isRangeStart,
      rangeEnd: isRangeEnd,
      inRange: isInRangeDay,
    }),
    [rootState, isSelected, isToday, isDisabled, isCurrentMonth, isFocused, isRangeStart, isRangeEnd, isInRangeDay],
  );

  const defaultProps: Record<string, unknown> = {
    role: "gridcell",
    "aria-selected": isSelected || undefined,
    "aria-disabled": isDisabled || undefined,
  };

  return {
    state,
    stateAttributesMapping: dayStateAttributesMapping,
    defaultProps,
  };
}

export function useDayButtonState<F extends ValueFormat = ValueFormat>(
  date: Temporal.PlainDate,
) {
  const {
    onSelect,
    setFocusedDate,
    locale,
    rootState,
    tabTargetDate,
    gridFocusedRef,
    temporal: T,
  } = useDatePicker<F>();
  const { isSelected, isCurrentMonth, isToday, isDisabled, isFocused, isRangeStart, isRangeEnd, isInRangeDay } =
    useDayDerivedState(date);
  const internalRef = useRef<HTMLButtonElement>(null);
  const isTabTarget = T.PlainDate.compare(date, tabTargetDate) === 0;

  useEffect(() => {
    if (shouldMoveDomFocus(isFocused, gridFocusedRef.current) && internalRef.current) {
      internalRef.current.focus();
    }
  }, [isFocused, gridFocusedRef]);

  const state = useMemo<DayButtonState<F>>(
    () => ({
      root: rootState,
      selected: isSelected,
      today: isToday,
      disabled: isDisabled,
      outsideMonth: !isCurrentMonth,
      focused: isFocused,
      rangeStart: isRangeStart,
      rangeEnd: isRangeEnd,
      inRange: isInRangeDay,
    }),
    [rootState, isSelected, isToday, isDisabled, isCurrentMonth, isFocused, isRangeStart, isRangeEnd, isInRangeDay],
  );

  const defaultProps: Record<string, unknown> = {
    type: "button",
    tabIndex: isTabTarget ? 0 : -1,
    disabled: isDisabled,
    "aria-label": date.toLocaleString(locale, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    id: `day-${date.toString()}`,
    "data-testid": `button-day-${date.toString()}`,
    onClick: () => {
      setFocusedDate(date);
      onSelect(date);
    },
    children: date.day,
  };

  return {
    state,
    stateAttributesMapping: dayStateAttributesMapping,
    defaultProps,
    internalRef,
  };
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

  const stateAttributesMapping = useMemo(
    () => ({
      root: () => null,
      dayOfWeek: () => null,
      long: () => null,
      short: () => null,
      narrow: () => null,
    }),
    [],
  );

  const defaultProps: Record<string, unknown> = {
    scope: "col",
    abbr: state.long,
    "aria-label": state.long,
    children: state.narrow,
  };

  return { state, stateAttributesMapping, defaultProps };
}
