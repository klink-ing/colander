import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { Temporal as TemporalPoly } from "@js-temporal/polyfill";
import { useContext, useEffect, useRef, memo, forwardRef } from "react";
import { useCalendarStable } from "./calendar-context";
import { WeekDataContext, DayCellDataContext } from "./context";
import { dayCellStateEqual, useDayCellDeriver } from "./day-cell-state";
import type { DayCellState } from "./day-cell-state";
import { MonthViewStateContext } from "./month-view-context";
import type { StateAttributesMapping } from "./types";
import type {
  DayCellTemplateProps,
  DayButtonProps,
  DayCellTemplateState,
} from "./types";
import { shouldMoveDomFocus } from "./utils";
import { useViewContext, useViewStable } from "./view-context";

export const dayStateAttributesMapping = {
  root: () => null,
  date: (v: TemporalPoly.PlainDate) =>
    v ? { "data-date": v.toString() } : null,
  columnIndex: () => null,
  orientation: (v) => (v ? { "data-orientation": v } : null),
  selected: (v) => (v ? { "data-selected": "" } : null),
  today: (v) => (v ? { "data-today": "" } : null),
  disabled: (v) => (v ? { "data-disabled": "" } : null),
  outsideMonth: (v) => (v ? { "data-outside-month": "" } : null),
  hidden: (v) => (v ? { "data-hidden": "" } : null),
  focused: (v) => (v ? { "data-focused": "" } : null),
  rangeStart: (v) => (v ? { "data-range-start": "" } : null),
  rangeEnd: (v) => (v ? { "data-range-end": "" } : null),
  rangeBoundary: (v) => (v ? { "data-range-boundary": "" } : null),
  inRange: (v) => (v ? { "data-in-range": "" } : null),
  rangeIndex: (v) => (v !== false ? { "data-range-index": String(v) } : null),
  rangeLength: (v) => (v !== false ? { "data-range-length": String(v) } : null),
  rangeHasStart: (v) => (v ? { "data-range-has-start": "" } : null),
  rangeHasEnd: (v) => (v ? { "data-range-has-end": "" } : null),
  rangePreviewStart: (v) => (v ? { "data-range-preview-start": "" } : null),
  rangePreviewEnd: (v) => (v ? { "data-range-preview-end": "" } : null),
  rangePreviewBoundary: (v) =>
    v ? { "data-range-preview-boundary": "" } : null,
  rangePreviewInRange: (v) =>
    v ? { "data-range-preview-in-range": "" } : null,
  rangePreviewIndex: (v) =>
    v !== false ? { "data-range-preview-index": String(v) } : null,
  rangePreviewLength: (v) =>
    v !== false ? { "data-range-preview-length": String(v) } : null,
  rangePreviewHasStart: (v) =>
    v ? { "data-range-preview-has-start": "" } : null,
  rangePreviewHasEnd: (v) => (v ? { "data-range-preview-has-end": "" } : null),
} as const satisfies StateAttributesMapping<DayCellTemplateState>;

/** Props for the memoized DayCellInstance. */
interface DayCellInstanceProps {
  render?: DayCellTemplateProps["render"];
  date: TemporalPoly.PlainDate;
  columnIndex?: number | undefined;
  children?: React.ReactNode;
  _derivedState: DayCellState;
  [key: string]: unknown;
}

function DayCellInstanceFn(props: DayCellInstanceProps) {
  const { render, date, columnIndex, children, _derivedState, ...otherProps } =
    props;

  const state = _derivedState as unknown as DayCellTemplateState;

  const defaultProps: Record<string, unknown> = state.hidden
    ? {
        role: "gridcell",
        "aria-hidden": true,
        children: null,
      }
    : {
        role: "gridcell",
        "aria-selected": state.selected || undefined,
        "aria-disabled": state.disabled || undefined,
        children: children ?? <DayButton _derivedState={_derivedState} />,
      };

  const cell = useRender({
    defaultTagName: "td",
    render,
    ref: [],
    state,
    stateAttributesMapping: dayStateAttributesMapping,
    props: mergeProps<"td">(defaultProps, otherProps),
  });

  const outsideDisabled =
    state.hidden || (state.outsideMonth && state.disabled);

  return (
    <DayCellDataContext.Provider value={{ date, columnIndex, outsideDisabled }}>
      {cell}
    </DayCellDataContext.Provider>
  );
}

