import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { Temporal } from "@js-temporal/polyfill";
import {
  useContext,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  forwardRef,
} from "react";
import type { KeyboardEvent } from "react";
import { useCalendarStable } from "./calendar-context";
import { WeekDataContext, GridContext, GridMonthContext } from "./context";
import { GridHeader, GridHeaderCell } from "./grid-header";
import { computeNextFocusDate } from "./keyboard";
import {
  MonthViewStableContext,
  MonthViewStateContext,
  useMonthViewStable,
  useMonthViewState,
} from "./month-view-context";
import type { StateAttributesMapping } from "./types";
import type {
  ValueFormat,
  RootState,
  GridState,
  GridProps,
  GridBodyState,
  GridBodyProps,
  WeekTemplateState,
  WeekTemplateProps,
} from "./types";
import { useViewContext } from "./view-context";
import { WeeksGrid } from "./weeks-grid";
import { computeWeeksKeyNav } from "./weeks-keyboard";
import {
  WeeksViewStateContext,
  useWeeksViewState,
  useWeeksViewStable,
} from "./weeks-view-context";
export { GridHeader, GridHeaderCell } from "./grid-header";
export { DayCellTemplate, DayButton } from "./day-cell";

import { DayCellTemplate, DayButton } from "./day-cell";

function useGridKeyboard() {
  const {
    onSelect,
    disabled,
    readOnly,
    isDateDisabled,
    minValue,
    maxValue,
    temporal: T,
    weekStartDay,
  } = useCalendarStable();
  const { focusedDate, setFocusedDate } = useViewContext();

  return useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const result = computeNextFocusDate({
        key: e.key,
        shiftKey: e.shiftKey,
        focusedDate,
        minValue,
        maxValue,
        disabled,
        readOnly,
        isDateDisabled,
        T,
        weekStartDay,
      });

      if (result.action === "move") {
        e.preventDefault();
        setFocusedDate(result.date);
      } else if (result.action === "select") {
        e.preventDefault();
        onSelect(focusedDate);
      }
    },
    [
      focusedDate,
      setFocusedDate,
      onSelect,
      disabled,
      readOnly,
      isDateDisabled,
      minValue,
      maxValue,
      T,
      weekStartDay,
    ],
  );
}

function useWeeksGridKeyboard() {
  const {
    onSelect,
    disabled,
    readOnly,
    isDateDisabled,
    minValue,
    maxValue,
    temporal: T,
    weekStartDay,
  } = useCalendarStable();
  const { focusedDate, setFocusedDate } = useViewContext();
  const weeksStable = useWeeksViewStable();
  const weeksState = useWeeksViewState();

  return useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const result = computeWeeksKeyNav({
        key: e.key,
        shiftKey: e.shiftKey,
        focusedDate,
        windowStart: weeksState.windowInfo.windowStart,
        weekCount: weeksStable.weekCount,
        minValue,
        maxValue,
        disabled,
        readOnly,
        isDateDisabled,
        scrollBy: weeksStable.scrollBy,
        T,
        weekStartDay,
      });

      if (result.action === "move") {
        e.preventDefault();
        setFocusedDate(result.date);
        if (result.followFocus) {
          // Large jump (e.g. Shift+PageUp/Down for ±1 year) — reposition window around new focus
          weeksStable.scrollToWeek(result.date, { snap: "start" });
        } else if (result.windowShift !== 0) {
          // Focus moved just outside the visible window — scroll minimally to keep it visible
          weeksStable.scrollToWeek(result.date, { snap: "nearest" });
        }
      } else if (result.action === "select") {
        e.preventDefault();
        onSelect(focusedDate);
      }
    },
    [
      focusedDate,
      setFocusedDate,
      onSelect,
      disabled,
      readOnly,
      isDateDisabled,
      minValue,
      maxValue,
      T,
      weekStartDay,
      weeksStable,
      weeksState.windowInfo.windowStart,
    ],
  );
}

const gridStateAttributesMapping = {
  root: () => null,
  month: () => null,
  year: () => null,
  orientation: (v) => ({ "data-orientation": v }),
} as const satisfies StateAttributesMapping<GridState>;

/**
 * Calendar grid container. Renders a `<table>` with `role="grid"` by default.
 *
 * Sets CSS custom properties `--calendar-days-per-week` and
 * `--calendar-weeks-in-month`, and matching `data-calendar-*` attributes.
 * Manages keyboard navigation, grid focus tracking, and
 * `aria-labelledby` linkage to {@link MonthYearString}.
 *
 * Automatically detects the active view type (MonthView or WeeksView) and
 * delegates to the appropriate internal renderer.
 */
