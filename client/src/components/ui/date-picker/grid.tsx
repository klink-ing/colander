import {
  useContext,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  memo,
  type KeyboardEvent,
} from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import type { Temporal as TemporalPoly } from "@js-temporal/polyfill";
import {
  useDatePicker,
  useDatePickerStable,
  useDatePickerState,
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
  DateValueObject,
  TemporalNamespace,
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

/** Computes derived day cell state from context values. Pure function, no hooks. */
function computeDayCellState(
  date: TemporalPoly.PlainDate,
  orientation: GridOrientation,
  columnIndex: number,
  rootState: DayCellTemplateState["root"],
  selected: DateValueObject | undefined,
  currentDateTime: { year: number; month: number },
  disabled: boolean,
  isDateDisabled: ((date: TemporalPoly.PlainDate) => boolean) | undefined,
  focusedDate: TemporalPoly.PlainDate,
  rangeStart: TemporalPoly.PlainDate | undefined,
  rangeEnd: TemporalPoly.PlainDate | undefined,
  tabTargetDate: TemporalPoly.PlainDate,
  timeZone: string,
  T: TemporalNamespace,
): DayCellTemplateState & { isTabTarget: boolean } {
  const today = T.Now.plainDateISO();
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
    focused: isFocused,
    rangeStart: isRangeStart,
    rangeEnd: isRangeEnd,
    rangeBoundary: isRangeStart || isRangeEnd,
    inRange: isInRangeDay,
    isTabTarget,
  };
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
    () => ({ root: rootState as unknown as WeekTemplateState<F>["root"], weekIndex: weekData.weekIndex }),
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
  const { weeks } = useDatePickerState();
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

/** Props for the memoized DayCellInstance. */
interface DayCellInstanceProps<F extends ValueFormat = ValueFormat> {
  render?: DayCellTemplateProps<F>["render"];
  date: TemporalPoly.PlainDate;
  columnIndex?: number;
  children?: React.ReactNode;
  _derivedState: DayCellTemplateState & { isTabTarget: boolean };
  ref?: React.Ref<HTMLTableCellElement>;
  [key: string]: unknown;
}

function DayCellInstanceInnerFn<F extends ValueFormat = ValueFormat>(
  props: DayCellInstanceProps<F>,
) {
  const {
    ref,
    render,
    date,
    columnIndex,
    children,
    _derivedState,
    ...otherProps
  } = props;

  const state = _derivedState as unknown as DayCellTemplateState<F>;

  const defaultProps: Record<string, unknown> = {
    role: "gridcell",
    "aria-selected": state.selected || undefined,
    "aria-disabled": state.disabled || undefined,
    children: children ?? (
      <DayButton
        _derivedState={_derivedState}
      />
    ),
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

function dayCellPropsAreEqual(
  prev: DayCellInstanceProps,
  next: DayCellInstanceProps,
): boolean {
  // Skip `children` — React elements are always new objects. Child components
  // that subscribe to context (e.g. DayButton fallback) get their own
  // re-render via context; the optimised internal DayButton reads only
  // stable context and is separately memo'd.
  if (prev.date !== next.date || prev.render !== next.render || prev.columnIndex !== next.columnIndex) return false;
  const a = prev._derivedState;
  const b = next._derivedState;
  return (
    a.selected === b.selected &&
    a.today === b.today &&
    a.disabled === b.disabled &&
    a.outsideMonth === b.outsideMonth &&
    a.focused === b.focused &&
    a.rangeStart === b.rangeStart &&
    a.rangeEnd === b.rangeEnd &&
    a.inRange === b.inRange &&
    a.isTabTarget === b.isTabTarget
  );
}

const DayCellInstanceInner = memo(DayCellInstanceInnerFn, dayCellPropsAreEqual) as typeof DayCellInstanceInnerFn;

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

  const {
    selected,
    currentDateTime,
    focusedDate,
    rangeStart,
    rangeEnd,
    tabTargetDate,
    rootState,
    weeks,
  } = useDatePickerState();

  const {
    disabled,
    isDateDisabled,
    timeZone,
    temporal: T,
  } = useDatePickerStable();

  const { orientation } = useContext(GridContext);

  if (dateProp) {
    const colIdx = dateProp.dayOfWeek % 7;
    const derived = computeDayCellState(
      dateProp,
      orientation,
      colIdx,
      rootState,
      selected,
      currentDateTime,
      disabled,
      isDateDisabled,
      focusedDate,
      rangeStart,
      rangeEnd,
      tabTargetDate,
      timeZone,
      T,
    );
    return (
      <DayCellInstanceInner<F>
        {...restProps}
        date={dateProp}
        _derivedState={derived}
      />
    );
  }

  const days = weekData ? weekData.days : weeks.flat();
  const perWeek = weekData != null;

  return (
    <>
      {days.map((day, i) => {
        const colIdx = perWeek ? i : day.dayOfWeek % 7;
        const derived = computeDayCellState(
          day,
          orientation,
          colIdx,
          rootState,
          selected,
          currentDateTime,
          disabled,
          isDateDisabled,
          focusedDate,
          rangeStart,
          rangeEnd,
          tabTargetDate,
          timeZone,
          T,
        );
        return (
          <DayCellInstanceInner<F>
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
interface DayButtonInstanceProps<F extends ValueFormat = ValueFormat> {
  render?: DayButtonProps<F>["render"];
  date: TemporalPoly.PlainDate;
  _derivedState?: DayCellTemplateState & { isTabTarget: boolean };
  ref?: React.Ref<HTMLButtonElement>;
  [key: string]: unknown;
}

function DayButtonInstanceInnerFn<F extends ValueFormat = ValueFormat>(
  props: DayButtonInstanceProps<F>,
) {
  const { ref, render, date, _derivedState, ...otherProps } = props;
  const {
    onSelect,
    setFocusedDate,
    locale,
    gridFocusedRef,
  } = useDatePickerStable();

  const internalRef = useRef<HTMLButtonElement>(null);

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

  const state = _derivedState as unknown as DayCellTemplateState<F>;

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

  return useRender({
    defaultTagName: "button",
    render,
    ref: ref ? [ref, internalRef] : [internalRef],
    state,
    stateAttributesMapping: dayStateAttributesMapping,
    props: mergeProps<"button">(defaultProps, otherProps),
  });
}

function dayButtonPropsAreEqual(
  prev: DayButtonInstanceProps,
  next: DayButtonInstanceProps,
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
    a.focused === b.focused &&
    a.rangeStart === b.rangeStart &&
    a.rangeEnd === b.rangeEnd &&
    a.inRange === b.inRange &&
    a.isTabTarget === b.isTabTarget
  );
}

const DayButtonInstanceInner = memo(DayButtonInstanceInnerFn, dayButtonPropsAreEqual) as typeof DayButtonInstanceInnerFn;

/**
 * Interactive `<button>` inside a day cell. Handles click-to-select,
 * roving tabindex, and imperative focus on keyboard navigation.
 *
 * Must be used inside a {@link DayCellTemplate} or given an explicit `date` prop.
 */
export function DayButton<F extends ValueFormat = ValueFormat>(
  props: DayButtonProps<F> & {
    ref?: React.Ref<HTMLButtonElement>;
    _derivedState?: DayCellTemplateState & { isTabTarget: boolean };
  },
) {
  const { date: dateProp, _derivedState, ...restProps } = props;
  const cellData = useContext(DayCellDataContext);

  const resolvedDate = dateProp ?? cellData?.date;

  if (resolvedDate) {
    // If we have derived state passed from parent, use it directly
    if (_derivedState) {
      return (
        <DayButtonInstanceInner<F>
          {...restProps}
          date={resolvedDate}
          _derivedState={_derivedState}
        />
      );
    }
    // Fallback: compute state (for standalone DayButton usage with explicit date)
    return <DayButtonFallback {...restProps} date={resolvedDate} />;
  }

  throw new Error(
    "DayButton must be used inside DayCellTemplate or receive an explicit date prop.",
  );
}

/** Fallback for standalone DayButton usage that needs to read context. */
function DayButtonFallback<F extends ValueFormat = ValueFormat>(
  props: Omit<DayButtonProps<F>, "date"> & {
    date: TemporalPoly.PlainDate;
    ref?: React.Ref<HTMLButtonElement>;
  },
) {
  const { date, ...restProps } = props;
  const { orientation } = useContext(GridContext);
  const {
    selected,
    currentDateTime,
    focusedDate,
    rangeStart,
    rangeEnd,
    tabTargetDate,
    rootState,
  } = useDatePickerState();
  const {
    disabled,
    isDateDisabled,
    timeZone,
    temporal: T,
  } = useDatePickerStable();

  const colIdx = date.dayOfWeek % 7;
  const derived = computeDayCellState(
    date,
    orientation,
    colIdx,
    rootState,
    selected,
    currentDateTime,
    disabled,
    isDateDisabled,
    focusedDate,
    rangeStart,
    rangeEnd,
    tabTargetDate,
    timeZone,
    T,
  );

  return (
    <DayButtonInstanceInner<F>
      {...restProps}
      date={date}
      _derivedState={derived}
    />
  );
}
