import { Temporal } from "@js-temporal/polyfill";
import type { RangeMode, OutsideDays, OverflowBehavior } from "base-ui-cal";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "./components/ui/radio-group";

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
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const propLabelClassName = "mb-1.5 block font-mono text-xs text-foreground";

const displayLabelClassName =
  "mb-1.5 block text-sm font-medium text-foreground";

const checkboxClassName =
  "flex items-center gap-2 text-sm text-foreground cursor-pointer select-none";

export interface AppControlsProps {
  // Shared (CalendarProvider)
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

  // Month View
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

  // Weeks View
  weekCount: number;
  setWeekCount: (v: number) => void;
  scrollBy: "row" | "page";
  setScrollBy: (v: "row" | "page") => void;
  overflowBehavior: OverflowBehavior;
  setOverflowBehavior: (v: OverflowBehavior) => void;
  showMonthSeparators: boolean;
  setShowMonthSeparators: (v: boolean) => void;

  // New controls
  disableDateMode: string;
  setDisableDateMode: (v: string) => void;
  monthOverflowBehavior: "unbounded" | "stop";
  setMonthOverflowBehavior: (v: "unbounded" | "stop") => void;

  // State readout
  selectionDisplay: string;
  lastMonthChange: string;
}

const toInputValue = (zdt: Temporal.ZonedDateTime) =>
  zdt.toPlainDate().toString();

