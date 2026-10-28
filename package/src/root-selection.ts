import type { Temporal } from "@js-temporal/polyfill";
import type {
  DateRange,
  DateValueObject,
  RangeMode,
  RawValueForFormat,
  TemporalNamespace,
  ValueChangeMeta,
  ValueFormat,
} from "./types";
import { fromZonedDateTime } from "./utils";

/** Construct a DateRange (workaround for TS generic conditional type widening). */
function mkRange<F extends ValueFormat>(
  start: unknown,
  end: unknown,
): DateRange<F> {
  return { start, end } as DateRange<F>;
}

export function isDateRange<F extends ValueFormat>(
  v: RawValueForFormat<F> | DateRange<F>,
): v is DateRange<F> {
  return v != null && typeof v === "object" && "start" in v && "end" in v;
}

export function tagRaw<F extends ValueFormat>(
  raw: RawValueForFormat<F> | undefined,
  format: ValueFormat,
): DateValueObject | undefined {
  if (raw == null) return undefined;
  return { format, value: raw } as DateValueObject;
}

/**
 * Decodes a range value into committed dates. An empty range is `[]`; a range
 * with only an end is `[end, null]` (pending start, so the end is still the
 * anchor of the next click).
 */
export function decodeRange<F extends ValueFormat>(
  range: DateRange<F>,
  toPlain: (raw: RawValueForFormat<F>) => Temporal.PlainDate,
): (Temporal.PlainDate | null)[] {
  const start = range.start != null ? toPlain(range.start) : null;
  const end = range.end != null ? toPlain(range.end) : null;
  if (start === null && end === null) return [];
  if (start === null && end !== null) return [end, null];
  return [start, end];
}

/** Resolve a `RangeMode` to a concrete "start" | "end" | "reset" action for inside-range clicks. */
export function resolveInsideAction(
  mode: RangeMode,
  date: Temporal.PlainDate,
  start: Temporal.PlainDate,
  end: Temporal.PlainDate,
): "start" | "end" | "reset" {
  if (mode === "adjust-start") return "start";
  if (mode === "adjust-end") return "end";
  if (mode === "reset") return "reset";

  // nearest-start or nearest-end: compare distance to each boundary
  const daysFromStart = Math.abs(date.since(start).days);
  const daysFromEnd = Math.abs(date.since(end).days);

  if (daysFromStart < daysFromEnd) return "start";
  if (daysFromEnd < daysFromStart) return "end";
  // Tie: use the suffix
  return mode === "nearest-start" ? "start" : "end";
}

// --- Selection update types ---

export type SelectionResult<F extends ValueFormat> =
  | { skip: true }
  | {
      skip?: false;
      newDates: (Temporal.PlainDate | null)[];
      fireCallback: (
        onValueChange: unknown,
        plainToFormatValue: (d: Temporal.PlainDate) => RawValueForFormat<F>,
      ) => void;
    };

