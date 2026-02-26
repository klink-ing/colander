import { Temporal } from "@js-temporal/polyfill";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import type { DatePickerDateValue, DatePickerValueFormat } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";

interface StyledDatePickerProps {
  value?: DatePickerDateValue;
  defaultValue?: DatePickerDateValue;
  onValueChange?: (value: DatePickerDateValue) => void;
  valueFormat?: DatePickerValueFormat;
  disabled?: (date: Temporal.PlainDate) => boolean;
  timeZone?: string;
  className?: string;
}

export function StyledDatePicker({
  value,
  defaultValue,
  onValueChange,
  valueFormat = "PlainDate",
  disabled,
  timeZone,
  className,
}: StyledDatePickerProps) {
  return (
    <DatePicker.Root
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      valueFormat={valueFormat}
      disabled={disabled}
      timeZone={timeZone}
    >
      <div className={cn("p-3", className)}>
        <div className="flex items-center justify-between gap-1 px-1 pb-3">
          <DatePicker.PrevMonthButton
            data-testid="button-prev-month"
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-md",
              "text-muted-foreground transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </DatePicker.PrevMonthButton>

          <DatePicker.MonthString
            data-testid="text-current-month"
            className="text-sm font-medium"
          />

          <DatePicker.NextMonthButton
            data-testid="button-next-month"
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-md",
              "text-muted-foreground transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </DatePicker.NextMonthButton>
        </div>

        <DatePicker.MonthGrid mode="grid" className="w-full">
          <DatePicker.DayLabel
            className="flex h-9 w-9 items-center justify-center text-[0.8rem] font-normal text-muted-foreground"
          />
          <DatePicker.Week className="grid grid-cols-7 mt-0.5">
            <DatePicker.Day
              render={(props, state) => (
                <button
                  {...props}
                  className={cn(
                    "relative inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-normal transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:z-10",
                    state.outsideMonth && "text-muted-foreground opacity-40",
                    !state.outsideMonth && !state.selected && !state.today && "text-foreground hover:bg-accent hover:text-accent-foreground",
                    state.today && !state.selected && "bg-accent text-accent-foreground",
                    state.selected && "bg-primary text-primary-foreground",
                    state.disabled && "pointer-events-none opacity-50",
                  )}
                />
              )}
            />
          </DatePicker.Week>
        </DatePicker.MonthGrid>
      </div>
    </DatePicker.Root>
  );
}
