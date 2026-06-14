export { CalendarProvider } from "./calendar-provider";
export { MonthView, MonthViewRoot } from "./month-view";
export {
  Grid,
  GridBody,
  WeekTemplate,
  DayCellTemplate,
  DayButton,
} from "./grid";
export { GridHeader, GridHeaderCell } from "./grid-header";
export {
  DateString,
  TimeString,
  MonthYearString,
  PrevMonthButton,
  NextMonthButton,
} from "./navigation";
export { RangeSelected } from "./selected-range";
export { RangePreview } from "./range-preview";
export { RangeStartDragHandle, RangeEndDragHandle } from "./drag-handle";
export { WeekNumberCell, WeekNumberHeader } from "./week-number";
export { WeeksView, WeeksViewRoot } from "./weeks-view";
export {
  PrevWeeksButton,
  NextWeeksButton,
  WeekCount,
} from "./weeks-navigation";
export {
  MonthSeparator,
  MonthSeparatorRow,
  MonthSeparatorCell,
  MonthSeparatorMonth,
  MonthSeparatorYear,
  MonthSeparatorWeekCount,
} from "./month-separator";
export { computePreviewRange } from "./root-selection";
export { computeWeeksInWindow } from "./compute-weeks-in-window";
export { resolveFirstWeek, resolveFirstWeekSpec } from "./resolve-first-week";
/**
 * A bundled, dependency-free `Temporal` implementation — **ISO 8601 /
 * Gregorian only**. Use it when you don't need non-Gregorian calendar math.
 * `toLocaleString` still localizes display via `Intl` (so e.g. `th-TH` renders
 * the Buddhist era), but all date arithmetic and field values are Gregorian.
 * For non-Gregorian calendars, install `@js-temporal/polyfill` (or use native
 * `Temporal`) and pass it via the `temporal` prop instead.
 */
export { Temporal } from "./temporal-polyfill";
export { useCalendarStable, useCalendarState } from "./calendar-context";
export { useMonthViewStable, useMonthViewState } from "./month-view-context";
export { useViewContext } from "./view-context";
export { DayCellDataContext, WeekDataContext, GridContext } from "./context";

export type {
  RootState,
  GridProps,
  GridState,
  GridHeaderProps,
  GridHeaderState,
  GridHeaderCellProps,
  GridHeaderCellState,
  GridBodyProps,
  GridBodyState,
  WeekTemplateProps,
  WeekTemplateState,
  DayCellTemplateProps,
  DayCellTemplateState,
  DayButtonProps,
  DayButtonState,
  RangeSelectedProps,
  RangeSelectedState,
  RangePreviewProps,
  RangePreviewState,
  DragHandleOwnProps,
  DragHandleState,
  RangeStartDragHandleProps,
  RangeEndDragHandleProps,
  DateStringProps,
  DateStringState,
  TimeStringProps,
  TimeStringState,
  MonthYearStringProps,
  MonthYearStringState,
  PrevMonthButtonProps,
  NextMonthButtonProps,
  NavButtonState,
  ValueFormat,
  DateRange,
  DateValueObject,
  ValueForFormat,
  RawValueForFormat,
  PlainDateObject,
  TemporalNamespace,
  WeekStartDay,
  RangeMode,
  OutsideDays,
  ValueChangeMeta,
  WeekNumberCellProps,
  WeekNumberCellState,
  WeekNumberHeaderProps,
  WeekNumberHeaderState,
  MonthData,
} from "./types";

export type { CalendarProviderProps } from "./calendar-types";
export type {
  CalendarStableContextValue,
  CalendarStateContextValue,
} from "./calendar-types";
export type {
  MonthViewRootProps,
  MonthViewStableContextValue,
  MonthViewStateContextValue,
} from "./month-view-types";
export type { MonthViewProps } from "./month-view";
export type { ViewContextValue } from "./view-context";
export type {
  WeeksViewRootProps,
  WeeksViewStableContextValue,
  WeeksViewStateContextValue,
  WindowInfo,
  VisibleMonth,
} from "./weeks-view-types";
export type { WeeksViewProps, WeeksViewRootHandle } from "./weeks-view";
export type {
  WeeksNavButtonState,
  WeeksNavButtonOwnProps,
  PrevWeeksButtonProps,
  NextWeeksButtonProps,
  WeekCountState,
  WeekCountProps,
} from "./weeks-navigation";
export { useWeeksViewStable, useWeeksViewState } from "./weeks-view-context";

export type { WeekDescriptor } from "./compute-weeks-in-window";
export type { FirstWeekSpec, ScrollToWeekSnap } from "./resolve-first-week";
export type { OverflowBehavior, MonthOverflowBehavior } from "./overflow";
export type { MonthSeparatorState } from "./month-separator";
