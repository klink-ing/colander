import type { Temporal } from "@js-temporal/polyfill";
import type { useRender } from "@base-ui/react/use-render";
import { GridOrientation } from "./context";

export type WeekStartDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

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

export interface PlainDateObject {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  timeZone?: string;
}

export type DateValueObject =
  | { format: "PlainDate"; value: Temporal.PlainDate }
  | { format: "PlainDateTime"; value: Temporal.PlainDateTime }
  | { format: "PlainMonthDay"; value: Temporal.PlainMonthDay }
  | { format: "PlainTime"; value: Temporal.PlainTime }
  | { format: "PlainYearMonth"; value: Temporal.PlainYearMonth }
  | { format: "ZonedDateTime"; value: Temporal.ZonedDateTime }
  | { format: "object"; value: PlainDateObject }
  | { format: "Date"; value: Date };

export type ValueFormat = DateValueObject["format"];

export type ValueForFormat<F extends ValueFormat> = Extract<
  DateValueObject,
  { format: F }
>;

export type RawValueForFormat<F extends ValueFormat> =
  ValueForFormat<F>["value"];

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
  onSelect: (date: Temporal.PlainDate) => void;
  setRange: (start: Temporal.PlainDate, end: Temporal.PlainDate) => void;
  setFocusedDate: (date: Temporal.PlainDate) => void;
  goToNextMonth: () => void;
  goToPrevMonth: () => void;
  setGridHasFocus: (v: boolean) => void;
  setGridLabelId: (id: string | undefined) => void;
  selectionMode: "single" | "range" | "multiple";
  disabled: boolean;
  readOnly: boolean;
  isDateDisabled?: (date: Temporal.PlainDate) => boolean;
  minValue?: Temporal.PlainDate;
  maxValue?: Temporal.PlainDate;
  timeZone: string;
  locale: string;
  temporal: TemporalNamespace;
  gridFocusedRef: React.RefObject<boolean>;
  weekStartDay: WeekStartDay;
}

/** Volatile state that changes on interaction. */
export interface DatePickerStateContextValue {
  selected: DateValueObject | undefined;
  selectedDates: Temporal.PlainDate[];
  rangeStart: Temporal.PlainDate | undefined;
  rangeEnd: Temporal.PlainDate | undefined;
  focusedDate: Temporal.PlainDate;
  tabTargetDate: Temporal.PlainDate;
  currentDateTime: Temporal.PlainDateTime;
  weeks: Temporal.PlainDate[][];
  gridLabelId: string | undefined;
  rootState: RootState;
}

/** Combined context value (backward compat). */
export interface DatePickerContextValue
  extends DatePickerStableContextValue,
    DatePickerStateContextValue {}

export type RootState<F extends ValueFormat = ValueFormat> = {
  hasSelection: boolean;
  selected: RawValueForFormat<F> | undefined;
  selectedDates: RawValueForFormat<F>[];
  rangeStart: RawValueForFormat<F> | undefined;
  rangeEnd: RawValueForFormat<F> | undefined;
  focused: Temporal.PlainDate;
  viewing: Temporal.PlainYearMonth;
  timeZone: string;
  locale: string;
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
}

interface SingleSelectionProps<F extends ValueFormat = ValueFormat> {
  /**
   * Selection mode. `"single"` allows selecting one date at a time.
   * @default "single"
   */
  selectionMode?: "single";
  /** The controlled selected date. */
  value?: RawValueForFormat<F>;
  /** The initial selected date (uncontrolled). */
  defaultValue?: RawValueForFormat<F>;
  /** Called when the selected date changes. `undefined` means no selection. */
  onValueChange?: (
    value: RawValueForFormat<F> | undefined,
    meta: ValueChangeMeta<RawValueForFormat<F> | undefined>,
  ) => void;
}

interface RangeSelectionProps<F extends ValueFormat = ValueFormat> {
  /** Selection mode. `"range"` allows selecting a start and end date. */
  selectionMode: "range";
  /** The controlled selected range (`{ start, end }`). */
  value?: DateRange<F>;
  /** The initial selected range (uncontrolled). */
  defaultValue?: DateRange<F>;
  /** Called when the selected range changes. `undefined` means no selection. */
  onValueChange?: (
    value: DateRange<F> | undefined,
    meta: ValueChangeMeta<DateRange<F> | undefined>,
  ) => void;
  /**
   * What happens when clicking a date that falls inside the current range.
   * @default "nearest-end"
   */
  insideRangeAction?: InsideRangeAction;
}

interface MultipleSelectionProps<F extends ValueFormat = ValueFormat> {
  /** Selection mode. `"multiple"` allows selecting any number of individual dates. */
  selectionMode: "multiple";
  /** The controlled array of selected dates, sorted oldest-first. */
  value?: RawValueForFormat<F>[];
  /** The initial array of selected dates (uncontrolled). */
  defaultValue?: RawValueForFormat<F>[];
  /** Called when the selected dates change. Clicking a selected date deselects it. */
  onValueChange?: (
    value: RawValueForFormat<F>[],
    meta: ValueChangeMeta<RawValueForFormat<F>[]>,
  ) => void;
}

