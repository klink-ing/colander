import { useContext, useMemo } from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { useDatePicker, WeekDataContext, DayCellDataContext, GridOrientationContext } from "./context";
import { useGridKeyboard, useDayCellState, useDayButtonState } from "./hooks";
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
} from "./types";
export { GridHeader, GridHeaderCell } from "./grid-header";

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

  const stateAttributesMapping = useMemo(
    () => ({
      root: () => null,
      month: () => null,
      year: () => null,
    }),
    [],
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
    stateAttributesMapping,
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

export function GridBody<F extends ValueFormat = ValueFormat>(
  props: GridBodyProps<F> & { ref?: React.Ref<HTMLTableSectionElement> },
) {
  const { ref, render, ...otherProps } = props;
  const { rootState } = useDatePicker<F>();

  const state = useMemo<GridBodyState<F>>(
    () => ({ root: rootState }),
    [rootState],
  );

  const stateAttributesMapping = useMemo(
    () => ({
      root: () => null,
    }),
    [],
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
    stateAttributesMapping,
    props: mergeProps<"tbody">(defaultProps, restOtherProps),
  });
}

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

  const stateAttributesMapping = useMemo(
    () => ({
      root: () => null,
      weekIndex: () => null,
    }),
    [],
  );

  return useRender({
    defaultTagName: "tr",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping,
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

function DayCellInstance<F extends ValueFormat = ValueFormat>(
  props: Omit<DayCellTemplateProps<F>, "date"> & {
    date: import("@js-temporal/polyfill").Temporal.PlainDate;
    columnIndex?: number;
    ref?: React.Ref<HTMLTableCellElement>;
  },
) {
  const { ref, render, date, columnIndex, children, ...otherProps } = props;
  const {
    state,
    stateAttributesMapping,
    defaultProps: cellDefaults,
  } = useDayCellState<F>(date);

  const defaultProps: Record<string, unknown> = {
    ...cellDefaults,
    ...(columnIndex != null ? { "data-column-index": columnIndex } : {}),
    children: children ?? <DayButton />,
  };

  const cell = useRender({
    defaultTagName: "td",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping,
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
  const { state, stateAttributesMapping, defaultProps, internalRef } =
    useDayButtonState<F>(date);

  return useRender({
    defaultTagName: "button",
    render,
    ref: ref ? [ref, internalRef] : [internalRef],
    state,
    stateAttributesMapping,
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
