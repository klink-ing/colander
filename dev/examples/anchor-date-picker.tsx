import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Temporal } from "@js-temporal/polyfill";
import type {
  ValueFormat,
  DateRange,
  Components,
  RawValueForFormat,
} from "base-ui-cal";
import { cn } from "../lib/utils";

interface AnchorDatePickerProps<F extends ValueFormat> {
  value?: DateRange<F> | null;
  defaultValue?: DateRange<F>;
  onValueChange?: (value: DateRange<F> | null) => void;
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
  showWeekNumbers?: boolean;
  onMonthChange?: (month: Temporal.PlainYearMonth) => void;
}

export function AnchorDatePicker<F extends ValueFormat = ValueFormat>({
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
  showWeekNumbers: _showWeekNumbers,
  onMonthChange,
}: AnchorDatePickerProps<F>) {
  return (
    <DP.Root
      selectionMode="range"
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
    >
      <div className={cn("p-3", className)} data-testid="anchor-datepicker">
        <div className="flex items-center justify-between gap-1 px-1 pb-3">
          <DP.PrevMonthButton
            data-testid="button-prev-month"
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-md",
              "text-muted-foreground transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </DP.PrevMonthButton>
          <DP.MonthYearString
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
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </DP.NextMonthButton>
        </div>

        <DP.Grid
          mode="grid"
          autoFocus={autoFocus}
          className="grid w-full grid-cols-[repeat(var(--calendar-days-per-week),1fr)]"
        >
          <DP.GridHeader
            className={cn(
              "col-span-full grid [grid-template-columns:subgrid]",
              "[&>tr]:col-span-full [&>tr]:grid [&>tr]:[grid-template-columns:subgrid]",
            )}
          >
            <DP.GridHeaderCell className="flex justify-end p-1 text-center text-[0.8rem] font-normal text-muted-foreground" />
          </DP.GridHeader>
          <DP.GridBody className="col-span-full grid [grid-template-columns:subgrid]">
            <DP.WeekTemplate className="relative col-span-full grid [grid-template-columns:subgrid]">
              <DP.SelectedRange
                render={(props, state) => {
                  if (!state.active) {
                    return <td {...props} hidden style={{ display: "none" }} />;
                  }

                  const startAnchor = `--day-${state.startDate}`;
                  const endAnchor = `--day-${state.endDate}`;

                  return (
                    <td
                      {...props}
                      data-testid="selected-range"
                      className={cn(
                        "pointer-events-none rounded-md bg-primary/15",
                        state.extendsBefore && "rounded-l-none",
                        state.extendsAfter && "rounded-r-none",
                      )}
                      style={{
                        position: "absolute",
                        top: `anchor(${startAnchor} top)`,
                        bottom: `anchor(${startAnchor} bottom)`,
                        left: `anchor(${startAnchor} left)`,
                        right: `anchor(${endAnchor} right)`,
                      }}
                    />
                  );
                }}
              />
              <DP.DayCellTemplate className="text-center">
                <DP.DayButton
                  render={(props, state) => {
                    const anchorName = `day-${state.date.toString()}`;
                    return (
                      <button
                        {...props}
                        style={{
                          ...((props as any).style ?? {}),
                          anchorName: `--${anchorName}`,
                        }}
                        className={cn(
                          "relative inline-flex min-w-[calc(2ch+(2*var(--spacing)))] items-center justify-end rounded-md p-1 text-sm font-normal tabular-nums transition-colors",
                          "focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          "text-foreground hover:bg-accent hover:text-accent-foreground",
                          state.outsideMonth &&
                            "text-muted-foreground opacity-40",
                          state.today &&
                            !state.selected &&
                            "bg-accent text-accent-foreground",
                          state.selected &&
                            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                          state.disabled && "pointer-events-none opacity-50",
                        )}
                      />
                    );
                  }}
                />
              </DP.DayCellTemplate>
            </DP.WeekTemplate>
          </DP.GridBody>
        </DP.Grid>
      </div>
    </DP.Root>
  );
}
