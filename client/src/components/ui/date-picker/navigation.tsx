import { useId, useMemo, useEffect } from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { useDatePicker } from "./context";
import { useNavButton } from "./hooks";
import { selectedToZdt, zdtToNativeDate } from "./utils";
import type {
  DateStringState,
  DateStringProps,
  TimeStringState,
  TimeStringProps,
  MonthYearStringState,
  MonthYearStringProps,
  PrevMonthButtonProps,
  NextMonthButtonProps,
} from "./types";

export function DateString(
  props: DateStringProps & { ref?: React.Ref<HTMLSpanElement> },
) {
  const { ref, render, locales, options, ...otherProps } = props;
  const {
    currentDateTime,
    selected,
    timeZone,
    locale,
    temporal: T,
  } = useDatePicker();

  const selectedZdt = selectedToZdt(selected, timeZone, T);
  const displayDate = selectedZdt
    ? zdtToNativeDate(selectedZdt)
    : new Date(currentDateTime.year, currentDateTime.month - 1, 1);

  const formatted = displayDate.toLocaleDateString(locales ?? locale, options);

  const state = useMemo<DateStringState>(
    () => ({
      month: displayDate.getMonth() + 1,
      year: displayDate.getFullYear(),
      day: displayDate.getDate(),
    }),
    [displayDate],
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
    props: mergeProps<"span">(defaultProps, otherProps),
  });
}

export function TimeString(
  props: TimeStringProps & { ref?: React.Ref<HTMLSpanElement> },
) {
  const { ref, render, locales, options, ...otherProps } = props;
  const { selected, timeZone, locale, temporal: T } = useDatePicker();

  const selZdt = selectedToZdt(selected, timeZone, T);
  const displayDate = selZdt
    ? zdtToNativeDate(selZdt)
    : zdtToNativeDate(T.Now.zonedDateTimeISO(timeZone));

  const mergedOptions: Intl.DateTimeFormatOptions = { timeZone, ...options };
  const formatted = displayDate.toLocaleTimeString(
    locales ?? locale,
    mergedOptions,
  );

  const state = useMemo<TimeStringState>(
    () => ({
      hour: selZdt?.hour ?? T.Now.zonedDateTimeISO(timeZone).hour,
      minute: selZdt?.minute ?? T.Now.zonedDateTimeISO(timeZone).minute,
      second: selZdt?.second ?? T.Now.zonedDateTimeISO(timeZone).second,
    }),
    [selZdt, timeZone, T],
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
export function MonthYearString(
  props: MonthYearStringProps & { ref?: React.Ref<HTMLSpanElement> },
) {
  const { ref, render, locales, options, ...otherProps } = props;
  const { currentDateTime, locale, setGridLabelId } = useDatePicker();

  const id = useId();

  useEffect(() => {
    setGridLabelId(id);
    return () => setGridLabelId(undefined);
  }, [id, setGridLabelId]);

  const displayDate = new Date(currentDateTime.year, currentDateTime.month - 1, 1);
  const defaultOptions: Intl.DateTimeFormatOptions = options ?? {
    month: "long",
    year: "numeric",
  };
  const formatted = displayDate.toLocaleDateString(
    locales ?? locale,
    defaultOptions,
  );

  const state = useMemo<MonthYearStringState>(
    () => ({ month: currentDateTime.month, year: currentDateTime.year }),
    [currentDateTime.month, currentDateTime.year],
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
    props: mergeProps<"span">(defaultProps, otherProps),
  });
}

export function PrevMonthButton(
  props: PrevMonthButtonProps & { ref?: React.Ref<HTMLButtonElement> },
) {
  const { ref, render, ...otherProps } = props;
  const { state, defaultProps } = useNavButton("prev");

  return useRender({
    defaultTagName: "button",
    render,
    ref: ref ? [ref] : [],
    state,
    props: mergeProps<"button">(defaultProps, otherProps),
  });
}

export function NextMonthButton(
  props: NextMonthButtonProps & { ref?: React.Ref<HTMLButtonElement> },
) {
  const { ref, render, ...otherProps } = props;
  const { state, defaultProps } = useNavButton("next");

  return useRender({
    defaultTagName: "button",
    render,
    ref: ref ? [ref] : [],
    state,
    props: mergeProps<"button">(defaultProps, otherProps),
  });
}
