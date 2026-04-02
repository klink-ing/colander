import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { Temporal as TemporalPoly } from "@js-temporal/polyfill";
import { useContext, useEffect, useRef, memo, forwardRef } from "react";
import { useCalendarStable, useCalendarState } from "./calendar-context";
import { WeekDataContext, DayCellDataContext, GridContext } from "./context";
import { GridOrientation } from "./context";
import { MonthViewStableContext } from "./month-view-context";
import { useMonthViewState } from "./month-view-context";
import type { StateAttributesMapping } from "./types";
import type {
  ValueFormat,
  DayCellTemplateProps,
  DayButtonProps,
  DayCellTemplateState,
  TemporalNamespace,
  OutsideDays,
} from "./types";
import { shouldMoveDomFocus, isInRange as isInRangeUtil } from "./utils";
import { useViewContext } from "./view-context";

/** Computes derived day cell state from context values. Pure function, no hooks. */
export function computeDayCellState(
  date: TemporalPoly.PlainDate,
  orientation: GridOrientation,
  columnIndex: number,
  rootState: DayCellTemplateState["root"],
  selectedDates: TemporalPoly.PlainDate[],
  currentDateTime: { year: number; month: number },
  disabled: boolean,
  isDateDisabled: ((date: TemporalPoly.PlainDate) => boolean) | undefined,
  focusedDate: TemporalPoly.PlainDate,
  rangeStart: TemporalPoly.PlainDate | undefined,
  rangeEnd: TemporalPoly.PlainDate | undefined,
  tabTargetDate: TemporalPoly.PlainDate,
  T: TemporalNamespace,
  selectionMode: "single" | "range" | "multiple",
  outsideDays: OutsideDays,
  previewStart?: TemporalPoly.PlainDate,
  previewEnd?: TemporalPoly.PlainDate,
): DayCellTemplateState & { isTabTarget: boolean } {
  const isCurrentMonth =
    date.year === currentDateTime.year && date.month === currentDateTime.month;
  const hidden = !isCurrentMonth && outsideDays === "hidden";

  if (hidden) {
    return {
      root: rootState,
      date,
      columnIndex,
      orientation,
      outsideMonth: true,
      hidden: true,
      selected: false,
      today: false,
      disabled: true,
      focused: false,
      rangeStart: false,
      rangeEnd: false,
      rangeBoundary: false,
      inRange: false,
      rangeIndex: false,
      rangeLength: false,
      rangeHasStart: false,
      rangeHasEnd: false,
      rangePreviewStart: false,
      rangePreviewEnd: false,
      rangePreviewBoundary: false,
      rangePreviewInRange: false,
      rangePreviewIndex: false,
      rangePreviewLength: false,
      rangePreviewHasStart: false,
      rangePreviewHasEnd: false,
      isTabTarget: false,
    };
  }

  const today = T.Now.plainDateISO();
  const isToday = T.PlainDate.compare(date, today) === 0;
  const isRange = selectionMode === "range";

  let isRangeStart: boolean = false;
  let isRangeEnd: boolean = false;
  let isInRangeDay: boolean = false;
  let rangeIdx: number | false = false;
  let rangeLen: number | false = false;
  let isPreviewRangeStart: boolean = false;
  let isPreviewRangeEnd: boolean = false;
  let isInPreviewRange: boolean = false;
  let previewIdx: number | false = false;
  let previewLen: number | false = false;

  if (isRange) {
    isRangeStart = rangeStart
      ? T.PlainDate.compare(date, rangeStart) === 0
      : false;
    isRangeEnd = rangeEnd ? T.PlainDate.compare(date, rangeEnd) === 0 : false;
    isInRangeDay = isInRangeUtil(date, rangeStart, rangeEnd, T) !== false;
    const effectiveStart = rangeStart ?? rangeEnd;
    const effectiveEnd = rangeEnd ?? rangeStart;
    rangeIdx =
      isInRangeDay && effectiveStart ? date.since(effectiveStart).days : false;
    rangeLen =
      isInRangeDay && effectiveStart && effectiveEnd
        ? effectiveEnd.since(effectiveStart).days + 1
        : false;

    isPreviewRangeStart = previewStart
      ? T.PlainDate.compare(date, previewStart) === 0
      : false;
    isPreviewRangeEnd = previewEnd
      ? T.PlainDate.compare(date, previewEnd) === 0
      : false;
    isInPreviewRange =
      previewStart && previewEnd
        ? isInRangeUtil(date, previewStart, previewEnd, T) !== false
        : false;
    previewIdx =
      isInPreviewRange && previewStart ? date.since(previewStart).days : false;
    previewLen =
      isInPreviewRange && previewStart && previewEnd
        ? previewEnd.since(previewStart).days + 1
        : false;
  }

  const outsideNonInteractive = !isCurrentMonth && outsideDays !== "enabled";
  const suppressRange =
    !isCurrentMonth && (outsideDays === "disabled" || outsideDays === "hidden");

  if (outsideNonInteractive) {
    return {
      root: rootState,
      date,
      columnIndex,
      orientation,
      outsideMonth: true,
      hidden: false,
      selected: false,
      today: isToday,
      disabled: true,
      focused: false,
      rangeStart: suppressRange ? false : isRangeStart,
      rangeEnd: suppressRange ? false : isRangeEnd,
      rangeBoundary: suppressRange ? false : isRangeStart || isRangeEnd,
      inRange: suppressRange ? false : isInRangeDay,
      rangeIndex: suppressRange ? false : rangeIdx,
      rangeLength: suppressRange ? false : rangeLen,
      rangeHasStart: suppressRange
        ? false
        : isInRangeDay && rangeStart !== undefined,
      rangeHasEnd: suppressRange
        ? false
        : isInRangeDay && rangeEnd !== undefined,
      rangePreviewStart: suppressRange ? false : isPreviewRangeStart,
      rangePreviewEnd: suppressRange ? false : isPreviewRangeEnd,
      rangePreviewBoundary: suppressRange
        ? false
        : isPreviewRangeStart || isPreviewRangeEnd,
      rangePreviewInRange: suppressRange ? false : isInPreviewRange,
      rangePreviewIndex: suppressRange ? false : previewIdx,
      rangePreviewLength: suppressRange ? false : previewLen,
      rangePreviewHasStart: suppressRange
        ? false
        : isInPreviewRange && previewStart !== undefined,
      rangePreviewHasEnd: suppressRange
        ? false
        : isInPreviewRange && previewEnd !== undefined,
      isTabTarget: false,
    };
  }

  const isSelected =
    selectionMode !== "range"
      ? selectedDates.some((d) => T.PlainDate.compare(d, date) === 0)
      : false;
  const isDisabled = disabled || (isDateDisabled?.(date) ?? false);
  const isFocused = T.PlainDate.compare(date, focusedDate) === 0;
  const isTabTarget = T.PlainDate.compare(date, tabTargetDate) === 0;

  return {
    root: rootState,
    date,
    columnIndex,
    orientation,
    selected: isSelected,
    today: isToday,
    disabled: isDisabled,
    outsideMonth: !isCurrentMonth,
    hidden: false,
    focused: isFocused,
    rangeStart: isRangeStart,
    rangeEnd: isRangeEnd,
    rangeBoundary: isRangeStart || isRangeEnd,
    inRange: isInRangeDay,
    rangeIndex: rangeIdx,
    rangeLength: rangeLen,
    rangeHasStart: isInRangeDay && rangeStart !== undefined,
    rangeHasEnd: isInRangeDay && rangeEnd !== undefined,
    rangePreviewStart: isPreviewRangeStart,
    rangePreviewEnd: isPreviewRangeEnd,
    rangePreviewBoundary: isPreviewRangeStart || isPreviewRangeEnd,
    rangePreviewInRange: isInPreviewRange,
    rangePreviewIndex: previewIdx,
    rangePreviewLength: previewLen,
    rangePreviewHasStart: isInPreviewRange && previewStart !== undefined,
    rangePreviewHasEnd: isInPreviewRange && previewEnd !== undefined,
    isTabTarget,
  };
}

