import type { Temporal } from "@js-temporal/polyfill";
import {
  CalendarProvider,
  MonthView,
  Grid,
  GridHeader,
  GridHeaderCell,
  GridBody,
  WeekTemplate,
  DayCellTemplate,
  DayButton,
} from "colander";

export function BasicCalendar({
  onSelect,
}: {
  onSelect?: (value: Temporal.PlainDate | null) => void;
}) {
  return (
    <CalendarProvider format="PlainDate" onValueChange={onSelect}>
      <MonthView>
        <Grid>
          <GridHeader>
            <GridHeaderCell />
          </GridHeader>
          <GridBody>
            <WeekTemplate>
              <DayCellTemplate>
                <DayButton />
              </DayCellTemplate>
            </WeekTemplate>
          </GridBody>
        </Grid>
      </MonthView>
    </CalendarProvider>
  );
}
