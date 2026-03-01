import { useMemo } from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { useDaysGridHeaderCellState } from "./hooks";
import type {
  DaysGridHeaderCellProps,
  DaysGridHeaderState,
  DaysGridHeaderProps,
} from "./types";

function DaysGridHeaderCellInstance(
  props: Omit<DaysGridHeaderCellProps, "index"> & {
    index: number;
    ref?: React.Ref<HTMLTableCellElement>;
  },
) {
  const { ref, render, index, ...otherProps } = props;
  const { state, stateAttributesMapping, defaultProps } =
    useDaysGridHeaderCellState(index);

  return useRender({
    defaultTagName: "th",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping,
    props: mergeProps<"th">(defaultProps, otherProps),
  });
}

export function DaysGridHeaderCellTemplate(
  props: DaysGridHeaderCellProps & { ref?: React.Ref<HTMLTableCellElement> },
) {
  const { index: indexProp, ...restProps } = props;
  if (indexProp != null) {
    return <DaysGridHeaderCellInstance {...restProps} index={indexProp} />;
  }
  return (
    <>
      {Array.from({ length: 7 }, (_, i) => (
        <DaysGridHeaderCellInstance key={i} {...restProps} index={i} />
      ))}
    </>
  );
}

export function DaysGridHeader(
  props: DaysGridHeaderProps & { ref?: React.Ref<HTMLTableSectionElement> },
) {
  const { ref, render, children, ...otherProps } = props;

  const state = useMemo<DaysGridHeaderState>(() => ({}), []);

  const defaultProps: Record<string, unknown> = {
    children: <tr>{children ?? <DaysGridHeaderCellTemplate />}</tr>,
  };

  return useRender({
    defaultTagName: "thead",
    render,
    ref: ref ? [ref] : [],
    state,
    props: mergeProps<"thead">(defaultProps, otherProps),
  });
}
