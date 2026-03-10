import { useState, useMemo, useCallback } from "react";
import { Temporal } from "@js-temporal/polyfill";
import { createDatePicker, type DateRange } from "@/components/ui/date-picker";
import { StyledDatePicker } from "@/examples/styled-date-picker";
import { StyledDatePickerHorizontal } from "@/examples/styled-date-picker-horizontal";
import { RenderPropDatePicker } from "@/examples/render-prop-date-picker";
import { AnchorDatePicker } from "@/examples/anchor-date-picker";

const ZonedDatePicker = createDatePicker("ZonedDateTime", {
  temporal: Temporal,
});

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

export default function Home() {
  const systemTz = useMemo(() => Temporal.Now.timeZoneId(), []);
  const [timeZone, setTimeZone] = useState(systemTz);
  const [locale, setLocale] = useState("en-US");
  const [selectionMode, setSelectionMode] = useState<"single" | "range">(
    "range",
  );
  const [singleDate, setSingleDate] = useState<
    Temporal.ZonedDateTime | undefined
  >();
  const [range, setRange] = useState<DateRange<"ZonedDateTime"> | undefined>();
  const [anchorRange, setAnchorRange] = useState<
    DateRange<"ZonedDateTime"> | undefined
  >();
  const [selectedDate2, setSelectedDate2] = useState<
    Temporal.ZonedDateTime | undefined
  >();
  const [selectedDate3, setSelectedDate3] = useState<
    Temporal.ZonedDateTime | undefined
  >();

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

  const rezoneDateValue = useCallback(
    (
      val: Temporal.ZonedDateTime | undefined,
      newTz: string,
    ): Temporal.ZonedDateTime | undefined => {
      if (!val) return undefined;
      return val.withTimeZone(newTz);
    },
    [],
  );

  const handleTimeZoneChange = useCallback(
    (newTz: string) => {
      setTimeZone(newTz);
      setRange((prev) =>
        prev
          ? {
              start: prev.start.withTimeZone(newTz),
              end: prev.end.withTimeZone(newTz),
            }
          : undefined,
      );
      setAnchorRange((prev) =>
        prev
          ? {
              start: prev.start.withTimeZone(newTz),
              end: prev.end.withTimeZone(newTz),
            }
          : undefined,
      );
      setSingleDate((prev) => rezoneDateValue(prev, newTz));
      setSelectedDate2((prev) => rezoneDateValue(prev, newTz));
      setSelectedDate3((prev) => rezoneDateValue(prev, newTz));
    },
    [rezoneDateValue],
  );

  const tzOptions = useMemo(() => {
    const all = TIMEZONES.includes(systemTz)
      ? TIMEZONES
      : [systemTz, ...TIMEZONES];
    return all.map((tz) => ({ value: tz, label: formatTzLabel(tz) }));
  }, [systemTz]);

  const formatDisplay = (val: Temporal.ZonedDateTime | undefined) =>
    val
      ? `Selected: ${new Date(val.epochMilliseconds).toLocaleDateString(locale, { weekday: "long", year: "numeric", month: "long", day: "numeric" })} (${timeZone})`
      : "Pick a date below";

  const formatRangeDisplay = (val: DateRange<"ZonedDateTime"> | undefined) =>
    val
      ? `Range: ${new Date(val.start.epochMilliseconds).toLocaleDateString(locale, { month: "short", day: "numeric" })} – ${new Date(val.end.epochMilliseconds).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })}`
      : "Pick a range below";

  const selectClassName =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6">
      <div className="flex w-full max-w-2xl gap-4">
        <div className="flex-1">
          <label
            htmlFor="timezone-select"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Timezone
          </label>
          <select
            id="timezone-select"
            data-testid="select-timezone"
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

        <div className="flex-1">
          <label
            htmlFor="locale-select"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Locale
          </label>
          <select
            id="locale-select"
            data-testid="select-locale"
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
      </div>

      <div className="flex w-full max-w-2xl gap-4">
        <div className="flex-1">
          <label
            htmlFor="min-date"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Min Date
          </label>
          <input
            id="min-date"
            type="date"
            data-testid="input-min-date"
            value={toInputValue(minDate)}
            onChange={(e) => handleMinChange(e.target.value)}
            className={selectClassName}
          />
        </div>

        <div className="flex-1">
          <label
            htmlFor="max-date"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Max Date
          </label>
          <input
            id="max-date"
            type="date"
            data-testid="input-max-date"
            value={toInputValue(maxDate)}
            onChange={(e) => handleMaxChange(e.target.value)}
            className={selectClassName}
          />
        </div>
      </div>

      <div className="flex w-full max-w-2xl items-center gap-3">
        <span className="text-sm font-medium text-foreground">
          Selection Mode:
        </span>
        <button
          type="button"
          data-testid="toggle-selection-mode"
          onClick={() =>
            setSelectionMode((m) => (m === "single" ? "range" : "single"))
          }
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${selectionMode === "range" ? "bg-primary" : "bg-input"}`}
          role="switch"
          aria-checked={selectionMode === "range"}
          aria-label="Toggle range selection"
        >
          <span
            className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${selectionMode === "range" ? "translate-x-5" : "translate-x-0"}`}
          />
        </button>
        <span
          className="text-sm text-muted-foreground"
          data-testid="text-selection-mode"
        >
          {selectionMode === "range" ? "Range" : "Single"}
        </span>
      </div>

      <div className="flex flex-wrap items-start justify-center gap-4">
        <div className="w-min">
          Styled DatePicker
          {selectionMode === "range"
            ? formatRangeDisplay(range)
            : formatDisplay(singleDate)}
          {selectionMode === "range" ? (
            <StyledDatePicker
              components={ZonedDatePicker}
              selectionMode="range"
              value={range}
              onValueChange={setRange}
              min={minDate}
              max={maxDate}
              locale={locale}
              timeZone={timeZone}
            />
          ) : (
            <StyledDatePicker
              components={ZonedDatePicker}
              selectionMode="single"
              value={singleDate}
              onValueChange={setSingleDate}
              min={minDate}
              max={maxDate}
              locale={locale}
              timeZone={timeZone}
            />
          )}
        </div>

        <div className="w-min">
          Anchor-Positioned DatePicker
          {formatRangeDisplay(anchorRange)}
          <AnchorDatePicker
            components={ZonedDatePicker}
            value={anchorRange}
            onValueChange={setAnchorRange}
            min={minDate}
            max={maxDate}
            locale={locale}
            timeZone={timeZone}
          />
        </div>

        <div className="w-min">
          Render Prop DatePicker
          {formatDisplay(selectedDate2)}
          <RenderPropDatePicker
            components={ZonedDatePicker}
            value={selectedDate2}
            onValueChange={setSelectedDate2}
            min={minDate}
            max={maxDate}
            locale={locale}
            timeZone={timeZone}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-center gap-4">
        <div>
          Horizontal DatePicker
          {formatDisplay(selectedDate3)}
          <StyledDatePickerHorizontal
            components={ZonedDatePicker}
            value={selectedDate3}
            onValueChange={setSelectedDate3}
            min={minDate}
            max={maxDate}
            locale={locale}
            timeZone={timeZone}
          />
        </div>
      </div>
    </div>
  );
}