export const dayStateAttributesMapping = {
  root: () => null,
  date: (v: TemporalPoly.PlainDate) =>
    v ? { "data-date": v.toString() } : null,
  columnIndex: () => null,
  orientation: (v) => (v ? { "data-orientation": v } : null),
  selected: (v) => (v ? { "data-selected": "" } : null),
  today: (v) => (v ? { "data-today": "" } : null),
  disabled: (v) => (v ? { "data-disabled": "" } : null),
  outsideMonth: (v) => (v ? { "data-outside-month": "" } : null),
  hidden: (v) => (v ? { "data-hidden": "" } : null),
  focused: (v) => (v ? { "data-focused": "" } : null),
  rangeStart: (v) => (v ? { "data-range-start": "" } : null),
  rangeEnd: (v) => (v ? { "data-range-end": "" } : null),
  rangeBoundary: (v) => (v ? { "data-range-boundary": "" } : null),
  inRange: (v) => (v ? { "data-in-range": "" } : null),
  rangeIndex: (v) => (v !== false ? { "data-range-index": String(v) } : null),
  rangeLength: (v) => (v !== false ? { "data-range-length": String(v) } : null),
  rangeHasStart: (v) => (v ? { "data-range-has-start": "" } : null),
  rangeHasEnd: (v) => (v ? { "data-range-has-end": "" } : null),
  rangePreviewStart: (v) => (v ? { "data-range-preview-start": "" } : null),
  rangePreviewEnd: (v) => (v ? { "data-range-preview-end": "" } : null),
  rangePreviewBoundary: (v) =>
    v ? { "data-range-preview-boundary": "" } : null,
  rangePreviewInRange: (v) =>
    v ? { "data-range-preview-in-range": "" } : null,
  rangePreviewIndex: (v) =>
    v !== false ? { "data-range-preview-index": String(v) } : null,
  rangePreviewLength: (v) =>
    v !== false ? { "data-range-preview-length": String(v) } : null,
  rangePreviewHasStart: (v) =>
    v ? { "data-range-preview-has-start": "" } : null,
  rangePreviewHasEnd: (v) => (v ? { "data-range-preview-has-end": "" } : null),
} as const satisfies StateAttributesMapping<DayCellTemplateState>;

