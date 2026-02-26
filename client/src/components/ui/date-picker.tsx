import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  type ReactNode,
  type HTMLAttributes,
  type KeyboardEvent,
  forwardRef,
} from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  eachWeekOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerContextValue {
  selected: Date | undefined;
  onSelect: (date: Date) => void;
  currentMonth: Date;
  goToNextMonth: () => void;
  goToPrevMonth: () => void;
  weeks: Date[][];
  disabled?: (date: Date) => boolean;
  focusedDate: Date;
  setFocusedDate: (date: Date) => void;
}

const DatePickerContext = createContext<DatePickerContextValue | null>(null);

function useDatePicker() {
  const ctx = useContext(DatePickerContext);
  if (!ctx) throw new Error("DatePicker compound components must be used within DatePicker.Root");
  return ctx;
}

interface RootProps {
  children: ReactNode;
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (date: Date) => void;
  disabled?: (date: Date) => boolean;
}

function Root({ children, value, defaultValue, onValueChange, disabled }: RootProps) {
  const [internalSelected, setInternalSelected] = useState<Date | undefined>(defaultValue);
  const [currentMonth, setCurrentMonth] = useState<Date>(value ?? defaultValue ?? new Date());
  const [focusedDate, setFocusedDate] = useState<Date>(value ?? defaultValue ?? new Date());

  const selected = value ?? internalSelected;

  useEffect(() => {
    if (value) {
      setCurrentMonth(startOfMonth(value));
    }
  }, [value]);

  useEffect(() => {
    if (!isSameMonth(focusedDate, currentMonth)) {
      setCurrentMonth(startOfMonth(focusedDate));
    }
  }, [focusedDate]);

  const onSelect = useCallback(
    (date: Date) => {
      if (disabled?.(date)) return;
      if (!value) setInternalSelected(date);
      setCurrentMonth(startOfMonth(date));
      onValueChange?.(date);
    },
    [value, onValueChange, disabled],
  );

  const goToNextMonth = useCallback(() => setCurrentMonth((m) => addMonths(m, 1)), []);
  const goToPrevMonth = useCallback(() => setCurrentMonth((m) => subMonths(m, 1)), []);

  const weeks = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const weekStarts = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 0 });
    return weekStarts.map((weekStart) =>
      eachDayOfInterval({
        start: startOfWeek(weekStart, { weekStartsOn: 0 }),
        end: endOfWeek(weekStart, { weekStartsOn: 0 }),
      }),
    );
  }, [currentMonth]);

  const ctx = useMemo(
    () => ({ selected, onSelect, currentMonth, goToNextMonth, goToPrevMonth, weeks, disabled, focusedDate, setFocusedDate }),
    [selected, onSelect, currentMonth, goToNextMonth, goToPrevMonth, weeks, disabled, focusedDate],
  );

  return <DatePickerContext.Provider value={ctx}>{children}</DatePickerContext.Provider>;
}

interface HeaderProps extends HTMLAttributes<HTMLDivElement> {}

const Header = forwardRef<HTMLDivElement, HeaderProps>(({ className, ...props }, ref) => {
  const { currentMonth, goToPrevMonth, goToNextMonth } = useDatePicker();

  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-between gap-1 px-1 pb-3", className)}
      {...props}
    >
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
      <span
        className="text-sm font-medium"
        aria-live="polite"
        data-testid="text-current-month"
      >
        {format(currentMonth, "MMMM yyyy")}
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
    </div>
  );
});
Header.displayName = "DatePicker.Header";

interface MonthGridProps extends HTMLAttributes<HTMLDivElement> {
  mode?: "grid";
  children?: ReactNode;
}

const MonthGrid = forwardRef<HTMLDivElement, MonthGridProps>(({ className, children, mode: _mode, ...props }, ref) => {
  const { weeks, focusedDate, setFocusedDate, onSelect, disabled } = useDatePicker();
  const dayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      let nextDate: Date | null = null;

      switch (e.key) {
        case "ArrowRight":
          nextDate = addDays(focusedDate, 1);
          break;
        case "ArrowLeft":
          nextDate = subDays(focusedDate, 1);
          break;
        case "ArrowDown":
          nextDate = addWeeks(focusedDate, 1);
          break;
        case "ArrowUp":
          nextDate = subWeeks(focusedDate, 1);
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

  return (
    <div
      ref={ref}
      role="grid"
      aria-label="Calendar"
      className={cn("w-full", className)}
      onKeyDown={handleKeyDown}
      {...props}
    >
      <div role="row" className="grid grid-cols-7">
        {dayLabels.map((label) => (
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
      {children ??
        weeks.map((weekDays, i) => (
          <Week key={i}>
            {weekDays.map((day) => (
              <Day key={day.toISOString()} date={day} />
            ))}
          </Week>
        ))}
    </div>
  );
});
MonthGrid.displayName = "DatePicker.MonthGrid";

interface WeekProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

const Week = forwardRef<HTMLDivElement, WeekProps>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} role="row" className={cn("grid grid-cols-7 mt-0.5", className)} {...props}>
      {children}
    </div>
  );
});
Week.displayName = "DatePicker.Week";

interface DayProps extends HTMLAttributes<HTMLDivElement> {
  date: Date;
}

const Day = forwardRef<HTMLDivElement, DayProps>(({ date, className, ...props }, ref) => {
  const { selected, onSelect, currentMonth, disabled, focusedDate, setFocusedDate } = useDatePicker();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isSelected = selected ? isSameDay(date, selected) : false;
  const isCurrentMonth = isSameMonth(date, currentMonth);
  const isTodayDate = isToday(date);
  const isDisabled = disabled?.(date) ?? false;
  const isFocused = isSameDay(date, focusedDate);

  useEffect(() => {
    if (isFocused && buttonRef.current) {
      buttonRef.current.focus();
    }
  }, [isFocused]);

  return (
    <div
      ref={ref}
      role="gridcell"
      className={cn("h-9 w-9 p-0 text-center text-sm relative", className)}
      {...props}
    >
      <button
        ref={buttonRef}
        type="button"
        tabIndex={isFocused ? 0 : -1}
        disabled={isDisabled}
        aria-selected={isSelected}
        aria-disabled={isDisabled}
        aria-label={format(date, "EEEE, MMMM d, yyyy")}
        onClick={() => {
          setFocusedDate(date);
          onSelect(date);
        }}
        data-testid={`button-day-${format(date, "yyyy-MM-dd")}`}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-normal transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          !isCurrentMonth && "text-muted-foreground opacity-40",
          isCurrentMonth && !isSelected && !isTodayDate && "text-foreground hover:bg-accent hover:text-accent-foreground",
          isTodayDate && !isSelected && "bg-accent text-accent-foreground",
          isSelected && "bg-primary text-primary-foreground",
          isDisabled && "pointer-events-none opacity-50",
        )}
      >
        {format(date, "d")}
      </button>
    </div>
  );
});
Day.displayName = "DatePicker.Day";

export const DatePicker = {
  Root,
  Header,
  MonthGrid,
  Week,
  Day,
};
