---
title: MonthView
description: The traditional paged month grid, with multi-month layouts and month-level navigation.
order: 21
section: Components
---

`MonthView` displays one or more month grids and pages between them — the classic date
picker layout. It manages the visible month(s), keyboard focus, and navigation; selection
state comes from its [CalendarProvider](/docs/calendar-provider).

Use `MonthView` directly for the common case (it wraps a provider for you), or
`CalendarProvider` + `MonthView.Root` when you compose the provider yourself:

{% example file="basic-calendar.tsx" /%}

## Navigation

- `PrevMonthButton` / `NextMonthButton` page the view one month at a time and disable
  themselves at the bounds when `outOfRangeBehavior="stop"`.
- `MonthYearString` renders the localized current month label (and labels the grid for
  assistive tech).
- Keyboard: `PageUp`/`PageDown` page months, `Shift+PageUp`/`Shift+PageDown` page years,
  and arrowing past the grid edge moves the view automatically
  ([full list](/docs/accessibility)).

### Controlled month

By default the view manages the visible month itself, starting at the selection or today
(`defaultMonth` overrides the start). To control it — syncing with a URL, an agenda pane,
or a "jump to date" input — pass `month` and update it in `onMonthChange`:

```tsx
const [month, setMonth] = useState(() =>
  Temporal.PlainYearMonth.from("2026-06"),
);

<MonthView temporal={Temporal} month={month} onMonthChange={setMonth}>
  {/* … */}
</MonthView>;
```

`month` is an ISO `Temporal.PlainYearMonth` and round-trips with `onMonthChange` exactly;
`onMonthChange` also fires for keyboard-driven month crossings, but never on mount.

## Multiple months

Set `numberOfMonths` (1–12) and render one `Grid monthIndex={i}` per month. Navigation
still moves by single months, revealing one new month per click:

{% example file="multiple-months.tsx" /%}

Give each grid its own label with `MonthYearString monthIndex={i}`. Range selection spans
grids naturally — a range can start in one month and end in another.

## Grid shape

- **`fixedWeeks`** — always render 6 week rows, padding with adjacent-month days.
  February 2026 (4 rows) and August 2026 (6 rows) take the same height, so nothing below
  the calendar jumps as users page.
- **`outsideDays`** — what to do with the adjacent-month days that pad the first and last
  weeks:

| Value                   | Behavior                                                                 |
| ----------------------- | ------------------------------------------------------------------------ |
| `"enabled"` _(default)_ | Fully interactive; clicking one selects it                               |
| `"readOnly"`            | Visible but not selectable; range highlighting still paints through      |
| `"disabled"`            | Visible but not selectable; no range highlighting                        |
| `"hidden"`              | Blank cells (kept in the DOM with `aria-hidden` for a stable grid shape) |

Outside days carry `data-outside-month` (and `data-hidden` when hidden) for styling.

## Bounds

`min`/`max` disable out-of-range days everywhere. `outOfRangeBehavior` additionally decides
whether the user can still _page_ past them:

- `"unbounded"` _(default)_ — page freely; out-of-range days simply render disabled.
- `"stop"` — `PrevMonthButton`/`NextMonthButton` disable once the destination month
  crosses a bound.

## Week numbers

Add a `WeekNumberHeader` to the header row and a `WeekNumberCell` at the start of the week
template to show ISO week numbers (determined by each row's Thursday, per ISO 8601):

```tsx
<GridHeader>
  <WeekNumberHeader className="weeknum" />
  <GridHeaderCell />
</GridHeader>
<GridBody>
  <WeekTemplate>
    <WeekNumberCell className="weeknum" />
    <DayCellTemplate>
      <DayButton />
    </DayCellTemplate>
  </WeekTemplate>
</GridBody>
```

## API reference

### Props

`MonthView` accepts all [CalendarProvider](/docs/calendar-provider) props plus the
view props below.

{% api symbol="MonthViewRootProps" /%}

### Hooks

Inside a `MonthView`, `useMonthViewStable()` and `useMonthViewState()` expose the view's
context for custom components:

{% api symbol="MonthViewStableContextValue" /%}

{% api symbol="MonthViewStateContextValue" /%}
