import type { Temporal } from "@js-temporal/polyfill";
import type {
  ValueFormat,
  RawValueForFormat,
  DateRange,
  Components,
  InsideRangeAction,
} from "base-ui-cal";
import {
  StyledPrevMonthButton,
  StyledNextMonthButton,
  StyledMonthYearString,
  StyledGrid,
  StyledGridHeader,
  StyledGridHeaderCell,
  StyledGridBody,
  StyledWeekTemplate,
  StyledDayTemplate,
  StyledSelectedRange,
} from "./date-picker-styled";
import { cn } from "../lib/utils";

type StyledDatePickerHorizontalProps<F extends ValueFormat> = {
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

export function StyledDatePickerHorizontal<
  F extends ValueFormat = ValueFormat,
>(props: StyledDatePickerHorizontalProps<F>) {
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
    showWeekNumbers: _showWeekNumbers,
    onMonthChange,
    ...selectionProps
  } = props;
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
      onMonthChange={onMonthChange}
    >
      <div
        className={cn("w-fit p-3", className)}
        data-testid="horizontal-datepicker"
      >
        <div className="flex items-center justify-between gap-1 px-1 pb-3">
          <StyledPrevMonthButton />
          <StyledMonthYearString />
          <StyledNextMonthButton />
        </div>

        <StyledGrid
          orientation="horizontal"
          autoFocus={autoFocus}
          className="w-fit auto-cols-auto gap-x-1 grid-flow-col grid-cols-none grid-rows-[repeat(var(--calendar-days-per-week),1fr)]"
        >
          <StyledGridHeader
            className={cn(
              "contents",
              "[&>tr]:col-auto [&>tr]:row-span-full [&>tr]:grid [&>tr]:[grid-template-columns:unset] [&>tr]:[grid-template-rows:subgrid]",
            )}
          >
            <StyledGridHeaderCell className="flex w-fit items-center text-right" />
          </StyledGridHeader>
          <StyledGridBody className="col-auto row-span-full auto-cols-fr grid-flow-col [grid-template-columns:unset] [grid-template-rows:subgrid]">
            <StyledWeekTemplate className="col-auto row-span-full [grid-template-columns:unset] [grid-template-rows:subgrid]">
              <StyledSelectedRange />
              <StyledDayTemplate />
            </StyledWeekTemplate>
          </StyledGridBody>
        </StyledGrid>
      </div>
    </DP.Root>
  );
}
