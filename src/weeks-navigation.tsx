import { useMemo } from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { StateAttributesMapping } from "node_modules/@base-ui/react/esm/utils/getStateAttributesProps";
import { useCalendarStable } from "./calendar-context";
import { useWeeksViewStable, useWeeksViewState } from "./weeks-view-context";
import { canShift } from "./overflow";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

/** State exposed by `PrevWeeksButton` and `NextWeeksButton`. */
export type WeeksNavButtonState = {
  direction: "prev" | "next";
  disabled: boolean;
};

/** Own props for weeks navigation buttons. */
export interface WeeksNavButtonOwnProps {
  /** Overrides weekCount as the shift amount. Must be a positive integer. */
  shiftBy?: number;
}

/** Full props for the `PrevWeeksButton` component. */
export type PrevWeeksButtonProps =
  useRender.ComponentProps<"button", WeeksNavButtonState> &
    WeeksNavButtonOwnProps;

/** Full props for the `NextWeeksButton` component. */
export type NextWeeksButtonProps =
  useRender.ComponentProps<"button", WeeksNavButtonState> &
    WeeksNavButtonOwnProps;

/** State exposed by `WeeksView.WeekCount`. */
export type WeekCountState = {
  weekCount: number;
};

/** Full props for the `WeeksView.WeekCount` component. */
export type WeekCountProps = useRender.ComponentProps<"span", WeekCountState>;

// ---------------------------------------------------------------------------
// State attribute mappings
// ---------------------------------------------------------------------------

const weeksNavButtonStateAttributesMapping = {
  direction: (v) => ({ "data-direction": v }),
  disabled: () => null,
} as const satisfies StateAttributesMapping<WeeksNavButtonState>;

const weekCountStateAttributesMapping = {
  weekCount: () => null,
} as const satisfies StateAttributesMapping<WeekCountState>;

// ---------------------------------------------------------------------------
// Shared hook
// ---------------------------------------------------------------------------

function useWeeksNavButton(
  direction: "prev" | "next",
  shiftByProp: number | undefined,
) {
  const {
    disabled: globalDisabled,
    minValue,
    maxValue,
    temporal: T,
    weekStartDay,
  } = useCalendarStable();
  const { weekCount, overflowBehavior, goNext, goPrev } = useWeeksViewStable();
  const { windowInfo } = useWeeksViewState();

  const currentFirstWeek = windowInfo.windowStart;

  const isDisabled = useMemo(() => {
    if (globalDisabled) return true;
    return !canShift({
      currentFirstWeek,
      weekCount,
      direction: direction === "next" ? 1 : -1,
      shiftBy: shiftByProp,
      behavior: overflowBehavior,
      min: minValue,
      max: maxValue,
      weekStartDay,
      T,
    });
  }, [
    globalDisabled,
    currentFirstWeek,
    weekCount,
    direction,
    shiftByProp,
    overflowBehavior,
    minValue,
    maxValue,
    weekStartDay,
    T,
  ]);

  const state = useMemo<WeeksNavButtonState>(
    () => ({ direction, disabled: isDisabled }),
    [direction, isDisabled],
  );

  const goFn = direction === "prev" ? goPrev : goNext;

  const defaultProps: Record<string, unknown> = {
    type: "button",
    "aria-label": `Go to ${direction === "prev" ? "previous" : "next"} weeks`,
    disabled: isDisabled,
    onClick: isDisabled ? undefined : () => goFn(shiftByProp),
  };

  return { state, defaultProps };
}

// ---------------------------------------------------------------------------
// PrevWeeksButton
// ---------------------------------------------------------------------------

/**
 * Button that navigates to the previous week(s). Automatically disabled when
 * no more weeks are available based on `overflowBehavior` and `min`.
 * Exposes `data-direction="prev"`.
 */
export function PrevWeeksButton(
  props: PrevWeeksButtonProps & { ref?: React.Ref<HTMLButtonElement> },
) {
  const { ref, render, shiftBy, ...otherProps } = props;
  const { state, defaultProps } = useWeeksNavButton("prev", shiftBy);

  return useRender({
    defaultTagName: "button",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping: weeksNavButtonStateAttributesMapping,
    props: mergeProps<"button">(defaultProps, otherProps),
  });
}

// ---------------------------------------------------------------------------
// NextWeeksButton
// ---------------------------------------------------------------------------

/**
 * Button that navigates to the next week(s). Automatically disabled when
 * no more weeks are available based on `overflowBehavior` and `max`.
 * Exposes `data-direction="next"`.
 */
export function NextWeeksButton(
  props: NextWeeksButtonProps & { ref?: React.Ref<HTMLButtonElement> },
) {
  const { ref, render, shiftBy, ...otherProps } = props;
  const { state, defaultProps } = useWeeksNavButton("next", shiftBy);

  return useRender({
    defaultTagName: "button",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping: weeksNavButtonStateAttributesMapping,
    props: mergeProps<"button">(defaultProps, otherProps),
  });
}

// ---------------------------------------------------------------------------
// WeekCount
// ---------------------------------------------------------------------------

/**
 * Renders the current visible week count as a number. Useful with shrink
 * overflow modes where the actual count may be less than the `weekCount` prop.
 */
export function WeekCount(
  props: WeekCountProps & { ref?: React.Ref<HTMLSpanElement> },
) {
  const { ref, render, ...otherProps } = props;
  const { windowInfo } = useWeeksViewState();
  const count = windowInfo.weekCount;

  const state = useMemo<WeekCountState>(() => ({ weekCount: count }), [count]);

  const defaultProps: Record<string, unknown> = {
    children: count,
  };

  return useRender({
    defaultTagName: "span",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping: weekCountStateAttributesMapping,
    props: mergeProps<"span">(defaultProps, otherProps),
  });
}
