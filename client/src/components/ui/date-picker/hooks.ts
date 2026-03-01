import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  type KeyboardEvent,
} from "react";
import type { Temporal } from "@js-temporal/polyfill";
import type {
  TemporalNamespace,
  DateValueObject,
  ValueFormat,
  RawValueForFormat,
  DatePickerContextValue,
  RootState,
  NavButtonState,
  DayTemplateState,
  DayLabelState,
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
  disabled?: (date: Temporal.PlainDate) => boolean;
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
    timeZone,
    locale,
    temporal: T,
  } = params;

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

  const disabled = useCallback(
    (date: Temporal.PlainDate): boolean => {
      if (minValue && T.PlainDate.compare(date, minValue) < 0) return true;
      if (maxValue && T.PlainDate.compare(date, maxValue) > 0) return true;
      return disabledProp?.(date) ?? false;
    },
    [minValue, maxValue, disabledProp, T],
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
  }, [focusedDate]);

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
      if (disabled?.(date)) return;
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
      (
        onValueChange as
          | ((v: DateValueObject["value"]) => void)
          | undefined
      )?.(newTagged.value);
    },
    [value, selectedZdt, onValueChange, resolvedFormat, disabled, timeZone, T],
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
      T.PlainDateTime.from({
        year: currentMonth.year,
        month: currentMonth.month,
        day: focusedDate.day,
        hour: selectedZdt?.hour ?? 0,
        minute: selectedZdt?.minute ?? 0,
        second: selectedZdt?.second ?? 0,
      }),
    [currentMonth, focusedDate.day, selectedZdt],
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

  const ctx = useMemo<DatePickerContextValue>(
    () => ({
      selected,
      onSelect,
      currentDateTime,
      currentMonth,
      goToNextMonth,
      goToPrevMonth,
      weeks,
      disabled,
      minValue,
      maxValue,
      focusedDate,
      setFocusedDate,
      timeZone,
      locale,
      temporal: T,
    }),
    [
      selected,
      onSelect,
      currentDateTime,
      currentMonth,
      goToNextMonth,
      goToPrevMonth,
      weeks,
      disabled,
      minValue,
      maxValue,
      focusedDate,
      timeZone,
      locale,
      T,
    ],
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

export function useNavButton(direction: "prev" | "next") {
  const {
    goToPrevMonth,
    goToNextMonth,
    currentMonth,
    minValue,
    maxValue,
    locale,
    temporal: T,
  } = useDatePicker();

  const destMonth =
    direction === "prev"
      ? currentMonth.month === 1
        ? 12
        : currentMonth.month - 1
      : currentMonth.month === 12
        ? 1
        : currentMonth.month + 1;

  const destYear =
    direction === "prev"
      ? currentMonth.month === 1
        ? currentMonth.year - 1
        : currentMonth.year
      : currentMonth.month === 12
        ? currentMonth.year + 1
        : currentMonth.year;

  const boundValue = direction === "prev" ? minValue : maxValue;

  const isDisabled = useMemo(() => {
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
  }, [destYear, destMonth, boundValue, direction]);

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

  const state = useMemo<NavButtonState>(
    () => ({ direction, disabled: isDisabled, target }),
    [direction, isDisabled, target],
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

export function useDaysGridKeyboard() {
  const {
    focusedDate,
    setFocusedDate,
    onSelect,
    disabled,
    minValue,
    maxValue,
    temporal: T,
  } = useDatePicker();

  return useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      let nextDate: Temporal.PlainDate | null = null;

      switch (e.key) {
        case "ArrowRight":
          nextDate = focusedDate.add({ days: 1 });
          break;
        case "ArrowLeft":
          nextDate = focusedDate.subtract({ days: 1 });
          break;
        case "ArrowDown":
          nextDate = focusedDate.add({ weeks: 1 });
          break;
        case "ArrowUp":
          nextDate = focusedDate.subtract({ weeks: 1 });
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (!disabled?.(focusedDate)) {
            onSelect(focusedDate);
          }
          return;
        default:
          return;
      }

      if (nextDate) {
        if (minValue && T.PlainDate.compare(nextDate, minValue) < 0) return;
        if (maxValue && T.PlainDate.compare(nextDate, maxValue) > 0) return;
        e.preventDefault();
        setFocusedDate(nextDate);
      }
    },
    [focusedDate, setFocusedDate, onSelect, disabled, minValue, maxValue, T],
  );
}

export function useDayTemplateState(date: Temporal.PlainDate) {
  const {
    selected,
    onSelect,
    currentMonth,
    disabled: disabledFn,
    focusedDate,
    setFocusedDate,
    timeZone,
    locale,
    temporal: T,
  } = useDatePicker();
  const internalRef = useRef<HTMLButtonElement>(null);

  const today = useMemo(() => T.Now.plainDateISO(), [T]);
  const selZdt = selectedToZdt(selected, timeZone, T);
  const isSelected = selZdt ? sameCalendarDay(selZdt, date) : false;
  const isCurrentMonth =
    date.year === currentMonth.year && date.month === currentMonth.month;
  const isToday = T.PlainDate.compare(date, today) === 0;
  const isDisabled = disabledFn?.(date) ?? false;
  const isFocused = T.PlainDate.compare(date, focusedDate) === 0;

  useEffect(() => {
    if (isFocused && internalRef.current) {
      internalRef.current.focus();
    }
  }, [isFocused]);

  const state = useMemo<DayTemplateState>(
    () => ({
      selected: isSelected,
      today: isToday,
      disabled: isDisabled,
      outsideMonth: !isCurrentMonth,
      focused: isFocused,
    }),
    [isSelected, isToday, isDisabled, isCurrentMonth, isFocused],
  );

  const stateAttributesMapping = useMemo(
    () => ({
      selected: (v: boolean) => (v ? { "data-selected": "" } : null),
      today: (v: boolean) => (v ? { "data-today": "" } : null),
      disabled: (v: boolean) => (v ? { "data-disabled": "" } : null),
      outsideMonth: (v: boolean) => (v ? { "data-outside-month": "" } : null),
      focused: (v: boolean) => (v ? { "data-focused": "" } : null),
    }),
    [],
  );

  const defaultProps: Record<string, unknown> = {
    role: "gridcell",
    type: "button",
    tabIndex: isFocused ? 0 : -1,
    disabled: isDisabled,
    "aria-selected": isSelected,
    "aria-disabled": isDisabled,
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

  return { state, stateAttributesMapping, defaultProps, internalRef };
}

export function useDayLabelState(index: number) {
  const { locale, temporal: T } = useDatePicker();

  const weekdayNames = useMemo(() => getWeekdayNames(locale, T), [locale, T]);

  const state = useMemo<DayLabelState>(
    () => ({
      index,
      dayOfWeek: index,
      long: weekdayNames[index].long,
      short: weekdayNames[index].short,
      narrow: weekdayNames[index].narrow,
    }),
    [index, weekdayNames],
  );

  const stateAttributesMapping = useMemo(
    () => ({
      index: () => null,
      dayOfWeek: () => null,
      long: () => null,
      short: () => null,
      narrow: () => null,
    }),
    [],
  );

  const defaultProps: Record<string, unknown> = {
    role: "columnheader",
    "aria-label": state.long,
    children: state.short,
  };

  return { state, stateAttributesMapping, defaultProps };
}
