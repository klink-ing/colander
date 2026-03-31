import { Temporal } from "@js-temporal/polyfill";
import { createFileRoute } from "@tanstack/react-router";
import {
  CalendarProvider,
  type DateRange,
  type RangeMode,
  type OutsideDays,
  type OverflowBehavior,
} from "colander";
import { useState, useMemo, useCallback } from "react";
import {
  AppControls,
  TIMEZONES,
  formatTzLabel,
} from "#/components/demo/AppControls";
import { StyledMonthView } from "#/examples/styled-month-view";
import { StyledWeeksView } from "#/examples/styled-weeks-view";

export const Route = createFileRoute("/demo")({ component: DemoPage });

function DemoPage() {
  return (
    <main className="page-wrap px-4 pt-8 pb-8">
      <DemoApp />
    </main>
  );
}

function DemoApp() {
  const systemTz = useMemo(() => Temporal.Now.timeZoneId(), []);

  const [viewMode, setViewMode] = useState<"month" | "weeks">("month");

  const [selectionMode, setSelectionMode] = useState<
    "single" | "range" | "multiple"
  >("range");
  const [timeZone, setTimeZone] = useState("");
  const [locale, setLocale] = useState("en-US");
  const [disabled, setDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [weekStartDay, setWeekStartDay] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(
    0,
  );
  const [rangeMode, setRangeMode] = useState<RangeMode>("start-end");
  const [preventRangeReversal, setPreventRangeReversal] = useState(false);

  const [numberOfMonths, setNumberOfMonths] = useState(1);
  const [fixedWeeks, setFixedWeeks] = useState(false);
  const [outsideDays, setOutsideDays] = useState<OutsideDays>("enabled");
  const [autoFocus, setAutoFocus] = useState(false);
  const [showWeekNumbers, setShowWeekNumbers] = useState(false);
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">(
    "horizontal",
  );

  const [weekCount, setWeekCount] = useState(6);
  const [scrollBy, setScrollBy] = useState<"row" | "page">("row");
  const [overflowBehavior, setOverflowBehavior] =
    useState<OverflowBehavior>("unbounded");
  const [showMonthSeparators, setShowMonthSeparators] = useState(true);

  const [disableDateMode, setDisableDateMode] = useState<string>("none");
  const [monthOverflowBehavior, setMonthOverflowBehavior] = useState<
    "unbounded" | "stop"
  >("unbounded");

  interface EventLogEntry {
    timestamp: string;
    callbackName: string;
    params: unknown[];
  }
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const log = useCallback((callbackName: string, ...params: unknown[]) => {
    setEventLog((prev) => [
      ...prev.slice(-50),
      { timestamp: new Date().toISOString(), callbackName, params },
    ]);
  }, []);

  const [singleDate, setSingleDate] = useState<Temporal.ZonedDateTime | null>(
    null,
  );
  const [range, setRange] = useState<DateRange | null>(null);
  const [multipleDates, setMultipleDates] = useState<Temporal.ZonedDateTime[]>(
    [],
  );

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

  const [lastMonthChange, setLastMonthChange] = useState<string>("");

  const handleMinChange = useCallback(
    (value: string) => {
      if (!value) return;
      const pd = Temporal.PlainDate.from(value);
      setMinDate(
        pd.toZonedDateTime({
          timeZone: timeZone || systemTz,
          plainTime: Temporal.PlainTime.from("00:00"),
        }),
      );
    },
    [timeZone, systemTz],
  );

  const handleMaxChange = useCallback(
    (value: string) => {
      if (!value) return;
      const pd = Temporal.PlainDate.from(value);
      setMaxDate(
        pd.toZonedDateTime({
          timeZone: timeZone || systemTz,
          plainTime: Temporal.PlainTime.from("23:59"),
        }),
      );
    },
    [timeZone, systemTz],
  );

  const handleTimeZoneChange = useCallback((newTz: string) => {
    setTimeZone(newTz);
    if (!newTz) return;
    setSingleDate((prev) => (prev ? prev.withTimeZone(newTz) : null));
    setRange((prev) =>
      prev
        ? {
            start: prev.start?.withTimeZone(newTz) ?? null,
            end: prev.end?.withTimeZone(newTz) ?? null,
          }
        : null,
    );
    setMultipleDates((prev) => prev.map((d) => d.withTimeZone(newTz)));
  }, []);

  const isDateDisabled = useMemo(() => {
    switch (disableDateMode) {
      case "weekends":
        return (date: Temporal.PlainDate) => date.dayOfWeek >= 6;
      case "past":
        return (date: Temporal.PlainDate) => {
          const today = Temporal.Now.plainDateISO();
          return Temporal.PlainDate.compare(date, today) < 0;
        };
      case "every3rd":
        return (date: Temporal.PlainDate) => date.day % 3 === 0;
      default:
        return undefined;
    }
  }, [disableDateMode]);

  const handleMonthChange = useCallback(
    (month: Temporal.PlainYearMonth) => {
      const formatted = month.toLocaleString(locale, {
        month: "long",
        year: "numeric",
      });
      setLastMonthChange(formatted);
      log("onMonthChange", month.toString());
    },
    [locale, log],
  );

  const handleHoveredDateChange = useCallback(
    (date: Temporal.PlainDate | undefined) => {
      log("onHoveredDateChange", date?.toString());
    },
    [log],
  );

  const handleFirstWeekChange = useCallback(
    (date: Temporal.PlainDate) => {
      log("onFirstWeekChange", date.toString());
    },
    [log],
  );

  const handleWindowChange = useCallback(
    (info: any) => {
      log("onWindowChange", {
        windowStart: info.windowStart.toString(),
        windowEnd: info.windowEnd.toString(),
        weekCount: info.weekCount,
      });
    },
    [log],
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

  const formatRangeDisplay = (val: DateRange | null) =>
    val
      ? `${val.start ? new Date(val.start.epochMilliseconds).toLocaleDateString(locale, { month: "short", day: "numeric" }) : "..."} \u2013 ${val.end ? new Date(val.end.epochMilliseconds).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" }) : "..."}`
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

  const selectionProps = useMemo(() => {
    if (selectionMode === "range") {
      return {
        selectionMode: "range" as const,
        value: range,
        onValueChange: (v: DateRange | null) => {
          setRange(v);
          log("onValueChange", v);
        },
        rangeMode,
        preventRangeReversal,
        onHoveredDateChange: handleHoveredDateChange,
      };
    }
    if (selectionMode === "multiple") {
      return {
        selectionMode: "multiple" as const,
        value: multipleDates,
        onValueChange: (v: Temporal.ZonedDateTime[]) => {
          setMultipleDates(v);
          log("onValueChange", v);
        },
      };
    }
    return {
      selectionMode: "single" as const,
      value: singleDate,
      onValueChange: (v: Temporal.ZonedDateTime | null) => {
        setSingleDate(v);
        log("onValueChange", v);
      },
    };
  }, [
    selectionMode,
    range,
    singleDate,
    multipleDates,
    rangeMode,
    preventRangeReversal,
    log,
    handleHoveredDateChange,
  ]);

  return (
    <div className="flex w-full gap-8">
      <AppControls
        {...{
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
        }}
      />

      <div className="flex flex-1 flex-col gap-4 pt-8">
        <div className="flex gap-8">
          <CalendarProvider
            temporal={Temporal}
            format="ZonedDateTime"
            {...(selectionProps as any)}
            min={minDate}
            max={maxDate}
            locale={locale}
            timeZone={timeZone || undefined}
            disabled={disabled}
            readOnly={readOnly}
            weekStartDay={weekStartDay}
            isDateDisabled={isDateDisabled}
          >
            {viewMode === "month" && (
              <StyledMonthView
                numberOfMonths={numberOfMonths}
                fixedWeeks={fixedWeeks}
                outsideDays={outsideDays}
                overflowBehavior={monthOverflowBehavior}
                onMonthChange={handleMonthChange}
                autoFocus={autoFocus}
                showWeekNumbers={showWeekNumbers}
                orientation={orientation}
                preventRangeReversal={preventRangeReversal}
              />
            )}
            {viewMode === "weeks" && (
              <StyledWeeksView
                weekCount={weekCount}
                scrollBy={scrollBy}
                overflowBehavior={overflowBehavior}
                onFirstWeekChange={handleFirstWeekChange}
                onWindowChange={handleWindowChange}
                showWeekNumbers={showWeekNumbers}
                showMonthSeparators={showMonthSeparators}
                preventRangeReversal={preventRangeReversal}
                locale={locale}
              />
            )}
          </CalendarProvider>
        </div>

        <div className="w-full pt-4">
          <textarea
            readOnly
            className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs text-muted-foreground"
            rows={4}
            value={JSON.stringify(
              selectionMode === "range"
                ? range
                : selectionMode === "multiple"
                  ? multipleDates
                  : singleDate,
              (_, v) =>
                v && typeof v === "object" && "epochNanoseconds" in v
                  ? v.toString()
                  : v,
              2,
            )}
          />
        </div>
        <div className="w-full pt-2">
          <textarea
            readOnly
            className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs text-muted-foreground"
            rows={6}
            value={JSON.stringify(
              eventLog,
              (_, v) =>
                v && typeof v === "object" && "epochNanoseconds" in v
                  ? v.toString()
                  : v,
              2,
            )}
          />
        </div>
      </div>
    </div>
  );
}
