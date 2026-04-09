import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import React, { createContext, useContext, forwardRef, useMemo } from "react";
import type { StateAttributesMapping } from "./types";

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
export const MonthSeparatorDataContext = createContext<MonthSeparatorState | null>(null);

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
  firstDayVisible: (v: boolean) => (v ? { "data-first-day-visible": "" } : null),
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

function MonthSeparatorMonthFn(props: MonthChildProps, ref: React.ForwardedRef<HTMLSpanElement>) {
  const { render, locale = "en-US", format = "long", ...otherProps } = props;
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

const MonthSeparatorMonth = forwardRef(MonthSeparatorMonthFn);

// ─── Child: Year ─────────────────────────────────────────────────────

type YearChildProps = useRender.ComponentProps<"span", MonthSeparatorState>;

function MonthSeparatorYearFn(props: YearChildProps, ref: React.ForwardedRef<HTMLSpanElement>) {
  const { render, ...otherProps } = props;
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

const MonthSeparatorYear = forwardRef(MonthSeparatorYearFn);

// ─── Child: WeekCount ────────────────────────────────────────────────

type WeekCountChildProps = useRender.ComponentProps<"span", MonthSeparatorState>;

function MonthSeparatorWeekCountFn(
  props: WeekCountChildProps,
  ref: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, ...otherProps } = props;
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

const MonthSeparatorWeekCount = forwardRef(MonthSeparatorWeekCountFn);

// ─── MonthSeparatorRow ──────────────────────────────────────────────

type MonthSeparatorRowProps = useRender.ComponentProps<"tr", MonthSeparatorState>;

function MonthSeparatorRowFn(
  props: MonthSeparatorRowProps,
  ref: React.ForwardedRef<HTMLTableRowElement>,
) {
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
    <MonthSeparatorDataContext.Provider value={data}>{rendered}</MonthSeparatorDataContext.Provider>
  );
}

/** Renders the `<tr>` for a month separator. Provides MonthSeparatorDataContext. */
export const MonthSeparatorRow = forwardRef(MonthSeparatorRowFn);

// ─── MonthSeparatorCell ─────────────────────────────────────────────

type MonthSeparatorCellProps = useRender.ComponentProps<"td", MonthSeparatorState>;

function MonthSeparatorCellFn(
  props: MonthSeparatorCellProps,
  ref: React.ForwardedRef<HTMLTableCellElement>,
) {
  const { render, ...otherProps } = props;
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

/** Renders the `<td>` inside a MonthSeparatorRow. */
export const MonthSeparatorCell = forwardRef(MonthSeparatorCellFn);

// ─── MonthSeparator (convenience) ───────────────────────────────────

type MonthSeparatorProps = useRender.ComponentProps<"tr", MonthSeparatorState>;

function MonthSeparatorFn(
  props: MonthSeparatorProps,
  ref: React.ForwardedRef<HTMLTableRowElement>,
) {
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
    <MonthSeparatorDataContext.Provider value={data}>{rendered}</MonthSeparatorDataContext.Provider>
  );
}

/**
 * Convenience component: `<tr><td colspan="7">children</td></tr>`.
 * Combines MonthSeparatorRow + MonthSeparatorCell.
 * Default children: `<Month /> <Year />`.
 */
export const MonthSeparator = forwardRef(MonthSeparatorFn);

export { MonthSeparatorMonth, MonthSeparatorYear, MonthSeparatorWeekCount };
