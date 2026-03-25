import { MonthView, WeekNumberCell, WeekNumberHeader } from "colander";
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
} from "./date-picker-styled";
import { cn } from "#/lib/cn";
import type { Temporal } from "@js-temporal/polyfill";
import type { OutsideDays } from "colander";

interface MonthGridProps {
  monthIndex: number;
  numberOfMonths: number;
  orientation: "horizontal" | "vertical";
  autoFocus: boolean;
  showWeekNumbers: boolean;
  preventRangeReversal: boolean;
}

function MonthGrid({
  monthIndex,
  numberOfMonths,
  orientation,
  autoFocus,
  showWeekNumbers,
  preventRangeReversal,
}: MonthGridProps) {
  const isVertical = orientation === "vertical";
  return (
    <div>
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
              render={({ children, ...props }: any) => (
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
                render={({ children, ...props }: any) => (
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
}

export interface StyledMonthViewProps {
  numberOfMonths: number;
  fixedWeeks: boolean;
  outsideDays: OutsideDays;
  overflowBehavior: "unbounded" | "stop";
  onMonthChange: (month: Temporal.PlainYearMonth) => void;
  autoFocus: boolean;
  showWeekNumbers: boolean;
  orientation: "horizontal" | "vertical";
  preventRangeReversal: boolean;
}

export function StyledMonthView({
  numberOfMonths,
  fixedWeeks,
  outsideDays,
  overflowBehavior,
  onMonthChange,
  autoFocus,
  showWeekNumbers,
  orientation,
  preventRangeReversal,
}: StyledMonthViewProps) {
  return (
    <div>
      <h3 className="text-foreground mb-3 text-sm font-semibold">Month View</h3>
      <MonthView.Root
        numberOfMonths={numberOfMonths}
        fixedWeeks={fixedWeeks}
        outsideDays={outsideDays}
        onMonthChange={onMonthChange}
        overflowBehavior={overflowBehavior}
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
          <div className={numberOfMonths > 1 ? "flex gap-4" : undefined}>
            {Array.from({ length: numberOfMonths }, (_, i) => (
              <MonthGrid
                key={i}
                monthIndex={i}
                numberOfMonths={numberOfMonths}
                orientation={orientation}
                autoFocus={autoFocus}
                showWeekNumbers={showWeekNumbers}
                preventRangeReversal={preventRangeReversal}
              />
            ))}
          </div>
        </div>
      </MonthView.Root>
    </div>
  );
}
