# Responsive Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the header and docs sidebar responsive with a slide-in drawer at two breakpoints, using mobile-first CSS.

**Architecture:** Replace Tailwind's default semantic breakpoints with a numeric `bp-*` scale. Rename `Sidebar` to `DocsNav` (pure navigation markup) with a `DocsNavSidebar` wrapper for inline desktop layout. Add a `NavDrawer` component (Base UI Dialog) for collapsed states. Header gets a hamburger button below 450px; docs sidebar hides below 600px.

**Tech Stack:** React, TanStack Router, Tailwind CSS v4, Base UI Dialog, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-31-responsive-nav-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `site/src/styles.css` | Modify | Add `@theme` block with `bp-*` breakpoints (rem), clear defaults |
| `site/src/components/DocsNav.tsx` | Create (rename from Sidebar.tsx) | Pure docs navigation markup, no layout styles |
| `site/src/components/DocsNavSidebar.tsx` | Create | Inline sidebar wrapper: `w-56 shrink-0 pr-6`, sticky positioning |
| `site/src/components/NavDrawer.tsx` | Create | Base UI Dialog as left slide-in drawer, controlled, auto-close on route change |
| `site/src/components/DocsDrawerContent.tsx` | Create | Combined nav links + DocsNav for < 450px on docs pages |
| `site/src/components/Header.tsx` | Modify | Add hamburger, `drawerContent` slot prop, responsive visibility |
| `site/src/routes/__root.tsx` | Modify | Thread `drawerContent` to Header via context |
| `site/src/routes/docs.tsx` | Modify | Use DocsNavSidebar inline, add toggle for 450–599px range, provide DocsDrawerContent |
| `site/src/routes/index.tsx` | Modify | Migrate `sm:` / `lg:` breakpoints to `bp-*` |
| `site/src/routes/docs/index.tsx` | Modify | Migrate `sm:` breakpoints to `bp-*` |
| `site/src/components/Footer.tsx` | Modify | Migrate `sm:` breakpoints to `bp-*` |

---

### Task 1: Add `bp-*` Breakpoint Scale to styles.css

**Files:**
- Modify: `site/src/styles.css`

- [ ] **Step 1: Add the `@theme` block with all breakpoints**

Add this block near the top of `styles.css` (after the imports, before the existing `@theme inline` block). The `--breakpoint-*: initial` line clears Tailwind's defaults (`sm`, `md`, `lg`, `xl`, `2xl`).

```css
@theme {
  --breakpoint-*: initial;
  --breakpoint-bp-1: 6.25rem;
  --breakpoint-bp-1\.5: 9.375rem;
  --breakpoint-bp-2: 12.5rem;
  --breakpoint-bp-2\.5: 15.625rem;
  --breakpoint-bp-3: 18.75rem;
  --breakpoint-bp-3\.5: 21.875rem;
  --breakpoint-bp-4: 25rem;
  --breakpoint-bp-4\.5: 28.125rem;
  --breakpoint-bp-5: 31.25rem;
  --breakpoint-bp-5\.5: 34.375rem;
  --breakpoint-bp-6: 37.5rem;
  --breakpoint-bp-6\.5: 40.625rem;
  --breakpoint-bp-7: 43.75rem;
  --breakpoint-bp-7\.5: 46.875rem;
  --breakpoint-bp-8: 50rem;
  --breakpoint-bp-8\.5: 53.125rem;
  --breakpoint-bp-9: 56.25rem;
  --breakpoint-bp-9\.5: 59.375rem;
  --breakpoint-bp-10: 62.5rem;
  --breakpoint-bp-10\.5: 65.625rem;
  --breakpoint-bp-11: 68.75rem;
  --breakpoint-bp-11\.5: 71.875rem;
  --breakpoint-bp-12: 75rem;
  --breakpoint-bp-12\.5: 78.125rem;
  --breakpoint-bp-13: 81.25rem;
  --breakpoint-bp-13\.5: 84.375rem;
  --breakpoint-bp-14: 87.5rem;
  --breakpoint-bp-14\.5: 90.625rem;
  --breakpoint-bp-15: 93.75rem;
  --breakpoint-bp-15\.5: 96.875rem;
  --breakpoint-bp-16: 100rem;
  --breakpoint-bp-16\.5: 103.125rem;
  --breakpoint-bp-17: 106.25rem;
  --breakpoint-bp-17\.5: 109.375rem;
  --breakpoint-bp-18: 112.5rem;
  --breakpoint-bp-18\.5: 115.625rem;
  --breakpoint-bp-19: 118.75rem;
  --breakpoint-bp-19\.5: 121.875rem;
  --breakpoint-bp-20: 125rem;
}
```

