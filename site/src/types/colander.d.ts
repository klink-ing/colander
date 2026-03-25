declare module 'colander' {
  import type { ComponentType, Context, ReactNode, RefObject } from 'react'

  // Permissive component type for documentation/demo use
  type C<P = {}> = ComponentType<P & Record<string, any> & { children?: ReactNode; className?: string; ref?: any }>

  // Components
  export const CalendarProvider: C
  export const Grid: C
  export const GridHeader: C
  export const GridHeaderCell: C
  export const GridBody: C
  export const WeekTemplate: C
  export const DayCellTemplate: C
  export const DayButton: C
  export const MonthYearString: C
  export const PrevMonthButton: C
  export const NextMonthButton: C
  export const RangeSelected: C
  export const RangePreview: C
  export const RangeStartDragHandle: C
  export const RangeEndDragHandle: C
  export const WeekNumberCell: C
  export const WeekNumberHeader: C
  export const PrevWeeksButton: C
  export const NextWeeksButton: C
  export const MonthSeparator: C & {
    Row: C
    Cell: C
    Month: C
    Year: C
    WeekCount: C
  }

  // Compound component namespaces
  export const MonthView: C & {
    Root: C
  }
  export const WeeksView: C & {
    Root: C
  }

  // Hooks
  export function useCalendarStable(): any
  export function useCalendarState(): any
  export function useWeeksViewState(): any
  export function useMonthViewState(): any

  // Contexts
  export const DayCellDataContext: Context<any>
  export const GridContext: Context<any>
  export const WeekDataContext: Context<any>

  // Types
  export type ValueFormat = string
  export type DateRange<F = any> = { start: any; end: any }
  export type RangeMode = string
  export type OverflowBehavior = string
  export type MonthOverflowBehavior = string
  export type OutsideDays = string
  export type WeekStartDay = number
  export type FirstWeekSpec = any
  export type ScrollToWeekSnap = string
  export type TemporalNamespace = any

  // Component prop types (permissive for demo use)
  export type GridProps<F = any> = any
  export type GridBodyProps<F = any> = any
  export type WeekTemplateProps<F = any> = any
  export type DayCellTemplateProps<F = any> = any
  export type DayButtonProps<F = any> = any
  export type GridHeaderProps<F = any> = any
  export type GridHeaderCellProps<F = any> = any
  export type MonthYearStringProps<F = any> = any
  export type PrevMonthButtonProps<F = any> = any
  export type NextMonthButtonProps<F = any> = any
  export type RangeSelectedProps<F = any> = any
  export type RangePreviewProps<F = any> = any
}
