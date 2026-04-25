# Data Model Plan

## Prisma Schema (SQLite)

### SessionType
```prisma
model SessionType {
  id        String    @id @default(cuid())
  name      String
  category  String
  priority  Int       // 1–5
  color     String    // hex, e.g. "#A8C5A0"
  icon      String    // lucide icon name
  sessions  Session[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

### Session
```prisma
model Session {
  id            String      @id @default(cuid())
  sessionTypeId String
  sessionType   SessionType @relation(fields: [sessionTypeId], references: [id], onDelete: Cascade)
  title         String
  date          String      // ISO date "YYYY-MM-DD"
  startTime     String      // "HH:MM" 24h
  duration      Int         // minutes
  status        String      @default("scheduled") // scheduled | completed | cancelled
  notes         String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}
```

### Availability
```prisma
model Availability {
  id        String  @id @default(cuid())
  dayOfWeek Int     // 0=Sun, 1=Mon, ... 6=Sat
  startTime String  // "HH:MM"
  endTime   String  // "HH:MM"
  enabled   Boolean @default(true)
}
```

## Key Decisions
- Dates stored as ISO strings to avoid timezone serialization issues in SQLite
- Times stored as "HH:MM" strings — no timezone, user's local time
- One availability row per day (one window per day is sufficient for MVP; can extend to multiple windows later)
- Session deletion cascades from SessionType (deletes orphaned sessions)
- `status` as string enum over Prisma native enums for SQLite compatibility
