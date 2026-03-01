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

export type RawValueForFormat<F extends ValueFormat> = ValueForFormat<F>["value"];

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

export type DateStringState = {
  month: number;
  year: number;
  day: number;
};

export interface DateStringOwnProps {
  locales?: string | string[];
  options?: Intl.DateTimeFormatOptions;
}

export type DateStringProps = useRender.ComponentProps<"span", DateStringState> &
  DateStringOwnProps;

export type TimeStringState = {
  hour: number;
  minute: number;
  second: number;
};

export interface TimeStringOwnProps {
  locales?: string | string[];
  options?: Intl.DateTimeFormatOptions;
}

export type TimeStringProps = useRender.ComponentProps<"span", TimeStringState> &
  TimeStringOwnProps;

export type MonthYearStringState = {
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

export type MonthYearStringProps = useRender.ComponentProps<
  "span",
  MonthYearStringState
> &
  MonthYearStringOwnProps;

export type NavButtonState = {
  direction: "next" | "prev";
  disabled: boolean;
  target: Temporal.PlainYearMonth;
};

export type PrevMonthButtonProps = useRender.ComponentProps<
  "button",
  NavButtonState
>;
export type NextMonthButtonProps = useRender.ComponentProps<
  "button",
  NavButtonState
>;

export type GridHeaderCellState = {
  dayOfWeek: number;
  long: string;
  short: string;
  narrow: string;
};

export interface GridHeaderCellOwnProps {
  index?: number;
}

export type GridHeaderCellProps = useRender.ComponentProps<"th", GridHeaderCellState> &
  GridHeaderCellOwnProps;

export type GridHeaderState = {};

export type GridHeaderProps = useRender.ComponentProps<"thead", GridHeaderState>;

export type GridBodyState = {};

export type GridBodyProps = useRender.ComponentProps<"tbody", GridBodyState>;

export type GridState = {
  month: number;
  year: number;
};

export interface GridOwnProps {
  mode?: "grid";
}

export type GridProps = useRender.ComponentProps<"table", GridState> &
  GridOwnProps;

export type WeekTemplateState = {
  weekIndex: number;
};

export type WeekTemplateProps = useRender.ComponentProps<
  "tr",
  WeekTemplateState
>;

export type DayCellTemplateState = {
  selected: boolean;
  today: boolean;
  disabled: boolean;
  outsideMonth: boolean;
  focused: boolean;
};

export interface DayCellTemplateOwnProps {
  date?: Temporal.PlainDate;
}

export type DayCellTemplateProps = useRender.ComponentProps<
  "td",
  DayCellTemplateState
> &
  DayCellTemplateOwnProps;

export type DayButtonState = {
  selected: boolean;
  today: boolean;
  disabled: boolean;
  outsideMonth: boolean;
  focused: boolean;
};

export interface DayButtonOwnProps {
  date?: Temporal.PlainDate;
}

export type DayButtonProps = useRender.ComponentProps<
  "button",
  DayButtonState
> &
  DayButtonOwnProps;

export type TypedRootProps<F extends ValueFormat> = Omit<RootProps<F>, "format">;

export interface TypedDatePicker<F extends ValueFormat> {
  Root: (
    props: TypedRootProps<F> & { ref?: React.Ref<HTMLDivElement> },
  ) => React.ReactElement | null;
  Grid: (
    props: GridProps & { ref?: React.Ref<HTMLTableElement> },
  ) => React.ReactElement;
  GridHeader: (
    props: GridHeaderProps & { ref?: React.Ref<HTMLTableSectionElement> },
  ) => React.ReactElement;
  GridHeaderCell: (
    props: GridHeaderCellProps & { ref?: React.Ref<HTMLTableCellElement> },
  ) => React.ReactElement;
  GridBody: (
    props: GridBodyProps & { ref?: React.Ref<HTMLTableSectionElement> },
  ) => React.ReactElement;
  WeekTemplate: (
    props: WeekTemplateProps & { ref?: React.Ref<HTMLTableRowElement> },
  ) => React.ReactElement;
  DayCellTemplate: (
    props: DayCellTemplateProps & { ref?: React.Ref<HTMLTableCellElement> },
  ) => React.ReactElement;
  DayButton: (
    props: DayButtonProps & { ref?: React.Ref<HTMLButtonElement> },
  ) => React.ReactElement;
  DateString: (
    props: DateStringProps & { ref?: React.Ref<HTMLSpanElement> },
  ) => React.ReactElement;
  TimeString: (
    props: TimeStringProps & { ref?: React.Ref<HTMLSpanElement> },
  ) => React.ReactElement;
  MonthYearString: (
    props: MonthYearStringProps & { ref?: React.Ref<HTMLSpanElement> },
  ) => React.ReactElement;
  PrevMonthButton: (
    props: PrevMonthButtonProps & { ref?: React.Ref<HTMLButtonElement> },
  ) => React.ReactElement;
  NextMonthButton: (
    props: NextMonthButtonProps & { ref?: React.Ref<HTMLButtonElement> },
  ) => React.ReactElement;
}

export interface CreateDatePickerOptions {
  temporal?: TemporalNamespace;
}
