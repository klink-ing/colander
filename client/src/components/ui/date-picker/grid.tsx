import { useContext, useMemo } from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { useDatePicker, WeekDataContext, DayCellDataContext } from "./context";
import { useGridKeyboard, useDayCellState, useDayButtonState } from "./hooks";
import { GridHeader, GridHeaderCell } from "./labels";
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
  const { ref, render, mode: _mode, children, ...otherProps } = props;
  const { currentDateTime, gridLabelId, rootState } = useDatePicker<F>();
  const handleKeyDown = useGridKeyboard();

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
    onKeyDown: handleKeyDown,
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

  return useRender({
    defaultTagName: "table",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping,
    props: mergeProps<"table">(defaultProps, otherProps),
  });
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
    ref?: React.Ref<HTMLTableCellElement>;
  },
) {
  const { ref, render, date, children, ...otherProps } = props;
  const {
    state,
    stateAttributesMapping,
    defaultProps: cellDefaults,
  } = useDayCellState<F>(date);

  const defaultProps: Record<string, unknown> = {
    ...cellDefaults,
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
    <DayCellDataContext.Provider value={{ date }}>
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
  return (
    <>
      {days.map((day) => (
        <Instance key={day.toString()} {...restProps} date={day} />
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
