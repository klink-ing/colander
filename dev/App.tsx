import { useState, useMemo, useCallback } from "react";
import { Temporal } from "@js-temporal/polyfill";
import {
  createDatePicker,
  type DateRange,
  type InsideRangeAction,
} from "base-ui-cal";
import { StyledDatePicker } from "./examples/styled-date-picker";
import { StyledDatePickerHorizontal } from "./examples/styled-date-picker-horizontal";
import { RenderPropDatePicker } from "./examples/render-prop-date-picker";
import { AnchorDatePicker } from "./examples/anchor-date-picker";

const ZonedDatePicker = createDatePicker("ZonedDateTime", {
  temporal: Temporal,
});

type ExampleId = "styled" | "horizontal" | "render-prop" | "anchor";

const EXAMPLES: { value: ExampleId; label: string }[] = [
  { value: "styled", label: "Styled DatePicker" },
  { value: "horizontal", label: "Horizontal DatePicker" },
  { value: "render-prop", label: "Render Prop DatePicker" },
  { value: "anchor", label: "Anchor-Positioned DatePicker" },
];

const TIMEZONES = [
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

const LOCALES = [
  { value: "en-US", label: "English (US)" },
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

const WEEK_START_DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

function formatTzLabel(tz: string): string {
  try {
    const now = Temporal.Now.zonedDateTimeISO(tz);
    const offset = now.offset;
    const city = tz.split("/").pop()?.replace(/_/g, " ") ?? tz;
    return `${city} (UTC${offset})`;
  } catch {
    return tz;
  }
}

export default function App() {
  const systemTz = useMemo(() => Temporal.Now.timeZoneId(), []);

  // Example selector
  const [example, setExample] = useState<ExampleId>("styled");

  // Root props
  const [selectionMode, setSelectionMode] = useState<
    "single" | "range" | "multiple"
  >("range");
  const [timeZone, setTimeZone] = useState(systemTz);
  const [locale, setLocale] = useState("en-US");
  const [disabled, setDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [fixedWeeks, setFixedWeeks] = useState(false);
  const [weekStartDay, setWeekStartDay] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(
    0,
  );
  const [autoFocus, setAutoFocus] = useState(false);
  const [showWeekNumbers, setShowWeekNumbers] = useState(false);
  const [insideRangeAction, setInsideRangeAction] =
    useState<InsideRangeAction>("nearest-end");
  const [allowRangeReversal, setAllowRangeReversal] = useState(false);

  // Value state
  const [singleDate, setSingleDate] = useState<
    Temporal.ZonedDateTime | null
  >(null);
  const [range, setRange] = useState<DateRange<"ZonedDateTime"> | null>(null);
  const [multipleDates, setMultipleDates] = useState<
    Temporal.ZonedDateTime[]
  >([]);

  // Min/max
  const defaultMin = useMemo(
    () => Temporal.Now.zonedDateTimeISO(systemTz).subtract({ months: 7 }),
    [systemTz],
  );
  const defaultMax = useMemo(
    () => Temporal.Now.zonedDateTimeISO(systemTz).add({ months: 7 }),
    [systemTz],
  );
  const [minDate, setMinDate] = useState<Temporal.ZonedDateTime>(defaultMin);
  const [maxDate, setMaxDate] = useState<Temporal.ZonedDateTime>(defaultMax);

  // Month change tracking
  const [lastMonthChange, setLastMonthChange] = useState<string>("");

  const toInputValue = (zdt: Temporal.ZonedDateTime) =>
    zdt.toPlainDate().toString();

  const handleMinChange = useCallback(
    (value: string) => {
      if (!value) return;
      const pd = Temporal.PlainDate.from(value);
      setMinDate(
        pd.toZonedDateTime({
          timeZone,
          plainTime: Temporal.PlainTime.from("00:00"),
        }),
      );
    },
    [timeZone],
  );

  const handleMaxChange = useCallback(
    (value: string) => {
      if (!value) return;
      const pd = Temporal.PlainDate.from(value);
      setMaxDate(
        pd.toZonedDateTime({
          timeZone,
          plainTime: Temporal.PlainTime.from("23:59"),
        }),
      );
    },
    [timeZone],
  );

  const handleTimeZoneChange = useCallback((newTz: string) => {
    setTimeZone(newTz);
    setSingleDate((prev) => (prev ? prev.withTimeZone(newTz) : null));
    setRange((prev) =>
      prev
        ? {
            start: prev.start.withTimeZone(newTz),
            end: prev.end.withTimeZone(newTz),
          }
        : null,
    );
    setMultipleDates((prev) =>
      prev.map((d) => d.withTimeZone(newTz)),
    );
  }, []);

  const handleMonthChange = useCallback(
    (month: Temporal.PlainYearMonth) => {
      const formatted = month.toLocaleString(locale, {
        month: "long",
        year: "numeric",
      });
      setLastMonthChange(formatted);
    },
    [locale],
  );

  const tzOptions = useMemo(() => {
    const all = TIMEZONES.includes(systemTz)
      ? TIMEZONES
      : [systemTz, ...TIMEZONES];
    return all.map((tz) => ({ value: tz, label: formatTzLabel(tz) }));
  }, [systemTz]);

  const formatDisplay = (val: Temporal.ZonedDateTime | null) =>
    val
      ? new Date(val.epochMilliseconds).toLocaleDateString(locale, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "No selection";

  const formatRangeDisplay = (val: DateRange<"ZonedDateTime"> | null) =>
    val
      ? `${new Date(val.start.epochMilliseconds).toLocaleDateString(locale, { month: "short", day: "numeric" })} \u2013 ${new Date(val.end.epochMilliseconds).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}`
      : "No selection";

  const formatMultipleDisplay = (val: Temporal.ZonedDateTime[]) =>
    val.length > 0
      ? val
          .map((d) =>
            new Date(d.epochMilliseconds).toLocaleDateString(locale, {
              month: "short",
              day: "numeric",
            }),
          )
          .join(", ")
      : "No selection";

  const selectionDisplay =
    selectionMode === "range"
      ? formatRangeDisplay(range)
      : selectionMode === "multiple"
        ? formatMultipleDisplay(multipleDates)
        : formatDisplay(singleDate);

  const selectClassName =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  const labelClassName = "mb-1.5 block text-sm font-medium text-foreground";

  const checkboxClassName =
    "flex items-center gap-2 text-sm text-foreground cursor-pointer select-none";

  // Common props shared by all examples
  const commonProps = {
    components: ZonedDatePicker,
    min: minDate,
    max: maxDate,
    locale,
    timeZone,
    disabled,
    readOnly,
    fixedWeeks,
    weekStartDay,
    autoFocus,
    onMonthChange: handleMonthChange,
    showWeekNumbers,
  } as const;

  function renderExample() {
    // Anchor example is always range mode
    if (example === "anchor") {
      return (
        <AnchorDatePicker
          {...commonProps}
          value={range}
          onValueChange={setRange}
        />
      );
    }

    // Render prop example is always single mode
    if (example === "render-prop") {
      return (
        <RenderPropDatePicker
          {...commonProps}
          value={singleDate}
          onValueChange={setSingleDate}
        />
      );
    }

    const Component =
      example === "horizontal" ? StyledDatePickerHorizontal : StyledDatePicker;

    if (selectionMode === "range") {
      return (
        <Component
          {...commonProps}
          selectionMode="range"
          value={range}
          onValueChange={setRange}
          insideRangeAction={insideRangeAction}
          allowRangeReversal={allowRangeReversal}
        />
      );
    }
    if (selectionMode === "multiple") {
      return (
        <Component
          {...commonProps}
          selectionMode="multiple"
          value={multipleDates as any}
          onValueChange={setMultipleDates as any}
        />
      );
    }
    return (
      <Component
        {...commonProps}
        selectionMode="single"
        value={singleDate}
        onValueChange={setSingleDate}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-background p-6">
      <div className="flex w-full max-w-4xl gap-8">
        {/* Controls panel */}
        <div className="flex w-64 shrink-0 flex-col gap-4">
          <h2 className="text-lg font-semibold text-foreground">Controls</h2>

          {/* Example selector */}
          <div>
            <label htmlFor="example-select" className={labelClassName}>
              Example
            </label>
            <select
              id="example-select"
              value={example}
              onChange={(e) => setExample(e.target.value as ExampleId)}
              className={selectClassName}
            >
              {EXAMPLES.map((ex) => (
                <option key={ex.value} value={ex.value}>
                  {ex.label}
                </option>
              ))}
            </select>
          </div>

          {/* Selection mode */}
          <div>
            <label htmlFor="selection-mode" className={labelClassName}>
              Selection Mode
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
              <option value="single">Single</option>
              <option value="range">Range</option>
              <option value="multiple">Multiple</option>
            </select>
          </div>

          {/* Inside range action (range mode only) */}
          {selectionMode === "range" && (
            <div>
              <label htmlFor="inside-range-action" className={labelClassName}>
                Inside Range Click
              </label>
              <select
                id="inside-range-action"
                value={insideRangeAction}
                onChange={(e) =>
                  setInsideRangeAction(e.target.value as InsideRangeAction)
                }
                className={selectClassName}
              >
                <option value="end">Adjust End</option>
                <option value="start">Adjust Start</option>
                <option value="nearest-end">Nearest (tie: End)</option>
                <option value="nearest-start">Nearest (tie: Start)</option>
                <option value="reset">Reset to Single Day</option>
              </select>
            </div>
          )}

          {/* Timezone */}
          <div>
            <label htmlFor="timezone-select" className={labelClassName}>
              Timezone
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

          {/* Locale */}
          <div>
            <label htmlFor="locale-select" className={labelClassName}>
              Locale
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

          {/* Week start day */}
          <div>
            <label htmlFor="week-start-day" className={labelClassName}>
              Week Start Day
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

          {/* Min/Max dates */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor="min-date" className={labelClassName}>
                Min
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
              <label htmlFor="max-date" className={labelClassName}>
                Max
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

          {/* Boolean toggles */}
          <div className="flex flex-col gap-2 border-t border-input pt-3">
            <label className={checkboxClassName}>
              <input
                type="checkbox"
                checked={disabled}
                onChange={(e) => setDisabled(e.target.checked)}
              />
              Disabled
            </label>
            <label className={checkboxClassName}>
              <input
                type="checkbox"
                checked={readOnly}
                onChange={(e) => setReadOnly(e.target.checked)}
              />
              Read Only
            </label>
            <label className={checkboxClassName}>
              <input
                type="checkbox"
                checked={fixedWeeks}
                onChange={(e) => setFixedWeeks(e.target.checked)}
              />
              Fixed Weeks (6 rows)
            </label>
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
              Week Numbers
            </label>
            {selectionMode === "range" && (
              <label className={checkboxClassName}>
                <input
                  type="checkbox"
                  checked={allowRangeReversal}
                  onChange={(e) => setAllowRangeReversal(e.target.checked)}
                />
                Allow Range Reversal (drag)
              </label>
            )}
          </div>

          {/* State readout */}
          <div className="border-t border-input pt-3">
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              State
            </h3>
            <div className="text-xs text-muted-foreground">
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
          </div>
        </div>

        {/* Calendar area */}
        <div className="flex flex-1 flex-col items-center pt-8">
          {renderExample()}
        </div>
      </div>
    </div>
  );
}