/**
 * Shallow-compares the arbitrary pass-through props (className, style, event
 * handlers, data-*, …) that day-cell components spread onto their element.
 * The explicitly-handled keys (compared separately) are skipped, as is
 * `children` — a fresh React element every render, never usefully comparable.
 */
function passThroughPropsEqual(
  prev: Record<string, unknown>,
  next: Record<string, unknown>,
  handledKeys: ReadonlySet<string>,
): boolean {
  const prevKeys = Object.keys(prev).filter((k) => !handledKeys.has(k));
  const nextKeys = Object.keys(next).filter((k) => !handledKeys.has(k));
  if (prevKeys.length !== nextKeys.length) return false;
  for (const key of prevKeys) {
    if (prev[key] !== next[key]) return false;
  }
  return true;
}

const DAY_CELL_HANDLED_KEYS: ReadonlySet<string> = new Set([
  "render",
  "date",
  "columnIndex",
  "children",
  "_derivedState",
]);

const DAY_BUTTON_HANDLED_KEYS: ReadonlySet<string> = new Set([
  "render",
  "date",
  "children",
  "_derivedState",
]);

export function dayCellInstancePropsAreEqual(
  prev: DayCellInstanceProps,
  next: DayCellInstanceProps,
): boolean {
  // Skip `children` — React elements are always new objects. Child components
  // that subscribe to context (e.g. DayButton fallback) get their own
  // re-render via context; the optimised internal DayButton reads only
  // stable context and is separately memo'd.
  if (
    prev.date !== next.date ||
    prev.render !== next.render ||
    prev.columnIndex !== next.columnIndex
  )
    return false;
  return (
    dayCellStateEqual(prev._derivedState, next._derivedState) &&
    passThroughPropsEqual(prev, next, DAY_CELL_HANDLED_KEYS)
  );
}

const DayCellInstance = memo(
  DayCellInstanceFn,
  dayCellInstancePropsAreEqual,
) as typeof DayCellInstanceFn;

/**
 * Renders one `<td role="gridcell">` per day. Exposes data-attributes for
 * `selected`, `today`, `disabled`, `outside-month`, `focused`,
 * `range-start`, `range-end`, `range-boundary`, `in-range`, and `date`.
 *
 * When used inside a {@link WeekTemplate}, iterates over that week's days.
 * An explicit `date` prop renders a single cell.
 */
export function DayCellTemplate(props: DayCellTemplateProps) {
  const { date: dateProp, ...restProps } = props;
  const weekData = useContext(WeekDataContext);
  const monthState = useContext(MonthViewStateContext);
  const derive = useDayCellDeriver();

  if (dateProp) {
    return (
      <DayCellInstance
        {...restProps}
        date={dateProp}
        _derivedState={derive(dateProp)}
      />
    );
  }

  const days = weekData ? weekData.days : (monthState?.weeks.flat() ?? []);
  const perWeek = weekData != null;

  return (
    <>
      {days.map((day, i) => (
        <DayCellInstance
          key={day.toString()}
          {...restProps}
          date={day}
          columnIndex={perWeek ? i : undefined}
          _derivedState={derive(day, perWeek ? i : undefined)}
        />
      ))}
    </>
  );
}

/** Props for the memoized DayButtonInstance. */
interface DayButtonInnerProps {
  render?: DayButtonProps["render"];
  date: TemporalPoly.PlainDate;
  _derivedState?: DayCellState;
  [key: string]: unknown;
}

