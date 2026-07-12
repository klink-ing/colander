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
} from "@klinking/colander";

function MonthGrid({ monthIndex }: { monthIndex: number }) {
  return (
    <div>
      <MonthYearString className="calendar-title" monthIndex={monthIndex} />
      <Grid className="calendar-grid" monthIndex={monthIndex}>
        <GridHeader>
          <GridHeaderCell className="calendar-weekday" />
        </GridHeader>
        <GridBody>
          <WeekTemplate>
            <DayCellTemplate>
              <DayButton className="calendar-day" />
            </DayCellTemplate>
          </WeekTemplate>
        </GridBody>
      </Grid>
    </div>
  );
}

export function TwoMonthCalendar() {
  return (
    <MonthView temporal={Temporal} selectionMode="range" numberOfMonths={2}>
      <div className="calendar">
        <div className="calendar-header">
          <PrevMonthButton className="calendar-nav">‹</PrevMonthButton>
          <NextMonthButton className="calendar-nav">›</NextMonthButton>
        </div>
        <div className="calendar-months">
          <MonthGrid monthIndex={0} />
          <MonthGrid monthIndex={1} />
        </div>
      </div>
    </MonthView>
  );
}
