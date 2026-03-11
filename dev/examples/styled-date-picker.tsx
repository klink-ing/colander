import type { Temporal } from "@js-temporal/polyfill";
import type {
  ValueFormat,
  RawValueForFormat,
  DateRange,
  Components,
  InsideRangeAction,
} from "base-ui-cal";
import { WeekNumberCell, WeekNumberHeader } from "base-ui-cal";
import {
  StyledPrevMonthButton,
  StyledNextMonthButton,
  StyledMonthYearString,
  StyledGrid,
  StyledGridHeader,
  StyledGridHeaderCell,
  StyledGridBody,
  StyledWeekTemplate,
  StyledDayCellTemplate,
  StyledSelectedRange,
} from "./date-picker-styled";
import { cn } from "../lib/utils";

type StyledDatePickerProps<F extends ValueFormat> = {
  min?: RawValueForFormat<F>;
  max?: RawValueForFormat<F>;
  disabled?: boolean;
  readOnly?: boolean;
  isDateDisabled?: (date: Temporal.PlainDate) => boolean;
  timeZone?: string;
  locale?: string;
  className?: string;
  components: Components<F>;
  fixedWeeks?: boolean;
  weekStartDay?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  autoFocus?: boolean;
  showWeekNumbers?: boolean;
  allowRangeReversal?: boolean;
  numberOfMonths?: number;
  outsideDays?: "enabled" | "readonly" | "disabled" | "hidden";
  onMonthChange?: (month: Temporal.PlainYearMonth) => void;
} & (
  | {
      selectionMode?: "single";
      value?: RawValueForFormat<F> | null;
      defaultValue?: RawValueForFormat<F>;
      onValueChange?: (value: RawValueForFormat<F> | null) => void;
    }
  | {
      selectionMode: "range";
      value?: DateRange<F> | null;
      defaultValue?: DateRange<F>;
      onValueChange?: (value: DateRange<F> | null) => void;
      insideRangeAction?: InsideRangeAction;
    }
  | {
      selectionMode: "multiple";
      value?: RawValueForFormat<F>[];
      defaultValue?: RawValueForFormat<F>[];
      onValueChange?: (value: RawValueForFormat<F>[]) => void;
    }
);

export function StyledDatePicker<F extends ValueFormat = ValueFormat>(
  props: StyledDatePickerProps<F>,
) {
  const {
    min,
    max,
    disabled,
    readOnly,
    isDateDisabled,
    timeZone,
    locale,
    className,
    components: DP,
    fixedWeeks,
    weekStartDay,
    autoFocus,
    showWeekNumbers,
    allowRangeReversal,
    numberOfMonths: numberOfMonthsProp,
    outsideDays,
    onMonthChange,
    ...selectionProps
  } = props;
  const numberOfMonths = numberOfMonthsProp ?? 1;

  const renderGrid = (monthIndex: number) => (
    <div key={monthIndex}>
      {numberOfMonths > 1 && (
        <div className="flex items-center justify-center px-1 pb-3">
          <StyledMonthYearString monthIndex={monthIndex} />
        </div>
      )}
      <StyledGrid
        monthIndex={monthIndex}
        autoFocus={monthIndex === 0 ? autoFocus : undefined}
        className={
          showWeekNumbers
            ? "grid-cols-[auto_repeat(var(--calendar-days-per-week),1fr)]"
            : undefined
        }
      >
        <StyledGridHeader>
          {showWeekNumbers && (
            <WeekNumberHeader className="w-8 p-1 text-center text-[0.7rem] font-normal text-muted-foreground" />
          )}
          <StyledGridHeaderCell />
        </StyledGridHeader>
        <StyledGridBody>
          <StyledWeekTemplate>
            {showWeekNumbers && (
              <WeekNumberCell className="w-8 p-1 text-center text-[0.7rem] tabular-nums text-muted-foreground" />
            )}
            <StyledSelectedRange
              columnOffset={showWeekNumbers ? 1 : 0}
            />
            <StyledDayCellTemplate
              columnOffset={showWeekNumbers ? 1 : 0}
              allowRangeReversal={allowRangeReversal}
            />
          </StyledWeekTemplate>
        </StyledGridBody>
      </StyledGrid>
    </div>
  );

  return (
    <DP.Root
      {...(selectionProps as any)}
      min={min}
      max={max}
      disabled={disabled}
      readOnly={readOnly}
      isDateDisabled={isDateDisabled}
      timeZone={timeZone}
      locale={locale}
      fixedWeeks={fixedWeeks}
      weekStartDay={weekStartDay}
      numberOfMonths={numberOfMonths}
      outsideDays={outsideDays}
      onMonthChange={onMonthChange}
    >
      <div className={cn("p-3", className)}>
        {numberOfMonths === 1 && (
          <div className="flex items-center justify-between gap-1 px-1 pb-3">
            <StyledPrevMonthButton />
            <StyledMonthYearString />
            <StyledNextMonthButton />
          </div>
        )}
        {numberOfMonths > 1 && (
          <div className="flex items-center justify-between gap-1 px-1 pb-3">
            <StyledPrevMonthButton />
            <div />
            <StyledNextMonthButton />
          </div>
        )}
        <div className={numberOfMonths > 1 ? "flex gap-4" : undefined}>
          {Array.from({ length: numberOfMonths }, (_, i) => renderGrid(i))}
        </div>
      </div>
    </DP.Root>
  );
}
