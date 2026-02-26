import {
  createContext,
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
  forwardRef,
} from "react";
import { Temporal } from "@js-temporal/polyfill";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";

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

type ValueForFormat<F extends ValueFormat> = Extract<DateValueObject, { format: F }>;

function getSystemTimeZone(): string {
  return Temporal.Now.timeZoneId();
}

function toZonedDateTime(
  tagged: DateValueObject,
  timeZone: string,
): Temporal.ZonedDateTime {
  const now = Temporal.Now.zonedDateTimeISO(timeZone);
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
      return now.toPlainDate().toPlainDateTime(tagged.value).toZonedDateTime(timeZone);
    case "PlainYearMonth":
      return tagged.value.toPlainDate({ day: 1 }).toZonedDateTime(timeZone);
    case "ZonedDateTime":
      return tagged.value;
    case "object": {
      const obj = tagged.value;
      return Temporal.PlainDateTime.from({
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
      return Temporal.PlainDateTime.from({
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
): DateValueObject {
  switch (format) {
    case "PlainDate":
      return { format, value: zdt.toPlainDate() };
    case "PlainDateTime":
      return { format, value: zdt.toPlainDateTime() };
    case "PlainMonthDay":
      return { format, value: Temporal.PlainMonthDay.from({ month: zdt.month, day: zdt.day }) };
    case "PlainTime":
      return { format, value: zdt.toPlainTime() };
    case "PlainYearMonth":
      return { format, value: Temporal.PlainYearMonth.from({ year: zdt.year, month: zdt.month }) };
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
): Temporal.ZonedDateTime | undefined {
  if (!selected) return undefined;
  return toZonedDateTime(selected, timeZone);
}

const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function getMonthWeeks(year: number, month: number): Temporal.PlainDate[][] {
  const firstOfMonth = Temporal.PlainDate.from({ year, month, day: 1 });
  const daysInMonth = firstOfMonth.daysInMonth;
  const lastOfMonth = Temporal.PlainDate.from({
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
  while (Temporal.PlainDate.compare(current, gridEnd) <= 0) {
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
  currentMonth: { year: number; month: number };
  goToNextMonth: () => void;
  goToPrevMonth: () => void;
  weeks: Temporal.PlainDate[][];
  disabled?: (date: Temporal.PlainDate) => boolean;
  focusedDate: Temporal.PlainDate;
  setFocusedDate: (date: Temporal.PlainDate) => void;
  timeZone: string;
  locale: string;
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

interface RootState {
  month: number;
  year: number;
  hasSelection: boolean;
  selectedDay: number;
  selectedMonth: number;
  selectedYear: number;
  selectedHour: number;
  selectedMinute: number;
  selectedSecond: number;
  focusedDay: number;
  focusedMonth: number;
  focusedYear: number;
  timeZone: string;
  locale: string;
}

interface RootOwnProps<F extends ValueFormat = ValueFormat> {
  format?: F;
  value?: ValueForFormat<F>;
  defaultValue?: ValueForFormat<F>;
  onValueChange?: (value: ValueForFormat<F>) => void;
  disabled?: (date: Temporal.PlainDate) => boolean;
  timeZone?: string;
  locale?: string;
}

type RootProps<F extends ValueFormat = ValueFormat> = useRender.ComponentProps<"div", RootState> & RootOwnProps<F>;

function RootInner<F extends ValueFormat = ValueFormat>(
  props: RootProps<F> & { innerRef?: React.Ref<HTMLDivElement> },
) {
  const {
    innerRef,
    render,
    children,
    format: formatProp,
    value,
    defaultValue,
    onValueChange,
    disabled,
    timeZone: timeZoneProp,
    locale: localeProp,
    ...otherProps
  } = props;

  const timeZone = timeZoneProp ?? getSystemTimeZone();
  const locale = localeProp ?? "en-US";

  const resolvedFormat: ValueFormat = value?.format ?? defaultValue?.format ?? formatProp ?? "PlainDate";

  const [internalSelected, setInternalSelected] = useState<
    DateValueObject | undefined
  >(() => (defaultValue ? defaultValue : undefined));

  const [currentMonth, setCurrentMonth] = useState<{
    year: number;
    month: number;
  }>(() => {
    const src = value ?? defaultValue;
    const init = src
      ? toZonedDateTime(src, timeZone)
      : Temporal.Now.zonedDateTimeISO(timeZone);
    return { year: init.year, month: init.month };
  });

  const [focusedDate, setFocusedDate] = useState<Temporal.PlainDate>(() => {
    const src = value ?? defaultValue;
    if (src) {
      return toZonedDateTime(src, timeZone).toPlainDate();
    }
    return Temporal.Now.plainDateISO();
  });

  const selected: DateValueObject | undefined = useMemo(() => {
    if (value) return value;
    return internalSelected;
  }, [value, internalSelected]);

  const selectedZdt = useMemo(
    () => selectedToZdt(selected, timeZone),
    [selected, timeZone],
  );

  useEffect(() => {
    if (value) {
      const zdt = toZonedDateTime(value, timeZone);
      setCurrentMonth({ year: zdt.year, month: zdt.month });
    }
  }, [value, timeZone]);

  useEffect(() => {
    if (
      focusedDate.year !== currentMonth.year ||
      focusedDate.month !== currentMonth.month
    ) {
      setCurrentMonth({ year: focusedDate.year, month: focusedDate.month });
    }
  }, [focusedDate]);

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
      const newTagged = fromZonedDateTime(newZdt, resolvedFormat);
      if (!value) setInternalSelected(newTagged);
      setCurrentMonth({ year: date.year, month: date.month });
      onValueChange?.(newTagged as ValueForFormat<F>);
    },
    [value, selectedZdt, onValueChange, resolvedFormat, disabled, timeZone],
  );

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((m) => {
      const d = Temporal.PlainDate.from({
        year: m.year,
        month: m.month,
        day: 1,
      }).add({ months: 1 });
      return { year: d.year, month: d.month };
    });
  }, []);

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((m) => {
      const d = Temporal.PlainDate.from({
        year: m.year,
        month: m.month,
        day: 1,
      }).subtract({ months: 1 });
      return { year: d.year, month: d.month };
    });
  }, []);

  const weeks = useMemo(
    () => getMonthWeeks(currentMonth.year, currentMonth.month),
    [currentMonth.year, currentMonth.month],
  );

  const ctx = useMemo<DatePickerContextValue>(
    () => ({
      selected,
      onSelect,
      currentMonth,
      goToNextMonth,
      goToPrevMonth,
      weeks,
      disabled,
      focusedDate,
      setFocusedDate,
      timeZone,
      locale,
    }),
    [
      selected,
      onSelect,
      currentMonth,
      goToNextMonth,
      goToPrevMonth,
      weeks,
      disabled,
      focusedDate,
      timeZone,
      locale,
    ],
  );

  const state = useMemo<RootState>(
    () => ({
      month: currentMonth.month,
      year: currentMonth.year,
      hasSelection: !!selectedZdt,
      selectedDay: selectedZdt?.day ?? 0,
      selectedMonth: selectedZdt?.month ?? 0,
      selectedYear: selectedZdt?.year ?? 0,
      selectedHour: selectedZdt?.hour ?? 0,
      selectedMinute: selectedZdt?.minute ?? 0,
      selectedSecond: selectedZdt?.second ?? 0,
      focusedDay: focusedDate.day,
      focusedMonth: focusedDate.month,
      focusedYear: focusedDate.year,
      timeZone,
      locale,
    }),
    [currentMonth, selectedZdt, focusedDate, timeZone, locale],
  );

  const stateAttributesMapping = useMemo(
    () => ({
      hasSelection: (v: boolean) => (v ? { "data-has-selection": "" } : null),
      selectedDay: () => null,
      selectedMonth: () => null,
      selectedYear: () => null,
      selectedHour: () => null,
      selectedMinute: () => null,
      selectedSecond: () => null,
      focusedDay: () => null,
      focusedMonth: () => null,
      focusedYear: () => null,
      timeZone: () => null,
      locale: () => null,
    }),
    [],
  );

  const defaultProps: Record<string, unknown> = {
    children,
  };

  const element = useRender({
    defaultTagName: "div",
    render,
    ref: innerRef ? [innerRef] : [],
    state,
    stateAttributesMapping,
    props: mergeProps<"div">(defaultProps, otherProps),
  });

  return (
    <DatePickerContext.Provider value={ctx}>
      {element}
    </DatePickerContext.Provider>
  );
}

const Root = forwardRef<HTMLDivElement, RootProps>(function Root(props, ref) {
  return <RootInner {...props} innerRef={ref} />;
}) as <F extends ValueFormat = ValueFormat>(
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

const DateString = forwardRef<HTMLSpanElement, DateStringProps>(
  function DateString(props, ref) {
    const { render, locales, options, ...otherProps } = props;
    const { currentMonth, selected, timeZone } = useDatePicker();

    const selectedZdt = selectedToZdt(selected, timeZone);
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
  },
);

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

const TimeString = forwardRef<HTMLSpanElement, TimeStringProps>(
  function TimeString(props, ref) {
    const { render, locales, options, ...otherProps } = props;
    const { selected, timeZone } = useDatePicker();

    const selZdt = selectedToZdt(selected, timeZone);
    const displayDate = selZdt
      ? zdtToNativeDate(selZdt)
      : zdtToNativeDate(Temporal.Now.zonedDateTimeISO(timeZone));

    const mergedOptions: Intl.DateTimeFormatOptions = { timeZone, ...options };
    const formatted = displayDate.toLocaleTimeString(locales, mergedOptions);

    const state = useMemo<TimeStringState>(
      () => ({
        hour: selZdt?.hour ?? Temporal.Now.zonedDateTimeISO(timeZone).hour,
        minute:
          selZdt?.minute ?? Temporal.Now.zonedDateTimeISO(timeZone).minute,
        second:
          selZdt?.second ?? Temporal.Now.zonedDateTimeISO(timeZone).second,
      }),
      [selZdt, timeZone],
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
  },
);

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

const MonthString = forwardRef<HTMLSpanElement, MonthStringProps>(
  function MonthString(props, ref) {
    const { render, locales, options, ...otherProps } = props;
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
  },
);

interface NavButtonState {
  direction: "next" | "prev";
}

type PrevMonthButtonProps = useRender.ComponentProps<"button", NavButtonState>;

const PrevMonthButton = forwardRef<HTMLButtonElement, PrevMonthButtonProps>(
  function PrevMonthButton(props, ref) {
    const { render, ...otherProps } = props;
    const { goToPrevMonth } = useDatePicker();

    const state = useMemo<NavButtonState>(() => ({ direction: "prev" }), []);

    const defaultProps: Record<string, unknown> = {
      type: "button",
      "aria-label": "Go to previous month",
      onClick: goToPrevMonth,
    };

    return useRender({
      defaultTagName: "button",
      render,
      ref: [ref],
      state,
      props: mergeProps<"button">(defaultProps, otherProps),
    });
  },
);

type NextMonthButtonProps = useRender.ComponentProps<"button", NavButtonState>;

const NextMonthButton = forwardRef<HTMLButtonElement, NextMonthButtonProps>(
  function NextMonthButton(props, ref) {
    const { render, ...otherProps } = props;
    const { goToNextMonth } = useDatePicker();

    const state = useMemo<NavButtonState>(() => ({ direction: "next" }), []);

    const defaultProps: Record<string, unknown> = {
      type: "button",
      "aria-label": "Go to next month",
      onClick: goToNextMonth,
    };

    return useRender({
      defaultTagName: "button",
      render,
      ref: [ref],
      state,
      props: mergeProps<"button">(defaultProps, otherProps),
    });
  },
);

const REFERENCE_SUNDAY = Temporal.PlainDate.from("2024-01-07");

function getWeekdayNames(locale: string) {
  const names: { long: string; short: string; narrow: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const date = REFERENCE_SUNDAY.add({ days: i });
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

const DayLabel = forwardRef<HTMLDivElement, DayLabelProps>(
  function DayLabel(props, ref) {
    const { render, index = 0, ...otherProps } = props;
    const { locale } = useDatePicker();

    const weekdayNames = useMemo(() => getWeekdayNames(locale), [locale]);

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
  },
);

interface DayLabelsState {}

type DayLabelsProps = useRender.ComponentProps<"div", DayLabelsState>;

const DayLabels = forwardRef<HTMLDivElement, DayLabelsProps>(
  function DayLabels(props, ref) {
    const { render, children, ...otherProps } = props;

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
  },
);

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

const MonthGrid = forwardRef<HTMLDivElement, MonthGridProps>(
  function MonthGrid(props, ref) {
    const { render, mode: _mode, children, ...otherProps } = props;
    const {
      weeks,
      focusedDate,
      setFocusedDate,
      onSelect,
      disabled,
      currentMonth,
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
          e.preventDefault();
          setFocusedDate(nextDate);
        }
      },
      [focusedDate, setFocusedDate, onSelect, disabled],
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
  },
);

interface WeekState {}

type WeekProps = useRender.ComponentProps<"div", WeekState>;

const Week = forwardRef<HTMLDivElement, WeekProps>(function Week(props, ref) {
  const { render, ...otherProps } = props;

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
});

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

const Day = forwardRef<HTMLButtonElement, DayProps>(function Day(props, ref) {
  const { render, date: dateProp, ...otherProps } = props;
  const {
    selected,
    onSelect,
    currentMonth,
    disabled: disabledFn,
    focusedDate,
    setFocusedDate,
    timeZone,
  } = useDatePicker();
  const internalRef = useRef<HTMLButtonElement>(null);

  const date = dateProp ?? Temporal.Now.plainDateISO();

  const today = useMemo(() => Temporal.Now.plainDateISO(), []);
  const selZdt = selectedToZdt(selected, timeZone);
  const isSelected = selZdt ? sameCalendarDay(selZdt, date) : false;
  const isCurrentMonth =
    date.year === currentMonth.year && date.month === currentMonth.month;
  const isToday = Temporal.PlainDate.compare(date, today) === 0;
  const isDisabled = disabledFn?.(date) ?? false;
  const isFocused = Temporal.PlainDate.compare(date, focusedDate) === 0;

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
    "aria-label": `${WEEKDAY_NAMES[date.dayOfWeek - 1]}, ${MONTH_NAMES[date.month - 1]} ${date.day}, ${date.year}`,
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
});

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

export { useDatePicker };

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
  PlainDateObject as DatePickerPlainDateObject,
};