function GridFn(props: GridProps, ref: React.ForwardedRef<HTMLTableElement>) {
  const monthState = useContext(MonthViewStableContext);
  const weeksState = useContext(WeeksViewStateContext);

  if (monthState) {
    return <MonthGrid ref={ref} {...props} />;
  }
  if (weeksState) {
    return <WeeksViewGrid ref={ref} {...props} />;
  }

  throw new Error("Grid must be used inside MonthView.Root or WeeksView.Root.");
}

export const Grid = forwardRef(GridFn) as <F extends ValueFormat = ValueFormat>(
  props: GridProps<F> & React.RefAttributes<HTMLTableElement>,
) => React.ReactElement | null;

// ---------------------------------------------------------------------------
// MonthGrid — existing month view rendering (unchanged logic)
// ---------------------------------------------------------------------------

function MonthGridFn(
  props: GridProps,
  ref: React.ForwardedRef<HTMLTableElement>,
) {
  const {
    render,
    mode: _mode,
    orientation,
    autoFocus,
    monthIndex: monthIndexProp,
    children,
    ...otherProps
  } = props;
  const monthIndex = monthIndexProp ?? 0;
  const { setHoveredDate } = useCalendarStable();
  const { setGridHasFocus } = useViewContext();
  const monthViewStable = useMonthViewStable();
  const monthViewState = useMonthViewState();
  const { gridFocusedRef } = monthViewStable;
  const {
    currentMonth: currentDateTime,
    gridLabelIds,
    rootState,
    weeks: defaultWeeks,
    allMonths,
  } = monthViewState;

  if (monthIndex >= allMonths.length) {
    console.warn(
      `[DatePicker] Grid monthIndex={${monthIndex}} is out of bounds (numberOfMonths=${allMonths.length}). Falling back to the first month.`,
    );
  }
  const monthData = allMonths[monthIndex];
  const gridWeeks = monthData?.weeks ?? defaultWeeks;

  const handleKeyDown = useGridKeyboard();
  const gridRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    if (autoFocus && gridRef.current) {
      const target =
        gridRef.current.querySelector<HTMLElement>('[tabindex="0"]');
      if (target) {
        target.focus();
        gridFocusedRef.current = true;
        setGridHasFocus(true);
      }
    }
  }, [autoFocus, gridFocusedRef, setGridHasFocus]);

  const resolvedOrientation = orientation ?? "horizontal";
  const daysPerWeek = gridWeeks[0]?.length ?? 7;
  const weeksInMonth = gridWeeks.length;

  const gridMonth = monthData ?? {
    year: currentDateTime.year,
    month: currentDateTime.month,
  };

  const state = useMemo<GridState>(
    () => ({
      root: rootState as unknown as GridState["root"],
      month: gridMonth.month,
      year: gridMonth.year,
      orientation: resolvedOrientation,
    }),
    [rootState, gridMonth.month, gridMonth.year, resolvedOrientation],
  );

  const defaultProps: Record<string, unknown> = {
    role: "grid",
    "aria-labelledby": gridLabelIds[monthIndex] || undefined,
    "aria-label": gridLabelIds[monthIndex] ? undefined : "Calendar",
    "data-calendar-days-per-week": daysPerWeek,
    "data-calendar-weeks-in-month": weeksInMonth,
    style: {
      "--calendar-days-per-week": daysPerWeek,
      "--calendar-weeks-in-month": weeksInMonth,
    } as React.CSSProperties,
    onKeyDown: handleKeyDown,
    onFocus: () => {
      gridFocusedRef.current = true;
      setGridHasFocus(true);
    },
    onBlur: () => {
      gridFocusedRef.current = false;
      setGridHasFocus(false);
    },
    onPointerLeave: () => {
      setHoveredDate(undefined);
    },
    children: children ?? (
      <>
        <GridHeader>
          <GridHeaderCell />
        </GridHeader>
        <GridBody>
          <WeekTemplate>
            <DayCellTemplate>
              <DayButton />
            </DayCellTemplate>
          </WeekTemplate>
        </GridBody>
      </>
    ),
  };

  const el = useRender({
    defaultTagName: "table",
    render,
    ref: ref ? [ref, gridRef] : [gridRef],
    state,
    stateAttributesMapping: gridStateAttributesMapping,
    props: mergeProps<"table">(defaultProps, otherProps),
  });

  const orientationCtx = useMemo(
    () => ({ orientation: resolvedOrientation }),
    [resolvedOrientation],
  );

  const monthCtx = useMemo(
    () => ({
      weeks: gridWeeks,
      year: gridMonth.year,
      month: gridMonth.month,
    }),
    [gridWeeks, gridMonth.year, gridMonth.month],
  );

  return (
    <GridMonthContext.Provider value={monthCtx}>
      <GridContext.Provider value={orientationCtx}>{el}</GridContext.Provider>
    </GridMonthContext.Provider>
  );
}

