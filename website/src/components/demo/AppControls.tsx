import { Field as FieldPrimitive } from "@base-ui/react/field";
import { Fieldset as FieldsetPrimitive } from "@base-ui/react/fieldset";
import { Temporal } from "@js-temporal/polyfill";
import type {
  OutsideDays,
  OverflowBehavior,
  RangeMode,
} from "@klinking/colander";
import type { ComponentProps } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "#/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "#/components/ui/radio-group";
import { Checkbox } from "../ui/checkbox";
import { Field, FieldLabel, FieldsetLegend } from "../ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "America/Argentina/Buenos_Aires",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Europe/Istanbul",
  "Africa/Cairo",
  "Africa/Lagos",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Singapore",
  "Australia/Sydney",
  "Australia/Perth",
  "Pacific/Auckland",
  "UTC",
];

export const LOCALES = [
  { value: "en-US", label: "English (US) (default)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "de-DE", label: "Deutsch" },
  { value: "fr-FR", label: "Fran\u00e7ais" },
  { value: "es-ES", label: "Espa\u00f1ol" },
  { value: "it-IT", label: "Italiano" },
  { value: "pt-BR", label: "Portugu\u00eas (BR)" },
  { value: "ja-JP", label: "\u65e5\u672c\u8a9e" },
  { value: "zh-CN", label: "\u4e2d\u6587 (\u7b80\u4f53)" },
  { value: "ko-KR", label: "\ud55c\uad6d\uc5b4" },
  { value: "ar-SA", label: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" },
  { value: "hi-IN", label: "\u0939\u093f\u0928\u094d\u0926\u0940" },
  { value: "ru-RU", label: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439" },
  { value: "nl-NL", label: "Nederlands" },
  { value: "sv-SE", label: "Svenska" },
];

export const WEEK_START_DAYS = [
  { value: 0, label: "Sunday (default)" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

const RANGE_MODE_OPTIONS: Record<RangeMode, string> = {
  "start-end": "start-end (default)",
  "nearest-end": "nearest-end",
  "nearest-start": "nearest-start",
  "adjust-end": "adjust-end",
  "adjust-start": "adjust-start",
  reset: "reset",
} as const;

export function formatTzLabel(tz: string): string {
  try {
    const now = Temporal.Now.zonedDateTimeISO(tz);
    const offset = now.offset;
    return `UTC${offset}`;
  } catch {
    return tz;
  }
}

const selectClassName =
  "w-full squircle-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-w-focus focus-visible:ring-focus focus-visible:ring-offset-2";

const fieldHeadingClassName =
  "block font-sans text-sm font-medium text-foreground";

export interface AppControlsProps {
  viewMode: "month" | "weeks";
  setViewMode: (v: "month" | "weeks") => void;
  selectionMode: "single" | "range" | "multiple";
  setSelectionMode: (v: "single" | "range" | "multiple") => void;
  rangeMode: RangeMode;
  setRangeMode: (v: RangeMode) => void;
  preventRangeReversal: boolean;
  setPreventRangeReversal: (v: boolean) => void;
  timeZone: string;
  handleTimeZoneChange: (v: string) => void;
  tzOptions: { value: string; label: string }[];
  locale: string;
  setLocale: (v: string) => void;
  weekStartDay: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  setWeekStartDay: (v: 0 | 1 | 2 | 3 | 4 | 5 | 6) => void;
  minDate: Temporal.ZonedDateTime;
  maxDate: Temporal.ZonedDateTime;
  handleMinChange: (v: string) => void;
  handleMaxChange: (v: string) => void;
  disabled: boolean;
  setDisabled: (v: boolean) => void;
  readOnly: boolean;
  setReadOnly: (v: boolean) => void;
  numberOfMonths: number;
  setNumberOfMonths: (v: number) => void;
  fixedWeeks: boolean;
  setFixedWeeks: (v: boolean) => void;
  outsideDays: OutsideDays;
  setOutsideDays: (v: OutsideDays) => void;
  autoFocus: boolean;
  setAutoFocus: (v: boolean) => void;
  showWeekNumbers: boolean;
  setShowWeekNumbers: (v: boolean) => void;
  orientation: "horizontal" | "vertical";
  setOrientation: (v: "horizontal" | "vertical") => void;
  weekCount: number;
  setWeekCount: (v: number) => void;
  scrollBy: "row" | "page";
  setScrollBy: (v: "row" | "page") => void;
  overflowBehavior: OverflowBehavior;
  setOverflowBehavior: (v: OverflowBehavior) => void;
  showMonthSeparators: boolean;
  setShowMonthSeparators: (v: boolean) => void;
  disableDateMode: string;
  setDisableDateMode: (v: string) => void;
  monthOverflowBehavior: "unbounded" | "stop";
  setMonthOverflowBehavior: (v: "unbounded" | "stop") => void;
  selectionDisplay: string;
  lastMonthChange: string;
}

const toInputValue = (zdt: Temporal.ZonedDateTime) =>
  zdt.toPlainDate().toString();

function SingleCheckbox({
  children,
  ...props
}: ComponentProps<typeof Checkbox> & { children: React.ReactNode }) {
  return (
    <FieldPrimitive.Root>
      <FieldPrimitive.Label className="flex w-full items-center gap-2">
        <Checkbox {...props} />
        {children}
      </FieldPrimitive.Label>
    </FieldPrimitive.Root>
  );
}

export function AppControls(props: AppControlsProps) {
  const {
    viewMode,
    setViewMode,
    selectionMode,
    setSelectionMode,
    rangeMode,
    setRangeMode,
    preventRangeReversal,
    setPreventRangeReversal,
    timeZone,
    handleTimeZoneChange,
    tzOptions,
    locale,
    setLocale,
    weekStartDay,
    setWeekStartDay,
    minDate,
    maxDate,
    handleMinChange,
    handleMaxChange,
    disabled,
    setDisabled,
    readOnly,
    setReadOnly,
    numberOfMonths,
    setNumberOfMonths,
    fixedWeeks,
    setFixedWeeks,
    outsideDays,
    setOutsideDays,
    autoFocus,
    setAutoFocus,
    showWeekNumbers,
    setShowWeekNumbers,
    orientation,
    setOrientation,
    weekCount,
    setWeekCount,
    scrollBy,
    setScrollBy,
    overflowBehavior,
    setOverflowBehavior,
    showMonthSeparators,
    setShowMonthSeparators,
    disableDateMode,
    setDisableDateMode,
    monthOverflowBehavior,
    setMonthOverflowBehavior,
  } = props;

  return (
    <div className="flex w-64 shrink-0 flex-col">
      <h2 className="mb-2 text-lg font-semibold text-foreground">Controls</h2>

      <FieldPrimitive.Root className="border-b border-input pb-0">
        <FieldsetPrimitive.Root
          className="mb-3"
          render={
            <RadioGroup
              value={viewMode}
              onValueChange={(v) => setViewMode(v as "month" | "weeks")}
            />
          }
        >
          <FieldsetLegend className={fieldHeadingClassName}>
            View
          </FieldsetLegend>
          <RadioGroupItem value="month">MonthView</RadioGroupItem>
          <RadioGroupItem value="weeks">WeeksView</RadioGroupItem>
        </FieldsetPrimitive.Root>
      </FieldPrimitive.Root>

      <Accordion defaultValue={["calendar-provider", "display-options"]}>
        {/* ── Section 1: CalendarProvider ── */}
        <AccordionItem value="calendar-provider">
          <AccordionTrigger>CalendarProvider</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              <FieldPrimitive.Root name="selectionMode">
                <FieldsetPrimitive.Root
                  render={
                    <RadioGroup
                      value={selectionMode}
                      onValueChange={(v) =>
                        setSelectionMode(v as "single" | "range" | "multiple")
                      }
                    />
                  }
                >
                  <FieldsetLegend>selectionMode</FieldsetLegend>
                  <RadioGroupItem value="single">
                    single (default)
                  </RadioGroupItem>
                  <RadioGroupItem value="range">range</RadioGroupItem>
                  <RadioGroupItem value="multiple">multiple</RadioGroupItem>
                </FieldsetPrimitive.Root>
              </FieldPrimitive.Root>

              {selectionMode === "range" && (
                <Field>
                  <FieldLabel htmlFor="range-mode">rangeMode</FieldLabel>
                  <Select
                    id="range-mode"
                    value={rangeMode}
                    onValueChange={(value) =>
                      setRangeMode(value ?? "start-end")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RANGE_MODE_OPTIONS).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </Field>
              )}

              {selectionMode === "range" && (
                <SingleCheckbox
                  checked={preventRangeReversal}
                  onCheckedChange={(checked) =>
                    setPreventRangeReversal(checked)
                  }
                >
                  preventRangeReversal
                </SingleCheckbox>
              )}

              <Field>
                <FieldLabel htmlFor="timezone-select">timeZone</FieldLabel>
                <Select
                  id="timezone-select"
                  value={timeZone}
                  itemToStringLabel={(item) =>
                    !item
                      ? tzOptions[0].label
                      : (tzOptions.find((opt) => opt.value === item)?.label ??
                        "")
                  }
                  onValueChange={(value) => handleTimeZoneChange(value ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (default)</SelectItem>
                    {tzOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.value} — {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="locale-select">locale</FieldLabel>
                <Select
                  id="locale-select"
                  value={locale}
                  onValueChange={(value) => setLocale(value ?? "en-US")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCALES.map((loc) => (
                      <SelectItem key={loc.value} value={loc.value}>
                        {loc.value} – {loc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="week-start-day">weekStartDay</FieldLabel>
                <Select
                  id="week-start-day"
                  value={String(weekStartDay)}
                  onValueChange={(value) => {
                    const next = Number(value ?? "0");
                    setWeekStartDay(
                      (Number.isFinite(next) ? next : 0) as
                        | 0
                        | 1
                        | 2
                        | 3
                        | 4
                        | 5
                        | 6,
                    );
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEK_START_DAYS.map((d) => (
                      <SelectItem key={d.value} value={String(d.value)}>
                        {d.value} – {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field className="min-w-0">
                <FieldLabel htmlFor="min-date">min</FieldLabel>
                <input
                  id="min-date"
                  type="date"
                  value={toInputValue(minDate)}
                  onChange={(e) => handleMinChange(e.target.value)}
                  className={selectClassName}
                />
              </Field>

              <Field className="min-w-0">
                <FieldLabel htmlFor="max-date">max</FieldLabel>
                <input
                  id="max-date"
                  type="date"
                  value={toInputValue(maxDate)}
                  onChange={(e) => handleMaxChange(e.target.value)}
                  className={selectClassName}
                />
              </Field>

              <SingleCheckbox
                checked={disabled}
                onCheckedChange={(checked) => setDisabled(checked)}
              >
                disabled
              </SingleCheckbox>

              <SingleCheckbox
                checked={readOnly}
                onCheckedChange={(checked) => setReadOnly(checked)}
              >
                readOnly
              </SingleCheckbox>

              <FieldPrimitive.Root>
                <FieldsetPrimitive.Root
                  render={
                    <RadioGroup
                      value={disableDateMode}
                      onValueChange={setDisableDateMode}
                    />
                  }
                >
                  <FieldsetLegend>isDateDisabled</FieldsetLegend>
                  <RadioGroupItem value="none">None (default)</RadioGroupItem>
                  <RadioGroupItem value="weekends">Weekends</RadioGroupItem>
                  <RadioGroupItem value="past">Past dates</RadioGroupItem>
                  <RadioGroupItem value="every3rd">
                    Every 3rd day
                  </RadioGroupItem>
                </FieldsetPrimitive.Root>
              </FieldPrimitive.Root>
            </div>
          </AccordionContent>
        </AccordionItem>

        {viewMode === "month" && (
          <AccordionItem value="month-view">
            <AccordionTrigger>MonthView.Root</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-4">
                <Field>
                  <FieldLabel htmlFor="number-of-months">
                    numberOfMonths
                  </FieldLabel>
                  <input
                    id="number-of-months"
                    type="number"
                    min={1}
                    step={1}
                    value={numberOfMonths}
                    onChange={(e) => {
                      const v = Math.max(
                        1,
                        Math.floor(Number(e.target.value) || 1),
                      );
                      setNumberOfMonths(v);
                    }}
                    className={selectClassName}
                  />
                </Field>

                <Field>
                  <FieldLabel>outsideDays</FieldLabel>
                  <RadioGroup<OutsideDays>
                    value={outsideDays}
                    onValueChange={(v) => setOutsideDays(v as OutsideDays)}
                  >
                    <RadioGroupItem<OutsideDays> value="enabled">
                      enabled (default)
                    </RadioGroupItem>
                    <RadioGroupItem<OutsideDays> value="readOnly" />
                    <RadioGroupItem<OutsideDays> value="disabled" />
                    <RadioGroupItem<OutsideDays> value="hidden" />
                  </RadioGroup>
                </Field>

                <Field orientation="horizontal">
                  <Checkbox
                    checked={fixedWeeks}
                    onCheckedChange={(checked) => setFixedWeeks(checked)}
                  />
                  <FieldLabel>fixedWeeks</FieldLabel>
                </Field>

                <Field>
                  <FieldLabel>overflowBehavior</FieldLabel>
                  <RadioGroup
                    value={monthOverflowBehavior}
                    onValueChange={(v) =>
                      setMonthOverflowBehavior(v as "unbounded" | "stop")
                    }
                  >
                    <RadioGroupItem value="unbounded">
                      unbounded (default)
                    </RadioGroupItem>
                    <RadioGroupItem value="stop">stop</RadioGroupItem>
                  </RadioGroup>
                </Field>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {viewMode === "weeks" && (
          <AccordionItem value="weeks-view">
            <AccordionTrigger>WeeksView.Root</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-4">
                <Field>
                  <FieldLabel htmlFor="week-count">weekCount</FieldLabel>
                  <Select
                    id="week-count"
                    value={String(weekCount)}
                    onValueChange={(value) => {
                      const next = Number(value ?? "6");
                      setWeekCount(Number.isFinite(next) ? next : 6);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="6">6 (default)</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="12">12</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel>scrollBy</FieldLabel>
                  <RadioGroup
                    value={scrollBy}
                    onValueChange={(v) => setScrollBy(v as "row" | "page")}
                  >
                    <RadioGroupItem value="row">row (default)</RadioGroupItem>
                    <RadioGroupItem value="page">page</RadioGroupItem>
                  </RadioGroup>
                </Field>

                <Field>
                  <FieldLabel htmlFor="overflow-behavior">
                    overflowBehavior
                  </FieldLabel>
                  <Select
                    id="overflow-behavior"
                    value={overflowBehavior}
                    onValueChange={(value) =>
                      setOverflowBehavior(
                        (value ?? "unbounded") as OverflowBehavior,
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unbounded">
                        Unbounded (default)
                      </SelectItem>
                      <SelectItem value="stop">Stop</SelectItem>
                      <SelectItem value="stop-shrink">Stop + Shrink</SelectItem>
                      <SelectItem value="snap">Snap</SelectItem>
                      <SelectItem value="snap-shrink">Snap + Shrink</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        <AccordionItem value="display-options">
          <AccordionTrigger>Display Options</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              <Field orientation="horizontal">
                <Checkbox
                  checked={autoFocus}
                  onCheckedChange={(checked) => setAutoFocus(checked)}
                />
                <FieldLabel>Grid.autoFocus</FieldLabel>
              </Field>

              <Field orientation="horizontal">
                <Checkbox
                  checked={showWeekNumbers}
                  onCheckedChange={(checked) => setShowWeekNumbers(checked)}
                />
                <FieldLabel>Show Week Numbers</FieldLabel>
              </Field>

              {viewMode === "weeks" && (
                <Field orientation="horizontal">
                  <Checkbox
                    checked={showMonthSeparators}
                    onCheckedChange={(checked) =>
                      setShowMonthSeparators(checked)
                    }
                  />
                  <FieldLabel className="font-sans text-sm">
                    Show Month Separators
                  </FieldLabel>
                </Field>
              )}

              <Field>
                <FieldLabel>Grid.orientation</FieldLabel>
                <RadioGroup
                  value={orientation}
                  onValueChange={(v) =>
                    setOrientation(v as "horizontal" | "vertical")
                  }
                >
                  <RadioGroupItem value="horizontal">
                    Horizontal (default)
                  </RadioGroupItem>
                  <RadioGroupItem value="vertical">Vertical</RadioGroupItem>
                </RadioGroup>
              </Field>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
