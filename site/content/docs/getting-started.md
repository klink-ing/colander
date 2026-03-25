---
title: Getting Started
description: Install and set up base-ui-cal
order: 1
section: Guides
---

# Getting Started

## Installation

```bash
npm install base-ui-cal @js-temporal/polyfill
```

## Basic Usage

base-ui-cal provides two calendar views that share state via `CalendarProvider`:

- **MonthView** — Traditional month grid
- **WeeksView** — Continuous scrolling weeks

## Quick Example

```tsx
import { MonthView } from "base-ui-cal";
import { Temporal } from "@js-temporal/polyfill";

function MyCalendar() {
  return (
    <MonthView temporal={Temporal}>
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
  );
}
```
