import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { useContext, useMemo } from "react";
import { useCalendarStable, useCalendarState } from "./calendar-context";
import { WeekDataContext, GridContext } from "./context";
import { useMonthViewState } from "./month-view-context";
import { MonthViewStableContext } from "./month-view-context";
import {
  computeClippedRangeInfo,
  rangeOverlayStateAttributesMapping,
} from "./selected-range";
import type {
  ValueFormat,
  RangePreviewState,
  RangePreviewProps,
} from "./types";

/**
 * Visual overlay (`<td role="presentation">`) that highlights the hover
 * preview range within a single week row. Structurally identical to
 * {@link RangeSelected} but reads `previewStart`/`previewEnd` instead of
 * the committed range boundaries.
 */
export function RangePreview<F extends ValueFormat = ValueFormat>(
  props: RangePreviewProps<F> & { ref?: React.Ref<HTMLTableCellElement> },
) {
  const { ref, render, ...otherProps } = props;
  const weekData = useContext(WeekDataContext);
  const { orientation } = useContext(GridContext);
  const { temporal: T } = useCalendarStable();
  const { previewStart, previewEnd } = useCalendarState();
  const monthStable = useContext(MonthViewStableContext);
  const { rootState } = useMonthViewState();
  const outsideDays = monthStable?.outsideDays ?? "enabled";

  const days = weekData?.days ?? [];
  const gridMonth = weekData?.gridMonth;

  const info = useMemo(
    () =>
      computeClippedRangeInfo(
        days,
        previewStart,
        previewEnd,
        T,
        outsideDays,
        gridMonth,
      ),
    [days, previewStart, previewEnd, T, outsideDays, gridMonth],
  );

  const startDate = info.active ? days[info.startIndex].toString() : "";
  const endDate = info.active ? days[info.endIndex].toString() : "";

  const weekIndex = weekData?.weekIndex ?? 0;

  const state = useMemo<RangePreviewState<F>>(
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
      hasStart: previewStart !== undefined,
      hasEnd: previewEnd !== undefined,
      orientation,
    }),
    [
      rootState,
      info,
      weekIndex,
      startDate,
      endDate,
      previewStart,
      previewEnd,
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
