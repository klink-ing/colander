import { Temporal } from "@js-temporal/polyfill";
import type {
  ValueFormat,
  RawValueForFormat,
  DateRange,
  Components,
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
  isDateDisabled?: (date: Temporal.PlainDate) => boolean;
  timeZone?: string;
  locale?: string;
  className?: string;
  components: Components<F>;
} & (
  | {
      selectionMode?: "single";
      value?: RawValueForFormat<F>;
      defaultValue?: RawValueForFormat<F>;
      onValueChange?: (value: RawValueForFormat<F> | undefined) => void;
    }
  | {
      selectionMode: "range";
      value?: DateRange<F>;
      defaultValue?: DateRange<F>;
      onValueChange?: (value: DateRange<F> | undefined) => void;
    }
);

export function StyledDatePickerHorizontal<
  F extends ValueFormat = ValueFormat,
>(props: StyledDatePickerHorizontalProps<F>) {
  const {
    min,
    max,
    disabled,
    isDateDisabled,
    timeZone,
    locale,
    className,
    components: DP,
    ...selectionProps
  } = props;
  return (
    <DP.Root
      {...(selectionProps as any)}
      min={min}
      max={max}
      disabled={disabled}
      isDateDisabled={isDateDisabled}
      timeZone={timeZone}
      locale={locale}
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
