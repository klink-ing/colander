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

export function BasicCalendar({
  onSelect,
}: {
  onSelect?: (value: Temporal.PlainDate | null) => void;
}) {
  return (
    <MonthView temporal={Temporal} onValueChange={onSelect}>
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
                <DayButton className="calendar-day" />
              </DayCellTemplate>
            </WeekTemplate>
          </GridBody>
        </Grid>
      </div>
    </MonthView>
  );
}