/** Compute what `onSelect(date)` should do, without touching React state. */
export function computeSelectionUpdate<F extends ValueFormat>(opts: {
  date: Temporal.PlainDate;
  readOnly: boolean;
  isDateDisabled: (date: Temporal.PlainDate) => boolean;
  isMultiple: boolean;
  isRange: boolean;
  committedDates: readonly (Temporal.PlainDate | null)[];
  committedStart: Temporal.PlainDate | undefined;
  committedEnd: Temporal.PlainDate | undefined;
  selectedZdt: Temporal.ZonedDateTime | undefined;
  rangeMode: RangeMode;
  allowRangeReversal: boolean;
  sortDates: (dates: Temporal.PlainDate[]) => Temporal.PlainDate[];
  currentSingleFormatted: () => RawValueForFormat<F> | null;
  currentRangeFormatted: () => DateRange<F> | null;
  currentMultipleFormatted: () => RawValueForFormat<F>[];
  resolvedFormat: ValueFormat;
  timeZone: string;
  T: TemporalNamespace;
}): SelectionResult<F> {
  const {
    date,
    readOnly,
    isDateDisabled,
    isMultiple,
    isRange,
    committedDates,
    committedStart,
    committedEnd,
    selectedZdt,
    rangeMode,
    allowRangeReversal,
    sortDates,
    currentSingleFormatted,
    currentRangeFormatted,
    currentMultipleFormatted,
    resolvedFormat,
    timeZone,
    T,
  } = opts;

  if (readOnly) return { skip: true };
  if (isDateDisabled(date)) return { skip: true };

  if (isMultiple) {
    const dates = committedDates.filter(
      (d): d is Temporal.PlainDate => d != null,
    );
    const prevArr = currentMultipleFormatted();
    const idx = dates.findIndex((d) => T.PlainDate.compare(d, date) === 0);
    let newDates: (Temporal.PlainDate | null)[];
    if (idx >= 0) {
      newDates = [...dates.slice(0, idx), ...dates.slice(idx + 1)];
    } else {
      newDates = sortDates([...dates, date]);
    }
    return {
      newDates,
      fireCallback: (onValueChange, plainToFormatValue) => {
        (
          onValueChange as
            | ((
                v: RawValueForFormat<F>[],
                m: ValueChangeMeta<RawValueForFormat<F>[]>,
              ) => void)
            | undefined
        )?.((newDates as Temporal.PlainDate[]).map(plainToFormatValue), {
          date,
          previous: prevArr,
        });
      },
    };
  }

  // --- start-end range mode ---
  if (isRange && rangeMode === "start-end") {
    const prevRange = currentRangeFormatted();
    const isPending =
      committedDates.length === 2 &&
      (committedDates[0] === null || committedDates[1] === null);
    const isComplete =
      committedDates.length === 2 &&
      committedDates[0] != null &&
      committedDates[1] != null;

    type RangeCb =
      | ((
          v: DateRange<F> | null,
          m: ValueChangeMeta<DateRange<F> | null>,
        ) => void)
      | undefined;

    // No selection → first click: fire partial range {start, end: null}
    if (committedDates.length === 0) {
      return {
        newDates: [date, null],
        fireCallback: (onValueChange, plainToFormatValue) => {
          (onValueChange as RangeCb)?.(
            mkRange<F>(plainToFormatValue(date), null),
            {
              date,
              previous: prevRange,
            },
          );
        },
      };
    }

    // Pending start [start, null]
    if (isPending && committedDates[0] != null && committedDates[1] === null) {
      const start = committedDates[0];

      // Clicking same date as start → finalize single-day range
      if (T.PlainDate.compare(date, start) === 0) {
        return {
          newDates: [date, date],
          fireCallback: (onValueChange, plainToFormatValue) => {
            (onValueChange as RangeCb)?.(
              mkRange<F>(plainToFormatValue(date), plainToFormatValue(date)),
              { date, previous: prevRange },
            );
          },
        };
      }

      // date >= start: complete range
      if (T.PlainDate.compare(date, start) >= 0) {
        return {
          newDates: [start, date],
          fireCallback: (onValueChange, plainToFormatValue) => {
            (onValueChange as RangeCb)?.(
              mkRange<F>(plainToFormatValue(start), plainToFormatValue(date)),
              { date, previous: prevRange },
            );
          },
        };
      }

      // date < start
      if (allowRangeReversal) {
        return {
          newDates: [date, start],
          fireCallback: (onValueChange, plainToFormatValue) => {
            (onValueChange as RangeCb)?.(
              mkRange<F>(plainToFormatValue(date), plainToFormatValue(start)),
              { date, previous: prevRange },
            );
          },
        };
      }
      // Collapse to single-day
      return {
        newDates: [start, start],
        fireCallback: (onValueChange, plainToFormatValue) => {
          (onValueChange as RangeCb)?.(
            mkRange<F>(plainToFormatValue(start), plainToFormatValue(start)),
            { date, previous: prevRange },
          );
        },
      };
    }

    // Complete range [date1, date2]
    if (isComplete) {
      const start = committedDates[0];
      const end = committedDates[1];
      const isOnStart = start != null && T.PlainDate.compare(date, start) === 0;
      const isOnEnd = end != null && T.PlainDate.compare(date, end) === 0;

      // Click boundary → deselect
      if (isOnStart || isOnEnd) {
        return {
          newDates: [],
          fireCallback: (onValueChange) => {
            (onValueChange as RangeCb)?.(null, {
              date,
              previous: prevRange,
            });
          },
        };
      }

      // Non-boundary → new pending start
      return {
        newDates: [date, null],
        fireCallback: (onValueChange, plainToFormatValue) => {
          (onValueChange as RangeCb)?.(
            mkRange<F>(plainToFormatValue(date), null),
            {
              date,
              previous: prevRange,
            },
          );
        },
      };
    }

    return { skip: true };
  }

  // --- Non-start-end range modes with complete range ---
  if (isRange && committedStart && committedEnd) {
    const prevRange = currentRangeFormatted();
    const isSingleDay = T.PlainDate.compare(committedStart, committedEnd) === 0;

    // Single-day range: clicking same date → deselect
    if (isSingleDay && T.PlainDate.compare(date, committedStart) === 0) {
      return {
        newDates: [],
        fireCallback: (onValueChange) => {
          (
            onValueChange as
              | ((
                  v: DateRange<F> | null,
                  m: ValueChangeMeta<DateRange<F> | null>,
                ) => void)
              | undefined
          )?.(null, { date, previous: prevRange });
        },
      };
    }

    // Multi-day range: clicking on start or end boundary → collapse to single-day
    if (!isSingleDay) {
      const isOnStart = T.PlainDate.compare(date, committedStart) === 0;
      const isOnEnd = T.PlainDate.compare(date, committedEnd) === 0;
      if (isOnStart || isOnEnd) {
        const newDates = [date, date];
        return {
          newDates,
          fireCallback: (onValueChange, plainToFormatValue) => {
            (
              onValueChange as
                | ((
                    v: DateRange<F> | null,
                    m: ValueChangeMeta<DateRange<F> | null>,
                  ) => void)
                | undefined
            )?.(
              mkRange<F>(plainToFormatValue(date), plainToFormatValue(date)),
              {
                date,
                previous: prevRange,
              },
            );
          },
        };
      }
    }

    const beforeStart = T.PlainDate.compare(date, committedStart) < 0;
    const afterEnd = T.PlainDate.compare(date, committedEnd) > 0;

    let newStart: Temporal.PlainDate;
    let newEnd: Temporal.PlainDate;
    if (beforeStart) {
      newStart = date;
      newEnd = committedEnd;
    } else if (afterEnd) {
      newStart = committedStart;
      newEnd = date;
    } else {
      const action = resolveInsideAction(
        rangeMode,
        date,
        committedStart,
        committedEnd,
      );
      if (action === "start") {
        newStart = date;
        newEnd = committedEnd;
      } else if (action === "end") {
        newStart = committedStart;
        newEnd = date;
      } else {
        newStart = date;
        newEnd = date;
      }
    }

    return {
      newDates: [newStart, newEnd],
      fireCallback: (onValueChange, plainToFormatValue) => {
        (
          onValueChange as
            | ((
                v: DateRange<F> | null,
                m: ValueChangeMeta<DateRange<F> | null>,
              ) => void)
            | undefined
        )?.(
          mkRange<F>(plainToFormatValue(newStart), plainToFormatValue(newEnd)),
          {
            date,
            previous: prevRange,
          },
        );
      },
    };
  }

  if (isRange) {
    const prevRange = currentRangeFormatted();
    return {
      newDates: [date, date],
      fireCallback: (onValueChange, plainToFormatValue) => {
        (
          onValueChange as
            | ((
                v: DateRange<F> | null,
                m: ValueChangeMeta<DateRange<F> | null>,
              ) => void)
            | undefined
        )?.(mkRange<F>(plainToFormatValue(date), plainToFormatValue(date)), {
          date,
          previous: prevRange,
        });
      },
    };
  }

  // Single mode
  const prevSingle = currentSingleFormatted();
  const alreadySelected =
    committedDates.length === 1 &&
    committedDates[0] != null &&
    T.PlainDate.compare(committedDates[0], date) === 0;

  if (alreadySelected) {
    return {
      newDates: [],
      fireCallback: (onValueChange) => {
        (
          onValueChange as
            | ((
                v: RawValueForFormat<F> | null,
                m: ValueChangeMeta<RawValueForFormat<F> | null>,
              ) => void)
            | undefined
        )?.(null, { date, previous: prevSingle });
      },
    };
  }

  const newDates = [date];
  return {
    newDates,
    fireCallback: (onValueChange) => {
      const prevTime = selectedZdt
        ? {
            hour: selectedZdt.hour,
            minute: selectedZdt.minute,
            second: selectedZdt.second,
          }
        : { hour: 0, minute: 0, second: 0 };
      const newZdt = date.toPlainDateTime(prevTime).toZonedDateTime(timeZone);
      const newTagged = fromZonedDateTime(newZdt, resolvedFormat, T);
      (
        onValueChange as
          | ((
              v: DateValueObject["value"],
              m: ValueChangeMeta<RawValueForFormat<F> | null>,
            ) => void)
          | undefined
      )?.(newTagged.value, { date, previous: prevSingle });
    },
  };
}

