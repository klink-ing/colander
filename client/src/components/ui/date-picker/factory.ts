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

const components = {
  Grid,
  GridHeader,
  GridHeaderCell,
  GridBody,
  WeekTemplate,
  DayCellTemplate,
  DayButton,
  DateString,
  TimeString,
  MonthYearString,
  PrevMonthButton,
  NextMonthButton,
};

export function createDatePicker<F extends ValueFormat>(
  format: F,
  options?: CreateDatePickerOptions,
): TypedDatePicker<F> {
  const resolvedTemporal = resolveTemporal(options?.temporal);

  const Root = ((
    props: TypedRootProps<F> & { ref?: React.Ref<HTMLDivElement> },
  ) => {
    return createElement(RootInner, {
      ...props,
      format,
      _resolvedTemporal: resolvedTemporal,
    } as any);
  }) as TypedDatePicker<F>["Root"];

  return {
    Root,
    ...components,
  } as TypedDatePicker<F>;
}
