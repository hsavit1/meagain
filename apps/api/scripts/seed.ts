import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { availability, sessions, sessionTypes } from "../db/schema";
import { env } from "../lib/env";

const sqlite = new Database(env.DATABASE_FILE);
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite);

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function addDaysISO(d: string, days: number): string {
  const date = new Date(d + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

async function main() {
  console.log("Seeding...");
  db.delete(sessions).run();
  db.delete(sessionTypes).run();
  db.delete(availability).run();

  const types = db
    .insert(sessionTypes)
    .values([
      {
        name: "Morning Meditation",
        category: "Wellness",
        priority: 3,
        color: "#A8C5A0",
        icon: "sun",
      },
      {
        name: "Deep Work",
        category: "Focus",
        priority: 5,
        color: "#C4B5FD",
        icon: "brain",
      },
      {
        name: "Workout",
        category: "Health",
        priority: 4,
        color: "#FCA5A5",
        icon: "dumbbell",
      },
      {
        name: "Reading",
        category: "Learning",
        priority: 2,
        color: "#93C5FD",
        icon: "book-open",
      },
    ])
    .returning()
    .all();

  db.insert(availability)
    .values([
      { dayOfWeek: 0, startTime: "10:00", endTime: "16:00", enabled: true },
      { dayOfWeek: 1, startTime: "07:00", endTime: "09:00", enabled: true },
      { dayOfWeek: 2, startTime: "07:00", endTime: "09:00", enabled: false },
      { dayOfWeek: 3, startTime: "07:00", endTime: "09:00", enabled: false },
      { dayOfWeek: 4, startTime: "07:00", endTime: "09:00", enabled: false },
      { dayOfWeek: 5, startTime: "18:00", endTime: "21:00", enabled: true },
      { dayOfWeek: 6, startTime: "08:00", endTime: "14:00", enabled: true },
    ])
    .run();

  const today = todayISO();
  const meditation = types.find((t) => t.name === "Morning Meditation")!;
  const deepWork = types.find((t) => t.name === "Deep Work")!;
  const workout = types.find((t) => t.name === "Workout")!;

  db.insert(sessions)
    .values([
      {
        sessionTypeId: meditation.id,
        title: "Morning Meditation",
        date: today,
        startTime: "07:00",
        duration: 30,
        status: "completed",
      },
      {
        sessionTypeId: deepWork.id,
        title: "Deep Work",
        date: today,
        startTime: "14:00",
        duration: 120,
        status: "scheduled",
      },
      {
        sessionTypeId: meditation.id,
        title: "Morning Meditation",
        date: addDaysISO(today, -2),
        startTime: "07:00",
        duration: 30,
        status: "completed",
      },
      {
        sessionTypeId: workout.id,
        title: "Workout",
        date: addDaysISO(today, -3),
        startTime: "08:00",
        duration: 60,
        status: "completed",
      },
      {
        sessionTypeId: deepWork.id,
        title: "Deep Work",
        date: addDaysISO(today, -1),
        startTime: "14:00",
        duration: 120,
        status: "completed",
      },
    ])
    .run();

  console.log(`Seeded ${types.length} session types and 5 sessions.`);
  sqlite.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
