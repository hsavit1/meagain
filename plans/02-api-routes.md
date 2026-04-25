# API Specification

All routes under `apps/api/app/api/`. Next.js 16 App Router — `params` is a Promise (always `await`).

## Conventions

### Base URL
- Dev: `http://localhost:3000/api`
- Mobile reads from `EXPO_PUBLIC_API_URL`.

### Content type
- Request bodies: `application/json`.
- Responses: `application/json`.

### Error shape
All errors return:
```json
{ "error": "Human-readable message", "issues": [...optional Zod issues] }
```

| Status | When |
|--------|------|
| 200 | Success (GET / PUT / DELETE) |
| 201 | Resource created (POST) |
| 400 | Invalid request body or query params (Zod failure) |
| 404 | Resource not found |
| 409 | Conflict (e.g., overlapping session, duplicate availability day) |
| 500 | Internal server error |

### Date / time formats
- Dates: `YYYY-MM-DD` (e.g. `"2026-04-25"`).
- Times: 24h `HH:MM` (e.g. `"14:30"`).
- Timestamps: Unix seconds (integer).

---

## 1. Session Types

### `GET /api/session-types`

List all session types with completed/scheduled counts.

**Query params**: none.

**Response 200**:
```ts
type SessionTypeWithCounts = {
  id: string
  name: string
  category: string
  priority: 1 | 2 | 3 | 4 | 5
  color: string         // hex
  icon: string          // lucide icon name
  createdAt: number     // unix seconds
  updatedAt: number
  completedCount: number
  scheduledCount: number
}

// Response: SessionTypeWithCounts[]
```

### `POST /api/session-types`

Create a session type.

**Body**:
```ts
{
  name: string         // 1..80 chars
  category: string     // 1..40 chars
  priority: 1|2|3|4|5
  color: string        // /^#[0-9A-Fa-f]{6}$/
  icon: string         // 1..40 chars
}
```

**Response 201**: the created `SessionType` (no counts).

### `PUT /api/session-types/[id]`

Update a session type. All fields optional.

**Body**: partial of POST body.

**Response 200**: the updated `SessionType`.
**Response 404**: when id not found.

### `DELETE /api/session-types/[id]`

Delete a session type. Cascades to sessions.

**Response 200**: `{ "success": true, "deletedSessions": number }`.
**Response 404**: when id not found.

---

## 2. Availability

### `GET /api/availability`

Returns all 7 day rows. If none exist, returns 7 default rows (all disabled).

**Response 200**:
```ts
type Availability = {
  id: string
  dayOfWeek: 0|1|2|3|4|5|6   // 0 = Sun
  startTime: string           // "HH:MM"
  endTime: string             // "HH:MM"
  enabled: boolean
}

// Response: Availability[] (always length 7, ordered by dayOfWeek)
```

### `PUT /api/availability`

Replace all availability rows atomically.

**Body**:
```ts
{
  windows: Array<{
    dayOfWeek: 0|1|2|3|4|5|6
    startTime: string         // "HH:MM"
    endTime: string           // "HH:MM"
    enabled: boolean
  }>  // exactly 7 entries, each dayOfWeek unique
}
```

**Validation**:
- `windows.length === 7`
- All 7 `dayOfWeek` values present (0..6, no duplicates)
- For each enabled window: `startTime < endTime`

**Response 200**: the new `Availability[]`.

---

## 3. Sessions

### `GET /api/sessions`

List sessions, sorted ascending by date + startTime.

**Query params** (all optional):
| Name | Type | Description |
|------|------|-------------|
| `startDate` | `YYYY-MM-DD` | Inclusive lower bound on `date` |
| `endDate` | `YYYY-MM-DD` | Inclusive upper bound on `date` |
| `status` | `scheduled \| completed \| cancelled` | Filter by status |
| `typeId` | string | Filter by session type id |

**Response 200**:
```ts
type SessionWithType = {
  id: string
  sessionTypeId: string
  title: string
  date: string          // "YYYY-MM-DD"
  startTime: string     // "HH:MM"
  duration: number      // minutes
  endTime: string       // computed: "HH:MM"
  status: "scheduled" | "completed" | "cancelled"
  notes: string | null
  createdAt: number
  updatedAt: number
  sessionType: {
    id: string
    name: string
    color: string
    icon: string
    priority: number
  }
}

// Response: SessionWithType[]
```

### `POST /api/sessions`

Create a session. Returns 409 if it overlaps an existing non-cancelled session.

