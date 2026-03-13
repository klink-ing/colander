import type { Temporal } from "@js-temporal/polyfill";
import type {
  ValueFormat,
  RawValueForFormat,
  DateRange,
  Components,
  RangeMode,
  RangeSelectedProps,
  RangePreviewProps,
} from "base-ui-cal";
import {
  RangeSelected,
  RangePreview,
  DayCellTemplate,
  WeekNumberCell,
  WeekNumberHeader,
} from "base-ui-cal";
import type { DayCellTemplateProps } from "base-ui-cal";
import { DragDayButton } from "../lib/drag-components";
import {
  StyledPrevMonthButton,
  StyledNextMonthButton,
  StyledMonthYearString,
  StyledGrid,
  StyledGridHeader,
  StyledGridHeaderCell,
  StyledGridBody,
  StyledWeekTemplate,
  StyledDragHandle,
} from "./date-picker-styled";
import { cn } from "../lib/utils";

type AnchorDatePickerProps<F extends ValueFormat> = {
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
  preventRangeReversal?: boolean;
  numberOfMonths?: number;
  orientation?: "horizontal" | "vertical";
  outsideDays?: "enabled" | "readonly" | "disabled" | "hidden";
  onMonthChange?: (month: Temporal.PlainYearMonth) => void;
} & (
  | {
      selectionMode?: "single";
      value?: RawValueForFormat<F> | null;
      defaultValue?: RawValueForFormat<F>;
      onValueChange?: (value: RawValueForFormat<F> | null) => void;
    }
  | {
      selectionMode: "range";
      value?: DateRange<F> | null;
      defaultValue?: DateRange<F>;
      onValueChange?: (value: DateRange<F> | null) => void;
      rangeMode?: RangeMode;
    }
  | {
      selectionMode: "multiple";
      value?: RawValueForFormat<F>[];
      defaultValue?: RawValueForFormat<F>[];
      onValueChange?: (value: RawValueForFormat<F>[]) => void;
    }
);

