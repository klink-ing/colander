declare module 'colander' {
  import type { ComponentType, ReactNode } from 'react'

  export const CalendarProvider: ComponentType<Record<string, unknown> & { children?: ReactNode }>
  export const MonthView: ComponentType<Record<string, unknown> & { children?: ReactNode }>
  export const WeeksView: ComponentType<Record<string, unknown> & { children?: ReactNode }>
  export const Grid: ComponentType<Record<string, unknown> & { children?: ReactNode }>
  export const GridHeader: ComponentType<Record<string, unknown> & { children?: ReactNode }>
  export const GridHeaderCell: ComponentType<Record<string, unknown>>
  export const GridBody: ComponentType<Record<string, unknown> & { children?: ReactNode }>
  export const WeekTemplate: ComponentType<Record<string, unknown> & { children?: ReactNode }>
  export const DayCellTemplate: ComponentType<Record<string, unknown> & { children?: ReactNode }>
  export const DayButton: ComponentType<Record<string, unknown>>

  // Re-export all types as `any` for documentation examples
  export type ValueFormat = string
  export type DateRange = { start: unknown; end: unknown }
  export type RangeMode = string
  export type OverflowBehavior = string
  export type WeekStartDay = number
  export type FirstWeekSpec = unknown
  export type ScrollToWeekSnap = string

  // Allow any other imports
  const _default: Record<string, unknown>
  export default _default
}
