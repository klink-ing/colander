# Replit.md

## Overview

This project is a full-stack TypeScript web application, serving as a starter template with a React frontend and an Express backend. It utilizes a monorepo structure with dedicated directories for client, server, and shared code. The application currently features a custom `DatePicker` component on the home page and is set up for PostgreSQL integration via Drizzle ORM, though it defaults to an in-memory storage solution for development ease. The backend is designed as a clean slate, ready for API development.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application is structured as a monorepo with `client/` for the React frontend, `server/` for the Express backend, and `shared/` for common code like Drizzle ORM schemas and Zod validation types.

### Frontend Architecture

- **Framework**: React 19 with TypeScript.
- **Routing**: Lightweight `wouter` for client-side navigation.
- **Data Fetching**: TanStack Query v5 configured with `staleTime: Infinity` and custom `apiRequest` for JSON requests with credentials.
- **Forms**: React Hook Form with Zod for validation.
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode).
- **UI Components**: A subset of `shadcn/ui` (New York style) for common elements, integrated with Radix UI for accessibility primitives.
- **Build Tool**: Vite, enhanced with Replit-specific plugins for development.
- **Custom `DatePicker` Component**: A headless, highly modular `DatePicker` built with `@base-ui/react` primitives and `Temporal` API polyfill. It features W3C APG conformance, sophisticated keyboard navigation, and flexible rendering options via styled wrappers or render props, supporting various Temporal formats. All components and hooks are generic over `F extends ValueFormat`, with `useDatePicker<F>()` narrowing `rootState` to `RootState<F>`. The factory `createDatePicker<F>()` returns `CreateDatePickerReturn<F>`, which uses `typeof` references to the actual generic component functions (only `Root` is manually typed as a closure). Consumers can index into this type (e.g. `CreateDatePickerReturn<"PlainDate">["Grid"]`). JSX generic syntax (`<Component<F>`) is avoided in favor of variable aliases (`const Instance = Component<F>`) for Vite Babel compatibility. Styled wrappers use CSS Grid + subgrid on table elements (replacing native table layout) via Tailwind classes. CSS variables `--calendar-days-per-week` and `--calendar-weeks-in-month` (plus matching `data-` attributes) are set on the Grid element for styling hooks. A horizontal/transposed variant (`StyledDatePickerHorizontal`) uses `grid-rows-[repeat(var(--calendar-days-per-week),1fr)] grid-flow-col` to render weekdays as rows — CSS-only, no DOM or keyboard navigation changes. Navigation utilities (`computeAdjacentMonth`, `focusedDateForMonth`) are extracted into `utils.ts` for testability; `utils.test.ts` covers month navigation, focus management, and grid structure. Convention: add a unit test for every bug fix.
  - **Date Range Selection**: `selectionMode` prop on Root forms a discriminated union with `"single"` (default) and `"range"`. In range mode, `value`/`defaultValue`/`onValueChange` operate on `DateRange<F>` (`{ start, end }`) instead of single values. Every click commits immediately (no two-click pending model): clicking outside an existing range extends the nearest boundary; clicking inside (inclusive of endpoints) resets to a single-day range (`start === end`); initial click with no range creates a single-day range. Day buttons emit `data-range-start`, `data-range-end`, `data-in-range` attributes and have a deterministic `id` attribute (`day-YYYY-MM-DD`). `StyledDayButton` renders range endpoints with `rounded-full` filled circle styling. The `SelectedRange` headless component renders a `<td>` that spans the range columns in each week row using CSS grid placement, with `data-extends-before`/`data-extends-after` for styling multi-week ranges. Its state includes `startDayId`/`endDayId` exposing the IDs of the DayButton elements at the range boundaries within each week — useful for CSS anchor positioning. Day cells get explicit `gridColumn`/`gridRow` inline styles when rendered as templates (within `WeekTemplate`) to prevent SelectedRange from disrupting CSS grid auto-placement. Utility functions `isInRange` (exclusive) and `computeWeekRangeInfo` are tested in `utils.test.ts`.
  - **Drag Handles**: `RangeStartDragHandle` and `RangeEndDragHandle` headless components (`drag-handle.tsx`) allow users to drag-resize a range selection. Placed inside `DayCellTemplate` as siblings to `DayButton`, they only display when the cell is the range boundary. They use pointer capture for reliable cross-element tracking, cache day button bounding rects on `pointerdown` (scoped to the closest `[role="grid"]` ancestor), and find the closest day center on `pointermove` to determine the new boundary. `pointercancel` and `lostpointercapture` events handle interrupted drags. A `setRange(start, end)` method on the context enables direct range updates, bypassing click logic. The `DragHandleState` includes `active`, `dragging`, and `edge` fields. Styled variants use a `::before` pseudo-element for the visual pill indicator with padding for a larger hit area.
  - **Anchor-Positioned Example** (`client/src/components/anchor-date-picker.tsx`): Demonstrates CSS anchor positioning (Chrome 125+) for range highlighting. DayButton render props set `anchor-name` CSS property from the button's `id`; SelectedRange render prop uses `anchor()` CSS functions to position itself between the start and end day buttons. Week rows need `position: relative` as containing blocks.

