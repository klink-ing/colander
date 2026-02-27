import {
  createContext,
  createElement,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  Children,
  isValidElement,
  cloneElement,
  type ReactNode,
  type ReactElement,
  type KeyboardEvent,
} from "react";
import type { Temporal } from "@js-temporal/polyfill";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";

type TemporalNamespace = {
  Now: {
    timeZoneId(): string;
    zonedDateTimeISO(tz: string): Temporal.ZonedDateTime;
    plainDateISO(): Temporal.PlainDate;
  };
  PlainDate: {
    from(item: any): Temporal.PlainDate;
    compare(a: Temporal.PlainDate, b: Temporal.PlainDate): number;
  };
  PlainDateTime: {
    from(item: any): Temporal.PlainDateTime;
  };
  PlainMonthDay: {
    from(item: any): Temporal.PlainMonthDay;
  };
  PlainYearMonth: {
    from(item: any): Temporal.PlainYearMonth;
  };
};

function resolveTemporal(provided?: TemporalNamespace): TemporalNamespace {
  if (provided) return provided;
  if (typeof globalThis !== "undefined" && (globalThis as any).Temporal) {
    return (globalThis as any).Temporal;
  }
  throw new Error(
    "DatePicker: Temporal is not available. Pass a Temporal polyfill via the `temporal` option to createDatePicker, or use a browser that supports the Temporal API natively.",
  );
}

interface PlainDateObject {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  timeZone?: string;
}

type DateValueObject =
  | { format: "PlainDate"; value: Temporal.PlainDate }
  | { format: "PlainDateTime"; value: Temporal.PlainDateTime }
  | { format: "PlainMonthDay"; value: Temporal.PlainMonthDay }
  | { format: "PlainTime"; value: Temporal.PlainTime }
  | { format: "PlainYearMonth"; value: Temporal.PlainYearMonth }
  | { format: "ZonedDateTime"; value: Temporal.ZonedDateTime }
  | { format: "object"; value: PlainDateObject }
  | { format: "Date"; value: Date };

type ValueFormat = DateValueObject["format"];

type ValueForFormat<F extends ValueFormat> = Extract<
  DateValueObject,
  { format: F }
>;

type RawValueForFormat<F extends ValueFormat> = ValueForFormat<F>["value"];

function getSystemTimeZone(T: TemporalNamespace): string {
  return T.Now.timeZoneId();
}

function toZonedDateTime(
  tagged: DateValueObject,
  timeZone: string,
  T: TemporalNamespace,
): Temporal.ZonedDateTime {
  const now = T.Now.zonedDateTimeISO(timeZone);
  switch (tagged.format) {
    case "PlainDate":
      return tagged.value.toZonedDateTime(timeZone);
    case "PlainDateTime":
      return tagged.value.toZonedDateTime(timeZone);
    case "PlainMonthDay": {
      const pd = tagged.value.toPlainDate({ year: now.year });
      return pd.toZonedDateTime(timeZone);
    }
    case "PlainTime":
      return now
        .toPlainDate()
        .toPlainDateTime(tagged.value)
        .toZonedDateTime(timeZone);
    case "PlainYearMonth":
      return tagged.value.toPlainDate({ day: 1 }).toZonedDateTime(timeZone);
    case "ZonedDateTime":
      return tagged.value;
    case "object": {
      const obj = tagged.value;
      return T.PlainDateTime.from({
        year: obj.year ?? now.year,
        month: obj.month ?? now.month,
        day: obj.day ?? now.day,
        hour: obj.hour ?? 0,
        minute: obj.minute ?? 0,
        second: obj.second ?? 0,
      }).toZonedDateTime(obj.timeZone ?? timeZone);
    }
    case "Date": {
      const d = tagged.value;
      return T.PlainDateTime.from({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        day: d.getDate(),
        hour: d.getHours(),
        minute: d.getMinutes(),
        second: d.getSeconds(),
      }).toZonedDateTime(timeZone);
    }
  }
}

