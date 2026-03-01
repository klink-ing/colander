import { createElement } from "react";
import { resolveTemporal } from "./utils";
import { RootInner } from "./root";
import { DaysGrid, WeekTemplate, DayTemplate } from "./grid";
import { DayLabels, DayLabelTemplate } from "./labels";
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
    DaysGrid,
    WeekTemplate,
    DayTemplate,
    DayLabels,
    DayLabelTemplate,
    DateString,
    TimeString,
    MonthYearString,
    PrevMonthButton,
    NextMonthButton,
  };
}
