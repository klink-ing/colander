import { Temporal } from "@js-temporal/polyfill";
import type {
  DatePickerValueFormat,
  DatePickerTyped,
  DatePickerRawValueForFormat,
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

interface StyledDatePickerProps<F extends DatePickerValueFormat> {
  value?: DatePickerRawValueForFormat<F>;
  defaultValue?: DatePickerRawValueForFormat<F>;
  onValueChange?: (value: DatePickerRawValueForFormat<F> | undefined) => void;
  min?: DatePickerRawValueForFormat<F>;
  max?: DatePickerRawValueForFormat<F>;
  disabled?: boolean;
  isDateDisabled?: (date: Temporal.PlainDate) => boolean;
  timeZone?: string;
  locale?: string;
  className?: string;
  components: DatePickerTyped<F>;
}

export function StyledDatePicker<F extends DatePickerValueFormat>({
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
}: StyledDatePickerProps<F>) {
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
      <div className={cn("p-3", className)}>
        <div className="flex items-center justify-between gap-1 px-1 pb-3">
          <StyledPrevMonthButton />
          <StyledMonthYearString />
          <StyledNextMonthButton />
        </div>

        <StyledGrid>
          <StyledGridHeader>
            <StyledGridHeaderCell />
          </StyledGridHeader>
          <StyledGridBody>
            <StyledWeekTemplate>
              <StyledDayTemplate />
            </StyledWeekTemplate>
          </StyledGridBody>
        </StyledGrid>
      </div>
    </DP.Root>
  );
}