function DayButtonInnerFn(
  props: DayButtonInnerProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, date, _derivedState, ...otherProps } = props;
  const { onSelect, locale, readOnly, setHoveredDate } = useCalendarStable();
  const { setFocusedDate } = useViewContext();
  const { gridFocusedRef } = useViewStable();

  const internalRef = useRef<HTMLButtonElement>(null);

  const isHidden = _derivedState?.hidden ?? false;
  const isFocused = _derivedState?.focused ?? false;
  const isTabTarget = _derivedState?.isTabTarget ?? false;
  const isDisabled = _derivedState?.disabled ?? false;

  useEffect(() => {
    if (
      shouldMoveDomFocus(isFocused, gridFocusedRef.current) &&
      internalRef.current
    ) {
      internalRef.current.focus();
    }
  }, [isFocused, gridFocusedRef]);

  const state = _derivedState as unknown as DayCellTemplateState;

  const defaultProps: Record<string, unknown> = isHidden
    ? {}
    : {
        type: "button",
        tabIndex: isTabTarget ? 0 : -1,
        disabled: isDisabled,
        "aria-disabled": readOnly || undefined,
        "aria-label": date.toLocaleString(locale, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        date: date.toString(),
        onClick: () => {
          setFocusedDate(date);
          onSelect(date);
        },
        onPointerEnter: () => {
          if (!isHidden && !isDisabled) setHoveredDate(date);
        },
        children: date.day,
      };

  return useRender(
    isHidden
      ? {}
      : {
          defaultTagName: "button",
          render,
          ref: ref ? [ref, internalRef] : [internalRef],
          state,
          stateAttributesMapping: dayStateAttributesMapping,
          props: mergeProps<"button">(defaultProps, otherProps),
        },
  );
}

export function dayButtonInnerPropsAreEqual(
  prev: DayButtonInnerProps,
  next: DayButtonInnerProps,
): boolean {
  if (prev.date !== next.date || prev.render !== next.render) return false;
  if (!passThroughPropsEqual(prev, next, DAY_BUTTON_HANDLED_KEYS)) return false;
  const a = prev._derivedState;
  const b = next._derivedState;
  if (!a || !b) return a === b;
  return dayCellStateEqual(a, b);
}

// The `as any` casts are needed because DayButtonInnerProps uses an index
// signature (`[key: string]: unknown`) which conflicts with forwardRef's
// internal `Omit<Props, "ref">` type transformation.
const DayButtonInner = memo(
  forwardRef(DayButtonInnerFn as any) as any,
  dayButtonInnerPropsAreEqual as any,
) as unknown as (
  props: DayButtonInnerProps & React.RefAttributes<HTMLButtonElement>,
) => React.ReactElement | null;

/**
 * Interactive `<button>` inside a day cell. Handles click-to-select,
 * roving tabindex, and imperative focus on keyboard navigation.
 *
 * Must be used inside a {@link DayCellTemplate} or given an explicit `date` prop.
 */
function DayButtonFn(
  props: DayButtonProps & {
    _derivedState?: DayCellState;
  },
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const { date: dateProp, _derivedState, ...restProps } = props;
  const cellData = useContext(DayCellDataContext);

  const resolvedDate = dateProp ?? cellData?.date;

  if (resolvedDate) {
    // If we have derived state passed from parent, use it directly
    if (_derivedState) {
      return (
        <DayButtonInner
          {...restProps}
          ref={ref}
          date={resolvedDate}
          _derivedState={_derivedState}
        />
      );
    }
    // Fallback: compute state (for standalone DayButton usage with explicit date)
    return <DayButtonFallback ref={ref} {...restProps} date={resolvedDate} />;
  }

  throw new Error(
    "DayButton must be used inside DayCellTemplate or receive an explicit date prop.",
  );
}

export const DayButton = forwardRef(DayButtonFn) as (
  props: DayButtonProps & {
    _derivedState?: DayCellState;
  } & React.RefAttributes<HTMLButtonElement>,
) => React.ReactElement | null;

/** Fallback for standalone DayButton usage that needs to read context. */
function DayButtonFallbackFn(
  props: Omit<DayButtonProps, "date"> & { date: TemporalPoly.PlainDate },
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const { date, ...restProps } = props;
  const derive = useDayCellDeriver();

  return (
    <DayButtonInner
      {...restProps}
      ref={ref}
      date={date}
      _derivedState={derive(date)}
    />
  );
}

const DayButtonFallback = forwardRef(DayButtonFallbackFn) as (
  props: Omit<DayButtonProps, "date"> & {
    date: TemporalPoly.PlainDate;
  } & React.RefAttributes<HTMLButtonElement>,
) => React.ReactElement | null;
