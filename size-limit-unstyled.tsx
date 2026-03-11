// Minimal unstyled date picker component for realistic tree-shaking measurement.
// Represents what a consumer would actually import and render.
import { Temporal } from "@js-temporal/polyfill";
import {
  Root,
  Grid,
  GridBody,
  GridHeader,
  GridHeaderCell,
  WeekTemplate,
  DayCellTemplate,
  DayButton,
  MonthYearString,
  DateString,
  PrevMonthButton,
  NextMonthButton,
  SelectedRange,
  RangeStartDragHandle,
  RangeEndDragHandle,
} from "./dist/index.js";

export function DatePicker() {
  return (
    <Root temporal={Temporal} format="object">
      <div>
        <PrevMonthButton>←</PrevMonthButton>
        <MonthYearString />
        <NextMonthButton>→</NextMonthButton>
      </div>
      <DateString />
      <Grid mode="grid">
        <GridHeader>
          <GridHeaderCell />
        </GridHeader>
        <GridBody>
          <WeekTemplate>
            <SelectedRange />
            <DayCellTemplate>
              <DayButton />
              <RangeStartDragHandle edge="start" />
              <RangeEndDragHandle edge="end" />
            </DayCellTemplate>
          </WeekTemplate>
        </GridBody>
      </Grid>
    </Root>
  );
}
