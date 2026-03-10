import type { Temporal } from "@js-temporal/polyfill";
import type { useRender } from "@base-ui/react/use-render";
import { GridOrientation } from "./context";

export type TemporalNamespace = {
  Now: {
    timeZoneId(): string;
    zonedDateTimeISO(tz: string): Temporal.ZonedDateTime;
    plainDateISO(): Temporal.PlainDate;
  };
  PlainDate: {
    from(item: any, options?: { overflow?: string }): Temporal.PlainDate;
    compare(a: Temporal.PlainDate, b: Temporal.PlainDate): number;
  };
  PlainDateTime: {
    from(item: any, options?: { overflow?: string }): Temporal.PlainDateTime;
  };
  PlainMonthDay: {
    from(item: any): Temporal.PlainMonthDay;
  };
  PlainYearMonth: {
    from(item: any): Temporal.PlainYearMonth;
  };
};

export interface PlainDateObject {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
  timeZone?: string;
}

export type DateValueObject =
  | { format: "PlainDate"; value: Temporal.PlainDate }
  | { format: "PlainDateTime"; value: Temporal.PlainDateTime }
  | { format: "PlainMonthDay"; value: Temporal.PlainMonthDay }
  | { format: "PlainTime"; value: Temporal.PlainTime }
  | { format: "PlainYearMonth"; value: Temporal.PlainYearMonth }
  | { format: "ZonedDateTime"; value: Temporal.ZonedDateTime }
  | { format: "object"; value: PlainDateObject }
  | { format: "Date"; value: Date };

export type ValueFormat = DateValueObject["format"];

export type ValueForFormat<F extends ValueFormat> = Extract<
  DateValueObject,
  { format: F }
>;

export type RawValueForFormat<F extends ValueFormat> =
  ValueForFormat<F>["value"];

export type DateRange<F extends ValueFormat = ValueFormat> = {
  start: RawValueForFormat<F>;
  end: RawValueForFormat<F>;
};

export interface DatePickerContextValue {
  selected: DateValueObject | undefined;
  onSelect: (date: Temporal.PlainDate) => void;
  setRange: (start: Temporal.PlainDate, end: Temporal.PlainDate) => void;
  selectionMode: "single" | "range";
  rangeStart: Temporal.PlainDate | undefined;
  rangeEnd: Temporal.PlainDate | undefined;
  currentDateTime: Temporal.PlainDateTime;
  goToNextMonth: () => void;
  goToPrevMonth: () => void;
  weeks: Temporal.PlainDate[][];
  disabled: boolean;
  isDateDisabled?: (date: Temporal.PlainDate) => boolean;
  minValue?: Temporal.PlainDate;
  maxValue?: Temporal.PlainDate;
  focusedDate: Temporal.PlainDate;
  tabTargetDate: Temporal.PlainDate;
  setFocusedDate: (date: Temporal.PlainDate) => void;
  gridFocusedRef: React.MutableRefObject<boolean>;
  setGridHasFocus: (v: boolean) => void;
  timeZone: string;
  locale: string;
  temporal: TemporalNamespace;
  gridLabelId: string | undefined;
  setGridLabelId: (id: string | undefined) => void;
  rootState: RootState;
}

export type RootState<F extends ValueFormat = ValueFormat> = {
  hasSelection: boolean;
  selected: RawValueForFormat<F> | undefined;
  rangeStart: RawValueForFormat<F> | undefined;
  rangeEnd: RawValueForFormat<F> | undefined;
  focused: Temporal.PlainDate;
  viewing: Temporal.PlainYearMonth;
  timeZone: string;
  locale: string;
};

interface RootOwnPropsBase<F extends ValueFormat = ValueFormat> {
  format?: F;
  min?: RawValueForFormat<F>;
  max?: RawValueForFormat<F>;
  disabled?: boolean;
  isDateDisabled?: (date: Temporal.PlainDate) => boolean;
  timeZone?: string;
  locale?: string;
  temporal?: TemporalNamespace;
}

interface SingleSelectionProps<F extends ValueFormat = ValueFormat> {
  selectionMode?: "single";
  value?: RawValueForFormat<F>;
  defaultValue?: RawValueForFormat<F>;
  onValueChange?: (value: RawValueForFormat<F> | undefined) => void;
}

interface RangeSelectionProps<F extends ValueFormat = ValueFormat> {
  selectionMode: "range";
  value?: DateRange<F>;
  defaultValue?: DateRange<F>;
  onValueChange?: (value: DateRange<F> | undefined) => void;
}

