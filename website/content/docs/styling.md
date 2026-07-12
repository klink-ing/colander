---
title: Styling
description: Style $projectName with plain CSS, Tailwind, or any tool — via data attributes and the render prop.
order: 11
section: Guides
---

{% $projectName %} ships zero CSS. Every component renders a semantic element you style
yourself, and exposes its interaction state on the DOM so your styles can react to it.
There are three layers, from simplest to most powerful:

1. **`className`** — every part accepts one.
2. **`data-*` attributes** — state stamped onto the element; target it with CSS attribute
   selectors.
3. **The `render` prop** — replace the element and read the typed `state` object directly
   (see [Composition](/docs/composition)).

## Styling with data attributes

State becomes presence-style attributes: `data-selected` is present when a day is selected
and absent otherwise. In CSS:

```css
.day[data-selected] {
  background: black;
  color: white;
}

.day[data-today] {
  font-weight: 700;
}

.day[data-outside-month] {
  opacity: 0.45;
}

.day[data-disabled] {
  opacity: 0.35;
  pointer-events: none;
}
```

With Tailwind, use the `data-*` variants directly on `className`:

```tsx
<DayButton
  className="size-9 rounded-md hover:bg-neutral-100
    data-today:font-bold
    data-outside-month:text-neutral-400
    data-selected:bg-neutral-900 data-selected:text-white
    data-in-range:bg-neutral-200
    data-disabled:pointer-events-none data-disabled:opacity-40
    focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
/>
```

## Data attribute reference

### `DayCellTemplate` and `DayButton`

| Attribute                | Present when                                              |
| ------------------------ | --------------------------------------------------------- |
| `data-date="2026-06-20"` | Always — the cell's ISO date (a value, not a flag)        |
| `data-selected`          | The day is selected                                       |
| `data-today`             | The day is today (in the calendar's `timeZone`)           |
| `data-disabled`          | Disabled via `min`/`max`, `isDateDisabled`, or `disabled` |
| `data-focused`           | The day is the grid's logically focused cell              |
| `data-outside-month`     | The day belongs to an adjacent month                      |
| `data-hidden`            | The cell is blanked by `outsideDays="hidden"`             |
| `data-orientation`       | `"horizontal"` or `"vertical"` (a value)                  |

Range selection adds:

| Attribute                                     | Present when                                 |
| --------------------------------------------- | -------------------------------------------- |
| `data-in-range`                               | The day is inside the committed range        |
| `data-range-start` / `data-range-end`         | The day is the range's first / last day      |
| `data-range-boundary`                         | Either of the above                          |
| `data-range-index` / `data-range-length`      | Position within / size of the range (values) |
| `data-range-has-start` / `data-range-has-end` | The range's boundary is defined              |

The hover **preview** range (see [Selection modes](/docs/selection-modes)) mirrors the same
set with a `data-range-preview-*` prefix: `data-range-preview-in-range`,
`data-range-preview-start`, `data-range-preview-end`, `data-range-preview-boundary`, and so
on — so you can render "what would happen if you clicked here" more subtly than the
committed range.

### Other parts

| Component                                     | Attributes                                                                                                                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Grid`                                        | `data-orientation`, `data-days-per-week`, `data-weeks-in-month`                                                                                                                                               |
| `PrevMonthButton` / `NextMonthButton`         | `data-direction="prev" / "next"`, native `disabled` at bounds                                                                                                                                                 |
| `PrevWeeksButton` / `NextWeeksButton`         | `data-direction`, native `disabled` at bounds                                                                                                                                                                 |
| `RangeSelected` / `RangePreview`              | `data-active`, `data-week-index`, `data-start-index`, `data-end-index`, `data-start-date`, `data-end-date`, `data-extends-before`, `data-extends-after`, `data-has-start`, `data-has-end`, `data-orientation` |
| `RangeStartDragHandle` / `RangeEndDragHandle` | `data-active`, `data-dragging`, `data-edge="start" / "end"`, `data-orientation`                                                                                                                               |
| `WeekNumberCell`                              | `data-week-number`                                                                                                                                                                                            |
| `MonthSeparator` parts                        | `data-month`, `data-year`, `data-first-of-year`, `data-first-visible`, `data-first-day-column`, `data-grid-row-start`, …                                                                                      |

The generated API pages (e.g. [DayButtonState](/docs/api/DayButtonState)) list the state
each component exposes; every boolean state maps to a presence attribute of the same
kebab-cased name.

## Styling day states: a range example

Range styling composes from the day attributes alone — no extra components needed:

```css
.day[data-in-range] {
  background: #e8e6e1;
  border-radius: 0;
}

.day[data-range-start] {
  border-start-start-radius: 0.375rem;
  border-end-start-radius: 0.375rem;
}

.day[data-range-end] {
  border-start-end-radius: 0.375rem;
  border-end-end-radius: 0.375rem;
}

.day[data-range-boundary] {
  background: #1a1a17;
  color: #fff;
}

/* subtler hover preview */
.day[data-range-preview-in-range] {
  outline: 1px dashed #b5b3ad;
}
```

## Range overlays: `RangeSelected` and `RangePreview`

For pill-shaped range highlights that render _behind_ a whole week's days as one element
(rather than per-cell backgrounds), add `RangeSelected` / `RangePreview` inside your
`WeekTemplate`. They're `<td>` overlays that report where the range intersects the week:
`startIndex` / `endIndex` (column positions), `extendsBefore` / `extendsAfter` (whether the
range continues into adjacent weeks — flatten the pill's corners on that side), and
`active` (whether the range touches this week at all).

Because positioning an overlay across table columns requires a CSS-grid layout, these are
typically used with the `render` prop:

```tsx
<WeekTemplate>
  <RangeSelected
    render={(props, state) =>
      state.active ? (
        <td
          {...props}
          className="range-pill"
          style={{
            gridRow: 1,
            gridColumn: `${state.startIndex + 1} / ${state.endIndex + 2}`,
          }}
        />
      ) : (
        <td {...props} style={{ display: "none" }} />
      )
    }
  />
  <DayCellTemplate>{/* … */}</DayCellTemplate>
</WeekTemplate>
```

This pairs with laying out `Grid` as `display: grid` — see the interactive
[demo](/demo) source for a complete Tailwind implementation, including vertical
orientation and week-number offsets.

## Grid layout tips

- `Grid` renders a `<table>`, which styles fine for simple calendars. For overlays,
  subgrid tricks, or vertical orientation, restyle it with `display: grid` — the library
  sets the CSS custom properties `--calendar-days-per-week` and
  `--calendar-weeks-in-month` on the grid element so your template can use
  `grid-template-columns: repeat(var(--calendar-days-per-week), 1fr)`.
- `WeekTemplate` exposes `state.gridRowIndex` (WeeksView only) and `DayCellTemplate`
  exposes `state.columnIndex` + `state.orientation` for explicit grid placement via
  `render`.
- Don't forget `:focus-visible` styles on `DayButton` — see
  [Accessibility](/docs/accessibility).
