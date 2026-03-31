import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { StateAttributesMapping } from "node_modules/@base-ui/react/esm/utils/getStateAttributesProps";
import { createContext, useContext, forwardRef, useMemo } from "react";

/** State exposed by the MonthSeparator component and its children. */
export type MonthSeparatorState = {
  /** Calendar month (1-12). */
  month: number;
  /** Calendar year. */
  year: number;
  /** True when this is the first month of a new year in the visible window. */
  firstOfYear: boolean;
  /** True for the separator at the top of the visible window. */
  firstVisible: boolean;
  /** Number of weeks of the previous month visible above this separator. */
  weeksVisibleBefore: number;
  /** Number of weeks of this month visible below this separator. */
  weeksVisibleAfter: number;
  /**
   * 0-based column index where the 1st of the month falls within the week row.
   * Accounts for week number column if present (column 0 = week number).
   */
  firstDayColumn: number;
  /** Total number of columns (7 days + optional week number column). */
  totalColumns: number;
  /** True when the 1st day of this month is visible in the weeks below. */
  firstDayVisible: boolean;
  /**
   * Number of week rows between this separator and the next separator
   * (or end of window). Use this for CSS grid `gridRow: span N` to
   * avoid overlapping the next month's label.
   */
  fullWeeksVisibleAfter: number;
  /** 1-based grid row index where this separator's weeks start. */
  gridRowStart: number;
};

/** Context providing MonthSeparator data to child components. */
export const MonthSeparatorDataContext =
  createContext<MonthSeparatorState | null>(null);

function useMonthSeparatorData(): MonthSeparatorState {
  const ctx = useContext(MonthSeparatorDataContext);
  if (!ctx) {
    throw new Error(
      "MonthSeparator child components must be used within a MonthSeparatorDataContext.Provider",
    );
  }
  return ctx;
}

const stateAttributesMapping = {
  month: (v: number) => ({ "data-month": String(v) }),
  year: (v: number) => ({ "data-year": String(v) }),
  firstOfYear: (v: boolean) => (v ? { "data-first-of-year": "" } : null),
  firstVisible: (v: boolean) => (v ? { "data-first-visible": "" } : null),
  weeksVisibleBefore: () => null,
  weeksVisibleAfter: () => null,
  firstDayColumn: (v: number) => ({ "data-first-day-column": String(v) }),
  totalColumns: (v: number) => ({ "data-total-columns": String(v) }),
  firstDayVisible: (v: boolean) =>
    v ? { "data-first-day-visible": "" } : null,
  fullWeeksVisibleAfter: (v: number) => ({
    "data-full-weeks-visible-after": String(v),
  }),
  gridRowStart: (v: number) => ({ "data-grid-row-start": String(v) }),
} as const satisfies StateAttributesMapping<MonthSeparatorState>;

// ─── Child: Month ────────────────────────────────────────────────────

type MonthChildProps = useRender.ComponentProps<"span", MonthSeparatorState> & {
  /** BCP 47 locale(s) for month name formatting. @default "en-US" */
  locale?: string;
  /** Month name format. @default "long" */
  format?: "long" | "short" | "narrow";
};

function MonthSeparatorMonth(
  props: MonthChildProps & { ref?: React.Ref<HTMLSpanElement> },
) {
  const {
    ref,
    render,
    locale = "en-US",
    format = "long",
    ...otherProps
  } = props;
  const data = useMonthSeparatorData();

  const monthName = useMemo(() => {
    const date = new Date(data.year, data.month - 1, 1);
    return new Intl.DateTimeFormat(locale, { month: format }).format(date);
  }, [data.year, data.month, locale, format]);

  return useRender({
    defaultTagName: "span",
    render,
    ref: ref ? [ref] : [],
    state: data,
    stateAttributesMapping,
    props: mergeProps<"span">({ children: monthName }, otherProps),
  });
}

// ─── Child: Year ─────────────────────────────────────────────────────

type YearChildProps = useRender.ComponentProps<"span", MonthSeparatorState>;

function MonthSeparatorYear(
  props: YearChildProps & { ref?: React.Ref<HTMLSpanElement> },
) {
  const { ref, render, ...otherProps } = props;
  const data = useMonthSeparatorData();

  return useRender({
    defaultTagName: "span",
    render,
    ref: ref ? [ref] : [],
    state: data,
    stateAttributesMapping,
    props: mergeProps<"span">({ children: data.year }, otherProps),
  });
}