/** Props for the memoized DayCellInstance. */
interface DayCellInstanceProps<F extends ValueFormat = ValueFormat> {
  render?: DayCellTemplateProps<F>["render"];
  date: TemporalPoly.PlainDate;
  columnIndex?: number;
  children?: React.ReactNode;
  _derivedState: DayCellTemplateState & { isTabTarget: boolean };
  [key: string]: unknown;
}

function DayCellInstanceFn<F extends ValueFormat = ValueFormat>(
  props: DayCellInstanceProps<F>,
) {
  const { render, date, columnIndex, children, _derivedState, ...otherProps } =
    props;

  const state = _derivedState as unknown as DayCellTemplateState<F>;

  const defaultProps: Record<string, unknown> = state.hidden
    ? {
        role: "gridcell",
        "aria-hidden": true,
        children: null,
      }
    : {
        role: "gridcell",
        "aria-selected": state.selected || undefined,
        "aria-disabled": state.disabled || undefined,
        children: children ?? <DayButton _derivedState={_derivedState} />,
      };

  const cell = useRender({
    defaultTagName: "td",
    render,
    ref: [],
    state,
    stateAttributesMapping: dayStateAttributesMapping,
    props: mergeProps<"td">(defaultProps, otherProps),
  });

  const outsideDisabled =
    state.hidden || (state.outsideMonth && state.disabled);

  return (
    <DayCellDataContext.Provider value={{ date, columnIndex, outsideDisabled }}>
      {cell}
    </DayCellDataContext.Provider>
  );
}

