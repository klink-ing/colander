import { useState, useMemo, useCallback } from "react";
import { Temporal } from "@js-temporal/polyfill";
import { createDatePicker } from "@/components/ui/date-picker";
import { StyledDatePicker } from "@/components/styled-date-picker";
import { RenderPropDatePicker } from "@/components/render-prop-date-picker";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const ZonedDatePicker = createDatePicker("ZonedDateTime", { temporal: Temporal });

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
  const [selectedDate, setSelectedDate] = useState<Temporal.ZonedDateTime | undefined>();
  const [selectedDate2, setSelectedDate2] = useState<Temporal.ZonedDateTime | undefined>();

  const rezoneDateValue = useCallback((val: Temporal.ZonedDateTime | undefined, newTz: string): Temporal.ZonedDateTime | undefined => {
    if (!val) return undefined;
    return val.withTimeZone(newTz);
  }, []);

  const handleTimeZoneChange = useCallback((newTz: string) => {
    setTimeZone(newTz);
    setSelectedDate((prev) => rezoneDateValue(prev, newTz));
    setSelectedDate2((prev) => rezoneDateValue(prev, newTz));
  }, [rezoneDateValue]);

  const tzOptions = useMemo(() => {
    const all = TIMEZONES.includes(systemTz) ? TIMEZONES : [systemTz, ...TIMEZONES];
    return all.map((tz) => ({ value: tz, label: formatTzLabel(tz) }));
  }, [systemTz]);

  const formatDisplay = (val: Temporal.ZonedDateTime | undefined) =>
    val
      ? `Selected: ${new Date(val.epochMilliseconds).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })} (${timeZone})`
      : "Pick a date below";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 gap-6">
      <div className="w-full max-w-2xl">
        <label
          htmlFor="timezone-select"
          className="block text-sm font-medium text-foreground mb-1.5"
        >
          Timezone
        </label>
        <select
          id="timezone-select"
          data-testid="select-timezone"
          value={timeZone}
          onChange={(e) => handleTimeZoneChange(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {tzOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-start justify-center gap-6 flex-wrap">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle data-testid="text-title">Styled DatePicker</CardTitle>
            <CardDescription data-testid="text-selected-date">
              {formatDisplay(selectedDate)}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <StyledDatePicker
              components={ZonedDatePicker}
              value={selectedDate}
              onValueChange={setSelectedDate}
              timeZone={timeZone}
            />
          </CardContent>
        </Card>

        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle data-testid="text-title-render">Render Prop DatePicker</CardTitle>
            <CardDescription data-testid="text-selected-date-render">
              {formatDisplay(selectedDate2)}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <RenderPropDatePicker
              components={ZonedDatePicker}
              value={selectedDate2}
              onValueChange={setSelectedDate2}
              timeZone={timeZone}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
