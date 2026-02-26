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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAY_NAMES = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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

interface HeaderState {
  month: number;
  year: number;
}

type HeaderProps = useRender.ComponentProps<"div", HeaderState>;

const Header = forwardRef<HTMLDivElement, HeaderProps>(function Header(props, ref) {
  const { render, ...otherProps } = props;
  const { currentMonth, goToPrevMonth, goToNextMonth } = useDatePicker();

  const state = useMemo<HeaderState>(
    () => ({ month: currentMonth.month, year: currentMonth.year }),
    [currentMonth],
  );

  const monthName = MONTH_NAMES[currentMonth.month - 1];

  const defaultProps: Record<string, unknown> = {
    className: "flex items-center justify-between gap-1 px-1 pb-3",
    children: (
      <>
        <button
          type="button"
          onClick={goToPrevMonth}
          aria-label="Go to previous month"
          data-testid="button-prev-month"
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-md",
            "text-muted-foreground transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium" aria-live="polite" data-testid="text-current-month">
          {monthName} {currentMonth.year}
        </span>
        <button
          type="button"
          onClick={goToNextMonth}
          aria-label="Go to next month"
          data-testid="button-next-month"
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-md",
            "text-muted-foreground transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </>
    ),
  };

  const element = useRender({
    defaultTagName: "div",
    render,
    ref: [ref],
    state,
    props: mergeProps<"div">(defaultProps, otherProps),
  });

  return element;
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
      <div role="row" className="grid grid-cols-7">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            role="columnheader"
            aria-label={label}
            className="flex h-9 w-9 items-center justify-center text-[0.8rem] font-normal text-muted-foreground"
          >
            {label}
          </div>
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
    className: "w-full",
    onKeyDown: handleKeyDown,
    children: children ?? defaultChildren,
  };

  const element = useRender({
    defaultTagName: "div",
    render,
    ref: [ref],
    state,
    props: mergeProps<"div">(defaultProps, otherProps),
  });

  return element;
});

interface WeekState {}

type WeekProps = useRender.ComponentProps<"div", WeekState>;

const Week = forwardRef<HTMLDivElement, WeekProps>(function Week(props, ref) {
  const { render, ...otherProps } = props;

  const state = useMemo<WeekState>(() => ({}), []);

  const defaultProps: Record<string, unknown> = {
    role: "row",
    className: "grid grid-cols-7 mt-0.5",
  };

  const element = useRender({
    defaultTagName: "div",
    render,
    ref: [ref],
    state,
    props: mergeProps<"div">(defaultProps, otherProps),
  });

  return element;
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

type DayProps = useRender.ComponentProps<"div", DayState> & DayOwnProps;

const Day = forwardRef<HTMLDivElement, DayProps>(function Day(props, ref) {
  const { render, date, ...otherProps } = props;
  const { selected, onSelect, currentMonth, disabled: disabledFn, focusedDate, setFocusedDate } = useDatePicker();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const today = useMemo(() => Temporal.Now.plainDateISO(), []);
  const isSelected = selected ? Temporal.PlainDate.compare(date, selected) === 0 : false;
  const isCurrentMonth = date.year === currentMonth.year && date.month === currentMonth.month;
  const isToday = Temporal.PlainDate.compare(date, today) === 0;
  const isDisabled = disabledFn?.(date) ?? false;
  const isFocused = Temporal.PlainDate.compare(date, focusedDate) === 0;

  useEffect(() => {
    if (isFocused && buttonRef.current) {
      buttonRef.current.focus();
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
    className: "h-9 w-9 p-0 text-center text-sm relative",
    children: (
      <button
        ref={buttonRef}
        type="button"
        tabIndex={isFocused ? 0 : -1}
        disabled={isDisabled}
        aria-selected={isSelected}
        aria-disabled={isDisabled}
        aria-label={`${WEEKDAY_NAMES[date.dayOfWeek - 1]}, ${MONTH_NAMES[date.month - 1]} ${date.day}, ${date.year}`}
        onClick={() => {
          setFocusedDate(date);
          onSelect(date);
        }}
        data-testid={`button-day-${date.toString()}`}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-normal transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          !isCurrentMonth && "text-muted-foreground opacity-40",
          isCurrentMonth && !isSelected && !isToday && "text-foreground hover:bg-accent hover:text-accent-foreground",
          isToday && !isSelected && "bg-accent text-accent-foreground",
          isSelected && "bg-primary text-primary-foreground",
          isDisabled && "pointer-events-none opacity-50",
        )}
      >
        {date.day}
      </button>
    ),
  };

  const stateAttributesMapping = useMemo(() => ({
    outsideMonth: (value: boolean) => value ? { "data-outside-month": "" } : null,
  }), []);

  const element = useRender({
    defaultTagName: "div",
    render,
    ref: [ref],
    state,
    stateAttributesMapping,
    props: mergeProps<"div">(defaultProps, otherProps),
  });

  return element;
});

export const DatePicker = {
  Root,
  Header,
  MonthGrid,
  Week,
  Day,
};

export type {
  RootProps as DatePickerRootProps,
  HeaderProps as DatePickerHeaderProps,
  HeaderState as DatePickerHeaderState,
  MonthGridProps as DatePickerMonthGridProps,
  MonthGridState as DatePickerMonthGridState,
  WeekProps as DatePickerWeekProps,
  WeekState as DatePickerWeekState,
  DayProps as DatePickerDayProps,
  DayState as DatePickerDayState,
  ValueFormat as DatePickerValueFormat,
  DateValue as DatePickerDateValue,
  PlainDateObject as DatePickerPlainDateObject,
};
