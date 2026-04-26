# Architecture

## Overview

Smart Session Planner is a monorepo (Bun workspaces) with two apps:

- **`apps/mobile`** — Expo (React Native, TypeScript) client
- **`apps/api`** — Next.js 16 App Router backend API

```
meagain/
  apps/
    mobile/    Expo ~54, Expo Router 6, React 19, TanStack Query v5, Uniwind
    api/       Next.js 16.2.4, Drizzle ORM 0.36 + better-sqlite3, Zod 4.3.6
  plans/       Design decisions and implementation plan
  project-designs/  Pencil (.pen) screen designs
```

---

## API

### Data Model

Three entities in SQLite via Drizzle ORM (`apps/api/db/schema.ts`). The DB lives at `apps/api/dev.db` and is accessed through `better-sqlite3`. A single client is initialized in `apps/api/db/index.ts` and reused across requests via `globalThis` to survive Next.js dev hot-reloads.

**SessionType** — defines a kind of session (e.g., "Deep Work", "Workout"). Fields: `name`, `category`, `priority` (1–5), `color`, `icon`.

**Session** — a scheduled or completed instance of a session type. Fields: `sessionTypeId`, `date` (ISO `YYYY-MM-DD`), `startTime` (HH:MM), `duration` (minutes), `status` (`scheduled` | `completed` | `skipped` | `cancelled`), `notes`. `skipped` is distinct from `cancelled`: it counts toward the rate denominator for completion stats, while `cancelled` is excluded.

**Availability** — weekly recurring time windows. One row per day of week, with `startTime`, `endTime`, and an `enabled` toggle. Stored as HH:MM strings to avoid timezone complexity.

Migrations are generated and applied via `drizzle-kit` (`bun run --cwd apps/api db:generate` / `db:migrate`). The seed script is `apps/api/scripts/seed.ts`.

### Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/session-types` | List / create session types |
| PUT/DELETE | `/api/session-types/[id]` | Update / delete |
| GET/PUT | `/api/availability` | Get or replace all 7 availability windows |
| GET/POST | `/api/sessions` | List (filterable) / create sessions |
| PUT/DELETE | `/api/sessions/[id]` | Update (mark complete/skipped, etc.) / delete |
| GET | `/api/suggestions` | Smart time-slot suggestions |
| GET | `/api/progress` | Aggregate stats (counts, completion rate, avg spacing, streaks) |
| GET/POST | `/api/dev/seed` | Demo personas — `GET` lists, `POST {persona}` wipes and reseeds |

All responses are JSON. POST/PUT bodies are validated with Zod. Errors return `{error: string}` with appropriate HTTP status. Conflicts return `409 {error, conflicts: [...]}` so the client can prompt to override with `force: true`.

### Suggestion Algorithm

A greedy, score-based heuristic in `apps/api/lib/suggestions.ts`. Iterates over each day in the next 14 days, finds available time slots that don't conflict with existing non-cancelled, non-skipped sessions, and scores them on four factors:

1. **Priority** — higher-priority session types score higher
2. **Spacing** — more days between the last completion and the proposed slot = higher score (capped at 50)
3. **Load penalty** — days with many sessions already score lower
4. **Cluster penalty** — scheduling a second high-priority (≥4) session on an already-loaded day is penalized harder

Returns the top N candidates, deduplicated to one slot per type per day. Each suggestion includes a human-readable `reason` string. Importantly, the reason text uses **days-since-today**, not days-since-the-suggestion-slot — so a "1 day ago" type with a 10-day-out slot reads correctly to the user even though the slot's spacing score uses the larger gap.

This is intentionally simple and fully explainable — no ML, no global optimization.

---

## Mobile Client

### Navigation

Expo Router 6 file-based routing:

```
(tabs)/             Tab navigator — Home, Stats, Settings
new-session         Modal — create a session
new-session-type    Modal — create/edit a session type
availability        Modal — weekly availability editor
suggestions         Screen — full suggestion list
profile             Screen — appearance picker, dev personas, about
```

The header bell on the dashboard opens a `NotificationsSheet` modal listing past-due scheduled sessions (with quick mark-complete / skip buttons) and the top suggestion. Long-press on a session card or a suggestion preview opens a shared `ActionSheet` with contextual options (mark complete / skipped / reset / delete; accept / adjust).

### Data Layer

TanStack Query v5 manages all server state. A single `QueryClient` lives at the root layout. The hook layer is centralized in `apps/mobile/hooks/use-api.ts` — one hook per query/mutation, with shared `queryKeys` for cache invalidation. The API base URL is injected via `EXPO_PUBLIC_API_URL`.

### Styling

Uniwind (Tailwind v4 for React Native) drives styling via `className`. Theme tokens are defined in `apps/mobile/global.css` under `@layer theme :root` with `light` and `dark` variants — both define the same set of CSS variables (`--color-background`, `--color-foreground`, `--color-primary`, etc.), so screens stay theme-agnostic.

Design language: warm off-white background (`#FAF8F5`), navy primary (`#1E3A5F`), lavender for suggestion cards (`#EDE8FF`), light-weight headings.

### Appearance (Light / Dark / System)

`apps/mobile/hooks/use-theme-preference.ts` persists the choice to AsyncStorage and applies it via `Uniwind.setTheme(...)` (which also calls `Appearance.setColorScheme` so iOS / Android system dialogs match). `loadInitialThemePreference()` is invoked at module scope in `_layout.tsx` so the saved theme applies before first render. The picker lives in `/profile` under the **Appearance** section.

---

## Key Decisions

**Drizzle over Prisma** — Drizzle's lightweight, type-safe SQL builder runs synchronously on `better-sqlite3`, which keeps the API server simple, removes a separate query engine binary, and fits the local-only SQLite use case better than Prisma's runtime.

**SQLite over Postgres** — zero-setup for local dev and evaluation. The Drizzle schema is portable; switching to Postgres mainly requires changing the dialect and connection.

**HH:MM strings for time** — avoids timezone serialization issues in SQLite. All time comparisons are string-based (lexicographic, safe for HH:MM format).

**`skipped` separate from `cancelled`** — a skipped session was scheduled and missed (counts against your completion rate); a cancelled session was called off ahead of time (excluded from the denominator). Without this split, a "Skipper" demo persona looked indistinguishable from a "perfect completion" persona.

**Greedy suggestion algorithm** — O(days × types × slots) instead of a constraint solver. Fast, deterministic, easy to explain. Trade-off: it doesn't find the globally optimal schedule, but for typical user data (< 50 sessions, < 10 types, 14-day window) it produces sensible results.

**TanStack Query over local state** — server state is the source of truth. Quick toggles (mark complete / skipped / reset) optimistically refetch via shared `queryKeys`.

**Expo Router over React Navigation primitives** — file-based routing reduces boilerplate and makes the navigation structure immediately legible from the file tree.

**Uniwind over StyleSheet / NativeWind** — `className` in JSX with full Tailwind v4 syntax, runtime theme switching, and CSS variables that work without `dark:` prefixes. Avoids the dual `style` / `className` mental load of NativeWind.

**Dev personas endpoint** — `POST /api/dev/seed` with one of `default | empty | power-user | beginner | skipper` lets the reviewer (or the take-home interviewer) flip between scenarios in seconds without touching the database directly. Surfaced in the mobile app under Profile → Developer.
