import { useContext, useMemo, useCallback, useEffect, useRef, type KeyboardEvent } from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import type { Temporal } from "@js-temporal/polyfill";
import { useDatePicker, WeekDataContext, DayCellDataContext, GridOrientationContext } from "./context";
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
  DayButtonState,
} from "./types";
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

function useDayDerivedState(date: Temporal.PlainDate) {
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

  return { isSelected, isCurrentMonth, isToday, isDisabled, isFocused, isRangeStart, isRangeEnd, isInRangeDay };
}

function useDayCellState<F extends ValueFormat = ValueFormat>(
  date: Temporal.PlainDate,
  columnIndex: number = -1,
  orientation: "horizontal" | "vertical" = "vertical",
) {
  const { rootState } = useDatePicker<F>();
  const { isSelected, isCurrentMonth, isToday, isDisabled, isFocused, isRangeStart, isRangeEnd, isInRangeDay } =
    useDayDerivedState(date);

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
      inRange: isInRangeDay,
    }),
    [rootState, date, columnIndex, orientation, isSelected, isToday, isDisabled, isCurrentMonth, isFocused, isRangeStart, isRangeEnd, isInRangeDay],
  );

  const defaultProps: Record<string, unknown> = {
    role: "gridcell",
    "aria-selected": isSelected || undefined,
    "aria-disabled": isDisabled || undefined,
  };

  return { state, defaultProps };
}

function useDayButtonState<F extends ValueFormat = ValueFormat>(
  date: Temporal.PlainDate,
) {
  const {
    onSelect,
    setFocusedDate,
    locale,
    rootState,
    tabTargetDate,
    gridFocusedRef,
    temporal: T,
  } = useDatePicker<F>();
  const { isSelected, isCurrentMonth, isToday, isDisabled, isFocused, isRangeStart, isRangeEnd, isInRangeDay } =
    useDayDerivedState(date);
  const internalRef = useRef<HTMLButtonElement>(null);
  const isTabTarget = T.PlainDate.compare(date, tabTargetDate) === 0;

  useEffect(() => {
    if (shouldMoveDomFocus(isFocused, gridFocusedRef.current) && internalRef.current) {
      internalRef.current.focus();
    }
  }, [isFocused, gridFocusedRef]);

  const state = useMemo<DayButtonState<F>>(
    () => ({
      root: rootState,
      selected: isSelected,
      today: isToday,
      disabled: isDisabled,
      outsideMonth: !isCurrentMonth,
      focused: isFocused,
      rangeStart: isRangeStart,
      rangeEnd: isRangeEnd,
      inRange: isInRangeDay,
    }),
    [rootState, isSelected, isToday, isDisabled, isCurrentMonth, isFocused, isRangeStart, isRangeEnd, isInRangeDay],
  );

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
    id: `day-${date.toString()}`,
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
};

export function Grid<F extends ValueFormat = ValueFormat>(
  props: GridProps<F> & { ref?: React.Ref<HTMLTableElement> },
) {
  const { ref, render, mode: _mode, orientation, children, ...otherProps } = props;
  const { currentDateTime, gridLabelId, rootState, weeks, gridFocusedRef, setGridHasFocus } = useDatePicker<F>();
  const handleKeyDown = useGridKeyboard();

  const resolvedOrientation = orientation ?? "vertical";
  const daysPerWeek = weeks[0]?.length ?? 7;
  const weeksInMonth = weeks.length;

  const state = useMemo<GridState<F>>(
    () => ({
      root: rootState,
      month: currentDateTime.month,
      year: currentDateTime.year,
    }),
    [rootState, currentDateTime.month, currentDateTime.year],
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

  if (resolvedOrientation === "horizontal") {
    return (
      <GridOrientationContext.Provider value="horizontal">
        {el}
      </GridOrientationContext.Provider>
    );
  }

  return el;
}

const gridBodyStateAttributesMapping = {
  root: () => null,
};

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
};

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
  date: () => null,
  columnIndex: () => null,
  orientation: () => null,
  selected: (v: boolean) => (v ? { "data-selected": "" } : null),
  today: (v: boolean) => (v ? { "data-today": "" } : null),
  disabled: (v: boolean) => (v ? { "data-disabled": "" } : null),
  outsideMonth: (v: boolean) => (v ? { "data-outside-month": "" } : null),
  focused: (v: boolean) => (v ? { "data-focused": "" } : null),
  rangeStart: (v: boolean) => (v ? { "data-range-start": "" } : null),
  rangeEnd: (v: boolean) => (v ? { "data-range-end": "" } : null),
  inRange: (v: boolean) => (v ? { "data-in-range": "" } : null),
};

function DayCellInstance<F extends ValueFormat = ValueFormat>(
  props: Omit<DayCellTemplateProps<F>, "date"> & {
    date: import("@js-temporal/polyfill").Temporal.PlainDate;
    columnIndex?: number;
    ref?: React.Ref<HTMLTableCellElement>;
  },
) {
  const { ref, render, date, columnIndex, children, ...otherProps } = props;
  const orientation = useContext(GridOrientationContext);
  const {
    state,
    defaultProps: cellDefaults,
  } = useDayCellState<F>(date, columnIndex ?? -1, orientation);

  const defaultProps: Record<string, unknown> = {
    ...cellDefaults,
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
    date: import("@js-temporal/polyfill").Temporal.PlainDate;
    ref?: React.Ref<HTMLButtonElement>;
  },
) {
  const { ref, render, date, ...otherProps } = props;
  const { state, defaultProps, internalRef } =
    useDayButtonState<F>(date);

  return useRender({
    defaultTagName: "button",
    render,
    ref: ref ? [ref, internalRef] : [internalRef],
    state,
    stateAttributesMapping: dayStateAttributesMapping,
    props: mergeProps<"button">(defaultProps, otherProps),
  });
}

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
