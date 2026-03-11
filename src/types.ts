import type { Temporal } from "@js-temporal/polyfill";
import type { useRender } from "@base-ui/react/use-render";
import { GridOrientation } from "./context";

/** Day of the week represented as a number: `0` = Sunday through `6` = Saturday. */
export type WeekStartDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Controls how days from adjacent months are displayed in the calendar grid.
 * - `"enabled"` — outside days are fully interactive (default).
 * - `"readonly"` — outside days are visible but disabled; range highlighting still paints through.
 * - `"disabled"` — outside days are visible but disabled; no range highlighting or drag handles.
 * - `"hidden"` — outside day cells are empty (`<td>` with `data-hidden` + `aria-hidden`).
 */
export type OutsideDays = "enabled" | "readonly" | "disabled" | "hidden";

/**
 * Controls what happens when clicking a date inside an existing range.
 * - `"end"` — moves the range end to the clicked date.
 * - `"start"` — moves the range start to the clicked date.
 * - `"nearest-end"` — adjusts whichever boundary is closer; ties go to end.
 * - `"nearest-start"` — adjusts whichever boundary is closer; ties go to start.
 * - `"reset"` — collapses the range to a single-day selection on the clicked date.
 */
export type InsideRangeAction =
  | "end"
  | "start"
  | "nearest-end"
  | "nearest-start"
  | "reset";

/** Subset of the Temporal API surface consumed by the DatePicker. */
export type TemporalNamespace = {
  Now: {
    timeZoneId(): string;
    zonedDateTimeISO(tz: string): Temporal.ZonedDateTime;
    plainDateISO(): Temporal.PlainDate;
  };
  PlainDate: {
    from(item: any, options?: { overflow?: string }): Temporal.PlainDate;
    compare(a: Temporal.PlainDate, b: Temporal.PlainDate): number;
  };
  PlainDateTime: {
    from(item: any, options?: { overflow?: string }): Temporal.PlainDateTime;
  };
  PlainMonthDay: {
    from(item: any): Temporal.PlainMonthDay;
  };
  PlainYearMonth: {
    from(item: any): Temporal.PlainYearMonth;
  };
};

/** Plain JS object representation of a date with optional time and time zone fields. */
export interface PlainDateObject {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  timeZone?: string;
}

/** Tagged union of all supported date value formats and their runtime values. */
export type DateValueObject =
  | { format: "PlainDate"; value: Temporal.PlainDate }
  | { format: "PlainDateTime"; value: Temporal.PlainDateTime }
  | { format: "PlainMonthDay"; value: Temporal.PlainMonthDay }
  | { format: "PlainTime"; value: Temporal.PlainTime }
  | { format: "PlainYearMonth"; value: Temporal.PlainYearMonth }
  | { format: "ZonedDateTime"; value: Temporal.ZonedDateTime }
  | { format: "object"; value: PlainDateObject }
  | { format: "Date"; value: Date };

/** Union of all supported value format discriminant strings. */
export type ValueFormat = DateValueObject["format"];

/** Extracts the {@link DateValueObject} variant matching a given format `F`. */
export type ValueForFormat<F extends ValueFormat> = Extract<
  DateValueObject,
  { format: F }
>;

/** The runtime value type for a given format `F` (e.g. `Temporal.PlainDate` for `"PlainDate"`). */
export type RawValueForFormat<F extends ValueFormat> =
  ValueForFormat<F>["value"];

/** A start/end date pair for range selection, typed to the given format `F`. */
export type DateRange<F extends ValueFormat = ValueFormat> = {
  start: RawValueForFormat<F>;
  end: RawValueForFormat<F>;
};

/**
 * Metadata passed as the second argument to `onValueChange`.
 * @typeParam Previous - The type of the previous selection value.
 */
export interface ValueChangeMeta<Previous> {
  /** The specific date that was clicked, or `undefined` if the change was not triggered by a date selection (e.g. mode switch, out-of-bounds cleanup, drag). */
  date?: Temporal.PlainDate;
  /** The previous selection value before this change. */
  previous: Previous;
}

