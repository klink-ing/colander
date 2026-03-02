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
  SelectedRange,
} from "./index";
import type {
  ValueFormat,
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
  SelectedRangeProps,
} from "./types";

export function StyledPrevMonthButton<F extends ValueFormat = ValueFormat>({
  className,
  ...props
}: PrevMonthButtonProps<F> & { ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <PrevMonthButton
      data-testid="button-prev-month"
      {...(props as PrevMonthButtonProps)}
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

export function StyledNextMonthButton<F extends ValueFormat = ValueFormat>({
  className,
  ...props
}: NextMonthButtonProps<F> & { ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <NextMonthButton
      data-testid="button-next-month"
      {...(props as NextMonthButtonProps)}
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

export function StyledMonthYearString<F extends ValueFormat = ValueFormat>({
  className,
  ...props
}: MonthYearStringProps<F> & { ref?: React.Ref<HTMLSpanElement> }) {
  return (
    <MonthYearString
      data-testid="text-current-month"
      {...(props as MonthYearStringProps)}
      className={cn("text-sm font-medium", className)}
    />
  );
}

export function StyledDateString<F extends ValueFormat = ValueFormat>({
  className,
  ...props
}: DateStringProps<F> & { ref?: React.Ref<HTMLSpanElement> }) {
  return (
    <DateString
      {...(props as DateStringProps)}
      className={cn("text-xs text-muted-foreground", className)}
    />
  );
}

export function StyledTimeString<F extends ValueFormat = ValueFormat>({
  className,
  ...props
}: TimeStringProps<F> & { ref?: React.Ref<HTMLSpanElement> }) {
  return (
    <TimeString
      {...(props as TimeStringProps)}
      className={cn("text-sm text-muted-foreground", className)}
    />
  );
}

export function StyledGrid<F extends ValueFormat = ValueFormat>({
  className,
  ...props
}: GridProps<F> & { ref?: React.Ref<HTMLTableElement> }) {
  return (
    <Grid
      mode="grid"
      {...(props as GridProps)}
      className={cn(
        "grid w-full grid-cols-[repeat(var(--calendar-days-per-week),1fr)]",
        className,
      )}
    />
  );
}

export function StyledGridHeader<F extends ValueFormat = ValueFormat>({
  className,
  ...props
}: GridHeaderProps<F> & { ref?: React.Ref<HTMLTableSectionElement> }) {
  return (
    <GridHeader
      {...(props as GridHeaderProps)}
      className={cn(
        "col-span-full grid [grid-template-columns:subgrid]",
        "[&>tr]:col-span-full [&>tr]:grid [&>tr]:[grid-template-columns:subgrid]",
        className,
      )}
    />
  );
}

export function StyledGridHeaderCell<F extends ValueFormat = ValueFormat>({
  className,
  ...props
}: GridHeaderCellProps<F> & { ref?: React.Ref<HTMLTableCellElement> }) {
  return (
    <GridHeaderCell
      {...(props as GridHeaderCellProps)}
      className={cn(
        "flex justify-end p-1 text-center text-[0.8rem] font-normal text-muted-foreground",
        className,
      )}
    />
  );
}

export function StyledGridBody<F extends ValueFormat = ValueFormat>({
  className,
  ...props
}: GridBodyProps<F> & { ref?: React.Ref<HTMLTableSectionElement> }) {
  return (
    <GridBody
      {...(props as GridBodyProps)}
      className={cn(
        "col-span-full grid [grid-template-columns:subgrid]",
        className,
      )}
    />
  );
}

export function StyledWeekTemplate<F extends ValueFormat = ValueFormat>({
  className,
  ...props
}: WeekTemplateProps<F> & { ref?: React.Ref<HTMLTableRowElement> }) {
  return (
    <WeekTemplate
      {...(props as WeekTemplateProps)}
      className={cn(
        "col-span-full grid [grid-template-columns:subgrid]",
        className,
      )}
    />
  );
}

export function StyledDayCellTemplate<F extends ValueFormat = ValueFormat>({
  className,
  ...props
}: DayCellTemplateProps<F> & { ref?: React.Ref<HTMLTableCellElement> }) {
  return (
    <DayCellTemplate
      {...(props as DayCellTemplateProps)}
      className={cn("text-center", className)}
    />
  );
}

export function StyledDayButton<F extends ValueFormat = ValueFormat>({
  className,
  ...props
}: DayButtonProps<F> & { ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <DayButton
      {...(props as DayButtonProps)}
      className={cn(
        "relative inline-flex min-w-[calc(2ch+(2*var(--spacing)))] items-center justify-end rounded-md p-1 text-sm font-normal tabular-nums transition-colors",
        "focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "text-foreground hover:bg-accent hover:text-accent-foreground",
        "data-[outside-month]:text-muted-foreground data-[outside-month]:opacity-40",
        "data-[today]:bg-accent data-[today]:text-accent-foreground",
        "data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary data-[selected]:hover:text-primary-foreground",
        "data-[range-start]:bg-primary data-[range-start]:text-primary-foreground data-[range-start]:rounded-full data-[range-start]:hover:bg-primary data-[range-start]:hover:text-primary-foreground",
        "data-[range-end]:bg-primary data-[range-end]:text-primary-foreground data-[range-end]:rounded-full data-[range-end]:hover:bg-primary data-[range-end]:hover:text-primary-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
    />
  );
}

export function StyledDayTemplate<F extends ValueFormat = ValueFormat>({
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
  const Cell = StyledDayCellTemplate<F>;
  const Button = StyledDayButton<F>;
  return (
    <Cell ref={cellRef} className={cellClassName} date={date}>
      <Button ref={buttonRef} className={buttonClassName} />
    </Cell>
  );
}

export function StyledSelectedRange<F extends ValueFormat = ValueFormat>({
  className,
  ...props
}: SelectedRangeProps<F> & { ref?: React.Ref<HTMLTableCellElement> }) {
  return (
    <SelectedRange
      {...(props as SelectedRangeProps)}
      className={cn(
        "rounded-md bg-primary/15",
        "data-[extends-before]:rounded-l-none data-[extends-after]:rounded-r-none",
        className,
      )}
    />
  );
}
