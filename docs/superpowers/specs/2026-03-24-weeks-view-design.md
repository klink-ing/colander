# Weeks View — Continuous Week Rows

A new view mode for base-ui-cal that displays the calendar as a continuous column of week rows spanning month boundaries. Configurable window size, multiple ways to specify the starting week, overflow behavior at min/max bounds, and month/year separators.

## Architecture

### Provider Extraction

The current `Root` component is replaced by a three-layer architecture:

- **`CalendarProvider`** — shared state (selection, bounds, locale, config)
- **`MonthView.Root`** / **`WeeksView.Root`** — view-specific state
- **`MonthView`** / **`WeeksView`** — convenience wrappers that compose `CalendarProvider` + view root

The existing `Root` component is removed and replaced by `MonthView`. This is a breaking change with no backwards-compatibility shim.

#### Simple usage (convenience wrappers)

```tsx
// Month view
<MonthView value={...} min={...} max={...} locale="en-US" numberOfMonths={2}>
  <Grid>...</Grid>
</MonthView>

// Weeks view
<WeeksView value={...} min={...} max={...} locale="en-US" weekCount={8} firstWeek={...}>
  <Grid>...</Grid>
</WeeksView>
```

#### Composed usage (both views sharing state)

```tsx
<CalendarProvider value={...} min={...} max={...} locale="en-US">
  <MonthView.Root numberOfMonths={1}>
    <Grid>...</Grid>
  </MonthView.Root>
  <WeeksView.Root weekCount={6} firstWeek={...}>
    <Grid>...</Grid>
  </WeeksView.Root>
</CalendarProvider>
```

### Component Ownership

**Shared (both views):**
- CalendarProvider
- Grid (delegates internally to MonthGrid or WeeksGrid based on view context)
- GridBody
- GridHeader / GridHeaderCell
- WeekTemplate
- DayCellTemplate / DayButton
- WeekNumberCell / WeekNumberHeader
- RangeSelected / RangePreview
- RangeStartDragHandle / RangeEndDragHandle
- DateString / TimeString / MonthYearString
- PrevMonthButton / NextMonthButton

**Month view only:**
- MonthView (convenience wrapper)
- MonthView.Root

**Weeks view only (new):**
- WeeksView (convenience wrapper)
- WeeksView.Root
- PrevWeeksButton / NextWeeksButton
- MonthSeparator (.Month, .Year, .WeekCount)
- WeeksView.WeekCount

Grid remains a single public component. If different internal rendering is needed for month vs weeks layout, MonthGrid and WeeksGrid are internal components selected by Grid based on view context.

## Props & Types

### CalendarProvider Props

Extracted from the current Root. Shared across both views.

```ts
interface CalendarProviderProps {
  // Selection
  value / defaultValue / onValueChange
  selectionMode: "single" | "range" | "multiple"
  rangeMode / preventRangeReversal

  // Bounds & validation
  min / max
  isDateDisabled: (date: Temporal.PlainDate) => boolean

  // Locale & Temporal
  locale / timeZone
  T: TemporalNamespace
  weekStartDay: 0 | 1 | 2 | 3 | 4 | 5 | 6

  // Behavior
  disabled / readOnly
  outsideDays: "enabled" | "readonly" | "disabled" | "hidden"
  valueFormat
}
```

### MonthView.Root Props

```ts
interface MonthViewRootProps {
  numberOfMonths: 1..12
  overflowBehavior: "unbounded" | "contain"
  defaultMonth / month / onMonthChange
}
```

### WeeksView.Root Props

```ts
interface WeeksViewRootProps {
  // Window size
  weekCount: number

  // First week — controlled/uncontrolled
  firstWeek / defaultFirstWeek: FirstWeekSpec
  onFirstWeekChange: (date: Temporal.PlainDate) => void

  // Navigation
  weekSnap: "top" | "center" | "nearest"
  scrollBy: "row" | "page"

  // Overflow at min/max boundaries
  overflowBehavior: "unbounded" | "contain" | "contain-truncate" | "clamp" | "clamp-truncate"

  // Window change callback
  onWindowChange: (info: WindowInfo) => void
}
```

### FirstWeekSpec

