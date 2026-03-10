import {
  useContext,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
} from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import type { Temporal as TemporalPoly } from "@js-temporal/polyfill";
import {
  useDatePicker,
  WeekDataContext,
  DayCellDataContext,
  GridContext,
  GridOrientation,
} from "./context";
import { computeNextFocusDate } from "./keyboard";
import {
  selectedToZdt,
  sameCalendarDay,
  shouldMoveDomFocus,
  isInRange as isInRangeUtil,
} from "./utils";
import { GridHeader, GridHeaderCell } from "./grid-header";
import type {
  ValueFormat,
  GridState,
  GridProps,
  GridBodyState,
  GridBodyProps,
  WeekTemplateState,
  WeekTemplateProps,
  DayCellTemplateProps,
  DayButtonProps,
  DayCellTemplateState,
} from "./types";
import { StateAttributesMapping } from "node_modules/@base-ui/react/esm/utils/getStateAttributesProps";
export { GridHeader, GridHeaderCell } from "./grid-header";

function useGridKeyboard() {
  const {
    focusedDate,
    setFocusedDate,
    onSelect,
    disabled,
    isDateDisabled,
    minValue,
    maxValue,
    temporal: T,
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
        isDateDisabled,
        T,
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
      isDateDisabled,
      minValue,
      maxValue,
      T,
    ],
  );
}

function useDayDerivedState(date: TemporalPoly.PlainDate) {
  const {
    selected,
    currentDateTime,
    disabled,
    isDateDisabled,
    focusedDate,
    rangeStart,
    rangeEnd,
    timeZone,
    temporal: T,
  } = useDatePicker();

  const today = useMemo(() => T.Now.plainDateISO(), [T]);
  const selZdt = selectedToZdt(selected, timeZone, T);
  const isSelected = selZdt ? sameCalendarDay(selZdt, date) : false;
  const isCurrentMonth =
    date.year === currentDateTime.year && date.month === currentDateTime.month;
  const isToday = T.PlainDate.compare(date, today) === 0;
  const isDisabled = disabled || (isDateDisabled?.(date) ?? false);
  const isFocused = T.PlainDate.compare(date, focusedDate) === 0;

  const isRangeStart = rangeStart
    ? T.PlainDate.compare(date, rangeStart) === 0
    : false;
  const isRangeEnd = rangeEnd
    ? T.PlainDate.compare(date, rangeEnd) === 0
    : false;
  const isInRangeDay = isInRangeUtil(date, rangeStart, rangeEnd, T);

  const columnIndex = date.dayOfWeek % 7;

  return {
    isSelected,
    isCurrentMonth,
    isToday,
    isDisabled,
    isFocused,
    isRangeStart,
    isRangeEnd,
    isInRangeDay,
    columnIndex,
  };
}

/**
 * Returns the full {@link DayCellTemplateState} for a given date.
 *
 * Useful for custom day-cell render functions that need access to all
 * derived state (selected, today, disabled, range membership, etc.).
 */
export function useDayState<F extends ValueFormat = ValueFormat>(
  date: TemporalPoly.PlainDate,
  orientation: GridOrientation = "vertical",
) {
  const { rootState } = useDatePicker<F>();
  const {
    isSelected,
    isCurrentMonth,
    isToday,
    isDisabled,
    isFocused,
    isRangeStart,
    isRangeEnd,
    isInRangeDay,
    columnIndex,
  } = useDayDerivedState(date);

  const state = useMemo<DayCellTemplateState<F>>(
    () => ({
      root: rootState,
      date,
      columnIndex,
      orientation,
      selected: isSelected,
      today: isToday,
      disabled: isDisabled,
      outsideMonth: !isCurrentMonth,
      focused: isFocused,
      rangeStart: isRangeStart,
      rangeEnd: isRangeEnd,
      rangeBoundary: isRangeStart || isRangeEnd,
      inRange: isInRangeDay,
    }),
    [
      rootState,
      date,
      columnIndex,
      orientation,
      isSelected,
      isToday,
      isDisabled,
      isCurrentMonth,
      isFocused,
      isRangeStart,
      isRangeEnd,
      isInRangeDay,
    ],
  );

  return state;
}

