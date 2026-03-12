import { useState, useMemo, useCallback } from "react";
import { Temporal } from "@js-temporal/polyfill";
import {
  createDatePicker,
  type DateRange,
  type RangeMode,
  type OutsideDays,
} from "base-ui-cal";
import { StyledDatePicker } from "./examples/styled-date-picker";
import { RenderPropDatePicker } from "./examples/render-prop-date-picker";
import { AnchorDatePicker } from "./examples/anchor-date-picker";
import { AppControls, TIMEZONES, formatTzLabel } from "./AppControls";

const ZonedDatePicker = createDatePicker("ZonedDateTime", {
  temporal: Temporal,
});

type ExampleId = "styled" | "render-prop" | "anchor";

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
  const [rangeMode, setRangeMode] =
    useState<RangeMode>("nearest-end");
  const [allowRangeReversal, setAllowRangeReversal] = useState(false);
  const [numberOfMonths, setNumberOfMonths] = useState(1);
  const [outsideDays, setOutsideDays] = useState<OutsideDays>("enabled");
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">(
    "horizontal",
  );

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
    numberOfMonths,
    orientation,
    outsideDays,
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

    if (selectionMode === "range") {
      return (
        <StyledDatePicker
          {...commonProps}
          selectionMode="range"
          value={range}
          onValueChange={setRange}
          rangeMode={rangeMode}
          allowRangeReversal={allowRangeReversal}
        />
      );
    }
    if (selectionMode === "multiple") {
      return (
        <StyledDatePicker
          {...commonProps}
          selectionMode="multiple"
          value={multipleDates as any}
          onValueChange={setMultipleDates as any}
        />
      );
    }
    return (
      <StyledDatePicker
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
        <AppControls
          {...{
            example,
            setExample,
            orientation,
            setOrientation,
            selectionMode,
            setSelectionMode,
            rangeMode,
            setRangeMode,
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
            fixedWeeks,
            setFixedWeeks,
            autoFocus,
            setAutoFocus,
            showWeekNumbers,
            setShowWeekNumbers,
            outsideDays,
            setOutsideDays,
            allowRangeReversal,
            setAllowRangeReversal,
            numberOfMonths,
            setNumberOfMonths,
            selectionDisplay,
            lastMonthChange,
          }}
        />

        {/* Calendar area */}
        <div className="flex flex-1 flex-col items-center pt-8">
          {renderExample()}
        </div>
      </div>
    </div>
  );
}