function dayCellInstancePropsAreEqual(
  prev: DayCellInstanceProps,
  next: DayCellInstanceProps,
): boolean {
  // Skip `children` — React elements are always new objects. Child components
  // that subscribe to context (e.g. DayButton fallback) get their own
  // re-render via context; the optimised internal DayButton reads only
  // stable context and is separately memo'd.
  if (
    prev.date !== next.date ||
    prev.render !== next.render ||
    prev.columnIndex !== next.columnIndex
  )
    return false;
  const a = prev._derivedState;
  const b = next._derivedState;
  return (
    a.selected === b.selected &&
    a.today === b.today &&
    a.disabled === b.disabled &&
    a.outsideMonth === b.outsideMonth &&
    a.hidden === b.hidden &&
    a.focused === b.focused &&
    a.rangeStart === b.rangeStart &&
    a.rangeEnd === b.rangeEnd &&
    a.inRange === b.inRange &&
    a.rangeIndex === b.rangeIndex &&
    a.rangeLength === b.rangeLength &&
    a.rangeHasStart === b.rangeHasStart &&
    a.rangeHasEnd === b.rangeHasEnd &&
    a.rangePreviewStart === b.rangePreviewStart &&
    a.rangePreviewEnd === b.rangePreviewEnd &&
    a.rangePreviewBoundary === b.rangePreviewBoundary &&
    a.rangePreviewInRange === b.rangePreviewInRange &&
    a.rangePreviewIndex === b.rangePreviewIndex &&
    a.rangePreviewLength === b.rangePreviewLength &&
    a.rangePreviewHasStart === b.rangePreviewHasStart &&
    a.rangePreviewHasEnd === b.rangePreviewHasEnd &&
    a.isTabTarget === b.isTabTarget
  );
}

const DayCellInstance = memo(
  DayCellInstanceFn,
  dayCellInstancePropsAreEqual,
) as typeof DayCellInstanceFn;

/**
 * Renders one `<td role="gridcell">` per day. Exposes data-attributes for
 * `selected`, `today`, `disabled`, `outside-month`, `focused`,
 * `range-start`, `range-end`, `range-boundary`, `in-range`, and `date`.
 *
 * When used inside a {@link WeekTemplate}, iterates over that week's days.
 * An explicit `date` prop renders a single cell.
 */
export function DayCellTemplate<F extends ValueFormat = ValueFormat>(
  props: DayCellTemplateProps<F>,
) {
  const { date: dateProp, ...restProps } = props;
  const weekData = useContext(WeekDataContext);

  const {
    disabled,
    isDateDisabled,
    selectionMode,
    temporal: T,
    weekStartDay,
  } = useCalendarStable();

  const { selectedDates, rangeStart, rangeEnd, previewStart, previewEnd } =
    useCalendarState();

  const viewCtx = useViewContext();
  const { focusedDate, tabTargetDate } = viewCtx;

  const monthStable = useContext(MonthViewStableContext);
  const monthState = useMonthViewState();
  const { rootState, weeks, currentMonth: currentDateTime } = monthState;
  const outsideDays = monthStable?.outsideDays ?? "enabled";

  // Use the grid-specific month for outsideMonth checks, falling back to currentMonth.
  // In multi-month mode, gridMonth is set by WeekTemplate from GridMonthContext.
  // In weeks view, cellMonth is computed per-day (see below) so outsideMonth is always false.
  const isWeeksView = viewCtx.viewType === "weeks";
  const cellMonth = isWeeksView
    ? null // per-day below
    : (weekData?.gridMonth ?? currentDateTime);

  const { orientation } = useContext(GridContext);

  if (dateProp) {
    const daysInWeek = dateProp.daysInWeek;
    const colIdx =
      ((dateProp.dayOfWeek % daysInWeek) - weekStartDay + daysInWeek) %
      daysInWeek;
    const derived = computeDayCellState(
      dateProp,
      orientation,
      colIdx,
      rootState,
      selectedDates,
      isWeeksView ? { year: dateProp.year, month: dateProp.month } : cellMonth!,
      disabled,
      isDateDisabled,
      focusedDate,
      rangeStart,
      rangeEnd,
      tabTargetDate,
      T,
      selectionMode,
      outsideDays,
      previewStart,
      previewEnd,
    );
    return (
      <DayCellInstance {...restProps} date={dateProp} _derivedState={derived} />
    );
  }

  const days = weekData ? weekData.days : weeks.flat();
  const perWeek = weekData != null;

  return (
    <>
      {days.map((day, i) => {
        const daysInWeek = day.daysInWeek;
        const colIdx = perWeek
          ? i
          : ((day.dayOfWeek % daysInWeek) - weekStartDay + daysInWeek) %
            daysInWeek;
        const derived = computeDayCellState(
          day,
          orientation,
          colIdx,
          rootState,
          selectedDates,
          isWeeksView ? { year: day.year, month: day.month } : cellMonth!,
          disabled,
          isDateDisabled,
          focusedDate,
          rangeStart,
          rangeEnd,
          tabTargetDate,
          T,
          selectionMode,
          outsideDays,
          previewStart,
          previewEnd,
        );
        return (
          <DayCellInstance
            key={day.toString()}
            {...restProps}
            date={day}
            columnIndex={perWeek ? i : undefined}
            _derivedState={derived}
          />
        );
      })}
    </>
  );
}

