import { useContext, useMemo } from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { useDatePicker, WeekDataContext, DayCellDataContext } from "./context";
import { useDaysGridKeyboard, useDayCellState, useDayButtonState } from "./hooks";
import { DaysGridHeader, DaysGridHeaderCellTemplate } from "./labels";
import type {
  DaysGridState,
  DaysGridProps,
  WeekTemplateState,
  WeekTemplateProps,
  DayCellTemplateProps,
  DayButtonTemplateProps,
} from "./types";

export function DaysGrid(
  props: DaysGridProps & { ref?: React.Ref<HTMLTableElement> },
) {
  const { ref, render, mode: _mode, children, ...otherProps } = props;
  const { currentDateTime, gridLabelId } = useDatePicker();
  const handleKeyDown = useDaysGridKeyboard();

  const state = useMemo<DaysGridState>(
    () => ({ month: currentDateTime.month, year: currentDateTime.year }),
    [currentDateTime.month, currentDateTime.year],
  );

  const defaultProps: Record<string, unknown> = {
    role: "grid",
    "aria-labelledby": gridLabelId || undefined,
    "aria-label": gridLabelId ? undefined : "Calendar",
    onKeyDown: handleKeyDown,
    children: children ?? (
      <>
        <DaysGridHeader>
          <DaysGridHeaderCellTemplate />
        </DaysGridHeader>
        <tbody>
          <WeekTemplate>
            <DayCellTemplate>
              <DayButtonTemplate />
            </DayCellTemplate>
          </WeekTemplate>
        </tbody>
      </>
    ),
  };

  return useRender({
    defaultTagName: "table",
    render,
    ref: ref ? [ref] : [],
    state,
    props: mergeProps<"table">(defaultProps, otherProps),
  });
}

function WeekInstance(
  props: WeekTemplateProps & { ref?: React.Ref<HTMLTableRowElement> },
) {
  const { ref, render, ...otherProps } = props;
  const weekData = useContext(WeekDataContext)!;

  const state = useMemo<WeekTemplateState>(
    () => ({ weekIndex: weekData.weekIndex }),
    [weekData.weekIndex],
  );

  const stateAttributesMapping = useMemo(
    () => ({
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
    children: children ?? <DayButtonTemplate />,
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
  props: Omit<DayButtonTemplateProps, "date"> & {
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

export function DayButtonTemplate(
  props: DayButtonTemplateProps & { ref?: React.Ref<HTMLButtonElement> },
) {
  const { date: dateProp, ...restProps } = props;
  const cellData = useContext(DayCellDataContext);

  const resolvedDate = dateProp ?? cellData?.date;

  if (resolvedDate) {
    return <DayButtonInstance {...restProps} date={resolvedDate} />;
  }

  throw new Error(
    "DayButtonTemplate must be used inside DayCellTemplate or receive an explicit date prop.",
  );
}
