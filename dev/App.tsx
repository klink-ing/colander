import { useState, useMemo, useCallback } from "react";
import { Temporal } from "@js-temporal/polyfill";
import {
  CalendarProvider,
  MonthView,
  WeeksView,
  PrevWeeksButton,
  NextWeeksButton,
  MonthSeparator,
  WeekNumberCell,
  WeekNumberHeader,
  useWeeksViewState,
  useCalendarStable,
  type DateRange,
  type RangeMode,
  type OutsideDays,
  type OverflowBehavior,
} from "base-ui-cal";
import {
  StyledPrevMonthButton,
  StyledNextMonthButton,
  StyledMonthYearString,
  StyledGrid,
  StyledGridHeader,
  StyledGridHeaderCell,
  StyledGridBody,
  StyledWeekTemplate,
  StyledDayCellTemplate,
  StyledRangeSelected,
  StyledRangePreview,
} from "./examples/date-picker-styled";
import { AppControls, TIMEZONES, formatTzLabel } from "./AppControls";
import { cn } from "./lib/utils";

function WeeksViewHeader() {
  const { windowInfo } = useWeeksViewState();
  const { locale } = useCalendarStable();
  const { visibleMonths } = windowInfo;

  const maxShow = 3;
  const monthNames = visibleMonths.slice(0, maxShow).map((vm) => {
    const date = new Date(vm.year, vm.month - 1, 1);
    return new Intl.DateTimeFormat(locale, { month: "short" }).format(date);
  });
  const hasMore = visibleMonths.length > maxShow;
  const label = monthNames.join("/") + (hasMore ? "/..." : "");

  // Show year(s)
  const years = [...new Set(visibleMonths.map((vm) => vm.year))];
  const yearLabel = years.join("/");

  return (
    <span className="text-sm font-medium">
      {label} {yearLabel}
    </span>
  );
}

