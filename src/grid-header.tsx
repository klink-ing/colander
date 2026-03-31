import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { StateAttributesMapping } from "node_modules/@base-ui/react/esm/utils/getStateAttributesProps";
import { useMemo } from "react";
import { useCalendarStable } from "./calendar-context";
import { useMonthViewState } from "./month-view-context";
import type {
  ValueFormat,
  GridHeaderCellProps,
  GridHeaderState,
  GridHeaderProps,
  GridHeaderCellState,
} from "./types";
import { getWeekdayNames, getReferenceWeekStart } from "./utils";

function useGridHeaderCellState<F extends ValueFormat = ValueFormat>(
  index: number,
) {
  const { locale, temporal: T, weekStartDay } = useCalendarStable();
  const { rootState } = useMonthViewState();

  const weekdayNames = useMemo(
    () => getWeekdayNames(locale, T, weekStartDay),
    [locale, T, weekStartDay],
  );

  const state = useMemo<GridHeaderCellState<F>>(
    () => ({
      root: rootState as unknown as GridHeaderCellState<F>["root"],
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
} as const satisfies StateAttributesMapping<GridHeaderState>;

const gridHeaderCellStateAttributesMapping = {
  root: () => null,
  dayOfWeek: () => null,
  long: () => null,
  short: () => null,
  narrow: () => null,
} as const satisfies StateAttributesMapping<GridHeaderCellState>;

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

/**
 * Renders weekday column headers (`<th>`). When no `index` is provided,
 * renders all 7 days (Sunday–Saturday). Each cell includes `abbr` and
 * `aria-label` with the full weekday name.
 */
export function GridHeaderCell<F extends ValueFormat = ValueFormat>(
  props: GridHeaderCellProps<F> & { ref?: React.Ref<HTMLTableCellElement> },
) {
  const { index: indexProp, ...restProps } = props;
  const { temporal: T } = useCalendarStable();
  const Instance = GridHeaderCellInstance<F>;

  if (indexProp != null) {
    return <Instance {...restProps} index={indexProp} />;
  }

  const daysInWeek = getReferenceWeekStart(T).daysInWeek;

  return (
    <>
      {Array.from({ length: daysInWeek }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length weekday headers never reorder
        <Instance key={i} {...restProps} index={i} />
      ))}
    </>
  );
}

/** Table header section (`<thead>`) wrapping a row of {@link GridHeaderCell}s. */
export function GridHeader<F extends ValueFormat = ValueFormat>(
  props: GridHeaderProps<F> & { ref?: React.Ref<HTMLTableSectionElement> },
) {
  const { ref, render, children, ...otherProps } = props;
  const { rootState } = useMonthViewState();

  const state = useMemo<GridHeaderState<F>>(
    () => ({ root: rootState as unknown as GridHeaderState<F>["root"] }),
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
