import type { Temporal } from "@js-temporal/polyfill";
import { useContext } from "react";
import { useCalendarStable, useCalendarState } from "./calendar-context";
import { WeekDataContext, GridContext } from "./context";
import type { GridOrientation } from "./context";
import type {
  DayCellTemplateState,
  OutsideDays,
  TemporalNamespace,
} from "./types";
import { isInRange as isInRangeUtil } from "./utils";
import { useViewContext, useViewStable, useViewState } from "./view-context";

/** A day cell's state: the public {@link DayCellTemplateState} plus the roving-tabindex flag. */
export type DayCellState = DayCellTemplateState & { isTabTarget: boolean };

type RangeState = Pick<
  DayCellTemplateState,
  | "rangeStart"
  | "rangeEnd"
  | "rangeBoundary"
  | "inRange"
  | "rangeIndex"
  | "rangeLength"
  | "rangeHasStart"
  | "rangeHasEnd"
  | "rangePreviewStart"
  | "rangePreviewEnd"
  | "rangePreviewBoundary"
  | "rangePreviewInRange"
  | "rangePreviewIndex"
  | "rangePreviewLength"
  | "rangePreviewHasStart"
  | "rangePreviewHasEnd"
>;

const NO_RANGE: RangeState = {
  rangeStart: false,
  rangeEnd: false,
  rangeBoundary: false,
  inRange: false,
  rangeIndex: false,
  rangeLength: false,
  rangeHasStart: false,
  rangeHasEnd: false,
  rangePreviewStart: false,
  rangePreviewEnd: false,
  rangePreviewBoundary: false,
  rangePreviewInRange: false,
  rangePreviewIndex: false,
  rangePreviewLength: false,
  rangePreviewHasStart: false,
  rangePreviewHasEnd: false,
};

/** Everything that is the same for every cell of one render. */
export interface DayCellInputs {
  T: TemporalNamespace;
  today: Temporal.PlainDate;
  orientation: GridOrientation;
  rootState: DayCellTemplateState["root"];
  selectionMode: "single" | "range" | "multiple";
  selectedDates: Temporal.PlainDate[];
  rangeStart: Temporal.PlainDate | undefined;
  rangeEnd: Temporal.PlainDate | undefined;
  previewStart: Temporal.PlainDate | undefined;
  previewEnd: Temporal.PlainDate | undefined;
  disabled: boolean;
  isDateDisabled: ((date: Temporal.PlainDate) => boolean) | undefined;
  focusedDate: Temporal.PlainDate;
  tabTargetDate: Temporal.PlainDate;
  outsideDays: OutsideDays;
}

/** Where one cell sits: its column and the month the grid it is in belongs to. */
export interface DayCellPosition {
  columnIndex: number;
  month: { year: number; month: number };
}

function computeRangeState(
  date: Temporal.PlainDate,
  inputs: DayCellInputs,
): RangeState {
  const { T, selectionMode, rangeStart, rangeEnd, previewStart, previewEnd } =
    inputs;
  if (selectionMode !== "range") return NO_RANGE;

  const isRangeStart = rangeStart
    ? T.PlainDate.compare(date, rangeStart) === 0
    : false;
  const isRangeEnd = rangeEnd
    ? T.PlainDate.compare(date, rangeEnd) === 0
    : false;
  const inRange = isInRangeUtil(date, rangeStart, rangeEnd, T) !== false;
  const effectiveStart = rangeStart ?? rangeEnd;
  const effectiveEnd = rangeEnd ?? rangeStart;

  const isPreviewStart = previewStart
    ? T.PlainDate.compare(date, previewStart) === 0
    : false;
  const isPreviewEnd = previewEnd
    ? T.PlainDate.compare(date, previewEnd) === 0
    : false;
  const inPreview =
    previewStart && previewEnd
      ? isInRangeUtil(date, previewStart, previewEnd, T) !== false
      : false;

  return {
    rangeStart: isRangeStart,
    rangeEnd: isRangeEnd,
    rangeBoundary: isRangeStart || isRangeEnd,
    inRange,
    rangeIndex:
      inRange && effectiveStart ? date.since(effectiveStart).days : false,
    rangeLength:
      inRange && effectiveStart && effectiveEnd
        ? effectiveEnd.since(effectiveStart).days + 1
        : false,
    rangeHasStart: inRange && rangeStart !== undefined,
    rangeHasEnd: inRange && rangeEnd !== undefined,
    rangePreviewStart: isPreviewStart,
    rangePreviewEnd: isPreviewEnd,
    rangePreviewBoundary: isPreviewStart || isPreviewEnd,
    rangePreviewInRange: inPreview,
    rangePreviewIndex:
      inPreview && previewStart ? date.since(previewStart).days : false,
    rangePreviewLength:
      inPreview && previewStart && previewEnd
        ? previewEnd.since(previewStart).days + 1
        : false,
    rangePreviewHasStart: inPreview && previewStart !== undefined,
    rangePreviewHasEnd: inPreview && previewEnd !== undefined,
  };
}