export default function App() {
  const systemTz = useMemo(() => Temporal.Now.timeZoneId(), []);

  // ── CalendarProvider options ──
  const [selectionMode, setSelectionMode] = useState<
    "single" | "range" | "multiple"
  >("range");
  const [timeZone, setTimeZone] = useState(systemTz);
  const [locale, setLocale] = useState("en-US");
  const [disabled, setDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [weekStartDay, setWeekStartDay] = useState<0 | 1 | 2 | 3 | 4 | 5 | 6>(
    0,
  );
  const [rangeMode, setRangeMode] = useState<RangeMode>("start-end");
  const [preventRangeReversal, setPreventRangeReversal] = useState(false);

  // ── Month View options ──
  const [numberOfMonths, setNumberOfMonths] = useState(1);
  const [fixedWeeks, setFixedWeeks] = useState(false);
  const [outsideDays, setOutsideDays] = useState<OutsideDays>("enabled");
  const [autoFocus, setAutoFocus] = useState(false);
  const [showWeekNumbers, setShowWeekNumbers] = useState(false);
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">(
    "horizontal",
  );

  // ── Weeks View options ──
  const [weekCount, setWeekCount] = useState(6);
  const [scrollBy, setScrollBy] = useState<"row" | "page">("row");
  const [overflowBehavior, setOverflowBehavior] =
    useState<OverflowBehavior>("unbounded");
  const [showMonthSeparators, setShowMonthSeparators] = useState(true);

  // ── Value state ──
  const [singleDate, setSingleDate] = useState<Temporal.ZonedDateTime | null>(
    null,
  );
  const [range, setRange] = useState<DateRange<"ZonedDateTime"> | null>(null);
  const [multipleDates, setMultipleDates] = useState<Temporal.ZonedDateTime[]>(
    [],
  );

  // ── Min/max ──
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

  // ── Month change tracking ──
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
            start: prev.start?.withTimeZone(newTz) ?? null,
            end: prev.end?.withTimeZone(newTz) ?? null,
          }
        : null,
    );
    setMultipleDates((prev) => prev.map((d) => d.withTimeZone(newTz)));
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

  // ── Selection props for CalendarProvider ──
  const selectionProps = useMemo(() => {
    if (selectionMode === "range") {
      return {
        selectionMode: "range" as const,
        value: range,
        onValueChange: setRange,
        rangeMode,
        preventRangeReversal,
      };
    }
    if (selectionMode === "multiple") {
      return {
        selectionMode: "multiple" as const,
        value: multipleDates,
        onValueChange: setMultipleDates,
      };
    }
    return {
      selectionMode: "single" as const,
      value: singleDate,
      onValueChange: setSingleDate,
    };
  }, [
    selectionMode,
    range,
    singleDate,
    multipleDates,
    rangeMode,
    preventRangeReversal,
  ]);

  const isVertical = orientation === "vertical";

  const renderMonthGrid = (monthIndex: number) => (
    <div key={monthIndex}>
      {numberOfMonths > 1 && (
        <div className="flex items-center justify-center px-1 pb-3">
          <StyledMonthYearString monthIndex={monthIndex} />
        </div>
      )}
      <StyledGrid
        monthIndex={monthIndex}
        orientation={orientation}
        autoFocus={monthIndex === 0 ? autoFocus : undefined}
        className={cn(
          !isVertical &&
            showWeekNumbers &&
            "grid-cols-[auto_repeat(var(--calendar-days-per-week),1fr)]",
          isVertical &&
            showWeekNumbers &&
            "w-fit auto-cols-auto grid-flow-col grid-cols-none grid-rows-[auto_repeat(var(--calendar-days-per-week),1fr)]",
          isVertical &&
            !showWeekNumbers &&
            "w-fit auto-cols-auto grid-flow-col grid-cols-none grid-rows-[repeat(var(--calendar-days-per-week),1fr)]",
        )}
      >
        <StyledGridHeader
          className={
            isVertical
              ? cn(
                  "contents",
                  "[&>tr]:col-auto [&>tr]:row-span-full [&>tr]:grid [&>tr]:grid-cols-[unset] [&>tr]:grid-rows-subgrid",
                )
              : undefined
          }
        >
          {showWeekNumbers && (
            <WeekNumberHeader
              className={cn(
                "text-muted-foreground p-1 text-center text-[0.7rem] font-normal",
                !isVertical && "w-8",
                isVertical && "flex items-center",
              )}
              render={({ children, ...props }) => (
                <th {...props}>
                  <span className="inline-block w-[2ch] text-right">
                    {children}
                  </span>
                </th>
              )}
            />
          )}
          <StyledGridHeaderCell
            className={
              isVertical ? "flex w-fit items-center text-right" : undefined
            }
          />
        </StyledGridHeader>
        <StyledGridBody
          className={
            isVertical
              ? "col-auto row-span-full auto-cols-fr grid-flow-col grid-cols-[unset] grid-rows-subgrid gap-x-1 gap-y-0"
              : undefined
          }
        >
          <StyledWeekTemplate
            className={
              isVertical
                ? "col-auto row-span-full grid-cols-[unset] grid-rows-subgrid"
                : undefined
            }
          >
            {showWeekNumbers && (
              <WeekNumberCell
                className={cn(
                  "text-muted-foreground p-1 text-center text-[0.7rem] tabular-nums",
                  !isVertical && "w-8",
                  isVertical && "flex items-center justify-center",
                )}
                render={({ children, ...props }) => (
                  <td {...props}>
                    <span className="inline-block w-[2ch] text-right">
                      {children}
                    </span>
                  </td>
                )}
              />
            )}
            <StyledRangeSelected columnOffset={showWeekNumbers ? 1 : 0} />
            <StyledRangePreview columnOffset={showWeekNumbers ? 1 : 0} />
            <StyledDayCellTemplate
              columnOffset={showWeekNumbers ? 1 : 0}
              preventRangeReversal={preventRangeReversal}
            />
          </StyledWeekTemplate>
        </StyledGridBody>
      </StyledGrid>
    </div>
  );

  const navButtonClassName = cn(
    "inline-flex h-7 w-7 items-center justify-center rounded-md",
    "text-muted-foreground transition-colors",
    "hover:bg-accent hover:text-accent-foreground",
    "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
    "disabled:pointer-events-none disabled:opacity-50",
  );

  return (
    <div className="bg-background flex min-h-screen flex-col items-center p-6">
      <div className="flex w-full max-w-5xl gap-8">
        {/* Controls panel */}
        <AppControls
          {...{
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
            selectionDisplay,
            lastMonthChange,
          }}
        />

        {/* Calendar area */}
        <div className="flex flex-1 flex-col gap-4 pt-8">
          <div className="flex gap-8">
            <CalendarProvider
              temporal={Temporal}
              format="ZonedDateTime"
              {...(selectionProps as any)}
              min={minDate}
              max={maxDate}
              locale={locale}
              timeZone={timeZone}
              disabled={disabled}
              readOnly={readOnly}
              weekStartDay={weekStartDay}
            >
              {/* Month View */}
              <div>
                <h3 className="text-foreground mb-3 text-sm font-semibold">
                  Month View
                </h3>
                <MonthView.Root
                  numberOfMonths={numberOfMonths}
                  fixedWeeks={fixedWeeks}
                  outsideDays={outsideDays}
                  onMonthChange={handleMonthChange}
                >
                  <div className="p-3">
                    {numberOfMonths === 1 && (
                      <div className="flex items-center justify-between gap-1 px-1 pb-3">
                        <StyledPrevMonthButton />
                        <StyledMonthYearString />
                        <StyledNextMonthButton />
                      </div>
                    )}
                    {numberOfMonths > 1 && (
                      <div className="flex items-center justify-between gap-1 px-1 pb-3">
                        <StyledPrevMonthButton />
                        <div />
                        <StyledNextMonthButton />
                      </div>
                    )}
                    <div
                      className={numberOfMonths > 1 ? "flex gap-4" : undefined}
                    >
                      {Array.from({ length: numberOfMonths }, (_, i) =>
                        renderMonthGrid(i),
                      )}
                    </div>
                  </div>
                </MonthView.Root>
              </div>

              {/* Weeks View */}
              <div>
                <h3 className="text-foreground mb-3 text-sm font-semibold">
                  Weeks View
                </h3>
                <WeeksView.Root
                  weekCount={weekCount}
                  scrollBy={scrollBy}
                  overflowBehavior={overflowBehavior}
                >
                  <div className="p-3">
                    <div className="flex items-center justify-between gap-1 px-1 pb-3">
                      <PrevWeeksButton className={navButtonClassName}>
                        ↑
                      </PrevWeeksButton>
                      <WeeksViewHeader />
                      <NextWeeksButton className={navButtonClassName}>
                        ↓
                      </NextWeeksButton>
                    </div>
                    <StyledGrid
                      className={cn(
                        "grid w-full grid-cols-[repeat(var(--calendar-days-per-week),1fr)]",
                        showWeekNumbers &&
                          !showMonthSeparators &&
                          "grid-cols-[auto_repeat(var(--calendar-days-per-week),1fr)]",
                        showWeekNumbers &&
                          showMonthSeparators &&
                          "grid-cols-[auto_repeat(var(--calendar-days-per-week),1fr)_auto]",
                        !showWeekNumbers &&
                          showMonthSeparators &&
                          "grid-cols-[repeat(var(--calendar-days-per-week),1fr)_auto]",
                      )}
                    >
                      <StyledGridHeader>
                        {showWeekNumbers && (
                          <WeekNumberHeader
                            className="text-muted-foreground w-8 p-1 text-center text-[0.7rem] font-normal"
                            render={({ children, ...props }) => (
                              <th {...props}>
                                <span className="inline-block w-[2ch] text-right">
                                  {children}
                                </span>
                              </th>
                            )}
                          />
                        )}
                        <StyledGridHeaderCell />
                        {showMonthSeparators && <th />}
                      </StyledGridHeader>
                      <StyledGridBody>
                        {showMonthSeparators && (
                          <MonthSeparator.Row
                            render={(renderProps, state) => {
                              const borderFromCol =
                                state.firstDayColumn +
                                1 +
                                (showWeekNumbers ? 1 : 0);
                              const showLabel =
                                state.fullWeeksVisibleAfter >= 2;
                              return (
                                <tr
                                  {...renderProps}
                                  className={cn(
                                    renderProps.className,
                                    "contents",
                                  )}
                                >
                                  <td className="contents">
                                    {/* Border: top + left with rounded corner */}
                                    {state.firstDayVisible && (
                                      <div
                                        aria-hidden
                                        className="border-muted-foreground pointer-events-none relative z-10 -mt-px mb-(--radius-md) -ml-px rounded-tl-[calc(var(--radius-md)+1px)] border-t border-l"
                                        style={{
                                          gridColumn: `${borderFromCol} / -1`,
                                          gridRow: `${state.gridRowStart} / span 1`,
                                        }}
                                      />
                                    )}
                                    {/* Label */}
                                    {showLabel && (
                                      <div
                                        className="text-foreground flex h-full items-start justify-center px-0.5 pt-2 text-[0.8rem] font-semibold"
                                        style={{
                                          gridColumn: "-2 / -1",
                                          gridRow: `${state.gridRowStart} / span ${state.fullWeeksVisibleAfter}`,
                                        }}
                                      >
                                        <span
                                          className="whitespace-nowrap"
                                          style={{
                                            writingMode: "vertical-rl",
                                            textOrientation: "mixed",
                                          }}
                                        >
                                          <MonthSeparator.Month
                                            locale={locale}
                                            format="short"
                                          />
                                        </span>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            }}
                          />
                        )}
                        <StyledWeekTemplate>
                          {showWeekNumbers && (
                            <WeekNumberCell
                              className="text-muted-foreground w-8 p-1 text-center text-[0.7rem] tabular-nums"
                              render={({ children, ...props }) => (
                                <td {...props}>
                                  <span className="inline-block w-[2ch] text-right">
                                    {children}
                                  </span>
                                </td>
                              )}
                            />
                          )}
                          <StyledRangeSelected
                            columnOffset={showWeekNumbers ? 1 : 0}
                          />
                          <StyledRangePreview
                            columnOffset={showWeekNumbers ? 1 : 0}
                          />
                          <StyledDayCellTemplate
                            columnOffset={showWeekNumbers ? 1 : 0}
                            preventRangeReversal={preventRangeReversal}
                          />
                        </StyledWeekTemplate>
                      </StyledGridBody>
                    </StyledGrid>
                  </div>
                </WeeksView.Root>
              </div>
            </CalendarProvider>
          </div>

          {/* Raw value display */}
          <div className="w-full pt-4">
            <textarea
              readOnly
              className="text-muted-foreground border-input bg-background w-full rounded-md border px-3 py-2 font-mono text-xs"
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
        </div>
      </div>
    </div>
  );
}
