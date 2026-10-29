---
title: Dates & formats
description: Temporal, the temporal prop, value formats, subpath entry points, time zones, and locales.
order: 13
section: Guides
---

{% $projectName %} does its date math with the
[Temporal API](https://tc39.es/proposal-temporal/docs/) — JavaScript's modern, immutable,
time-zone-explicit date library. This page covers how to supply a Temporal implementation,
how to choose what type your selected _values_ are, and how time zones and locales flow
through the calendar.

## Providing Temporal

The library deliberately doesn't bundle a Temporal implementation. Pass one through the
`temporal` prop on `CalendarProvider` (or the `MonthView`/`WeeksView` wrappers):

```tsx
import { Temporal } from "@js-temporal/polyfill";

<MonthView temporal={Temporal}>{/* … */}</MonthView>;
```

Two well-supported polyfills:

- [`temporal-polyfill`](https://github.com/fullcalendar/temporal-polyfill) — smaller
  (~20 kB min+gzip), production-oriented.
- [`@js-temporal/polyfill`](https://github.com/js-temporal/temporal-polyfill) — the
  champions' reference-quality polyfill.

If `temporal` is omitted, the library falls back to the native `globalThis.Temporal` and
throws a descriptive error when neither exists. As runtimes ship Temporal natively, you
delete the polyfill and the prop — nothing else changes.

{% callout type="info" %}
Whichever polyfill you choose, import it in **one place** and pass the same namespace to
every calendar. Temporal objects from different implementations shouldn't be mixed.
{% /callout %}

## The `format` prop

Internally the calendar always works in Temporal types. The `format` prop chooses the type
of the values that cross the boundary to _your_ code — `value`, `defaultValue`, `min`,
`max`, and the payloads of `onValueChange`:

| `format`                  | Value type                | Use when                                                                          |
| ------------------------- | ------------------------- | --------------------------------------------------------------------------------- |
| `"PlainDate"` _(default)_ | `Temporal.PlainDate`      | You need a calendar date, nothing more. The right default.                        |
| `"PlainDateTime"`         | `Temporal.PlainDateTime`  | A date with a wall-clock time (existing time is preserved when the date changes). |
| `"ZonedDateTime"`         | `Temporal.ZonedDateTime`  | A precise instant in a time zone.                                                 |
| `"PlainYearMonth"`        | `Temporal.PlainYearMonth` | Month-granularity values.                                                         |
| `"PlainMonthDay"`         | `Temporal.PlainMonthDay`  | Recurring dates like birthdays.                                                   |
| `"object"`                | `{ year, month, day, … }` | Framework-agnostic plain objects (serialization, form state).                     |
| `"Date"`                  | `Date`                    | Interop with legacy code that speaks `Date`.                                      |

```tsx
<MonthView
  temporal={Temporal}
  format="ZonedDateTime"
  timeZone="America/New_York"
  onValueChange={(value) => {
    // value: Temporal.ZonedDateTime | null
  }}
>
  {/* … */}
</MonthView>
```

The `format` only shapes the _props and callbacks_. Render-prop `state` objects and hook
values always expose plain Temporal types (`Temporal.PlainDate` days, etc.) regardless of
format, so component code stays uniform.

## Format-narrowed entry points

The main entry point types values with a generic parameter. If you'd rather have the types
pre-narrowed — and skip passing `format` — import from a format subpath:

```tsx
import {
  MonthView,
  type DateRange, // already DateRange<"PlainDate">
} from "@klinking/colander/plain-date";
```

Available subpaths: `/plain-date`, `/plain-date-time`, `/plain-month-day`,
`/plain-year-month`, `/zoned-date-time`, `/object`, and `/date`. Each re-exports the whole
API with `CalendarProvider`, `MonthView`, `WeeksView`, and the value types bound to that
format.

## Bounds and disabled dates

`min` and `max` (in your value format) disable everything outside them, and keyboard focus
is clamped to the bounds. `isDateDisabled` handles irregular rules and always receives a
`Temporal.PlainDate`:

```tsx
<MonthView
  temporal={Temporal}
  min={Temporal.PlainDate.from("2026-01-01")}
  max={Temporal.PlainDate.from("2026-12-31")}
  isDateDisabled={(date) => holidays.has(date.toString())}
>
  {/* … */}
</MonthView>
```

Bounds restrict _selection_. Whether users can still scroll the view past them is the
per-view `outOfRangeBehavior` prop — see [MonthView](/docs/month-view) and
[WeeksView](/docs/weeks-view).

## Time zones

`timeZone` (an IANA identifier, defaulting to the system zone) determines:

- which day is highlighted as **today**,
- how partial or zoned values convert to grid days,
- the zone of emitted `ZonedDateTime` values.

Plain formats like `PlainDate` are zone-independent by nature — selecting June 20 means
June 20, no matter where the user is. That's most of the reason to prefer them.

## Locale and week start

`locale` (BCP 47, default `"en-US"`) localizes weekday headers, month/year labels, and day
`aria-label`s via `Intl.DateTimeFormat`. It does **not** change the week's first day —
that's explicit, so it never surprises you:

```tsx
<MonthView temporal={Temporal} locale="fr-FR" weekStartDay={1}>
  {/* lun. mar. mer. jeu. ven. sam. dim. */}
</MonthView>
```

`weekStartDay` takes `0` (Sunday, default) through `6` (Saturday) and consistently drives
the grid column order, week-number calculations, and `Home`/`End` keyboard navigation.

## Displaying values

For formatted output inside the calendar, use the built-in string components — they read
the calendar's `locale` and accept `Intl.DateTimeFormat` options:

```tsx
<MonthYearString options={{ month: "long", year: "numeric" }} />
<DateString options={{ dateStyle: "full" }} />
<TimeString options={{ timeStyle: "short" }} />
```

Outside the calendar, Temporal values format themselves:
`date.toLocaleString("de-DE", { dateStyle: "long" })`.