Five ways to specify the starting week. All resolve to "the week containing this date" using the calendar's `weekStartDay`.

```ts
type FirstWeekSpec =
  | Temporal.PlainDate                          // week containing this date
  | Date                                        // native JS Date, week containing it
  | { isoWeek: number; isoYear: number }        // ISO 8601 week (always Monday-start)
  | { week: number; year: number }              // week-of-year relative to weekStartDay
  | { month: number; year: number; day?: number } // month + optional day
```

For the `{ month, year, day? }` form: when `day` is specified, picks the week containing that day. Without `day`, picks the first week containing a day in that month.

### WindowInfo

Provided to `onWindowChange` and exposed via `useWeeksViewState()`.

```ts
interface WindowInfo {
  windowStart: Temporal.PlainDate   // first day of first visible week
  windowEnd: Temporal.PlainDate     // last day of last visible week
  weekCount: number                 // actual weeks displayed (may differ in truncate modes)
  dayCount: number                  // total days in window
  enabledWeekCount: number          // weeks with ≥1 enabled day
  enabledDayCount: number           // days not disabled by isDateDisabled/min/max
}
```

### PrevWeeksButton / NextWeeksButton Props

```ts
interface WeeksButtonProps {
  shiftBy?: number  // overrides weekCount as the shift amount
  render?: ...      // useRender pattern
}
```

Defaults to shifting by `weekCount`.

## MonthSeparator

A single component rendered at every month boundary within the weeks view window. Uses the `useRender` pattern for custom rendering with sensible defaults.

### Child components

- `MonthSeparator.Month` — displays the month name
- `MonthSeparator.Year` — displays the year
- `MonthSeparator.WeekCount` — displays how many weeks of this month are visible

### State & data attributes

```ts
interface MonthSeparatorState {
  month: number                // 1-12
  year: number
  firstOfYear: boolean         // true when this is the first month of a new year in the window
  firstVisible: boolean        // true for the separator at the top of the window
  weeksVisibleBefore: number   // weeks of the previous month visible above this separator
  weeksVisibleAfter: number    // weeks of the new month visible below this separator
}
```

Data attributes on the rendered element:
- `data-month="3"`, `data-year="2026"`
- `data-first-of-year` (present when true)
- `data-first-visible` (present when true)

Always rendered at every boundary. Consumers can hide the first separator or year labels via CSS using these attributes, or via the render function checking state.

## Keyboard Navigation

### Weeks view behavior

| Key | Action |
|-----|--------|
| Arrow Left/Right | ±1 day, window follows if focus exits visible area |
| Arrow Up/Down | ±1 week, window follows if focus exits visible area |
| PageUp/PageDown | Focus ±`weekCount` weeks, window shifts by `weekCount` |
| Shift+PageUp/PageDown | Focus ±1 year, window follows |
| Home | Focus first day of visible window |
| End | Focus last day of visible window |
| Enter/Space | Select focused day (if not disabled/readOnly) |

### `scrollBy` prop

Controls how the window responds when arrow key focus exits the visible area:

- **`"row"`** (default) — window shifts by 1 week to keep focus visible (smooth scrolling feel)
- **`"page"`** — window jumps by `weekCount` (pagination feel)

In both modes, focus still moves by ±1 day/week. The difference is only how the window responds.

### Focus management

1. The focusable day (roving tabindex) must always be within the visible window.
2. When the window shifts via buttons, the focusable day moves to the nearest visible day.
3. When the window shifts via keyboard, focus drives the window — the window moves to keep the focused day visible.
4. On initial mount, the focusable day is the selected date (if visible), otherwise the first day of the first visible week.
5. A disabled day can receive the roving tabindex but cannot be selected. Matches month view behavior.

## Overflow Behavior

Five modes controlling what happens when navigation reaches min/max boundaries.

### Mode definitions

