import { type ComponentProps } from "react";
import { RangeStartDragHandle, RangeEndDragHandle } from "./drag-handle";
import {
  Grid,
  GridHeader,
  GridHeaderCell,
  GridBody,
  WeekTemplate,
  DayCellTemplate,
  DayButton,
} from "./grid";
import { MonthView } from "./month-view";
import {
  DateString,
  TimeString,
  MonthYearString,
  PrevMonthButton,
  NextMonthButton,
} from "./navigation";
import { RangePreview } from "./range-preview";
import { RangeSelected } from "./selected-range";
import type { ValueFormat, CreateDatePickerOptions } from "./types";
import { WeekNumberCell, WeekNumberHeader } from "./week-number";

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
    props: Omit<ComponentProps<typeof MonthView<F>>, "format" | "temporal">,
  ) => {
    return (
      <MonthView
        {...(props as any)}
        format={format}
        temporal={options?.temporal}
      />
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
    RangeSelected: RangeSelected<F>,
    RangePreview: RangePreview<F>,
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
