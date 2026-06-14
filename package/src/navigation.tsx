import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { forwardRef, useId, useMemo, useEffect } from "react";
import { useCalendarStable, useCalendarState } from "./calendar-context";
import { useMonthViewStable, useMonthViewState } from "./month-view-context";
import type { StateAttributesMapping } from "./types";
import type {
  ValueFormat,
  DateStringState,
  DateStringProps,
  TimeStringState,
  TimeStringProps,
  MonthYearStringState,
  MonthYearStringProps,
  PrevMonthButtonProps,
  NextMonthButtonProps,
  NavButtonState,
} from "./types";
import { selectedToZdt, zdtToNativeDate } from "./utils";

const dateStringStateAttributesMapping = {
  root: () => null,
  month: () => null,
  year: () => null,
  day: () => null,
} as const satisfies StateAttributesMapping<DateStringState>;

const timeStringStateAttributesMapping = {
  root: () => null,
  hour: () => null,
  minute: () => null,
  second: () => null,
} as const satisfies StateAttributesMapping<TimeStringState>;

const monthYearStringStateAttributesMapping = {
  root: () => null,
  month: () => null,
  year: () => null,
} as const satisfies StateAttributesMapping<MonthYearStringState>;

function DateStringFn(
  props: DateStringProps,
  ref: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, locales, options, ...otherProps } = props;
  const { locale, temporal: T, timeZone } = useCalendarStable();
  const { selected } = useCalendarState();
  const { currentDateTime, rootState } = useMonthViewState();

  const selectedZdt = selectedToZdt(selected, timeZone, T);
  const displayDate = selectedZdt
    ? zdtToNativeDate(selectedZdt)
    : new Date(currentDateTime.year, currentDateTime.month - 1, 1);

  const formatted = displayDate.toLocaleDateString(locales ?? locale, options);

  const month = displayDate.getMonth() + 1;
  const year = displayDate.getFullYear();
  const day = displayDate.getDate();

  const state = useMemo<DateStringState>(
    () => ({
      root: rootState as any,
      month,
      year,
      day,
    }),
    [rootState, month, year, day],
  );

  const defaultProps: Record<string, unknown> = {
    children: formatted,
    "aria-live": "polite",
  };

  return useRender({
    defaultTagName: "span",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping: dateStringStateAttributesMapping,
    props: mergeProps<"span">(defaultProps, otherProps),
  });
}

/**
 * Displays the currently selected (or current) date as localized text.
 * Renders a `<span>` with `aria-live="polite"`.
 */
export const DateString = forwardRef(DateStringFn) as <
  F extends ValueFormat = ValueFormat,
>(
  props: DateStringProps<F> & React.RefAttributes<HTMLSpanElement>,
) => React.ReactElement | null;

function TimeStringFn(
  props: TimeStringProps,
  ref: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, locales, options, ...otherProps } = props;
  const { locale, temporal: T, timeZone } = useCalendarStable();
  const { selected } = useCalendarState();
  const { rootState } = useMonthViewState();

  const selZdt = selectedToZdt(selected, timeZone, T);
  const displayDate = selZdt
    ? zdtToNativeDate(selZdt)
    : zdtToNativeDate(T.Now.zonedDateTimeISO(timeZone));

  const mergedOptions: Intl.DateTimeFormatOptions = { timeZone, ...options };
  const formatted = displayDate.toLocaleTimeString(
    locales ?? locale,
    mergedOptions,
  );

  const nowZdt = selZdt ?? T.Now.zonedDateTimeISO(timeZone);
  const hour = nowZdt.hour;
  const minute = nowZdt.minute;
  const second = nowZdt.second;

  const state = useMemo<TimeStringState>(
    () => ({
      root: rootState as any,
      hour,
      minute,
      second,
    }),
    [rootState, hour, minute, second],
  );

  const defaultProps: Record<string, unknown> = {
    children: formatted,
    "aria-live": "polite",
  };

  return useRender({
    defaultTagName: "span",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping: timeStringStateAttributesMapping,
    props: mergeProps<"span">(defaultProps, otherProps),
  });
}

/**
 * Displays the currently selected time as localized text.
 * Falls back to the current time when nothing is selected.
 * Renders a `<span>` with `aria-live="polite"`.
 */
export const TimeString = forwardRef(TimeStringFn) as <
  F extends ValueFormat = ValueFormat,
>(
  props: TimeStringProps<F> & React.RefAttributes<HTMLSpanElement>,
) => React.ReactElement | null;

function MonthYearStringFn(
  props: MonthYearStringProps,
  ref: React.ForwardedRef<HTMLSpanElement>,
) {
  const {
    render,
    locales,
    options,
    monthIndex: monthIndexProp,
    ...otherProps
  } = props;
  const monthIndex = monthIndexProp ?? 0;
  const { locale, temporal: T } = useCalendarStable();
  const monthViewStable = useMonthViewStable();
  const {
    currentMonth: currentDateTime,
    allMonths,
    rootState,
  } = useMonthViewState();
  const { setGridLabelId } = monthViewStable;

  const id = useId();

  useEffect(() => {
    setGridLabelId(monthIndex, id);
    return () => setGridLabelId(monthIndex, undefined);
  }, [id, setGridLabelId, monthIndex]);

  const monthData = allMonths[monthIndex];
  const displayYear = monthData?.year ?? currentDateTime.year;
  const displayMonth = monthData?.month ?? currentDateTime.month;

  const defaultOptions: Intl.DateTimeFormatOptions = options ?? {
    month: "long",
    year: "numeric",
  };
  // Format through Temporal
  // `displayYear`/`displayMonth` are ISO; formatting an ISO
  // `PlainDate` (not `PlainYearMonth`, which throws on calendar mismatch)
  // lets Intl render it in the locale's calendar (e.g. Buddhist for th-TH).
  const formatted = T.PlainDate.from({
    year: displayYear,
    month: displayMonth,
    day: 1,
  }).toLocaleString(locales ?? locale, defaultOptions);

  const state = useMemo<MonthYearStringState>(
    () => ({
      root: rootState as any,
      month: displayMonth,
      year: displayYear,
    }),
    [rootState, displayMonth, displayYear],
  );

  const defaultProps: Record<string, unknown> = {
    id,
    children: formatted,
    "aria-live": "polite",
  };

  return useRender({
    defaultTagName: "span",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping: monthYearStringStateAttributesMapping,
    props: mergeProps<"span">(defaultProps, otherProps),
  });
}

