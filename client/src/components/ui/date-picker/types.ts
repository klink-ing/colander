import type { Temporal } from "@js-temporal/polyfill";
import type { useRender } from "@base-ui/react/use-render";

export type TemporalNamespace = {
  Now: {
    timeZoneId(): string;
    zonedDateTimeISO(tz: string): Temporal.ZonedDateTime;
    plainDateISO(): Temporal.PlainDate;
  };
  PlainDate: {
    from(item: any): Temporal.PlainDate;
    compare(a: Temporal.PlainDate, b: Temporal.PlainDate): number;
  };
  PlainDateTime: {
    from(item: any): Temporal.PlainDateTime;
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
  currentMonth: { year: number; month: number };
  goToNextMonth: () => void;
  goToPrevMonth: () => void;
  weeks: Temporal.PlainDate[][];
  disabled?: (date: Temporal.PlainDate) => boolean;
  minValue?: Temporal.PlainDate;
  maxValue?: Temporal.PlainDate;
  focusedDate: Temporal.PlainDate;
  setFocusedDate: (date: Temporal.PlainDate) => void;
  timeZone: string;
  locale: string;
  temporal: TemporalNamespace;
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
  disabled?: (date: Temporal.PlainDate) => boolean;
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

export type MonthStringState = {
  month: number;
  year: number;
};

export interface MonthStringOwnProps {
  locales?: string | string[];
  options?: Intl.DateTimeFormatOptions;
}

export type MonthStringProps = useRender.ComponentProps<
  "span",
  MonthStringState
> &
  MonthStringOwnProps;

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

export type DayLabelState = {
  index: number;
  dayOfWeek: number;
  long: string;
  short: string;
  narrow: string;
};

export interface DayLabelOwnProps {
  index?: number;
}

export type DayLabelProps = useRender.ComponentProps<"div", DayLabelState> &
  DayLabelOwnProps;

export type DayLabelsState = {};

export type DayLabelsProps = useRender.ComponentProps<"div", DayLabelsState>;

export type DaysGridState = {
  month: number;
  year: number;
};

export interface DaysGridOwnProps {
  mode?: "grid";
}

export type DaysGridProps = useRender.ComponentProps<"div", DaysGridState> &
  DaysGridOwnProps;

export type WeekTemplateState = {
  weekIndex: number;
};

export type WeekTemplateProps = useRender.ComponentProps<
  "div",
  WeekTemplateState
>;

export type DayTemplateState = {
  selected: boolean;
  today: boolean;
  disabled: boolean;
  outsideMonth: boolean;
  focused: boolean;
};

export interface DayTemplateOwnProps {
  date?: Temporal.PlainDate;
}

export type DayTemplateProps = useRender.ComponentProps<
  "button",
  DayTemplateState
> &
  DayTemplateOwnProps;

export type TypedRootProps<F extends ValueFormat> = Omit<RootProps<F>, "format">;

export interface TypedDatePicker<F extends ValueFormat> {
  Root: (
    props: TypedRootProps<F> & { ref?: React.Ref<HTMLDivElement> },
  ) => React.ReactElement | null;
  DaysGrid: (
    props: DaysGridProps & { ref?: React.Ref<HTMLDivElement> },
  ) => React.ReactElement;
  WeekTemplate: (
    props: WeekTemplateProps & { ref?: React.Ref<HTMLDivElement> },
  ) => React.ReactElement;
  DayTemplate: (
    props: DayTemplateProps & { ref?: React.Ref<HTMLButtonElement> },
  ) => React.ReactElement;
  DayLabels: (
    props: DayLabelsProps & { ref?: React.Ref<HTMLDivElement> },
  ) => React.ReactElement;
  DayLabel: (
    props: DayLabelProps & { ref?: React.Ref<HTMLDivElement> },
  ) => React.ReactElement;
  DateString: (
    props: DateStringProps & { ref?: React.Ref<HTMLSpanElement> },
  ) => React.ReactElement;
  TimeString: (
    props: TimeStringProps & { ref?: React.Ref<HTMLSpanElement> },
  ) => React.ReactElement;
  MonthString: (
    props: MonthStringProps & { ref?: React.Ref<HTMLSpanElement> },
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
