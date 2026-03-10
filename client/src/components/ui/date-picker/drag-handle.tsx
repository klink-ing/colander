import { useContext, useMemo, useRef } from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { useDatePicker, DayCellDataContext } from "./context";
import type {
  ValueFormat,
  DragHandleState,
  RangeStartDragHandleProps,
  RangeEndDragHandleProps,
} from "./types";

const dragHandleStateAttributesMapping = {
  root: () => null,
  active: (v: boolean) => (v ? { "data-active": "" } : null),
  dragging: (v: boolean) => (v ? { "data-dragging": "" } : null),
  edge: (v: string) => ({ "data-edge": v }),
};

function useDragHandle<F extends ValueFormat = ValueFormat>(
  edge: "start" | "end",
  { dragging: draggingProp }: { dragging?: boolean },
) {
  const { rangeStart, rangeEnd, temporal: T, rootState } = useDatePicker<F>();
  const cellData = useContext(DayCellDataContext);
  const date = cellData?.date;

  const isActive =
    edge === "start"
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
    }),
    [rootState, isActive, isDragging, edge],
  );

  const defaultProps: Record<string, unknown> = {
    "data-testid": `drag-handle-${edge}`,
  };

  return {
    state,
    stateAttributesMapping: dragHandleStateAttributesMapping,
    defaultProps,
    handleRef,
  };
}

export function RangeStartDragHandle<F extends ValueFormat = ValueFormat>(
  props: RangeStartDragHandleProps<F> & { ref?: React.Ref<HTMLSpanElement> },
) {
  const { ref, render, dragging, ...otherProps } = props;
  const { state, stateAttributesMapping, defaultProps, handleRef } =
    useDragHandle<F>("start", { dragging });

  return useRender({
    defaultTagName: "span",
    render,
    ref: ref ? [ref, handleRef] : [handleRef],
    state,
    stateAttributesMapping,
    props: mergeProps<"span">(defaultProps, otherProps),
  });
}

export function RangeEndDragHandle<F extends ValueFormat = ValueFormat>(
  props: RangeEndDragHandleProps<F> & { ref?: React.Ref<HTMLSpanElement> },
) {
  const { ref, render, dragging, ...otherProps } = props;
  const { state, stateAttributesMapping, defaultProps, handleRef } =
    useDragHandle<F>("end", { dragging });

  return useRender({
    defaultTagName: "span",
    render,
    ref: ref ? [ref, handleRef] : [handleRef],
    state,
    stateAttributesMapping,
    props: mergeProps<"span">(defaultProps, otherProps),
  });
}
