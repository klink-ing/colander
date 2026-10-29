---
title: Composition
description: How $projectName components fit together — templates, the render prop, and building your own parts.
order: 10
section: Guides
---

{% $projectName %} is a set of compound components: small parts that you arrange in JSX to
form a calendar. This page explains the component tree, the _template_ components that
repeat themselves, the `render` prop, and how to drop down to hooks when you need a part
the library doesn't ship.

## The component tree

```text
CalendarProvider                 selection state, bounds, locale, time zone
└─ MonthView.Root │ WeeksView.Root    view state: visible month(s) / week window, focus
   ├─ PrevMonthButton / NextMonthButton    (or PrevWeeksButton / NextWeeksButton)
   ├─ MonthYearString                      localized label, labels the grid
   └─ Grid                                 <table role="grid">
      ├─ GridHeader                        <thead>
      │  └─ GridHeaderCell                 <th> weekday labels (×7)
      └─ GridBody                          <tbody>
         └─ WeekTemplate                   <tr> — repeated per visible week
            ├─ WeekNumberCell              optional <td> week number
            ├─ RangeSelected               optional range overlay <td>
            ├─ RangePreview                optional hover-preview overlay <td>
            └─ DayCellTemplate             <td role="gridcell"> — repeated per day
               └─ DayButton                <button> — the interactive day
                  ├─ RangeStartDragHandle  optional
                  └─ RangeEndDragHandle    optional
```

Two rules make the tree work:

1. **State flows down through context.** `CalendarProvider` owns the selection;
   the view root owns navigation and focus; grid parts read both. No prop drilling.
2. **You write structure once; templates repeat it.**

## Templates

`WeekTemplate`, `DayCellTemplate`, and `GridHeaderCell` are _templates_: the single element
you write is instantiated for every week, day, and weekday in view. This keeps a full
calendar's JSX to a dozen lines while letting you customize the one repeated unit:

```tsx
<GridBody>
  <WeekTemplate>
    <DayCellTemplate>
      <DayButton className="day" />
    </DayCellTemplate>
  </WeekTemplate>
</GridBody>
```

Each instance receives its own state — `DayCellTemplate` and `DayButton` know their `date`,
`columnIndex`, and every selection flag for that specific day. You can also opt out of
iteration: `DayCellTemplate date={someDate}` renders a single explicit cell, and
`GridHeaderCell index={0}` renders just one weekday header.

## Convenience wrappers vs. explicit provider

`MonthView` and `WeeksView` fold a `CalendarProvider` and the corresponding `.Root` into
one component — ideal for the common case:

```tsx
<MonthView temporal={Temporal} selectionMode="range">
  {/* navigation + grid */}
</MonthView>
```

Use the explicit form when you need to place the provider yourself — for example, to share
one selection between two views, or to read calendar state from components that live
outside the view:

```tsx
<CalendarProvider temporal={Temporal} selectionMode="range">
  <MonthView.Root numberOfMonths={2}>{/* grids */}</MonthView.Root>
  <SelectionSummary /> {/* reads state via hooks, outside the view */}
</CalendarProvider>
```

Both forms accept the same props; the wrapper simply forwards view props to `.Root` and
everything else to the provider.

## The render prop

Every component accepts a `render` prop (the same pattern as
[Base UI](https://base-ui.com/react/handbook/composition)) for when `className` and CSS
aren't enough. Pass a function that receives the merged DOM props and a typed `state`
object, and return the element you want:

```tsx
<WeekTemplate
  render={(props, state) => (
    <tr
      {...props}
      style={state.gridRowIndex ? { gridRow: state.gridRowIndex } : undefined}
    />
  )}
/>
```

Rules of thumb:

- **Always spread `props`** onto your element — they carry the event handlers, ARIA
  attributes, and `data-*` state the library manages.
- **`state` is read-only and fully typed** per component (`DayButtonState`,
  `WeekTemplateState`, `RangeSelectedState`, …). Every state also includes `state.root`
  (a `RootState`) with calendar-wide values: `selected`, `rangeStart`/`rangeEnd`,
  `viewing`, `focused`, `locale`, `timeZone`, and more.
- Keep the element type semantically equivalent (a `<td>` for cell parts, a `<button>` for
  interactive parts) so the grid semantics survive.

## Building your own parts

When the shipped parts aren't enough, use the same hooks and contexts they're built from:

- `useCalendarStable()` — stable config and actions: `onSelect(date)`,
  `setRange(start, end)`, `selectionMode`, `minValue`/`maxValue`, `temporal`, `locale`,
  `timeZone`, `weekStartDay`.
- `useCalendarState()` — live selection state: `selected`, `selectedDates`,
  `rangeStart`/`rangeEnd`, `hoveredDate`, `previewStart`/`previewEnd`.
- `useMonthViewState()` / `useWeeksViewState()` — view state: the visible month data
  (`allMonths`) or the weeks window (`windowInfo`).
- `DayCellDataContext` / `GridContext` — inside a cell, the cell's `date` and the grid's
  `orientation`.

For example, a footer that shows the current selection:

```tsx
function SelectionSummary() {
  const { locale } = useCalendarStable();
  const { rangeStart, rangeEnd } = useCalendarState();
  if (!rangeStart) return <p>Select a start date</p>;
  return (
    <p>
      {rangeStart.toLocaleString(locale)}
      {rangeEnd ? ` – ${rangeEnd.toLocaleString(locale)}` : " – …"}
    </p>
  );
}
```

Any component using these hooks must be rendered inside the provider (and inside the view
root for the view hooks).

## Multiple months

One `MonthView.Root` can display several consecutive months. Set `numberOfMonths`, then
render one `Grid` per month with `monthIndex`:

{% example file="multiple-months.tsx" /%}

`MonthYearString monthIndex={i}` labels each grid; navigation buttons page the whole
window. See [MonthView](/docs/month-view) for details.
