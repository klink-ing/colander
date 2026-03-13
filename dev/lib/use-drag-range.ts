/**
 * Reusable drag-and-drop range handle hook.
 *
 * Uses pointer events to let users drag range boundaries (start/end) onto
 * day cells. The pointermove/pointerup listeners are attached to `document`
 * so that the drag session survives React re-renders (which move the handle
 * to a new cell element). Styling-agnostic — works with any component that
 * renders `RangeStartDragHandle` / `RangeEndDragHandle` and day buttons.
 */

import { useContext, useEffect, useRef, useState } from "react";
import type { Temporal } from "@js-temporal/polyfill";
import { useDatePicker, DayCellDataContext } from "base-ui-cal";
import type { TemporalNamespace } from "base-ui-cal";

export const DRAG_TYPE = "date-range-handle";

/** Shared state for coordinating multiple drag handles. */
const dragState = {
  active: false,
  sourceEdge: null as "start" | "end" | null,
  listeners: new Set<(dragging: boolean) => void>(),
  notify(dragging: boolean) {
    this.active = dragging;
    this.listeners.forEach((fn) => {
      fn(dragging);
    });
  },
};

export interface UseDragHandleDnDOptions {
  edge: "start" | "end";
  handleRef: React.RefObject<HTMLSpanElement | null>;
  preventRangeReversal?: boolean;
}

export function useDragHandleDnD({
  edge,
  handleRef,
  preventRangeReversal = false,
}: UseDragHandleDnDOptions) {
  const allowRangeReversal = !preventRangeReversal;
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
  const didLeaveRef = useRef(false);
  const rangeRef = useRef({ start: rangeStart, end: rangeEnd });
  rangeRef.current = { start: rangeStart, end: rangeEnd };

  const TRef = useRef<TemporalNamespace>(T);
  TRef.current = T;

  const setRangeRef = useRef(setRange);
  setRangeRef.current = setRange;

  const allowRangeReversalRef = useRef(allowRangeReversal);
  allowRangeReversalRef.current = allowRangeReversal;

  const edgeRef = useRef(edge);
  if (!draggingRef.current) {
    edgeRef.current = edge;
  }

  // Subscribe to global drag state for anyHandleDragging
  useEffect(() => {
    const listener = (active: boolean) => setAnyHandleDragging(active);
    dragState.listeners.add(listener);
    return () => {
      dragState.listeners.delete(listener);
    };
  }, []);

  // Set up pointerdown on the handle element. When a drag starts,
  // pointermove/pointerup are attached to `document` so they survive
  // React re-renders that move the handle to a different cell.
  useEffect(() => {
    const el = handleRef.current;
    if (!el || !isActive) return;

    // Mark as draggable for CSS/test selectors
    el.setAttribute("draggable", "true");

    function handlePointerDown(e: PointerEvent) {
      // Only primary button
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      draggingRef.current = true;
      didLeaveRef.current = false;
      dragState.sourceEdge = edge;
      setDragging(true);
      dragState.notify(true);
      document.body.style.cursor = "grabbing";

      // Attach move/up to document so they persist across re-renders
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
      document.addEventListener("pointercancel", handlePointerUp);
    }

    function handlePointerMove(e: PointerEvent) {
      if (!draggingRef.current) return;

      // Find the drop target under the pointer
      const elementUnder = document.elementFromPoint(e.clientX, e.clientY);
      if (!elementUnder) return;

      const dropTarget = elementUnder.closest(
        "[data-drop-date]",
      ) as HTMLElement | null;
      if (!dropTarget) return;

      const dateStr = dropTarget.dataset.dropDate;
      if (!dateStr) return;
      applyDropTarget(dateStr);
    }

    function handlePointerUp() {
      if (!draggingRef.current) return;

      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("pointercancel", handlePointerUp);

      draggingRef.current = false;
      dragState.sourceEdge = null;
      setDragging(false);
      dragState.notify(false);
      document.body.style.cursor = "";
    }

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
        } else if (allowRangeReversalRef.current) {
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
        } else if (allowRangeReversalRef.current) {
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
        didLeaveRef.current = true;
        rangeRef.current = { start: newStart, end: newEnd };
        setRangeRef.current(newStart, newEnd);
      }
    }

    el.addEventListener("pointerdown", handlePointerDown);

    return () => {
      el.removeEventListener("pointerdown", handlePointerDown);
      el.removeAttribute("draggable");
      // Do NOT remove document listeners here — the drag session must
      // survive this cleanup (which fires when the handle moves to a
      // new cell during drag). Document listeners are only removed
      // in handlePointerUp when the user releases the mouse.
    };
  }, [isActive, edge, handleRef]);

  return { dragging, anyHandleDragging, didLeaveRef };
}

/**
 * Makes a day button a drop target for range drag handles.
 * Stores the date in a `data-drop-date` attribute so the pointer-based
 * drag handler can find it via `elementFromPoint` + `closest`.
 */
export function useDayDropTarget(
  buttonRef: React.RefObject<HTMLElement | null>,
  date: { toString(): string } | undefined,
) {
  useEffect(() => {
    const el = buttonRef.current;
    if (!el || !date) return;

    el.dataset.dropDate = date.toString();

    return () => {
      delete el.dataset.dropDate;
    };
  }, [buttonRef, date]);
}