/** Compute what `setRange(start, end)` should do, without touching React state. */
export function computeSetRangeUpdate<F extends ValueFormat>(opts: {
  start: Temporal.PlainDate;
  end: Temporal.PlainDate;
  readOnly: boolean;
  isMultiple: boolean;
  isRange: boolean;
  currentRangeFormatted: () => DateRange<F> | null;
  currentSingleFormatted: () => RawValueForFormat<F> | null;
  resolvedFormat: ValueFormat;
  timeZone: string;
  T: TemporalNamespace;
}): SelectionResult<F> {
  const {
    start,
    end,
    readOnly,
    isMultiple,
    isRange,
    currentRangeFormatted,
    currentSingleFormatted,
    resolvedFormat,
    timeZone,
    T,
  } = opts;

  if (readOnly || isMultiple) return { skip: true };

  const [lo, hi] =
    T.PlainDate.compare(start, end) <= 0 ? [start, end] : [end, start];
  const effectiveEnd = isRange ? hi : lo;
  const newDates = isRange ? [lo, effectiveEnd] : [lo];

  return {
    newDates,
    fireCallback: (onValueChange, plainToFormatValue) => {
      if (isRange) {
        const prevRange = currentRangeFormatted();
        (
          onValueChange as
            | ((
                v: DateRange<F> | null,
                m: { date: undefined; previous: DateRange<F> | null },
              ) => void)
            | undefined
        )?.(
          mkRange<F>(plainToFormatValue(lo), plainToFormatValue(effectiveEnd)),
          {
            date: undefined,
            previous: prevRange,
          },
        );
      } else {
        const prevSingle = currentSingleFormatted();
        const zdt = lo
          .toPlainDateTime({ hour: 0, minute: 0, second: 0 })
          .toZonedDateTime(timeZone);
        const tagged = fromZonedDateTime(zdt, resolvedFormat, T);
        (
          onValueChange as
            | ((
                v: DateValueObject["value"],
                m: { date: undefined; previous: RawValueForFormat<F> | null },
              ) => void)
            | undefined
        )?.(tagged.value, { date: undefined, previous: prevSingle });
      }
    },
  };
}

