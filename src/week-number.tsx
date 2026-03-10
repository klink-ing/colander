import { useContext, useMemo } from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { StateAttributesMapping } from "node_modules/@base-ui/react/esm/utils/getStateAttributesProps";
import {
  useDatePickerStable,
  useDatePickerState,
  WeekDataContext,
} from "./context";
import { getISOWeekNumber } from "./utils";
import type {
  ValueFormat,
  WeekNumberCellState,
  WeekNumberCellProps,
  WeekNumberHeaderState,
  WeekNumberHeaderProps,
} from "./types";

const weekNumberCellStateAttributesMapping = {
  root: () => null,
  weekNumber: (v) => ({ "data-week-number": String(v) }),
} as const satisfies StateAttributesMapping<WeekNumberCellState>;

/**
 * Renders the ISO 8601 week number for a week row. Must be used inside
 * a {@link WeekTemplate}. Renders a `<td>` with `role="rowheader"`.
 */
export function WeekNumberCell<F extends ValueFormat = ValueFormat>(
  props: WeekNumberCellProps<F> & { ref?: React.Ref<HTMLTableCellElement> },
) {
  const { ref, render, ...otherProps } = props;
  const weekData = useContext(WeekDataContext);
  const { rootState } = useDatePickerState();
  const { temporal: T } = useDatePickerStable();

  const days = weekData?.days ?? [];

  // ISO week number is determined by the Thursday of the week
  const weekNumber = useMemo(() => {
    if (days.length === 0) return 0;
    // Find the Thursday in this week row — it determines the ISO week number
    let thursday = days[0];
    for (const d of days) {
      if (d.dayOfWeek === 4) {
        thursday = d;
        break;
      }
    }
    return getISOWeekNumber(thursday, T);
  }, [days, T]);

  const state = useMemo<WeekNumberCellState<F>>(
    () => ({
      root: rootState as unknown as WeekNumberCellState<F>["root"],
      weekNumber,
    }),
    [rootState, weekNumber],
  );

  const defaultProps: Record<string, unknown> = {
    role: "rowheader",
    "aria-label": `Week ${weekNumber}`,
    children: weekNumber,
  };

  return useRender({
    defaultTagName: "td",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping: weekNumberCellStateAttributesMapping,
    props: mergeProps<"td">(defaultProps, otherProps),
  });
}

const weekNumberHeaderStateAttributesMapping = {
  root: () => null,
} as const satisfies StateAttributesMapping<WeekNumberHeaderState>;

/**
 * Column header for the week number column. Renders a `<th scope="col">`.
 */
export function WeekNumberHeader<F extends ValueFormat = ValueFormat>(
  props: WeekNumberHeaderProps<F> & { ref?: React.Ref<HTMLTableCellElement> },
) {
  const { ref, render, ...otherProps } = props;
  const { rootState } = useDatePickerState();

  const state = useMemo<WeekNumberHeaderState<F>>(
    () => ({ root: rootState as unknown as WeekNumberHeaderState<F>["root"] }),
    [rootState],
  );

  const defaultProps: Record<string, unknown> = {
    scope: "col",
    "aria-label": "Week number",
    children: "#",
  };

  return useRender({
    defaultTagName: "th",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping: weekNumberHeaderStateAttributesMapping,
    props: mergeProps<"th">(defaultProps, otherProps),
  });
}
