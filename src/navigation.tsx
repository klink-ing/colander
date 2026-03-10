import { useId, useMemo, useEffect } from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { StateAttributesMapping } from "node_modules/@base-ui/react/esm/utils/getStateAttributesProps";
import { useDatePicker } from "./context";
import { selectedToZdt, zdtToNativeDate, calendarForLocale } from "./utils";
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

/**
 * Displays the currently selected (or current) date as localized text.
 * Renders a `<span>` with `aria-live="polite"`.
 */
export function DateString<F extends ValueFormat = ValueFormat>(
  props: DateStringProps<F> & { ref?: React.Ref<HTMLSpanElement> },
) {
  const { ref, render, locales, options, ...otherProps } = props;
  const {
    currentDateTime,
    selected,
    timeZone,
    locale,
    temporal: T,
    rootState,
  } = useDatePicker<F>();

  const selectedZdt = selectedToZdt(selected, timeZone, T);
  const displayDate = selectedZdt
    ? zdtToNativeDate(selectedZdt)
    : new Date(currentDateTime.year, currentDateTime.month - 1, 1);

  const formatted = displayDate.toLocaleDateString(locales ?? locale, options);

  const state = useMemo<DateStringState<F>>(
    () => ({
      root: rootState,
      month: displayDate.getMonth() + 1,
      year: displayDate.getFullYear(),
      day: displayDate.getDate(),
    }),
    [rootState, displayDate],
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
 * Displays the currently selected time as localized text.
 * Falls back to the current time when nothing is selected.
 * Renders a `<span>` with `aria-live="polite"`.
 */
export function TimeString<F extends ValueFormat = ValueFormat>(
  props: TimeStringProps<F> & { ref?: React.Ref<HTMLSpanElement> },
) {
  const { ref, render, locales, options, ...otherProps } = props;
  const {
    selected,
    timeZone,
    locale,
    temporal: T,
    rootState,
  } = useDatePicker<F>();

  const selZdt = selectedToZdt(selected, timeZone, T);
  const displayDate = selZdt
    ? zdtToNativeDate(selZdt)
    : zdtToNativeDate(T.Now.zonedDateTimeISO(timeZone));

  const mergedOptions: Intl.DateTimeFormatOptions = { timeZone, ...options };
  const formatted = displayDate.toLocaleTimeString(
    locales ?? locale,
    mergedOptions,
  );

  const state = useMemo<TimeStringState<F>>(
    () => ({
      root: rootState,
      hour: selZdt?.hour ?? T.Now.zonedDateTimeISO(timeZone).hour,
      minute: selZdt?.minute ?? T.Now.zonedDateTimeISO(timeZone).minute,
      second: selZdt?.second ?? T.Now.zonedDateTimeISO(timeZone).second,
    }),
    [rootState, selZdt, timeZone, T],
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
export function MonthYearString<F extends ValueFormat = ValueFormat>(
  props: MonthYearStringProps<F> & { ref?: React.Ref<HTMLSpanElement> },
) {
  const { ref, render, locales, options, ...otherProps } = props;
  const { currentDateTime, locale, setGridLabelId, rootState } =
    useDatePicker<F>();

  const id = useId();

  useEffect(() => {
    setGridLabelId(id);
    return () => setGridLabelId(undefined);
  }, [id, setGridLabelId]);

  const displayDate = new Date(
    currentDateTime.year,
    currentDateTime.month - 1,
    1,
  );
  const defaultOptions: Intl.DateTimeFormatOptions = options ?? {
    month: "long",
    year: "numeric",
  };
  const formatted = displayDate.toLocaleDateString(
    locales ?? locale,
    defaultOptions,
  );

  const state = useMemo<MonthYearStringState<F>>(
    () => ({
      root: rootState,
      month: currentDateTime.month,
      year: currentDateTime.year,
    }),
    [rootState, currentDateTime.month, currentDateTime.year],
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

function useNavButton<F extends ValueFormat = ValueFormat>(
  direction: "prev" | "next",
) {
  const {
    goToPrevMonth,
    goToNextMonth,
    currentDateTime,
    disabled: globalDisabled,
    minValue,
    maxValue,
    locale,
    temporal: T,
    rootState,
  } = useDatePicker<F>();

  const destMonth =
    direction === "prev"
      ? currentDateTime.month === 1
        ? 12
        : currentDateTime.month - 1
      : currentDateTime.month === 12
        ? 1
        : currentDateTime.month + 1;

  const destYear =
    direction === "prev"
      ? currentDateTime.month === 1
        ? currentDateTime.year - 1
        : currentDateTime.year
      : currentDateTime.month === 12
        ? currentDateTime.year + 1
        : currentDateTime.year;

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

  const localeCalendar = useMemo(() => calendarForLocale(locale), [locale]);

  const target = useMemo(
    () =>
      T.PlainYearMonth.from({
        year: destYear,
        month: destMonth,
        calendar: localeCalendar,
      }),
    [destYear, destMonth, T, localeCalendar],
  );

  const state = useMemo<NavButtonState<F>>(
    () => ({ root: rootState, direction, disabled: isDisabled, target }),
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

/**
 * Button that navigates to the previous month. Automatically disabled
 * when the previous month falls before `min`. Exposes `data-direction="prev"`.
 */
export function PrevMonthButton<F extends ValueFormat = ValueFormat>(
  props: PrevMonthButtonProps<F> & { ref?: React.Ref<HTMLButtonElement> },
) {
  const { ref, render, ...otherProps } = props;
  const { state, defaultProps } = useNavButton<F>("prev");

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
export function NextMonthButton<F extends ValueFormat = ValueFormat>(
  props: NextMonthButtonProps<F> & { ref?: React.Ref<HTMLButtonElement> },
) {
  const { ref, render, ...otherProps } = props;
  const { state, defaultProps } = useNavButton<F>("next");

  return useRender({
    defaultTagName: "button",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping: navButtonStateAttributesMapping,
    props: mergeProps<"button">(defaultProps, otherProps),
  });
}
