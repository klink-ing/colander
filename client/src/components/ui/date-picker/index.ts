export { Root, RootInner } from "./root";
export { DaysGrid, WeekTemplate, DayTemplate } from "./grid";
export { DayLabels, DayLabelTemplate as DayLabel } from "./labels";
export {
  DateString,
  TimeString,
  MonthString,
  PrevMonthButton,
  NextMonthButton,
} from "./navigation";
export { createDatePicker } from "./factory";
export { useDatePicker } from "./context";

export {
  useRootState,
  useNavButton,
  useDaysGridKeyboard,
  useDayTemplateState,
  useDayLabelState,
} from "./hooks";

import { Root } from "./root";
import { DaysGrid, WeekTemplate, DayTemplate } from "./grid";
import { DayLabels, DayLabelTemplate } from "./labels";
import {
  DateString,
  TimeString,
  MonthString,
  PrevMonthButton,
  NextMonthButton,
} from "./navigation";

export const DatePicker = {
  Root,
  DaysGrid,
  WeekTemplate,
  DayTemplate,
  DayLabels,
  DayLabel: DayLabelTemplate,
  DateString,
  TimeString,
  MonthString,
  PrevMonthButton,
  NextMonthButton,
};

export type {
  RootProps as DatePickerRootProps,
  RootState as DatePickerRootState,
  DaysGridProps as DatePickerDaysGridProps,
  DaysGridState as DatePickerDaysGridState,
  WeekTemplateProps as DatePickerWeekTemplateProps,
  WeekTemplateState as DatePickerWeekTemplateState,
  DayTemplateProps as DatePickerDayTemplateProps,
  DayTemplateState as DatePickerDayTemplateState,
  DayLabelsProps as DatePickerDayLabelsProps,
  DayLabelsState as DatePickerDayLabelsState,
  DayLabelProps as DatePickerDayLabelProps,
  DayLabelState as DatePickerDayLabelState,
  DateStringProps as DatePickerDateStringProps,
  DateStringState as DatePickerDateStringState,
  TimeStringProps as DatePickerTimeStringProps,
  TimeStringState as DatePickerTimeStringState,
  MonthStringProps as DatePickerMonthStringProps,
  MonthStringState as DatePickerMonthStringState,
  PrevMonthButtonProps as DatePickerPrevMonthButtonProps,
  NextMonthButtonProps as DatePickerNextMonthButtonProps,
  NavButtonState as DatePickerNavButtonState,
  ValueFormat as DatePickerValueFormat,
  DateValueObject as DatePickerDateValueObject,
  ValueForFormat as DatePickerValueForFormat,
  RawValueForFormat as DatePickerRawValueForFormat,
  PlainDateObject as DatePickerPlainDateObject,
  TypedDatePicker as DatePickerTyped,
  TypedRootProps as DatePickerTypedRootProps,
  TemporalNamespace as DatePickerTemporalNamespace,
  CreateDatePickerOptions as DatePickerCreateOptions,
} from "./types";