function fromZonedDateTime(
  zdt: Temporal.ZonedDateTime,
  format: ValueFormat,
  T: TemporalNamespace,
): DateValueObject {
  switch (format) {
    case "PlainDate":
      return { format, value: zdt.toPlainDate() };
    case "PlainDateTime":
      return { format, value: zdt.toPlainDateTime() };
    case "PlainMonthDay":
      return {
        format,
        value: T.PlainMonthDay.from({ month: zdt.month, day: zdt.day }),
      };
    case "PlainTime":
      return { format, value: zdt.toPlainTime() };
    case "PlainYearMonth":
      return {
        format,
        value: T.PlainYearMonth.from({ year: zdt.year, month: zdt.month }),
      };
    case "ZonedDateTime":
      return { format, value: zdt };
    case "object":
      return {
        format,
        value: {
          year: zdt.year,
          month: zdt.month,
          day: zdt.day,
          hour: zdt.hour,
          minute: zdt.minute,
          second: zdt.second,
          timeZone: zdt.timeZoneId,
        },
      };
    case "Date":
      return { format, value: new Date(zdt.epochMilliseconds) };
  }
}

function selectedToZdt(
  selected: DateValueObject | undefined,
  timeZone: string,
  T: TemporalNamespace,
): Temporal.ZonedDateTime | undefined {
  if (!selected) return undefined;
  return toZonedDateTime(selected, timeZone, T);
}

function getMonthWeeks(
  year: number,
  month: number,
  T: TemporalNamespace,
): Temporal.PlainDate[][] {
  const firstOfMonth = T.PlainDate.from({ year, month, day: 1 });
  const daysInMonth = firstOfMonth.daysInMonth;
  const lastOfMonth = T.PlainDate.from({
    year,
    month,
    day: daysInMonth,
  });

  const isoDow = firstOfMonth.dayOfWeek;
  const sundayDow = isoDow % 7;
  const gridStart = firstOfMonth.subtract({ days: sundayDow });

  const isoLast = lastOfMonth.dayOfWeek;
  const sundayLast = isoLast % 7;
  const daysAfter = 6 - sundayLast;
  const gridEnd = lastOfMonth.add({ days: daysAfter });

  const weeks: Temporal.PlainDate[][] = [];
  let current = gridStart;
  while (T.PlainDate.compare(current, gridEnd) <= 0) {
    const week: Temporal.PlainDate[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(current);
      current = current.add({ days: 1 });
    }
    weeks.push(week);
  }
  return weeks;
}

function zdtToNativeDate(zdt: Temporal.ZonedDateTime): Date {
  return new Date(zdt.epochMilliseconds);
}

function sameCalendarDay(
  a: Temporal.ZonedDateTime,
  b: Temporal.PlainDate,
): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

interface DatePickerContextValue {
  selected: DateValueObject | undefined;
  onSelect: (date: Temporal.PlainDate) => void;
  currentDateTime: Temporal.PlainDateTime;
  currentMonth: { year: number; month: number };
  goToNextMonth: () => void;
  goToPrevMonth: () => void;
  weeks: Temporal.PlainDate[][];
  disabled?: (date: Temporal.PlainDate) => boolean;
  minValue?: Temporal.PlainDate;
  maxValue?: Temporal.PlainDate;
  focusedDate: Temporal.PlainDate;
  setFocusedDate: (date: Temporal.PlainDate) => void;
  timeZone: string;
  locale: string;
  temporal: TemporalNamespace;
}

const DatePickerContext = createContext<DatePickerContextValue | null>(null);

function useDatePicker() {
  const ctx = useContext(DatePickerContext);
  if (!ctx)
    throw new Error(
      "DatePicker compound components must be used within DatePicker.Root",
    );
  return ctx;
}

interface RootState<F extends ValueFormat = ValueFormat> {
  hasSelection: boolean;
  selected: RawValueForFormat<F> | undefined;
  focused: Temporal.PlainDate;
  viewing: Temporal.PlainYearMonth;
  timeZone: string;
  locale: string;
}