/** Derives the state of one day cell. Pure function, no hooks. */
export function computeDayCellState(
  date: Temporal.PlainDate,
  position: DayCellPosition,
  inputs: DayCellInputs,
): DayCellState {
  const { T, outsideDays } = inputs;
  const { columnIndex, month } = position;
  const isCurrentMonth = date.year === month.year && date.month === month.month;
  const base = {
    root: inputs.rootState,
    date,
    columnIndex,
    orientation: inputs.orientation,
  };

  if (!isCurrentMonth && outsideDays === "hidden") {
    return {
      ...base,
      ...NO_RANGE,
      outsideMonth: true,
      hidden: true,
      selected: false,
      today: false,
      disabled: true,
      focused: false,
      isTabTarget: false,
    };
  }

  const isToday = T.PlainDate.compare(date, inputs.today) === 0;

  if (!isCurrentMonth && outsideDays !== "enabled") {
    // `readOnly` outside days keep their range state; `disabled` ones don't.
    const suppressRange = outsideDays === "disabled";
    return {
      ...base,
      ...(suppressRange ? NO_RANGE : computeRangeState(date, inputs)),
      outsideMonth: true,
      hidden: false,
      selected: false,
      today: isToday,
      disabled: true,
      focused: false,
      isTabTarget: false,
    };
  }

  return {
    ...base,
    ...computeRangeState(date, inputs),
    outsideMonth: !isCurrentMonth,
    hidden: false,
    selected:
      inputs.selectionMode !== "range"
        ? inputs.selectedDates.some((d) => T.PlainDate.compare(d, date) === 0)
        : false,
    today: isToday,
    disabled: inputs.disabled || (inputs.isDateDisabled?.(date) ?? false),
    focused: T.PlainDate.compare(date, inputs.focusedDate) === 0,
    isTabTarget: T.PlainDate.compare(date, inputs.tabTargetDate) === 0,
  };
}

/**
 * Every field of {@link DayCellState} that decides whether a cell re-renders.
 * `root`, `date`, `columnIndex` and `orientation` are not listed: the memo
 * compares `date`/`columnIndex` as props, and the other two never change a
 * cell on their own. Adding a field to the state fails to compile until it is
 * listed here.
 */
const COMPARED_STATE: Record<
  Exclude<keyof DayCellState, "root" | "date" | "columnIndex" | "orientation">,
  true
> = {
  outsideMonth: true,
  hidden: true,
  selected: true,
  today: true,
  disabled: true,
  focused: true,
  rangeStart: true,
  rangeEnd: true,
  rangeBoundary: true,
  inRange: true,
  rangeIndex: true,
  rangeLength: true,
  rangeHasStart: true,
  rangeHasEnd: true,
  rangePreviewStart: true,
  rangePreviewEnd: true,
  rangePreviewBoundary: true,
  rangePreviewInRange: true,
  rangePreviewIndex: true,
  rangePreviewLength: true,
  rangePreviewHasStart: true,
  rangePreviewHasEnd: true,
  isTabTarget: true,
};

const COMPARED_KEYS = Object.keys(
  COMPARED_STATE,
) as (keyof typeof COMPARED_STATE)[];

/** Whether two cell states render the same cell. */
export function dayCellStateEqual(a: DayCellState, b: DayCellState): boolean {
  for (const key of COMPARED_KEYS) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

/**
 * Reads the contexts a day cell depends on and returns a function that derives
 * the state of any cell. `columnIndex` defaults to the date's column in a
 * week starting on the calendar's `weekStartDay`.
 */
export function useDayCellDeriver(): (
  date: Temporal.PlainDate,
  columnIndex?: number,
) => DayCellState {
  const { orientation } = useContext(GridContext);
  const weekData = useContext(WeekDataContext);
  const {
    disabled,
    isDateDisabled,
    selectionMode,
    temporal: T,
    today,
    weekStartDay,
  } = useCalendarStable();
  const { selectedDates, rangeStart, rangeEnd, previewStart, previewEnd } =
    useCalendarState();
  const viewCtx = useViewContext();
  const { focusedDate, tabTargetDate } = viewCtx;
  const { rootState, currentDateTime } = useViewState();
  const { outsideDays } = useViewStable();

  const inputs: DayCellInputs = {
    T,
    today: today(),
    orientation,
    rootState,
    selectionMode,
    selectedDates,
    rangeStart,
    rangeEnd,
    previewStart,
    previewEnd,
    disabled,
    isDateDisabled,
    focusedDate,
    tabTargetDate,
    outsideDays,
  };

  // A weeks view has no "current month": every cell is in its own month, so
  // `outsideMonth` is always false. Otherwise a cell belongs to the month of
  // the grid it sits in (set per grid in multi-month mode).
  const isWeeksView = viewCtx.viewType === "weeks";
  const gridMonth = weekData?.gridMonth ?? currentDateTime;

  return (date, columnIndex) => {
    const daysInWeek = date.daysInWeek;
    return computeDayCellState(
      date,
      {
        columnIndex:
          columnIndex ??
          ((date.dayOfWeek % daysInWeek) - weekStartDay + daysInWeek) %
            daysInWeek,
        month: isWeeksView ? { year: date.year, month: date.month } : gridMonth,
      },
      inputs,
    );
  };
}
