# Replit.md

## Overview

This is a full-stack TypeScript web application built with React on the frontend and Express on the backend. The current state of the app is essentially a starter/template that displays a custom `DatePicker` component on the home page. It uses a monorepo-style structure with `client/`, `server/`, and `shared/` directories.

The app is set up with PostgreSQL via Drizzle ORM, though the current storage layer defaults to an in-memory implementation (`MemStorage`). The schema defines a basic `users` table, and the backend has no active API routes yet — it's a clean slate ready for feature development.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Directory Structure

- `client/` — React frontend (Vite-powered)
  - `src/pages/` — Page components (`home.tsx`, `not-found.tsx`)
  - `src/components/ui/` — Full shadcn/ui component library
  - `src/hooks/` — Custom hooks (`use-mobile`, `use-toast`)
  - `src/lib/` — Utilities and query client setup
- `server/` — Express backend
  - `index.ts` — App entry point
  - `routes.ts` — Route registration (currently empty)
  - `storage.ts` — Storage abstraction (currently `MemStorage`)
  - `vite.ts` — Vite dev server middleware integration
  - `static.ts` — Static file serving for production
- `shared/` — Code shared between frontend and backend
  - `schema.ts` — Drizzle ORM schema + Zod validation types
- `script/build.ts` — Custom build script using esbuild + Vite
- `migrations/` — Drizzle migration output directory

### Frontend Architecture

- **Framework**: React 18 with TypeScript
- **Routing**: `wouter` (lightweight client-side router)
- **Data Fetching**: TanStack Query (React Query) v5 with a custom `apiRequest` helper and `getQueryFn` factory
- **Forms**: React Hook Form with `@hookform/resolvers` and Zod validation
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **UI Components**: Subset of shadcn/ui (New York style) — only `button`, `card`, `date-picker`, `dialog`, `input`, `label`, `separator`, `sheet`, `skeleton`, `toast`, `toaster`, `toggle`, `tooltip`
- **Build Tool**: Vite with Replit-specific plugins (runtime error overlay, cartographer, dev banner)

The `queryClient.ts` sets up a global QueryClient with `staleTime: Infinity` and no automatic refetching, meaning data is only fetched on demand. The `apiRequest` helper sends JSON requests with credentials included (for session cookies).

### Backend Architecture

- **Framework**: Express 5 with TypeScript
- **Entry Point**: `server/index.ts` creates an HTTP server and registers routes
- **Routes**: All API routes should be prefixed with `/api` and registered in `server/routes.ts`
- **Storage Pattern**: An `IStorage` interface abstracts data access. Currently uses `MemStorage` (in-memory Map). Can be swapped for a Drizzle/PostgreSQL implementation.
- **Dev Mode**: Vite middleware is integrated into Express for hot module replacement during development
- **Production Mode**: Express serves the pre-built static files from `dist/public/`
- **Build**: Custom `script/build.ts` runs Vite for the client and esbuild for the server, bundling common server deps for faster cold starts

### Data Storage

- **ORM**: Drizzle ORM configured for PostgreSQL (`drizzle.config.ts`)
- **Schema**: Defined in `shared/schema.ts` — currently only a `users` table with `id` (UUID), `username`, and `password`
- **Validation**: `drizzle-zod` auto-generates Zod schemas from Drizzle table definitions
- **Current Storage**: `MemStorage` (in-memory) — no DB connection required to run locally without `DATABASE_URL`
- **Migration**: `drizzle-kit push` command syncs schema to the database

To switch from in-memory to PostgreSQL storage, implement the `IStorage` interface using Drizzle queries and replace the `storage` export in `server/storage.ts`.

### Authentication

No authentication is implemented yet. The schema and storage interface include `getUser`, `getUserByUsername`, and `createUser` methods, suggesting session-based auth is planned. Dependencies for `passport`, `passport-local`, `express-session`, and `connect-pg-simple` are present in the build allowlist, meaning auth scaffolding can be added.

### Custom Components

