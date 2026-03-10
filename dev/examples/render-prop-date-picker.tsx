import { Temporal } from "@js-temporal/polyfill";
import type {
  ValueFormat,
  RawValueForFormat,
  Components,
} from "base-ui-cal";
import { cn } from "../lib/utils";

import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  StyledGridHeader,
  StyledGridHeaderCell,
  StyledGridBody,
  StyledWeekTemplate,
  StyledDayTemplate,
} from "./date-picker-styled";

interface RenderPropDatePickerProps<F extends ValueFormat> {
  value?: RawValueForFormat<F>;
  defaultValue?: RawValueForFormat<F>;
  onValueChange?: (value: RawValueForFormat<F> | undefined) => void;
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
  onMonthChange?: (month: Temporal.PlainYearMonth) => void;
}

export function RenderPropDatePicker<F extends ValueFormat>({
  value,
  defaultValue,
  onValueChange,
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
  onMonthChange,
}: RenderPropDatePickerProps<F>) {
  return (
    <DP.Root
      value={value as any}
      defaultValue={defaultValue as any}
      onValueChange={onValueChange as any}
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
            <button
              {...props}
              title={state.target.toLocaleString(undefined, {
                month: "long",
                year: "numeric",
              })}
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
            <button
              {...props}
              title={new Date(
                state.target.year,
                state.target.month - 1,
              ).toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
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
          )}
        />
      </div>

      <DP.Grid
        mode="grid"
        autoFocus={autoFocus}
        className="grid w-full grid-cols-[repeat(var(--calendar-days-per-week),1fr)]"
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
