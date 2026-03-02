import { useContext, useMemo } from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { useDatePicker, WeekDataContext } from "./context";
import { computeWeekRangeInfo } from "./utils";
import type { ValueFormat, SelectedRangeState, SelectedRangeProps } from "./types";

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

  const state = useMemo<SelectedRangeState<F>>(
    () => ({
      root: rootState,
      active: info.active,
      startIndex: info.startIndex,
      endIndex: info.endIndex,
      extendsBefore: info.extendsBefore,
      extendsAfter: info.extendsAfter,
    }),
    [rootState, info],
  );

  const stateAttributesMapping = useMemo(
    () => ({
      root: () => null,
      active: () => null,
      startIndex: () => null,
      endIndex: () => null,
      extendsBefore: (v: boolean) => (v ? { "data-extends-before": "" } : null),
      extendsAfter: (v: boolean) => (v ? { "data-extends-after": "" } : null),
    }),
    [],
  );

  const defaultProps: Record<string, unknown> = info.active
    ? {
        role: "presentation",
        "aria-hidden": true,
        "data-testid": "selected-range",
        style: {
          gridColumn: `${info.startIndex + 1} / ${info.endIndex + 2}`,
          gridRow: 1,
        },
      }
    : {
        role: "presentation",
        "aria-hidden": true,
        hidden: true,
        style: { display: "none" },
      };

  return useRender({
    defaultTagName: "td",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping,
    props: mergeProps<"td">(defaultProps, otherProps),
  });
}