/** Props for the memoized DayButtonInstance. */
interface DayButtonInnerProps<F extends ValueFormat = ValueFormat> {
  render?: DayButtonProps<F>["render"];
  date: TemporalPoly.PlainDate;
  _derivedState?: DayCellTemplateState & { isTabTarget: boolean };
  [key: string]: unknown;
}

function DayButtonInnerFn(
  props: DayButtonInnerProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, date, _derivedState, ...otherProps } = props;
  const { onSelect, locale, readOnly, setHoveredDate } = useCalendarStable();
  const { setFocusedDate } = useViewContext();
  const monthStable = useContext(MonthViewStableContext);
  const gridFocusedRef = monthStable!.gridFocusedRef;

  const internalRef = useRef<HTMLButtonElement>(null);

  const isHidden = _derivedState?.hidden ?? false;
  const isFocused = _derivedState?.focused ?? false;
  const isTabTarget = _derivedState?.isTabTarget ?? false;
  const isDisabled = _derivedState?.disabled ?? false;

  useEffect(() => {
    if (
      shouldMoveDomFocus(isFocused, gridFocusedRef.current) &&
      internalRef.current
    ) {
      internalRef.current.focus();
    }
  }, [isFocused, gridFocusedRef]);

  const state = _derivedState as unknown as DayCellTemplateState;

  const defaultProps: Record<string, unknown> = isHidden
    ? {}
    : {
        type: "button",
        tabIndex: isTabTarget ? 0 : -1,
        disabled: isDisabled,
        "aria-disabled": readOnly || undefined,
        "aria-label": date.toLocaleString(locale, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        date: date.toString(),
        onClick: () => {
          setFocusedDate(date);
          onSelect(date);
        },
        onPointerEnter: () => {
          if (!isHidden && !isDisabled) setHoveredDate(date);
        },
        children: date.day,
      };

  return useRender(
    isHidden
      ? {}
      : {
          defaultTagName: "button",
          render,
          ref: ref ? [ref, internalRef] : [internalRef],
          state,
          stateAttributesMapping: dayStateAttributesMapping,
          props: mergeProps<"button">(defaultProps, otherProps),
        },
  );
}

function dayButtonInnerPropsAreEqual(
  prev: DayButtonInnerProps,
  next: DayButtonInnerProps,
): boolean {
  if (prev.date !== next.date || prev.render !== next.render) return false;
  const a = prev._derivedState;
  const b = next._derivedState;
  if (!a || !b) return a === b;
  return (
    a.selected === b.selected &&
    a.today === b.today &&
    a.disabled === b.disabled &&
    a.outsideMonth === b.outsideMonth &&
    a.hidden === b.hidden &&
    a.focused === b.focused &&
    a.rangeStart === b.rangeStart &&
    a.rangeEnd === b.rangeEnd &&
    a.inRange === b.inRange &&
    a.rangeIndex === b.rangeIndex &&
    a.rangeLength === b.rangeLength &&
    a.rangeHasStart === b.rangeHasStart &&
    a.rangeHasEnd === b.rangeHasEnd &&
    a.rangePreviewStart === b.rangePreviewStart &&
    a.rangePreviewEnd === b.rangePreviewEnd &&
    a.rangePreviewBoundary === b.rangePreviewBoundary &&
    a.rangePreviewInRange === b.rangePreviewInRange &&
    a.rangePreviewIndex === b.rangePreviewIndex &&
    a.rangePreviewLength === b.rangePreviewLength &&
    a.rangePreviewHasStart === b.rangePreviewHasStart &&
    a.rangePreviewHasEnd === b.rangePreviewHasEnd &&
    a.isTabTarget === b.isTabTarget
  );
}