interface RootOwnProps<F extends ValueFormat = ValueFormat> {
  format?: F;
  value?: RawValueForFormat<F>;
  defaultValue?: RawValueForFormat<F>;
  onValueChange?: (value: RawValueForFormat<F> | undefined) => void;
  min?: RawValueForFormat<F>;
  max?: RawValueForFormat<F>;
  disabled?: (date: Temporal.PlainDate) => boolean;
  timeZone?: string;
  locale?: string;
  temporal?: TemporalNamespace;
}

type RootProps<F extends ValueFormat = ValueFormat> = useRender.ComponentProps<
  "div",
  RootState<F>
> &
  RootOwnProps<F>;

function RootInner<F extends ValueFormat = ValueFormat>(
  props: RootProps<F> & {
    ref?: React.Ref<HTMLDivElement>;
    _resolvedTemporal?: TemporalNamespace;
  },
) {
  const {
    ref,
    render,
    children,
    format: formatProp,
    value,
    defaultValue,
    onValueChange,
    min,
    max,
    disabled: disabledProp,
    timeZone: timeZoneProp,
    locale: localeProp,
    temporal: temporalProp,
    _resolvedTemporal,
    ...otherProps
  } = props;

  const T = _resolvedTemporal ?? resolveTemporal(temporalProp);

  const timeZone = timeZoneProp ?? getSystemTimeZone(T);
  const locale = localeProp ?? "en-US";

  const resolvedFormat: ValueFormat = formatProp ?? "PlainDate";

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
      onValueChange?.(newTagged.value as RawValueForFormat<F>);
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

  const viewingYearMonth = useMemo(
    () => T.PlainYearMonth.from({ year: currentMonth.year, month: currentMonth.month }),
    [currentMonth, T],
  );

  const rawSelected = useMemo(
    () => (selected ? selected.value as RawValueForFormat<F> : undefined),
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

  const defaultProps: Record<string, unknown> = {
    children,
  };

  const rendered = useRender({
    defaultTagName: "div",
    render,
    ref: [ref],
    state,
    stateAttributesMapping,
    props: mergeProps<"div">(defaultProps, otherProps),
  });

  return (
    <DatePickerContext.Provider value={ctx}>
      {rendered}
    </DatePickerContext.Provider>
  );
}

const Root = RootInner as <F extends ValueFormat = ValueFormat>(
  props: RootProps<F> & { ref?: React.Ref<HTMLDivElement> },
) => React.ReactElement | null;

interface DateStringState {
  month: number;
  year: number;
  day: number;
}

interface DateStringOwnProps {
  locales?: string | string[];
  options?: Intl.DateTimeFormatOptions;
}

type DateStringProps = useRender.ComponentProps<"span", DateStringState> &
  DateStringOwnProps;

function DateString(
  props: DateStringProps & { ref?: React.Ref<HTMLSpanElement> },
) {
  const { ref, render, locales, options, ...otherProps } = props;
  const { currentMonth, selected, timeZone, temporal: T } = useDatePicker();

  const selectedZdt = selectedToZdt(selected, timeZone, T);
  const displayDate = selectedZdt
    ? zdtToNativeDate(selectedZdt)
    : new Date(currentMonth.year, currentMonth.month - 1, 1);

  const formatted = displayDate.toLocaleDateString(locales, options);

  const state = useMemo<DateStringState>(
    () => ({
      month: displayDate.getMonth() + 1,
      year: displayDate.getFullYear(),
      day: displayDate.getDate(),
    }),
    [displayDate],
  );

  const defaultProps: Record<string, unknown> = {
    children: formatted,
    "aria-live": "polite",
  };

  return useRender({
    defaultTagName: "span",
    render,
    ref: [ref],
    state,
    props: mergeProps<"span">(defaultProps, otherProps),
  });
}

interface TimeStringState {
  hour: number;
  minute: number;
  second: number;
}

interface TimeStringOwnProps {
  locales?: string | string[];
  options?: Intl.DateTimeFormatOptions;
}

type TimeStringProps = useRender.ComponentProps<"span", TimeStringState> &
  TimeStringOwnProps;

function TimeString(
  props: TimeStringProps & { ref?: React.Ref<HTMLSpanElement> },
) {
  const { ref, render, locales, options, ...otherProps } = props;
  const { selected, timeZone, temporal: T } = useDatePicker();

  const selZdt = selectedToZdt(selected, timeZone, T);
  const displayDate = selZdt
    ? zdtToNativeDate(selZdt)
    : zdtToNativeDate(T.Now.zonedDateTimeISO(timeZone));

  const mergedOptions: Intl.DateTimeFormatOptions = { timeZone, ...options };
  const formatted = displayDate.toLocaleTimeString(locales, mergedOptions);

  const state = useMemo<TimeStringState>(
    () => ({
      hour: selZdt?.hour ?? T.Now.zonedDateTimeISO(timeZone).hour,
      minute: selZdt?.minute ?? T.Now.zonedDateTimeISO(timeZone).minute,
      second: selZdt?.second ?? T.Now.zonedDateTimeISO(timeZone).second,
    }),
    [selZdt, timeZone, T],
  );

  const defaultProps: Record<string, unknown> = {
    children: formatted,
    "aria-live": "polite",
  };

  return useRender({
    defaultTagName: "span",
    render,
    ref: [ref],
    state,
    props: mergeProps<"span">(defaultProps, otherProps),
  });
}

interface MonthStringState {
  month: number;
  year: number;
}

interface MonthStringOwnProps {
  locales?: string | string[];
  options?: Intl.DateTimeFormatOptions;
}

type MonthStringProps = useRender.ComponentProps<"span", MonthStringState> &
  MonthStringOwnProps;

function MonthString(
  props: MonthStringProps & { ref?: React.Ref<HTMLSpanElement> },
) {
  const { ref, render, locales, options, ...otherProps } = props;
  const { currentMonth } = useDatePicker();

  const displayDate = new Date(currentMonth.year, currentMonth.month - 1, 1);
  const defaultOptions: Intl.DateTimeFormatOptions = options ?? {
    month: "long",
    year: "numeric",
  };
  const formatted = displayDate.toLocaleDateString(locales, defaultOptions);

  const state = useMemo<MonthStringState>(
    () => ({ month: currentMonth.month, year: currentMonth.year }),
    [currentMonth],
  );

  const defaultProps: Record<string, unknown> = {
    children: formatted,
    "aria-live": "polite",
  };

  return useRender({
    defaultTagName: "span",
    render,
    ref: [ref],
    state,
    props: mergeProps<"span">(defaultProps, otherProps),
  });
}

interface NavButtonState {
  direction: "next" | "prev";
  disabled: boolean;
  target: Temporal.PlainYearMonth;
}

type PrevMonthButtonProps = useRender.ComponentProps<"button", NavButtonState>;

function PrevMonthButton(
  props: PrevMonthButtonProps & { ref?: React.Ref<HTMLButtonElement> },
) {
  const { ref, render, ...otherProps } = props;
  const { goToPrevMonth, currentMonth, minValue, temporal: T } = useDatePicker();

  const destMonth = currentMonth.month === 1 ? 12 : currentMonth.month - 1;
  const destYear = currentMonth.month === 1 ? currentMonth.year - 1 : currentMonth.year;

  const isDisabled = useMemo(() => {
    if (!minValue) return false;
    return (
      destYear < minValue.year ||
      (destYear === minValue.year && destMonth < minValue.month)
    );
  }, [destYear, destMonth, minValue]);

  const target = useMemo(
    () => T.PlainYearMonth.from({ year: destYear, month: destMonth }),
    [destYear, destMonth, T],
  );

  const state = useMemo<NavButtonState>(
    () => ({ direction: "prev", disabled: isDisabled, target }),
    [isDisabled, target],
  );

  const defaultProps: Record<string, unknown> = {
    type: "button",
    "aria-label": `Go to previous month`,
    disabled: isDisabled,
    onClick: isDisabled ? undefined : goToPrevMonth,
  };

  return useRender({
    defaultTagName: "button",
    render,
    ref: [ref],
    state,
    props: mergeProps<"button">(defaultProps, otherProps),
  });
}

type NextMonthButtonProps = useRender.ComponentProps<"button", NavButtonState>;

function NextMonthButton(
  props: NextMonthButtonProps & { ref?: React.Ref<HTMLButtonElement> },
) {
  const { ref, render, ...otherProps } = props;
  const { goToNextMonth, currentMonth, maxValue, temporal: T } = useDatePicker();

  const destMonth = currentMonth.month === 12 ? 1 : currentMonth.month + 1;
  const destYear = currentMonth.month === 12 ? currentMonth.year + 1 : currentMonth.year;

  const isDisabled = useMemo(() => {
    if (!maxValue) return false;
    return (
      destYear > maxValue.year ||
      (destYear === maxValue.year && destMonth > maxValue.month)
    );
  }, [destYear, destMonth, maxValue]);

  const target = useMemo(
    () => T.PlainYearMonth.from({ year: destYear, month: destMonth }),
    [destYear, destMonth, T],
  );

  const state = useMemo<NavButtonState>(
    () => ({ direction: "next", disabled: isDisabled, target }),
    [isDisabled, target],
  );

  const defaultProps: Record<string, unknown> = {
    type: "button",
    "aria-label": `Go to next month`,
    disabled: isDisabled,
    onClick: isDisabled ? undefined : goToNextMonth,
  };

  return useRender({
    defaultTagName: "button",
    render,
    ref: [ref],
    state,
    props: mergeProps<"button">(defaultProps, otherProps),
  });
}

function getReferenceSunday(T: TemporalNamespace): Temporal.PlainDate {
  return T.PlainDate.from("2024-01-07");
}

function getWeekdayNames(locale: string, T: TemporalNamespace) {
  const refSunday = getReferenceSunday(T);
  const names: { long: string; short: string; narrow: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const date = refSunday.add({ days: i });
    names.push({
      long: date.toLocaleString(locale, { weekday: "long" }),
      short: date.toLocaleString(locale, { weekday: "short" }),
      narrow: date.toLocaleString(locale, { weekday: "narrow" }),
    });
  }
  return names;
}

interface DayLabelState {
  index: number;
  dayOfWeek: number;
  long: string;
  short: string;
  narrow: string;
}

interface DayLabelOwnProps {
  index?: number;
}

type DayLabelProps = useRender.ComponentProps<"div", DayLabelState> &
  DayLabelOwnProps;

function DayLabel(props: DayLabelProps & { ref?: React.Ref<HTMLDivElement> }) {
  const { ref, render, index = 0, ...otherProps } = props;
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

  return useRender({
    defaultTagName: "div",
    render,
    ref: [ref],
    state,
    stateAttributesMapping,
    props: mergeProps<"div">(defaultProps, otherProps),
  });
}

interface DayLabelsState {}

type DayLabelsProps = useRender.ComponentProps<"div", DayLabelsState>;

function DayLabels(
  props: DayLabelsProps & { ref?: React.Ref<HTMLDivElement> },
) {
  const { ref, render, children, ...otherProps } = props;

  const state = useMemo<DayLabelsState>(() => ({}), []);

  let dayLabelTemplate: ReactElement | null = null;
  Children.forEach(children, (child) => {
    if (
      isValidElement(child) &&
      (child.type as any) === DayLabel &&
      !dayLabelTemplate
    ) {
      dayLabelTemplate = child;
    }
  });

  const resolvedChildren = dayLabelTemplate
    ? Array.from({ length: 7 }, (_, i) =>
        cloneElement(dayLabelTemplate!, { key: i, index: i }),
      )
    : Array.from({ length: 7 }, (_, i) => <DayLabel key={i} index={i} />);

  const defaultProps: Record<string, unknown> = {
    role: "row",
    children: resolvedChildren,
  };

  return useRender({
    defaultTagName: "div",
    render,
    ref: [ref],
    state,
    props: mergeProps<"div">(defaultProps, otherProps),
  });
}

interface MonthGridState {
  month: number;
  year: number;
}

interface MonthGridOwnProps {
  mode?: "grid";
}

type MonthGridProps = useRender.ComponentProps<"div", MonthGridState> &
  MonthGridOwnProps;

function buildTemplateChildren(
  children: ReactNode,
  weeks: Temporal.PlainDate[][],
): ReactNode {
  let dayLabelsTemplate: ReactElement | null = null;
  let weekTemplate: ReactElement | null = null;
  let dayTemplate: ReactElement | null = null;

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if ((child.type as any) === DayLabels && !dayLabelsTemplate) {
      dayLabelsTemplate = child;
    } else if ((child.type as any) === Week && !weekTemplate) {
      weekTemplate = child;
      Children.forEach(child.props.children, (weekChild: ReactNode) => {
        if (
          isValidElement(weekChild) &&
          (weekChild.type as any) === Day &&
          !dayTemplate
        ) {
          dayTemplate = weekChild;
        }
      });
    }
  });

  if (!weekTemplate || !dayTemplate) return null;

  return (
    <>
      {dayLabelsTemplate}
      {weeks.map((weekDays, wi) =>
        cloneElement(weekTemplate!, {
          key: wi,
          children: weekDays.map((day) =>
            cloneElement(dayTemplate!, { key: day.toString(), date: day }),
          ),
        }),
      )}
    </>
  );
}

