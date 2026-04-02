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
import type { ValueFormat, DateRange } from "colander";

interface CalendarProps {
  format?: ValueFormat;
  onSelect?: (value: DateRange | null) => void;
}

export function BasicCalendar({
  format = "PlainDate",
  onSelect,
}: CalendarProps) {
  return (
    <CalendarProvider format={format} onValueChange={onSelect}>
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