/**
 * Displays the currently viewed month and year as a live-region heading for the
 * calendar grid. Defaults to `{ month: "long", year: "numeric" }` (e.g.
 * "March 2026"). Automatically registers a unique `id` so that `Grid` can
 * reference it via `aria-labelledby`.
 *
 * **Accessibility requirement:** When using a custom `render` function or custom
 * `options` that change the displayed format, both the month and year **must**
 * remain accessible to screen readers within this component. This element is
 * referenced by the calendar grid's `aria-labelledby` and serves as its
 * accessible name.
 */
export const MonthYearString = forwardRef(MonthYearStringFn) as <
  F extends ValueFormat = ValueFormat,
>(
  props: MonthYearStringProps<F> & React.RefAttributes<HTMLSpanElement>,
) => React.ReactElement | null;

function useNavButton<F extends ValueFormat = ValueFormat>(
  direction: "prev" | "next",
) {
  const {
    disabled: globalDisabled,
    minValue,
    maxValue,
    temporal: T,
  } = useCalendarStable();
  const monthViewStable = useMonthViewStable();
  const monthViewState = useMonthViewState();
  const {
    goNextMonth: goToNextMonth,
    goPrevMonth: goToPrevMonth,
    numberOfMonths,
  } = monthViewStable;
  const {
    currentMonth: currentDateTime,
    allMonths,
    rootState,
  } = monthViewState;

  // For "next", compute destination from the last visible month
  // For "prev", compute destination from the first visible month
  const refMonth =
    direction === "next"
      ? (allMonths[numberOfMonths - 1] ?? currentDateTime)
      : currentDateTime;

  const destMonth =
    direction === "prev"
      ? refMonth.month === 1
        ? 12
        : refMonth.month - 1
      : refMonth.month === 12
        ? 1
        : refMonth.month + 1;

  const destYear =
    direction === "prev"
      ? refMonth.month === 1
        ? refMonth.year - 1
        : refMonth.year
      : refMonth.month === 12
        ? refMonth.year + 1
        : refMonth.year;

  const boundValue = direction === "prev" ? minValue : maxValue;

  const isDisabled = useMemo(() => {
    if (globalDisabled) return true;
    if (!boundValue) return false;
    if (direction === "prev") {
      return (
        destYear < boundValue.year ||
        (destYear === boundValue.year && destMonth < boundValue.month)
      );
    }
    return (
      destYear > boundValue.year ||
      (destYear === boundValue.year && destMonth > boundValue.month)
    );
  }, [globalDisabled, destYear, destMonth, boundValue, direction]);

  // ISO — `destYear`/`destMonth` are ISO numbers; the locale calendar only
  // affects display, so it must not be injected into this value.
  const target = useMemo(
    () => T.PlainYearMonth.from({ year: destYear, month: destMonth }),
    [destYear, destMonth, T],
  );

  const state = useMemo<NavButtonState<F>>(
    () => ({ root: rootState as any, direction, disabled: isDisabled, target }),
    [rootState, direction, isDisabled, target],
  );

  const goFn = direction === "prev" ? goToPrevMonth : goToNextMonth;

  const defaultProps: Record<string, unknown> = {
    type: "button",
    "aria-label": `Go to ${direction === "prev" ? "previous" : "next"} month`,
    disabled: isDisabled,
    onClick: isDisabled ? undefined : goFn,
  };

  return { state, defaultProps };
}

const navButtonStateAttributesMapping = {
  root: () => null,
  direction: (v) => ({ "data-direction": v }),
  disabled: () => null,
  target: () => null,
} as const satisfies StateAttributesMapping<NavButtonState>;

function PrevMonthButtonFn(
  props: PrevMonthButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, ...otherProps } = props;
  const { state, defaultProps } = useNavButton("prev");

  return useRender({
    defaultTagName: "button",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping: navButtonStateAttributesMapping,
    props: mergeProps<"button">(defaultProps, otherProps),
  });
}

/**
 * Button that navigates to the previous month. Automatically disabled
 * when the previous month falls before `min`. Exposes `data-direction="prev"`.
 */
export const PrevMonthButton = forwardRef(PrevMonthButtonFn) as <
  F extends ValueFormat = ValueFormat,
>(
  props: PrevMonthButtonProps<F> & React.RefAttributes<HTMLButtonElement>,
) => React.ReactElement | null;

function NextMonthButtonFn(
  props: NextMonthButtonProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const { render, ...otherProps } = props;
  const { state, defaultProps } = useNavButton("next");

  return useRender({
    defaultTagName: "button",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping: navButtonStateAttributesMapping,
    props: mergeProps<"button">(defaultProps, otherProps),
  });
}

/**
 * Button that navigates to the next month. Automatically disabled
 * when the next month falls after `max`. Exposes `data-direction="next"`.
 */
export const NextMonthButton = forwardRef(NextMonthButtonFn) as <
  F extends ValueFormat = ValueFormat,
>(
  props: NextMonthButtonProps<F> & React.RefAttributes<HTMLButtonElement>,
) => React.ReactElement | null;
