import type { Temporal } from "@js-temporal/polyfill";
import type {
  DateRange,
  DateValueObject,
  InsideRangeAction,
  RawValueForFormat,
  TemporalNamespace,
  ValueChangeMeta,
  ValueFormat,
  WeekStartDay,
  OutsideDays,
} from "./types";
import { fromZonedDateTime } from "./utils";

export interface UseRootStateParamsBase<F extends ValueFormat> {
  format: F;
  min?: RawValueForFormat<F>;
  max?: RawValueForFormat<F>;
  disabled: boolean;
  readOnly: boolean;
  isDateDisabled?: (date: Temporal.PlainDate) => boolean;
  timeZone: string;
  locale: string;
  temporal: TemporalNamespace;
  weekStartDay: WeekStartDay;
  fixedWeeks: boolean;
  numberOfMonths: number;
  outsideDays: OutsideDays;
  onMonthChange?: (month: Temporal.PlainYearMonth) => void;
}

export type UseRootStateParams<F extends ValueFormat> =
  UseRootStateParamsBase<F> &
    (
      | {
          selectionMode: "single";
          value?: RawValueForFormat<F> | null;
          defaultValue?: RawValueForFormat<F>;
          onValueChange?: (
            value: RawValueForFormat<F> | null,
            meta: ValueChangeMeta<RawValueForFormat<F> | null>,
          ) => void;
        }
      | {
          selectionMode: "range";
          value?: DateRange<F> | null;
          defaultValue?: DateRange<F>;
          onValueChange?: (
            value: DateRange<F> | null,
            meta: ValueChangeMeta<DateRange<F> | null>,
          ) => void;
          insideRangeAction?: InsideRangeAction;
        }
      | {
          selectionMode: "multiple";
          value?: RawValueForFormat<F>[] | null;
          defaultValue?: RawValueForFormat<F>[];
          onValueChange?: (
            value: RawValueForFormat<F>[],
            meta: ValueChangeMeta<RawValueForFormat<F>[]>,
          ) => void;
        }
    );

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

/** Resolve nearest-* variants to a concrete "start" | "end" | "reset" action. */
export function resolveInsideAction(
  action: InsideRangeAction,
  date: Temporal.PlainDate,
  start: Temporal.PlainDate,
  end: Temporal.PlainDate,
): "start" | "end" | "reset" {
  if (action === "start" || action === "end" || action === "reset")
    return action;

  // nearest-start or nearest-end: compare distance to each boundary
  const daysFromStart = Math.abs(date.since(start).days);
  const daysFromEnd = Math.abs(date.since(end).days);

  if (daysFromStart < daysFromEnd) return "start";
  if (daysFromEnd < daysFromStart) return "end";
  // Tie: use the suffix
  return action === "nearest-start" ? "start" : "end";
}

// --- Selection update types ---

