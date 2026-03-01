import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { DatePickerContext } from "./context";
import { useRootState } from "./hooks";
import { resolveTemporal } from "./utils";
import { getSystemTimeZone } from "./utils";
import type { RootProps, ValueFormat, TemporalNamespace } from "./types";

export function RootInner<F extends ValueFormat = ValueFormat>(
  props: RootProps<F> & {
    ref?: React.Ref<HTMLDivElement>;
    _resolvedTemporal?: TemporalNamespace;
  },
) {
  const {
    ref,
    render,
    children,
    format: formatProp,
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
    _resolvedTemporal,
    ...otherProps
  } = props;

  const T = _resolvedTemporal ?? resolveTemporal(temporalProp);
  const timeZone = timeZoneProp ?? getSystemTimeZone(T);
  const locale = localeProp ?? "en-US";
  const resolvedFormat: ValueFormat = formatProp ?? "PlainDate";

  const { ctx, state, stateAttributesMapping } = useRootState<F>({
    format: resolvedFormat as F,
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

export const Root = RootInner as <F extends ValueFormat = ValueFormat>(
  props: RootProps<F> & { ref?: React.Ref<HTMLDivElement> },
) => React.ReactElement | null;
