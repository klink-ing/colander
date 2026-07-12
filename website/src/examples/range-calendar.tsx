import { Temporal } from "@js-temporal/polyfill";
import {
  MonthView,
  PrevMonthButton,
  MonthYearString,
  NextMonthButton,
  Grid,
  GridHeader,
  GridHeaderCell,
  GridBody,
  WeekTemplate,
  DayCellTemplate,
  DayButton,
  type DateRange,
} from "@klinking/colander";
import { useState } from "react";

export function RangeCalendar() {
  const [range, setRange] = useState<DateRange<"PlainDate"> | null>(null);

  return (
    <MonthView
      temporal={Temporal}
      selectionMode="range"
      value={range}
      onValueChange={setRange}
    >
      <div className="calendar">
        <div className="calendar-header">
          <PrevMonthButton className="calendar-nav">‹</PrevMonthButton>
          <MonthYearString className="calendar-title" />
          <NextMonthButton className="calendar-nav">›</NextMonthButton>
        </div>
        <Grid className="calendar-grid">
          <GridHeader>
            <GridHeaderCell className="calendar-weekday" />
          </GridHeader>
          <GridBody>
            <WeekTemplate>
              <DayCellTemplate>
                {/* Style boundaries and the interior with data attributes:
                    [data-range-start], [data-range-end], [data-in-range],
                    and the hover preview via [data-range-preview-in-range]. */}
                <DayButton className="calendar-day" />
              </DayCellTemplate>
            </WeekTemplate>
          </GridBody>
        </Grid>
      </div>
    </MonthView>
  );
}
