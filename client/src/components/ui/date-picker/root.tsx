import { useMemo } from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { DatePickerContext } from "./context";
import { useRootState } from "./hooks";
import { resolveTemporal } from "./utils";
import { getSystemTimeZone } from "./utils";
import type { RootProps, ValueFormat } from "./types";

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
    isDateDisabled,
    timeZone: timeZoneProp,
    locale: localeProp,
    temporal: temporalProp,
    ...otherProps
  } = props as any;
  const T = useMemo(() => resolveTemporal(temporalProp), [temporalProp]);
  const timeZone = timeZoneProp ?? getSystemTimeZone(T);
  const locale = localeProp ?? "en-US";
  const resolvedFormat: ValueFormat = formatProp ?? "PlainDate";
  const selectionMode = selectionModeProp ?? "single";

  const { ctx, state, stateAttributesMapping } = useRootState<F>({
    format: resolvedFormat as F,
    selectionMode,
    value,
    defaultValue,
    onValueChange,
    min,
    max,
    disabled: disabled ?? false,
    isDateDisabled,
    timeZone,
    locale,
    temporal: T,
  });

  const rendered = useRender({
    defaultTagName: "div",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping,
    props: mergeProps<"div">(
      { children, ...(disabled ? { "aria-disabled": true } : {}) },
      otherProps,
    ),
  });

  return (
    <DatePickerContext.Provider value={ctx}>
      {rendered}
    </DatePickerContext.Provider>
  );
}