/** Stable values (callbacks, config, refs) that don't change during interaction. */
export interface DatePickerStableContextValue {
  /** Selects (or toggles) a date, respecting the current selection mode. */
  onSelect: (date: Temporal.PlainDate) => void;
  /** Programmatically sets the range boundaries (normalized so start <= end). */
  setRange: (start: Temporal.PlainDate, end: Temporal.PlainDate) => void;
  /** Moves the logically focused date in the grid. */
  setFocusedDate: (date: Temporal.PlainDate) => void;
  /** Navigates to the next calendar month. */
  goToNextMonth: () => void;
  /** Navigates to the previous calendar month. */
  goToPrevMonth: () => void;
  /** Tracks whether the grid currently holds DOM focus. */
  setGridHasFocus: (v: boolean) => void;
  /** Registers (or clears) the id of a label element for `aria-labelledby`, keyed by month index. */
  setGridLabelId: (monthIndex: number, id: string | undefined) => void;
  /** The active selection mode. */
  selectionMode: "single" | "range" | "multiple";
  /** Whether the entire calendar is disabled. */
  disabled: boolean;
  /** Whether the calendar is read-only. */
  readOnly: boolean;
  /** User-supplied predicate for individually disabled dates. */
  isDateDisabled?: (date: Temporal.PlainDate) => boolean;
  /** Earliest selectable date (resolved from the `min` prop). */
  minValue?: Temporal.PlainDate;
  /** Latest selectable date (resolved from the `max` prop). */
  maxValue?: Temporal.PlainDate;
  /** Resolved IANA time zone. */
  timeZone: string;
  /** Resolved BCP 47 locale. */
  locale: string;
  /** Resolved Temporal namespace. */
  temporal: TemporalNamespace;
  /** Ref tracking whether the grid has DOM focus (avoids state re-renders). */
  gridFocusedRef: React.RefObject<boolean>;
  /** Day the calendar week starts on. */
  weekStartDay: WeekStartDay;
  /** Number of simultaneously visible months. */
  numberOfMonths: number;
  /** How outside-month days are displayed. */
  outsideDays: OutsideDays;
}

/** Pre-computed data for a single visible month. */
export interface MonthData {
  /** Calendar year. */
  year: number;
  /** Calendar month (1–12). */
  month: number;
  /** 2D array of weeks (each week is an array of `PlainDate`). */
  weeks: Temporal.PlainDate[][];
}

/** Volatile state that changes on interaction. */
export interface DatePickerStateContextValue {
  /** The currently selected value as a tagged {@link DateValueObject}. */
  selected: DateValueObject | undefined;
  /** Flat array of all selected dates (plain dates, sorted). */
  selectedDates: Temporal.PlainDate[];
  /** Start of the current range selection, or `undefined`. */
  rangeStart: Temporal.PlainDate | undefined;
  /** End of the current range selection, or `undefined`. */
  rangeEnd: Temporal.PlainDate | undefined;
  /** The logically focused date in the grid. */
  focusedDate: Temporal.PlainDate;
  /** The date that should receive `tabIndex={0}` for roving tabindex. */
  tabTargetDate: Temporal.PlainDate;
  /** Date-time representing the viewed month with time from the selection. */
  currentDateTime: Temporal.PlainDateTime;
  /** 2D array of weeks for the currently viewed month (first visible month). */
  weeks: Temporal.PlainDate[][];
  /** Pre-computed data for all visible months (length = `numberOfMonths`). */
  allMonths: MonthData[];
  /** Number of simultaneously visible months. */
  numberOfMonths: number;
  /** Map of month index → label element id (for per-grid `aria-labelledby`). */
  gridLabelIds: Record<number, string>;
  /** The root component's state object for render functions. */
  rootState: RootState;
}

/** Combined context value (backward compat). */
export interface DatePickerContextValue
  extends DatePickerStableContextValue,
    DatePickerStateContextValue {}

