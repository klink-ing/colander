import { useContext } from "react";

import {
  Grid,
  GridBody,
  WeekTemplate,
  DayCellTemplate,
  GridHeader,
  GridHeaderCell,
  MonthYearString,
  PrevMonthButton,
  NextMonthButton,
  RangeSelected,
  RangePreview,
  useCalendarStable,
  useCalendarState,
  DayCellDataContext,
  GridContext,
} from "colander";
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
  PrevMonthButtonProps,
  NextMonthButtonProps,
  RangeSelectedProps,
  RangePreviewProps,
} from "colander";
import { cn } from "#/lib/utils";
import { DragHandle, DragDayButton } from "#/lib/drag-components";

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
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
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
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
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

export function StyledGrid<F extends ValueFormat = ValueFormat>({
  className,
  ...props
}: GridProps<F> & { ref?: React.Ref<HTMLTableElement> }) {
  return (
    <Grid
      mode="grid"
      {...(props as GridProps)}
      className={cn(
        "grid w-full grid-cols-[repeat(var(--calendar-days-per-week),1fr)] gap-x-px",
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
        "col-span-full grid grid-cols-subgrid",
        "[&>tr]:col-span-full [&>tr]:grid [&>tr]:grid-cols-subgrid",
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
      className={cn("col-span-full grid grid-cols-subgrid gap-y-1", className)}
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
      render={(renderProps: any, state: any) => (
        <tr
          {...renderProps}
          className={cn("col-span-full grid grid-cols-subgrid", className)}
          style={state.gridRow ? { gridRow: state.gridRow } : undefined}
        />
      )}
    />
  );
}

export function StyledDayCellTemplate<F extends ValueFormat = ValueFormat>(
  allProps: DayCellTemplateProps<F> & {
    ref?: React.Ref<HTMLTableCellElement>;
    columnOffset?: number;
    preventRangeReversal?: boolean;
    showFirstOfMonthBorder?: boolean;
  },
) {
  const {
    className,
    columnOffset = 0,
    preventRangeReversal,
    showFirstOfMonthBorder,
    ...props
  } = allProps;
  return (
    <DayCellTemplate
      {...(props as DayCellTemplateProps)}
      render={(renderProps: any, state: any) => {
        const gridStyle =
          state.columnIndex >= 0
            ? state.orientation === "horizontal"
              ? { gridColumn: state.columnIndex + 1 + columnOffset, gridRow: 1 }
              : {
                  gridRow: state.columnIndex + 1 + columnOffset,
                  gridColumn: 1,
                }
            : undefined;
        const isFirstOfMonth = showFirstOfMonthBorder && state.date.day === 1;
        return (
          <td
            {...renderProps}
            style={gridStyle}
            className={cn("relative text-center", className)}
          >
            {isFirstOfMonth && (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 -ml-px w-0 border-l border-muted-foreground"
              />
            )}
            <StyledDayButton
              date={state.date}
              preventRangeReversal={preventRangeReversal}
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
  preventRangeReversal,
  ...props
}: DayButtonProps<F> & {
  ref?: React.Ref<HTMLButtonElement>;
  preventRangeReversal?: boolean;
}) {
  return (
    <DragDayButton
      date={date}
      {...(props as DayButtonProps)}
      className={cn(
        "group relative inline-flex min-w-[calc(2ch+(4*var(--spacing)))] items-center justify-center rounded-md px-2 py-1 text-sm font-normal tabular-nums",
        "focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        "text-foreground not-aria-disabled:hover:bg-accent not-aria-disabled:hover:data-in-range:bg-white/20",
        "data-outside-month:text-muted-foreground data-outside-month:opacity-40",
        "data-selected:bg-primary data-selected:text-primary-foreground data-selected:not-aria-disabled:hover:bg-primary",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        "isolate select-none data-in-range:text-primary-foreground data-in-range:data-outside-month:text-primary-foreground data-in-range:data-outside-month:opacity-70",
        className,
      )}
      render={({ children, ...props }: any) => {
        return (
          <button {...props}>
            {/* Current day indicator */}
            <div
              className={cn(
                "absolute z-0 hidden aspect-square size-[1.6em] rounded-full bg-muted group-data-in-range:bg-white/20 group-data-today:block group-data-selected:bg-white/20",
              )}
            />
            <div className="isolate inline-block min-w-[2ch] text-right">
              {children}
            </div>
            <StyledDragHandle
              edge="start"
              preventRangeReversal={preventRangeReversal}
            />
            <StyledDragHandle
              edge="end"
              preventRangeReversal={preventRangeReversal}
            />
          </button>
        );
      }}
    ></DragDayButton>
  );
}

export function StyledDragHandle({
  edge,
  preventRangeReversal,
  className,
}: {
  edge: "start" | "end";
  preventRangeReversal?: boolean;
  className?: string;
}) {
  const { temporal: T } = useCalendarStable();
  const { rangeStart, rangeEnd } = useCalendarState();
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
      preventRangeReversal={preventRangeReversal}
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
      render={(renderProps: any, state: any) => {
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
            className={cn("pointer-events-none relative z-10", className)}
          >
            {/* White solid line */}
            <div
              className={cn(
                "absolute inset-0 rounded-md border border-white",
                horizontal
                  ? "data-extends-after:rounded-r-none data-extends-after:border-r-0 data-extends-before:rounded-l-none data-extends-before:border-l-0"
                  : "data-extends-after:rounded-b-none data-extends-after:border-b-0 data-extends-before:rounded-t-none data-extends-before:border-t-0",
              )}
              data-extends-before={state.extendsBefore || undefined}
              data-extends-after={state.extendsAfter || undefined}
            />
            {/* Blue dashed line on top */}
            <div
              className={cn(
                "absolute inset-0 rounded-md border border-dashed border-primary/80",
                horizontal
                  ? "data-extends-after:rounded-r-none data-extends-after:border-r-0 data-extends-before:rounded-l-none data-extends-before:border-l-0"
                  : "data-extends-after:rounded-b-none data-extends-after:border-b-0 data-extends-before:rounded-t-none data-extends-before:border-t-0",
              )}
              data-extends-before={state.extendsBefore || undefined}
              data-extends-after={state.extendsAfter || undefined}
            />
          </td>
        );
      }}
    />
  );
}

export function StyledRangeSelected<F extends ValueFormat = ValueFormat>(
  allProps: RangeSelectedProps<F> & {
    ref?: React.Ref<HTMLTableCellElement>;
    columnOffset?: number;
  },
) {
  const { className, columnOffset = 0, ...props } = allProps;
  return (
    <RangeSelected
      {...(props as RangeSelectedProps)}
      data-range-selection
      render={(renderProps: any, state: any) => {
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
              "rounded-md bg-primary",
              horizontal
                ? "data-extends-after:rounded-r-none data-extends-before:rounded-l-none"
                : "data-extends-after:rounded-b-none data-extends-before:rounded-t-none",
              className,
            )}
          />
        );
      }}
    />
  );
}
