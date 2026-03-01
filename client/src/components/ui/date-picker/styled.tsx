import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DaysGrid,
  WeekTemplate,
  DayTemplate,
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
  DayTemplateProps,
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
}: DaysGridProps & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <DaysGrid
      mode="grid"
      {...props}
      className={cn("w-full grid grid-cols-[repeat(7,1fr)]", className)}
    />
  );
}

export function StyledDayLabels({
  className,
  ...props
}: DayLabelsProps & { ref?: React.Ref<HTMLDivElement> }) {
  return <DayLabels {...props} className={cn("contents", className)} />;
}

export function StyledDayLabel({
  className,
  ...props
}: DayLabelProps & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <DayLabel
      {...props}
      className={cn(
        "flex h-9 w-9 items-center justify-center text-[0.8rem] font-normal text-muted-foreground",
        className,
      )}
    />
  );
}

export function StyledWeekTemplate({
  className,
  ...props
}: WeekTemplateProps & { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <WeekTemplate {...props} className={cn("contents mt-0.5", className)} />
  );
}

export function StyledDayTemplate({
  className,
  render: _render,
  ...props
}: DayTemplateProps & { ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <DayTemplate
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