/** State exposed by the `Root` component to its render function and descendants. */
export type RootState<F extends ValueFormat = ValueFormat> = {
  /** `true` when at least one date is selected. */
  hasSelection: boolean;
  /** The primary selected value in the configured format, or `undefined`. */
  selected: RawValueForFormat<F> | undefined;
  /** All selected dates in the configured format (sorted oldest-first). */
  selectedDates: RawValueForFormat<F>[];
  /** Range start in the configured format, or `undefined`. */
  rangeStart: RawValueForFormat<F> | undefined;
  /** Range end in the configured format, or `undefined`. */
  rangeEnd: RawValueForFormat<F> | undefined;
  /** The currently focused `PlainDate` in the grid. */
  focused: Temporal.PlainDate;
  /** The month/year currently being viewed. */
  viewing: Temporal.PlainYearMonth;
  /** Resolved IANA time zone. */
  timeZone: string;
  /** Resolved BCP 47 locale. */
  locale: string;
  /** Whether the calendar is read-only. */
  readOnly: boolean;
};

interface RootOwnPropsBase<F extends ValueFormat = ValueFormat> {
  /**
   * The value format used for date serialization. Determines the type of
   * `value`, `defaultValue`, `min`, `max`, and callback parameters.
   * @default "PlainDate"
   */
  format?: F;
  /** Earliest selectable date. Dates before this are disabled. */
  min?: RawValueForFormat<F>;
  /** Latest selectable date. Dates after this are disabled. */
  max?: RawValueForFormat<F>;
  /**
   * When `true`, the entire calendar is disabled. No dates can be selected
   * or focused via keyboard.
   * @default false
   */
  disabled?: boolean;
  /**
   * When `true`, the calendar is read-only. Keyboard navigation still works
   * but selection (click, Enter, Space) is prevented.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Callback to disable individual dates. Return `true` to disable a date.
   * Called in addition to `min`/`max` bounds checking.
   */
  isDateDisabled?: (date: Temporal.PlainDate) => boolean;
  /**
   * IANA time zone identifier used for date/time conversions.
   * @default The system's current time zone.
   */
  timeZone?: string;
  /**
   * BCP 47 locale string used for formatting month names, weekday labels,
   * and other locale-sensitive output.
   * @default "en-US"
   */
  locale?: string;
  /**
   * Custom Temporal namespace for environments without native Temporal support.
   * Typically the `Temporal` export from `@js-temporal/polyfill`. When using
   * `createDatePicker`, this is baked into the factory and need not be passed again.
   */
  temporal?: TemporalNamespace;
  /**
   * Day of the week the calendar grid starts on.
   * `0` = Sunday, `1` = Monday, ..., `6` = Saturday.
   * @default 0
   */
  weekStartDay?: WeekStartDay;
  /**
   * When `true`, the calendar always renders 6 week rows, padding with
   * dates from adjacent months. Prevents layout shifts when navigating
   * between months with different row counts.
   * @default false
   */
  fixedWeeks?: boolean;
  /**
   * Called when the visible month changes — via navigation buttons,
   * keyboard (PageUp/PageDown), or when `focusedDate` crosses a month
   * boundary. Not called on initial mount.
   */
  onMonthChange?: (month: Temporal.PlainYearMonth) => void;
  /**
   * Number of months to display simultaneously. Each month is rendered
   * by a separate `Grid` component with a `monthIndex` prop.
   * @default 1
   */
  numberOfMonths?: number;
  /**
   * Controls how days from adjacent months are displayed.
   * - `"enabled"` — fully interactive (default).
   * - `"readonly"` — visible but disabled; range highlighting paints through.
   * - `"disabled"` — visible but disabled; no range highlighting or drag handles.
   * - `"hidden"` — empty cells with `data-hidden` + `aria-hidden`.
   * @default "enabled"
   */
  outsideDays?: OutsideDays;
}

/**
 * Single-mode props when the component is controlled.
 * Pass `value={null}` to clear the selection.
 */
interface SingleControlledProps<F extends ValueFormat = ValueFormat> {
  /** @default "single" */
  selectionMode?: "single";
  /** The controlled selected date. Pass `null` to clear the selection. */
  value: RawValueForFormat<F> | null;
  /** Not allowed in controlled mode. */
  defaultValue?: never;
  /** Called when the selected date changes. `null` means the selection was cleared. */
  onValueChange?: (
    value: RawValueForFormat<F> | null,
    meta: ValueChangeMeta<RawValueForFormat<F> | null>,
  ) => void;
}

/**
 * Single-mode props when the component is uncontrolled.
 * Omit `value` entirely — do not pass `value={undefined}`.
 */
