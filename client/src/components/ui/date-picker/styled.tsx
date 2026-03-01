import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Grid,
  GridBody,
  WeekTemplate,
  DayCellTemplate,
  DayButton,
  GridHeader,
  GridHeaderCell,
  MonthYearString,
  DateString,
  TimeString,
  PrevMonthButton,
  NextMonthButton,
} from "./index";
import type {
  GridProps,
  GridBodyProps,
  WeekTemplateProps,
  DayCellTemplateProps,
  DayButtonProps,
  GridHeaderProps,
  GridHeaderCellProps,
  MonthYearStringProps,
  DateStringProps,
  TimeStringProps,
  PrevMonthButtonProps,
  NextMonthButtonProps,
} from "./types";

export function StyledPrevMonthButton({
  className,
  ...props
}: PrevMonthButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <PrevMonthButton
      data-testid="button-prev-month"
      {...props}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md",
        "text-muted-foreground transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      <ChevronLeft className="h-4 w-4" />
    </PrevMonthButton>
  );
}

export function StyledNextMonthButton({
  className,
  ...props
}: NextMonthButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <NextMonthButton
      data-testid="button-next-month"
      {...props}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md",
        "text-muted-foreground transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
    >
      <ChevronRight className="h-4 w-4" />
    </NextMonthButton>
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

export function StyledGrid({
  className,
  ...props
}: GridProps & { ref?: React.Ref<HTMLTableElement> }) {
  return (
    <Grid
      mode="grid"
      {...props}
      className={cn("w-full table-fixed border-collapse", className)}
    />
  );
}

export function StyledGridHeader({
  className,
  ...props
}: GridHeaderProps & { ref?: React.Ref<HTMLTableSectionElement> }) {
  return <GridHeader {...props} className={cn("", className)} />;
}

export function StyledGridHeaderCell({
  className,
  ...props
}: GridHeaderCellProps & { ref?: React.Ref<HTMLTableCellElement> }) {
  return (
    <GridHeaderCell
      {...props}
      className={cn(
        "h-9 w-9 text-center text-[0.8rem] font-normal text-muted-foreground",
        className,
      )}
    />
  );
}

export function StyledGridBody({
  className,
  ...props
}: GridBodyProps & { ref?: React.Ref<HTMLTableSectionElement> }) {
  return <GridBody {...props} className={cn("", className)} />;
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

export function StyledDayButton({
  className,
  ...props
}: DayButtonProps & { ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <DayButton
      {...props}
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-normal transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:z-10",
        "text-foreground hover:bg-accent hover:text-accent-foreground",
        "data-[outside-month]:text-muted-foreground data-[outside-month]:opacity-40",
        "data-[today]:bg-accent data-[today]:text-accent-foreground",
        "data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary data-[selected]:hover:text-primary-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
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
      <StyledDayButton ref={buttonRef} className={buttonClassName} />
    </StyledDayCellTemplate>
  );
}