export type RootOwnProps<F extends ValueFormat = ValueFormat> =
  RootOwnPropsBase<F> & (SingleSelectionProps<F> | RangeSelectionProps<F>);

type AllRootOwnPropKeys =
  | keyof RootOwnPropsBase
  | keyof SingleSelectionProps
  | keyof RangeSelectionProps;

export type RootProps<F extends ValueFormat = ValueFormat> = Omit<
  useRender.ComponentProps<"div", RootState<F>>,
  AllRootOwnPropKeys
> &
  RootOwnProps<F>;

export type DateStringState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  month: number;
  year: number;
  day: number;
};

export interface DateStringOwnProps {
  locales?: string | string[];
  options?: Intl.DateTimeFormatOptions;
}

export type DateStringProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"span", DateStringState<F>> & DateStringOwnProps;

export type TimeStringState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  hour: number;
  minute: number;
  second: number;
};

export interface TimeStringOwnProps {
  locales?: string | string[];
  options?: Intl.DateTimeFormatOptions;
}

export type TimeStringProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"span", TimeStringState<F>> & TimeStringOwnProps;

export type MonthYearStringState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  month: number;
  year: number;
};

export interface MonthYearStringOwnProps {
  locales?: string | string[];
  options?: Intl.DateTimeFormatOptions;
}

export type MonthYearStringProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"span", MonthYearStringState<F>> &
    MonthYearStringOwnProps;

export type NavButtonState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  direction: "next" | "prev";
  disabled: boolean;
  target: Temporal.PlainYearMonth;
};

export type PrevMonthButtonProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"button", NavButtonState<F>>;
export type NextMonthButtonProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"button", NavButtonState<F>>;

export type GridHeaderCellState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  dayOfWeek: number;
  long: string;
  short: string;
  narrow: string;
};

export interface GridHeaderCellOwnProps {
  index?: number;
}

export type GridHeaderCellProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"th", GridHeaderCellState<F>> &
    GridHeaderCellOwnProps;

export type GridHeaderState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
};

export type GridHeaderProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"thead", GridHeaderState<F>>;

export type GridBodyState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
};

export type GridBodyProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"tbody", GridBodyState<F>>;

export type GridState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  month: number;
  year: number;
  orientation: GridOrientation;
};

export interface GridOwnProps {
  mode?: "grid";
  orientation?: GridOrientation;
}

export type GridProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"table", GridState<F>> & GridOwnProps;

export type WeekTemplateState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  weekIndex: number;
};

export type WeekTemplateProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"tr", WeekTemplateState<F>>;

export type DayCellTemplateState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  date: Temporal.PlainDate;
  columnIndex: number;
  orientation: GridOrientation;
  selected: boolean;
  today: boolean;
  disabled: boolean;
  outsideMonth: boolean;
  focused: boolean;
  rangeStart: boolean;
  rangeEnd: boolean;
  inRange: boolean;
};

export type DayButtonState<F extends ValueFormat = ValueFormat> =
  DayCellTemplateState<F>;

export interface DayCellTemplateOwnProps {
  date?: Temporal.PlainDate;
}

export type DayCellTemplateProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"td", DayCellTemplateState<F>> &
    DayCellTemplateOwnProps;

export interface DayButtonOwnProps {
  date?: Temporal.PlainDate;
}

export type DayButtonProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"button", DayButtonState<F>> & DayButtonOwnProps;

export type SelectedRangeState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  active: boolean;
  weekIndex: number;
  startIndex: number;
  endIndex: number;
  startDate: string;
  endDate: string;
  extendsBefore: boolean;
  extendsAfter: boolean;
};

export type SelectedRangeProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"td", SelectedRangeState<F>>;

export type DragHandleState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  active: boolean;
  dragging: boolean;
  edge: "start" | "end";
};

export interface DragHandleOwnProps {
  dragging?: boolean;
}

export type RangeStartDragHandleProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"span", DragHandleState<F>> & DragHandleOwnProps;

export type RangeEndDragHandleProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"span", DragHandleState<F>> & DragHandleOwnProps;

export type TypedRootProps<F extends ValueFormat> = Omit<
  RootProps<F>,
  "format" | "temporal"
>;

export interface CreateDatePickerOptions {
  temporal?: TemporalNamespace;
}