function MonthGrid(
  props: MonthGridProps & { ref?: React.Ref<HTMLDivElement> },
) {
  const { ref, render, mode: _mode, children, ...otherProps } = props;
  const {
    weeks,
    focusedDate,
    setFocusedDate,
    onSelect,
    disabled,
    minValue,
    maxValue,
    currentMonth,
    temporal: T,
  } = useDatePicker();

  const state = useMemo<MonthGridState>(
    () => ({ month: currentMonth.month, year: currentMonth.year }),
    [currentMonth],
  );

  const handleKeyDown = useCallback(
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

  const bareDefaultChildren = (
    <>
      <DayLabels>
        <DayLabel />
      </DayLabels>
      {weeks.map((weekDays, i) => (
        <Week key={i}>
          {weekDays.map((day) => (
            <Day key={day.toString()} date={day} />
          ))}
        </Week>
      ))}
    </>
  );

  const resolvedChildren = children
    ? (buildTemplateChildren(children, weeks) ?? bareDefaultChildren)
    : bareDefaultChildren;

  const defaultProps: Record<string, unknown> = {
    role: "grid",
    "aria-label": "Calendar",
    onKeyDown: handleKeyDown,
    children: resolvedChildren,
  };

  return useRender({
    defaultTagName: "div",
    render,
    ref: [ref],
    state,
    props: mergeProps<"div">(defaultProps, otherProps),
  });
}

interface WeekState {}

type WeekProps = useRender.ComponentProps<"div", WeekState>;

function Week(props: WeekProps & { ref?: React.Ref<HTMLDivElement> }) {
  const { ref, render, ...otherProps } = props;

  const state = useMemo<WeekState>(() => ({}), []);

  const defaultProps: Record<string, unknown> = {
    role: "row",
  };

  return useRender({
    defaultTagName: "div",
    render,
    ref: [ref],
    state,
    props: mergeProps<"div">(defaultProps, otherProps),
  });
}

interface DayState {
  selected: boolean;
  today: boolean;
  disabled: boolean;
  outsideMonth: boolean;
  focused: boolean;
}

interface DayOwnProps {
  date?: Temporal.PlainDate;
}

type DayProps = useRender.ComponentProps<"button", DayState> & DayOwnProps;

function Day(props: DayProps & { ref?: React.Ref<HTMLButtonElement> }) {
  const { ref, render, date: dateProp, ...otherProps } = props;
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

  const date = dateProp ?? T.Now.plainDateISO();

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

  const state = useMemo<DayState>(
    () => ({
      selected: isSelected,
      today: isToday,
      disabled: isDisabled,
      outsideMonth: !isCurrentMonth,
      focused: isFocused,
    }),
    [isSelected, isToday, isDisabled, isCurrentMonth, isFocused],
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

  return useRender({
    defaultTagName: "button",
    render,
    ref: [ref, internalRef],
    state,
    stateAttributesMapping,
    props: mergeProps<"button">(defaultProps, otherProps),
  });
}

export const DatePicker = {
  Root,
  MonthGrid,
  Week,
  Day,
  DayLabels,
  DayLabel,
  DateString,
  TimeString,
  MonthString,
  PrevMonthButton,
  NextMonthButton,
};

interface CreateDatePickerOptions {
  temporal?: TemporalNamespace;
}

type TypedRootProps<F extends ValueFormat> = Omit<RootProps<F>, "format">;

interface TypedDatePicker<F extends ValueFormat> {
  Root: typeof Root<F>;
  MonthGrid: typeof MonthGrid;
  Week: typeof Week;
  Day: typeof Day;
  DayLabels: typeof DayLabels;
  DayLabel: typeof DayLabel;
  DateString: typeof DateString;
  TimeString: typeof TimeString;
  MonthString: typeof MonthString;
  PrevMonthButton: typeof PrevMonthButton;
  NextMonthButton: typeof NextMonthButton;
}

function createDatePicker<F extends ValueFormat>(
  format: F,
  options?: CreateDatePickerOptions,
): TypedDatePicker<F> {
  const resolvedTemporal = resolveTemporal(options?.temporal);

  const TypedRoot = ((
    props: TypedRootProps<F> & { ref?: React.Ref<HTMLDivElement> },
  ) => {
    return createElement(RootInner, {
      ...props,
      format,
      _resolvedTemporal: resolvedTemporal,
    } as any);
  }) as TypedDatePicker<F>["Root"];

  return {
    Root: TypedRoot,
    MonthGrid,
    Week,
    Day,
    DayLabels,
    DayLabel,
    DateString,
    TimeString,
    MonthString,
    PrevMonthButton,
    NextMonthButton,
  };
}

export { useDatePicker, createDatePicker };

export type {
  RootProps as DatePickerRootProps,
  RootState as DatePickerRootState,
  MonthGridProps as DatePickerMonthGridProps,
  MonthGridState as DatePickerMonthGridState,
  WeekProps as DatePickerWeekProps,
  WeekState as DatePickerWeekState,
  DayProps as DatePickerDayProps,
  DayState as DatePickerDayState,
  DayLabelsProps as DatePickerDayLabelsProps,
  DayLabelsState as DatePickerDayLabelsState,
  DayLabelProps as DatePickerDayLabelProps,
  DayLabelState as DatePickerDayLabelState,
  DateStringProps as DatePickerDateStringProps,
  DateStringState as DatePickerDateStringState,
  TimeStringProps as DatePickerTimeStringProps,
  TimeStringState as DatePickerTimeStringState,
  MonthStringProps as DatePickerMonthStringProps,
  MonthStringState as DatePickerMonthStringState,
  PrevMonthButtonProps as DatePickerPrevMonthButtonProps,
  NextMonthButtonProps as DatePickerNextMonthButtonProps,
  NavButtonState as DatePickerNavButtonState,
  ValueFormat as DatePickerValueFormat,
  DateValueObject as DatePickerDateValueObject,
  ValueForFormat as DatePickerValueForFormat,
  RawValueForFormat as DatePickerRawValueForFormat,
  PlainDateObject as DatePickerPlainDateObject,
  TypedDatePicker as DatePickerTyped,
  TypedRootProps as DatePickerTypedRootProps,
  TemporalNamespace as DatePickerTemporalNamespace,
  CreateDatePickerOptions as DatePickerCreateOptions,
};