interface SingleUncontrolledProps<F extends ValueFormat = ValueFormat> {
  /** @default "single" */
  selectionMode?: "single";
  /** Must be omitted for uncontrolled mode. */
  value?: never;
  /** The initial selected date (uncontrolled). */
  defaultValue?: RawValueForFormat<F>;
  /** Called when the selected date changes. `null` means the selection was cleared. */
  onValueChange?: (
    value: RawValueForFormat<F> | null,
    meta: ValueChangeMeta<RawValueForFormat<F> | null>,
  ) => void;
}

/**
 * Range-mode props when the component is controlled.
 * Pass `value={null}` to clear the selection.
 */
interface RangeControlledProps<F extends ValueFormat = ValueFormat> {
  selectionMode: "range";
  /** The controlled selected range. Pass `null` to clear the selection. */
  value: DateRange<F> | null;
  /** Not allowed in controlled mode. */
  defaultValue?: never;
  /** Called when the selected range changes. `null` means the selection was cleared. */
  onValueChange?: (
    value: DateRange<F> | null,
    meta: ValueChangeMeta<DateRange<F> | null>,
  ) => void;
  /**
   * What happens when clicking a date that falls inside the current range.
   * @default "nearest-end"
   */
  insideRangeAction?: InsideRangeAction;
}

/**
 * Range-mode props when the component is uncontrolled.
 * Omit `value` entirely — do not pass `value={undefined}`.
 */
interface RangeUncontrolledProps<F extends ValueFormat = ValueFormat> {
  selectionMode: "range";
  /** Must be omitted for uncontrolled mode. */
  value?: never;
  /** The initial selected range (uncontrolled). */
  defaultValue?: DateRange<F>;
  /** Called when the selected range changes. `null` means the selection was cleared. */
  onValueChange?: (
    value: DateRange<F> | null,
    meta: ValueChangeMeta<DateRange<F> | null>,
  ) => void;
  /**
   * What happens when clicking a date that falls inside the current range.
   * @default "nearest-end"
   */
  insideRangeAction?: InsideRangeAction;
}

/**
 * Multiple-mode props when the component is controlled.
 * Pass `value={[]}` to clear the selection.
 */
interface MultipleControlledProps<F extends ValueFormat = ValueFormat> {
  selectionMode: "multiple";
  /** The controlled array of selected dates, sorted oldest-first. */
  value: RawValueForFormat<F>[];
  /** Not allowed in controlled mode. */
  defaultValue?: never;
  /** Called when the selected dates change. Clicking a selected date deselects it. */
  onValueChange?: (
    value: RawValueForFormat<F>[],
    meta: ValueChangeMeta<RawValueForFormat<F>[]>,
  ) => void;
}

/**
 * Multiple-mode props when the component is uncontrolled.
 * Omit `value` entirely — do not pass `value={undefined}`.
 */
interface MultipleUncontrolledProps<F extends ValueFormat = ValueFormat> {
  selectionMode: "multiple";
  /** Must be omitted for uncontrolled mode. */
  value?: never;
  /** The initial array of selected dates (uncontrolled). */
  defaultValue?: RawValueForFormat<F>[];
  /** Called when the selected dates change. Clicking a selected date deselects it. */
  onValueChange?: (
    value: RawValueForFormat<F>[],
    meta: ValueChangeMeta<RawValueForFormat<F>[]>,
  ) => void;
}

/** Own props accepted by `Root`, combining base config with selection-mode-specific props. */
export type RootOwnProps<F extends ValueFormat = ValueFormat> =
  RootOwnPropsBase<F> &
    (
      | SingleControlledProps<F>
      | SingleUncontrolledProps<F>
      | RangeControlledProps<F>
      | RangeUncontrolledProps<F>
      | MultipleControlledProps<F>
      | MultipleUncontrolledProps<F>
    );

type AllRootOwnPropKeys =
  | keyof RootOwnPropsBase
  | keyof SingleControlledProps
  | keyof SingleUncontrolledProps
  | keyof RangeControlledProps
  | keyof RangeUncontrolledProps
  | keyof MultipleControlledProps
  | keyof MultipleUncontrolledProps;

