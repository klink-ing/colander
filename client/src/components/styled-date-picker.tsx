import { Temporal } from "@js-temporal/polyfill";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type {
  DatePickerValueFormat,
  DatePickerValueForFormat,
  DatePickerTyped,
  DatePickerRawValueForFormat,
} from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";

interface StyledDatePickerProps<F extends DatePickerValueFormat> {
  value?: DatePickerRawValueForFormat<F>;
  defaultValue?: DatePickerRawValueForFormat<F>;
  onValueChange?: (value: DatePickerValueForFormat<F>) => void;
  disabled?: (date: Temporal.PlainDate) => boolean;
  timeZone?: string;
  locale?: string;
  className?: string;
  components: DatePickerTyped<F>;
}

export function StyledDatePicker<F extends DatePickerValueFormat>({
  value,
  defaultValue,
  onValueChange,
  disabled,
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
      disabled={disabled}
      timeZone={timeZone}
      locale={locale}
    >
      <div className={cn("p-3", className)}>
        <div className="flex items-center justify-between gap-1 px-1 pb-3">
          <DP.PrevMonthButton
            data-testid="button-prev-month"
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-md",
              "text-muted-foreground transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </DP.PrevMonthButton>

          <DP.MonthString
            data-testid="text-current-month"
            className="text-sm font-medium"
          />

          <DP.NextMonthButton
            data-testid="button-next-month"
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-md",
              "text-muted-foreground transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </DP.NextMonthButton>
        </div>

        <DP.MonthGrid mode="grid" className="w-full">
          <DP.DayLabels className="grid grid-cols-7">
            <DP.DayLabel className="flex h-9 w-9 items-center justify-center text-[0.8rem] font-normal text-muted-foreground" />
          </DP.DayLabels>
          <DP.Week className="grid grid-cols-7 mt-0.5">
            <DP.Day
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
          </DP.Week>
        </DP.MonthGrid>
      </div>
    </DP.Root>
  );
}