### Backend Architecture

- **Framework**: Express 5 with TypeScript.
- **Entry Point**: `server/index.ts` handles server initialization and route registration.
- **API Routes**: All API routes are prefixed with `/api` and defined in `server/routes.ts`.
- **Storage**: An `IStorage` interface abstracts data access, defaulting to `MemStorage` (in-memory) but designed for easy integration with Drizzle/PostgreSQL.
- **Development**: Vite middleware is integrated for HMR.
- **Production**: Serves pre-built static files from `dist/public/`.
- **Build**: Custom build script uses Vite for the client and esbuild for the server.

### Data Storage

- **ORM**: Drizzle ORM with PostgreSQL (`pg` driver).
- **Schema**: Defined in `shared/schema.ts`, including a `users` table.
- **Validation**: `drizzle-zod` for generating Zod schemas from Drizzle.
- **Migration**: `drizzle-kit` for schema synchronization.
- **Authentication**: While no authentication is currently implemented, the schema and storage interface include methods (`getUser`, `createUser`) anticipating session-based authentication using `express-session` and `connect-pg-simple`.

### Theming

CSS custom properties in `client/src/index.css` define the application's color palette, supporting light and dark modes through a `.dark` class selector.

## External Dependencies

### UI/Styling

- **Radix UI**: Headless accessible component primitives.
- **shadcn/ui**: Pre-built components based on Radix UI.
- **Lucide React**: Icon library.
- **Tailwind CSS**: Utility-first CSS framework.
- **class-variance-authority (CVA)**: For variant-based class management.
- **clsx**, **tailwind-merge**: Utilities for class name composition.
- **Embla Carousel**: Carousel component.
- **Vaul**: Drawer component.
- **cmdk**: Command palette component.
- **react-day-picker**: Used for calendar components.
- **Recharts**: Charting library.

### Headless UI / Primitives

- **@base-ui/react**: Core headless component library.
- **@js-temporal/polyfill**: Temporal API polyfill for advanced date/time handling.

### Data & Forms

- **TanStack Query v5**: Server state management.
- **React Hook Form**: Form state management.
- **Zod**: Schema validation.

### Backend / Database

- **Express 5**: Backend web framework.
- **Drizzle ORM**: TypeScript ORM for SQL databases.
- **pg**: PostgreSQL client for Node.js.
- **drizzle-kit**: CLI for Drizzle schema migrations.
- **drizzle-zod**: Zod schema generation from Drizzle.
- **nanoid**: For unique ID generation.
- **connect-pg-simple**: PostgreSQL session store (for future authentication).
- **memorystore**: In-memory session store.

### Build Tools

- **Vite**: Frontend bundler and dev server.
- **esbuild**: Server-side bundler.
- **tsx**: TypeScript execution in development.
- **Replit Vite plugins**: Specific plugins for Replit environment (`@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner`).

### Linting & Formatting

- **Biome** (`@biomejs/biome`, devDependency): Used for linting only (formatting disabled in `biome.json`). Run with `npx biome lint .` or `npx biome lint --fix .` for auto-fixes. CSS linting is disabled to avoid false positives with Tailwind directives. Config at `biome.json`.
- **Prettier** (devDependency): Used for formatting. Config at `.prettierrc`. Includes `prettier-plugin-tailwindcss` for automatic Tailwind class sorting.
