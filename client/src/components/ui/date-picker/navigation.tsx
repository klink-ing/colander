import { useMemo } from "react";
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
  MonthStringState,
  MonthStringProps,
  PrevMonthButtonProps,
  NextMonthButtonProps,
} from "./types";

export function DateString(
  props: DateStringProps & { ref?: React.Ref<HTMLSpanElement> },
) {
  const { ref, render, locales, options, ...otherProps } = props;
  const {
    currentMonth,
    selected,
    timeZone,
    locale,
    temporal: T,
  } = useDatePicker();

  const selectedZdt = selectedToZdt(selected, timeZone, T);
  const displayDate = selectedZdt
    ? zdtToNativeDate(selectedZdt)
    : new Date(currentMonth.year, currentMonth.month - 1, 1);

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

export function MonthString(
  props: MonthStringProps & { ref?: React.Ref<HTMLSpanElement> },
) {
  const { ref, render, locales, options, ...otherProps } = props;
  const { currentMonth, locale } = useDatePicker();

  const displayDate = new Date(currentMonth.year, currentMonth.month - 1, 1);
  const defaultOptions: Intl.DateTimeFormatOptions = options ?? {
    month: "long",
  };
  const formatted = displayDate.toLocaleDateString(
    locales ?? locale,
    defaultOptions,
  );

  const state = useMemo<MonthStringState>(
    () => ({ month: currentMonth.month, year: currentMonth.year }),
    [currentMonth],
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
