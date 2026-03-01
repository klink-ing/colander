import { Temporal } from "@js-temporal/polyfill";
import type {
  DatePickerValueFormat,
  DatePickerRawValueForFormat,
  DatePickerTyped,
} from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  StyledDayLabels,
  StyledDayLabel,
  StyledWeekTemplate,
  StyledDayTemplate,
} from "@/components/ui/date-picker/styled";

interface RenderPropDatePickerProps<F extends DatePickerValueFormat> {
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

export function RenderPropDatePicker<F extends DatePickerValueFormat>({
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
}: RenderPropDatePickerProps<F>) {
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
      render={(props, state) => (
        <div
          {...props}
          data-testid="datepicker-root"
          className={cn("p-3", className)}
        />
      )}
    >
      <div className="flex items-center justify-between gap-1 px-1 pb-3">
        <DP.PrevMonthButton
          data-testid="button-prev-month"
          render={(props, state) => (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  {...props}
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-md",
                    "text-muted-foreground transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    state.disabled && "pointer-events-none opacity-50",
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {state.target.toLocaleString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </TooltipContent>
            </Tooltip>
          )}
        />

        <DP.MonthYearString
          data-testid="text-current-month"
          options={{ month: "short" }}
          render={({ children, ...props }, state) => (
            <span {...props} className="text-sm font-medium">
              Hi! {children}
            </span>
          )}
        />
        <DP.DateString options={{ year: "2-digit" }} className="text-xs" />

        <DP.NextMonthButton
          data-testid="button-next-month"
          render={(props, state) => (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  {...props}
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-md",
                    "text-muted-foreground transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    state.disabled && "pointer-events-none opacity-50",
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {new Date(
                  state.target.year,
                  state.target.month - 1,
                ).toLocaleDateString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </TooltipContent>
            </Tooltip>
          )}
        />
      </div>

      <div
        className="grid grid-cols-[repeat(7,1fr)] w-full"
        data-id="days wrapper"
      >
        <StyledDayLabels>
          <StyledDayLabel />
        </StyledDayLabels>
        <DP.DaysGrid
          mode="grid"
          className="grid grid-cols-subgrid col-span-full pt-4"
          render={(props, state) => <div {...props} data-testid="monthgrid" />}
        >
          <StyledWeekTemplate className="grid col-span-full grid-cols-subgrid">
            <StyledDayTemplate />
          </StyledWeekTemplate>
        </DP.DaysGrid>
      </div>
    </DP.Root>
  );
}
