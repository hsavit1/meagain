# API Routes Plan

All routes under `apps/api/app/api/`. Next.js 16: `params` is a Promise — always `await` it.

## Session Types

| Method | Path | Body / Query | Response |
|--------|------|-------------|----------|
| GET | `/api/session-types` | — | `SessionType[]` |
| POST | `/api/session-types` | `{name, category, priority, color, icon}` | `SessionType` |
| PUT | `/api/session-types/[id]` | partial fields | `SessionType` |
| DELETE | `/api/session-types/[id]` | — | `{success: true}` |

## Availability

| Method | Path | Body | Response |
|--------|------|------|----------|
| GET | `/api/availability` | — | `Availability[]` (7 rows, one per day) |
| PUT | `/api/availability` | `Availability[]` | `Availability[]` |

PUT replaces all 7 rows atomically (delete-all + insert-all in a transaction).

## Sessions

| Method | Path | Query / Body | Response |
|--------|------|-------------|----------|
| GET | `/api/sessions` | `?startDate=&endDate=&status=&typeId=` | `Session[]` with `sessionType` included |
| POST | `/api/sessions` | `{sessionTypeId, title, date, startTime, duration, notes?}` | `Session` |
| PUT | `/api/sessions/[id]` | partial fields (status, notes, etc.) | `Session` |
| DELETE | `/api/sessions/[id]` | — | `{success: true}` |

## Suggestions

| Method | Path | Query | Response |
|--------|------|-------|----------|
| GET | `/api/suggestions` | `?limit=5&lookahead=14` | `Suggestion[]` |

See `03-suggestion-algorithm.md` for details.

```ts
type Suggestion = {
  sessionTypeId: string
  sessionTypeName: string
  sessionTypeColor: string
  date: string        // "YYYY-MM-DD"
  startTime: string   // "HH:MM"
  endTime: string     // "HH:MM"
  reason: string      // human-readable explanation
  score: number       // internal ranking score
}
```

## Progress

| Method | Path | Query | Response |
|--------|------|-------|----------|
| GET | `/api/progress` | `?since=YYYY-MM-DD` | `ProgressSummary` |

```ts
type ProgressSummary = {
  totalScheduled: number
  totalCompleted: number
  completionRate: number        // 0–1
  byType: { typeId: string; name: string; color: string; completed: number; scheduled: number }[]
  avgSpacingDays: number        // derived metric: avg days between sessions of same type
  currentStreakDays: number     // days with at least one completed session (consecutive)
}
```

## Validation

All POST/PUT bodies validated with Zod. Return 400 + `{error: string}` on validation failure. Return 404 + `{error: "Not found"}` when entity missing. Return 500 + `{error: "Internal server error"}` otherwise.

## File Layout

```
apps/api/app/api/
  session-types/
    route.ts                  # GET, POST
    [id]/route.ts             # PUT, DELETE
  availability/
    route.ts                  # GET, PUT
  sessions/
    route.ts                  # GET, POST
    [id]/route.ts             # PUT, DELETE
  suggestions/
    route.ts                  # GET
  progress/
    route.ts                  # GET

apps/api/lib/
  prisma.ts                   # singleton PrismaClient
  suggestions.ts              # suggestion algorithm
  
apps/api/prisma/
  schema.prisma
  dev.db                      # SQLite (gitignored)
```
