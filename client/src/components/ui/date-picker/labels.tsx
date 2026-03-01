import { useMemo } from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { useDayLabelState } from "./hooks";
import type {
  DayLabelProps,
  DayLabelsState,
  DayLabelsProps,
} from "./types";

function DayLabelInstance(
  props: Omit<DayLabelProps, "index"> & {
    index: number;
    ref?: React.Ref<HTMLTableCellElement>;
  },
) {
  const { ref, render, index, ...otherProps } = props;
  const { state, stateAttributesMapping, defaultProps } =
    useDayLabelState(index);

  return useRender({
    defaultTagName: "th",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping,
    props: mergeProps<"th">(defaultProps, otherProps),
  });
}

export function DayLabelTemplate(
  props: DayLabelProps & { ref?: React.Ref<HTMLTableCellElement> },
) {
  const { index: indexProp, ...restProps } = props;
  if (indexProp != null) {
    return <DayLabelInstance {...restProps} index={indexProp} />;
  }
  return (
    <>
      {Array.from({ length: 7 }, (_, i) => (
        <DayLabelInstance key={i} {...restProps} index={i} />
      ))}
    </>
  );
}

export function DayLabels(
  props: DayLabelsProps & { ref?: React.Ref<HTMLTableSectionElement> },
) {
  const { ref, render, children, ...otherProps } = props;

  const state = useMemo<DayLabelsState>(() => ({}), []);

  const defaultProps: Record<string, unknown> = {
    children: <tr>{children ?? <DayLabelTemplate />}</tr>,
  };

  return useRender({
    defaultTagName: "thead",
    render,
    ref: ref ? [ref] : [],
    state,
    props: mergeProps<"thead">(defaultProps, otherProps),
  });
}
