import { Temporal } from "@js-temporal/polyfill";
import type {
  ValueFormat,
  RawValueForFormat,
} from "@/components/ui/date-picker";
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
} from "@/components/ui/date-picker/styled";
import { cn } from "@/lib/utils";
import type { Components } from "@/components/ui/date-picker";

interface StyledDatePickerHorizontalProps<F extends ValueFormat> {
  value?: RawValueForFormat<F>;
  defaultValue?: RawValueForFormat<F>;
  onValueChange?: (value: RawValueForFormat<F> | undefined) => void;
  min?: RawValueForFormat<F>;
  max?: RawValueForFormat<F>;
  disabled?: boolean;
  isDateDisabled?: (date: Temporal.PlainDate) => boolean;
  timeZone?: string;
  locale?: string;
  className?: string;
  components: Components<F>;
}

export function StyledDatePickerHorizontal<
  F extends ValueFormat = ValueFormat,
>({
  value,
  defaultValue,
  onValueChange,
  min,
  max,
  disabled,
  isDateDisabled,
  timeZone,
  locale,
  className,
  components: DP,
}: StyledDatePickerHorizontalProps<F>) {
  return (
    <DP.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      min={min}
      max={max}
      disabled={disabled}
      isDateDisabled={isDateDisabled}
      timeZone={timeZone}
      locale={locale}
    >
      <div className={cn("p-3", className)} data-testid="horizontal-datepicker">
        <div className="flex items-center justify-between gap-1 px-1 pb-3">
          <StyledPrevMonthButton />
          <StyledMonthYearString />
          <StyledNextMonthButton />
        </div>

        <StyledGrid
          className="w-auto grid-cols-none grid-rows-[repeat(var(--calendar-days-per-week),1fr)] grid-flow-col auto-cols-auto"
        >
          <StyledGridHeader
            className={cn(
              "contents [display:contents]",
              "[&>tr]:col-auto [&>tr]:grid [&>tr]:row-span-full [&>tr]:[grid-template-columns:unset] [&>tr]:[grid-template-rows:subgrid]",
            )}
          >
            <StyledGridHeaderCell className="w-auto flex items-center text-right" />
          </StyledGridHeader>
          <StyledGridBody
            className="col-auto row-span-full [grid-template-columns:unset] [grid-template-rows:subgrid] grid-flow-col auto-cols-fr"
          >
            <StyledWeekTemplate
              className="col-auto row-span-full [grid-template-columns:unset] [grid-template-rows:subgrid]"
            >
              <StyledDayTemplate />
            </StyledWeekTemplate>
          </StyledGridBody>
        </StyledGrid>
      </div>
    </DP.Root>
  );
}