export type RootOwnProps<F extends ValueFormat = ValueFormat> =
  RootOwnPropsBase<F> &
    (
      | SingleSelectionProps<F>
      | RangeSelectionProps<F>
      | MultipleSelectionProps<F>
    );

type AllRootOwnPropKeys =
  | keyof RootOwnPropsBase
  | keyof SingleSelectionProps
  | keyof RangeSelectionProps
  | keyof MultipleSelectionProps;

export type RootProps<F extends ValueFormat = ValueFormat> = Omit<
  useRender.ComponentProps<"div", RootState<F>>,
  AllRootOwnPropKeys
> &
  RootOwnProps<F>;

export type DateStringState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  month: number;
  year: number;
  day: number;
};

export interface DateStringOwnProps {
  locales?: string | string[];
  options?: Intl.DateTimeFormatOptions;
}

export type DateStringProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"span", DateStringState<F>> & DateStringOwnProps;

export type TimeStringState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  hour: number;
  minute: number;
  second: number;
};

export interface TimeStringOwnProps {
  locales?: string | string[];
  options?: Intl.DateTimeFormatOptions;
}

export type TimeStringProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"span", TimeStringState<F>> & TimeStringOwnProps;

export type MonthYearStringState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  month: number;
  year: number;
};

export interface MonthYearStringOwnProps {
  locales?: string | string[];
  options?: Intl.DateTimeFormatOptions;
}

export type MonthYearStringProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"span", MonthYearStringState<F>> &
    MonthYearStringOwnProps;

export type NavButtonState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  direction: "next" | "prev";
  disabled: boolean;
  target: Temporal.PlainYearMonth;
};

export type PrevMonthButtonProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"button", NavButtonState<F>>;
export type NextMonthButtonProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"button", NavButtonState<F>>;

export type GridHeaderCellState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  dayOfWeek: number;
  long: string;
  short: string;
  narrow: string;
};

export interface GridHeaderCellOwnProps {
  index?: number;
}

export type GridHeaderCellProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"th", GridHeaderCellState<F>> &
    GridHeaderCellOwnProps;

export type GridHeaderState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
};

export type GridHeaderProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"thead", GridHeaderState<F>>;

export type GridBodyState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
};

export type GridBodyProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"tbody", GridBodyState<F>>;

export type GridState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  month: number;
  year: number;
  orientation: GridOrientation;
};

export interface GridOwnProps {
  mode?: "grid";
  orientation?: GridOrientation;
  autoFocus?: boolean;
}

export type GridProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"table", GridState<F>> & GridOwnProps;

export type WeekTemplateState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  weekIndex: number;
};

export type WeekTemplateProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"tr", WeekTemplateState<F>>;

export type DayCellTemplateState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  date: Temporal.PlainDate;
  columnIndex: number;
  orientation: GridOrientation;
  selected: boolean;
  today: boolean;
  disabled: boolean;
  outsideMonth: boolean;
  focused: boolean;
  rangeStart: boolean;
  rangeEnd: boolean;
  rangeBoundary: boolean;
  /** Position within the range as a fraction from `0` (range start) to `1` (range end), or `false` if not in range. */
  inRange: number | false;
};

export type DayButtonState<F extends ValueFormat = ValueFormat> =
  DayCellTemplateState<F>;

export interface DayCellTemplateOwnProps {
  date?: Temporal.PlainDate;
}

export type DayCellTemplateProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"td", DayCellTemplateState<F>> &
    DayCellTemplateOwnProps;

export interface DayButtonOwnProps {
  date?: Temporal.PlainDate;
}

export type DayButtonProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"button", DayButtonState<F>> & DayButtonOwnProps;

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

export type SelectedRangeProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"td", SelectedRangeState<F>>;

export type DragHandleEdge = "start" | "end";

export type DragHandleState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  active: boolean;
  dragging: boolean;
  edge: DragHandleEdge;
  orientation: "horizontal" | "vertical";
};

export interface DragHandleOwnProps {
  dragging?: boolean;
  edge: DragHandleEdge;
}

export type RangeDragHandleProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"span", DragHandleState<F>> & DragHandleOwnProps;

export type RangeStartDragHandleProps<F extends ValueFormat = ValueFormat> =
  Omit<RangeDragHandleProps<F>, "edge">;

export type RangeEndDragHandleProps<F extends ValueFormat = ValueFormat> = Omit<
  RangeDragHandleProps<F>,
  "edge"
>;

export type WeekNumberCellState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  weekNumber: number;
};

export type WeekNumberCellProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"td", WeekNumberCellState<F>>;

export type WeekNumberHeaderState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
};

export type WeekNumberHeaderProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"th", WeekNumberHeaderState<F>>;

export type TypedRootProps<F extends ValueFormat> = Omit<
  RootProps<F>,
  "format" | "temporal"
>;

export interface CreateDatePickerOptions {
  temporal?: TemporalNamespace;
}