/** Full props for the `Root` component (own props + render element props). */
export type RootProps<F extends ValueFormat = ValueFormat> = Omit<
  useRender.ComponentProps<"div", RootState<F>>,
  AllRootOwnPropKeys
> &
  RootOwnProps<F>;

/** State exposed by the `DateString` component. */
export type DateStringState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  month: number;
  year: number;
  day: number;
};

/** Own props for the `DateString` component. */
export interface DateStringOwnProps {
  /** BCP 47 locale(s) for date formatting. Falls back to the Root `locale`. */
  locales?: string | string[];
  /** `Intl.DateTimeFormat` options for customizing the output. */
  options?: Intl.DateTimeFormatOptions;
}

/** Full props for the `DateString` component. */
export type DateStringProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"span", DateStringState<F>> & DateStringOwnProps;

/** State exposed by the `TimeString` component. */
export type TimeStringState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  hour: number;
  minute: number;
  second: number;
};

/** Own props for the `TimeString` component. */
export interface TimeStringOwnProps {
  /** BCP 47 locale(s) for time formatting. Falls back to the Root `locale`. */
  locales?: string | string[];
  /** `Intl.DateTimeFormat` options for customizing the output. */
  options?: Intl.DateTimeFormatOptions;
}

/** Full props for the `TimeString` component. */
export type TimeStringProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"span", TimeStringState<F>> & TimeStringOwnProps;

/** State exposed by the `MonthYearString` component. */
export type MonthYearStringState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  month: number;
  year: number;
};

/** Own props for the `MonthYearString` component. */
export interface MonthYearStringOwnProps {
  /** BCP 47 locale(s) for month/year formatting. Falls back to the Root `locale`. */
  locales?: string | string[];
  /** `Intl.DateTimeFormat` options for customizing the output. */
  options?: Intl.DateTimeFormatOptions;
  /** Which visible month to display (0-based). @default 0 */
  monthIndex?: number;
}

/** Full props for the `MonthYearString` component. */
export type MonthYearStringProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"span", MonthYearStringState<F>> &
    MonthYearStringOwnProps;

/** State exposed by `PrevMonthButton` and `NextMonthButton`. */
export type NavButtonState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  direction: "next" | "prev";
  disabled: boolean;
  target: Temporal.PlainYearMonth;
};

/** Full props for the `PrevMonthButton` component. */
export type PrevMonthButtonProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"button", NavButtonState<F>>;
/** Full props for the `NextMonthButton` component. */
export type NextMonthButtonProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"button", NavButtonState<F>>;

/** State exposed by the `GridHeaderCell` component. */
export type GridHeaderCellState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  dayOfWeek: number;
  long: string;
  short: string;
  narrow: string;
};

/** Own props for the `GridHeaderCell` component. */
export interface GridHeaderCellOwnProps {
  /** 0-based column index. When omitted, all 7 weekday headers are rendered. */
  index?: number;
}

/** Full props for the `GridHeaderCell` component. */
export type GridHeaderCellProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"th", GridHeaderCellState<F>> &
    GridHeaderCellOwnProps;

/** State exposed by the `GridHeader` component. */
export type GridHeaderState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
};

/** Full props for the `GridHeader` component. */
export type GridHeaderProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"thead", GridHeaderState<F>>;

/** State exposed by the `GridBody` component. */
export type GridBodyState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
};

/** Full props for the `GridBody` component. */
export type GridBodyProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"tbody", GridBodyState<F>>;

/** State exposed by the `Grid` component. */
export type GridState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  month: number;
  year: number;
  orientation: GridOrientation;
};

/** Own props for the `Grid` component. */
export interface GridOwnProps {
  /** Interaction mode. Currently only `"grid"` is supported. */
  mode?: "grid";
  /** Layout direction for keyboard navigation. @default "horizontal" */
  orientation?: GridOrientation;
  /** When `true`, the grid auto-focuses the tab-target cell on mount. */
  autoFocus?: boolean;
  /** Which visible month this grid displays (0-based). @default 0 */
  monthIndex?: number;
}

/** Full props for the `Grid` component. */
export type GridProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"table", GridState<F>> & GridOwnProps;

