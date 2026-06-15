import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { forwardRef, useContext, useMemo, useRef } from "react";
import { useCalendarStable, useCalendarState } from "./calendar-context";
import { DayCellDataContext, GridContext } from "./context";
import { useMonthViewState } from "./month-view-context";
import type { StateAttributesMapping } from "./types";
import type {
  DragHandleState,
  RangeStartDragHandleProps,
  RangeEndDragHandleProps,
  RangeDragHandleProps,
} from "./types";

const dragHandleStateAttributesMapping = {
  root: () => null,
  active: (v) => (v ? { "data-active": "" } : null),
  dragging: (v) => (v ? { "data-dragging": "" } : null),
  edge: (v) => ({ "data-edge": v }),
  orientation: (v) => ({ "data-orientation": v }),
} as const satisfies StateAttributesMapping<DragHandleState>;

function useDragHandle(
  edge: "start" | "end",
  { dragging: draggingProp }: { dragging?: boolean | undefined },
) {
  const {
    temporal: T,
    setHoveredDate,
    readOnly,
    disabled,
  } = useCalendarStable();
  const { rangeStart, rangeEnd } = useCalendarState();
  const { rootState } = useMonthViewState();
  const cellData = useContext(DayCellDataContext);
  const { orientation } = useContext(GridContext);
  const date = cellData?.date;
  const outsideDisabled = cellData?.outsideDisabled ?? false;

  const isActive =
    readOnly || disabled || outsideDisabled
      ? false
      : edge === "start"
        ? !!(date && rangeStart && T.PlainDate.compare(date, rangeStart) === 0)
        : !!(date && rangeEnd && T.PlainDate.compare(date, rangeEnd) === 0);

  const isDragging = !!draggingProp && isActive;
  const handleRef = useRef<HTMLSpanElement>(null);

  const state = useMemo<DragHandleState>(
    () => ({
      root: rootState,
      active: isActive,
      dragging: isDragging,
      edge,
      orientation,
    }),
    [rootState, isActive, isDragging, edge, orientation],
  );

  const defaultProps: Record<string, unknown> = {
    role: "slider",
    "aria-roledescription": "drag handle",
    "aria-label": edge === "start" ? "Range start date" : "Range end date",
    "aria-valuetext": date?.toString(),
    "aria-grabbed": isActive ? isDragging : undefined,
    "aria-hidden": isActive ? undefined : true,
    onPointerEnter: () => {
      if (date && !outsideDisabled) setHoveredDate(date);
    },
  };

  return {
    state,
    stateAttributesMapping: dragHandleStateAttributesMapping,
    defaultProps,
    handleRef,
  };
}

function RangeDragHandleFn(
  props: RangeDragHandleProps,
  ref: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, dragging, edge, ...otherProps } = props;
  const { state, stateAttributesMapping, defaultProps, handleRef } =
    useDragHandle(edge, { dragging });
  const { selectionMode } = useCalendarStable();
  const { rangeStart: rs, rangeEnd: re } = useCalendarState();
  const rangeIncomplete = !rs || !re;

  return useRender(
    selectionMode !== "range" || rangeIncomplete
      ? {}
      : {
          defaultTagName: "span",
          render,
          ref: ref ? [ref, handleRef] : [handleRef],
          state,
          stateAttributesMapping,
          props: mergeProps<"span">(defaultProps, otherProps),
        },
  );
}

/**
 * Drag handle (`<span>`) rendered at a range boundary. Exposes
 * `data-active`, `data-dragging`, and `data-edge` attributes.
 */
export const RangeDragHandle = forwardRef(RangeDragHandleFn) as (
  props: RangeDragHandleProps & React.RefAttributes<HTMLSpanElement>,
) => React.ReactElement | null;

function RangeStartDragHandleFn(
  props: RangeStartDragHandleProps,
  ref: React.ForwardedRef<HTMLSpanElement>,
) {
  return <RangeDragHandle edge="start" ref={ref} {...props} />;
}

/** Convenience wrapper for {@link RangeDragHandle} with `edge="start"`. */
export const RangeStartDragHandle = forwardRef(RangeStartDragHandleFn) as (
  props: RangeStartDragHandleProps & React.RefAttributes<HTMLSpanElement>,
) => React.ReactElement | null;

function RangeEndDragHandleFn(
  props: RangeEndDragHandleProps,
  ref: React.ForwardedRef<HTMLSpanElement>,
) {
  return <RangeDragHandle edge="end" ref={ref} {...props} />;
}

/** Convenience wrapper for {@link RangeDragHandle} with `edge="end"`. */
export const RangeEndDragHandle = forwardRef(RangeEndDragHandleFn) as (
  props: RangeEndDragHandleProps & React.RefAttributes<HTMLSpanElement>,
) => React.ReactElement | null;
