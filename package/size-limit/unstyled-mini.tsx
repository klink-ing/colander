// Minimal unstyled date picker using the built-in mini Temporal polyfill.
// Measures the bundle cost without the full @js-temporal/polyfill.
import React from "react";
import {
  Temporal,
  MonthView,
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
  RangeSelected,
  RangeStartDragHandle,
  RangeEndDragHandle,
} from "../dist/index.js";

export function DatePicker() {
  return (
    <MonthView temporal={Temporal} format="object">
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
            <RangeSelected />
            <DayCellTemplate>
              <DayButton />
              <RangeStartDragHandle />
              <RangeEndDragHandle />
            </DayCellTemplate>
          </WeekTemplate>
        </GridBody>
      </Grid>
    </MonthView>
  );
}
