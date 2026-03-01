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
    Grid: DatePicker.Grid,
    GridHeader: DatePicker.GridHeader,
    GridHeaderCell: DatePicker.GridHeaderCell,
    GridBody: DatePicker.GridBody,
    WeekTemplate: DatePicker.WeekTemplate,
    DayCellTemplate: DatePicker.DayCellTemplate,
    DayButton: DatePicker.DayButton,
    DateString: DatePicker.DateString,
    TimeString: DatePicker.TimeString,
    MonthYearString: DatePicker.MonthYearString,
    PrevMonthButton: DatePicker.PrevMonthButton,
    NextMonthButton: DatePicker.NextMonthButton,
  } as TypedDatePicker<F>;
}
