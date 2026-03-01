import { createElement } from "react";
import { resolveTemporal } from "./utils";
import * as DatePicker from "./index";
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

  const Root = ((
    props: TypedRootProps<F> & { ref?: React.Ref<HTMLDivElement> },
  ) => {
    return createElement(DatePicker.RootInner, {
      ...props,
      format,
      _resolvedTemporal: resolvedTemporal,
    } as any);
  }) as TypedDatePicker<F>["Root"];

  return {
    Root,
    Grid: DatePicker.Grid<F>,
    GridHeader: DatePicker.GridHeader<F>,
    GridHeaderCell: DatePicker.GridHeaderCell<F>,
    GridBody: DatePicker.GridBody<F>,
    WeekTemplate: DatePicker.WeekTemplate<F>,
    DayCellTemplate: DatePicker.DayCellTemplate<F>,
    DayButton: DatePicker.DayButton<F>,
    DateString: DatePicker.DateString<F>,
    TimeString: DatePicker.TimeString<F>,
    MonthYearString: DatePicker.MonthYearString<F>,
    PrevMonthButton: DatePicker.PrevMonthButton<F>,
    NextMonthButton: DatePicker.NextMonthButton<F>,
  } as TypedDatePicker<F>;
}