export function AnchorDatePicker<F extends ValueFormat = ValueFormat>(
  props: AnchorDatePickerProps<F>,
) {
  const {
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
    showWeekNumbers,
    preventRangeReversal,
    numberOfMonths: numberOfMonthsProp,
    orientation,
    outsideDays,
    onMonthChange,
    ...selectionProps
  } = props;
  const numberOfMonths = numberOfMonthsProp ?? 1;
  const isVertical = orientation === "vertical";

  const renderGrid = (monthIndex: number) => (
    <div key={monthIndex}>
      {numberOfMonths > 1 && (
        <div className="flex items-center justify-center px-1 pb-3">
          <StyledMonthYearString monthIndex={monthIndex} />
        </div>
      )}
      <StyledGrid
        monthIndex={monthIndex}
        orientation={orientation}
        autoFocus={monthIndex === 0 ? autoFocus : undefined}
        className={cn(
          !isVertical &&
            showWeekNumbers &&
            "grid-cols-[auto_repeat(var(--calendar-days-per-week),1fr)]",
          isVertical &&
            showWeekNumbers &&
            "w-fit auto-cols-auto grid-flow-col grid-cols-none grid-rows-[auto_repeat(var(--calendar-days-per-week),1fr)]",
          isVertical &&
            !showWeekNumbers &&
            "w-fit auto-cols-auto grid-flow-col grid-cols-none grid-rows-[repeat(var(--calendar-days-per-week),1fr)]",
        )}
      >
        <StyledGridHeader
          className={
            isVertical
              ? cn(
                  "contents",
                  "[&>tr]:col-auto [&>tr]:row-span-full [&>tr]:grid [&>tr]:[grid-template-columns:unset] [&>tr]:grid-rows-subgrid",
                )
              : undefined
          }
        >
          {showWeekNumbers && (
            <WeekNumberHeader
              className={cn(
                "p-1 text-center text-[0.7rem] font-normal text-muted-foreground",
                !isVertical && "w-8",
                isVertical && "flex items-center",
              )}
              render={({ children, ...props }) => (
                <th {...props}>
                  <span className="inline-block w-[2ch] text-right">{children}</span>
                </th>
              )}
            />
          )}
          <StyledGridHeaderCell
            className={
              isVertical
                ? "flex w-fit items-center text-right"
                : undefined
            }
          />
        </StyledGridHeader>
        <StyledGridBody
          className={
            isVertical
              ? "col-auto row-span-full auto-cols-fr gap-x-1 gap-y-0 grid-flow-col [grid-template-columns:unset] [grid-template-rows:subgrid]"
              : undefined
          }
        >
          <StyledWeekTemplate
            className={
              isVertical
                ? "col-auto row-span-full [grid-template-columns:unset] [grid-template-rows:subgrid]"
                : undefined
            }
          >
            {showWeekNumbers && (
              <WeekNumberCell
                className={cn(
                  "p-1 text-center text-[0.7rem] tabular-nums text-muted-foreground",
                  !isVertical && "w-8",
                  isVertical && "flex items-center justify-center",
                )}
                render={({ children, ...props }) => (
                  <td {...props}>
                    <span className="inline-block w-[2ch] text-right">{children}</span>
                  </td>
                )}
              />
            )}
            <AnchorRangeSelected
              columnOffset={showWeekNumbers ? 1 : 0}
            />
            <AnchorRangePreview
              columnOffset={showWeekNumbers ? 1 : 0}
            />
            <AnchorDayCellTemplate
              columnOffset={showWeekNumbers ? 1 : 0}
              preventRangeReversal={preventRangeReversal}
            />
          </StyledWeekTemplate>
        </StyledGridBody>
      </StyledGrid>
    </div>
  );

  return (
    <DP.Root
      {...(selectionProps as any)}
      min={min}
      max={max}
      disabled={disabled}
      readOnly={readOnly}
      isDateDisabled={isDateDisabled}
      timeZone={timeZone}
      locale={locale}
      fixedWeeks={fixedWeeks}
      weekStartDay={weekStartDay}
      numberOfMonths={numberOfMonths}
      outsideDays={outsideDays}
      onMonthChange={onMonthChange}
      preventRangeReversal={preventRangeReversal}
    >
      <div className={cn("p-3", className)}>
        {numberOfMonths === 1 && (
          <div className="flex items-center justify-between gap-1 px-1 pb-3">
            <StyledPrevMonthButton />
            <StyledMonthYearString />
            <StyledNextMonthButton />
          </div>
        )}
        {numberOfMonths > 1 && (
          <div className="flex items-center justify-between gap-1 px-1 pb-3">
            <StyledPrevMonthButton />
            <div />
            <StyledNextMonthButton />
          </div>
        )}
        <div className={numberOfMonths > 1 ? "flex gap-4" : undefined}>
          {Array.from({ length: numberOfMonths }, (_, i) => renderGrid(i))}
        </div>
      </div>
    </DP.Root>
  );
}

// ---------------------------------------------------------------------------
// Anchor-positioned components
// ---------------------------------------------------------------------------

function AnchorDayCellTemplate<F extends ValueFormat = ValueFormat>(
  allProps: DayCellTemplateProps<F> & {
    ref?: React.Ref<HTMLTableCellElement>;
    columnOffset?: number;
    preventRangeReversal?: boolean;
  },
) {
  const {
    className,
    columnOffset = 0,
    preventRangeReversal,
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
            <AnchorDayButton
              date={state.date}
              preventRangeReversal={preventRangeReversal}
            />
          </td>
        );
      }}
    />
  );
}