/** Truncate dates when selection mode changes. Returns new dates + fires callback. */
export function truncateDatesForMode<F extends ValueFormat>(opts: {
  prev: (Temporal.PlainDate | null)[];
  maxDatesForMode: number;
  selectionMode: "single" | "range" | "multiple";
  plainToFormatValue: (d: Temporal.PlainDate) => RawValueForFormat<F>;
  onValueChange: unknown;
}): (Temporal.PlainDate | null)[] {
  const {
    prev,
    maxDatesForMode,
    selectionMode,
    plainToFormatValue,
    onValueChange,
  } = opts;

  const clamped = prev.slice(0, maxDatesForMode);
  if (clamped.length === prev.length) return prev;

  const noDate = { date: undefined };
  const fmt = (d: Temporal.PlainDate | null | undefined) =>
    d != null ? plainToFormatValue(d) : null;

  if (selectionMode === "single") {
    const prevVal =
      prev.length > 0 && prev[0] != null ? plainToFormatValue(prev[0]) : null;
    const newVal =
      clamped.length > 0 && clamped[0] != null
        ? plainToFormatValue(clamped[0])
        : null;
    (
      onValueChange as
        | ((
            v: RawValueForFormat<F> | null,
            m: { date: undefined; previous: RawValueForFormat<F> | null },
          ) => void)
        | undefined
    )?.(newVal, { ...noDate, previous: prevVal });
  } else if (selectionMode === "range") {
    const prevRange: DateRange<F> | null =
      prev.length >= 2 ? mkRange<F>(fmt(prev[0]), fmt(prev[1])) : null;
    let newRange: DateRange<F> | null = null;
    if (clamped.length >= 2) {
      newRange = mkRange<F>(fmt(clamped[0]), fmt(clamped[1]));
    } else if (clamped.length === 1) {
      const v = fmt(clamped[0]);
      newRange = mkRange<F>(v, v);
    }
    (
      onValueChange as
        | ((
            v: DateRange<F> | null,
            m: { date: undefined; previous: DateRange<F> | null },
          ) => void)
        | undefined
    )?.(newRange, { ...noDate, previous: prevRange });
  } else {
    const nonNull = prev.filter((d): d is Temporal.PlainDate => d != null);
    const prevArr = nonNull.map(plainToFormatValue);
    const clampedNonNull = clamped.filter(
      (d): d is Temporal.PlainDate => d != null,
    );
    (
      onValueChange as
        | ((
            v: RawValueForFormat<F>[],
            m: { date: undefined; previous: RawValueForFormat<F>[] },
          ) => void)
        | undefined
    )?.(clampedNonNull.map(plainToFormatValue), {
      ...noDate,
      previous: prevArr,
    });
  }
  return clamped;
}

