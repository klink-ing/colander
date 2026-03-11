/**
 * Reusable drag-and-drop range handle hook.
 *
 * Wires up `@atlaskit/pragmatic-drag-and-drop` to let users drag range
 * boundaries (start/end) onto day cells. Styling-agnostic — works with
 * any component that renders `RangeStartDragHandle` / `RangeEndDragHandle`
 * and day buttons.
 */

import { useContext, useEffect, useRef, useState } from "react";
import type { Temporal } from "@js-temporal/polyfill";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { disableNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useDatePicker, DayCellDataContext } from "base-ui-cal";
import type { TemporalNamespace } from "base-ui-cal";

export const DRAG_TYPE = "date-range-handle";

export interface UseDragHandleDnDOptions {
  edge: "start" | "end";
  handleRef: React.RefObject<HTMLSpanElement | null>;
  allowRangeReversal?: boolean;
}

export function useDragHandleDnD({
  edge,
  handleRef,
  allowRangeReversal = false,
}: UseDragHandleDnDOptions) {
  const { rangeStart, rangeEnd, setRange, temporal: T } = useDatePicker();
  const cellData = useContext(DayCellDataContext);
  const date = cellData?.date;

  const isActive =
    edge === "start"
      ? !!(date && rangeStart && T.PlainDate.compare(date, rangeStart) === 0)
      : !!(date && rangeEnd && T.PlainDate.compare(date, rangeEnd) === 0);

  const [dragging, setDragging] = useState(false);
  const [anyHandleDragging, setAnyHandleDragging] = useState(false);
  const draggingRef = useRef(false);
  const rangeRef = useRef({ start: rangeStart, end: rangeEnd });
  rangeRef.current = { start: rangeStart, end: rangeEnd };

  const TRef = useRef<TemporalNamespace>(T);
  TRef.current = T;

  const setRangeRef = useRef(setRange);
  setRangeRef.current = setRange;

  const edgeRef = useRef(edge);
  if (!draggingRef.current) {
    edgeRef.current = edge;
  }

  useEffect(() => {
    const el = handleRef.current;
    if (!el || !isActive) return;
    const cleanup = draggable({
      element: el,
      getInitialData: () => ({ type: DRAG_TYPE, edge }),
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
      if (draggingRef.current) {
        document.body.style.cursor = "";
      }
    };
  }, [isActive, edge, handleRef]);

  useEffect(() => {
    return monitorForElements({
      canMonitor: ({ source }) => source.data.type === DRAG_TYPE,
      onDragStart: () => setAnyHandleDragging(true),
      onDrop: () => setAnyHandleDragging(false),
    });
  }, []);

  useEffect(() => {
    if (!dragging) return;
    return monitorForElements({
      canMonitor: ({ source }) => source.data.type === DRAG_TYPE,
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
        } else if (allowRangeReversal) {
          newStart = end;
          newEnd = target;
          edgeRef.current = "end";
        } else {
          newStart = end;
          newEnd = end;
        }
      } else {
        if (Tp.PlainDate.compare(target, start) >= 0) {
          newStart = start;
          newEnd = target;
        } else if (allowRangeReversal) {
          newStart = target;
          newEnd = start;
          edgeRef.current = "start";
        } else {
          newStart = start;
          newEnd = start;
        }
      }

      if (
        Tp.PlainDate.compare(newStart, start) !== 0 ||
        Tp.PlainDate.compare(newEnd, end) !== 0
      ) {
        rangeRef.current = { start: newStart, end: newEnd };
        setRangeRef.current(newStart, newEnd);
      }
    }
  }, [dragging, allowRangeReversal]);

  return { dragging, anyHandleDragging };
}

/**
 * Makes a day button a drop target for range drag handles.
 * Call this in a `useEffect` with a ref to the button element.
 */
export function useDayDropTarget(
  buttonRef: React.RefObject<HTMLElement | null>,
  date: { toString(): string } | undefined,
) {
  useEffect(() => {
    const el = buttonRef.current;
    if (!el || !date) return;
    return dropTargetForElements({
      element: el,
      getData: () => ({ date: date.toString() }),
      canDrop: ({ source }) => source.data.type === DRAG_TYPE,
      getIsSticky: () => true,
    });
  }, [buttonRef, date]);
}
