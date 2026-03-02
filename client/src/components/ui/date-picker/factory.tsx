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
import type { ValueFormat, CreateDatePickerOptions } from "./types";

export function createDatePicker<F extends ValueFormat>(
  format: F,
  options?: CreateDatePickerOptions,
) {
  const TypedRoot = (
    props: Omit<ComponentProps<typeof Root<F>>, "format" | "temporal">,
  ) => {
    return <Root {...props} format={format} temporal={options?.temporal} />;
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
    DateString: DateString<F>,
    TimeString: TimeString<F>,
    MonthYearString: MonthYearString<F>,
    PrevMonthButton: PrevMonthButton<F>,
    NextMonthButton: NextMonthButton<F>,
  };
}

export type Components<F extends ValueFormat> = ReturnType<
  typeof createDatePicker<F>
>;