/** Inputs shared by the provider's hover preview and the public {@link computePreviewRange}. */
export interface RangePreviewInput {
  hoveredDate: Temporal.PlainDate;
  committedDates: readonly (Temporal.PlainDate | null)[];
  rangeMode: RangeMode;
  allowRangeReversal: boolean;
  readOnly: boolean;
  isDateDisabled: (date: Temporal.PlainDate) => boolean;
  T: TemporalNamespace;
}

/**
 * The range a click on `hoveredDate` would produce, or `null` when the click
 * would do nothing (read-only, disabled date). One path for both the
 * provider's own preview and the public {@link computePreviewRange}.
 */
export function computeRangePreview(
  input: RangePreviewInput,
): [Temporal.PlainDate, Temporal.PlainDate] | null {
  const {
    hoveredDate,
    committedDates,
    rangeMode,
    allowRangeReversal,
    readOnly,
    isDateDisabled,
    T,
  } = input;

  const committedStart = committedDates[0] ?? undefined;
  const committedEnd =
    committedDates.length > 1
      ? (committedDates[committedDates.length - 1] ?? undefined)
      : committedStart;

  // The preview never emits a value, so the formatting and time-zone inputs
  // of a real selection are unused.
  const unused = () => [] as never;
  const result = computeSelectionUpdate<"PlainDate">({
    date: hoveredDate,
    readOnly,
    isDateDisabled,
    isMultiple: false,
    isRange: true,
    committedDates,
    committedStart,
    committedEnd,
    selectedZdt: undefined,
    rangeMode,
    allowRangeReversal,
    sortDates: (d) => [...d].sort((a, b) => T.PlainDate.compare(a, b)),
    currentSingleFormatted: unused,
    currentRangeFormatted: unused,
    currentMultipleFormatted: unused,
    resolvedFormat: "PlainDate",
    timeZone: "UTC",
    T,
  });

  if (result.skip || result.newDates.length === 0) return null;
  const start = result.newDates[0];
  const end = result.newDates.length > 1 ? result.newDates[1] : start;
  if (start == null || end == null) return null;
  return [start, end];
}

/**
 * Pure utility that computes the preview range for a hovered date, using the
 * same logic as the built-in hover preview. Useful for deriving the preview in
 * an `onHoveredDateChange` handler without needing a controlled `previewRange`.
 *
 * Pass `options.isDateDisabled` and `options.readOnly` to match a calendar that
 * disables dates or is read-only; by default every date is selectable.
 */
export function computePreviewRange(
  hoveredDate: Temporal.PlainDate,
  currentRange: DateRange | null,
  rangeMode: RangeMode,
  preventRangeReversal = false,
  T?: TemporalNamespace,
  options: {
    isDateDisabled?: (date: Temporal.PlainDate) => boolean;
    readOnly?: boolean;
  } = {},
): DateRange<"PlainDate"> | null {
  const Temporal: TemporalNamespace = T ?? (globalThis as any).Temporal;
  if (!Temporal) {
    throw new Error(
      "computePreviewRange requires a Temporal namespace. Pass it as the 5th argument or ensure globalThis.Temporal is available.",
    );
  }

  const preview = computeRangePreview({
    hoveredDate,
    committedDates: currentRange
      ? decodeRange(currentRange, (raw) => Temporal.PlainDate.from(raw as any))
      : [],
    rangeMode,
    allowRangeReversal: !preventRangeReversal,
    readOnly: options.readOnly ?? false,
    isDateDisabled: options.isDateDisabled ?? (() => false),
    T: Temporal,
  });
  return preview ? mkRange<"PlainDate">(preview[0], preview[1]) : null;
}
