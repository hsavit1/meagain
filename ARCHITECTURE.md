# Architecture

## Overview

Smart Session Planner is a monorepo (Bun workspaces) with two apps:

- **`apps/mobile`** — Expo (React Native, TypeScript) client
- **`apps/api`** — Next.js 16 App Router backend API

```
meagain/
  apps/
    mobile/    Expo ~54, Expo Router 6, React 19, TanStack Query v5
    api/       Next.js 16.2.4, Prisma 7.8.0, SQLite, Zod 4.3.6
  plans/       Design decisions and implementation plan
  project-designs/  Pencil (.pen) screen designs
```

---

## API

### Data Model

Three entities in SQLite via Prisma:

**SessionType** — defines a kind of session (e.g., "Deep Work", "Workout"). Fields: `name`, `category`, `priority` (1–5), `color`, `icon`.

**Session** — a scheduled or completed instance of a session type. Fields: `sessionTypeId`, `date` (ISO string), `startTime` (HH:MM), `duration` (minutes), `status` (scheduled | completed | cancelled), `notes`.

**Availability** — weekly recurring time windows. One row per day of week, with `startTime`, `endTime`, and an `enabled` toggle. Stored as HH:MM strings to avoid timezone complexity.

### Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/session-types` | List / create session types |
| PUT/DELETE | `/api/session-types/[id]` | Update / delete |
| GET/PUT | `/api/availability` | Get or replace all 7 availability windows |
| GET/POST | `/api/sessions` | List (filterable) / create sessions |
| PUT/DELETE | `/api/sessions/[id]` | Update (mark complete, etc.) / delete |
| GET | `/api/suggestions` | Smart time slot suggestions |
| GET | `/api/progress` | Aggregate stats |

All responses are JSON. POST/PUT bodies are validated with Zod. Errors return `{error: string}` with appropriate HTTP status.

### Suggestion Algorithm

A greedy, score-based heuristic. Iterates over each day in the next 14 days, finds available time slots that don't conflict with existing sessions, and scores them on four factors:

1. **Priority** — higher-priority session types score higher
2. **Spacing** — more days since the last session of that type = higher score
3. **Load penalty** — days with many sessions already score lower
4. **Clustering penalty** — scheduling a second high-priority session on an already-loaded day is penalized

Returns the top N candidates, deduplicated to one slot per type per day. Each suggestion includes a human-readable `reason` string explaining why it was proposed.

This is intentionally simple and fully explainable — no ML, no global optimization. The algorithm is in `apps/api/lib/suggestions.ts`.

---

## Mobile Client

### Navigation

Expo Router 6 file-based routing:

```
(tabs)/         Tab navigator — Home, Calendar, Stats, Settings
new-session     Modal — create a session
new-session-type  Modal — create/edit a session type  
availability    Modal — weekly availability editor
suggestions     Screen — full suggestion list
```

### Data Layer

TanStack Query v5 manages all server state. A single `QueryClient` lives at the root layout. Custom hooks (`hooks/use-sessions.ts`, etc.) encapsulate query keys and fetch logic. The API base URL is injected via `EXPO_PUBLIC_API_URL`.

### Styling

No CSS-in-JS framework. React Native `StyleSheet` + a `constants/theme.ts` token file. Dark mode via `useColorScheme()`.

Design language: warm off-white background (`#FAF8F5`), navy primary (`#1E3A5F`), lavender for suggestion cards (`#EDE8FF`), Inter font, light-weight headings.

---

## Key Decisions

**SQLite over Postgres** — zero-setup for local dev and evaluation. The Prisma schema is portable; swapping to Postgres requires only changing the provider and `DATABASE_URL`.

**HH:MM strings for time** — avoids timezone serialization issues in SQLite. All time comparisons are string-based (lexicographic, safe for HH:MM format).

**Greedy suggestion algorithm** — O(days × types × slots) instead of a constraint solver. Fast, deterministic, and easy to explain. The main trade-off is it doesn't find the globally optimal schedule, but for typical user data (< 50 sessions, < 10 types, 14-day window) it produces sensible results.

**TanStack Query over local state** — server state is the source of truth. Optimistic updates on session status changes to keep the UI responsive.

**Expo Router over React Navigation** — file-based routing reduces boilerplate and makes the navigation structure immediately legible from the file tree.
