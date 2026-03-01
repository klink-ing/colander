import { Temporal } from "@js-temporal/polyfill";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

interface RenderPropDatePickerProps<F extends DatePickerValueFormat> {
  value?: DatePickerRawValueForFormat<F>;
  defaultValue?: DatePickerRawValueForFormat<F>;
  onValueChange?: (value: DatePickerRawValueForFormat<F> | undefined) => void;
  min?: DatePickerRawValueForFormat<F>;
  max?: DatePickerRawValueForFormat<F>;
  disabled?: (date: Temporal.PlainDate) => boolean;
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

        <DP.MonthString
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
        <DP.DayLabels
          render={(props, state) => <div {...props} className="contents" />}
        >
          <DP.DayLabel
            render={(props, state) => (
              <span
                {...props}
                className="flex h-9 w-9 items-center justify-center text-[0.8rem] font-normal text-muted-foreground"
              >
                {state.short}
              </span>
            )}
          />
        </DP.DayLabels>
        <DP.DaysGrid
          mode="grid"
          className="grid grid-cols-subgrid col-span-full pt-4"
          render={(props, state) => <div {...props} data-testid="monthgrid" />}
        >
          <DP.WeekTemplate
            className="grid col-span-full grid-cols-subgrid"
            render={(props, state) => <div {...props} />}
          >
            <DP.DayTemplate
              render={(props, state) => (
                <button
                  {...props}
                  className={cn(
                    "relative inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-normal transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:z-10",
                    state.outsideMonth && "text-muted-foreground opacity-40",
                    !state.outsideMonth &&
                      !state.selected &&
                      !state.today &&
                      "text-foreground hover:bg-accent hover:text-accent-foreground",
                    state.today &&
                      !state.selected &&
                      "bg-accent text-accent-foreground",
                    state.selected && "bg-primary text-primary-foreground",
                    state.disabled && "pointer-events-none opacity-50",
                  )}
                />
              )}
            />
          </DP.WeekTemplate>
        </DP.DaysGrid>
      </div>
    </DP.Root>
  );
}
