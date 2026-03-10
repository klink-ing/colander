import { useContext, useMemo, useRef, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { disableNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useDatePicker, DayCellDataContext } from "./context";
import type {
  ValueFormat,
  DragHandleState,
  RangeStartDragHandleProps,
  RangeEndDragHandleProps,
  TemporalNamespace,
} from "./types";
import type { Temporal } from "@js-temporal/polyfill";

function useDragHandle<F extends ValueFormat = ValueFormat>(edge: "start" | "end") {
  const { rangeStart, rangeEnd, setRange, temporal: T, rootState } = useDatePicker<F>();
  const cellData = useContext(DayCellDataContext);
  const date = cellData?.date;

  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);

  const isActive =
    edge === "start"
      ? !!(date && rangeStart && T.PlainDate.compare(date, rangeStart) === 0)
      : !!(date && rangeEnd && T.PlainDate.compare(date, rangeEnd) === 0);

  const isDragging = dragging && isActive;

  const handleRef = useRef<HTMLSpanElement>(null);
  const vtRef = useRef<ViewTransition | null>(null);
  const rangeRef = useRef({ start: rangeStart, end: rangeEnd });
  rangeRef.current = { start: rangeStart, end: rangeEnd };

  const TRef = useRef<TemporalNamespace>(T);
  TRef.current = T;

  const setRangeRef = useRef(setRange);
  setRangeRef.current = setRange;

  const edgeRef = useRef(edge);
  edgeRef.current = edge;

  // Register the drag handle as a draggable element
  useEffect(() => {
    const el = handleRef.current;
    if (!el || !isActive) return;
    const cleanup = draggable({
      element: el,
      getInitialData: () => ({ type: "date-range-handle", edge }),
      onGenerateDragPreview: ({ nativeSetDragImage }) => {
        disableNativeDragPreview({ nativeSetDragImage });
      },
      onDragStart: () => {
        draggingRef.current = true;
        setDragging(true);
        document.body.style.cursor = "grabbing";
      },
      onDrop: () => {
        draggingRef.current = false;
        setDragging(false);
        document.body.style.cursor = "";
      },
    });
    return () => {
      cleanup();
      // If the draggable tears down mid-drag (because isActive went false),
      // reset cursor since onDrop won't fire on this instance
      if (draggingRef.current) {
        document.body.style.cursor = "";
      }
    };
  }, [isActive, edge]);

  // Monitor drag events to update the range
  useEffect(() => {
    if (!dragging) return;
    return monitorForElements({
      canMonitor: ({ source }) =>
        source.data.type === "date-range-handle" && source.data.edge === edgeRef.current,
      onDrag: ({ location }) => {
        const dropTarget = location.current.dropTargets[0];
        if (!dropTarget) return;
        applyDropTarget(dropTarget.data.date as string);
      },
      onDropTargetChange: ({ location }) => {
        const dropTarget = location.current.dropTargets[0];
        if (!dropTarget) return;
        applyDropTarget(dropTarget.data.date as string);
      },
      onDrop: () => {
        // Handles cleanup when the original draggable was torn down
        // (draggable.onDrop won't fire if the element was unmounted)
        draggingRef.current = false;
        setDragging(false);
        document.body.style.cursor = "";
      },
    });

    function applyDropTarget(dateStr: string) {
      const { start, end } = rangeRef.current;
      if (!start || !end) return;

      const Tp = TRef.current;
      let target: Temporal.PlainDate;
      try {
        target = Tp.PlainDate.from(dateStr);
      } catch {
        return;
      }

      let newStart: Temporal.PlainDate;
      let newEnd: Temporal.PlainDate;

      if (edgeRef.current === "start") {
        if (Tp.PlainDate.compare(target, end) <= 0) {
          newStart = target;
          newEnd = end;
        } else {
          newStart = end;
          newEnd = end;
        }
      } else {
        if (Tp.PlainDate.compare(target, start) >= 0) {
          newStart = start;
          newEnd = target;
        } else {
          newStart = start;
          newEnd = start;
        }
      }

      if (
        Tp.PlainDate.compare(newStart, start) !== 0 ||
        Tp.PlainDate.compare(newEnd, end) !== 0
      ) {
        const update = () => setRangeRef.current(newStart, newEnd);
        if (document.startViewTransition && !vtRef.current) {
          const vt = document.startViewTransition(() => {
            flushSync(update);
          });
          vtRef.current = vt;
          vt.finished.then(() => { vtRef.current = null; }).catch(() => { vtRef.current = null; });
        } else {
          update();
        }
      }
    }
  }, [dragging]);

  const state = useMemo<DragHandleState<F>>(
    () => ({
      root: rootState,
      active: isActive,
      dragging: isDragging,
      edge,
    }),
    [rootState, isActive, isDragging, edge],
  );

  const stateAttributesMapping = useMemo(
    () => ({
      root: () => null,
      active: (v: boolean) => (v ? { "data-active": "" } : null),
      dragging: (v: boolean) => (v ? { "data-dragging": "" } : null),
      edge: (v: string) => ({ "data-edge": v }),
    }),
    [],
  );

  const visible = isActive;

  const defaultProps: Record<string, unknown> = {
    "data-testid": `drag-handle-${edge}`,
    style: {
      touchAction: "none",
      cursor: isDragging ? "grabbing" : "grab",
      display: visible ? undefined : "none",
      viewTransitionName: isActive ? `drag-handle-${edge}` : "none",
    },
  };

  return { state, stateAttributesMapping, defaultProps, handleRef };
}

export function RangeStartDragHandle<F extends ValueFormat = ValueFormat>(
  props: RangeStartDragHandleProps<F> & { ref?: React.Ref<HTMLSpanElement> },
) {
  const { ref, render, ...otherProps } = props;
  const { state, stateAttributesMapping, defaultProps, handleRef } = useDragHandle<F>("start");

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
  const { ref, render, ...otherProps } = props;
  const { state, stateAttributesMapping, defaultProps, handleRef } = useDragHandle<F>("end");

  return useRender({
    defaultTagName: "span",
    render,
    ref: ref ? [ref, handleRef] : [handleRef],
    state,
    stateAttributesMapping,
    props: mergeProps<"span">(defaultProps, otherProps),
  });
}
