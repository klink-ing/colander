import { useContext, useMemo } from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { useDatePicker, WeekDataContext, DayCellDataContext } from "./context";
import { useGridKeyboard, useDayCellState, useDayButtonState } from "./hooks";
import { GridHeader, GridHeaderCell } from "./labels";
import type {
  GridState,
  GridProps,
  GridBodyState,
  GridBodyProps,
  WeekTemplateState,
  WeekTemplateProps,
  DayCellTemplateProps,
  DayButtonProps,
} from "./types";

export function Grid(
  props: GridProps & { ref?: React.Ref<HTMLTableElement> },
) {
  const { ref, render, mode: _mode, children, ...otherProps } = props;
  const { currentDateTime, gridLabelId, rootState } = useDatePicker();
  const handleKeyDown = useGridKeyboard();

  const state = useMemo<GridState>(
    () => ({ root: rootState, month: currentDateTime.month, year: currentDateTime.year }),
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

export function GridBody(
  props: GridBodyProps & { ref?: React.Ref<HTMLTableSectionElement> },
) {
  const { ref, render, ...otherProps } = props;
  const { rootState } = useDatePicker();

  const state = useMemo<GridBodyState>(() => ({ root: rootState }), [rootState]);

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

function WeekInstance(
  props: WeekTemplateProps & { ref?: React.Ref<HTMLTableRowElement> },
) {
  const { ref, render, ...otherProps } = props;
  const weekData = useContext(WeekDataContext)!;
  const { rootState } = useDatePicker();

  const state = useMemo<WeekTemplateState>(
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

export function WeekTemplate(
  props: WeekTemplateProps & { ref?: React.Ref<HTMLTableRowElement> },
) {
  const { weeks } = useDatePicker();

  return (
    <>
      {weeks.map((weekDays, i) => (
        <WeekDataContext.Provider
          key={i}
          value={{ days: weekDays, weekIndex: i }}
        >
          <WeekInstance {...props} />
        </WeekDataContext.Provider>
      ))}
    </>
  );
}

function DayCellInstance(
  props: Omit<DayCellTemplateProps, "date"> & {
    date: import("@js-temporal/polyfill").Temporal.PlainDate;
    ref?: React.Ref<HTMLTableCellElement>;
  },
) {
  const { ref, render, date, children, ...otherProps } = props;
  const { state, stateAttributesMapping, defaultProps: cellDefaults } =
    useDayCellState(date);

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

export function DayCellTemplate(
  props: DayCellTemplateProps & { ref?: React.Ref<HTMLTableCellElement> },
) {
  const { date: dateProp, ...restProps } = props;
  const weekData = useContext(WeekDataContext);
  const { weeks } = useDatePicker();

  if (dateProp) {
    return <DayCellInstance {...restProps} date={dateProp} />;
  }

  const days = weekData ? weekData.days : weeks.flat();
  return (
    <>
      {days.map((day) => (
        <DayCellInstance key={day.toString()} {...restProps} date={day} />
      ))}
    </>
  );
}

function DayButtonInstance(
  props: Omit<DayButtonProps, "date"> & {
    date: import("@js-temporal/polyfill").Temporal.PlainDate;
    ref?: React.Ref<HTMLButtonElement>;
  },
) {
  const { ref, render, date, ...otherProps } = props;
  const { state, stateAttributesMapping, defaultProps, internalRef } =
    useDayButtonState(date);

  return useRender({
    defaultTagName: "button",
    render,
    ref: ref ? [ref, internalRef] : [internalRef],
    state,
    stateAttributesMapping,
    props: mergeProps<"button">(defaultProps, otherProps),
  });
}

export function DayButton(
  props: DayButtonProps & { ref?: React.Ref<HTMLButtonElement> },
) {
  const { date: dateProp, ...restProps } = props;
  const cellData = useContext(DayCellDataContext);

  const resolvedDate = dateProp ?? cellData?.date;

  if (resolvedDate) {
    return <DayButtonInstance {...restProps} date={resolvedDate} />;
  }

  throw new Error(
    "DayButton must be used inside DayCellTemplate or receive an explicit date prop.",
  );
}
