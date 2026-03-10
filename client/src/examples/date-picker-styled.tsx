import { useContext, useEffect, useRef, useState } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { disableNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
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
  RangeStartDragHandle,
  RangeEndDragHandle,
  useDatePicker,
} from "@/components/ui/date-picker";
import { DayCellDataContext } from "@/components/ui/date-picker/context";
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
  RangeStartDragHandleProps,
  RangeEndDragHandleProps,
  TemporalNamespace,
} from "@/components/ui/date-picker";

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

export function StyledDayCellTemplate<F extends ValueFormat = ValueFormat>({
  className,
  ...props
}: DayCellTemplateProps<F> & { ref?: React.Ref<HTMLTableCellElement> }) {
  return (
    <DayCellTemplate
      {...(props as DayCellTemplateProps)}
      render={(renderProps, state) => {
        const gridStyle =
          state.columnIndex >= 0
            ? state.orientation === "horizontal"
              ? { gridRow: state.columnIndex + 1, gridColumn: 1 }
              : { gridColumn: state.columnIndex + 1, gridRow: 1 }
            : undefined;
        return (
          <td
            {...renderProps}
            style={gridStyle}
            className={cn("relative text-center", className)}
          >
            <StyledDayButton date={state.date} />
            <StyledRangeStartDragHandle />
            <StyledRangeEndDragHandle />
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
  const dropRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = dropRef.current;
    if (!el || !date) return;
    return dropTargetForElements({
      element: el,
      getData: () => ({ date: date.toString() }),
      canDrop: ({ source }) => source.data.type === "date-range-handle",
      getIsSticky: () => true,
    });
  }, [date]);

  return (
    <DayButton
      ref={dropRef}
      date={date}
      {...(props as DayButtonProps)}
      className={cn(
        "group relative inline-flex min-w-[calc(2ch+(4*var(--spacing)))] items-center justify-center rounded-md px-2 py-1 text-sm font-normal tabular-nums",
        "focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "text-foreground hover:bg-accent hover:text-accent-foreground",
        "data-[outside-month]:text-muted-foreground data-[outside-month]:opacity-40",
        "data-[today]:bg-accent data-[today]:text-accent-foreground",
        "data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary data-[selected]:hover:text-primary-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "isolate select-none data-[in-range]:data-[outside-month]:text-primary-foreground data-[in-range]:text-primary-foreground data-[in-range]:data-[outside-month]:opacity-70",
        className,
      )}
      render={({ children, ...props }, state) => {
        return (
          <button {...props}>
            <div
              className={cn(
                "absolute -z-0 hidden aspect-square size-[1.5em] rounded-full bg-red-500 group-data-[range-boundary]:block",
              )}
            />
            <div className="isolate">{children}</div>
          </button>
        );
      }}
    ></DayButton>
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

// --- DnD wiring for drag handles ---

function useDragHandleDnD(
  edge: "start" | "end",
  handleRef: React.RefObject<HTMLSpanElement | null>,
) {
  const { rangeStart, rangeEnd, setRange, temporal: T } = useDatePicker();
  const cellData = useContext(DayCellDataContext);
  const date = cellData?.date;

  const isActive =
    edge === "start"
      ? !!(date && rangeStart && T.PlainDate.compare(date, rangeStart) === 0)
      : !!(date && rangeEnd && T.PlainDate.compare(date, rangeEnd) === 0);

  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const rangeRef = useRef({ start: rangeStart, end: rangeEnd });
  rangeRef.current = { start: rangeStart, end: rangeEnd };

  const TRef = useRef<TemporalNamespace>(T);
  TRef.current = T;

  const setRangeRef = useRef(setRange);
  setRangeRef.current = setRange;

  const edgeRef = useRef(edge);
  edgeRef.current = edge;

  useEffect(() => {
    const el = handleRef.current;
    if (!el || !isActive) return;
    const cleanup = draggable({
      element: el,
      getInitialData: () => ({ type: "date-range-handle", edge }),
      onGenerateDragPreview: ({ nativeSetDragImage }) => {
        disableNativeDragPreview({ nativeSetDragImage });
      },
      onDragStart: () => {
        draggingRef.current = true;
        setDragging(true);
        document.body.style.cursor = "grabbing";
      },
      onDrop: () => {
        draggingRef.current = false;
        setDragging(false);
        document.body.style.cursor = "";
      },
    });
    return () => {
      cleanup();
      if (draggingRef.current) {
        document.body.style.cursor = "";
      }
    };
  }, [isActive, edge, handleRef]);

  useEffect(() => {
    if (!dragging) return;
    return monitorForElements({
      canMonitor: ({ source }) =>
        source.data.type === "date-range-handle" &&
        source.data.edge === edgeRef.current,
      onDrag: ({ location }) => {
        const dropTarget = location.current.dropTargets[0];
        if (!dropTarget) return;
        applyDropTarget(dropTarget.data.date as string);
      },
      onDropTargetChange: ({ location }) => {
        const dropTarget = location.current.dropTargets[0];
        if (!dropTarget) return;
        applyDropTarget(dropTarget.data.date as string);
      },
      onDrop: () => {
        draggingRef.current = false;
        setDragging(false);
        document.body.style.cursor = "";
      },
    });

    function applyDropTarget(dateStr: string) {
      const { start, end } = rangeRef.current;
      if (!start || !end) return;

      const Tp = TRef.current;
      let target: Temporal.PlainDate;
      try {
        target = Tp.PlainDate.from(dateStr);
      } catch {
        return;
      }

      let newStart: Temporal.PlainDate;
      let newEnd: Temporal.PlainDate;

      if (edgeRef.current === "start") {
        if (Tp.PlainDate.compare(target, end) <= 0) {
          newStart = target;
          newEnd = end;
        } else {
          newStart = end;
          newEnd = end;
        }
      } else {
        if (Tp.PlainDate.compare(target, start) >= 0) {
          newStart = start;
          newEnd = target;
        } else {
          newStart = start;
          newEnd = start;
        }
      }

      if (
        Tp.PlainDate.compare(newStart, start) !== 0 ||
        Tp.PlainDate.compare(newEnd, end) !== 0
      ) {
        setRangeRef.current(newStart, newEnd);
      }
    }
  }, [dragging]);

  return { dragging };
}

export function StyledRangeStartDragHandle<
  F extends ValueFormat = ValueFormat,
>({
  className,
  ...props
}: RangeStartDragHandleProps<F> & { ref?: React.Ref<HTMLSpanElement> }) {
  const handleRef = useRef<HTMLSpanElement>(null);
  const { dragging } = useDragHandleDnD("start", handleRef);

  return (
    <RangeStartDragHandle
      ref={handleRef}
      dragging={dragging}
      {...(props as RangeStartDragHandleProps)}
      className={cn(
        "absolute left-0 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2",
        "flex items-center justify-center px-1 py-2",
        "before:block before:h-4 before:w-1.5 before:rounded-full before:bg-primary before:transition-colors hover:before:bg-primary/80",
        className,
      )}
      style={{
        touchAction: "none",
        cursor: dragging ? "grabbing" : "grab",
      }}
      render={(renderProps, state) => (
        <span
          {...renderProps}
          style={{
            ...(renderProps.style as React.CSSProperties),
            display: state.active ? undefined : "none",
          }}
        />
      )}
    />
  );
}

export function StyledRangeEndDragHandle<F extends ValueFormat = ValueFormat>({
  className,
  ...props
}: RangeEndDragHandleProps<F> & { ref?: React.Ref<HTMLSpanElement> }) {
  const handleRef = useRef<HTMLSpanElement>(null);
  const { dragging } = useDragHandleDnD("end", handleRef);

  return (
    <RangeEndDragHandle
      ref={handleRef}
      dragging={dragging}
      {...(props as RangeEndDragHandleProps)}
      className={cn(
        "absolute right-0 top-1/2 z-20 -translate-y-1/2 translate-x-1/2",
        "flex items-center justify-center px-1 py-2",
        "before:block before:h-4 before:w-1.5 before:rounded-full before:bg-primary before:transition-colors hover:before:bg-primary/80",
        className,
      )}
      style={{
        touchAction: "none",
        cursor: dragging ? "grabbing" : "grab",
      }}
      render={(renderProps, state) => (
        <span
          {...renderProps}
          style={{
            ...(renderProps.style as React.CSSProperties),
            display: state.active ? undefined : "none",
          }}
        />
      )}
    />
  );
}

export function StyledSelectedRange<F extends ValueFormat = ValueFormat>({
  className,
  ...props
}: SelectedRangeProps<F> & { ref?: React.Ref<HTMLTableCellElement> }) {
  return (
    <SelectedRange
      {...(props as SelectedRangeProps)}
      data-range-selection
      render={(renderProps, state) => {
        if (!state.active) {
          return <td {...renderProps} hidden style={{ display: "none" }} />;
        }
        return (
          <td
            {...renderProps}
            data-testid="selected-range"
            style={{
              gridColumn: `${state.startIndex + 1} / ${state.endIndex + 2}`,
              gridRow: 1,
            }}
            className={cn(
              "rounded-md bg-primary/80",
              "data-[extends-after]:rounded-r-none data-[extends-before]:rounded-l-none",
              className,
            )}
          />
        );
      }}
    />
  );
}
