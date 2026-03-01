import { createElement } from "react";
import { resolveTemporal } from "./utils";
import * as DatePicker from "./index";
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
import type {
  ValueFormat,
  TypedRootProps,
  CreateDatePickerOptions,
} from "./types";

export function createDatePicker<F extends ValueFormat>(
  format: F,
  options?: CreateDatePickerOptions,
) {
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
