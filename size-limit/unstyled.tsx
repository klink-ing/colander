import { Temporal } from "@js-temporal/polyfill";
// Minimal unstyled date picker component for realistic tree-shaking measurement.
// Represents what a consumer would actually import and render.
import React from "react";
import {
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
