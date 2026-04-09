import type { Temporal } from "@js-temporal/polyfill";
import {
  WeeksView,
  PrevWeeksButton,
  NextWeeksButton,
  MonthSeparatorRow,
  MonthSeparatorMonth,
  WeekNumberCell,
  WeekNumberHeader,
  useWeeksViewState,
  useCalendarStable,
  type OverflowBehavior,
} from "colander";
import { cn } from "#/lib/utils";
import {
  StyledGrid,
  StyledGridHeader,
  StyledGridHeaderCell,
  StyledGridBody,
  StyledWeekTemplate,
  StyledDayCellTemplate,
  StyledRangeSelected,
  StyledRangePreview,
} from "./date-picker-styled";

function WeeksViewHeader() {
  const { windowInfo } = useWeeksViewState();
  const { locale } = useCalendarStable();
  const { visibleMonths } = windowInfo;

  const maxShow = 3;
  const monthNames = visibleMonths.slice(0, maxShow).map((vm: any) => {
    const date = new Date(vm.year, vm.month - 1, 1);
    return new Intl.DateTimeFormat(locale, { month: "short" }).format(date);
  });
  const hasMore = visibleMonths.length > maxShow;
  const label = monthNames.join("/") + (hasMore ? "/..." : "");

  const years = Array.from(new Set(visibleMonths.map((vm: any) => vm.year)));
  const yearLabel = years.join("/");

  return (
    <span className="text-sm font-medium">
      {label} {yearLabel}
    </span>
  );
}

const navButtonClassName = cn(
  "inline-flex h-7 w-7 items-center justify-center rounded-md",
  "text-muted-foreground transition-colors",
  "hover:bg-accent hover:text-accent-foreground",
  "focus-visible:ring-w-focus focus-visible:ring-focus focus-visible:outline-none",
  "disabled:pointer-events-none disabled:opacity-50",
);

export interface StyledWeeksViewProps {
  weekCount: number;
  scrollBy: "row" | "page";
  overflowBehavior: OverflowBehavior;
  onFirstWeekChange: (date: Temporal.PlainDate) => void;
  onWindowChange: (info: any) => void;
  showWeekNumbers: boolean;
  showMonthSeparators: boolean;
  preventRangeReversal: boolean;
  locale: string;
}

export function StyledWeeksView({
  weekCount,
  scrollBy,
  overflowBehavior,
  onFirstWeekChange,
  onWindowChange,
  showWeekNumbers,
  showMonthSeparators,
  preventRangeReversal,
  locale,
}: StyledWeeksViewProps) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-foreground">Weeks View</h3>
      <WeeksView.Root
        weekCount={weekCount}
        scrollBy={scrollBy}
        overflowBehavior={overflowBehavior}
        onFirstWeekChange={onFirstWeekChange}
        onWindowChange={onWindowChange}
      >
        <div className="p-3">
          <div className="flex items-center justify-between gap-1 px-1 pb-3">
            <PrevWeeksButton className={navButtonClassName}>↑</PrevWeeksButton>
            <WeeksViewHeader />
            <NextWeeksButton className={navButtonClassName}>↓</NextWeeksButton>
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
                  className="w-8 p-1 text-center text-[0.7rem] font-normal text-muted-foreground"
                  render={({ children, ...props }: any) => (
                    <th {...props}>
                      <span className="inline-block min-w-[2ch] text-right">{children}</span>
                    </th>
                  )}
                />
              )}
              <StyledGridHeaderCell />
              {showMonthSeparators && <th />}
            </StyledGridHeader>
            <StyledGridBody>
              {showMonthSeparators && (
                <MonthSeparatorRow
                  render={(renderProps, state) => {
                    const borderFromCol = state.firstDayColumn + 1 + (showWeekNumbers ? 1 : 0);
                    const showLabel = state.fullWeeksVisibleAfter >= 2;
                    return (
                      <tr {...renderProps} className={cn(renderProps.className, "contents")}>
                        <td className="contents">
                          {state.firstDayVisible && (
                            <div
                              aria-hidden
                              className="pointer-events-none relative z-10 -mt-px mb-(--radius-md) -ml-px rounded-tl-[calc(var(--radius-md)+1px)] border-t border-l border-muted-foreground dark:border-white"
                              style={{
                                gridColumn: `${borderFromCol} / -1`,
                                gridRow: `${state.gridRowStart} / span 1`,
                              }}
                            />
                          )}
                          {showLabel && (
                            <div
                              className="px-0.5 flex h-full items-start justify-center pt-2 text-[0.8rem] font-semibold text-foreground"
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
                                <MonthSeparatorMonth locale={locale} format="short" />
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
                    className="w-8 p-1 text-center text-[0.7rem] text-muted-foreground tabular-nums"
                    render={({ children, ...props }: any) => (
                      <td {...props}>
                        <span className="inline-block min-w-[2ch] text-right">{children}</span>
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
      </WeeksView.Root>
    </div>
  );
}
