import { useContext, useMemo, useState, useCallback, useRef } from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { useDatePicker, DayCellDataContext } from "./context";
import type {
  ValueFormat,
  DragHandleState,
  RangeStartDragHandleProps,
  RangeEndDragHandleProps,
  TemporalNamespace,
} from "./types";
import type { Temporal } from "@js-temporal/polyfill";

interface CachedDayRect {
  rect: DOMRect;
  date: Temporal.PlainDate;
}

function findClosestDay(
  px: number,
  py: number,
  cache: CachedDayRect[],
): Temporal.PlainDate | undefined {
  let closest: Temporal.PlainDate | undefined;
  let minDist = Infinity;
  for (let i = 0; i < cache.length; i++) {
    const { rect, date } = cache[i];
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = (px - cx) ** 2 + (py - cy) ** 2;
    if (dist < minDist) {
      minDist = dist;
      closest = date;
    }
  }
  return closest;
}

function findGridAncestor(el: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = el;
  while (node) {
    if (node.getAttribute("role") === "grid") return node;
    node = node.parentElement;
  }
  return null;
}

function collectDayRects(
  gridEl: HTMLElement | null,
  T: TemporalNamespace,
): CachedDayRect[] {
  const scope = gridEl ?? document;
  const rects: CachedDayRect[] = [];
  scope.querySelectorAll("[id^='day-']").forEach((el) => {
    const dateStr = el.id.slice(4);
    try {
      const d = T.PlainDate.from(dateStr);
      rects.push({ rect: el.getBoundingClientRect(), date: d });
    } catch {
      // skip invalid
    }
  });
  return rects;
}

function useDragHandle<F extends ValueFormat = ValueFormat>(edge: "start" | "end") {
  const { rangeStart, rangeEnd, setRange, temporal: T, rootState } = useDatePicker<F>();
  const cellData = useContext(DayCellDataContext);
  const date = cellData?.date;

  const isActive =
    edge === "start"
      ? !!(date && rangeStart && T.PlainDate.compare(date, rangeStart) === 0)
      : !!(date && rangeEnd && T.PlainDate.compare(date, rangeEnd) === 0);

  const [dragging, setDragging] = useState(false);
  const dayRectsRef = useRef<CachedDayRect[]>([]);
  const rangeRef = useRef({ start: rangeStart, end: rangeEnd });
  rangeRef.current = { start: rangeStart, end: rangeEnd };

  const TRef = useRef<TemporalNamespace>(T);
  TRef.current = T;

  const setRangeRef = useRef(setRange);
  setRangeRef.current = setRange;

  const edgeRef = useRef(edge);
  edgeRef.current = edge;

  const stopDrag = useCallback(() => {
    setDragging(false);
    dayRectsRef.current = [];
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isActive) return;
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(true);

      const grid = findGridAncestor(e.target as HTMLElement);
      dayRectsRef.current = collectDayRects(grid, TRef.current);
    },
    [isActive],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const { start, end } = rangeRef.current;
      if (!start || !end) return;

      const target = findClosestDay(e.clientX, e.clientY, dayRectsRef.current);
      if (!target) return;

      const Tp = TRef.current;
      let newStart: Temporal.PlainDate;
      let newEnd: Temporal.PlainDate;

      if (edgeRef.current === "start") {
        if (Tp.PlainDate.compare(target, end) <= 0) {
          newStart = target;
          newEnd = end;
        } else {
          newStart = end;
          newEnd = target;
        }
      } else {
        if (Tp.PlainDate.compare(target, start) >= 0) {
          newStart = start;
          newEnd = target;
        } else {
          newStart = target;
          newEnd = start;
        }
      }

      if (
        Tp.PlainDate.compare(newStart, start) !== 0 ||
        Tp.PlainDate.compare(newEnd, end) !== 0
      ) {
        setRangeRef.current(newStart, newEnd);
      }
    },
    [dragging],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // may already be released
      }
      stopDrag();
    },
    [dragging, stopDrag],
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // may already be released
      }
      stopDrag();
    },
    [dragging, stopDrag],
  );

  const handleLostPointerCapture = useCallback(() => {
    if (dragging) stopDrag();
  }, [dragging, stopDrag]);

  const state = useMemo<DragHandleState<F>>(
    () => ({
      root: rootState,
      active: isActive || dragging,
      dragging,
      edge,
    }),
    [rootState, isActive, dragging, edge],
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

  const defaultProps: Record<string, unknown> = {
    "data-testid": `drag-handle-${edge}`,
    style: {
      touchAction: "none",
      cursor: dragging ? "grabbing" : "grab",
      display: isActive || dragging ? undefined : "none",
    },
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
    onLostPointerCapture: handleLostPointerCapture,
  };

  return { state, stateAttributesMapping, defaultProps };
}

export function RangeStartDragHandle<F extends ValueFormat = ValueFormat>(
  props: RangeStartDragHandleProps<F> & { ref?: React.Ref<HTMLSpanElement> },
) {
  const { ref, render, ...otherProps } = props;
  const { state, stateAttributesMapping, defaultProps } = useDragHandle<F>("start");

  return useRender({
    defaultTagName: "span",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping,
    props: mergeProps<"span">(defaultProps, otherProps),
  });
}

export function RangeEndDragHandle<F extends ValueFormat = ValueFormat>(
  props: RangeEndDragHandleProps<F> & { ref?: React.Ref<HTMLSpanElement> },
) {
  const { ref, render, ...otherProps } = props;
  const { state, stateAttributesMapping, defaultProps } = useDragHandle<F>("end");

  return useRender({
    defaultTagName: "span",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping,
    props: mergeProps<"span">(defaultProps, otherProps),
  });
}
