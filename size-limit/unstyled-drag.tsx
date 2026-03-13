// Minimal unstyled date picker with drag-and-drop range handles.
// Measures the bundle cost of native drag-and-drop hooks without styling overhead.
import React from "react";
import { Temporal } from "@js-temporal/polyfill";
import {
  Root,
  Grid,
  GridBody,
  GridHeader,
  GridHeaderCell,
  WeekTemplate,
  DayCellTemplate,
  MonthYearString,
  DateString,
  PrevMonthButton,
  NextMonthButton,
  RangeSelected,
} from "../dist/index.js";
import { DragHandleStart, DragHandleEnd, DragDayButton } from "../dev/lib/drag-components";

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
            <RangeSelected />
            <DayCellTemplate>
              <DragDayButton />
              <DragHandleStart />
              <DragHandleEnd />
            </DayCellTemplate>
          </WeekTemplate>
        </GridBody>
      </Grid>
    </Root>
  );
}