function useDayButtonState<F extends ValueFormat = ValueFormat>(
  date: TemporalPoly.PlainDate,
  orientation: GridOrientation = "vertical",
) {
  const {
    onSelect,
    setFocusedDate,
    locale,
    tabTargetDate,
    gridFocusedRef,
    temporal: T,
  } = useDatePicker<F>();
  const { isDisabled, isFocused } = useDayDerivedState(date);
  const internalRef = useRef<HTMLButtonElement>(null);
  const isTabTarget = T.PlainDate.compare(date, tabTargetDate) === 0;

  useEffect(() => {
    if (
      shouldMoveDomFocus(isFocused, gridFocusedRef.current) &&
      internalRef.current
    ) {
      internalRef.current.focus();
    }
  }, [isFocused, gridFocusedRef]);

  const state = useDayState<F>(date, orientation);

  const defaultProps: Record<string, unknown> = {
    type: "button",
    tabIndex: isTabTarget ? 0 : -1,
    disabled: isDisabled,
    "aria-label": date.toLocaleString(locale, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    date: date.toString(),
    "data-testid": `button-day-${date.toString()}`,
    onClick: () => {
      setFocusedDate(date);
      onSelect(date);
    },
    children: date.day,
  };

  return { state, defaultProps, internalRef };
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
    children,
    ...otherProps
  } = props;
  const {
    currentDateTime,
    gridLabelId,
    rootState,
    weeks,
    gridFocusedRef,
    setGridHasFocus,
  } = useDatePicker<F>();
  const handleKeyDown = useGridKeyboard();

  const resolvedOrientation = orientation ?? "vertical";
  const daysPerWeek = weeks[0]?.length ?? 7;
  const weeksInMonth = weeks.length;

  const state = useMemo<GridState<F>>(
    () => ({
      root: rootState,
      month: currentDateTime.month,
      year: currentDateTime.year,
      orientation: resolvedOrientation,
    }),
    [
      rootState,
      currentDateTime.month,
      currentDateTime.year,
      resolvedOrientation,
    ],
  );

  const defaultProps: Record<string, unknown> = {
    role: "grid",
    "aria-labelledby": gridLabelId || undefined,
    "aria-label": gridLabelId ? undefined : "Calendar",
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
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping: gridStateAttributesMapping,
    props: mergeProps<"table">(defaultProps, otherProps),
  });

  const ctx = useMemo(
    () => ({ orientation: resolvedOrientation }),
    [resolvedOrientation],
  );

  if (resolvedOrientation) {
    return <GridContext.Provider value={ctx}>{el}</GridContext.Provider>;
  }

  return el;
}

const gridBodyStateAttributesMapping = {
  root: () => null,
} as const satisfies StateAttributesMapping<GridBodyState>;

