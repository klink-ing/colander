import type { Temporal } from "@js-temporal/polyfill";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarStableContext,
  CalendarStateContext,
} from "./calendar-context";
import type {
  CalendarProviderProps,
  CalendarStableContextValue,
  CalendarStateContextValue,
} from "./calendar-types";
import {
  isDateRange,
  tagRaw,
  computeSelectionUpdate,
  computeSetRangeUpdate,
  truncateDatesForMode,
  type SelectionResult,
} from "./root-selection";
import type {
  BaseRootState,
  DateRange,
  DateValueObject,
  RangeMode,
  RawValueForFormat,
  ValueFormat,
} from "./types";
import { fromZonedDateTime, toZonedDateTime, selectedToZdt } from "./utils";
import { getSystemTimeZone, resolveTemporal } from "./utils";

/**
 * Provides shared calendar state (selection, config, range preview) to all
 * descendant view components. Does NOT manage focus, navigation, or grid data.
 */
function CalendarProvider<F extends ValueFormat = "PlainDate">(
  props: CalendarProviderProps<F>,
) {
  const {
    format: formatProp,
    selectionMode: selectionModeProp,
    min,
    max,
    disabled: disabledProp,
    readOnly: readOnlyProp,
    isDateDisabled: isDateDisabledProp,
    timeZone: timeZoneProp,
    locale: localeProp,
    temporal: temporalProp,
    weekStartDay: weekStartDayProp,
    children,
  } = props;

  // --- Resolve defaults ---
  const T = resolveTemporal(temporalProp);
  const locale = localeProp ?? "en-US";
  const timeZone = timeZoneProp ?? getSystemTimeZone(T);
  const weekStartDay = weekStartDayProp ?? 0;
  const resolvedFormat = (formatProp ?? "PlainDate") as F;
  const selectionMode = selectionModeProp ?? "single";
  const disabled = disabledProp ?? false;
  const readOnly = readOnlyProp ?? false;

  // --- Extract mode-specific props ---
  const rangeParams =
    selectionMode === "range"
      ? (props as Extract<CalendarProviderProps<F>, { selectionMode: "range" }>)
      : undefined;

  const rangeMode: RangeMode = rangeParams?.rangeMode ?? "nearest-end";
  const allowRangeReversal = !(rangeParams?.preventRangeReversal ?? false);
  const previewRangeProp = rangeParams?.previewRange;
  const onHoveredDateChange = rangeParams?.onHoveredDateChange;

  const isRange = selectionMode === "range";
  const isMultiple = selectionMode === "multiple";

  // --- Value/defaultValue extraction ---
  const valueProp = (props as any).value;
  const defaultValueProp = (props as any).defaultValue;
  const onValueChange = (props as any).onValueChange;

  const singleValue: RawValueForFormat<F> | null | undefined =
    !isRange && !isMultiple
      ? (valueProp as RawValueForFormat<F> | null | undefined)
      : undefined;
  const singleDefault: RawValueForFormat<F> | undefined =
    !isRange && !isMultiple
      ? (defaultValueProp as RawValueForFormat<F> | undefined)
      : undefined;

  const rangeValue: DateRange<F> | null | undefined = isRange
    ? valueProp === null
      ? null
      : valueProp != null && isDateRange<F>(valueProp as any)
        ? (valueProp as DateRange<F>)
        : undefined
    : undefined;
  const rangeDefault: DateRange<F> | undefined =
    isRange &&
    defaultValueProp != null &&
    isDateRange<F>(defaultValueProp as any)
      ? (defaultValueProp as DateRange<F>)
      : undefined;

  const multipleValue: RawValueForFormat<F>[] | null | undefined = isMultiple
    ? valueProp === null
      ? null
      : Array.isArray(valueProp)
        ? (valueProp as RawValueForFormat<F>[])
        : undefined
    : undefined;
  const multipleDefault: RawValueForFormat<F>[] | undefined =
    isMultiple && Array.isArray(defaultValueProp)
      ? (defaultValueProp as RawValueForFormat<F>[])
      : undefined;

  // --- Tagged values ---
  const taggedValue = useMemo(
    () => tagRaw(singleValue ?? undefined, resolvedFormat),
    [singleValue, resolvedFormat],
  );

  // --- Min/Max resolution ---
  const minValue: Temporal.PlainDate | undefined = useMemo(() => {
    if (min == null) return undefined;
    const tagged = { format: resolvedFormat, value: min } as DateValueObject;
    return toZonedDateTime(tagged, timeZone, T).toPlainDate();
  }, [min, resolvedFormat, timeZone, T]);

  const maxValue: Temporal.PlainDate | undefined = useMemo(() => {
    if (max == null) return undefined;
    const tagged = { format: resolvedFormat, value: max } as DateValueObject;
    return toZonedDateTime(tagged, timeZone, T).toPlainDate();
  }, [max, resolvedFormat, timeZone, T]);

  // --- isDateDisabled ---
  const isDateDisabled = useCallback(
    (date: Temporal.PlainDate): boolean => {
      if (disabled) return true;
      if (minValue && T.PlainDate.compare(date, minValue) < 0) return true;
      if (maxValue && T.PlainDate.compare(date, maxValue) > 0) return true;
      return isDateDisabledProp?.(date) ?? false;
    },
    [disabled, minValue, maxValue, isDateDisabledProp, T],
  );

  // --- Helpers ---
  const rawToPlain = useCallback(
    (raw: RawValueForFormat<F>): Temporal.PlainDate => {
      const tagged = { format: resolvedFormat, value: raw } as DateValueObject;
      return toZonedDateTime(tagged, timeZone, T).toPlainDate();
    },
    [resolvedFormat, timeZone, T],
  );

  const sortDates = useCallback(
    (dates: Temporal.PlainDate[]) =>
      [...dates].sort((a, b) => T.PlainDate.compare(a, b)),
    [T],
  );

  const maxDatesForMode = isMultiple
    ? Number.POSITIVE_INFINITY
    : isRange
      ? 2
      : 1;

  // --- Controlled/Uncontrolled dates ---
  const controlledDates = useMemo<
    (Temporal.PlainDate | null)[] | undefined
  >(() => {
    if (isMultiple) {
      if (multipleValue === null) return [];
      if (multipleValue) return sortDates(multipleValue.map(rawToPlain));
      return undefined;
    }
    if (isRange) {
      if (rangeValue === null) return [];
      if (rangeValue) {
        const start =
          rangeValue.start != null ? rawToPlain(rangeValue.start) : null;
        const end = rangeValue.end != null ? rawToPlain(rangeValue.end) : null;
        if (start === null && end === null) return [];
        if (start === null && end !== null) return [end, null];
        return [start, end];
      }
      return undefined;
    }
    if (singleValue === null) return [];
    if (singleValue !== undefined) return [rawToPlain(singleValue)];
    return undefined;
  }, [
    isMultiple,
    isRange,
    multipleValue,
    rangeValue,
    singleValue,
    rawToPlain,
    sortDates,
  ]);

  const defaultDates = useMemo<(Temporal.PlainDate | null)[]>(() => {
    if (isMultiple) {
      if (multipleDefault) return sortDates(multipleDefault.map(rawToPlain));
      return [];
    }
    if (rangeDefault) {
      const start =
        rangeDefault.start != null ? rawToPlain(rangeDefault.start) : null;
      const end =
        rangeDefault.end != null ? rawToPlain(rangeDefault.end) : null;
      if (start === null && end === null) return [];
      if (start === null && end !== null) return [end, null];
      return [start, end];
    }
    if (singleDefault != null) return [rawToPlain(singleDefault)];
    return [];
  }, [
    isMultiple,
    multipleDefault,
    rangeDefault,
    singleDefault,
    rawToPlain,
    sortDates,
  ]);

  const [internalDates, setInternalDates] =
    useState<(Temporal.PlainDate | null)[]>(defaultDates);

  const isControlled = controlledDates !== undefined;
  const committedDates = isControlled ? controlledDates : internalDates;

  const rangeStart =
    !isMultiple && committedDates.length > 0
      ? (committedDates[0] ?? undefined)
      : undefined;
  const rangeEnd =
    !isMultiple && committedDates.length >= 2
      ? (committedDates[1] ?? undefined)
      : undefined;
  const committedStart = (committedDates[0] ?? undefined) as
    | Temporal.PlainDate
    | undefined;
  const committedEnd =
    committedDates.length > 1
      ? ((committedDates[committedDates.length - 1] ?? undefined) as
          | Temporal.PlainDate
          | undefined)
      : committedStart;

  // --- Hover state for range preview ---
  const [hoveredDate, setHoveredDateRaw] = useState<
    Temporal.PlainDate | undefined
  >(undefined);

  const setHoveredDate = useCallback(
    (date: Temporal.PlainDate | undefined) => {
      onHoveredDateChange?.(date);
      setHoveredDateRaw(date);
    },
    [onHoveredDateChange],
  );

  const plainToFormatValue = useCallback(
    (plain: Temporal.PlainDate): RawValueForFormat<F> => {
      const zdt = plain
        .toPlainDateTime({ hour: 0, minute: 0, second: 0 })
        .toZonedDateTime(timeZone);
      return fromZonedDateTime(zdt, resolvedFormat, T)
        .value as RawValueForFormat<F>;
    },
    [resolvedFormat, timeZone, T],
  );

  // --- Commit selection ---
  const commitSelection = useCallback(
    (result: SelectionResult<F>) => {
      if (result.skip) return;
      if (isControlled) {
        setInternalDates((prev) => (prev.length === 0 ? prev : []));
      } else {
        setInternalDates(result.newDates);
      }
      result.fireCallback(onValueChange, plainToFormatValue);
    },
    [isControlled, onValueChange, plainToFormatValue],
  );

  // --- Current formatted values (for "previous" in meta) ---
  const currentSingleFormatted = useCallback(() => {
    if (committedDates.length === 0) return null;
    const first = committedDates[0];
    if (first == null) return null;
    return plainToFormatValue(first);
  }, [committedDates, plainToFormatValue]);

  const currentRangeFormatted = useCallback((): DateRange<F> | null => {
    if (!committedStart && !committedEnd) return null;
    return {
      start: committedStart ? plainToFormatValue(committedStart) : null,
      end: committedEnd ? plainToFormatValue(committedEnd) : null,
    } as DateRange<F>;
  }, [committedStart, committedEnd, plainToFormatValue]);

  const currentMultipleFormatted = useCallback(
    (): RawValueForFormat<F>[] =>
      committedDates
        .filter((d): d is Temporal.PlainDate => d != null)
        .map(plainToFormatValue),
    [committedDates, plainToFormatValue],
  );

  // --- Selected value (tagged) ---
  const selected: DateValueObject | undefined = useMemo(() => {
    if (taggedValue) return taggedValue;
    if (committedDates.length === 0) return undefined;
    const first = committedDates[0];
    if (!first) return undefined;
    const zdt = first
      .toPlainDateTime({ hour: 0, minute: 0, second: 0 })
      .toZonedDateTime(timeZone);
    return fromZonedDateTime(zdt, resolvedFormat, T);
  }, [taggedValue, committedDates, timeZone, resolvedFormat, T]);

  const selectedZdt = useMemo(
    () => selectedToZdt(selected, timeZone, T),
    [selected, timeZone, T],
  );

  // --- Compute preview range ---
  const [previewStart, previewEnd] = useMemo<
    [Temporal.PlainDate | undefined, Temporal.PlainDate | undefined]
  >(() => {
    if (previewRangeProp !== undefined) {
      if (!previewRangeProp) return [undefined, undefined];
      const rawToPlainLocal = (
        raw: RawValueForFormat<F>,
      ): Temporal.PlainDate => {
        const tagged = {
          format: resolvedFormat,
          value: raw,
        } as DateValueObject;
        return toZonedDateTime(tagged, timeZone, T).toPlainDate();
      };
      const s =
        previewRangeProp.start != null
          ? rawToPlainLocal(previewRangeProp.start)
          : undefined;
      const e =
        previewRangeProp.end != null
          ? rawToPlainLocal(previewRangeProp.end)
          : undefined;
      return [s, e];
    }
    if (!hoveredDate || !isRange) return [undefined, undefined];
    const result = computeSelectionUpdate<F>({
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
      sortDates,
      currentSingleFormatted,
      currentRangeFormatted,
      currentMultipleFormatted,
      resolvedFormat,
      timeZone,
      T,
    });
    if (result.skip || result.newDates.length === 0)
      return [undefined, undefined];
    const ps = result.newDates[0];
    const pe = result.newDates.length > 1 ? result.newDates[1] : ps;
    if (ps == null || pe == null) return [undefined, undefined];
    return [ps, pe];
  }, [
    previewRangeProp,
    hoveredDate,
    isRange,
    readOnly,
    isDateDisabled,
    committedDates,
    committedStart,
    committedEnd,
    rangeMode,
    allowRangeReversal,
    sortDates,
    currentSingleFormatted,
    currentRangeFormatted,
    currentMultipleFormatted,
    resolvedFormat,
    timeZone,
    T,
  ]);

  // --- Auto-truncate internal dates on mode change ---
  const prevModeRef = useRef(selectionMode);
  useEffect(() => {
    if (prevModeRef.current === selectionMode) return;
    prevModeRef.current = selectionMode;
    if (isControlled) return;
    setInternalDates((prev) =>
      truncateDatesForMode<F>({
        prev,
        maxDatesForMode,
        selectionMode,
        plainToFormatValue,
        onValueChange,
      }),
    );
  }, [
    selectionMode,
    maxDatesForMode,
    onValueChange,
    plainToFormatValue,
    isControlled,
  ]);

  // --- Out-of-bounds cleanup for single mode ---
  useEffect(() => {
    if (isRange || isMultiple) return;
    const start = committedStart;
    if (!start) return;
    const outOfBounds =
      (minValue && T.PlainDate.compare(start, minValue) < 0) ||
      (maxValue && T.PlainDate.compare(start, maxValue) > 0);
    if (outOfBounds) {
      const prev = currentSingleFormatted();
      commitSelection({
        newDates: [],
        fireCallback: (onValueChange) => {
          (
            onValueChange as
              | ((
                  v: RawValueForFormat<F> | null,
                  m: { date: undefined; previous: RawValueForFormat<F> | null },
                ) => void)
              | undefined
          )?.(null, { date: undefined, previous: prev });
        },
      });
    }
  }, [
    minValue,
    maxValue,
    committedStart,
    commitSelection,
    currentSingleFormatted,
    T,
    isRange,
    isMultiple,
  ]);

  // --- onSelect ---
  const onSelect = useCallback(
    (date: Temporal.PlainDate) => {
      const result = computeSelectionUpdate<F>({
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
      });
      if (result.skip) return;
      commitSelection(result);
      if (isRange) setHoveredDateRaw(undefined);
    },
    [
      readOnly,
      isMultiple,
      committedDates,
      selectedZdt,
      commitSelection,
      resolvedFormat,
      isDateDisabled,
      timeZone,
      T,
      isRange,
      committedStart,
      committedEnd,
      sortDates,
      rangeMode,
      allowRangeReversal,
      currentSingleFormatted,
      currentRangeFormatted,
      currentMultipleFormatted,
    ],
  );

  // --- setRange ---
  const setRange = useCallback(
    (start: Temporal.PlainDate, end: Temporal.PlainDate) => {
      const result = computeSetRangeUpdate<F>({
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
      });
      if (result.skip) return;
      commitSelection(result);
    },
    [
      readOnly,
      isMultiple,
      isRange,
      commitSelection,
      currentRangeFormatted,
      currentSingleFormatted,
      timeZone,
      resolvedFormat,
      T,
    ],
  );

  // --- Selected dates (non-null) ---
  const nonNullDates = useMemo(
    () => committedDates.filter((d): d is Temporal.PlainDate => d != null),
    [committedDates],
  );

  // --- Build context values ---
  const stableCtx = useMemo<CalendarStableContextValue>(
    () => ({
      onSelect,
      setRange,
      selectionMode,
      disabled,
      readOnly,
      ...(isDateDisabled !== undefined && { isDateDisabled }),
      ...(minValue !== undefined && { minValue }),
      ...(maxValue !== undefined && { maxValue }),
      timeZone,
      locale,
      temporal: T,
      weekStartDay,
      rangeMode,
      preventRangeReversal: !allowRangeReversal,
      valueFormat: resolvedFormat,
      setHoveredDate,
    }),
    [
      onSelect,
      setRange,
      selectionMode,
      disabled,
      readOnly,
      isDateDisabled,
      minValue,
      maxValue,
      timeZone,
      locale,
      T,
      weekStartDay,
      rangeMode,
      allowRangeReversal,
      resolvedFormat,
      setHoveredDate,
    ],
  );

  const baseRootState = useMemo<BaseRootState>(
    () => ({
      hasSelection: nonNullDates.length > 0,
      selected: nonNullDates[0],
      selectedDates: nonNullDates,
      rangeStart,
      rangeEnd,
      timeZone,
      locale,
      readOnly,
    }),
    [nonNullDates, rangeStart, rangeEnd, timeZone, locale, readOnly],
  );

  const stateCtx = useMemo<CalendarStateContextValue>(
    () => ({
      selected,
      selectedDates: nonNullDates,
      rangeStart,
      rangeEnd,
      hoveredDate,
      previewStart,
      previewEnd,
      baseRootState,
    }),
    [
      selected,
      nonNullDates,
      rangeStart,
      rangeEnd,
      hoveredDate,
      previewStart,
      previewEnd,
      baseRootState,
    ],
  );

  return (
    <CalendarStableContext.Provider value={stableCtx}>
      <CalendarStateContext.Provider value={stateCtx}>
        {children}
      </CalendarStateContext.Provider>
    </CalendarStableContext.Provider>
  );
}

export { CalendarProvider };
export type { CalendarProviderProps };
