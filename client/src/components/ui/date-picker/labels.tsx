import { useMemo } from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { useGridHeaderCellState } from "./hooks";
import type {
  GridHeaderCellProps,
  GridHeaderState,
  GridHeaderProps,
} from "./types";

function GridHeaderCellInstance(
  props: Omit<GridHeaderCellProps, "index"> & {
    index: number;
    ref?: React.Ref<HTMLTableCellElement>;
  },
) {
  const { ref, render, index, ...otherProps } = props;
  const { state, stateAttributesMapping, defaultProps } =
    useGridHeaderCellState(index);

  return useRender({
    defaultTagName: "th",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping,
    props: mergeProps<"th">(defaultProps, otherProps),
  });
}

export function GridHeaderCell(
  props: GridHeaderCellProps & { ref?: React.Ref<HTMLTableCellElement> },
) {
  const { index: indexProp, ...restProps } = props;
  if (indexProp != null) {
    return <GridHeaderCellInstance {...restProps} index={indexProp} />;
  }
  return (
    <>
      {Array.from({ length: 7 }, (_, i) => (
        <GridHeaderCellInstance key={i} {...restProps} index={i} />
      ))}
    </>
  );
}

export function GridHeader(
  props: GridHeaderProps & { ref?: React.Ref<HTMLTableSectionElement> },
) {
  const { ref, render, children, ...otherProps } = props;

  const state = useMemo<GridHeaderState>(() => ({}), []);

  const defaultProps: Record<string, unknown> = {
    children: <tr>{children ?? <GridHeaderCell />}</tr>,
  };

  return useRender({
    defaultTagName: "thead",
    render,
    ref: ref ? [ref] : [],
    state,
    props: mergeProps<"thead">(defaultProps, otherProps),
  });
}
