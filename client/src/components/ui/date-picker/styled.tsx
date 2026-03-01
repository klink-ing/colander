import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DaysGrid,
  WeekTemplate,
  DayCellTemplate,
  DayButtonTemplate,
  DayLabels,
  DayLabel,
  MonthYearString,
  DateString,
  TimeString,
  PrevMonthButton,
  NextMonthButton,
} from "./index";
import type {
  DaysGridProps,
  WeekTemplateProps,
  DayCellTemplateProps,
  DayButtonTemplateProps,
  DayLabelsProps,
  DayLabelProps,
  MonthYearStringProps,
  DateStringProps,
  TimeStringProps,
  PrevMonthButtonProps,
  NextMonthButtonProps,
} from "./types";

export function StyledPrevMonthButton({
  className,
  render: _render,
  ...props
}: PrevMonthButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <PrevMonthButton
      data-testid="button-prev-month"
      {...props}
      render={(renderProps, state) => (
        <button
          {...renderProps}
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-md",
            "text-muted-foreground transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            state.disabled && "pointer-events-none opacity-50",
            className,
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
    />
  );
}

export function StyledNextMonthButton({
  className,
  render: _render,
  ...props
}: NextMonthButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <NextMonthButton
      data-testid="button-next-month"
      {...props}
      render={(renderProps, state) => (
        <button
          {...renderProps}
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-md",
            "text-muted-foreground transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            state.disabled && "pointer-events-none opacity-50",
            className,
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    />
  );
}

export function StyledMonthYearString({
  className,
  ...props
}: MonthYearStringProps & { ref?: React.Ref<HTMLSpanElement> }) {
  return (
    <MonthYearString
      data-testid="text-current-month"
      {...props}
      className={cn("text-sm font-medium", className)}
    />
  );
}

export function StyledDateString({
  className,
  ...props
}: DateStringProps & { ref?: React.Ref<HTMLSpanElement> }) {
  return (
    <DateString {...props} className={cn("text-xs text-muted-foreground", className)} />
  );
}

export function StyledTimeString({
  className,
  ...props
}: TimeStringProps & { ref?: React.Ref<HTMLSpanElement> }) {
  return (
    <TimeString
      {...props}
      className={cn("text-sm text-muted-foreground", className)}
    />
  );
}

export function StyledDaysGrid({
  className,
  ...props
}: DaysGridProps & { ref?: React.Ref<HTMLTableElement> }) {
  return (
    <DaysGrid
      mode="grid"
      {...props}
      className={cn("w-full table-fixed border-collapse", className)}
    />
  );
}

export function StyledDayLabels({
  className,
  ...props
}: DayLabelsProps & { ref?: React.Ref<HTMLTableSectionElement> }) {
  return <DayLabels {...props} className={cn("", className)} />;
}

export function StyledDayLabel({
  className,
  ...props
}: DayLabelProps & { ref?: React.Ref<HTMLTableCellElement> }) {
  return (
    <DayLabel
      {...props}
      className={cn(
        "h-9 w-9 text-center text-[0.8rem] font-normal text-muted-foreground",
        className,
      )}
    />
  );
}

export function StyledWeekTemplate({
  className,
  ...props
}: WeekTemplateProps & { ref?: React.Ref<HTMLTableRowElement> }) {
  return (
    <WeekTemplate {...props} className={cn("", className)} />
  );
}

export function StyledDayCellTemplate({
  className,
  ...props
}: DayCellTemplateProps & { ref?: React.Ref<HTMLTableCellElement> }) {
  return <DayCellTemplate {...props} className={cn("text-center", className)} />;
}

export function StyledDayButtonTemplate({
  className,
  render: _render,
  ...props
}: DayButtonTemplateProps & { ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <DayButtonTemplate
      {...props}
      render={(renderProps, state) => (
        <button
          {...renderProps}
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
            className,
          )}
        />
      )}
    />
  );
}

export function StyledDayTemplate({
  cellClassName,
  buttonClassName,
  cellRef,
  buttonRef,
  date,
}: {
  cellClassName?: string;
  buttonClassName?: string;
  cellRef?: React.Ref<HTMLTableCellElement>;
  buttonRef?: React.Ref<HTMLButtonElement>;
  date?: import("@js-temporal/polyfill").Temporal.PlainDate;
}) {
  return (
    <StyledDayCellTemplate ref={cellRef} className={cellClassName} date={date}>
      <StyledDayButtonTemplate ref={buttonRef} className={buttonClassName} />
    </StyledDayCellTemplate>
  );
}