function AnchorDayButton<F extends ValueFormat = ValueFormat>({
  className,
  date,
  children,
  preventRangeReversal,
  ...props
}: import("base-ui-cal").DayButtonProps<F> & {
  ref?: React.Ref<HTMLButtonElement>;
  preventRangeReversal?: boolean;
}) {
  return (
    <DragDayButton
      date={date}
      {...(props as import("base-ui-cal").DayButtonProps)}
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
          <button
            {...props}
            style={{
              ...((props as any).style ?? {}),
              anchorName: `--day-${date?.toString()}`,
            }}
          >
            {
              <div
                className={cn(
                  "absolute z-0 hidden aspect-square size-[1.6em] rounded-full bg-neutral-200 group-data-today:block group-data-selected:bg-white/50 group-data-in-range:bg-white/20",
                )}
              />
            }
            <div className="isolate inline-block w-[2ch] text-right">{children}</div>
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
    />
  );
}

function AnchorRangeSelected<F extends ValueFormat = ValueFormat>(
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
      render={(renderProps, state) => {
        if (!state.active) {
          return <td {...renderProps} hidden style={{ display: "none" }} />;
        }

        const horizontal = state.orientation === "horizontal";
        const startAnchor = `--day-${state.startDate}`;
        const endAnchor = `--day-${state.endDate}`;

        return (
          <td
            {...renderProps}
            data-testid="selected-range"
            className={cn(
              "rounded-md bg-primary/80",
              horizontal
                ? "data-[extends-after]:rounded-r-none data-[extends-before]:rounded-l-none"
                : "data-[extends-after]:rounded-b-none data-[extends-before]:rounded-t-none",
              className,
            )}
            style={
              horizontal
                ? {
                    position: "absolute",
                    top: `anchor(${startAnchor} top)`,
                    bottom: `anchor(${startAnchor} bottom)`,
                    left: `anchor(${startAnchor} left)`,
                    right: `anchor(${endAnchor} right)`,
                  }
                : {
                    position: "absolute",
                    left: `anchor(${startAnchor} left)`,
                    right: `anchor(${startAnchor} right)`,
                    top: `anchor(${startAnchor} top)`,
                    bottom: `anchor(${endAnchor} bottom)`,
                  }
            }
          />
        );
      }}
    />
  );
}

function AnchorRangePreview<F extends ValueFormat = ValueFormat>(
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
        const startAnchor = `--day-${state.startDate}`;
        const endAnchor = `--day-${state.endDate}`;

        const anchorStyle = horizontal
          ? {
              position: "absolute" as const,
              top: `anchor(${startAnchor} top)`,
              bottom: `anchor(${startAnchor} bottom)`,
              left: `anchor(${startAnchor} left)`,
              right: `anchor(${endAnchor} right)`,
            }
          : {
              position: "absolute" as const,
              left: `anchor(${startAnchor} left)`,
              right: `anchor(${startAnchor} right)`,
              top: `anchor(${startAnchor} top)`,
              bottom: `anchor(${endAnchor} bottom)`,
            };

        return (
          <td
            {...renderProps}
            style={anchorStyle}
            className={cn("z-10 pointer-events-none relative", className)}
          >
            {/* White solid line */}
            <div
              className={cn(
                "absolute inset-0 rounded-md border border-white",
                horizontal
                  ? "data-extends-after:rounded-r-none data-extends-before:rounded-l-none data-extends-after:border-r-0 data-extends-before:border-l-0"
                  : "data-extends-after:rounded-b-none data-[extends-before]:rounded-t-none data-[extends-after]:border-b-0 data-[extends-before]:border-t-0",
              )}
              data-extends-before={state.extendsBefore || undefined}
              data-extends-after={state.extendsAfter || undefined}
            />
            {/* Blue dashed line on top */}
            <div
              className={cn(
                "absolute inset-0 rounded-md border border-dashed border-primary/80",
                horizontal
                  ? "data-[extends-after]:rounded-r-none data-[extends-before]:rounded-l-none data-[extends-after]:border-r-0 data-[extends-before]:border-l-0"
                  : "data-[extends-after]:rounded-b-none data-[extends-before]:rounded-t-none data-[extends-after]:border-b-0 data-[extends-before]:border-t-0",
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
