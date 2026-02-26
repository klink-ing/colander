import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  type ReactNode,
  type KeyboardEvent,
  forwardRef,
} from "react";
import { Temporal } from "@js-temporal/polyfill";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";

type ValueFormat =
  | "PlainDate"
  | "PlainDateTime"
  | "PlainMonthDay"
  | "PlainTime"
  | "PlainYearMonth"
  | "ZonedDateTime"
  | "object"
  | "Date";

interface PlainDateObject {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
}

type DateValue =
  | Temporal.PlainDate
  | Temporal.PlainDateTime
  | Temporal.PlainMonthDay
  | Temporal.PlainTime
  | Temporal.PlainYearMonth
  | Temporal.ZonedDateTime
  | PlainDateObject
  | Date;

function toPlainDate(value: DateValue, format: ValueFormat): Temporal.PlainDate {
  const now = Temporal.Now.plainDateISO();
  switch (format) {
    case "PlainDate":
      return value as Temporal.PlainDate;
    case "PlainDateTime": {
      const dt = value as Temporal.PlainDateTime;
      return dt.toPlainDate();
    }
    case "PlainMonthDay": {
      const md = value as Temporal.PlainMonthDay;
      return md.toPlainDate({ year: now.year });
    }
    case "PlainTime":
      return now;
    case "PlainYearMonth": {
      const ym = value as Temporal.PlainYearMonth;
      return ym.toPlainDate({ day: 1 });
    }
    case "ZonedDateTime": {
      const zdt = value as Temporal.ZonedDateTime;
      return zdt.toPlainDate();
    }
    case "object": {
      const obj = value as PlainDateObject;
      return Temporal.PlainDate.from({
        year: obj.year ?? now.year,
        month: obj.month ?? now.month,
        day: obj.day ?? now.day,
      });
    }
    case "Date": {
      const d = value as Date;
      return Temporal.PlainDate.from({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        day: d.getDate(),
      });
    }
  }
}

function fromPlainDate(plainDate: Temporal.PlainDate, format: ValueFormat): DateValue {
  switch (format) {
    case "PlainDate":
      return plainDate;
    case "PlainDateTime":
      return plainDate.toPlainDateTime({ hour: 0, minute: 0, second: 0 });
    case "PlainMonthDay":
      return Temporal.PlainMonthDay.from({ month: plainDate.month, day: plainDate.day });
    case "PlainTime":
      return Temporal.PlainTime.from({ hour: 0, minute: 0, second: 0 });
    case "PlainYearMonth":
      return Temporal.PlainYearMonth.from({ year: plainDate.year, month: plainDate.month });
    case "ZonedDateTime":
      return plainDate.toZonedDateTime("UTC");
    case "object":
      return { year: plainDate.year, month: plainDate.month, day: plainDate.day, hour: 0, minute: 0, second: 0 };
    case "Date":
      return new Date(plainDate.year, plainDate.month - 1, plainDate.day);
  }
}