export function AppControls(props: AppControlsProps) {
  const {
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
      <h2 className="text-foreground mb-2 text-lg font-semibold">Controls</h2>

      <Accordion
        type="multiple"
        defaultValue={["calendar-provider", "display-options"]}
      >
        {/* ── Section 1: CalendarProvider ── */}
        <AccordionItem value="calendar-provider">
          <AccordionTrigger>CalendarProvider</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              {/* selectionMode */}
              <div>
                <div className={propLabelClassName}>selectionMode</div>
                <RadioGroup
                  value={selectionMode}
                  onValueChange={(v) => setSelectionMode(v as "single" | "range" | "multiple")}
                >
                  <RadioGroupItem value="single" label="single (default)" />
                  <RadioGroupItem value="range" label="range" />
                  <RadioGroupItem value="multiple" label="multiple" />
                </RadioGroup>
              </div>

              {/* rangeMode */}
              {selectionMode === "range" && (
                <div>
                  <label htmlFor="range-mode" className={propLabelClassName}>
                    rangeMode
                  </label>
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
                </div>
              )}

              {/* preventRangeReversal */}
              {selectionMode === "range" && (
                <label className={checkboxClassName}>
                  <input
                    type="checkbox"
                    checked={preventRangeReversal}
                    onChange={(e) =>
                      setPreventRangeReversal(e.target.checked)
                    }
                  />
                  <span className="font-mono text-xs">
                    preventRangeReversal
                  </span>
                </label>
              )}

              {/* timeZone */}
              <div>
                <label
                  htmlFor="timezone-select"
                  className={propLabelClassName}
                >
                  timeZone
                </label>
                <select
                  id="timezone-select"
                  value={timeZone}
                  onChange={(e) => handleTimeZoneChange(e.target.value)}
                  className={selectClassName}
                >
                  {tzOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* locale */}
              <div>
                <label htmlFor="locale-select" className={propLabelClassName}>
                  locale
                </label>
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
              </div>

              {/* weekStartDay */}
              <div>
                <label htmlFor="week-start-day" className={propLabelClassName}>
                  weekStartDay
                </label>
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
              </div>

              {/* min / max */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label htmlFor="min-date" className={propLabelClassName}>
                    min
                  </label>
                  <input
                    id="min-date"
                    type="date"
                    value={toInputValue(minDate)}
                    onChange={(e) => handleMinChange(e.target.value)}
                    className={selectClassName}
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="max-date" className={propLabelClassName}>
                    max
                  </label>
                  <input
                    id="max-date"
                    type="date"
                    value={toInputValue(maxDate)}
                    onChange={(e) => handleMaxChange(e.target.value)}
                    className={selectClassName}
                  />
                </div>
              </div>

              {/* disabled */}
              <label className={checkboxClassName}>
                <input
                  type="checkbox"
                  checked={disabled}
                  onChange={(e) => setDisabled(e.target.checked)}
                />
                <span className="font-mono text-xs">disabled</span>
              </label>

              {/* readOnly */}
              <label className={checkboxClassName}>
                <input
                  type="checkbox"
                  checked={readOnly}
                  onChange={(e) => setReadOnly(e.target.checked)}
                />
                <span className="font-mono text-xs">readOnly</span>
              </label>

              {/* isDateDisabled */}
              <div>
                <div className={propLabelClassName}>isDateDisabled</div>
                <RadioGroup
                  value={disableDateMode}
                  onValueChange={setDisableDateMode}
                >
                  <RadioGroupItem value="none" label="None (default)" />
                  <RadioGroupItem value="weekends" label="Weekends" />
                  <RadioGroupItem value="past" label="Past dates" />
                  <RadioGroupItem value="every3rd" label="Every 3rd day" />
                </RadioGroup>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Section 2: MonthView.Root ── */}
        <AccordionItem value="month-view">
          <AccordionTrigger>MonthView.Root</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              {/* numberOfMonths */}
              <div>
                <div className={propLabelClassName}>numberOfMonths</div>
                <RadioGroup
                  value={String(numberOfMonths)}
                  onValueChange={(v) => setNumberOfMonths(Number(v))}
                >
                  <RadioGroupItem value="1" label="1 (default)" />
                  <RadioGroupItem value="2" label="2" />
                  <RadioGroupItem value="3" label="3" />
                </RadioGroup>
              </div>

              {/* outsideDays */}
              <div>
                <div className={propLabelClassName}>outsideDays</div>
                <RadioGroup
                  value={outsideDays}
                  onValueChange={(v) => setOutsideDays(v as OutsideDays)}
                >
                  <RadioGroupItem value="enabled" label="enabled (default)" />
                  <RadioGroupItem value="readonly" label="readonly" />
                  <RadioGroupItem value="disabled" label="disabled" />
                  <RadioGroupItem value="hidden" label="hidden" />
                </RadioGroup>
              </div>

              {/* fixedWeeks */}
              <label className={checkboxClassName}>
                <input
                  type="checkbox"
                  checked={fixedWeeks}
                  onChange={(e) => setFixedWeeks(e.target.checked)}
                />
                <span className="font-mono text-xs">fixedWeeks</span>
              </label>

              {/* overflowBehavior (month) */}
              <div>
                <div className={propLabelClassName}>overflowBehavior</div>
                <RadioGroup
                  value={monthOverflowBehavior}
                  onValueChange={(v) => setMonthOverflowBehavior(v as "unbounded" | "stop")}
                >
                  <RadioGroupItem value="unbounded" label="unbounded (default)" />
                  <RadioGroupItem value="stop" label="stop" />
                </RadioGroup>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Section 3: WeeksView.Root ── */}
        <AccordionItem value="weeks-view">
          <AccordionTrigger>WeeksView.Root</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              {/* weekCount */}
              <div>
                <label htmlFor="week-count" className={propLabelClassName}>
                  weekCount
                </label>
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
              </div>

              {/* scrollBy */}
              <div>
                <div className={propLabelClassName}>scrollBy</div>
                <RadioGroup
                  value={scrollBy}
                  onValueChange={(v) => setScrollBy(v as "row" | "page")}
                >
                  <RadioGroupItem value="row" label="row (default)" />
                  <RadioGroupItem value="page" label="page" />
                </RadioGroup>
              </div>

              {/* overflowBehavior (weeks) */}
              <div>
                <label
                  htmlFor="overflow-behavior"
                  className={propLabelClassName}
                >
                  overflowBehavior
                </label>
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
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Section 4: Display Options ── */}
        <AccordionItem value="display-options">
          <AccordionTrigger>Display Options</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              <label className={checkboxClassName}>
                <input
                  type="checkbox"
                  checked={autoFocus}
                  onChange={(e) => setAutoFocus(e.target.checked)}
                />
                Auto Focus
              </label>

              <label className={checkboxClassName}>
                <input
                  type="checkbox"
                  checked={showWeekNumbers}
                  onChange={(e) => setShowWeekNumbers(e.target.checked)}
                />
                Show Week Numbers
              </label>

              <label className={checkboxClassName}>
                <input
                  type="checkbox"
                  checked={showMonthSeparators}
                  onChange={(e) => setShowMonthSeparators(e.target.checked)}
                />
                Show Month Separators
              </label>

              <div>
                <div className={displayLabelClassName}>Orientation</div>
                <RadioGroup
                  value={orientation}
                  onValueChange={(v) => setOrientation(v as "horizontal" | "vertical")}
                >
                  <RadioGroupItem value="horizontal" label="Horizontal (default)" />
                  <RadioGroupItem value="vertical" label="Vertical" />
                </RadioGroup>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Section 5: State ── */}
        <AccordionItem value="state">
          <AccordionTrigger>State</AccordionTrigger>
          <AccordionContent>
            <div className="text-muted-foreground text-xs">
              <div className="mb-1">
                <span className="font-medium">Selection:</span>{" "}
                {selectionDisplay}
              </div>
              {lastMonthChange && (
                <div>
                  <span className="font-medium">Last month change:</span>{" "}
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
