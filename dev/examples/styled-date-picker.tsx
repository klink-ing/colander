import type { Temporal } from "@js-temporal/polyfill";
import type {
  ValueFormat,
  RawValueForFormat,
  DateRange,
  Components,
  RangeMode,
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
  StyledRangeSelected,
  StyledRangePreview,
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
  preventRangeReversal?: boolean;
  numberOfMonths?: number;
  orientation?: "horizontal" | "vertical";
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
      rangeMode?: RangeMode;
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
    preventRangeReversal,
    numberOfMonths: numberOfMonthsProp,
    orientation,
    outsideDays,
    onMonthChange,
    ...selectionProps
  } = props;
  const numberOfMonths = numberOfMonthsProp ?? 1;
  const isVertical = orientation === "vertical";

  const renderGrid = (monthIndex: number) => (
    <div key={monthIndex}>
      {numberOfMonths > 1 && (
        <div className="flex items-center justify-center px-1 pb-3">
          <StyledMonthYearString monthIndex={monthIndex} />
        </div>
      )}
      <StyledGrid
        monthIndex={monthIndex}
        orientation={orientation}
        autoFocus={monthIndex === 0 ? autoFocus : undefined}
        className={cn(
          !isVertical &&
            showWeekNumbers &&
            "grid-cols-[auto_repeat(var(--calendar-days-per-week),1fr)]",
          isVertical &&
            showWeekNumbers &&
            "w-fit auto-cols-auto grid-flow-col grid-cols-none grid-rows-[auto_repeat(var(--calendar-days-per-week),1fr)]",
          isVertical &&
            !showWeekNumbers &&
            "w-fit auto-cols-auto grid-flow-col grid-cols-none grid-rows-[repeat(var(--calendar-days-per-week),1fr)]",
        )}
      >
        <StyledGridHeader
          className={
            isVertical
              ? cn(
                  "contents",
                  "[&>tr]:col-auto [&>tr]:row-span-full [&>tr]:grid [&>tr]:grid-cols-[unset] [&>tr]:grid-rows-subgrid",
                )
              : undefined
          }
        >
          {showWeekNumbers && (
            <WeekNumberHeader
              className={cn(
                "text-muted-foreground p-1 text-center text-[0.7rem] font-normal",
                !isVertical && "w-8",
                isVertical && "flex items-center",
              )}
              render={({ children, ...props }) => (
                <th {...props}>
                  <span className="inline-block w-[2ch] text-right">
                    {children}
                  </span>
                </th>
              )}
            />
          )}
          <StyledGridHeaderCell
            className={
              isVertical ? "flex w-fit items-center text-right" : undefined
            }
          />
        </StyledGridHeader>
        <StyledGridBody
          className={
            isVertical
              ? "col-auto row-span-full auto-cols-fr grid-flow-col grid-cols-[unset] grid-rows-subgrid gap-x-1 gap-y-0"
              : undefined
          }
        >
          <StyledWeekTemplate
            className={
              isVertical
                ? "col-auto row-span-full grid-cols-[unset] grid-rows-subgrid"
                : undefined
            }
          >
            {showWeekNumbers && (
              <WeekNumberCell
                className={cn(
                  "text-muted-foreground p-1 text-center text-[0.7rem] tabular-nums",
                  !isVertical && "w-8",
                  isVertical && "flex items-center justify-center",
                )}
                render={({ children, ...props }) => (
                  <td {...props}>
                    <span className="inline-block w-[2ch] text-right">
                      {children}
                    </span>
                  </td>
                )}
              />
            )}
            <StyledRangeSelected columnOffset={showWeekNumbers ? 1 : 0} />
            <StyledRangePreview columnOffset={showWeekNumbers ? 1 : 0} />
            <StyledDayCellTemplate
              columnOffset={showWeekNumbers ? 1 : 0}
              preventRangeReversal={preventRangeReversal}
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
      preventRangeReversal={preventRangeReversal}
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