/** State exposed by the `WeekTemplate` component. */
export type WeekTemplateState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  weekIndex: number;
};

/** Full props for the `WeekTemplate` component. */
export type WeekTemplateProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"tr", WeekTemplateState<F>>;

/** State exposed by the `DayCellTemplate` component. */
export type DayCellTemplateState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  date: Temporal.PlainDate;
  columnIndex: number;
  orientation: GridOrientation;
  selected: boolean;
  today: boolean;
  disabled: boolean;
  outsideMonth: boolean;
  hidden: boolean;
  focused: boolean;
  rangeStart: boolean;
  rangeEnd: boolean;
  rangeBoundary: boolean;
  /** Position within the range as a fraction from `0` (range start) to `1` (range end), or `false` if not in range. */
  inRange: number | false;
};

/** State exposed by the `DayButton` component (same as `DayCellTemplateState`). */
export type DayButtonState<F extends ValueFormat = ValueFormat> =
  DayCellTemplateState<F>;

/** Own props for the `DayCellTemplate` component. */
export interface DayCellTemplateOwnProps {
  /** Explicit date to render. When omitted, iterates over the current week's days. */
  date?: Temporal.PlainDate;
}

/** Full props for the `DayCellTemplate` component. */
export type DayCellTemplateProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"td", DayCellTemplateState<F>> &
    DayCellTemplateOwnProps;

/** Own props for the `DayButton` component. */
export interface DayButtonOwnProps {
  /** Explicit date for a standalone `DayButton`. Normally inherited from `DayCellTemplate`. */
  date?: Temporal.PlainDate;
}

/** Full props for the `DayButton` component. */
export type DayButtonProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"button", DayButtonState<F>> & DayButtonOwnProps;

/** State exposed by the `SelectedRange` component. */
export type SelectedRangeState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  active: boolean;
  weekIndex: number;
  startIndex: number;
  endIndex: number;
  startDate: string;
  endDate: string;
  extendsBefore: boolean;
  extendsAfter: boolean;
  orientation: "horizontal" | "vertical";
};

/** Full props for the `SelectedRange` component. */
export type SelectedRangeProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"td", SelectedRangeState<F>>;

/** Which end of a range the drag handle controls. */
export type DragHandleEdge = "start" | "end";

/** State exposed by the `RangeDragHandle` components. */
export type DragHandleState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  active: boolean;
  dragging: boolean;
  edge: DragHandleEdge;
  orientation: "horizontal" | "vertical";
};

/** Own props for the `RangeDragHandle` component. */
export interface DragHandleOwnProps {
  /** Whether this handle is currently being dragged. */
  dragging?: boolean;
  /** Which boundary this handle controls. */
  edge: DragHandleEdge;
}

/** Full props for the `RangeDragHandle` component. */
export type RangeDragHandleProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"span", DragHandleState<F>> & DragHandleOwnProps;

/** Props for `RangeStartDragHandle` (edge is fixed to `"start"`). */
export type RangeStartDragHandleProps<F extends ValueFormat = ValueFormat> =
  Omit<RangeDragHandleProps<F>, "edge">;

/** Props for `RangeEndDragHandle` (edge is fixed to `"end"`). */
export type RangeEndDragHandleProps<F extends ValueFormat = ValueFormat> = Omit<
  RangeDragHandleProps<F>,
  "edge"
>;

/** State exposed by the `WeekNumberCell` component. */
export type WeekNumberCellState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  weekNumber: number;
};

/** Full props for the `WeekNumberCell` component. */
export type WeekNumberCellProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"td", WeekNumberCellState<F>>;

/** State exposed by the `WeekNumberHeader` component. */
export type WeekNumberHeaderState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
};

/** Full props for the `WeekNumberHeader` component. */
export type WeekNumberHeaderProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"th", WeekNumberHeaderState<F>>;

/** Root props pre-narrowed to a specific format (used by `createDatePicker`). */
export type TypedRootProps<F extends ValueFormat> = Omit<
  RootProps<F>,
  "format" | "temporal"
>;

/** Options for {@link createDatePicker}. */
export interface CreateDatePickerOptions {
  /** Temporal polyfill to bake into the factory-created components. */
  temporal?: TemporalNamespace;
}
