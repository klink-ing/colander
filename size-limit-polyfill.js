// Simulates a real consumer app that renders a date picker with the Temporal polyfill.
// Used by size-limit to measure the tree-shaken bundle cost.
import { Temporal } from "@js-temporal/polyfill";
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
