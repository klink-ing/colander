import type { Temporal } from "@js-temporal/polyfill";
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
  StyledDayCellTemplate,
  StyledSelectedRange,
} from "./date-picker-styled";
import { cn } from "../lib/utils";

type StyledDatePickerProps<F extends ValueFormat> = {
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

export function StyledDatePicker<F extends ValueFormat = ValueFormat>(
  props: StyledDatePickerProps<F>,
) {
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
              <StyledSelectedRange />
              <StyledDayCellTemplate />
            </StyledWeekTemplate>
          </StyledGridBody>
        </StyledGrid>
      </div>
    </DP.Root>
  );
}
