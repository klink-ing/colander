---
title: Introduction
description: What Colander is, the ideas behind it, and how it compares to other React date pickers.
order: 1
section: Overview
---

{% $projectName %} is a library of unstyled React components for building calendars and
date pickers. Instead of shipping a finished date picker with a theme to override, it gives
you the primitives — grids, day cells, navigation buttons, range overlays — that you compose
and style yourself. You own every pixel; {% $projectName %} owns the date math, keyboard
navigation, selection logic, and accessibility semantics.

```tsx
<MonthView temporal={Temporal} onValueChange={setDate}>
  <PrevMonthButton>‹</PrevMonthButton>
  <MonthYearString />
  <NextMonthButton>›</NextMonthButton>
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
```

## Core ideas

### Headless by design

Every component renders a plain semantic element (`<table>`, `<td>`, `<button>`, …) with no
CSS attached. You style with any tool you already use — plain CSS, Tailwind, CSS-in-JS —
through three hooks the library exposes:

- **`className`** — every component accepts one, like any React element.
- **`data-*` attributes** — interaction state is stamped onto the DOM
  (`data-selected`, `data-today`, `data-in-range`, `data-disabled`, …), so most styling is
  just CSS attribute selectors.
- **The `render` prop** — swap out the rendered element entirely and receive a fully typed
  `state` object, following the same pattern as [Base UI](https://base-ui.com).

See the [Styling guide](/docs/styling) for the full picture.

### Temporal-first

{% $projectName %} is built on the [Temporal API](https://tc39.es/proposal-temporal/docs/) —
the modern replacement for JavaScript's `Date`. Selected values are precise, immutable
Temporal objects (`Temporal.PlainDate` by default) instead of `Date` instances that secretly
carry a time and a time zone. That eliminates the classic date picker bug class: off-by-one
days caused by implicit UTC/local conversions.

You choose the value type per calendar with the `format` prop — `PlainDate`,
`PlainDateTime`, `ZonedDateTime`, a plain object, or even a legacy `Date` if you're
integrating with existing code. The library doesn't bundle a Temporal implementation; you
pass one in (a ~20 kB polyfill today, the built-in `Temporal` as runtimes ship it). See
[Dates &amp; formats](/docs/dates-and-formats).

### Two views, one state model

- **[MonthView](/docs/month-view)** — the traditional paged month grid, including
  multi-month layouts (up to 12 side by side).
- **[WeeksView](/docs/weeks-view)** — a continuously scrolling window of week rows that
  spans month boundaries, like the mini-calendars in Google Calendar or Fantastical. You
  control how many weeks are visible and scroll by row or by page.

Both views plug into the same [CalendarProvider](/docs/calendar-provider) state: selection
mode, bounds, locale, and time zone are shared, so you can even render both views of the
same selection at once.

### Selection built for real products

Single, multiple, and range selection are all first-class, each with controlled and
uncontrolled modes. Range selection goes well beyond click-twice: a live hover preview,
six configurable policies for what a click inside an existing range means (`rangeMode`),
and draggable range-boundary handles. See [Selection modes](/docs/selection-modes).

### Accessible by default

The grid follows the ARIA grid pattern: roving tab index, arrow-key navigation, `Home` /
`End` / `PageUp` / `PageDown`, `aria-selected` and `aria-disabled` on day cells, and month
labels announced via a live region. Details in [Accessibility](/docs/accessibility).

## Why not another date picker?

Plenty of good date pickers exist. {% $projectName %} makes a different set of trade-offs:

| If you're considering… | How {% $projectName %} differs                                                                                                                                                                                                                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **react-day-picker**   | Similar spirit (composable, customizable), but react-day-picker works in `Date` objects and ships default styles to override. {% $projectName %} is Temporal-typed end-to-end, fully unstyled, and adds the continuously scrolling WeeksView, range drag handles, and hover previews as primitives. |
| **react-datepicker**   | A batteries-included widget: fast to drop in, hard to restyle deeply. {% $projectName %} is the opposite — more assembly, unlimited control over markup and design.                                                                                                                                 |
| **MUI X Date Pickers** | Excellent inside a Material UI app; heavy outside one. {% $projectName %} has no design-system dependency and pairs with any styling stack.                                                                                                                                                         |
| **React Aria (hooks)** | Comparable headless philosophy and strong a11y. React Aria uses its own `@internationalized/date` objects and a hooks-first API; {% $projectName %} uses standard Temporal types and a component/compound API, so markup composition stays in JSX.                                                  |

Choose {% $projectName %} when you're building a **design-system-grade calendar** — a
component you'll style precisely, extend with custom cells or overlays, and keep for years —
and you want date values that are actually dates.

## When _not_ to use it

Honesty saves you an afternoon:

- **You want a finished picker in ten minutes.** {% $projectName %} has no default
  stylesheet. If you don't want to write styles, use a styled library.
- **You can't add a Temporal polyfill.** Until `Temporal` lands natively in the runtimes you
  target, you'll ship a small polyfill (see the [Quick start](/docs/quick-start)).

{% callout type="warning" %}
{% $projectName %} is **pre-stable**. The API is still evolving and releases are published
to the `alpha` npm dist-tag. Pin your version and read release notes when upgrading. The
first stable release will be `3.0.0`.
{% /callout %}

## Next steps

- [Quick start](/docs/quick-start) — install and build your first calendar.
- [Composition](/docs/composition) — how the pieces fit together.
- [Styling](/docs/styling) — the data-attribute and render-prop styling model.