// The `as any` casts are needed because DayButtonInnerProps uses an index
// signature (`[key: string]: unknown`) which conflicts with forwardRef's
// internal `Omit<Props, "ref">` type transformation.
const DayButtonInner = memo(
  forwardRef(DayButtonInnerFn as any) as any,
  dayButtonInnerPropsAreEqual as any,
) as unknown as <F extends ValueFormat = ValueFormat>(
  props: DayButtonInnerProps<F> & React.RefAttributes<HTMLButtonElement>,
) => React.ReactElement | null;

/**
 * Interactive `<button>` inside a day cell. Handles click-to-select,
 * roving tabindex, and imperative focus on keyboard navigation.
 *
 * Must be used inside a {@link DayCellTemplate} or given an explicit `date` prop.
 */
function DayButtonFn(
  props: DayButtonProps & {
    _derivedState?: DayCellTemplateState & { isTabTarget: boolean };
  },
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const { date: dateProp, _derivedState, ...restProps } = props;
  const cellData = useContext(DayCellDataContext);

  const resolvedDate = dateProp ?? cellData?.date;

  if (resolvedDate) {
    // If we have derived state passed from parent, use it directly
    if (_derivedState) {
      return (
        <DayButtonInner
          {...restProps}
          ref={ref}
          date={resolvedDate}
          _derivedState={_derivedState}
        />
      );
    }
    // Fallback: compute state (for standalone DayButton usage with explicit date)
    return <DayButtonFallback ref={ref} {...restProps} date={resolvedDate} />;
  }

  throw new Error(
    "DayButton must be used inside DayCellTemplate or receive an explicit date prop.",
  );
}

export const DayButton = forwardRef(DayButtonFn) as <
  F extends ValueFormat = ValueFormat,
>(
  props: DayButtonProps<F> & {
    _derivedState?: DayCellTemplateState & { isTabTarget: boolean };
  } & React.RefAttributes<HTMLButtonElement>,
) => React.ReactElement | null;

/** Fallback for standalone DayButton usage that needs to read context. */
function DayButtonFallbackFn(
  props: Omit<DayButtonProps, "date"> & { date: TemporalPoly.PlainDate },
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const { date, ...restProps } = props;
  const { orientation } = useContext(GridContext);
  const weekData = useContext(WeekDataContext);
  const {
    disabled,
    isDateDisabled,
    selectionMode,
    temporal: T,
    weekStartDay,
  } = useCalendarStable();
  const { selectedDates, rangeStart, rangeEnd, previewStart, previewEnd } =
    useCalendarState();
  const viewCtx = useViewContext();
  const { focusedDate, tabTargetDate } = viewCtx;
  const monthStable = useContext(MonthViewStableContext);
  const monthState = useMonthViewState();
  const { rootState, currentMonth: currentDateTime } = monthState;
  const outsideDays = monthStable?.outsideDays ?? "enabled";

  const isWeeksView = viewCtx.viewType === "weeks";
  const cellMonth = isWeeksView
    ? { year: date.year, month: date.month }
    : (weekData?.gridMonth ?? currentDateTime);
  const daysInWeek = date.daysInWeek;
  const colIdx =
    ((date.dayOfWeek % daysInWeek) - weekStartDay + daysInWeek) % daysInWeek;
  const derived = computeDayCellState(
    date,
    orientation,
    colIdx,
    rootState,
    selectedDates,
    cellMonth,
    disabled,
    isDateDisabled,
    focusedDate,
    rangeStart,
    rangeEnd,
    tabTargetDate,
    T,
    selectionMode,
    outsideDays,
    previewStart,
    previewEnd,
  );

  return (
    <DayButtonInner
      {...restProps}
      ref={ref}
      date={date}
      _derivedState={derived}
    />
  );
}

const DayButtonFallback = forwardRef(DayButtonFallbackFn) as <
  F extends ValueFormat = ValueFormat,
>(
  props: Omit<DayButtonProps<F>, "date"> & {
    date: TemporalPoly.PlainDate;
  } & React.RefAttributes<HTMLButtonElement>,
) => React.ReactElement | null;
