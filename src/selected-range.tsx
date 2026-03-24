import { useContext, useMemo } from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { StateAttributesMapping } from "node_modules/@base-ui/react/esm/utils/getStateAttributesProps";
import { useCalendarStable, useCalendarState } from "./calendar-context";
import { useMonthViewState } from "./month-view-context";
import { MonthViewStableContext } from "./month-view-context";
import { WeekDataContext, GridContext } from "./context";
import { computeWeekRangeInfo } from "./utils";
import type { Temporal } from "@js-temporal/polyfill";
import type {
  ValueFormat,
  RangeSelectedState,
  RangeSelectedProps,
  OutsideDays,
  TemporalNamespace,
} from "./types";

export const rangeOverlayStateAttributesMapping = {
  root: () => null,
  active: (v) => (v ? { "data-active": "" } : null),
  weekIndex: (v) => ({ "data-week-index": String(v) }),
  startIndex: (v) => ({ "data-start-index": String(v) }),
  endIndex: (v) => ({ "data-end-index": String(v) }),
  startDate: (v) => (v ? { "data-start-date": v } : null),
  endDate: (v) => (v ? { "data-end-date": v } : null),
  extendsBefore: (v) => (v ? { "data-extends-before": "" } : null),
  extendsAfter: (v) => (v ? { "data-extends-after": "" } : null),
  hasStart: (v) => (v ? { "data-has-start": "" } : null),
  hasEnd: (v) => (v ? { "data-has-end": "" } : null),
  orientation: (v) => ({ "data-orientation": v }),
} as const satisfies StateAttributesMapping<RangeSelectedState>;

type RangeInfo = {
  active: boolean;
  startIndex: number;
  endIndex: number;
  extendsBefore: boolean;
  extendsAfter: boolean;
};

export function computeClippedRangeInfo(
  days: Temporal.PlainDate[],
  rangeStart: Temporal.PlainDate | undefined,
  rangeEnd: Temporal.PlainDate | undefined,
  T: TemporalNamespace,
  outsideDays: OutsideDays,
  gridMonth: { year: number; month: number } | undefined,
): RangeInfo {
  const raw = computeWeekRangeInfo(days, rangeStart, rangeEnd, T);
  if (
    (outsideDays === "disabled" || outsideDays === "hidden") &&
    raw.active &&
    gridMonth
  ) {
    let { startIndex, endIndex, extendsBefore, extendsAfter } = raw;
    // Clip range to only in-month cells
    while (
      startIndex <= endIndex &&
      (days[startIndex].year !== gridMonth.year ||
        days[startIndex].month !== gridMonth.month)
    ) {
      startIndex++;
      extendsBefore = true;
    }
    while (
      endIndex >= startIndex &&
      (days[endIndex].year !== gridMonth.year ||
        days[endIndex].month !== gridMonth.month)
    ) {
      endIndex--;
      extendsAfter = true;
    }
    if (startIndex > endIndex) {
      return {
        active: false,
        startIndex: 0,
        endIndex: 0,
        extendsBefore: false,
        extendsAfter: false,
      };
    }
    return { active: true, startIndex, endIndex, extendsBefore, extendsAfter };
  }
  return raw;
}

/**
 * Visual overlay (`<td role="presentation">`) that highlights the selected
 * date range within a single week row. Exposes data-attributes for
 * `active`, `week-index`, `start-index`, `end-index`, `start-date`,
 * `end-date`, `extends-before`, and `extends-after`.
 */
export function RangeSelected<F extends ValueFormat = ValueFormat>(
  props: RangeSelectedProps<F> & { ref?: React.Ref<HTMLTableCellElement> },
) {
  const { ref, render, ...otherProps } = props;
  const weekData = useContext(WeekDataContext);
  const { orientation } = useContext(GridContext);
  const { temporal: T } = useCalendarStable();
  const { rangeStart, rangeEnd } = useCalendarState();
  const monthStable = useContext(MonthViewStableContext);
  const { rootState } = useMonthViewState();
  const outsideDays = monthStable?.outsideDays ?? "enabled";

  const days = weekData?.days ?? [];
  const gridMonth = weekData?.gridMonth;

  const info = useMemo(
    () =>
      computeClippedRangeInfo(
        days,
        rangeStart,
        rangeEnd,
        T,
        outsideDays,
        gridMonth,
      ),
    [days, rangeStart, rangeEnd, T, outsideDays, gridMonth],
  );

  const startDate = info.active ? days[info.startIndex].toString() : "";
  const endDate = info.active ? days[info.endIndex].toString() : "";

  const weekIndex = weekData?.weekIndex ?? 0;

  const state = useMemo<RangeSelectedState<F>>(
    () => ({
      root: rootState as any,
      active: info.active,
      weekIndex,
      startIndex: info.startIndex,
      endIndex: info.endIndex,
      startDate,
      endDate,
      extendsBefore: info.extendsBefore,
      extendsAfter: info.extendsAfter,
      hasStart: rangeStart !== undefined,
      hasEnd: rangeEnd !== undefined,
      orientation,
    }),
    [
      rootState,
      info,
      weekIndex,
      startDate,
      endDate,
      rangeStart,
      rangeEnd,
      orientation,
    ],
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
    stateAttributesMapping: rangeOverlayStateAttributesMapping,
    props: mergeProps<"td">(defaultProps, otherProps),
  });
}
