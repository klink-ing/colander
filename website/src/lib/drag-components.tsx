/**
 * Unstyled drag-and-drop components for date picker range handles.
 *
 * Provides `DragHandle` (unified start/end) and `DragDayButton` with all
 * functional DnD behavior. Styled versions can wrap these and pass className.
 */

import { RangeStartDragHandle, RangeEndDragHandle, DayButton } from "colander";
import type { DayButtonProps, ValueFormat } from "colander";
import { useRef } from "react";
import { useDragHandleDnD, useDayDropTarget } from "./use-drag-range";

export interface DragHandleProps {
  edge: "start" | "end";
  preventRangeReversal?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function DragHandle({ edge, preventRangeReversal, className, style }: DragHandleProps) {
  const handleRef = useRef<HTMLSpanElement>(null);
  const { dragging, anyHandleDragging, didLeaveRef } = useDragHandleDnD({
    edge,
    handleRef,
    preventRangeReversal,
  });

  const Handle = edge === "start" ? RangeStartDragHandle : RangeEndDragHandle;

  return (
    <Handle
      ref={handleRef}
      dragging={dragging}
      className={className}
      style={{
        touchAction: "none",
        cursor: dragging ? "grabbing" : "grab",
        pointerEvents: anyHandleDragging ? "none" : undefined,
        ...style,
      }}
      render={(renderProps: any, state: any) => (
        <span
          {...renderProps}
          tabIndex={-1}
          onClick={(e: React.MouseEvent) => {
            if (didLeaveRef.current) {
              e.stopPropagation();
              requestAnimationFrame(() => {
                didLeaveRef.current = false;
              });
              return;
            }
          }}
          style={{
            ...(renderProps.style as React.CSSProperties),
            display: state.active ? undefined : "none",
          }}
        />
      )}
    />
  );
}

export function DragHandleStart(props: Omit<DragHandleProps, "edge">) {
  return <DragHandle edge="start" {...props} />;
}

export function DragHandleEnd(props: Omit<DragHandleProps, "edge">) {
  return <DragHandle edge="end" {...props} />;
}

export function DragDayButton<F extends ValueFormat = ValueFormat>(
  props: DayButtonProps<F> & { ref?: React.Ref<HTMLButtonElement> },
) {
  const dropRef = useRef<HTMLButtonElement>(null);
  useDayDropTarget(dropRef, props.date);
  return <DayButton ref={dropRef} {...(props as DayButtonProps)} />;
}
