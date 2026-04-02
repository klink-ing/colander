import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { forwardRef, useMemo } from "react";
import { useCalendarStable } from "./calendar-context";
import { useMonthViewState } from "./month-view-context";
import type { StateAttributesMapping } from "./types";
import type {
  ValueFormat,
  GridHeaderCellProps,
  GridHeaderState,
  GridHeaderProps,
  GridHeaderCellState,
} from "./types";
import { getWeekdayNames, getReferenceWeekStart } from "./utils";

function useGridHeaderCellState(index: number) {
  const { locale, temporal: T, weekStartDay } = useCalendarStable();
  const { rootState } = useMonthViewState();

  const weekdayNames = useMemo(
    () => getWeekdayNames(locale, T, weekStartDay),
    [locale, T, weekStartDay],
  );

  const state = useMemo<GridHeaderCellState>(
    () => ({
      root: rootState as unknown as GridHeaderCellState["root"],
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

const GridHeaderCellInstance = forwardRef<
  HTMLTableCellElement,
  Omit<GridHeaderCellProps, "index"> & { index: number }
>(function GridHeaderCellInstance(props, ref) {
  const { render, index, ...otherProps } = props;
  const { state, defaultProps } = useGridHeaderCellState(index);

  return useRender({
    defaultTagName: "th",
    render,
    ref: ref ? [ref] : [],
    state,
    stateAttributesMapping: gridHeaderCellStateAttributesMapping,
    props: mergeProps<"th">(defaultProps, otherProps),
  });
}) as <F extends ValueFormat = ValueFormat>(
  props: Omit<GridHeaderCellProps<F>, "index"> & {
    index: number;
  } & React.RefAttributes<HTMLTableCellElement>,
) => React.ReactElement | null;

/**
 * Renders weekday column headers (`<th>`). When no `index` is provided,
 * renders all 7 days (Sunday–Saturday). Each cell includes `abbr` and
 * `aria-label` with the full weekday name.
 */
export const GridHeaderCell = forwardRef<
  HTMLTableCellElement,
  GridHeaderCellProps
>(function GridHeaderCell(props, ref) {
  const { index: indexProp, ...restProps } = props;
  const { temporal: T } = useCalendarStable();
  const Instance = GridHeaderCellInstance;

  if (indexProp != null) {
    return <Instance {...restProps} ref={ref} index={indexProp} />;
  }

  const daysInWeek = getReferenceWeekStart(T).daysInWeek;

  return (
    <>
      {Array.from({ length: daysInWeek }, (_, i) => (
        <Instance key={i} {...restProps} ref={ref} index={i} />
      ))}
    </>
  );
}) as <F extends ValueFormat = ValueFormat>(
  props: GridHeaderCellProps<F> & React.RefAttributes<HTMLTableCellElement>,
) => React.ReactElement | null;

/** Table header section (`<thead>`) wrapping a row of {@link GridHeaderCell}s. */
export const GridHeader = forwardRef<HTMLTableSectionElement, GridHeaderProps>(
  function GridHeader(props, ref) {
    const { render, children, ...otherProps } = props;
    const { rootState } = useMonthViewState();

    const state = useMemo<GridHeaderState>(
      () => ({ root: rootState as unknown as GridHeaderState["root"] }),
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
  },
) as <F extends ValueFormat = ValueFormat>(
  props: GridHeaderProps<F> & React.RefAttributes<HTMLTableSectionElement>,
) => React.ReactElement | null;
