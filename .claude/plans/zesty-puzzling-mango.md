# Remaining work: `computePreviewRange` utility export

## Context
The two-step range selection with hover preview feature is ~95% implemented. All components, types, state management, and context wiring are already in place. The only missing piece from the plan is the exported `computePreviewRange` utility function.

## What's done
- `src/types.ts` — `RangeMode`, all props, context types, `RangePreviewState/Props`, `rangePreview` on `DayCellTemplateState`
- `src/root-selection.ts` — `rangeMode`/`allowRangeReversal` params, `start-end` branch, boundary click handling
- `src/use-root-state.ts` — hover state, preview computation via `computeSelectionUpdate`, controlled `previewRange`, context wiring
- `src/day-cell.tsx` — `previewStart`/`previewEnd`, `rangePreview` field + attribute, `onPointerEnter`
- `src/grid.tsx` — `onPointerLeave`
- `src/selected-range.tsx` — Renamed to `RangeSelected` with deprecated alias
- `src/range-preview.tsx` — New component reading `previewStart`/`previewEnd`
- `src/root.tsx` — Passes new props
- `src/factory.tsx` — `RangePreview`, `RangeSelected`, `SelectedRange`
- `src/index.ts` — All component + type exports

## What's missing

### 1. `computePreviewRange` utility (`src/root-selection.ts`)
Export a pure function users can call in their `onHoveredDateChange` handler:

```ts
export function computePreviewRange<F extends ValueFormat>(
  hoveredDate: Temporal.PlainDate | RawValueForFormat<F>,
  currentRange: DateRange<F> | null,
  rangeMode: RangeMode,
  allowRangeReversal?: boolean,
): DateRange<F> | null
```

Internally: convert inputs to `PlainDate`, call `computeSelectionUpdate` with the appropriate params, then convert the result back to `DateRange<F>`. Need a lightweight Temporal namespace (just `PlainDate.compare` and `PlainDate.from`).

Since this is a pure utility for external consumers, it needs to accept raw format values and return them. It should use `Temporal` from the polyfill import.

### 2. Export from `src/index.ts`
Add: `export { computePreviewRange } from "./root-selection";`

## Verification
- `npx tsc --noEmit`
- `npx biome check .`
- `npx vitest run`
- `npm run build`
