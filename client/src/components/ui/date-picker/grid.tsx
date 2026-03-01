import { useContext, useMemo } from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { useDatePicker, WeekDataContext } from "./context";
import { useDaysGridKeyboard, useDayTemplateState } from "./hooks";
import { DayLabels, DayLabel } from "./labels";
import type {
  DaysGridState,
  DaysGridProps,
  WeekTemplateState,
  WeekTemplateProps,
  DayTemplateProps,
} from "./types";

export function DaysGrid(
  props: DaysGridProps & { ref?: React.Ref<HTMLDivElement> },
) {
  const { ref, render, mode: _mode, children, ...otherProps } = props;
  const { currentDateTime } = useDatePicker();
  const handleKeyDown = useDaysGridKeyboard();

  const state = useMemo<DaysGridState>(
    () => ({ month: currentDateTime.month, year: currentDateTime.year }),
    [currentDateTime.month, currentDateTime.year],
  );

  const defaultProps: Record<string, unknown> = {
    role: "grid",
    "aria-label": "Calendar",
    onKeyDown: handleKeyDown,
    children: children ?? (
      <>
        <DayLabels>
          <DayLabel />
        </DayLabels>
        <WeekTemplate>
          <DayTemplate />
        </WeekTemplate>
      </>
    ),
  };

  return useRender({
    defaultTagName: "div",
    render,
    ref: ref ? [ref] : [],
    state,
    props: mergeProps<"div">(defaultProps, otherProps),
  });
}

function WeekInstance(
  props: WeekTemplateProps & { ref?: React.Ref<HTMLDivElement> },
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

  const defaultProps: Record<string, unknown> = {
    role: "row",
  };

  return useRender({
    defaultTagName: "div",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping,
    props: mergeProps<"div">(defaultProps, otherProps),
  });
}

export function WeekTemplate(
  props: WeekTemplateProps & { ref?: React.Ref<HTMLDivElement> },
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
  const { state, stateAttributesMapping, defaultProps, internalRef } =
    useDayTemplateState(date);

  return useRender({
    defaultTagName: "button",
    render,
    ref: ref ? [ref, internalRef] : [internalRef],
    state,
    stateAttributesMapping,
    props: mergeProps<"button">(defaultProps, otherProps),
  });
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
