# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Smart Session Planner** — a take-home interview project. Users manage session types, set availability windows, log sessions, and receive smart spacing suggestions based on their history.

See `project.md` for the full assignment spec, `ARCHITECTURE.md` for high-level design decisions, and `plans/` for detailed implementation plans:
- `plans/01-data-model.md` — Prisma schema
- `plans/02-api-routes.md` — all API endpoints and response shapes
- `plans/03-suggestion-algorithm.md` — smart suggestion scoring logic
- `plans/04-mobile-screens.md` — screen specs and component structure
- `plans/05-execution-order.md` — phased build order and checklist

## Monorepo Structure

Bun workspaces with two apps:

| App | Path | Stack |
|-----|------|-------|
| Mobile | `apps/mobile` | Expo ~54, Expo Router 6, React 19, React Native 0.81.5 |
| API | `apps/api` | Next.js 16.2.4, Prisma 7.8.0 (SQLite), Zod 4.3.6 |

## Commands

```bash
# From repo root
bun run mobile          # start Expo dev server
bun run api             # start Next.js dev server

# Mobile (from root or apps/mobile)
bun run --cwd apps/mobile ios
bun run --cwd apps/mobile android
bun run --cwd apps/mobile lint

# API (from root or apps/api)
bun run --cwd apps/api dev
bun run --cwd apps/api build
bun run --cwd apps/api lint

# Prisma (run from apps/api)
bunx prisma migrate dev
bunx prisma generate
bunx prisma studio
```

## Next.js 16 Breaking Changes (Critical)

**Next.js 16 is NOT the Next.js you know from training data.** Before writing any API route or page code, read `apps/api/node_modules/next/dist/docs/`. Key breaking change: `params` and `searchParams` in route handlers and pages are now **Promises** — always `await` them.

```ts
// CORRECT in Next.js 16
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}
```

## Mobile Architecture

**Routing**: Expo Router 6 file-based routing. `app/(tabs)/` contains tab screens. `app/_layout.tsx` sets up the root Stack with `anchor: '(tabs)'`.

**Path alias**: `@/` resolves to `apps/mobile/` (configured in `tsconfig.json`).

**Platform splits**: Files ending in `.ios.tsx` or `.web.ts` are automatically selected on those platforms (e.g., `components/ui/icon-symbol.ios.tsx`).

**Theme**: `constants/theme.ts` exports `Colors` (light/dark) and `Fonts`. Use `useColorScheme()` from `hooks/use-color-scheme` for dark mode. `ThemedText` and `ThemedView` apply theme colors automatically.

**Data fetching**: TanStack Query v5 is installed (`@tanstack/react-query`). Wrap the app in `QueryClientProvider` before using `useQuery`/`useMutation`.

## API Architecture

**App Router** only — no Pages Router. All routes go in `apps/api/app/api/`.

**Database**: Prisma 7.8.0 with SQLite. Schema at `apps/api/prisma/schema.prisma` (to be created). Client initialized once and exported from `apps/api/lib/prisma.ts`.

**Validation**: Zod 4.3.6 for request body validation in route handlers.

## Planned API Routes

| Route | Purpose |
|-------|---------|
| `GET/POST /api/session-types` | List and create session types |
| `PUT/DELETE /api/session-types/[id]` | Update/delete a session type |
| `GET/PUT /api/availability` | Get and set availability windows |
| `GET/POST /api/sessions` | List and log sessions |
| `PUT/DELETE /api/sessions/[id]` | Update/delete a session |
| `GET /api/suggestions` | Smart spacing suggestions |
| `GET /api/progress` | Aggregate stats (count, completion rate, avg spacing) |

## Planned Mobile Screens

All 8 screens are designed in `project-designs/pencil-new.pen`:

| Screen | Route | Status |
|--------|-------|--------|
| Dashboard | `(tabs)/index` | Design done ✅ |
| Calendar | `(tabs)/calendar` | Design in progress |
| Stats | `(tabs)/stats` | Pending |
| Settings | `(tabs)/settings` | Pending |
| New Session | `new-session` | Pending |
| New Session Type | `new-session-type` | Pending |
| Availability Editor | `availability-editor` | Pending |
| Smart Suggestions | `suggestions` | Pending |

## Design System

Design file: `project-designs/pencil-new.pen` (open with Pencil MCP).

Style: **Japanese Swiss Mobile Dashboard**
- Background: warm off-white `#FAF8F5`
- Primary CTA: navy `#1E3A5F`
- Suggestion cards: lavender `#EDE8FF`
- Typography: Inter, light weight (300) for headings
- Session type color dots: sage green (done), gray (pending), lavender (deep work)
