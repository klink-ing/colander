import { useMemo } from "react";
import { useRender } from "@base-ui/react/use-render";
import { mergeProps } from "@base-ui/react/merge-props";
import { useDatePicker } from "./context";
import { getWeekdayNames } from "./utils";
import type {
  ValueFormat,
  GridHeaderCellProps,
  GridHeaderState,
  GridHeaderProps,
  GridHeaderCellState,
} from "./types";

function useGridHeaderCellState<F extends ValueFormat = ValueFormat>(
  index: number,
) {
  const { locale, temporal: T, rootState } = useDatePicker<F>();

  const weekdayNames = useMemo(() => getWeekdayNames(locale, T), [locale, T]);

  const state = useMemo<GridHeaderCellState<F>>(
    () => ({
      root: rootState,
      dayOfWeek: index,
      long: weekdayNames[index].long,
      short: weekdayNames[index].short,
      narrow: weekdayNames[index].narrow,
    }),
    [rootState, index, weekdayNames],
  );

  const defaultProps: Record<string, unknown> = {
    scope: "col",
    abbr: state.long,
    "aria-label": state.long,
    children: state.narrow,
  };

  return { state, defaultProps };
}

const gridHeaderStateAttributesMapping = {
  root: () => null,
};

const gridHeaderCellStateAttributesMapping = {
  root: () => null,
  dayOfWeek: () => null,
  long: () => null,
  short: () => null,
  narrow: () => null,
};

function GridHeaderCellInstance<F extends ValueFormat = ValueFormat>(
  props: Omit<GridHeaderCellProps<F>, "index"> & {
    index: number;
    ref?: React.Ref<HTMLTableCellElement>;
  },
) {
  const { ref, render, index, ...otherProps } = props;
  const { state, defaultProps } = useGridHeaderCellState<F>(index);

  return useRender({
    defaultTagName: "th",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping: gridHeaderCellStateAttributesMapping,
    props: mergeProps<"th">(defaultProps, otherProps),
  });
}

export function GridHeaderCell<F extends ValueFormat = ValueFormat>(
  props: GridHeaderCellProps<F> & { ref?: React.Ref<HTMLTableCellElement> },
) {
  const { index: indexProp, ...restProps } = props;
  const Instance = GridHeaderCellInstance<F>;

  if (indexProp != null) {
    return <Instance {...restProps} index={indexProp} />;
  }
  return (
    <>
      {Array.from({ length: 7 }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length weekday headers never reorder
        <Instance key={i} {...restProps} index={i} />
      ))}
    </>
  );
}

export function GridHeader<F extends ValueFormat = ValueFormat>(
  props: GridHeaderProps<F> & { ref?: React.Ref<HTMLTableSectionElement> },
) {
  const { ref, render, children, ...otherProps } = props;
  const { rootState } = useDatePicker<F>();

  const state = useMemo<GridHeaderState<F>>(
    () => ({ root: rootState }),
    [rootState],
  );

  const defaultProps: Record<string, unknown> = {
    children: <tr>{children ?? <GridHeaderCell />}</tr>,
  };

  return useRender({
    defaultTagName: "thead",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping: gridHeaderStateAttributesMapping,
    props: mergeProps<"thead">(defaultProps, otherProps),
  });
}
