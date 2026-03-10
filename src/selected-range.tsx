import { useContext, useMemo } from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { StateAttributesMapping } from "node_modules/@base-ui/react/esm/utils/getStateAttributesProps";
import { useDatePicker, WeekDataContext, GridContext } from "./context";
import { computeWeekRangeInfo } from "./utils";
import type {
  ValueFormat,
  SelectedRangeState,
  SelectedRangeProps,
} from "./types";

const selectedRangeStateAttributesMapping = {
  root: () => null,
  active: (v) => (v ? { "data-active": "" } : null),
  weekIndex: (v) => ({ "data-week-index": String(v) }),
  startIndex: (v) => ({ "data-start-index": String(v) }),
  endIndex: (v) => ({ "data-end-index": String(v) }),
  startDate: (v) => (v ? { "data-start-date": v } : null),
  endDate: (v) => (v ? { "data-end-date": v } : null),
  extendsBefore: (v) => (v ? { "data-extends-before": "" } : null),
  extendsAfter: (v) => (v ? { "data-extends-after": "" } : null),
  orientation: (v) => ({ "data-orientation": v }),
} as const satisfies StateAttributesMapping<SelectedRangeState>;

/**
 * Visual overlay (`<td role="presentation">`) that highlights the selected
 * date range within a single week row. Exposes data-attributes for
 * `active`, `week-index`, `start-index`, `end-index`, `start-date`,
 * `end-date`, `extends-before`, and `extends-after`.
 */
export function SelectedRange<F extends ValueFormat = ValueFormat>(
  props: SelectedRangeProps<F> & { ref?: React.Ref<HTMLTableCellElement> },
) {
  const { ref, render, ...otherProps } = props;
  const weekData = useContext(WeekDataContext);
  const { orientation } = useContext(GridContext);
  const { rangeStart, rangeEnd, temporal: T, rootState } = useDatePicker<F>();

  const days = weekData?.days ?? [];

  const info = useMemo(
    () => computeWeekRangeInfo(days, rangeStart, rangeEnd, T),
    [days, rangeStart, rangeEnd, T],
  );

  const startDate = info.active ? days[info.startIndex].toString() : "";
  const endDate = info.active ? days[info.endIndex].toString() : "";

  const weekIndex = weekData?.weekIndex ?? 0;

  const state = useMemo<SelectedRangeState<F>>(
    () => ({
      root: rootState,
      active: info.active,
      weekIndex,
      startIndex: info.startIndex,
      endIndex: info.endIndex,
      startDate,
      endDate,
      extendsBefore: info.extendsBefore,
      extendsAfter: info.extendsAfter,
      orientation,
    }),
    [rootState, info, weekIndex, startDate, endDate, orientation],
  );

  const defaultProps: Record<string, unknown> = {
    role: "presentation",
    "aria-hidden": true,
  };

  return useRender({
    defaultTagName: "td",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping: selectedRangeStateAttributesMapping,
    props: mergeProps<"td">(defaultProps, otherProps),
  });
}
