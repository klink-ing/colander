import { useContext } from "react";

import { cn } from "../lib/utils";
import { DragHandle, DragDayButton } from "../lib/drag-components";
import {
  Grid,
  GridBody,
  WeekTemplate,
  DayCellTemplate,
  GridHeader,
  GridHeaderCell,
  MonthYearString,
  DateString,
  TimeString,
  PrevMonthButton,
  NextMonthButton,
  SelectedRange,
  RangePreview,
  useDatePicker,
  DayCellDataContext,
  GridContext,
} from "base-ui-cal";
import type { Temporal } from "@js-temporal/polyfill";
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
  RangePreviewProps,
} from "base-ui-cal";

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
      ←
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
      →
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
        "col-span-full grid gap-y-1 [grid-template-columns:subgrid]",
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

export function StyledDayCellTemplate<F extends ValueFormat = ValueFormat>(
  allProps: DayCellTemplateProps<F> & {
    ref?: React.Ref<HTMLTableCellElement>;
    columnOffset?: number;
    allowRangeReversal?: boolean;
  },
) {
  const {
    className,
    columnOffset = 0,
    allowRangeReversal,
    ...props
  } = allProps;
  return (
    <DayCellTemplate
      {...(props as DayCellTemplateProps)}
      render={(renderProps, state) => {
        const gridStyle =
          state.columnIndex >= 0
            ? state.orientation === "horizontal"
              ? { gridColumn: state.columnIndex + 1 + columnOffset, gridRow: 1 }
              : {
                  gridRow: state.columnIndex + 1 + columnOffset,
                  gridColumn: 1,
                }
            : undefined;
        return (
          <td
            {...renderProps}
            style={gridStyle}
            className={cn("relative text-center", className)}
          >
            <StyledDayButton date={state.date} />
            <StyledDragHandle
              edge="start"
              allowRangeReversal={allowRangeReversal}
            />
            <StyledDragHandle
              edge="end"
              allowRangeReversal={allowRangeReversal}
            />
          </td>
        );
      }}
    />
  );
}

export function StyledDayButton<F extends ValueFormat = ValueFormat>({
  className,
  date,
  children,
  ...props
}: DayButtonProps<F> & { ref?: React.Ref<HTMLButtonElement> }) {
  return (
    <DragDayButton
      date={date}
      {...(props as DayButtonProps)}
      className={cn(
        "group relative inline-flex min-w-[calc(2ch+(4*var(--spacing)))] items-center justify-center rounded-md px-2 py-1 text-sm font-normal tabular-nums",
        "focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "text-foreground hover:bg-accent hover:text-accent-foreground hover:data-in-range:bg-white/20",
        "data-outside-month:text-muted-foreground data-outside-month:opacity-40",
        "data-selected:bg-primary data-selected:text-primary-foreground data-selected:hover:bg-primary data-selected:hover:text-primary-foreground",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        "isolate select-none data-in-range:data-outside-month:text-primary-foreground data-in-range:text-primary-foreground data-in-range:data-outside-month:opacity-70",
        className,
      )}
      render={({ children, ...props }) => {
        return (
          <button {...props}>
            {
              <div
                className={cn(
                  "absolute z-0 hidden aspect-square size-[1.6em] rounded-full bg-neutral-200 group-data-today:block group-data-selected:bg-white/50 group-data-in-range:bg-white/20",
                )}
              />
            }
            <div className="isolate inline-block w-[2ch] text-right">{children}</div>
          </button>
        );
      }}
    ></DragDayButton>
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
  date?: Temporal.PlainDate;
}) {
  const Cell = StyledDayCellTemplate<F>;
  const Button = StyledDayButton<F>;
  return (
    <Cell ref={cellRef} className={cellClassName} date={date}>
      <Button ref={buttonRef} className={buttonClassName} />
    </Cell>
  );
}

