---
title: Quick start
description: Install $projectName and build a working, styled calendar in a few minutes.
order: 2
section: Overview
---

This walkthrough takes you from an empty file to a working, styled month calendar.

## Install the package

Install {% $packageName %} and a Temporal polyfill in your React project:

{% install-cmd /%}

{% $projectName %} has three peer dependencies — `react`, `react-dom` (18+), and
`@base-ui/react` — which your package manager installs automatically. The Temporal polyfill
is explicit on purpose: the library doesn't bundle one, so you control which implementation
you ship (see [Dates &amp; formats](/docs/dates-and-formats) for the options).

{% callout type="info" %}
Releases are currently published to the **`alpha`** dist-tag while the API stabilizes —
`@klinking/colander@alpha` installs the latest prerelease.
{% /callout %}

## Provide Temporal

Every calendar needs a `Temporal` implementation. Import it once and pass it via the
`temporal` prop:

```tsx
import { Temporal } from "@js-temporal/polyfill";

<MonthView temporal={Temporal}>{/* … */}</MonthView>;
```

If the runtime already exposes the native `Temporal` global, the prop can be omitted.

## Assemble the calendar

{% $projectName %} components are compound parts you compose in JSX, so your markup mirrors
the calendar's actual structure. Here is a complete single-month calendar with navigation:

{% example file="basic-calendar.tsx" /%}

A quick tour of the parts:

- **`MonthView`** — the all-in-one root. It owns selection state and month navigation, and
  reports selection through `onValueChange`. (Under the hood it composes a
  [CalendarProvider](/docs/calendar-provider) with a `MonthView.Root` — you can also use
  those two directly when you need more control.)
- **`PrevMonthButton` / `NextMonthButton`** — `<button>`s that page the visible month and
  disable themselves at your `min`/`max` bounds.
- **`MonthYearString`** — a localized "June 2026" label, wired to the grid via
  `aria-labelledby` and announced politely when the month changes.
- **`Grid`, `GridHeader`, `GridHeaderCell`, `GridBody`** — the calendar table. A single
  `GridHeaderCell` with no `index` renders all seven localized weekday headers.
- **`WeekTemplate` / `DayCellTemplate` / `DayButton`** — _templates_: you write one row,
  one cell, and one button, and the library stamps them out for every week and day in view.

## Read the selection

`onValueChange` receives the new value in your configured format — a
`Temporal.PlainDate | null` by default:

```tsx
function BookingForm() {
  const [date, setDate] = useState<Temporal.PlainDate | null>(null);

  return (
    <>
      <BasicCalendar onSelect={setDate} />
      <p>{date ? date.toLocaleString() : "Pick a date"}</p>
    </>
  );
}
```

The example above is _uncontrolled_ (the calendar keeps its own state). To control it, pass
`value` and update it from `onValueChange` — see
[Selection modes](/docs/selection-modes) for the full rules, plus range and multi-select.

## Style it

Nothing you've rendered so far has any appearance — that's yours. Components accept
`className` like any element, and they expose their interaction state as `data-*`
attributes, so most styling is plain CSS:

```css
.calendar {
  inline-size: 20rem;
  font: inherit;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: 0.5rem;
}

.calendar-nav {
  inline-size: 2rem;
  block-size: 2rem;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  cursor: pointer;
}

.calendar-nav:hover {
  background: #f1f0ef;
}

.calendar-nav:disabled {
  opacity: 0.4;
  cursor: default;
}

.calendar-grid {
  inline-size: 100%;
  border-collapse: collapse;
}

.calendar-weekday {
  padding-block: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #6f6d66;
}

.calendar-day {
  inline-size: 2.25rem;
  block-size: 2.25rem;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  cursor: pointer;
}

.calendar-day:hover {
  background: #f1f0ef;
}

.calendar-day[data-today] {
  font-weight: 700;
}

.calendar-day[data-outside-month] {
  color: #b5b3ad;
}

.calendar-day[data-selected] {
  background: #1a1a17;
  color: #fff;
}

.calendar-day[data-disabled] {
  opacity: 0.4;
  cursor: default;
}
```

The [Styling guide](/docs/styling) covers the complete data-attribute reference, Tailwind
usage, and the `render` prop for cases where CSS alone isn't enough.

## Next steps

- [Composition](/docs/composition) — the component tree, templates, and the `render` prop.
- [Selection modes](/docs/selection-modes) — single, multiple, and range selection.
- [Dates &amp; formats](/docs/dates-and-formats) — value formats, time zones, and locales.
- [MonthView](/docs/month-view) and [WeeksView](/docs/weeks-view) — everything each view
  can do.
