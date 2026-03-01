import type { Temporal } from "@js-temporal/polyfill";
import type { useRender } from "@base-ui/react/use-render";

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

export interface DatePickerContextValue {
  selected: DateValueObject | undefined;
  onSelect: (date: Temporal.PlainDate) => void;
  currentDateTime: Temporal.PlainDateTime;
  goToNextMonth: () => void;
  goToPrevMonth: () => void;
  weeks: Temporal.PlainDate[][];
  disabled: boolean;
  isDateDisabled?: (date: Temporal.PlainDate) => boolean;
  minValue?: Temporal.PlainDate;
  maxValue?: Temporal.PlainDate;
  focusedDate: Temporal.PlainDate;
  setFocusedDate: (date: Temporal.PlainDate) => void;
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
  focused: Temporal.PlainDate;
  viewing: Temporal.PlainYearMonth;
  timeZone: string;
  locale: string;
};

export interface RootOwnProps<F extends ValueFormat = ValueFormat> {
  format?: F;
  value?: RawValueForFormat<F>;
  defaultValue?: RawValueForFormat<F>;
  onValueChange?: (value: RawValueForFormat<F> | undefined) => void;
  min?: RawValueForFormat<F>;
  max?: RawValueForFormat<F>;
  disabled?: boolean;
  isDateDisabled?: (date: Temporal.PlainDate) => boolean;
  timeZone?: string;
  locale?: string;
  temporal?: TemporalNamespace;
}

export type RootProps<F extends ValueFormat = ValueFormat> = Omit<
  useRender.ComponentProps<"div", RootState<F>>,
  keyof RootOwnProps<F>
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
  /**
   * Intl.DateTimeFormatOptions to format the displayed month/year string.
   * Defaults to `{ month: "long", year: "numeric" }` (e.g. "March 2026").
   *
   * **Accessibility requirement:** This element is referenced by the calendar
   * grid's `aria-labelledby` and serves as its accessible name. When overriding
   * `options`, both the month and year **must** remain present for screen readers.
   */
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
};

export interface GridOwnProps {
  mode?: "grid";
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
  selected: boolean;
  today: boolean;
  disabled: boolean;
  outsideMonth: boolean;
  focused: boolean;
};

export interface DayCellTemplateOwnProps {
  date?: Temporal.PlainDate;
}

export type DayCellTemplateProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"td", DayCellTemplateState<F>> &
    DayCellTemplateOwnProps;

export type DayButtonState<F extends ValueFormat = ValueFormat> = {
  root: RootState<F>;
  selected: boolean;
  today: boolean;
  disabled: boolean;
  outsideMonth: boolean;
  focused: boolean;
};

export interface DayButtonOwnProps {
  date?: Temporal.PlainDate;
}

export type DayButtonProps<F extends ValueFormat = ValueFormat> =
  useRender.ComponentProps<"button", DayButtonState<F>> & DayButtonOwnProps;

export type TypedRootProps<F extends ValueFormat> = Omit<
  RootProps<F>,
  "format"
>;

export interface CreateDatePickerOptions {
  temporal?: TemporalNamespace;
}
