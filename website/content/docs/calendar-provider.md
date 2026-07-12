---
title: CalendarProvider
description: Manages shared state across calendar views — selection, bounds, locale, and more.
order: 20
section: Components
---

`CalendarProvider` is the state root of every calendar. It owns the selection (in all
[three modes](/docs/selection-modes)), resolves configuration — bounds, time zone, locale,
week start, the [Temporal implementation](/docs/dates-and-formats) — and shares everything
with its descendants through context. It renders no DOM of its own.

```tsx
import { Temporal } from "@js-temporal/polyfill";
import { CalendarProvider, MonthView } from "@klinking/colander";

<CalendarProvider
  temporal={Temporal}
  selectionMode="range"
  weekStartDay={1}
  onValueChange={(range) => console.log(range)}
>
  <MonthView.Root>{/* navigation + grid */}</MonthView.Root>
</CalendarProvider>;
```

## When you need it explicitly

The `MonthView` and `WeeksView` wrappers already include a `CalendarProvider`, so most
calendars never mention it. Reach for the explicit form when:

- **Components outside the view need calendar state.** Anything using
  `useCalendarStable()` / `useCalendarState()` must live under the provider — a selection
  summary, preset-range buttons, a clear button.
- **Two views should share one selection.** Render both roots under a single provider —
  for example a month grid next to a scrolling weeks strip, always in sync:

```tsx
<CalendarProvider temporal={Temporal} selectionMode="range">
  <MonthView.Root>{/* … */}</MonthView.Root>
  <WeeksView.Root weekCount={3}>{/* … */}</WeeksView.Root>
</CalendarProvider>
```

- **You're building a custom view** from the grid primitives and hooks.

{% callout type="warning" %}
Don't nest a `MonthView`/`WeeksView` _wrapper_ inside a `CalendarProvider` — the wrapper
creates its own provider, which would shadow yours. Inside an explicit provider, always use
`MonthView.Root` / `WeeksView.Root`.
{% /callout %}

## What it manages

- **Selection** — single / range / multiple, controlled or uncontrolled, exposed in your
  configured value [format](/docs/dates-and-formats).
- **Constraints** — `min`, `max`, `isDateDisabled`, `disabled`, `readOnly`.
- **Range behavior** — `rangeMode`, `preventRangeReversal`, the hover preview and
  `previewRange` override.
- **Environment** — `temporal`, `timeZone`, `locale`, `weekStartDay`.

What it does _not_ manage: focus, keyboard navigation, and which month/weeks are visible —
those belong to the view roots ([MonthView](/docs/month-view), [WeeksView](/docs/weeks-view)),
which is why the provider alone renders nothing interactive.

## Reading state with hooks

Two hooks expose the provider's context, split by volatility so components can subscribe
to only what they need:

- `useCalendarStable()` — configuration and stable callbacks (`onSelect`, `setRange`,
  `selectionMode`, `minValue`, `maxValue`, `temporal`, `locale`, `timeZone`, …). Doesn't
  change during normal interaction.
- `useCalendarState()` — the live values (`selected`, `selectedDates`, `rangeStart`,
  `rangeEnd`, `hoveredDate`, `previewStart`, `previewEnd`).

```tsx
function ClearButton() {
  const { setRange, readOnly } = useCalendarStable();
  const { rangeStart, rangeEnd } = useCalendarState();
  if (!rangeStart || readOnly) return null;
  // …
}
```

## API reference

### Props

{% api symbol="CalendarProviderProps" /%}

### Stable context

{% api symbol="CalendarStableContextValue" /%}

### State context

{% api symbol="CalendarStateContextValue" /%}