export function StyledDragHandle({
  edge,
  allowRangeReversal,
  className,
}: {
  edge: "start" | "end";
  allowRangeReversal?: boolean;
  className?: string;
}) {
  const { rangeStart, rangeEnd, temporal: T, selectionMode } = useDatePicker();
  const { orientation } = useContext(GridContext);
  const cellData = useContext(DayCellDataContext);

  const date = cellData?.date;

  const bothActive =
    date &&
    rangeStart &&
    rangeEnd &&
    T.PlainDate.compare(date, rangeStart) === 0 &&
    T.PlainDate.compare(date, rangeEnd) === 0;

  const isStart = edge === "start";
  const classNames: string[] = [
    "absolute inset-0 z-20 flex outline-none",
    "before:block  before:bg-white/80 before:transition-colors hover:before:bg-white  ",
  ];
  if (orientation === "horizontal") {
    classNames.push("items-center before:h-3 before:w-1.5");
    classNames.push(
      isStart
        ? "justify-start before:rounded-r-full"
        : "justify-end before:rounded-l-full",
    );
    if (bothActive) {
      classNames.push(isStart ? "right-1/2" : "left-1/2");
    }
  } else {
    classNames.push("justify-center before:h-1.5 before:w-4");
    classNames.push(
      isStart
        ? "items-start before:rounded-b-full"
        : "items-end before:rounded-t-full",
    );
    if (bothActive) {
      classNames.push(isStart ? "bottom-1/2" : "top-1/2");
    }
  }

  return (
    <DragHandle
      edge={edge}
      allowRangeReversal={allowRangeReversal}
      className={cn(classNames, className)}
    />
  );
}

export function StyledRangePreview<F extends ValueFormat = ValueFormat>(
  allProps: RangePreviewProps<F> & {
    ref?: React.Ref<HTMLTableCellElement>;
    columnOffset?: number;
  },
) {
  const { className, columnOffset = 0, ...props } = allProps;
  return (
    <RangePreview
      {...(props as RangePreviewProps)}
      render={(renderProps, state) => {
        if (!state.active) {
          return <td {...renderProps} hidden style={{ display: "none" }} />;
        }
        const horizontal = state.orientation === "horizontal";
        const span = `${state.startIndex + 1 + columnOffset} / ${state.endIndex + 2 + columnOffset}`;
        const gridStyle = horizontal
          ? { gridColumn: span, gridRow: 1 }
          : { gridRow: span, gridColumn: 1 };
        return (
          <td
            {...renderProps}
            style={gridStyle}
            className={cn(
              "z-10 pointer-events-none relative",
              className,
            )}
          >
            {/* White solid line */}
            <div className={cn(
              "absolute inset-0 rounded-md border border-white",
              horizontal
                ? "data-[extends-after]:rounded-r-none data-[extends-before]:rounded-l-none data-[extends-after]:border-r-0 data-[extends-before]:border-l-0"
                : "data-[extends-after]:rounded-b-none data-[extends-before]:rounded-t-none data-[extends-after]:border-b-0 data-[extends-before]:border-t-0",
            )} data-extends-before={state.extendsBefore || undefined} data-extends-after={state.extendsAfter || undefined} />
            {/* Blue dashed line on top */}
            <div className={cn(
              "absolute inset-0 rounded-md border border-dashed border-primary/80",
              horizontal
                ? "data-[extends-after]:rounded-r-none data-[extends-before]:rounded-l-none data-[extends-after]:border-r-0 data-[extends-before]:border-l-0"
                : "data-[extends-after]:rounded-b-none data-[extends-before]:rounded-t-none data-[extends-after]:border-b-0 data-[extends-before]:border-t-0",
            )} data-extends-before={state.extendsBefore || undefined} data-extends-after={state.extendsAfter || undefined} />
          </td>
        );
      }}
    />
  );
}

export function StyledSelectedRange<F extends ValueFormat = ValueFormat>(
  allProps: SelectedRangeProps<F> & {
    ref?: React.Ref<HTMLTableCellElement>;
    columnOffset?: number;
  },
) {
  const { className, columnOffset = 0, ...props } = allProps;
  return (
    <SelectedRange
      {...(props as SelectedRangeProps)}
      data-range-selection
      render={(renderProps, state) => {
        if (!state.active) {
          return <td {...renderProps} hidden style={{ display: "none" }} />;
        }
        const horizontal = state.orientation === "horizontal";
        const span = `${state.startIndex + 1 + columnOffset} / ${state.endIndex + 2 + columnOffset}`;
        return (
          <td
            {...renderProps}
            data-testid="selected-range"
            style={
              horizontal
                ? { gridColumn: span, gridRow: 1 }
                : { gridRow: span, gridColumn: 1 }
            }
            className={cn(
              "rounded-md bg-primary/80",
              horizontal
                ? "data-[extends-after]:rounded-r-none data-[extends-before]:rounded-l-none"
                : "data-[extends-after]:rounded-b-none data-[extends-before]:rounded-t-none",
              className,
            )}
          />
        );
      }}
    />
  );
}