/** Table body wrapping the week rows. Renders a `<tbody>` by default. */
export function GridBody<F extends ValueFormat = ValueFormat>(
  props: GridBodyProps<F> & { ref?: React.Ref<HTMLTableSectionElement> },
) {
  const { ref, render, ...otherProps } = props;
  const { rootState } = useDatePicker<F>();

  const state = useMemo<GridBodyState<F>>(
    () => ({ root: rootState }),
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
  const { rootState } = useDatePicker<F>();

  const state = useMemo<WeekTemplateState<F>>(
    () => ({ root: rootState, weekIndex: weekData.weekIndex }),
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
  const { weeks } = useDatePicker<F>();
  const Instance = WeekInstance<F>;

  return (
    <>
      {weeks.map((weekDays, i) => (
        <WeekDataContext.Provider
          key={weekDays[0].toString()}
          value={{ days: weekDays, weekIndex: i }}
        >
          <Instance {...props} />
        </WeekDataContext.Provider>
      ))}
    </>
  );
}

const dayStateAttributesMapping = {
  root: () => null,
  date: (v: TemporalPoly.PlainDate) =>
    v ? { "data-date": v.toString() } : null,
  columnIndex: () => null,
  orientation: (v) => (v ? { "data-orientation": v } : null),
  selected: (v) => (v ? { "data-selected": "" } : null),
  today: (v) => (v ? { "data-today": "" } : null),
  disabled: (v) => (v ? { "data-disabled": "" } : null),
  outsideMonth: (v) => (v ? { "data-outside-month": "" } : null),
  focused: (v) => (v ? { "data-focused": "" } : null),
  rangeStart: (v) => (v ? { "data-range-start": "" } : null),
  rangeEnd: (v) => (v ? { "data-range-end": "" } : null),
  rangeBoundary: (v) => (v ? { "data-range-boundary": "" } : null),
  inRange: (v) => (v ? { "data-in-range": "" } : null),
} as const satisfies StateAttributesMapping<DayCellTemplateState>;

function DayCellInstance<F extends ValueFormat = ValueFormat>(
  props: Omit<DayCellTemplateProps<F>, "date"> & {
    date: TemporalPoly.PlainDate;
    columnIndex?: number;
    ref?: React.Ref<HTMLTableCellElement>;
  },
) {
  const { ref, render, date, columnIndex, children, ...otherProps } = props;
  const { orientation } = useContext(GridContext);
  const state = useDayState<F>(date, orientation);

  const defaultProps: Record<string, unknown> = {
    role: "gridcell",
    "aria-selected": state.selected || undefined,
    "aria-disabled": state.disabled || undefined,
    children: children ?? <DayButton />,
  };

  const cell = useRender({
    defaultTagName: "td",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping: dayStateAttributesMapping,
    props: mergeProps<"td">(defaultProps, otherProps),
  });

  return (
    <DayCellDataContext.Provider value={{ date, columnIndex }}>
      {cell}
    </DayCellDataContext.Provider>
  );
}

/**
 * Renders one `<td role="gridcell">` per day. Exposes data-attributes for
 * `selected`, `today`, `disabled`, `outside-month`, `focused`,
 * `range-start`, `range-end`, `range-boundary`, `in-range`, and `date`.
 *
 * When used inside a {@link WeekTemplate}, iterates over that week's days.
 * An explicit `date` prop renders a single cell.
 */
export function DayCellTemplate<F extends ValueFormat = ValueFormat>(
  props: DayCellTemplateProps<F> & { ref?: React.Ref<HTMLTableCellElement> },
) {
  const { date: dateProp, ...restProps } = props;
  const weekData = useContext(WeekDataContext);
  const { weeks } = useDatePicker<F>();

  const Instance = DayCellInstance<F>;

  if (dateProp) {
    return <Instance {...restProps} date={dateProp} />;
  }

  const days = weekData ? weekData.days : weeks.flat();
  const perWeek = weekData != null;
  return (
    <>
      {days.map((day, i) => (
        <Instance
          key={day.toString()}
          {...restProps}
          date={day}
          columnIndex={perWeek ? i : undefined}
        />
      ))}
    </>
  );
}

function DayButtonInstance<F extends ValueFormat = ValueFormat>(
  props: Omit<DayButtonProps<F>, "date"> & {
    date: TemporalPoly.PlainDate;
    ref?: React.Ref<HTMLButtonElement>;
  },
) {
  const { ref, render, date, ...otherProps } = props;
  const { orientation } = useContext(GridContext);
  const { state, defaultProps, internalRef } = useDayButtonState<F>(
    date,
    orientation,
  );

  return useRender({
    defaultTagName: "button",
    render,
    ref: ref ? [ref, internalRef] : [internalRef],
    state,
    stateAttributesMapping: dayStateAttributesMapping,
    props: mergeProps<"button">(defaultProps, otherProps),
  });
}

/**
 * Interactive `<button>` inside a day cell. Handles click-to-select,
 * roving tabindex, and imperative focus on keyboard navigation.
 *
 * Must be used inside a {@link DayCellTemplate} or given an explicit `date` prop.
 */
export function DayButton<F extends ValueFormat = ValueFormat>(
  props: DayButtonProps<F> & { ref?: React.Ref<HTMLButtonElement> },
) {
  const { date: dateProp, ...restProps } = props;
  const cellData = useContext(DayCellDataContext);

  const resolvedDate = dateProp ?? cellData?.date;

  const Instance = DayButtonInstance<F>;

  if (resolvedDate) {
    return <Instance {...restProps} date={resolvedDate} />;
  }

  throw new Error(
    "DayButton must be used inside DayCellTemplate or receive an explicit date prop.",
  );
}