// ─── Child: WeekCount ────────────────────────────────────────────────

type WeekCountChildProps = useRender.ComponentProps<
  "span",
  MonthSeparatorState
>;

function MonthSeparatorWeekCount(
  props: WeekCountChildProps & { ref?: React.Ref<HTMLSpanElement> },
) {
  const { ref, render, ...otherProps } = props;
  const data = useMonthSeparatorData();

  return useRender({
    defaultTagName: "span",
    render,
    ref: ref ? [ref] : [],
    state: data,
    stateAttributesMapping,
    props: mergeProps<"span">({ children: data.weeksVisibleAfter }, otherProps),
  });
}

// ─── MonthSeparatorRow ──────────────────────────────────────────────

type MonthSeparatorRowProps = useRender.ComponentProps<
  "tr",
  MonthSeparatorState
>;

/** Renders the `<tr>` for a month separator. Provides MonthSeparatorDataContext. */
const MonthSeparatorRowInner = forwardRef<
  HTMLTableRowElement,
  MonthSeparatorRowProps
>(function MonthSeparatorRow(props, ref) {
  const { render, ...otherProps } = props;
  const data = useMonthSeparatorData();

  const rendered = useRender({
    defaultTagName: "tr",
    render,
    ref: ref ? [ref] : [],
    state: data,
    stateAttributesMapping,
    props: mergeProps<"tr">({}, otherProps),
  });

  return (
    <MonthSeparatorDataContext.Provider value={data}>
      {rendered}
    </MonthSeparatorDataContext.Provider>
  );
});

// ─── MonthSeparatorCell ─────────────────────────────────────────────

type MonthSeparatorCellProps = useRender.ComponentProps<
  "td",
  MonthSeparatorState
>;

/** Renders the `<td>` inside a MonthSeparatorRow. */
function MonthSeparatorCellInner(
  props: MonthSeparatorCellProps & { ref?: React.Ref<HTMLTableCellElement> },
) {
  const { ref, render, ...otherProps } = props;
  const data = useMonthSeparatorData();

  return useRender({
    defaultTagName: "td",
    render,
    ref: ref ? [ref] : [],
    state: data,
    stateAttributesMapping,
    props: mergeProps<"td">({ colSpan: 7 }, otherProps),
  });
}

// ─── MonthSeparator (convenience) ───────────────────────────────────

type MonthSeparatorProps = useRender.ComponentProps<"tr", MonthSeparatorState>;

/**
 * Convenience component: `<tr><td colspan="7">children</td></tr>`.
 * Combines MonthSeparatorRow + MonthSeparatorCell.
 * Default children: `<Month /> <Year />`.
 */
const MonthSeparatorConvenience = forwardRef<
  HTMLTableRowElement,
  MonthSeparatorProps
>(function MonthSeparator(props, ref) {
  const { render, children, ...otherProps } = props;
  const data = useMonthSeparatorData();

  const rendered = useRender({
    defaultTagName: "tr",
    render,
    ref: ref ? [ref] : [],
    state: data,
    stateAttributesMapping,
    props: mergeProps<"tr">(
      {
        children: (
          <td colSpan={7}>
            {children ?? (
              <>
                <MonthSeparatorMonth /> <MonthSeparatorYear />
              </>
            )}
          </td>
        ),
      },
      otherProps,
    ),
  });

  return (
    <MonthSeparatorDataContext.Provider value={data}>
      {rendered}
    </MonthSeparatorDataContext.Provider>
  );
});

/**
 * Compound component for rendering month boundary separators.
 *
 * Convenience (combines Row + Cell):
 * - `MonthSeparator` — `<tr><td colspan="7">children</td></tr>`
 *
 * Granular:
 * - `MonthSeparator.Row` — `<tr>` (provides context)
 * - `MonthSeparator.Cell` — `<td>` (reads context)
 *
 * Content children:
 * - `MonthSeparator.Month` — month name
 * - `MonthSeparator.Year` — year number
 * - `MonthSeparator.WeekCount` — weeks of this month visible below
 */
export const MonthSeparator = Object.assign(MonthSeparatorConvenience, {
  Row: MonthSeparatorRowInner,
  Cell: MonthSeparatorCellInner,
  Month: MonthSeparatorMonth,
  Year: MonthSeparatorYear,
  WeekCount: MonthSeparatorWeekCount,
});