const WEEKDAY_NAMES = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getMonthWeeks(year: number, month: number): Temporal.PlainDate[][] {
  const firstOfMonth = Temporal.PlainDate.from({ year, month, day: 1 });
  const daysInMonth = firstOfMonth.daysInMonth;
  const lastOfMonth = Temporal.PlainDate.from({ year, month, day: daysInMonth });

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

function temporalToNativeDate(pd: Temporal.PlainDate): Date {
  return new Date(pd.year, pd.month - 1, pd.day);
}

interface DatePickerContextValue {
  selected: Temporal.PlainDate | undefined;
  onSelect: (date: Temporal.PlainDate) => void;
  currentMonth: { year: number; month: number };
  goToNextMonth: () => void;
  goToPrevMonth: () => void;
  weeks: Temporal.PlainDate[][];
  disabled?: (date: Temporal.PlainDate) => boolean;
  focusedDate: Temporal.PlainDate;
  setFocusedDate: (date: Temporal.PlainDate) => void;
}

const DatePickerContext = createContext<DatePickerContextValue | null>(null);

function useDatePicker() {
  const ctx = useContext(DatePickerContext);
  if (!ctx) throw new Error("DatePicker compound components must be used within DatePicker.Root");
  return ctx;
}

interface RootProps {
  children: ReactNode;
  value?: DateValue;
  defaultValue?: DateValue;
  onValueChange?: (value: DateValue) => void;
  valueFormat?: ValueFormat;
  disabled?: (date: Temporal.PlainDate) => boolean;
}

function Root({
  children,
  value,
  defaultValue,
  onValueChange,
  valueFormat = "PlainDate",
  disabled,
}: RootProps) {
  const [internalSelected, setInternalSelected] = useState<Temporal.PlainDate | undefined>(() =>
    defaultValue ? toPlainDate(defaultValue, valueFormat) : undefined,
  );

  const [currentMonth, setCurrentMonth] = useState<{ year: number; month: number }>(() => {
    const init = value
      ? toPlainDate(value, valueFormat)
      : defaultValue
        ? toPlainDate(defaultValue, valueFormat)
        : Temporal.Now.plainDateISO();
    return { year: init.year, month: init.month };
  });

  const [focusedDate, setFocusedDate] = useState<Temporal.PlainDate>(() => {
    if (value) return toPlainDate(value, valueFormat);
    if (defaultValue) return toPlainDate(defaultValue, valueFormat);
    return Temporal.Now.plainDateISO();
  });

  const selected = useMemo(() => {
    if (value) return toPlainDate(value, valueFormat);
    return internalSelected;
  }, [value, valueFormat, internalSelected]);

  useEffect(() => {
    if (value) {
      const pd = toPlainDate(value, valueFormat);
      setCurrentMonth({ year: pd.year, month: pd.month });
    }
  }, [value, valueFormat]);

  useEffect(() => {
    if (focusedDate.year !== currentMonth.year || focusedDate.month !== currentMonth.month) {
      setCurrentMonth({ year: focusedDate.year, month: focusedDate.month });
    }
  }, [focusedDate]);

  const onSelect = useCallback(
    (date: Temporal.PlainDate) => {
      if (disabled?.(date)) return;
      if (!value) setInternalSelected(date);
      setCurrentMonth({ year: date.year, month: date.month });
      onValueChange?.(fromPlainDate(date, valueFormat));
    },
    [value, onValueChange, valueFormat, disabled],
  );

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((m) => {
      const d = Temporal.PlainDate.from({ year: m.year, month: m.month, day: 1 }).add({ months: 1 });
      return { year: d.year, month: d.month };
    });
  }, []);

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((m) => {
      const d = Temporal.PlainDate.from({ year: m.year, month: m.month, day: 1 }).subtract({ months: 1 });
      return { year: d.year, month: d.month };
    });
  }, []);

  const weeks = useMemo(
    () => getMonthWeeks(currentMonth.year, currentMonth.month),
    [currentMonth.year, currentMonth.month],
  );

  const ctx = useMemo<DatePickerContextValue>(
    () => ({ selected, onSelect, currentMonth, goToNextMonth, goToPrevMonth, weeks, disabled, focusedDate, setFocusedDate }),
    [selected, onSelect, currentMonth, goToNextMonth, goToPrevMonth, weeks, disabled, focusedDate],
  );

  return <DatePickerContext.Provider value={ctx}>{children}</DatePickerContext.Provider>;
}

interface DateStringState {
  month: number;
  year: number;
  day: number;
}

interface DateStringOwnProps {
  locales?: string | string[];
  options?: Intl.DateTimeFormatOptions;
}

type DateStringProps = useRender.ComponentProps<"span", DateStringState> & DateStringOwnProps;

const DateString = forwardRef<HTMLSpanElement, DateStringProps>(function DateString(props, ref) {
  const { render, locales, options, ...otherProps } = props;
  const { currentMonth, selected } = useDatePicker();

  const displayDate = selected
    ? temporalToNativeDate(selected)
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
});

interface TimeStringState {
  hour: number;
  minute: number;
  second: number;
}

interface TimeStringOwnProps {
  locales?: string | string[];
  options?: Intl.DateTimeFormatOptions;
}

type TimeStringProps = useRender.ComponentProps<"span", TimeStringState> & TimeStringOwnProps;

