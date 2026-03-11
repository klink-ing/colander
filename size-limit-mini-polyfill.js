// Simulates a consumer app using the built-in mini Temporal polyfill.
// Used by size-limit to measure bundle cost without the full @js-temporal/polyfill.
import { Temporal } from "./dist/index.js";
import {
  Root,
  Grid,
  GridBody,
  GridHeader,
  GridHeaderCell,
  WeekTemplate,
  DayCellTemplate,
  DayButton,
  MonthYearString,
  DateString,
  PrevMonthButton,
  NextMonthButton,
  SelectedRange,
  RangeStartDragHandle,
  RangeEndDragHandle,
  useDatePicker,
} from "./dist/index.js";

export {
  Temporal,
  Root,
  Grid,
  GridBody,
  GridHeader,
  GridHeaderCell,
  WeekTemplate,
  DayCellTemplate,
  DayButton,
  MonthYearString,
  DateString,
  PrevMonthButton,
  NextMonthButton,
  SelectedRange,
  RangeStartDragHandle,
  RangeEndDragHandle,
  useDatePicker,
};
