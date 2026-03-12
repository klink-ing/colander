import {
  useContext,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import type { KeyboardEvent } from "react";
import {
  useDatePicker,
  useDatePickerState,
  WeekDataContext,
  GridContext,
  GridMonthContext,
} from "./context";
import { computeNextFocusDate } from "./keyboard";
import { GridHeader, GridHeaderCell } from "./grid-header";
import type {
  ValueFormat,
  GridState,
  GridProps,
  GridBodyState,
  GridBodyProps,
  WeekTemplateState,
  WeekTemplateProps,
} from "./types";
import { StateAttributesMapping } from "node_modules/@base-ui/react/esm/utils/getStateAttributesProps";
export { GridHeader, GridHeaderCell } from "./grid-header";
export { DayCellTemplate, DayButton } from "./day-cell";

import { DayCellTemplate, DayButton } from "./day-cell";

function useGridKeyboard() {
  const {
    focusedDate,
    setFocusedDate,
    onSelect,
    disabled,
    readOnly,
    isDateDisabled,
    minValue,
    maxValue,
    temporal: T,
    weekStartDay,
  } = useDatePicker();

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
 */
export function Grid<F extends ValueFormat = ValueFormat>(
  props: GridProps<F> & { ref?: React.Ref<HTMLTableElement> },
) {
  const {
    ref,
    render,
    mode: _mode,
    orientation,
    autoFocus,
    monthIndex: monthIndexProp,
    children,
    ...otherProps
  } = props;
  const monthIndex = monthIndexProp ?? 0;
  const {
    currentDateTime,
    gridLabelIds,
    rootState,
    weeks: defaultWeeks,
    allMonths,
    gridFocusedRef,
    setGridHasFocus,
    setHoveredDate,
  } = useDatePicker<F>();

  const monthData = allMonths[monthIndex];
  if (monthIndex >= allMonths.length) {
    console.warn(
      `[DatePicker] Grid monthIndex={${monthIndex}} is out of bounds (numberOfMonths=${allMonths.length}). Falling back to the first month.`,
    );
  }
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

  const state = useMemo<GridState<F>>(
    () => ({
      root: rootState,
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
    () => ({ weeks: gridWeeks, year: gridMonth.year, month: gridMonth.month }),
    [gridWeeks, gridMonth.year, gridMonth.month],
  );

  return (
    <GridMonthContext.Provider value={monthCtx}>
      <GridContext.Provider value={orientationCtx}>{el}</GridContext.Provider>
    </GridMonthContext.Provider>
  );
}

const gridBodyStateAttributesMapping = {
  root: () => null,
} as const satisfies StateAttributesMapping<GridBodyState>;

/** Table body wrapping the week rows. Renders a `<tbody>` by default. */
export function GridBody<F extends ValueFormat = ValueFormat>(
  props: GridBodyProps<F> & { ref?: React.Ref<HTMLTableSectionElement> },
) {
  const { ref, render, ...otherProps } = props;
  const { rootState } = useDatePickerState();

  const state = useMemo<GridBodyState<F>>(
    () => ({ root: rootState as unknown as GridBodyState<F>["root"] }),
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

const weekInstanceStateAttributesMapping = {
  root: () => null,
  weekIndex: () => null,
} as const satisfies StateAttributesMapping<WeekTemplateState>;

function WeekInstance<F extends ValueFormat = ValueFormat>(
  props: WeekTemplateProps<F> & { ref?: React.Ref<HTMLTableRowElement> },
) {
  const { ref, render, ...otherProps } = props;
  const weekData = useContext(WeekDataContext)!;
  const { rootState } = useDatePickerState();

  const state = useMemo<WeekTemplateState<F>>(
    () => ({
      root: rootState as unknown as WeekTemplateState<F>["root"],
      weekIndex: weekData.weekIndex,
    }),
    [rootState, weekData.weekIndex],
  );

  return useRender({
    defaultTagName: "tr",
    render,
    ref: ref ? [ref] : [],
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
  props: WeekTemplateProps<F> & { ref?: React.Ref<HTMLTableRowElement> },
) {
  const gridMonthCtx = useContext(GridMonthContext);
  const { weeks: defaultWeeks } = useDatePickerState();
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
          value={{ days: weekDays, weekIndex: i, gridMonth }}
        >
          <Instance {...props} />
        </WeekDataContext.Provider>
      ))}
    </>
  );
}
