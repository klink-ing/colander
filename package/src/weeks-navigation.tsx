import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import React, { forwardRef, useMemo } from "react";
import { useCalendarStable } from "./calendar-context";
import { useMonthViewState } from "./month-view-context";
import { canShift } from "./overflow";
import type { RootState, StateAttributesMapping } from "./types";
import { useWeeksViewStable, useWeeksViewState } from "./weeks-view-context";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

/** State exposed by `PrevWeeksButton` and `NextWeeksButton`. */
export type WeeksNavButtonState = {
  root: RootState;
  direction: "prev" | "next";
  disabled: boolean;
};

/** Own props for weeks navigation buttons. */
export interface WeeksNavButtonOwnProps {
  /** Overrides weekCount as the shift amount. Must be a positive integer. */
  shiftBy?: number;
}

/** Full props for the `PrevWeeksButton` component. */
export type PrevWeeksButtonProps = useRender.ComponentProps<
  "button",
  WeeksNavButtonState
> &
  WeeksNavButtonOwnProps;

/** Full props for the `NextWeeksButton` component. */
export type NextWeeksButtonProps = useRender.ComponentProps<
  "button",
  WeeksNavButtonState
> &
  WeeksNavButtonOwnProps;

/** State exposed by `WeeksView.WeekCount`. */
export type WeekCountState = {
  root: RootState;
  weekCount: number;
};

/** Full props for the `WeeksView.WeekCount` component. */
export type WeekCountProps = useRender.ComponentProps<"span", WeekCountState>;

// ---------------------------------------------------------------------------
// State attribute mappings
// ---------------------------------------------------------------------------

const weeksNavButtonStateAttributesMapping = {
  root: () => null,
  direction: (v) => ({ "data-direction": v }),
  disabled: () => null,
} as const satisfies StateAttributesMapping<WeeksNavButtonState>;

const weekCountStateAttributesMapping = {
  root: () => null,
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
  const { weekCount, outOfRangeBehavior, goNext, goPrev } =
    useWeeksViewStable();
  const { windowInfo } = useWeeksViewState();
  const { rootState } = useMonthViewState();

  const currentFirstWeek = windowInfo.windowStart;

  const isDisabled = useMemo(() => {
    if (globalDisabled) return true;
    return !canShift({
      currentFirstWeek,
      weekCount,
      direction: direction === "next" ? 1 : -1,
      ...(shiftByProp !== undefined && { shiftBy: shiftByProp }),
      behavior: outOfRangeBehavior,
      ...(minValue !== undefined && { min: minValue }),
      ...(maxValue !== undefined && { max: maxValue }),
      weekStartDay,
      T,
    });
  }, [
    globalDisabled,
    currentFirstWeek,
    weekCount,
    direction,
    shiftByProp,
    outOfRangeBehavior,
    minValue,
    maxValue,
    weekStartDay,
    T,
  ]);

  const state = useMemo<WeeksNavButtonState>(
    () => ({ root: rootState, direction, disabled: isDisabled }),
    [rootState, direction, isDisabled],
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

function PrevWeeksButtonFn(
  props: PrevWeeksButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, shiftBy, ...otherProps } = props;
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

/**
 * Button that navigates to the previous week(s). Automatically disabled when
 * no more weeks are available based on `outOfRangeBehavior` and `min`.
 * Exposes `data-direction="prev"`.
 */
export const PrevWeeksButton = forwardRef(PrevWeeksButtonFn);

// ---------------------------------------------------------------------------
// NextWeeksButton
// ---------------------------------------------------------------------------

function NextWeeksButtonFn(
  props: NextWeeksButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, shiftBy, ...otherProps } = props;
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

/**
 * Button that navigates to the next week(s). Automatically disabled when
 * no more weeks are available based on `outOfRangeBehavior` and `max`.
 * Exposes `data-direction="next"`.
 */
export const NextWeeksButton = forwardRef(NextWeeksButtonFn);

// ---------------------------------------------------------------------------
// WeekCount
// ---------------------------------------------------------------------------

function WeekCountFn(
  props: WeekCountProps,
  ref: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, ...otherProps } = props;
  const { windowInfo } = useWeeksViewState();
  const { rootState } = useMonthViewState();
  const count = windowInfo.weekCount;

  const state = useMemo<WeekCountState>(
    () => ({ root: rootState, weekCount: count }),
    [rootState, count],
  );

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

/**
 * Renders the current visible week count as a number. Useful with shrink
 * overflow modes where the actual count may be less than the `weekCount` prop.
 */
export const WeekCount = forwardRef(WeekCountFn);
