import { Temporal } from "@js-temporal/polyfill";
import type {
  ValueFormat,
  RawValueForFormat,
  TypedDatePicker,
} from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  StyledGridHeader,
  StyledGridHeaderCell,
  StyledGridBody,
  StyledWeekTemplate,
  StyledDayTemplate,
} from "@/components/ui/date-picker/styled";


interface RenderPropDatePickerProps<F extends ValueFormat> {
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
  components: TypedDatePicker<F>;
}

export function RenderPropDatePicker<F extends ValueFormat>({
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
          options={{ month: "short", year: "numeric" }}
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

      <DP.Grid
        className="w-full table-fixed border-collapse"
        data-testid="monthgrid"
      >
        <StyledGridHeader>
          <StyledGridHeaderCell />
        </StyledGridHeader>
        <StyledGridBody>
          <StyledWeekTemplate>
            <StyledDayTemplate />
          </StyledWeekTemplate>
        </StyledGridBody>
      </DP.Grid>
    </DP.Root>
  );
}
