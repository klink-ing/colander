---
title: Accessibility
description: Keyboard interactions, ARIA semantics, and localization built into $projectName.
order: 3
section: Overview
---

{% $projectName %} implements the
[ARIA grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) for calendars, so the
markup you compose is accessible before you write a line of ARIA yourself. This page
describes what the library does for you — and the few things left in your hands.

## Keyboard interactions

Focus the grid, then:

| Key                                   | Action                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------ |
| `ArrowRight` / `ArrowLeft`            | Move focus one day forward / back                                        |
| `ArrowDown` / `ArrowUp`               | Move focus one week forward / back                                       |
| `Home` / `End`                        | Move focus to the first / last day of the week (respects `weekStartDay`) |
| `PageDown` / `PageUp`                 | Move focus one month forward / back                                      |
| `Shift + PageDown` / `Shift + PageUp` | Move focus one year forward / back                                       |
| `Enter` / `Space`                     | Select the focused day                                                   |

Movement is clamped to your `min`/`max` bounds — focus stops at the boundary instead of
escaping the selectable window. When focus crosses a month boundary, the view follows
automatically (MonthView pages; WeeksView scrolls its window).

In a `readOnly` calendar, navigation still works but `Enter`/`Space` do nothing. In a
`disabled` calendar, keyboard interaction is off entirely.

## Focus management

The grid uses a **roving tab index**: exactly one day cell is in the tab order at a time,
so the calendar occupies a single tab stop in the page. The tab target is the selected
day when there is one, otherwise today, otherwise the nearest sensible day in view.

Pass `autoFocus` to `Grid` to move DOM focus into the grid when it mounts — useful when
the calendar opens inside a popover:

```tsx
<Grid autoFocus>{/* … */}</Grid>
```

## Semantics and labelling

- `Grid` renders a `<table role="grid">`; `DayCellTemplate` renders
  `<td role="gridcell">` cells with `aria-selected` and `aria-disabled` reflecting state.
- Each `DayButton` gets a full-date `aria-label` (e.g. "Saturday, June 20, 2026"),
  localized with your `locale`.
- `GridHeaderCell` renders abbreviated weekday text with the full weekday name as its
  `aria-label`.
- When you render a `MonthYearString`, the grid is automatically linked to it with
  `aria-labelledby`, giving screen-reader users the "June 2026" context. Without one, the
  grid falls back to `aria-label="Calendar"`.
- `MonthYearString`, `DateString`, and `TimeString` render with `aria-live="polite"`, so
  month navigation and selection changes are announced without stealing focus.
- `PrevMonthButton` / `NextMonthButton` (and the WeeksView equivalents) carry descriptive
  `aria-label`s and use the native `disabled` attribute at bounds, so assistive tech sees
  real button semantics.

## Outside and hidden days

`outsideDays="hidden"` keeps the grid shape intact for assistive tech: hidden cells stay in
the DOM as empty `<td>` elements with `aria-hidden` (and a `data-hidden` styling hook)
rather than being removed, so row and column counts remain consistent.

## Range drag handles

`RangeStartDragHandle` / `RangeEndDragHandle` are pointer affordances layered on top of the
keyboard-accessible selection model. They expose `aria-roledescription="drag handle"`, a
label for the boundary they control, and `aria-valuetext` with the current date — and they
are `aria-hidden` while inactive. Because every range operation can also be performed by
clicking or with the keyboard, dragging is an enhancement, not a requirement.

## Localization

- **`locale`** (BCP 47 string, default `"en-US"`) drives every formatted string: weekday
  headers, month/year labels, and day `aria-label`s, all via `Intl.DateTimeFormat`.
- **`weekStartDay`** (0 = Sunday … 6 = Saturday) reorders the grid _and_ the `Home`/`End`
  keyboard behavior together, so visual and keyboard order never disagree.
- **`timeZone`** (IANA identifier) controls which day is "today" and how values convert.
  See [Dates &amp; formats](/docs/dates-and-formats).

```tsx
<MonthView temporal={Temporal} locale="de-DE" weekStartDay={1}>
  {/* Mo Di Mi Do Fr Sa So */}
</MonthView>
```

## Your responsibilities

Headless means a few things remain yours:

- **Visible focus.** Style `:focus-visible` on `DayButton` (and the nav buttons) with a
  clearly visible ring; the library manages _where_ focus goes, you make it _seen_.
- **Color contrast.** Selected, in-range, disabled, and outside-month states are your
  colors — keep them WCAG-compliant, and don't rely on color alone to convey selection.
- **Hit targets.** Keep day buttons comfortably tappable (44×44 px is a good floor) if you
  target touch devices.
