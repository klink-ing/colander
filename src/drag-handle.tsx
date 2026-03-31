import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { StateAttributesMapping } from "node_modules/@base-ui/react/esm/utils/getStateAttributesProps";
import { useContext, useMemo, useRef } from "react";
import { useCalendarStable, useCalendarState } from "./calendar-context";
import { DayCellDataContext, GridContext } from "./context";
import { useMonthViewState } from "./month-view-context";
import type {
  ValueFormat,
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

function useDragHandle<F extends ValueFormat = ValueFormat>(
  edge: "start" | "end",
  { dragging: draggingProp }: { dragging?: boolean },
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

  const isDragging = (draggingProp ?? false) && isActive;

  const handleRef = useRef<HTMLSpanElement>(null);

  const state = useMemo<DragHandleState<F>>(
    () => ({
      root: rootState as any,
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
    "data-testid": `drag-handle-${edge}`,
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

/**
 * Drag handle (`<span>`) rendered at a range boundary. Exposes
 * `data-active`, `data-dragging`, and `data-edge` attributes.
 */
export function RangeDragHandle<F extends ValueFormat = ValueFormat>(
  props: RangeDragHandleProps<F> & { ref?: React.Ref<HTMLSpanElement> },
) {
  const { ref, render, dragging, edge, ...otherProps } = props;
  const { state, stateAttributesMapping, defaultProps, handleRef } =
    useDragHandle<F>(edge, { dragging });
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

/** Convenience wrapper for {@link RangeDragHandle} with `edge="start"`. */
export function RangeStartDragHandle<F extends ValueFormat = ValueFormat>(
  props: RangeStartDragHandleProps<F> & { ref?: React.Ref<HTMLSpanElement> },
) {
  return <RangeDragHandle edge="start" {...props} />;
}

/** Convenience wrapper for {@link RangeDragHandle} with `edge="end"`. */
export function RangeEndDragHandle<F extends ValueFormat = ValueFormat>(
  props: RangeEndDragHandleProps<F> & { ref?: React.Ref<HTMLSpanElement> },
) {
  return <RangeDragHandle edge="end" {...props} />;
}
