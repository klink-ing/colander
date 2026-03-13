/**
 * Unstyled drag-and-drop components for date picker range handles.
 *
 * Provides `DragHandle` (unified start/end) and `DragDayButton` with all
 * functional DnD behavior. Styled versions can wrap these and pass className.
 */

import { useRef } from "react";
import {
  RangeStartDragHandle,
  RangeEndDragHandle,
  DayButton,
} from "base-ui-cal";
import type { DayButtonProps, ValueFormat } from "base-ui-cal";
import { useDragHandleDnD, useDayDropTarget } from "./use-drag-range";

export interface DragHandleProps {
  edge: "start" | "end";
  preventRangeReversal?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Internal drag handle. Wires up DnD, click-to-select, and hides when
 * inactive. Consumers should use `DragHandleStart` / `DragHandleEnd`.
 */
export function DragHandle({
  edge,
  preventRangeReversal,
  className,
  style,
}: DragHandleProps) {
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
      render={(renderProps, state) => (
        // biome-ignore lint/a11y/useKeyWithClickEvents: drag handle, not a button
        // biome-ignore lint/a11y/noStaticElementInteractions: drag handle hit area
        <span
          {...renderProps}
          tabIndex={-1}
          onClick={(e) => {
            if (didLeaveRef.current) {
              e.stopPropagation();
              requestAnimationFrame(() => {
                didLeaveRef.current = false;
              });
              return;
            }
            // let it bubble to button — button handles selection
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

/** Unstyled drag handle for the range start boundary. */
export function DragHandleStart(
  props: Omit<DragHandleProps, "edge">,
) {
  return <DragHandle edge="start" {...props} />;
}

/** Unstyled drag handle for the range end boundary. */
export function DragHandleEnd(
  props: Omit<DragHandleProps, "edge">,
) {
  return <DragHandle edge="end" {...props} />;
}

/** Day button wired up as a drop target for range drag handles. */
export function DragDayButton<F extends ValueFormat = ValueFormat>(
  props: DayButtonProps<F> & { ref?: React.Ref<HTMLButtonElement> },
) {
  const dropRef = useRef<HTMLButtonElement>(null);
  useDayDropTarget(dropRef, props.date);
  return <DayButton ref={dropRef} {...(props as DayButtonProps)} />;
}
