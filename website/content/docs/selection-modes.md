---
title: Selection modes
description: Single, multiple, and range selection — controlled and uncontrolled — plus range previews and drag handles.
order: 12
section: Guides
---

Selection is configured on the [CalendarProvider](/docs/calendar-provider) (or on the
`MonthView` / `WeeksView` wrappers, which forward to it) with the `selectionMode` prop:
`"single"` (default), `"multiple"`, or `"range"`. The mode determines the shape of
`value`, `defaultValue`, and the argument to `onValueChange`.

## Controlled vs. uncontrolled

Every mode supports both patterns, with the usual React rules:

- **Uncontrolled** — _omit_ `value` entirely and optionally seed with `defaultValue`. The
  calendar manages its own state; `onValueChange` still reports every change.
- **Controlled** — pass `value` and keep it updated from `onValueChange`. Pass
  `value={null}` (or `[]` in multiple mode) to clear the selection — don't pass
  `value={undefined}`, which means "uncontrolled".

`onValueChange(value, meta)` receives the new value in your configured
[format](/docs/dates-and-formats), plus a `meta` object with the clicked `date`
(a `Temporal.PlainDate`, or `undefined` for non-click changes) and the `previous` value.

## Single

One date or `null`. Clicking the selected date again keeps it selected; clicking another
date moves the selection.

```tsx
const [date, setDate] = useState<Temporal.PlainDate | null>(null);

<MonthView temporal={Temporal} value={date} onValueChange={setDate}>
  {/* … */}
</MonthView>;
```

## Multiple

An array of dates, kept sorted oldest-first. Clicking an unselected date adds it; clicking
a selected date removes it.

```tsx
const [dates, setDates] = useState<Temporal.PlainDate[]>([]);

<MonthView
  temporal={Temporal}
  selectionMode="multiple"
  value={dates}
  onValueChange={setDates}
>
  {/* … */}
</MonthView>;
```

## Range

A `{ start, end }` pair (`DateRange`), either boundary possibly `null` while the range is
in progress. The first click sets the start; hovering shows a live preview; the second
click commits the end.

{% example file="range-calendar.tsx" /%}

Style ranges with the `data-in-range` / `data-range-start` / `data-range-end` attributes
on day cells, or with the `RangeSelected` overlay — both covered in
[Styling](/docs/styling).

### Clicking inside an existing range: `rangeMode`

Once a full range exists, what should the next click do? `rangeMode` makes that policy
explicit:

| `rangeMode`                 | Behavior on click                                                         |
| --------------------------- | ------------------------------------------------------------------------- |
| `"nearest-end"` _(default)_ | Moves whichever boundary is closer to the clicked date; ties move the end |
| `"nearest-start"`           | Same, but ties move the start                                             |
| `"adjust-end"`              | Always moves the end to the clicked date                                  |
| `"adjust-start"`            | Always moves the start to the clicked date                                |
| `"start-end"`               | Two-step: the click starts a fresh range (click again to set its end)     |
| `"reset"`                   | Collapses to a single-day range on the clicked date                       |

### Reversed selections

If the user picks an end date _before_ the start date, the range is auto-sorted by default
(select June 20 then June 10 → June 10–20). Set `preventRangeReversal` to instead collapse
reversed picks to a single-day range — useful when "backwards" selection is likely a
mistake in your UX.

### The hover preview

While a range is in progress (and when hovering with `rangeMode` policies that would move
a boundary), the provider computes a **preview range** — the range that _would_ be
committed if the user clicked the hovered day. It surfaces in three places:

- `data-range-preview-*` attributes on day cells,
- the `RangePreview` overlay component,
- `onHoveredDateChange`, if you want to react to hovering yourself.

You can also take the preview over entirely with the `previewRange` prop — pass a
`DateRange` to display, or `null` to hide it. This is how you'd preview a range from an
external input (e.g. "next weekend" buttons above the calendar).

### Setting a range programmatically

Components inside the provider can commit a range directly with `setRange` from
`useCalendarStable()`:

```tsx
function NextWeekButton() {
  const { setRange, temporal } = useCalendarStable();
  return (
    <button
      onClick={() => {
        const start = temporal.Now.plainDateISO().add({ days: 7 });
        setRange(start, start.add({ days: 6 }));
      }}
    >
      Next week
    </button>
  );
}
```

(For external control, the controlled `value` prop does the same job.)

### Drag handles

`RangeStartDragHandle` and `RangeEndDragHandle` render grab affordances inside day buttons
at the range boundaries, letting users drag either end of a committed range. Place them
inside `DayButton` (via children or `render`); they position themselves only on the
boundary days and stay `aria-hidden` elsewhere:

```tsx
<DayCellTemplate>
  <DayButton
    render={(props, state) => (
      <button {...props}>
        {state.date.day}
        <RangeStartDragHandle className="handle" />
        <RangeEndDragHandle className="handle" />
      </button>
    )}
  />
</DayCellTemplate>
```

Dragging is a pointer enhancement — every range edit remains possible by click and
keyboard (see [Accessibility](/docs/accessibility)).

## Restricting selectable dates

Three props combine to disable dates in every mode:

- `min` / `max` — bounds in your configured value format; days outside are disabled and
  keyboard focus is clamped to them.
- `isDateDisabled` — a predicate for irregular rules (weekends, blackout dates):

```tsx
<MonthView
  temporal={Temporal}
  min={Temporal.PlainDate.from("2026-06-01")}
  max={Temporal.PlainDate.from("2026-12-31")}
  isDateDisabled={(date) => date.dayOfWeek >= 6}
>
  {/* … */}
</MonthView>
```

- `disabled` / `readOnly` — disable the whole calendar, or allow browsing but not
  selecting.

Note that `min`/`max` restrict _selection_; whether the user can still _navigate_ past
them is a per-view choice via `outOfRangeBehavior` — see [MonthView](/docs/month-view)
and [WeeksView](/docs/weeks-view).

## Switching modes at runtime

If `selectionMode` changes while the calendar is mounted (e.g. a "range" toggle in your
UI), an uncontrolled calendar truncates its state sensibly (range → its start date, etc.)
and reports the change through `onValueChange`. A controlled calendar leaves reconciling
`value` to you.
