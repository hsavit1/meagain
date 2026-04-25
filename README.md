# Smart Session Planner

Take-home project: an end-to-end mobile app for managing session types, weekly availability, scheduled sessions, and smart time-slot suggestions.

- **Mobile**: Expo (React Native, TypeScript) — `apps/mobile`
- **Backend**: Next.js 16 App Router with `/api` routes — `apps/api`
- **Storage**: SQLite via Drizzle ORM (better-sqlite3)
- **Designs**: `project-designs/pencil-new.pen` (open with [Pencil](https://pencil.dev))
- **Architecture overview**: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- **API spec**: [`plans/02-api-routes.md`](./plans/02-api-routes.md)
- **Suggestion algorithm**: [`plans/03-suggestion-algorithm.md`](./plans/03-suggestion-algorithm.md)

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.3
- Node ≥ 20 (used by Next.js)
- iOS Simulator (Xcode) or Android Emulator, or [Expo Go](https://expo.dev/go) on a physical device

## Setup

From the repo root:

```bash
bun install
```

This installs dependencies for both workspaces (`apps/api` and `apps/mobile`).

### Initialize the database (one-time)

```bash
cd apps/api
bun run db:migrate     # apply migrations to apps/api/dev.db
bun run db:seed        # load 4 session types + sample sessions + availability
```

The seed gives you a non-empty UI on first launch. Re-run `db:seed` anytime to reset to a known state.

## Run the project

You'll typically want both servers running. **Open two terminals**:

**Terminal 1 — API** (`http://localhost:3000`):
```bash
bun run api
```

**Terminal 2 — Mobile** (Expo dev server):
```bash
bun run mobile
```

Then in the Expo CLI:
- press `i` to open the iOS Simulator
- press `a` to open Android
- press `w` to open in a browser
- or scan the QR code with Expo Go

## Environment variables

### Mobile (`apps/mobile`)

The mobile app reads the API URL from `EXPO_PUBLIC_API_URL`. Defaults to `http://localhost:3000` if unset.

For physical devices on the same network, set it to your machine's LAN IP:

```bash
# apps/mobile/.env.local
EXPO_PUBLIC_API_URL=http://192.168.1.42:3000
```

### API (`apps/api`)

| Var | Default | Purpose |
|-----|---------|---------|
| `DATABASE_FILE` | `dev.db` | Path to the SQLite file |

## Available commands

### Root

| Command | What it does |
|---------|--------------|
| `bun run mobile` | Start Expo dev server |
| `bun run api` | Start Next.js dev server |

### API (`apps/api`)

| Command | What it does |
|---------|--------------|
| `bun run dev` | Start Next.js with Turbopack |
| `bun run build` | Production build |
| `bun run start` | Run the production build |
| `bun run lint` | Lint with ESLint |
| `bun run db:generate` | Generate a new migration from the schema |
| `bun run db:migrate` | Apply pending migrations |
| `bun run db:studio` | Open Drizzle Studio (DB inspector) |
| `bun run db:seed` | Reset and reseed the database |

### Mobile (`apps/mobile`)

| Command | What it does |
|---------|--------------|
| `bun run start` | Start Expo dev server |
| `bun run ios` | Open in iOS Simulator |
| `bun run android` | Open in Android Emulator |
| `bun run web` | Open in browser |
| `bun run lint` | Lint with Expo ESLint config |

## Smoke-testing the API

After starting the API, every endpoint is reachable at `http://localhost:3000/api/*`:

```bash
curl http://localhost:3000/api/session-types
curl http://localhost:3000/api/availability
curl http://localhost:3000/api/sessions
curl 'http://localhost:3000/api/suggestions?limit=5'
curl http://localhost:3000/api/progress
```

See [`plans/02-api-routes.md`](./plans/02-api-routes.md) for full request/response shapes.

## Project structure

```
meagain/
├── apps/
│   ├── api/                       Next.js 16 backend
│   │   ├── app/api/               Route handlers (session-types, sessions, availability, suggestions, progress)
│   │   ├── db/                    Drizzle schema, migrations, client
│   │   ├── lib/                   Helpers: api wrappers, time math, conflict detection, suggestion algorithm
│   │   └── scripts/seed.ts        Sample data
│   └── mobile/                    Expo Router app
├── plans/                         Implementation plans (data model, API spec, algorithm, screens)
├── project-designs/               Pencil .pen file with all 8 screen designs
├── ARCHITECTURE.md                High-level design overview
├── CLAUDE.md                      Notes for AI agents working in this repo
└── project.md                     Original assignment spec
```

## Assumptions and limitations

- **Single-user**: no auth or multi-tenant support. The API operates on one user's data.
- **Local SQLite**: `apps/api/dev.db` is the only database. Easy to swap for Postgres by changing the Drizzle dialect and connection string.
- **Times stored as `HH:MM` strings, dates as `YYYY-MM-DD`**: avoids SQLite timezone serialization issues. All times are user-local.
- **Availability**: one window per day-of-week. Multi-window availability would extend the schema, not change it.
- **Suggestions are greedy, not globally optimal**: the algorithm scores each candidate slot independently and returns the top N. Trade-off documented in [`plans/03-suggestion-algorithm.md`](./plans/03-suggestion-algorithm.md).
- **Conflict bypass**: `POST /api/sessions` accepts `force: true` to deliberately schedule overlapping sessions, surfaced in the UI as a warning rather than a hard block.

## Submission deliverables

- Source code (this repo)
- [`README.md`](./README.md) — setup, env vars, assumptions
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — high-level architecture