- [ ] **Step 2: Verify the breakpoints work**

Run: `cd site && npx tsc --noEmit`
Expected: No errors (breakpoints are CSS-only, shouldn't affect TS)

Then verify a `bp-4.5:` class compiles by temporarily adding `bp-4.5:hidden` to any element and running the dev server. If the `\.` dot escaping in `@theme` property names doesn't work, switch to dash-separated names (e.g., `--breakpoint-bp-1-5` → class `bp-1-5:`) and update all references in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
git add site/src/styles.css
git commit -m "feat(site): add bp-* breakpoint scale and clear Tailwind defaults"
```

---

### Task 2: Migrate Existing Semantic Breakpoint Usage to `bp-*`

Since default breakpoints are cleared, all existing `sm:`, `md:`, `lg:`, `xl:` usage will break. Migrate them to the nearest `bp-*` equivalent.

Mapping:
- `sm` (640px) → `bp-6` (600px) — closest match
- `lg` (1024px) → `bp-10` (1000px) — closest match

**Files:**
- Modify: `site/src/components/Footer.tsx`
- Modify: `site/src/routes/index.tsx`
- Modify: `site/src/routes/docs/index.tsx`

Note: Header.tsx is skipped here — Task 8 rewrites it entirely with the correct breakpoints.

- [ ] **Step 1: Migrate Footer.tsx**

Replace `sm:flex-row sm:text-left` with `bp-6:flex-row bp-6:text-left`.

- [ ] **Step 2: Migrate index.tsx (home page)**

| Old | New |
|---|---|
| `sm:px-10 sm:py-14` | `bp-6:px-10 bp-6:py-14` |
| `sm:grid-cols-2` | `bp-6:grid-cols-2` |
| `lg:grid-cols-5` | `bp-10:grid-cols-5` |

- [ ] **Step 3: Migrate docs/index.tsx**

Replace `sm:grid-cols-2` with `bp-6:grid-cols-2`.

- [ ] **Step 4: Search for any remaining semantic breakpoint usage**

Run: `grep -rn 'sm:\|md:\|lg:\|xl:\|2xl:' site/src/ --include='*.tsx' --include='*.ts'`

Expected: No matches in source files (shadcn UI components in `components/ui/` may still have them — that's fine, they use Tailwind's responsive prefix for component size variants like `sm` button size, not breakpoints).

Note: `button.tsx` has `sm:` and `lg:` in its `size` variant definitions — these are component size variants (not responsive breakpoints), so they should NOT be migrated.

- [ ] **Step 5: Commit**

```bash
git add site/src/components/Footer.tsx site/src/routes/index.tsx site/src/routes/docs/index.tsx
git commit -m "refactor(site): migrate semantic breakpoints to bp-* scale"
```

---

### Task 3: Rename Sidebar to DocsNav (Pure Navigation)

**Files:**
- Create: `site/src/components/DocsNav.tsx` (from `Sidebar.tsx`)
- Delete: `site/src/components/Sidebar.tsx`

- [ ] **Step 1: Copy Sidebar.tsx to DocsNav.tsx and strip layout styles**

Create `DocsNav.tsx` with:
- Rename the default export from `Sidebar` to `DocsNav`
- Rename exported types: `SidebarEntry` → `DocsNavEntry`, `ApiSidebarEntry` → `ApiDocsNavEntry`
- Remove the outer `<nav className="w-56 shrink-0 pr-6">` wrapper — replace with `<nav aria-label="Documentation navigation">`
- Remove the `<div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">` wrapper — content renders flat
- All inner navigation markup stays the same

```tsx
import { Link, useLocation } from "@tanstack/react-router";
import type { DocFrontmatter } from "#/lib/markdoc";

export interface DocsNavEntry {
  slug: string;
  frontmatter: DocFrontmatter;
}

export interface ApiDocsNavEntry {
  name: string;
  kind: string;
}

const kindOrder: Record<string, number> = {
  component: 0,
  hook: 1,
  interface: 2,
  function: 3,
  context: 4,
  const: 5,
};

const kindLabels: Record<string, string> = {
  component: "Components",
  hook: "Hooks",
  interface: "Types",
  function: "Functions",
  context: "Contexts",
  const: "Constants",
};

export default function DocsNav({
  entries,
  apiEntries,
}: {
  entries: DocsNavEntry[];
  apiEntries: ApiDocsNavEntry[];
}) {
  const location = useLocation();

  const grouped = new Map<string, DocsNavEntry[]>();
  for (const entry of entries) {
    const section = entry.frontmatter.section || "General";
    if (!grouped.has(section)) {
      grouped.set(section, []);
    }
    grouped.get(section)!.push(entry);
  }

  for (const entries of grouped.values()) {
    entries.sort((a, b) => a.frontmatter.order - b.frontmatter.order);
  }

  const apiGrouped = new Map<string, ApiDocsNavEntry[]>();
  for (const entry of apiEntries) {
    const kind = entry.kind;
    if (!apiGrouped.has(kind)) {
      apiGrouped.set(kind, []);
    }
    apiGrouped.get(kind)!.push(entry);
  }

  const sortedApiKinds = [...apiGrouped.keys()].sort(
    (a, b) => (kindOrder[a] ?? 99) - (kindOrder[b] ?? 99),
  );

  return (
    <nav aria-label="Documentation navigation">
      {Array.from(grouped.entries()).map(([section, entries]) => (
        <div key={section} className="mb-5">
          <h4 className="mb-2 type-label-100 text-muted-foreground">
            {section}
          </h4>
          <ul className="m-0 list-none space-y-0.5 p-0">
            {entries.map((entry) => {
              const path = `/docs/${entry.slug}`;
              const isActive = location.pathname === path;
              return (
                <li key={entry.slug}>
                  <Link
                    to={path}
                    aria-current={isActive ? "page" : undefined}
                    className={`block rounded-lg px-3 py-1.5 type-body-100 no-underline transition ${
                      isActive
                        ? "bg-accent font-semibold text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    {entry.frontmatter.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {sortedApiKinds.map((kind) => {
        const items = apiGrouped.get(kind)!;
        return (
          <div key={kind} className="mb-5">
            <h4 className="mb-2 type-label-100 text-muted-foreground">
              {kindLabels[kind] ?? kind}
            </h4>
            <ul className="m-0 list-none space-y-0.5 p-0">
              {items.map((item) => {
                const path = `/docs/api/${item.name}`;
                const isActive = location.pathname === path;
                return (
                  <li key={item.name}>
                    <Link
                      to="/docs/api/$symbol"
                      params={{ symbol: item.name }}
                      aria-current={isActive ? "page" : undefined}
                      className={`block rounded-lg px-3 py-1.5 type-code-100 no-underline transition ${
                        isActive
                          ? "bg-accent font-semibold text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                    >
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Delete `Sidebar.tsx`**

```bash
rm site/src/components/Sidebar.tsx
```

- [ ] **Step 3: Commit**

```bash
git add site/src/components/DocsNav.tsx site/src/components/Sidebar.tsx
git commit -m "refactor(site): rename Sidebar to DocsNav, strip layout styles"
```

---

### Task 4: Create DocsNavSidebar Wrapper

**Files:**
- Create: `site/src/components/DocsNavSidebar.tsx`
- Modify: `site/src/routes/docs.tsx` (update import)

- [ ] **Step 1: Create DocsNavSidebar.tsx**

```tsx
import DocsNav, { type DocsNavEntry, type ApiDocsNavEntry } from "./DocsNav";

export default function DocsNavSidebar({
  entries,
  apiEntries,
}: {
  entries: DocsNavEntry[];
  apiEntries: ApiDocsNavEntry[];
}) {
  return (
    <div className="hidden w-56 shrink-0 pr-6 bp-6:block">
      <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
        <DocsNav entries={entries} apiEntries={apiEntries} />
      </div>
    </div>
  );
}
```

Note: `hidden bp-6:block` makes it hidden below 600px, visible at 600px+. This handles the responsive sidebar visibility.

- [ ] **Step 2: Update docs.tsx to use DocsNavSidebar**

Replace the `Sidebar` import and usage:

```tsx
import DocsNavSidebar from "#/components/DocsNavSidebar";
import type { DocsNavEntry, ApiDocsNavEntry } from "#/components/DocsNav";
```

Update the type references in the server function from `SidebarEntry` / `ApiSidebarEntry` to `DocsNavEntry` / `ApiDocsNavEntry`.

Update `DocsLayout`:

```tsx
function DocsLayout() {
  const { entries, apiEntries } = Route.useLoaderData();

  return (
    <main className="page-wrap flex gap-0 px-4 pt-8 pb-12">
      <DocsNavSidebar entries={entries} apiEntries={apiEntries} />
      <article className="max-w-none min-w-0 flex-1">
        <Outlet />
      </article>
    </main>
  );
}
```

- [ ] **Step 3: Verify the site builds**

Run: `cd site && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add site/src/components/DocsNavSidebar.tsx site/src/routes/docs.tsx
git commit -m "feat(site): add DocsNavSidebar wrapper, wire into docs layout"
```

---

### Task 5: Create NavDrawer Component

**Files:**
- Create: `site/src/components/NavDrawer.tsx`

- [ ] **Step 1: Create NavDrawer.tsx**

Base UI Dialog parts needed: `Dialog.Root`, `Dialog.Portal`, `Dialog.Backdrop`, `Dialog.Popup`.

```tsx
import { Dialog } from "@base-ui/react/dialog";
import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

export default function NavDrawer({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    return router.subscribe("onBeforeNavigate", () => {
      onOpenChange(false);
    });
  }, [open, router, onOpenChange]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          className="fixed inset-0 z-[60] bg-black/50 opacity-0 transition-opacity duration-200 ease-out data-[open]:opacity-100 data-[ending-style]:opacity-0 data-[ending-style]:duration-150 data-[ending-style]:ease-in"
        />
        <Dialog.Popup
          aria-label="Navigation"
          className="fixed inset-y-0 left-0 z-[60] w-72 -translate-x-full overflow-y-auto bg-background p-6 shadow-xl transition-transform duration-200 ease-out data-[open]:translate-x-0 data-[ending-style]:-translate-x-full data-[ending-style]:duration-150 data-[ending-style]:ease-in"
        >
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd site && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add site/src/components/NavDrawer.tsx
git commit -m "feat(site): add NavDrawer component (Base UI Dialog slide-in)"
```

---

### Task 6: Create DocsDrawerContent Component

**Files:**
- Create: `site/src/components/DocsDrawerContent.tsx`

- [ ] **Step 1: Create DocsDrawerContent.tsx**

This is the combined view for < 450px on docs pages: header nav links, separator, then DocsNav.

```tsx
import { Link } from "@tanstack/react-router";
import DocsNav, { type DocsNavEntry, type ApiDocsNavEntry } from "./DocsNav";

export default function DocsDrawerContent({
  entries,
  apiEntries,
}: {
  entries: DocsNavEntry[];
  apiEntries: ApiDocsNavEntry[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Site navigation">
        <ul className="m-0 list-none space-y-1 p-0">
          <li>
            <Link
              to="/"
              className="block rounded-lg px-3 py-2 type-body-100 font-medium no-underline text-foreground transition hover:bg-accent"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/docs"
              className="block rounded-lg px-3 py-2 type-body-100 font-medium no-underline text-foreground transition hover:bg-accent"
            >
              Docs
            </Link>
          </li>
          <li>
            <Link
              to="/demo"
              className="block rounded-lg px-3 py-2 type-body-100 font-medium no-underline text-foreground transition hover:bg-accent"
            >
              Demo
            </Link>
          </li>
          <li>
            <a
              href={import.meta.env.VITE_GITHUB_REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg px-3 py-2 type-body-100 font-medium no-underline text-foreground transition hover:bg-accent"
            >
              GitHub
            </a>
          </li>
        </ul>
      </nav>

      <hr className="border-border" />

      <DocsNav entries={entries} apiEntries={apiEntries} />
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd site && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add site/src/components/DocsDrawerContent.tsx
git commit -m "feat(site): add DocsDrawerContent for combined drawer view"
```

---

### Task 7: Create Header Drawer Content Context

The Header renders in `__root.tsx` but needs to optionally show DocsDrawerContent (which requires data from the docs route loader). Use a React context so the docs layout can provide drawer content to the header without prop drilling through the router.

**Files:**
- Create: `site/src/lib/header-drawer-context.tsx`
- Modify: `site/src/routes/__root.tsx`

- [ ] **Step 1: Create header-drawer-context.tsx**

```tsx
import { createContext, useContext, useState, type ReactNode } from "react";

const HeaderDrawerContentContext = createContext<ReactNode | null>(null);
const HeaderDrawerContentSetterContext = createContext<
  ((content: ReactNode | null) => void) | null
>(null);

export function HeaderDrawerContentProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [drawerContent, setDrawerContent] = useState<ReactNode | null>(null);
  return (
    <HeaderDrawerContentContext.Provider value={drawerContent}>
      <HeaderDrawerContentSetterContext.Provider value={setDrawerContent}>
        {children}
      </HeaderDrawerContentSetterContext.Provider>
    </HeaderDrawerContentContext.Provider>
  );
}

export function useHeaderDrawerContent() {
  return useContext(HeaderDrawerContentContext);
}

export function useSetHeaderDrawerContent() {
  const setter = useContext(HeaderDrawerContentSetterContext);
  if (!setter) {
    throw new Error(
      "useSetHeaderDrawerContent must be used within HeaderDrawerContentProvider",
    );
  }
  return setter;
}
```

- [ ] **Step 2: Wrap the root layout with the provider**

In `__root.tsx`, import `HeaderDrawerContentProvider` and wrap inside the existing providers:

```tsx
import { HeaderDrawerContentProvider } from "../lib/header-drawer-context";
```

Wrap `<Header />` and `{children}` inside `<HeaderDrawerContentProvider>`:

```tsx
<PackageManagerProvider>
  <TooltipProvider>
    <HeaderDrawerContentProvider>
      <Header />
      {children}
      <Footer />
    </HeaderDrawerContentProvider>
  </TooltipProvider>
</PackageManagerProvider>
```

- [ ] **Step 3: Verify it compiles**

Run: `cd site && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add site/src/lib/header-drawer-context.tsx site/src/routes/__root.tsx
git commit -m "feat(site): add HeaderDrawerContent context for drawer slot"
```

---

### Task 8: Make Header Responsive with Hamburger + NavDrawer

**Files:**
- Modify: `site/src/components/Header.tsx`

- [ ] **Step 1: Rewrite Header.tsx**

Add hamburger button, NavDrawer, responsive visibility classes. The hamburger is visible by default (mobile-first), hidden at `bp-4.5`. Nav menu and GitHub are hidden by default, shown at `bp-4.5`.

```tsx
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "#/components/ui/navigation-menu";
import { useHeaderDrawerContent } from "#/lib/header-drawer-context";
import NavDrawer from "./NavDrawer";
import ThemeToggle from "./ThemeToggle";

function HeaderNavLinks() {
  return (
    <nav aria-label="Site navigation">
      <ul className="m-0 list-none space-y-1 p-0">
        <li>
          <Link
            to="/"
            className="block rounded-lg px-3 py-2 type-body-100 font-medium no-underline text-foreground transition hover:bg-accent"
          >
            Home
          </Link>
        </li>
        <li>
          <Link
            to="/docs"
            className="block rounded-lg px-3 py-2 type-body-100 font-medium no-underline text-foreground transition hover:bg-accent"
          >
            Docs
          </Link>
        </li>
        <li>
          <Link
            to="/demo"
            className="block rounded-lg px-3 py-2 type-body-100 font-medium no-underline text-foreground transition hover:bg-accent"
          >
            Demo
          </Link>
        </li>
        <li>
          <a
            href={import.meta.env.VITE_GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="block rounded-lg px-3 py-2 type-body-100 font-medium no-underline text-foreground transition hover:bg-accent"
          >
            GitHub
          </a>
        </li>
      </ul>
    </nav>
  );
}

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerContent = useHeaderDrawerContent();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 px-4 backdrop-blur-lg">
      <nav className="page-wrap flex items-center gap-x-3 py-3 bp-4.5:py-4">
        {/* Hamburger — visible below bp-4.5 */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
          className="flex items-center justify-center rounded-lg p-2 text-foreground transition hover:bg-accent bp-4.5:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        <h2 className="m-0 shrink-0">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 type-body-100-bold text-foreground no-underline shadow-md bp-4.5:px-4 bp-4.5:py-2"
          >
            <span className="h-2 w-2 rounded-full bg-accent" />
            {import.meta.env.VITE_PROJECT_NAME}
          </Link>
        </h2>

        {/* Desktop nav — hidden below bp-4.5 */}
        <NavigationMenu viewport={false} className="hidden bp-4.5:flex">
          <NavigationMenuList className="gap-0.5">
            <NavigationMenuItem>
              <NavigationMenuLink
                render={<Link to="/" />}
                className={navigationMenuTriggerStyle()}
              >
                Home
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                render={<Link to="/docs" />}
                className={navigationMenuTriggerStyle()}
              >
                Docs
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                render={<Link to="/demo" />}
                className={navigationMenuTriggerStyle()}
              >
                Demo
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto flex items-center gap-1.5 bp-4.5:gap-2">
          {/* GitHub — hidden below bp-4.5 */}
          <a
            href={import.meta.env.VITE_GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-xl p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground bp-4.5:block"
          >
            <span className="sr-only">{`${import.meta.env.VITE_PROJECT_NAME} on GitHub`}</span>
            <svg viewBox="0 0 16 16" aria-hidden="true" width="24" height="24">
              <path
                fill="currentColor"
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"
              />
            </svg>
          </a>

          <ThemeToggle />
        </div>
      </nav>

      {/* Drawer for narrow screens */}
      <NavDrawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        {drawerContent ?? <HeaderNavLinks />}
      </NavDrawer>
    </header>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd site && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add site/src/components/Header.tsx
git commit -m "feat(site): make header responsive with hamburger + NavDrawer"
```

---

### Task 9: Wire DocsLayout — Sidebar Toggle + Combined Drawer

**Files:**
- Modify: `site/src/routes/docs.tsx`

- [ ] **Step 1: Update DocsLayout with sidebar toggle and drawer content provider**

The docs layout needs to:
1. Register `DocsDrawerContent` as the header's drawer content (via context)
2. Show a sidebar toggle button between 450–599px that opens its own NavDrawer

```tsx
import * as fs from "node:fs";
import * as path from "node:path";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import DocsDrawerContent from "#/components/DocsDrawerContent";
import DocsNav, {
  type DocsNavEntry,
  type ApiDocsNavEntry,
} from "#/components/DocsNav";
import DocsNavSidebar from "#/components/DocsNavSidebar";
import NavDrawer from "#/components/NavDrawer";
import { getAllSymbols } from "#/lib/api-data";
import { useSetHeaderDrawerContent } from "#/lib/header-drawer-context";
import { parseFrontmatter } from "#/lib/markdoc";

const getDocEntries = createServerFn().handler(async () => {
  try {
    const contentDir = path.resolve(process.cwd(), "content/docs");
    const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".md"));

    const entries: DocsNavEntry[] = files.map((file) => {
      const slug = file.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(contentDir, file), "utf-8");
      const { frontmatter } = parseFrontmatter(raw);
      return { slug, frontmatter };
    });

    entries.sort((a, b) => a.frontmatter.order - b.frontmatter.order);

    const apiEntries: ApiDocsNavEntry[] = getAllSymbols().map((s) => ({
      name: s.name,
      kind: s.kind,
    }));

    return { entries, apiEntries };
  } catch (error) {
    console.error("Failed to load doc entries:", error);
    return { entries: [], apiEntries: [] };
  }
});

export const Route = createFileRoute("/docs")({
  loader: () => getDocEntries(),
  component: DocsLayout,
});

function DocsLayout() {
  const { entries, apiEntries } = Route.useLoaderData();
  const setHeaderDrawerContent = useSetHeaderDrawerContent();
  const [sidebarDrawerOpen, setSidebarDrawerOpen] = useState(false);

  // Register combined drawer content for the header (< 450px)
  useEffect(() => {
    setHeaderDrawerContent(
      <DocsDrawerContent entries={entries} apiEntries={apiEntries} />,
    );
    return () => setHeaderDrawerContent(null);
  }, [entries, apiEntries, setHeaderDrawerContent]);

  return (
    <main className="page-wrap flex gap-0 px-4 pt-8 pb-12">
      <DocsNavSidebar entries={entries} apiEntries={apiEntries} />

      <div className="min-w-0 flex-1">
        {/* Sidebar toggle — visible between bp-4.5 and bp-6 only */}
        <button
          type="button"
          onClick={() => setSidebarDrawerOpen(true)}
          className="mb-4 hidden items-center gap-2 rounded-lg border border-border px-3 py-2 type-body-100 text-muted-foreground transition hover:bg-accent hover:text-foreground bp-4.5:flex bp-6:hidden"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Navigation
        </button>

        <article className="max-w-none">
          <Outlet />
        </article>
      </div>

      {/* Sidebar drawer for mid-range (450-599px) */}
      <NavDrawer open={sidebarDrawerOpen} onOpenChange={setSidebarDrawerOpen}>
        <DocsNav entries={entries} apiEntries={apiEntries} />
      </NavDrawer>
    </main>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd site && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add site/src/routes/docs.tsx
git commit -m "feat(site): wire docs layout with sidebar toggle and combined drawer"
```

---

### Task 10: Manual Smoke Test

**Files:** None (verification only)

- [ ] **Step 1: Start the dev server**

Run: `cd site && npm run dev`

- [ ] **Step 2: Test at ≥ 600px**

Open docs page. Verify:
- Full header with all nav links, GitHub icon, theme toggle
- Sidebar visible inline on the left
- No hamburger button, no sidebar toggle

- [ ] **Step 3: Test at 450–599px**

Resize browser window. Verify:
- Full header (no hamburger)
- Sidebar hidden, "Navigation" toggle button visible above content
- Clicking toggle opens slide-in drawer with DocsNav
- Drawer closes on: backdrop click, Escape, clicking a nav link
- On home page: no toggle button visible

- [ ] **Step 4: Test at < 450px**

Resize further. Verify:
- Hamburger button visible, nav links and GitHub hidden
- Theme toggle still visible
- On docs page: hamburger opens drawer with nav links + separator + docs nav
- On home page: hamburger opens drawer with nav links only
- Drawer closes on: backdrop click, Escape, clicking a nav link

- [ ] **Step 5: Test accessibility**

- Tab through the hamburger button and drawer content
- Verify focus is trapped inside the drawer when open
- Verify Escape closes the drawer
- Check that `aria-label` attributes are present on buttons and drawer
