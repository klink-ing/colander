import type { Temporal } from "@js-temporal/polyfill";
import type {
  DateRange,
  DateValueObject,
  RangeMode,
  RawValueForFormat,
  TemporalNamespace,
  ValueChangeMeta,
  ValueFormat,
  WeekStartDay,
} from "./types";

// ---------------------------------------------------------------------------
// CalendarProvider props (discriminated union mirroring Root's pattern)
// ---------------------------------------------------------------------------

interface CalendarProviderPropsBase<F extends ValueFormat = ValueFormat> {
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
   * When `true`, the entire calendar is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * When `true`, the calendar is read-only. Keyboard navigation still works
   * but selection is prevented.
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
   */
  temporal?: TemporalNamespace;
  /**
   * Day of the week the calendar grid starts on.
   * `0` = Sunday, `1` = Monday, ..., `6` = Saturday.
   * @default 0
   */
  weekStartDay?: WeekStartDay;
  /** React children. */
  children?: React.ReactNode;
}

// --- Single selection ---

interface CalendarSingleControlledProps<F extends ValueFormat = ValueFormat> {
  /** @default "single" */
  selectionMode?: "single";
  /** The controlled selected date. Pass `null` to clear. */
  value: RawValueForFormat<F> | null;
  defaultValue?: never;
  onValueChange?: (
    value: RawValueForFormat<F> | null,
    meta: ValueChangeMeta<RawValueForFormat<F> | null>,
  ) => void;
}

interface CalendarSingleUncontrolledProps<F extends ValueFormat = ValueFormat> {
  /** @default "single" */
  selectionMode?: "single";
  value?: never;
  defaultValue?: RawValueForFormat<F>;
  onValueChange?: (
    value: RawValueForFormat<F> | null,
    meta: ValueChangeMeta<RawValueForFormat<F> | null>,
  ) => void;
}

// --- Range selection ---

interface CalendarRangeControlledProps<F extends ValueFormat = ValueFormat> {
  selectionMode: "range";
  value: DateRange<F> | null;
  defaultValue?: never;
  onValueChange?: (
    value: DateRange<F> | null,
    meta: ValueChangeMeta<DateRange<F> | null>,
  ) => void;
  /** @default "nearest-end" */
  rangeMode?: RangeMode;
  /** @default false */
  preventRangeReversal?: boolean;
  previewRange?: DateRange<F> | null;
  onHoveredDateChange?: (date: Temporal.PlainDate | undefined) => void;
}

interface CalendarRangeUncontrolledProps<F extends ValueFormat = ValueFormat> {
  selectionMode: "range";
  value?: never;
  defaultValue?: DateRange<F>;
  onValueChange?: (
    value: DateRange<F> | null,
    meta: ValueChangeMeta<DateRange<F> | null>,
  ) => void;
  /** @default "nearest-end" */
  rangeMode?: RangeMode;
  /** @default false */
  preventRangeReversal?: boolean;
  previewRange?: DateRange<F> | null;
  onHoveredDateChange?: (date: Temporal.PlainDate | undefined) => void;
}

// --- Multiple selection ---

interface CalendarMultipleControlledProps<F extends ValueFormat = ValueFormat> {
  selectionMode: "multiple";
  value: RawValueForFormat<F>[];
  defaultValue?: never;
  onValueChange?: (
    value: RawValueForFormat<F>[],
    meta: ValueChangeMeta<RawValueForFormat<F>[]>,
  ) => void;
}

interface CalendarMultipleUncontrolledProps<
  F extends ValueFormat = ValueFormat,
> {
  selectionMode: "multiple";
  value?: never;
  defaultValue?: RawValueForFormat<F>[];
  onValueChange?: (
    value: RawValueForFormat<F>[],
    meta: ValueChangeMeta<RawValueForFormat<F>[]>,
  ) => void;
}

/** Props accepted by `CalendarProvider`. */
export type CalendarProviderProps<F extends ValueFormat = ValueFormat> =
  CalendarProviderPropsBase<F> &
    (
      | CalendarSingleControlledProps<F>
      | CalendarSingleUncontrolledProps<F>
      | CalendarRangeControlledProps<F>
      | CalendarRangeUncontrolledProps<F>
      | CalendarMultipleControlledProps<F>
      | CalendarMultipleUncontrolledProps<F>
    );

// ---------------------------------------------------------------------------
// Context value types
// ---------------------------------------------------------------------------

/** Stable values (callbacks, config) provided by CalendarProvider — shared across all views. */
export interface CalendarStableContextValue {
  /** Selects (or toggles) a date, respecting the current selection mode. */
  onSelect: (date: Temporal.PlainDate) => void;
  /** Programmatically sets the range boundaries (normalized so start <= end). */
  setRange: (start: Temporal.PlainDate, end: Temporal.PlainDate) => void;
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
  /** Day the calendar week starts on. */
  weekStartDay: WeekStartDay;
  /** Active range selection mode. */
  rangeMode: RangeMode;
  /** Whether reversed ranges are auto-sorted instead of collapsed. */
  preventRangeReversal: boolean;
  /** The value format discriminant. */
  valueFormat: ValueFormat;
  /** Sets the hovered date for range preview. */
  setHoveredDate: (date: Temporal.PlainDate | undefined) => void;
}

/** Volatile state provided by CalendarProvider — shared across all views. */
export interface CalendarStateContextValue {
  /** The currently selected value as a tagged {@link DateValueObject}. */
  selected: DateValueObject | undefined;
  /** Flat array of all selected dates (plain dates, sorted). */
  selectedDates: Temporal.PlainDate[];
  /** Start of the current range selection, or `undefined`. */
  rangeStart: Temporal.PlainDate | undefined;
  /** End of the current range selection, or `undefined`. */
  rangeEnd: Temporal.PlainDate | undefined;
  /** The currently hovered date (for range preview). */
  hoveredDate: Temporal.PlainDate | undefined;
  /** Start of the computed preview range. */
  previewStart: Temporal.PlainDate | undefined;
  /** End of the computed preview range. */
  previewEnd: Temporal.PlainDate | undefined;
}
