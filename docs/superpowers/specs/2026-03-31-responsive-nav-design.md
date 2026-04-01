# Responsive Navigation Design

## Overview

Make the docs site header and sidebar responsive with two breakpoints, a mobile-first CSS approach, and a Base UI Dialog-based slide-in drawer.

## Scope

This spec covers the **header** and **docs sidebar** only. The demo page's `AppControls` panel is out of scope — it has its own layout concerns and will be addressed separately.

## Breakpoint System

Replace Tailwind's default semantic breakpoints (`sm`, `md`, `lg`, etc.) with a numeric scale: `bp-1` through `bp-20`, plus half-steps (`bp-1.5`, `bp-2.5`, etc.).

Formula (assuming 16px browser default): `bp-N` = `N * 6.25rem` (100px). Half-steps: `bp-N.5` = `(N * 6.25) + 3.125rem` (150px).

All 40 breakpoints are enumerated in `styles.css` via a `@theme` block (Tailwind v4 requires explicit enumeration — no pattern support). Default Tailwind breakpoints are cleared with `--breakpoint-*: initial`. Values use `rem` units.

```css
@theme {
  --breakpoint-*: initial;
  --breakpoint-bp-1: 6.25rem;    /* 100px */
  --breakpoint-bp-1.5: 9.375rem; /* 150px */
  --breakpoint-bp-2: 12.5rem;    /* 200px */
  /* ... through bp-20 (125rem / 2000px) */
}
```

### Breakpoints Used in This Spec

| Breakpoint | Width | Purpose |
|---|---|---|
| `bp-4.5` | 450px | Header collapses to hamburger |
| `bp-6` | 600px | Sidebar collapses to drawer |

### Responsive Behavior

| Screen width | Header | Docs Sidebar |
|---|---|---|
| **< 450px** | Logo + theme toggle + hamburger. Hamburger opens drawer. On docs pages, drawer contains nav links + sidebar. On other pages, just nav links + GitHub. | Hidden — accessed via combined drawer. |
| **450px – 599px** | Full header (logo, nav links, GitHub, theme toggle). | Hidden — toggle button above docs content opens drawer with sidebar only. |
| **≥ 600px** | Full header. | Always visible inline (current behavior). |

Mobile-first: default styles target the narrowest layout, `min-width` media queries layer on wider layouts.

## Drawer Component

A single `NavDrawer` component wrapping Base UI's `Dialog`, styled as a left-edge slide-in panel.

- **Props**: controlled `open` / `onOpenChange` pair, plus `children`
- **Width**: `w-72` (18rem) — leaves visible backdrop on most screens
- **Z-index**: `z-[60]` for both backdrop and panel (above the `z-50` header)
- **Content**: caller decides what goes inside
- **Behavior**:
  - Slides in from left with a backdrop overlay
  - Closes on: backdrop click, Escape key, route change
  - Focus trapping and scroll lock provided by Base UI Dialog
  - Animated via Base UI's `[data-open]` / `[data-ending-style]` transition attributes
  - ~200ms ease-out open, ~150ms ease-in close
- **Route change close**: `NavDrawer` subscribes to TanStack Router's `router.subscribe('onBeforeNavigate', ...)` inside a `useEffect` and calls `onOpenChange(false)`. The parent owns the state; the drawer just signals close.
- **Accessibility**: `aria-label="Navigation"` on the Dialog

## Component Changes

### New Files

- **`NavDrawer.tsx`**: Base UI Dialog wrapper. Controlled via `open`/`onOpenChange`. Renders backdrop + slide-in panel. Subscribes to router for auto-close.

- **`DocsDrawerContent.tsx`**: Composes the combined view for < 450px on docs pages — header nav links (Home, Docs, Demo, GitHub), a separator, then `<DocsNav>` content. Receives `entries` and `apiEntries` as props.

### Modified Files

- **`Header.tsx`**:
  - Owns `useState` for drawer open/close
  - Add hamburger button (`aria-label="Open navigation menu"`), visible by default, hidden at `bp-4.5:hidden`
  - `NavigationMenu` and GitHub link hidden by default, shown at `bp-4.5:flex`
  - Hamburger opens `NavDrawer`
  - Header needs to know if it's on a docs page to render combined content. Use a **slot pattern**: `Header` accepts an optional `drawerContent` prop (ReactNode). The docs layout passes `<DocsDrawerContent>` via this prop. On non-docs pages, the prop is omitted and the drawer renders just the nav links.

- **`__root.tsx`**: Thread `drawerContent` from route context to Header (or Header reads it from a lightweight context provided by the docs layout).

- **`docs.tsx` (DocsLayout)**:
  - Provides `drawerContent` for the header via context or outlet context
  - Inline `<DocsNav>` wrapper: `hidden bp-6:flex` (hidden below 600px, flex at 600px+)
  - Toggle button: visible by default, hidden at `bp-6:hidden` and `max-bp-4.5:hidden` (only shows between 450–599px). Renders as a bar above the article with a menu icon and "Navigation" label. Opens its own `NavDrawer` with `<DocsNav>` inside (separate state from header's drawer).
  - Owns its own `useState` for the sidebar drawer

- **`DocsNav.tsx`**:
  - Remove the outer `w-56 shrink-0 pr-6` and `sticky top-20` wrapper styles. DocsNav renders only the navigation markup — no layout/sizing concerns.

- **`DocsNavSidebar.tsx`** (new): Wrapper that provides the inline layout — `w-56 shrink-0 pr-6` with a `sticky top-20` inner container. Wraps `<DocsNav>`. Used by `docs.tsx` for the desktop layout. When DocsNav is rendered inside the drawer, it's used directly without this wrapper.

- **`styles.css`**: Add `@theme` block with full `bp-*` breakpoint scale (bp-1 through bp-20, plus half-steps). Clear default breakpoints with `--breakpoint-*: initial`.

## CSS Approach

All responsive behavior uses Tailwind utility classes directly on React components. No custom CSS class names.

Drawer animation uses Tailwind transitions combined with Base UI's data attributes for enter/exit states:
- Backdrop: `opacity-0 data-[open]:opacity-100 data-[ending-style]:opacity-0 transition-opacity duration-200`
- Panel: `-translate-x-full data-[open]:translate-x-0 data-[ending-style]:-translate-x-full transition-transform duration-200 ease-out`
