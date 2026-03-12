import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { useMemo } from "react";
import { StateAttributesMapping } from "node_modules/@base-ui/react/esm/utils/getStateAttributesProps";
import {
  DatePickerStableContext,
  DatePickerStateContext,
} from "./context";
import type {
  RootProps,
  RootState,
  ValueFormat,
} from "./types";
import {
  getSystemTimeZone,
  resolveTemporal,
} from "./utils";
import { useRootState } from "./use-root-state";
import type { UseRootStateParams } from "./root-selection";

const rootStateAttributesMapping = {
  hasSelection: (v) => (v ? { "data-has-selection": "" } : null),
  selected: () => null,
  selectedDates: () => null,
  rangeStart: () => null,
  rangeEnd: () => null,
  focused: () => null,
  viewing: () => null,
  timeZone: () => null,
  locale: () => null,
  readOnly: (v) => (v ? { "data-readonly": "" } : null),
} as const satisfies StateAttributesMapping<RootState>;

/**
 * Top-level container for the DatePicker. Provides all calendar state
 * (selected value, focused date, navigation, range, etc.) to descendants
 * via React context.
 *
 * Renders a `<div>` by default. Exposes `data-has-selection` when a value
 * is selected.
 */
export function Root<F extends ValueFormat = ValueFormat>(props: RootProps<F>) {
  const {
    ref,
    render,
    children,
    format: formatProp,
    selectionMode: selectionModeProp,
    value,
    defaultValue,
    onValueChange,
    min,
    max,
    disabled,
    readOnly,
    isDateDisabled,
    timeZone: timeZoneProp,
    locale: localeProp,
    temporal: temporalProp,
    weekStartDay: weekStartDayProp,
    fixedWeeks: fixedWeeksProp,
    numberOfMonths: numberOfMonthsProp,
    outsideDays: outsideDaysProp,
    onMonthChange,
    rangeMode,
    allowRangeReversal,
    previewRange,
    onHoveredDateChange,
    ...otherProps
  } = props as any;
  const T = useMemo(() => resolveTemporal(temporalProp), [temporalProp]);
  const timeZone = timeZoneProp ?? getSystemTimeZone(T);
  const locale = localeProp ?? "en-US";
  const resolvedFormat: ValueFormat = formatProp ?? "PlainDate";
  const selectionMode = selectionModeProp ?? "single";

  if (numberOfMonthsProp != null && (numberOfMonthsProp < 1 || numberOfMonthsProp > 12)) {
    console.warn(
      `[DatePicker] numberOfMonths={${numberOfMonthsProp}} is out of the supported range (1–12). The value will be clamped.`,
    );
  }

  const { stableCtx, stateCtx, state } = useRootState<F>({
    format: resolvedFormat as F,
    selectionMode,
    value,
    defaultValue,
    onValueChange,
    min,
    max,
    disabled: disabled ?? false,
    readOnly: readOnly ?? false,
    isDateDisabled,
    timeZone,
    locale,
    temporal: T,
    weekStartDay: weekStartDayProp ?? 0,
    fixedWeeks: fixedWeeksProp ?? false,
    numberOfMonths: Math.max(1, Math.min(numberOfMonthsProp ?? 1, 12)),
    outsideDays: outsideDaysProp ?? "enabled",
    onMonthChange,
    ...(selectionMode === "range" ? { rangeMode, allowRangeReversal, previewRange, onHoveredDateChange } : {}),
  } as UseRootStateParams<F>);

  const rendered = useRender({
    defaultTagName: "div",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping: rootStateAttributesMapping,
    props: mergeProps<"div">(
      { children, ...(disabled ? { "aria-disabled": true } : {}) },
      otherProps,
    ),
  });

  return (
    <DatePickerStableContext.Provider value={stableCtx}>
      <DatePickerStateContext.Provider value={stateCtx}>
        {rendered}
      </DatePickerStateContext.Provider>
    </DatePickerStableContext.Provider>
  );
}
