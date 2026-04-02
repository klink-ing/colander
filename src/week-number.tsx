import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { forwardRef, useContext, useMemo } from "react";
import { useCalendarStable } from "./calendar-context";
import { WeekDataContext } from "./context";
import { useMonthViewState } from "./month-view-context";
import type { StateAttributesMapping } from "./types";
import type {
  ValueFormat,
  WeekNumberCellState,
  WeekNumberCellProps,
  WeekNumberHeaderState,
  WeekNumberHeaderProps,
} from "./types";
import { getISOWeekNumber } from "./utils";

const weekNumberCellStateAttributesMapping = {
  root: () => null,
  weekNumber: (v) => ({ "data-week-number": String(v) }),
} as const satisfies StateAttributesMapping<WeekNumberCellState>;

/**
 * Renders the ISO 8601 week number for a week row. Must be used inside
 * a {@link WeekTemplate}. Renders a `<td>` with `role="rowheader"`.
 */
export const WeekNumberCell = forwardRef<
  HTMLTableCellElement,
  WeekNumberCellProps
>(function WeekNumberCell(props, ref) {
  const { render, ...otherProps } = props;
  const weekData = useContext(WeekDataContext);
  const { rootState } = useMonthViewState();
  const { temporal: T } = useCalendarStable();

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

  const state = useMemo<WeekNumberCellState>(
    () => ({
      root: rootState as unknown as WeekNumberCellState["root"],
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
}) as <F extends ValueFormat = ValueFormat>(
  props: WeekNumberCellProps<F> & React.RefAttributes<HTMLTableCellElement>,
) => React.ReactElement | null;

const weekNumberHeaderStateAttributesMapping = {
  root: () => null,
} as const satisfies StateAttributesMapping<WeekNumberHeaderState>;

/**
 * Column header for the week number column. Renders a `<th scope="col">`.
 */
export const WeekNumberHeader = forwardRef<
  HTMLTableCellElement,
  WeekNumberHeaderProps
>(function WeekNumberHeader(props, ref) {
  const { render, ...otherProps } = props;
  const { rootState } = useMonthViewState();

  const state = useMemo<WeekNumberHeaderState>(
    () => ({ root: rootState as unknown as WeekNumberHeaderState["root"] }),
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
}) as <F extends ValueFormat = ValueFormat>(
  props: WeekNumberHeaderProps<F> & React.RefAttributes<HTMLTableCellElement>,
) => React.ReactElement | null;