**Body**:
```ts
{
  sessionTypeId: string   // must exist
  title: string           // 1..120 chars
  date: string            // "YYYY-MM-DD"
  startTime: string       // "HH:MM"
  duration: number        // 5..600 (minutes)
  notes?: string          // 0..2000 chars
  force?: boolean         // if true, bypass conflict check
}
```

**Response 201**: the created `SessionWithType`.

**Response 409** (conflict, only when `force !== true`):
```json
{
  "error": "Session conflicts with existing sessions",
  "conflicts": [
    { "id": "...", "title": "...", "date": "...", "startTime": "...", "endTime": "..." }
  ]
}
```

### `PUT /api/sessions/[id]`

Update a session. All fields optional. Same conflict logic as POST.

**Body**: partial of POST body, plus optional `status: "scheduled"|"completed"|"cancelled"`.

**Response 200**: updated `SessionWithType`.

### `DELETE /api/sessions/[id]`

**Response 200**: `{ "success": true }`.

---

## 4. Suggestions

### `GET /api/suggestions`

Smart time-slot suggestions. See `plans/03-suggestion-algorithm.md` for scoring.

**Query params** (all optional):
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `limit` | int | `5` | Max suggestions to return (1..20) |
| `lookahead` | int | `14` | Days ahead to consider (1..60) |
| `slotMinutes` | int | `60` | Suggested slot duration |

**Response 200**:
```ts
type Suggestion = {
  sessionTypeId: string
  sessionType: {
    id: string
    name: string
    color: string
    icon: string
    priority: number
  }
  date: string          // "YYYY-MM-DD"
  startTime: string     // "HH:MM"
  endTime: string       // "HH:MM"
  duration: number      // minutes
  reason: string        // human-readable explanation
  score: number         // ranking score (debug/UI)
}

// Response: Suggestion[]   (already sorted, length <= limit)
```

If there are no session types or no enabled availability windows, returns `[]`.

---

## 5. Progress

### `GET /api/progress`

Aggregate stats across all sessions.

**Query params** (all optional):
| Name | Type | Default | Description |
|------|------|---------|-------------|
| `since` | `YYYY-MM-DD` | none (all-time) | Only count sessions on or after this date |
| `until` | `YYYY-MM-DD` | today | Only count sessions on or before this date |

**Response 200**:
```ts
type ProgressSummary = {
  totalScheduled: number          // includes completed (any non-cancelled)
  totalCompleted: number
  totalCancelled: number
  completionRate: number          // 0..1, completed/scheduled (0 if none)
  byType: Array<{
    typeId: string
    name: string
    color: string
    completed: number
    scheduled: number             // future scheduled, status=scheduled
    total: number                 // completed + scheduled
  }>
  avgSpacingDays: number | null   // avg days between same-type completed sessions
  currentStreakDays: number       // consecutive days ending today with >= 1 completed session
  longestStreakDays: number
}
```

---

## File Layout

```
apps/api/
├── app/
│   └── api/
│       ├── session-types/
│       │   ├── route.ts                  GET, POST
│       │   └── [id]/route.ts             PUT, DELETE
│       ├── availability/
│       │   └── route.ts                  GET, PUT
│       ├── sessions/
│       │   ├── route.ts                  GET, POST
│       │   └── [id]/route.ts             PUT, DELETE
│       ├── suggestions/
│       │   └── route.ts                  GET
│       └── progress/
│           └── route.ts                  GET
├── db/
│   ├── index.ts                          Drizzle + better-sqlite3 client
│   ├── schema.ts                         Tables + relations
│   └── migrations/                       drizzle-kit output
├── lib/
│   ├── conflicts.ts                      session overlap detection
│   ├── suggestions.ts                    suggestion algorithm
│   ├── time.ts                           HH:MM math helpers
│   └── api.ts                            JSON response helpers + Zod error handler
├── scripts/
│   └── seed.ts                           Sample data
├── drizzle.config.ts
└── dev.db                                SQLite (gitignored)
```

## Validation

Every POST/PUT body validated with Zod. Validation failures return 400:
```json
{
  "error": "Validation failed",
  "issues": [{ "path": ["priority"], "message": "Expected number, received string" }]
}
```

## Conflict Detection

Two sessions overlap if same `date` AND `[startTime, endTime)` intervals overlap. Cancelled sessions are excluded from conflict checks. Implementation in `lib/conflicts.ts`:

```ts
function overlaps(a: Interval, b: Interval): boolean {
  return a.startTime < b.endTime && b.startTime < a.endTime;
}
```

Times stored as `HH:MM` allow lexicographic comparison.
