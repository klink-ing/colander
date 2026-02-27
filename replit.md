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

- **DatePicker** (`client/src/components/ui/date-picker.tsx`) — A **headless** (zero-styling) compound component built with base-ui internals (`useRender` from `@base-ui/react/use-render`, `mergeProps` from `@base-ui/react/merge-props`). **Internal state uses a discriminated union `DateValueObject`** — a tagged object `{ format: "...", value: ... }` used only internally. Consumers pass **separate `format` and `value` props** with raw Temporal values: `<Root format="ZonedDateTime" value={zdt} onValueChange={(v) => ...}>` where `v` is the raw `Temporal.ZonedDateTime`. The `createDatePicker(format, options?)` factory returns a `TypedDatePicker<F>` where Root's `format` prop is **stripped** — format is locked by the factory and cannot be overridden: `const DP = createDatePicker("ZonedDateTime"); <DP.Root value={zdt} />`. Helper types: `RawValueForFormat<F>` extracts the raw value type (e.g., `RawValueForFormat<"ZonedDateTime">` = `Temporal.ZonedDateTime`), `ValueForFormat<F>` narrows the tagged union (internal use). Supported formats: `"PlainDate"`, `"PlainDateTime"`, `"PlainMonthDay"`, `"PlainTime"`, `"PlainYearMonth"`, `"ZonedDateTime"`, `"object"` (PlainDateObject), `"Date"` (native JS Date). Sub-components: `Root`, `MonthGrid`, `Week`, `Day`, `DayLabels`, `DayLabel`, `DateString`, `TimeString`, `MonthString`, `PrevMonthButton`, `NextMonthButton`. Root accepts `timeZone` (defaults to system), `locale` (defaults to `"en-US"`). Each sub-component supports the base-ui `render` prop and exposes state via `data-` attributes. `Temporal` is resolved at factory time (user-provided > `globalThis.Temporal` > throw). The `_resolvedTemporal` prop is private/internal.
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