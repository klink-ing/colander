import { useContext, useMemo } from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { useDatePicker, WeekDataContext } from "./context";
import { useDaysGridKeyboard, useDayTemplateState } from "./hooks";
import { DayLabels, DayLabelTemplate } from "./labels";
import type {
  DaysGridState,
  DaysGridProps,
  WeekTemplateState,
  WeekTemplateProps,
  DayTemplateProps,
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
        <DayLabels>
          <DayLabelTemplate />
        </DayLabels>
        <tbody>
          <WeekTemplate>
            <DayTemplate />
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

function DayInstance(
  props: Omit<DayTemplateProps, "date"> & {
    date: import("@js-temporal/polyfill").Temporal.PlainDate;
    ref?: React.Ref<HTMLButtonElement>;
  },
) {
  const { ref, render, date, ...otherProps } = props;
  const { state, stateAttributesMapping, defaultProps, cellProps, internalRef } =
    useDayTemplateState(date);

  const button = useRender({
    defaultTagName: "button",
    render,
    ref: ref ? [ref, internalRef] : [internalRef],
    state,
    stateAttributesMapping,
    props: mergeProps<"button">(defaultProps, otherProps),
  });

  return <td {...cellProps}>{button}</td>;
}

export function DayTemplate(
  props: DayTemplateProps & { ref?: React.Ref<HTMLButtonElement> },
) {
  const { date: dateProp, ...restProps } = props;
  const weekData = useContext(WeekDataContext);
  const { weeks } = useDatePicker();

  if (dateProp) {
    return <DayInstance {...restProps} date={dateProp} />;
  }

  const days = weekData ? weekData.days : weeks.flat();
  return (
    <>
      {days.map((day) => (
        <DayInstance key={day.toString()} {...restProps} date={day} />
      ))}
    </>
  );
}