const MonthGrid = forwardRef(MonthGridFn) as <
  F extends ValueFormat = ValueFormat,
>(
  props: GridProps<F> & React.RefAttributes<HTMLTableElement>,
) => React.ReactElement | null;

// ---------------------------------------------------------------------------
// WeeksViewGrid — continuous week rows for WeeksView
// ---------------------------------------------------------------------------

function WeeksViewGridFn(
  props: GridProps,
  ref: React.ForwardedRef<HTMLTableElement>,
) {
  const {
    render,
    mode: _mode,
    orientation,
    autoFocus,
    monthIndex: _monthIndex,
    children,
    ...otherProps
  } = props;
  const { setHoveredDate } = useCalendarStable();
  const { setGridHasFocus } = useViewContext();
  const weeksStable = useWeeksViewStable();
  const weeksState = useWeeksViewState();
  const { gridFocusedRef } = weeksStable;
  const { gridLabelIds, weeks, currentDateTime } = weeksState;

  const handleKeyDown = useWeeksGridKeyboard();
  const gridRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    if (autoFocus && gridRef.current) {
      const target =
        gridRef.current.querySelector<HTMLElement>('[tabindex="0"]');
      if (target) {
        target.focus();
        gridFocusedRef.current = true;
        setGridHasFocus(true);
      }
    }
  }, [autoFocus, gridFocusedRef, setGridHasFocus]);

  const resolvedOrientation = orientation ?? "horizontal";
  const weekCount = weeks.length;

  // Use the first week's month/year as a reasonable default for state.
  const firstWeek = weeks[0];
  const gridMonth = firstWeek
    ? { month: firstWeek.month, year: firstWeek.year }
    : { month: 1, year: 1970 };

  const state = useMemo<GridState>(
    () => ({
      root: {} as GridState["root"],
      month: gridMonth.month,
      year: gridMonth.year,
      orientation: resolvedOrientation,
    }),
    [gridMonth.month, gridMonth.year, resolvedOrientation],
  );

  // Default children: header + WeeksGrid tbody with a <tr> per week.
  // WeeksGrid provides WeekDataContext per row so DayCellTemplate works.
  const weekRowChildren = children ?? (
    <>
      <GridHeader>
        <GridHeaderCell />
      </GridHeader>
      <WeeksGrid>
        <tr>
          <DayCellTemplate>
            <DayButton />
          </DayCellTemplate>
        </tr>
      </WeeksGrid>
    </>
  );

  const defaultProps: Record<string, unknown> = {
    role: "grid",
    "aria-labelledby": gridLabelIds[0] || undefined,
    "aria-label": gridLabelIds[0] ? undefined : "Calendar",
    "data-calendar-days-per-week": 7,
    "data-calendar-weeks-in-month": weekCount,
    style: {
      "--calendar-days-per-week": 7,
      "--calendar-weeks-in-month": weekCount,
    } as React.CSSProperties,
    onKeyDown: handleKeyDown,
    onFocus: () => {
      gridFocusedRef.current = true;
      setGridHasFocus(true);
    },
    onBlur: () => {
      gridFocusedRef.current = false;
      setGridHasFocus(false);
    },
    onPointerLeave: () => {
      setHoveredDate(undefined);
    },
    children: weekRowChildren,
  };

  const el = useRender({
    defaultTagName: "table",
    render,
    ref: ref ? [ref, gridRef] : [gridRef],
    state,
    stateAttributesMapping: gridStateAttributesMapping,
    props: mergeProps<"table">(defaultProps, otherProps),
  });

  const orientationCtx = useMemo(
    () => ({ orientation: resolvedOrientation }),
    [resolvedOrientation],
  );

  // Provide a MonthViewStableContext shim so shared components
  // (DayCellTemplate, DayButton, etc.) that read it can function in WeeksView.
  const monthViewStableShim = useMemo(
    () => ({
      numberOfMonths: 1,
      fixedWeeks: false,
      outsideDays: "enabled" as const,
      overflowBehavior: "unbounded" as const,
      goNextMonth: () => {},
      goPrevMonth: () => {},
      setGridLabelId: () => {},
      gridFocusedRef,
    }),
    [gridFocusedRef],
  );

  // Provide a MonthViewStateContext shim with reasonable defaults derived
  // from the WeeksView state so WeekTemplate/DayCellTemplate/DayButton work.
  const monthViewStateShim = useMemo(
    () => ({
      currentMonth: {
        year: currentDateTime.year,
        month: currentDateTime.month,
      },
      weeks: [] as Temporal.PlainDate[][],
      allMonths: [],
      currentDateTime,
      gridLabelIds,
      rootState: {} as RootState,
    }),
    [currentDateTime, gridLabelIds],
  );

  return (
    <MonthViewStableContext.Provider value={monthViewStableShim}>
      <MonthViewStateContext.Provider value={monthViewStateShim}>
        <GridContext.Provider value={orientationCtx}>{el}</GridContext.Provider>
      </MonthViewStateContext.Provider>
    </MonthViewStableContext.Provider>
  );
}

