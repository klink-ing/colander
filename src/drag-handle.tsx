import { useContext, useMemo, useRef } from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { StateAttributesMapping } from "node_modules/@base-ui/react/esm/utils/getStateAttributesProps";
import { useDatePicker, DayCellDataContext, GridContext } from "./context";
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
  const { rangeStart, rangeEnd, temporal: T, rootState } = useDatePicker<F>();
  const cellData = useContext(DayCellDataContext);
  const { orientation } = useContext(GridContext);
  const date = cellData?.date;
  const outsideDisabled = cellData?.outsideDisabled ?? false;

  const isActive = outsideDisabled
    ? false
    : edge === "start"
      ? !!(date && rangeStart && T.PlainDate.compare(date, rangeStart) === 0)
      : !!(date && rangeEnd && T.PlainDate.compare(date, rangeEnd) === 0);

  const isDragging = (draggingProp ?? false) && isActive;

  const handleRef = useRef<HTMLSpanElement>(null);

  const state = useMemo<DragHandleState<F>>(
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
    "data-testid": `drag-handle-${edge}`,
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
  const { selectionMode } = useDatePicker();

  return useRender(
    selectionMode !== "range"
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
