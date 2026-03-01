import { createElement } from "react";
import { resolveTemporal } from "./utils";
import { RootInner } from "./root";
import { Grid, GridBody, WeekTemplate, DayCellTemplate, DayButton } from "./grid";
import { GridHeader, GridHeaderCell } from "./labels";
import {
  DateString,
  TimeString,
  MonthYearString,
  PrevMonthButton,
  NextMonthButton,
} from "./navigation";
import type {
  ValueFormat,
  TypedDatePicker,
  TypedRootProps,
  CreateDatePickerOptions,
} from "./types";

export function createDatePicker<F extends ValueFormat>(
  format: F,
  options?: CreateDatePickerOptions,
): TypedDatePicker<F> {
  const resolvedTemporal = resolveTemporal(options?.temporal);

  const TypedRoot = ((
    props: TypedRootProps<F> & { ref?: React.Ref<HTMLDivElement> },
  ) => {
    return createElement(RootInner, {
      ...props,
      format,
      _resolvedTemporal: resolvedTemporal,
    } as any);
  }) as TypedDatePicker<F>["Root"];

  return {
    Root: TypedRoot,
    Grid: Grid as TypedDatePicker<F>["Grid"],
    GridHeader: GridHeader as TypedDatePicker<F>["GridHeader"],
    GridHeaderCell: GridHeaderCell as TypedDatePicker<F>["GridHeaderCell"],
    GridBody: GridBody as TypedDatePicker<F>["GridBody"],
    WeekTemplate: WeekTemplate as TypedDatePicker<F>["WeekTemplate"],
    DayCellTemplate: DayCellTemplate as TypedDatePicker<F>["DayCellTemplate"],
    DayButton: DayButton as TypedDatePicker<F>["DayButton"],
    DateString: DateString as TypedDatePicker<F>["DateString"],
    TimeString: TimeString as TypedDatePicker<F>["TimeString"],
    MonthYearString: MonthYearString as TypedDatePicker<F>["MonthYearString"],
    PrevMonthButton: PrevMonthButton as TypedDatePicker<F>["PrevMonthButton"],
    NextMonthButton: NextMonthButton as TypedDatePicker<F>["NextMonthButton"],
  };
}