const WeeksViewGrid = forwardRef(WeeksViewGridFn) as <
  F extends ValueFormat = ValueFormat,
>(
  props: GridProps<F> & React.RefAttributes<HTMLTableElement>,
) => React.ReactElement | null;

const gridBodyStateAttributesMapping = {
  root: () => null,
} as const satisfies StateAttributesMapping<GridBodyState>;

/** Table body wrapping the week rows. Renders a `<tbody>` by default. */
function GridBodyFn(
  props: GridBodyProps,
  ref: React.ForwardedRef<HTMLTableSectionElement>,
) {
  const weeksState = useContext(WeeksViewStateContext);

  // In WeeksView, delegate to WeeksGrid which handles week iteration
  // and MonthSeparator context provision.
  if (weeksState) {
    const { children, className, style } = props as any;
    return (
      <WeeksGrid className={className} style={style}>
        {children}
      </WeeksGrid>
    );
  }

  return <MonthGridBody ref={ref} {...props} />;
}

export const GridBody = forwardRef(GridBodyFn) as <
  F extends ValueFormat = ValueFormat,
>(
  props: GridBodyProps<F> & React.RefAttributes<HTMLTableSectionElement>,
) => React.ReactElement | null;

function MonthGridBodyFn(
  props: GridBodyProps,
  ref: React.ForwardedRef<HTMLTableSectionElement>,
) {
  const { render, ...otherProps } = props;
  const { rootState } = useMonthViewState();

  const state = useMemo<GridBodyState>(
    () => ({ root: rootState as unknown as GridBodyState["root"] }),
    [rootState],
  );

  const defaultProps: Record<string, unknown> = {
    children: props.children ?? (
      <WeekTemplate>
        <DayCellTemplate>
          <DayButton />
        </DayCellTemplate>
      </WeekTemplate>
    ),
  };

  const { children: _children, ...restOtherProps } = otherProps;

  return useRender({
    defaultTagName: "tbody",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping: gridBodyStateAttributesMapping,
    props: mergeProps<"tbody">(defaultProps, restOtherProps),
  });
}

const MonthGridBody = forwardRef(MonthGridBodyFn) as <
  F extends ValueFormat = ValueFormat,
>(
  props: GridBodyProps<F> & React.RefAttributes<HTMLTableSectionElement>,
) => React.ReactElement | null;

const weekInstanceStateAttributesMapping = {
  root: () => null,
  weekIndex: () => null,
  gridRow: () => null,
} as const satisfies StateAttributesMapping<WeekTemplateState>;

function WeekInstance<F extends ValueFormat = ValueFormat>(
  props: WeekTemplateProps<F>,
) {
  const { render, ...otherProps } = props;
  const weekData = useContext(WeekDataContext)!;
  const { rootState } = useMonthViewState();

  const state = useMemo<WeekTemplateState<F>>(
    () => ({
      root: rootState as unknown as WeekTemplateState<F>["root"],
      weekIndex: weekData.weekIndex,
      gridRow: weekData.gridRow,
    }),
    [rootState, weekData.weekIndex, weekData.gridRow],
  );

  return useRender({
    defaultTagName: "tr",
    render,
    ref: [],
    state,
    stateAttributesMapping: weekInstanceStateAttributesMapping,
    props: mergeProps<"tr">({}, otherProps),
  });
}

/**
 * Iterates over the weeks in the current month and renders one `<tr>` per week.
 * Each instance receives its week's days and index via {@link WeekDataContext}.
 */
export function WeekTemplate<F extends ValueFormat = ValueFormat>(
  props: WeekTemplateProps<F>,
) {
  const outerWeekData = useContext(WeekDataContext);
  const gridMonthCtx = useContext(GridMonthContext);
  const { weeks: defaultWeeks } = useMonthViewState();
  const weeks = gridMonthCtx?.weeks ?? defaultWeeks;
  const gridMonth = useMemo(
    () =>
      gridMonthCtx
        ? { year: gridMonthCtx.year, month: gridMonthCtx.month }
        : undefined,
    [gridMonthCtx],
  );
  const Instance = WeekInstance<F>;

  return (
    <>
      {weeks.map((weekDays, i) => (
        <WeekDataContext.Provider
          key={weekDays[0].toString()}
          value={{
            days: weekDays,
            weekIndex: i,
            gridMonth,
            gridRow: outerWeekData?.gridRow,
          }}
        >
          <Instance {...props} />
        </WeekDataContext.Provider>
      ))}
    </>
  );
}
