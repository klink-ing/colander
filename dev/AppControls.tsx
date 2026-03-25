import { Temporal } from "@js-temporal/polyfill";
import type { RangeMode, OutsideDays, OverflowBehavior } from "base-ui-cal";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./components/ui/accordion";

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
                <label htmlFor="selection-mode" className={propLabelClassName}>
                  selectionMode
                </label>
                <select
                  id="selection-mode"
                  value={selectionMode}
                  onChange={(e) =>
                    setSelectionMode(
                      e.target.value as "single" | "range" | "multiple",
                    )
                  }
                  className={selectClassName}
                >
                  <option value="single">Single (default)</option>
                  <option value="range">Range</option>
                  <option value="multiple">Multiple</option>
                </select>
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
                <label htmlFor="disable-dates" className={propLabelClassName}>
                  isDateDisabled
                </label>
                <select
                  id="disable-dates"
                  value={disableDateMode}
                  onChange={(e) => setDisableDateMode(e.target.value)}
                  className={selectClassName}
                >
                  <option value="none">None (default)</option>
                  <option value="weekends">Weekends</option>
                  <option value="past">Past dates</option>
                  <option value="every3rd">Every 3rd day</option>
                </select>
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
                <label
                  htmlFor="number-of-months"
                  className={propLabelClassName}
                >
                  numberOfMonths
                </label>
                <select
                  id="number-of-months"
                  className={selectClassName}
                  value={numberOfMonths}
                  onChange={(e) => setNumberOfMonths(Number(e.target.value))}
                >
                  <option value={1}>1 (default)</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </div>

              {/* outsideDays */}
              <div>
                <label htmlFor="outside-days" className={propLabelClassName}>
                  outsideDays
                </label>
                <select
                  id="outside-days"
                  value={outsideDays}
                  onChange={(e) =>
                    setOutsideDays(e.target.value as OutsideDays)
                  }
                  className={selectClassName}
                >
                  <option value="enabled">Enabled (default)</option>
                  <option value="readonly">Read-only</option>
                  <option value="disabled">Disabled</option>
                  <option value="hidden">Hidden</option>
                </select>
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
                <label htmlFor="month-overflow" className={propLabelClassName}>
                  overflowBehavior
                </label>
                <select
                  id="month-overflow"
                  value={monthOverflowBehavior}
                  onChange={(e) =>
                    setMonthOverflowBehavior(
                      e.target.value as "unbounded" | "stop",
                    )
                  }
                  className={selectClassName}
                >
                  <option value="unbounded">Unbounded (default)</option>
                  <option value="stop">Stop</option>
                </select>
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
                <label htmlFor="scroll-by" className={propLabelClassName}>
                  scrollBy
                </label>
                <select
                  id="scroll-by"
                  className={selectClassName}
                  value={scrollBy}
                  onChange={(e) =>
                    setScrollBy(e.target.value as "row" | "page")
                  }
                >
                  <option value="row">Row (one week) (default)</option>
                  <option value="page">Page (all visible)</option>
                </select>
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
                <label
                  htmlFor="orientation-select"
                  className={displayLabelClassName}
                >
                  Orientation
                </label>
                <select
                  id="orientation-select"
                  value={orientation}
                  onChange={(e) =>
                    setOrientation(
                      e.target.value as "horizontal" | "vertical",
                    )
                  }
                  className={selectClassName}
                >
                  <option value="horizontal">
                    Horizontal (weeks as rows) (default)
                  </option>
                  <option value="vertical">
                    Vertical (weeks as columns)
                  </option>
                </select>
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