const TimeString = forwardRef<HTMLSpanElement, TimeStringProps>(function TimeString(props, ref) {
  const { render, locales, options, ...otherProps } = props;
  const { selected } = useDatePicker();

  const displayDate = selected ? temporalToNativeDate(selected) : new Date();

  const formatted = displayDate.toLocaleTimeString(locales, options);

  const state = useMemo<TimeStringState>(
    () => ({
      hour: displayDate.getHours(),
      minute: displayDate.getMinutes(),
      second: displayDate.getSeconds(),
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
});

interface MonthStringState {
  month: number;
  year: number;
}

interface MonthStringOwnProps {
  locales?: string | string[];
  options?: Intl.DateTimeFormatOptions;
}

type MonthStringProps = useRender.ComponentProps<"span", MonthStringState> & MonthStringOwnProps;

const MonthString = forwardRef<HTMLSpanElement, MonthStringProps>(function MonthString(props, ref) {
  const { render, locales, options, ...otherProps } = props;
  const { currentMonth } = useDatePicker();

  const displayDate = new Date(currentMonth.year, currentMonth.month - 1, 1);
  const defaultOptions: Intl.DateTimeFormatOptions = options ?? { month: "long", year: "numeric" };
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
});

interface NavButtonState {
  direction: "next" | "prev";
}

type PrevMonthButtonProps = useRender.ComponentProps<"button", NavButtonState>;

const PrevMonthButton = forwardRef<HTMLButtonElement, PrevMonthButtonProps>(function PrevMonthButton(props, ref) {
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
});

type NextMonthButtonProps = useRender.ComponentProps<"button", NavButtonState>;

const NextMonthButton = forwardRef<HTMLButtonElement, NextMonthButtonProps>(function NextMonthButton(props, ref) {
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
});

interface DayLabelState {
  index: number;
}

interface DayLabelOwnProps {
  index: number;
}

type DayLabelProps = useRender.ComponentProps<"div", DayLabelState> & DayLabelOwnProps;

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const DayLabel = forwardRef<HTMLDivElement, DayLabelProps>(function DayLabel(props, ref) {
  const { render, index, ...otherProps } = props;

  const state = useMemo<DayLabelState>(() => ({ index }), [index]);

  const defaultProps: Record<string, unknown> = {
    role: "columnheader",
    "aria-label": DAY_LABELS[index],
    children: DAY_LABELS[index],
  };

  return useRender({
    defaultTagName: "div",
    render,
    ref: [ref],
    state,
    props: mergeProps<"div">(defaultProps, otherProps),
  });
});

interface MonthGridState {
  month: number;
  year: number;
}

interface MonthGridOwnProps {
  mode?: "grid";
}

type MonthGridProps = useRender.ComponentProps<"div", MonthGridState> & MonthGridOwnProps;

const MonthGrid = forwardRef<HTMLDivElement, MonthGridProps>(function MonthGrid(props, ref) {
  const { render, mode: _mode, children, ...otherProps } = props;
  const { weeks, focusedDate, setFocusedDate, onSelect, disabled, currentMonth } = useDatePicker();

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

  const defaultChildren = (
    <>
      <div role="row">
        {DAY_LABELS.map((_, i) => (
          <DayLabel key={i} index={i} />
        ))}
      </div>
      {weeks.map((weekDays, i) => (
        <Week key={i}>
          {weekDays.map((day) => (
            <Day key={day.toString()} date={day} />
          ))}
        </Week>
      ))}
    </>
  );

  const defaultProps: Record<string, unknown> = {
    role: "grid",
    "aria-label": "Calendar",
    onKeyDown: handleKeyDown,
    children: children ?? defaultChildren,
  };

  return useRender({
    defaultTagName: "div",
    render,
    ref: [ref],
    state,
    props: mergeProps<"div">(defaultProps, otherProps),
  });
});

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
}

interface DayOwnProps {
  date: Temporal.PlainDate;
}

type DayProps = useRender.ComponentProps<"button", DayState> & DayOwnProps;

const Day = forwardRef<HTMLButtonElement, DayProps>(function Day(props, ref) {
  const { render, date, ...otherProps } = props;
  const { selected, onSelect, currentMonth, disabled: disabledFn, focusedDate, setFocusedDate } = useDatePicker();
  const internalRef = useRef<HTMLButtonElement>(null);

  const today = useMemo(() => Temporal.Now.plainDateISO(), []);
  const isSelected = selected ? Temporal.PlainDate.compare(date, selected) === 0 : false;
  const isCurrentMonth = date.year === currentMonth.year && date.month === currentMonth.month;
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
    }),
    [isSelected, isToday, isDisabled, isCurrentMonth],
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

  const stateAttributesMapping = useMemo(() => ({
    selected: (value: boolean) => value ? { "data-selected": "" } : null,
    today: (value: boolean) => value ? { "data-today": "" } : null,
    disabled: (value: boolean) => value ? { "data-disabled": "" } : null,
    outsideMonth: (value: boolean) => value ? { "data-outside-month": "" } : null,
  }), []);

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
  MonthGridProps as DatePickerMonthGridProps,
  MonthGridState as DatePickerMonthGridState,
  WeekProps as DatePickerWeekProps,
  WeekState as DatePickerWeekState,
  DayProps as DatePickerDayProps,
  DayState as DatePickerDayState,
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
  DateValue as DatePickerDateValue,
  PlainDateObject as DatePickerPlainDateObject,
};
