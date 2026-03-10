import { useContext, useMemo } from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { useDatePicker, WeekDataContext } from "./context";
import { computeWeekRangeInfo } from "./utils";
import type {
  ValueFormat,
  SelectedRangeState,
  SelectedRangeProps,
} from "./types";

const selectedRangeStateAttributesMapping = {
  root: () => null,
  active: (v: boolean) => (v ? { "data-active": "" } : null),
  weekIndex: (v: number) => ({ "data-week-index": String(v) }),
  startIndex: (v: number) => ({ "data-start-index": String(v) }),
  endIndex: (v: number) => ({ "data-end-index": String(v) }),
  startDate: (v: string) => (v ? { "data-start-date": v } : null),
  endDate: (v: string) => (v ? { "data-end-date": v } : null),
  extendsBefore: (v: boolean) => (v ? { "data-extends-before": "" } : null),
  extendsAfter: (v: boolean) => (v ? { "data-extends-after": "" } : null),
};

export function SelectedRange<F extends ValueFormat = ValueFormat>(
  props: SelectedRangeProps<F> & { ref?: React.Ref<HTMLTableCellElement> },
) {
  const { ref, render, ...otherProps } = props;
  const weekData = useContext(WeekDataContext);
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
    }),
    [rootState, info, weekIndex, startDate, endDate],
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
