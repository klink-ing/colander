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
} from "./utils";

interface UseRootStateParams<F extends ValueFormat> {
  format: F;
  value?: RawValueForFormat<F>;
  defaultValue?: RawValueForFormat<F>;
  onValueChange?: (value: RawValueForFormat<F> | undefined) => void;
  min?: RawValueForFormat<F>;
  max?: RawValueForFormat<F>;
  disabled: boolean;
  isDateDisabled?: (date: Temporal.PlainDate) => boolean;
  timeZone: string;
  locale: string;
  temporal: TemporalNamespace;
}

export function useRootState<F extends ValueFormat>(
  params: UseRootStateParams<F>,
) {
  const {
    format: resolvedFormat,
    value,
    defaultValue,
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

  const taggedValue: DateValueObject | undefined = useMemo(
    () =>
      value != null
        ? ({ format: resolvedFormat, value } as DateValueObject)
        : undefined,
    [value, resolvedFormat],
  );

  const taggedDefault: DateValueObject | undefined = useMemo(
    () =>
      defaultValue != null
        ? ({ format: resolvedFormat, value: defaultValue } as DateValueObject)
        : undefined,
    [defaultValue, resolvedFormat],
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

  const [currentMonth, setCurrentMonth] = useState<{
    year: number;
    month: number;
  }>(() => {
    const src = taggedValue ?? taggedDefault;
    const init = src
      ? toZonedDateTime(src, timeZone, T)
      : T.Now.zonedDateTimeISO(timeZone);
    return { year: init.year, month: init.month };
  });

  const [gridLabelId, setGridLabelId] = useState<string | undefined>(undefined);

  const [focusedDate, setFocusedDate] = useState<Temporal.PlainDate>(() => {
    const src = taggedValue ?? taggedDefault;
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
    if (
      focusedDate.year !== currentMonth.year ||
      focusedDate.month !== currentMonth.month
    ) {
      setCurrentMonth({ year: focusedDate.year, month: focusedDate.month });
    }
  }, [focusedDate, currentMonth.month, currentMonth.year]);

  useEffect(() => {
    if (!selected) return;
    const selPlain = toZonedDateTime(selected, timeZone, T).toPlainDate();
    const outOfBounds =
      (minValue && T.PlainDate.compare(selPlain, minValue) < 0) ||
      (maxValue && T.PlainDate.compare(selPlain, maxValue) > 0);
    if (outOfBounds) {
      if (!value) {
        setInternalSelected(undefined);
      }
      onValueChange?.(undefined);
    }
  }, [minValue, maxValue, selected, value, onValueChange, timeZone, T]);

  const onSelect = useCallback(
    (date: Temporal.PlainDate) => {
      if (isDateDisabled(date)) return;
      const prevTime = selectedZdt
        ? {
            hour: selectedZdt.hour,
            minute: selectedZdt.minute,
            second: selectedZdt.second,
          }
        : { hour: 0, minute: 0, second: 0 };
      const newZdt = date.toPlainDateTime(prevTime).toZonedDateTime(timeZone);
      const newTagged = fromZonedDateTime(newZdt, resolvedFormat, T);
      if (!value) setInternalSelected(newTagged);
      setCurrentMonth({ year: date.year, month: date.month });
      (onValueChange as ((v: DateValueObject["value"]) => void) | undefined)?.(
        newTagged.value,
      );
    },
    [
      value,
      selectedZdt,
      onValueChange,
      resolvedFormat,
      isDateDisabled,
      timeZone,
      T,
    ],
  );

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((m) => {
      const d = T.PlainDate.from({
        year: m.year,
        month: m.month,
        day: 1,
      }).add({ months: 1 });
      return { year: d.year, month: d.month };
    });
  }, [T]);

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((m) => {
      const d = T.PlainDate.from({
        year: m.year,
        month: m.month,
        day: 1,
      }).subtract({ months: 1 });
      return { year: d.year, month: d.month };
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

  const state = useMemo<RootState<F>>(
    () => ({
      hasSelection: !!selected,
      selected: rawSelected,
      focused: focusedDate,
      viewing: viewingYearMonth,
      timeZone,
      locale,
    }),
    [selected, rawSelected, focusedDate, viewingYearMonth, timeZone, locale],
  );

  const ctx = useMemo<DatePickerContextValue>(
    () => ({
      selected,
      onSelect,
      currentDateTime,
      goToNextMonth,
      goToPrevMonth,
      weeks,
      disabled,
      isDateDisabled,
      minValue,
      maxValue,
      focusedDate,
      setFocusedDate,
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
      currentDateTime,
      goToNextMonth,
      goToPrevMonth,
      weeks,
      disabled,
      isDateDisabled,
      minValue,
      maxValue,
      focusedDate,
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

  return { isSelected, isCurrentMonth, isToday, isDisabled, isFocused };
}

const dayStateAttributesMapping = {
  root: () => null,
  selected: (v: boolean) => (v ? { "data-selected": "" } : null),
  today: (v: boolean) => (v ? { "data-today": "" } : null),
  disabled: (v: boolean) => (v ? { "data-disabled": "" } : null),
  outsideMonth: (v: boolean) => (v ? { "data-outside-month": "" } : null),
  focused: (v: boolean) => (v ? { "data-focused": "" } : null),
};

export function useDayCellState<F extends ValueFormat = ValueFormat>(
  date: Temporal.PlainDate,
) {
  const { rootState } = useDatePicker<F>();
  const { isSelected, isCurrentMonth, isToday, isDisabled, isFocused } =
    useDayDerivedState(date);

  const state = useMemo<DayCellTemplateState<F>>(
    () => ({
      root: rootState,
      selected: isSelected,
      today: isToday,
      disabled: isDisabled,
      outsideMonth: !isCurrentMonth,
      focused: isFocused,
    }),
    [rootState, isSelected, isToday, isDisabled, isCurrentMonth, isFocused],
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
  const { onSelect, setFocusedDate, locale, rootState } = useDatePicker<F>();
  const { isSelected, isCurrentMonth, isToday, isDisabled, isFocused } =
    useDayDerivedState(date);
  const internalRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isFocused && internalRef.current) {
      internalRef.current.focus();
    }
  }, [isFocused]);

  const state = useMemo<DayButtonState<F>>(
    () => ({
      root: rootState,
      selected: isSelected,
      today: isToday,
      disabled: isDisabled,
      outsideMonth: !isCurrentMonth,
      focused: isFocused,
    }),
    [rootState, isSelected, isToday, isDisabled, isCurrentMonth, isFocused],
  );

  const defaultProps: Record<string, unknown> = {
    type: "button",
    tabIndex: isFocused ? 0 : -1,
    disabled: isDisabled,
    "aria-label": date.toLocaleString(locale, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
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
