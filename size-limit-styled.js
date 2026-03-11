// Simulates a fully-styled date picker with drag-range support.
// Matches the imports from dev/examples/date-picker-styled.tsx.
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
  TimeString,
  PrevMonthButton,
  NextMonthButton,
  SelectedRange,
  RangeStartDragHandle,
  RangeEndDragHandle,
  useDatePicker,
  DayCellDataContext,
} from "./dist/index.js";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { disableNativeDragPreview } from "@atlaskit/pragmatic-drag-and-drop/element/disable-native-drag-preview";
import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

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
  TimeString,
  PrevMonthButton,
  NextMonthButton,
  SelectedRange,
  RangeStartDragHandle,
  RangeEndDragHandle,
  useDatePicker,
  DayCellDataContext,
  draggable,
  disableNativeDragPreview,
  monitorForElements,
  dropTargetForElements,
};
