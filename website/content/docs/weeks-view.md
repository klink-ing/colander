---
title: WeeksView
description: A continuously scrolling window of week rows that spans month boundaries.
order: 22
section: Components
---

`WeeksView` renders a fixed-height **window of week rows** that scrolls continuously
through the calendar — no page flips, no month boundaries. It's the layout behind
agenda-style mini calendars (think Google Calendar's sidebar): June's last week and July's
first week can sit next to each other in the same view.

Compared to [MonthView](/docs/month-view):

|                 | MonthView                        | WeeksView                              |
| --------------- | -------------------------------- | -------------------------------------- |
| Unit of display | Whole months                     | Any consecutive weeks                  |
| Navigation      | Page by month                    | Scroll by week row or page             |
| Window height   | Rows per month (or `fixedWeeks`) | Always exactly `weekCount` rows        |
| Month labels    | One per grid                     | `MonthSeparator` parts inside the flow |

Both views share the same grid parts, selection model, and provider — switching between
them is mostly a matter of swapping the root and navigation.

{% example file="weeks-view-basic.tsx" /%}

## The window

- **`weekCount`** (required) — how many week rows are visible.
- **`firstWeek` / `defaultFirstWeek` / `onFirstWeekChange`** — the controlled /
  uncontrolled first visible week. Any date-like value works — a `FirstWeekSpec` is
  resolved to the containing week and snapped to `weekStartDay`:

```tsx
<WeeksView weekCount={5} defaultFirstWeek={{ month: 6, year: 2026 }} />
// also accepted:
//   Temporal.PlainDate.from("2026-06-15")
//   new Date(2026, 5, 15)
//   { isoWeek: 25, isoYear: 2026 }
//   { week: 25, year: 2026 }   (relative to weekStartDay)
```

- **`onWindowChange`** — fires with a `WindowInfo` snapshot whenever the window moves:
  `windowStart`/`windowEnd`, day and week counts, how many of those are enabled, and the
  `visibleMonths` list — handy for rendering a "Jun – Jul 2026" heading (see the example
  above, which reads the same data from `useWeeksViewState().windowInfo`).

## Scrolling

- **`PrevWeeksButton` / `NextWeeksButton`** shift the window; **`scrollBy`** decides the
  step — `"row"` (one week, default) or `"page"` (a full `weekCount`).
- **`WeekCount`** renders the number of visible weeks, if you want it in your UI.
- Keyboard: arrowing or paging focus past the window edge scrolls it automatically.
- **Imperative scrolling** — `WeeksView` (and `WeeksView.Root`) forwards a ref with a
  `scrollToWeek(target, { snap })` handle:

```tsx
const ref = useRef<WeeksViewRootHandle>(null);

<WeeksView ref={ref} temporal={Temporal} weekCount={6}>
  {/* … */}
</WeeksView>;

// later:
ref.current?.scrollToWeek(Temporal.PlainDate.from("2026-09-01"), {
  snap: "center",
});
```

`snap` positions the target within the window: `"start"` (default), `"center"`, `"end"`,
or `"nearest"` — which scrolls only if the target is outside the window, choosing the
closer edge.

## Behavior at the bounds

With `min`/`max` set, `outOfRangeBehavior` controls how the _window_ treats the bounds
(selection is always restricted regardless):

| Value                     | Behavior                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------ |
| `"unbounded"` _(default)_ | Scroll freely; out-of-range days render disabled                                           |
| `"stop"`                  | Nav buttons disable once the next step would show no in-range day                          |
| `"stop-shrink"`           | Like `"stop"`, but the window shrinks near the edge instead of showing fully-disabled rows |
| `"snap"`                  | Overshooting jumps snap the window edge to the first/last in-range week                    |
| `"snap-shrink"`           | Snap, then trim any remaining fully-disabled rows                                          |

`"snap"` and `"snap-shrink"` only differ when the selectable range spans _fewer_ weeks
than `weekCount`: snapping can pin only one edge, so the window overhangs the other —
`"snap"` keeps the full height (padding with disabled rows) while `"snap-shrink"` trims to
just the in-range weeks. With `weekCount: 6` and bounds spanning 2 weeks, `"snap"` shows
6 rows (4 disabled), `"snap-shrink"` shows 2.

## Month separators

Because months flow into each other, `MonthSeparator` parts let you mark where a new month
begins inside the grid — a border above its first week, a rotated month label in a side
column, however you like. `MonthSeparatorRow` repeats for each month whose first day is in
view and exposes layout state (`firstDayColumn`, `firstDayVisible`, `gridRowStart`,
`fullWeeksVisibleAfter`) via its `render` prop, with `MonthSeparatorMonth` /
`MonthSeparatorYear` for localized labels:

```tsx
<GridBody>
  <MonthSeparatorRow
    render={(props, state) => (
      <tr {...props} className="contents">
        <td className="contents">
          {state.firstDayVisible && (
            <div
              className="month-rule"
              style={{
                gridRow: state.gridRowStart,
                gridColumn: `${state.firstDayColumn + 1} / -1`,
              }}
            >
              <MonthSeparatorMonth format="short" />
            </div>
          )}
        </td>
      </tr>
    )}
  />
  <WeekTemplate>{/* … */}</WeekTemplate>
</GridBody>
```

Like the range overlays, separators assume a CSS-grid layout on `Grid` — see
[Styling](/docs/styling) and the [demo](/demo) source for a complete implementation.

## Week numbers

`WeekNumberHeader` / `WeekNumberCell` work exactly as in
[MonthView](/docs/month-view#week-numbers).

## API reference

### Props

`WeeksView` accepts all [CalendarProvider](/docs/calendar-provider) props plus the view
props below.

{% api symbol="WeeksViewRootProps" /%}

### Window info

{% api symbol="WindowInfo" /%}

### First week spec

{% api symbol="FirstWeekSpec" /%}

### Hooks

Inside a `WeeksView`, `useWeeksViewStable()` and `useWeeksViewState()` expose the view's
context — including `windowInfo` and the `scrollToWeek`/`goNext`/`goPrev` actions — for
custom components.
