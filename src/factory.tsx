import { type ComponentProps } from "react";
import { Root } from "./root";
import {
  Grid,
  GridHeader,
  GridHeaderCell,
  GridBody,
  WeekTemplate,
  DayCellTemplate,
  DayButton,
} from "./grid";
import {
  DateString,
  TimeString,
  MonthYearString,
  PrevMonthButton,
  NextMonthButton,
} from "./navigation";
import { SelectedRange } from "./selected-range";
import { RangeStartDragHandle, RangeEndDragHandle } from "./drag-handle";
import { WeekNumberCell, WeekNumberHeader } from "./week-number";
import type { ValueFormat, CreateDatePickerOptions } from "./types";

/**
 * Creates a type-narrowed set of DatePicker components for a specific
 * {@link ValueFormat}. The returned `Root` component automatically passes
 * the `format` and optional `temporal` polyfill, so consumers don't need to.
 */
export function createDatePicker<F extends ValueFormat>(
  format: F,
  options?: CreateDatePickerOptions,
) {
  const TypedRoot = (
    props: Omit<ComponentProps<typeof Root<F>>, "format" | "temporal">,
  ) => {
    return (
      <Root {...(props as any)} format={format} temporal={options?.temporal} />
    );
  };

  return {
    Root: TypedRoot,
    Grid: Grid<F>,
    GridHeader: GridHeader<F>,
    GridHeaderCell: GridHeaderCell<F>,
    GridBody: GridBody<F>,
    WeekTemplate: WeekTemplate<F>,
    DayCellTemplate: DayCellTemplate<F>,
    DayButton: DayButton<F>,
    SelectedRange: SelectedRange<F>,
    RangeStartDragHandle: RangeStartDragHandle<F>,
    RangeEndDragHandle: RangeEndDragHandle<F>,
    DateString: DateString<F>,
    TimeString: TimeString<F>,
    MonthYearString: MonthYearString<F>,
    PrevMonthButton: PrevMonthButton<F>,
    NextMonthButton: NextMonthButton<F>,
    WeekNumberCell: WeekNumberCell<F>,
    WeekNumberHeader: WeekNumberHeader<F>,
  };
}

/** The component map returned by {@link createDatePicker}. */
export type Components<F extends ValueFormat> = ReturnType<
  typeof createDatePicker<F>
>;
