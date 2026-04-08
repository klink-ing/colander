import { Temporal } from "@js-temporal/polyfill";
import type { RangeMode, OutsideDays, OverflowBehavior } from "colander";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "#/components/ui/accordion";
import { Label } from "#/components/ui/label";
import { RadioGroup, RadioGroupItem } from "#/components/ui/radio-group";
import { Checkbox } from "../ui/checkbox";
import { Field } from "../ui/field";

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

export function formatTzLabel(tz: string): string {
  try {
    const now = Temporal.Now.zonedDateTimeISO(tz);
    const offset = now.offset;
    const city = tz.split("/").pop()?.replace(/_/g, " ") ?? tz;
    return `${city} (UTC${offset})`;
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

function Radio({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return (
    <Label className="flex w-full items-center gap-2">
      <RadioGroupItem value={value} />
      {children}
    </Label>
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
    selectionDisplay,
    lastMonthChange,
  } = props;

  return (
    <div className="flex w-64 shrink-0 flex-col">
      <h2 className="mb-2 text-lg font-semibold text-foreground">Controls</h2>

      <Field className="mb-3">
        <Label className={fieldHeadingClassName}>View</Label>
        <RadioGroup
          value={viewMode}
          onValueChange={(v) => setViewMode(v as "month" | "weeks")}
        >
          <Radio value="month">MonthView</Radio>
          <Radio value="weeks">WeeksView</Radio>
        </RadioGroup>
      </Field>

      <Accordion defaultValue={["calendar-provider", "display-options"]}>
        {/* ── Section 1: CalendarProvider ── */}
        <AccordionItem value="calendar-provider">
          <AccordionTrigger>CalendarProvider</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              <Field>
                <Label>selectionMode</Label>
                <RadioGroup
                  value={selectionMode}
                  onValueChange={(v) =>
                    setSelectionMode(v as "single" | "range" | "multiple")
                  }
                >
                  <Radio value="single">single (default)</Radio>
                  <Radio value="range">range</Radio>
                  <Radio value="multiple">multiple</Radio>
                </RadioGroup>
              </Field>

              {selectionMode === "range" && (
                <Field>
                  <Label htmlFor="range-mode">rangeMode</Label>
                  <select
                    id="range-mode"
                    value={rangeMode}
                    onChange={(e) => setRangeMode(e.target.value as RangeMode)}
                    className={selectClassName}
                  >
                    <option value="start-end">Start → End (default)</option>
                    <option value="nearest-end">Nearest (tie: End)</option>
                    <option value="nearest-start">Nearest (tie: Start)</option>
                    <option value="adjust-end">Adjust End</option>
                    <option value="adjust-start">Adjust Start</option>
                    <option value="reset">Reset to Single Day</option>
                  </select>
                </Field>
              )}

              {selectionMode === "range" && (
                <Field orientation="horizontal">
                  <Checkbox
                    checked={preventRangeReversal}
                    onCheckedChange={(checked) =>
                      setPreventRangeReversal(checked)
                    }
                  />
                  <Label>preventRangeReversal</Label>
                </Field>
              )}

              <Field>
                <Label htmlFor="timezone-select">timeZone</Label>
                <select
                  id="timezone-select"
                  value={timeZone}
                  onChange={(e) => handleTimeZoneChange(e.target.value)}
                  className={selectClassName}
                >
                  <option value="">None (default)</option>
                  {tzOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field>
                <Label htmlFor="locale-select">locale</Label>
                <select
                  id="locale-select"
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  className={selectClassName}
                >
                  {LOCALES.map((loc) => (
                    <option key={loc.value} value={loc.value}>
                      {loc.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field>
                <Label htmlFor="week-start-day">weekStartDay</Label>
                <select
                  id="week-start-day"
                  value={weekStartDay}
                  onChange={(e) =>
                    setWeekStartDay(
                      Number(e.target.value) as 0 | 1 | 2 | 3 | 4 | 5 | 6,
                    )
                  }
                  className={selectClassName}
                >
                  {WEEK_START_DAYS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field className="min-w-0">
                <Label htmlFor="min-date">min</Label>
                <input
                  id="min-date"
                  type="date"
                  value={toInputValue(minDate)}
                  onChange={(e) => handleMinChange(e.target.value)}
                  className={selectClassName}
                />
              </Field>
              <Field className="min-w-0">
                <Label htmlFor="max-date">max</Label>
                <input
                  id="max-date"
                  type="date"
                  value={toInputValue(maxDate)}
                  onChange={(e) => handleMaxChange(e.target.value)}
                  className={selectClassName}
                />
              </Field>

              <Field orientation="horizontal">
                <Checkbox
                  checked={disabled}
                  onCheckedChange={(checked) => setDisabled(checked)}
                />
                <Label>disabled</Label>
              </Field>

              <Field orientation="horizontal">
                <Checkbox
                  checked={readOnly}
                  onCheckedChange={(checked) => setReadOnly(checked)}
                />
                <Label>readOnly</Label>
              </Field>

              <Field>
                <Label>isDateDisabled</Label>
                <RadioGroup
                  value={disableDateMode}
                  onValueChange={setDisableDateMode}
                >
                  <Radio value="none">None (default)</Radio>
                  <Radio value="weekends">Weekends</Radio>
                  <Radio value="past">Past dates</Radio>
                  <Radio value="every3rd">Every 3rd day</Radio>
                </RadioGroup>
              </Field>
            </div>
          </AccordionContent>
        </AccordionItem>

        {viewMode === "month" && (
          <AccordionItem value="month-view">
            <AccordionTrigger>MonthView.Root</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-4">
                <Field>
                  <Label htmlFor="number-of-months">numberOfMonths</Label>
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
                  <Label>outsideDays</Label>
                  <RadioGroup
                    value={outsideDays}
                    onValueChange={(v) => setOutsideDays(v as OutsideDays)}
                  >
                    <Radio value="enabled">enabled (default)</Radio>
                    <Radio value="readonly">readonly</Radio>
                    <Radio value="disabled">disabled</Radio>
                    <Radio value="hidden">hidden</Radio>
                  </RadioGroup>
                </Field>

                <Field orientation="horizontal">
                  <Checkbox
                    checked={fixedWeeks}
                    onCheckedChange={(checked) => setFixedWeeks(checked)}
                  />
                  <Label>fixedWeeks</Label>
                </Field>

                <Field>
                  <Label>overflowBehavior</Label>
                  <RadioGroup
                    value={monthOverflowBehavior}
                    onValueChange={(v) =>
                      setMonthOverflowBehavior(v as "unbounded" | "stop")
                    }
                  >
                    <Radio value="unbounded">unbounded (default)</Radio>
                    <Radio value="stop">stop</Radio>
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
                  <Label htmlFor="week-count">weekCount</Label>
                  <select
                    id="week-count"
                    className={selectClassName}
                    value={weekCount}
                    onChange={(e) => setWeekCount(Number(e.target.value))}
                  >
                    <option value={4}>4</option>
                    <option value={6}>6 (default)</option>
                    <option value={8}>8</option>
                    <option value={10}>10</option>
                    <option value={12}>12</option>
                  </select>
                </Field>

                <Field>
                  <Label>scrollBy</Label>
                  <RadioGroup
                    value={scrollBy}
                    onValueChange={(v) => setScrollBy(v as "row" | "page")}
                  >
                    <Radio value="row">row (default)</Radio>
                    <Radio value="page">page</Radio>
                  </RadioGroup>
                </Field>

                <Field>
                  <Label htmlFor="overflow-behavior">overflowBehavior</Label>
                  <select
                    id="overflow-behavior"
                    className={selectClassName}
                    value={overflowBehavior}
                    onChange={(e) =>
                      setOverflowBehavior(e.target.value as OverflowBehavior)
                    }
                  >
                    <option value="unbounded">Unbounded (default)</option>
                    <option value="stop">Stop</option>
                    <option value="stop-shrink">Stop + Shrink</option>
                    <option value="snap">Snap</option>
                    <option value="snap-shrink">Snap + Shrink</option>
                  </select>
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
                <Label>Grid.autoFocus</Label>
              </Field>

              <Field orientation="horizontal">
                <Checkbox
                  checked={showWeekNumbers}
                  onCheckedChange={(checked) => setShowWeekNumbers(checked)}
                />
                <Label>Show Week Numbers</Label>
              </Field>

              {viewMode === "weeks" && (
                <Field orientation="horizontal">
                  <Checkbox
                    checked={showMonthSeparators}
                    onCheckedChange={(checked) =>
                      setShowMonthSeparators(checked)
                    }
                  />
                  <Label className="font-sans text-sm">
                    Show Month Separators
                  </Label>
                </Field>
              )}

              <Field>
                <Label>Grid.orientation</Label>
                <RadioGroup
                  value={orientation}
                  onValueChange={(v) =>
                    setOrientation(v as "horizontal" | "vertical")
                  }
                >
                  <Radio value="horizontal">Horizontal (default)</Radio>
                  <Radio value="vertical">Vertical</Radio>
                </RadioGroup>
              </Field>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="state">
          <AccordionTrigger>State</AccordionTrigger>
          <AccordionContent>
            <div className="text-xs text-muted-foreground">
              <div className="mb-1">
                <Label className="inline font-sans font-medium text-xs text-muted-foreground">
                  Selection:
                </Label>{" "}
                {selectionDisplay}
              </div>
              {lastMonthChange && (
                <div>
                  <Label className="inline font-sans font-medium text-xs text-muted-foreground">
                    Last month change:
                  </Label>{" "}
                  {lastMonthChange}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
