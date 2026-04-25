# Data Model Plan

Stack: **Drizzle ORM + SQLite (better-sqlite3)**.

## Schema (`apps/api/db/schema.ts`)

```ts
import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createId } from "@paralleldrive/cuid2"; // or random()

export const sessionTypes = sqliteTable("session_types", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  category: text("category").notNull(),
  priority: integer("priority").notNull(), // 1–5
  color: text("color").notNull(),  // hex e.g. "#A8C5A0"
  icon: text("icon").notNull(),    // lucide name
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionTypeId: text("session_type_id")
    .notNull()
    .references(() => sessionTypes.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  date: text("date").notNull(),       // "YYYY-MM-DD"
  startTime: text("start_time").notNull(), // "HH:MM"
  duration: integer("duration").notNull(), // minutes
  status: text("status", { enum: ["scheduled", "completed", "cancelled"] })
    .notNull()
    .default("scheduled"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const availability = sqliteTable("availability", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sun .. 6=Sat
  startTime: text("start_time").notNull(),     // "HH:MM"
  endTime: text("end_time").notNull(),         // "HH:MM"
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
});

// Drizzle relations
export const sessionTypesRelations = relations(sessionTypes, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  sessionType: one(sessionTypes, {
    fields: [sessions.sessionTypeId],
    references: [sessionTypes.id],
  }),
}));
```

## Drizzle Config (`apps/api/drizzle.config.ts`)

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  },
});
```

## DB Client (`apps/api/db/index.ts`)

```ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database(process.env.DATABASE_FILE ?? "./dev.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
```

## Key Decisions

- **CUID2 → randomUUID**: skip the extra dep, use `crypto.randomUUID()`.
- **ISO strings for time/date**: avoids timezone serialization issues. Lexicographic comparison works for both `YYYY-MM-DD` and `HH:MM`.
- **One row per day for availability**: enforced at app level (no DB unique constraint needed; the `PUT /api/availability` endpoint replaces all rows in a transaction).
- **Cascade delete on session_types → sessions**: deleting a type deletes its sessions.
- **`status` as text enum**: SQLite has no native enum; Drizzle's `enum` option enforces it at TypeScript level.
- **Boolean stored as integer**: SQLite has no native boolean; Drizzle handles it via `mode: "boolean"`.
- **Foreign keys on**: enabled via PRAGMA at connection time (SQLite default is off).
- **WAL mode**: better concurrency for read/write.