export type SelectionResult<F extends ValueFormat> =
  | { skip: true }
  | {
      skip?: false;
      newDates: Temporal.PlainDate[];
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
  committedDates: Temporal.PlainDate[];
  committedStart: Temporal.PlainDate | undefined;
  committedEnd: Temporal.PlainDate | undefined;
  selectedZdt: Temporal.ZonedDateTime | undefined;
  insideRangeAction: InsideRangeAction;
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
    insideRangeAction,
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
    const prevArr = currentMultipleFormatted();
    const idx = committedDates.findIndex(
      (d) => T.PlainDate.compare(d, date) === 0,
    );
    let newDates: Temporal.PlainDate[];
    if (idx >= 0) {
      newDates = [
        ...committedDates.slice(0, idx),
        ...committedDates.slice(idx + 1),
      ];
    } else {
      newDates = sortDates([...committedDates, date]);
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
        )?.(newDates.map(plainToFormatValue), {
          date,
          previous: prevArr,
        });
      },
    };
  }

  if (isRange && committedStart && committedEnd) {
    const prevRange = currentRangeFormatted();
    const isSingleDay =
      T.PlainDate.compare(committedStart, committedEnd) === 0;

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

    const beforeStart = T.PlainDate.compare(date, committedStart) < 0;
    const afterEnd = T.PlainDate.compare(date, committedEnd) > 0;

    let newDates: Temporal.PlainDate[];
    if (beforeStart) {
      newDates = [date, committedEnd];
    } else if (afterEnd) {
      newDates = [committedStart, date];
    } else {
      const action = resolveInsideAction(
        insideRangeAction,
        date,
        committedStart,
        committedEnd,
      );
      if (action === "start") {
        newDates = [date, committedEnd];
      } else if (action === "end") {
        newDates = [committedStart, date];
      } else {
        newDates = [date, date];
      }
    }

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
        )?.({
          start: plainToFormatValue(newDates[0]),
          end: plainToFormatValue(newDates[1]),
        }, { date, previous: prevRange });
      },
    };
  }

  if (isRange) {
    const prevRange = currentRangeFormatted();
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
        )?.({
          start: plainToFormatValue(newDates[0]),
          end: plainToFormatValue(newDates[1]),
        }, { date, previous: prevRange });
      },
    };
  }

  // Single mode
  const prevSingle = currentSingleFormatted();
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
    T.PlainDate.compare(start, end) <= 0
      ? [start, end]
      : [end, start];
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
                m: ValueChangeMeta<DateRange<F> | null>,
              ) => void)
            | undefined
        )?.({
          start: plainToFormatValue(lo),
          end: plainToFormatValue(effectiveEnd),
        }, { date: undefined, previous: prevRange });
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
                m: ValueChangeMeta<RawValueForFormat<F> | null>,
              ) => void)
            | undefined
        )?.(tagged.value, { date: undefined, previous: prevSingle });
      }
    },
  };
}

/** Truncate dates when selection mode changes. Returns new dates + fires callback. */
export function truncateDatesForMode<F extends ValueFormat>(opts: {
  prev: Temporal.PlainDate[];
  maxDatesForMode: number;
  selectionMode: "single" | "range" | "multiple";
  plainToFormatValue: (d: Temporal.PlainDate) => RawValueForFormat<F>;
  onValueChange: unknown;
}): Temporal.PlainDate[] {
  const { prev, maxDatesForMode, selectionMode, plainToFormatValue, onValueChange } =
    opts;

  const clamped = prev.slice(0, maxDatesForMode);
  if (clamped.length === prev.length) return prev;

  const noDate = { date: undefined };

  if (selectionMode === "single") {
    const prevVal =
      prev.length > 0 ? plainToFormatValue(prev[0]) : null;
    const newVal =
      clamped.length > 0 ? plainToFormatValue(clamped[0]) : null;
    (
      onValueChange as
        | ((
            v: RawValueForFormat<F> | null,
            m: ValueChangeMeta<RawValueForFormat<F> | null>,
          ) => void)
        | undefined
    )?.(newVal, { ...noDate, previous: prevVal });
  } else if (selectionMode === "range") {
    const prevRange: DateRange<F> | null =
      prev.length >= 2
        ? {
            start: plainToFormatValue(prev[0]),
            end: plainToFormatValue(prev[1]),
          }
        : null;
    let newRange: DateRange<F> | null = null;
    if (clamped.length >= 2) {
      newRange = {
        start: plainToFormatValue(clamped[0]),
        end: plainToFormatValue(clamped[1]),
      };
    } else if (clamped.length === 1) {
      newRange = {
        start: plainToFormatValue(clamped[0]),
        end: plainToFormatValue(clamped[0]),
      };
    }
    (
      onValueChange as
        | ((
            v: DateRange<F> | null,
            m: ValueChangeMeta<DateRange<F> | null>,
          ) => void)
        | undefined
    )?.(newRange, { ...noDate, previous: prevRange });
  } else {
    const prevArr = prev.map(plainToFormatValue);
    (
      onValueChange as
        | ((
            v: RawValueForFormat<F>[],
            m: ValueChangeMeta<RawValueForFormat<F>[]>,
          ) => void)
        | undefined
    )?.(clamped.map(plainToFormatValue), {
      ...noDate,
      previous: prevArr,
    });
  }
  return clamped;
}