- **`"unbounded"`** — navigate freely past min/max. Days outside bounds are disabled but shown. Buttons never disabled.
- **`"contain"`** — navigation allowed only if the resulting window has ≥1 enabled day. Buttons disabled when next shift would show 0 enabled days. Always renders `weekCount` rows, padding with disabled weeks.
- **`"contain-truncate"`** — same navigation restriction as `contain`. Removes fully-disabled rows from the end. May show fewer than `weekCount` rows.
- **`"clamp"`** — navigation always allowed. Window auto-adjusts so it ends at the last valid week (or starts at the first valid week). Pads to `weekCount` rows. Buttons disabled when already at clamp position (shift would no-op).
- **`"clamp-truncate"`** — same clamp behavior. Removes fully-disabled rows. Buttons disabled when at clamp position. May show fewer than `weekCount` rows.

### Overflow behavior only considers min/max

`isDateDisabled` does NOT affect overflow logic — only `min` and `max` do. This prevents expensive full-scan computation. Days disabled by `isDateDisabled` are rendered but visually disabled.

### Month view overflow

`MonthView.Root` accepts only `"unbounded" | "contain"`. TypeScript enforces the narrowed type. `contain` disables prev/next month buttons when the target month has zero enabled days within min/max.

### Edge cases

| Case | Behavior |
|------|----------|
| No min/max set | All modes behave like `unbounded` |
| min == max (single day) | Truncate modes: 1 week. Pad modes: `weekCount` weeks. |
| weekCount exceeds available weeks | Truncate: show only valid weeks. Pad: fill with disabled rows. |
| Focus target is disabled | Receives roving tabindex, can't be selected. |

## State & Context Architecture

### Stable/volatile split per provider

Six hooks, maintaining the stable/volatile separation for render performance:

| Hook | Contents |
|------|----------|
| `useCalendarStable()` | locale, T, timeZone, weekStartDay, onChange, min, max, isDateDisabled, selectionMode, rangeMode, valueFormat, outsideDays |
| `useCalendarState()` | value, disabled, readOnly |
| `useMonthViewStable()` | numberOfMonths, overflowBehavior, goNextMonth, goPrevMonth |
| `useMonthViewState()` | currentMonth, focusedDate |
| `useWeeksViewStable()` | weekCount (prop), scrollBy, overflowBehavior, goNext, goPrev |
| `useWeeksViewState()` | windowStart, windowEnd, weekCount (actual), focusedDate, WindowInfo |

The existing `useDatePickerStable` / `useDatePickerState` are removed (breaking change).

Stable contexts contain callbacks, refs, and configuration that don't change across renders. Volatile contexts contain state that changes on user interaction. Components subscribe only to the contexts they need.

### View type discriminator

A `viewType: "month" | "weeks"` value is available in view context so shared components like `Grid` can detect which view they're in and delegate to the appropriate internal renderer.

## Future-Proofing for Infinite Scroll

This feature does NOT implement infinite scrolling but makes specific design decisions to enable it later.

### Decisions that enable future infinite scroll

1. **Window-based model** — the view thinks in terms of "which weeks are visible" rather than "which month am I on." Infinite scroll just makes the window dynamic.
2. **`onWindowChange` callback** — provides the visible range for data fetching/prefetching.
3. **Controlled `firstWeek`** — an infinite scroll wrapper can drive the window externally based on scroll position.
4. **Data-driven `MonthSeparator`** — renders based on month boundaries within the window, adapts automatically as the window shifts.
5. **Selection state separated from window state** — an infinite scroll wrapper only replaces window management.

### Implementation requirements for this feature

1. **Extract week computation as a pure utility** — `computeWeeksInWindow(firstWeek, weekCount, weekStartDay)` returns an array of week descriptors. This is used internally by `WeeksView.Root` but is also exported for direct use by future virtualization layers.
2. **Grid render prop receives week data array** — so the rendering strategy (table rows vs absolutely-positioned divs) is replaceable without forking the component.
3. **Keep scroll position out of React state** — scroll position is a DOM concern. No React state tracks it.

### Future `overscan` prop (not implemented now)

When infinite scroll is added, an `overscan` prop on `WeeksView.Root` will control extra rows rendered above/below the visible area for smooth scrolling. `weekCount` remains the logical page size (used by PageUp/PageDown and button defaults). `overscan` adds buffer rows to the DOM without affecting navigation semantics. Example: `weekCount={8} overscan={3}` renders 14 rows (3 + 8 + 3), pages by 8.