- **DatePicker** (`client/src/components/ui/date-picker.tsx`) — A **headless** (zero-styling) compound component built with base-ui internals (`useRender` from `@base-ui/react/use-render`, `mergeProps` from `@base-ui/react/merge-props`). **Internal state uses a discriminated union `DateValueObject`** — a tagged object `{ format: '...', value: ... }` where the `format` tag enforces the correct `value` type at compile time (e.g., `{ format: 'ZonedDateTime', value: Temporal.ZonedDateTime }`). Supported formats: `"PlainDate"`, `"PlainDateTime"`, `"PlainMonthDay"`, `"PlainTime"`, `"PlainYearMonth"`, `"ZonedDateTime"`, `"object"` (PlainDateObject), `"Date"` (native JS Date). Root is **generic** on `F extends ValueFormat`: `value`, `defaultValue`, and `onValueChange` are all constrained to `ValueForFormat<F>`, ensuring all value-related props match the same format. Root also accepts an optional `format` prop as a runtime fallback when no value/defaultValue is provided yet. Helper type `ValueForFormat<F>` narrows the union: `ValueForFormat<"ZonedDateTime">` = `{ format: "ZonedDateTime"; value: Temporal.ZonedDateTime }`. Sub-components: `DatePicker.Root`, `DatePicker.MonthGrid`, `DatePicker.Week`, `DatePicker.Day`, `DatePicker.DayLabels`, `DatePicker.DayLabel`, `DatePicker.DateString`, `DatePicker.TimeString`, `DatePicker.MonthString`, `DatePicker.PrevMonthButton`, `DatePicker.NextMonthButton`. Header primitives: `MonthString` (formatted month/year display), `DateString` (accepts `locales` + `Intl.DateTimeFormatOptions`), `TimeString` (accepts `locales` + `Intl.DateTimeFormatOptions`), `PrevMonthButton`, `NextMonthButton`. Root accepts `timeZone` (defaults to system timezone), `locale` (defaults to `"en-US"`). When selecting a day, time is preserved from the previous selection. Each sub-component supports the base-ui `render` prop and exposes internal state via `data-` attributes (e.g., `data-selected`, `data-today`, `data-disabled`, `data-outside-month`, `data-focused` on Day). MonthGrid supports a **template-based children API**: pass `<DayLabels>` (containing a single `<DayLabel>` template), `<Week>`, and `<Day>` as templates. `DayLabels` clones its child 7 times. `DayLabel` state exposes `long`, `short`, `narrow` (via `Temporal.PlainDate.toLocaleString()` with Root locale) and `dayOfWeek`. Day renders as `<button>` by default. Uses `@js-temporal/polyfill` for all date math. Includes controlled/uncontrolled usage, keyboard navigation, full ARIA accessibility. Also exports `useDatePicker` hook. **Factory function `createDatePicker(format)`** returns a `TypedDatePicker<F>` — a compound component object with `Root` pre-typed to the given format so consumers don't need generics or format props (e.g., `const ZonedDatePicker = createDatePicker("ZonedDateTime")`). Uses `createElement` internally to avoid JSX generic syntax issues with Replit's vite plugin.
- **StyledDatePicker** (`client/src/components/styled-date-picker.tsx`) — A styled composition of the headless DatePicker primitives using shadcn/tailwind design tokens. Accepts a `components` prop of type `DatePickerTyped<F>` (produced by `createDatePicker`), making it generic over the date format. Uses MonthGrid's **template-based children API**: `<DayLabels>` wrapping a single `<DayLabel>`, plus a `<Week>` containing a single `<Day>` are passed as templates. MonthGrid and DayLabels clone them automatically. No `useDatePicker()` hook needed — pure declarative composition. Includes conditional classes for selected/today/disabled/outside-month/focused states and Lucide icons for navigation arrows.

### Theming

CSS custom properties define the color palette in `client/src/index.css`. Light mode is defined on `:root`. Dark mode uses a `.dark` class selector. Colors include `background`, `foreground`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `card`, `popover`, `sidebar`, and chart colors.

## External Dependencies

### UI Libraries
- **Radix UI** — Headless accessible primitives for all interactive components
- **shadcn/ui** — Pre-built component wrappers around Radix UI (New York style variant)
- **Lucide React** — Icon library
- **Tailwind CSS** — Utility-first CSS framework
- **class-variance-authority (CVA)** — Variant-based class management
- **clsx + tailwind-merge** — Class name composition utilities
- **Embla Carousel** — Carousel component
- **Vaul** — Drawer component
- **cmdk** — Command palette component
- **react-day-picker** — Used by the Calendar component
- **Recharts** — Chart components

### Headless UI / Primitives
- **@base-ui/react** — Base UI headless component library (useRender hook, mergeProps utility)
- **@js-temporal/polyfill** — Temporal API polyfill for date/time handling (replaces date-fns in DatePicker)

### Data & Forms
- **TanStack Query v5** — Server state management and caching
- **React Hook Form** — Form state management
- **Zod** — Schema validation
- **date-fns** — Date utility functions

### Backend / Infrastructure
- **Express 5** — HTTP server framework
- **Drizzle ORM** — TypeScript-first SQL ORM
- **`pg`** — PostgreSQL client (Node.js)
- **`drizzle-kit`** — CLI for schema migrations
- **`drizzle-zod`** — Auto-generates Zod schemas from Drizzle tables
- **`nanoid`** — URL-safe unique ID generation
- **`connect-pg-simple`** — PostgreSQL session store (for when sessions are added)
- **`memorystore`** — In-memory session store alternative

### Build Tools
- **Vite** — Frontend bundler and dev server
- **esbuild** — Server bundler for production
- **tsx** — TypeScript execution for development
- **Replit Vite plugins** — `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner`

### Environment Variables
- `DATABASE_URL` — Required for PostgreSQL connection (Drizzle config will throw if missing at build time)
- `NODE_ENV` — Controls dev vs. production behavior
- `REPL_ID` — Detected to enable Replit-specific Vite plugins