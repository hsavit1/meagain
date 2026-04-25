import { z } from "zod";
import { db } from "@/db";
import { availability, sessions, sessionTypes } from "@/db/schema";
import { handleError, ok, parseJson } from "@/lib/api";
import { addDaysISO, todayISO } from "@/lib/time";

const personaSchema = z.object({
  persona: z.enum(["default", "empty", "power-user", "beginner", "skipper"]),
});

export type Persona = z.infer<typeof personaSchema>["persona"];

export const PERSONAS: Array<{
  key: Persona;
  label: string;
  description: string;
}> = [
  {
    key: "default",
    label: "Default",
    description: "4 session types, mixed history, today partially scheduled",
  },
  {
    key: "empty",
    label: "Empty",
    description: "Clean slate — no types, no sessions, no availability",
  },
  {
    key: "power-user",
    label: "Power user",
    description: "6 types, dense schedule, long completion streak",
  },
  {
    key: "beginner",
    label: "Beginner",
    description: "1 type, just started this week, no history",
  },
  {
    key: "skipper",
    label: "Skip-heavy",
    description: "Mostly skipped sessions — to demo recovery & rate impact",
  },
];

export async function GET() {
  return ok({ personas: PERSONAS });
}

export async function POST(req: Request) {
  try {
    const parsed = await parseJson(req, personaSchema);
    if ("error" in parsed) return parsed.error;
    const { persona } = parsed.data;

    db.delete(sessions).run();
    db.delete(sessionTypes).run();
    db.delete(availability).run();

    const summary = await applyPersona(persona);
    return ok({ persona, ...summary });
  } catch (err) {
    return handleError(err);
  }
}

async function applyPersona(persona: Persona) {
  const today = todayISO();

  if (persona === "empty") {
    return { types: 0, sessions: 0 };
  }

  if (persona === "default") {
    const types = db
      .insert(sessionTypes)
      .values([
        { name: "Morning Meditation", category: "Wellness", priority: 3, color: "#A8C5A0", icon: "sun" },
        { name: "Deep Work", category: "Focus", priority: 5, color: "#C4B5FD", icon: "brain" },
        { name: "Workout", category: "Health", priority: 4, color: "#FCA5A5", icon: "dumbbell" },
        { name: "Reading", category: "Learning", priority: 2, color: "#93C5FD", icon: "book-open" },
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

    const med = types.find((t) => t.name === "Morning Meditation")!;
    const dw = types.find((t) => t.name === "Deep Work")!;
    const wk = types.find((t) => t.name === "Workout")!;

    db.insert(sessions)
      .values([
        { sessionTypeId: med.id, title: "Morning Meditation", date: today, startTime: "07:00", duration: 30, status: "completed" },
        { sessionTypeId: dw.id, title: "Deep Work", date: today, startTime: "14:00", duration: 120, status: "scheduled" },
        { sessionTypeId: med.id, title: "Morning Meditation", date: addDaysISO(today, -2), startTime: "07:00", duration: 30, status: "completed" },
        { sessionTypeId: wk.id, title: "Workout", date: addDaysISO(today, -3), startTime: "08:00", duration: 60, status: "completed" },
        { sessionTypeId: dw.id, title: "Deep Work", date: addDaysISO(today, -1), startTime: "14:00", duration: 120, status: "completed" },
      ])
      .run();

    return { types: types.length, sessions: 5 };
  }

  if (persona === "power-user") {
    const types = db
      .insert(sessionTypes)
      .values([
        { name: "Morning Meditation", category: "Wellness", priority: 4, color: "#A8C5A0", icon: "sun" },
        { name: "Deep Work", category: "Focus", priority: 5, color: "#C4B5FD", icon: "brain" },
        { name: "Workout", category: "Health", priority: 4, color: "#FCA5A5", icon: "dumbbell" },
        { name: "Reading", category: "Learning", priority: 3, color: "#93C5FD", icon: "book-open" },
        { name: "Spanish", category: "Learning", priority: 3, color: "#FCD34D", icon: "languages" },
        { name: "Journaling", category: "Wellness", priority: 2, color: "#F9A8D4", icon: "pen-tool" },
      ])
      .returning()
      .all();

    db.insert(availability)
      .values([
        { dayOfWeek: 0, startTime: "08:00", endTime: "20:00", enabled: true },
        { dayOfWeek: 1, startTime: "06:00", endTime: "21:00", enabled: true },
        { dayOfWeek: 2, startTime: "06:00", endTime: "21:00", enabled: true },
        { dayOfWeek: 3, startTime: "06:00", endTime: "21:00", enabled: true },
        { dayOfWeek: 4, startTime: "06:00", endTime: "21:00", enabled: true },
        { dayOfWeek: 5, startTime: "06:00", endTime: "21:00", enabled: true },
        { dayOfWeek: 6, startTime: "08:00", endTime: "20:00", enabled: true },
      ])
      .run();

    const rows: Array<{
      sessionTypeId: string;
      title: string;
      date: string;
      startTime: string;
      duration: number;
      status: "scheduled" | "completed" | "skipped" | "cancelled";
    }> = [];

    const med = types.find((t) => t.name === "Morning Meditation")!;
    const dw = types.find((t) => t.name === "Deep Work")!;
    const wk = types.find((t) => t.name === "Workout")!;
    const rd = types.find((t) => t.name === "Reading")!;
    const sp = types.find((t) => t.name === "Spanish")!;
    const jr = types.find((t) => t.name === "Journaling")!;

    for (let off = -28; off <= 0; off++) {
      const d = addDaysISO(today, off);
      const isToday = off === 0;
      rows.push({ sessionTypeId: med.id, title: "Morning Meditation", date: d, startTime: "07:00", duration: 30, status: isToday ? "scheduled" : "completed" });
      rows.push({ sessionTypeId: jr.id, title: "Journaling", date: d, startTime: "07:45", duration: 15, status: isToday ? "scheduled" : off % 5 === 0 ? "skipped" : "completed" });
      if (off % 2 === 0) {
        rows.push({ sessionTypeId: dw.id, title: "Deep Work", date: d, startTime: "09:00", duration: 120, status: isToday ? "scheduled" : "completed" });
      }
      if (off % 3 === 0) {
        rows.push({ sessionTypeId: wk.id, title: "Workout", date: d, startTime: "17:00", duration: 60, status: isToday ? "scheduled" : "completed" });
      }
      if (off % 2 === 1 || off % 2 === -1) {
        rows.push({ sessionTypeId: rd.id, title: "Reading", date: d, startTime: "20:00", duration: 45, status: isToday ? "scheduled" : "completed" });
      }
      if (off % 4 === 0) {
        rows.push({ sessionTypeId: sp.id, title: "Spanish", date: d, startTime: "12:30", duration: 30, status: isToday ? "scheduled" : "completed" });
      }
    }

    db.insert(sessions).values(rows).run();
    return { types: types.length, sessions: rows.length };
  }

  if (persona === "beginner") {
    const types = db
      .insert(sessionTypes)
      .values([
        { name: "Morning Walk", category: "Wellness", priority: 3, color: "#A8C5A0", icon: "footprints" },
      ])
      .returning()
      .all();

    db.insert(availability)
      .values([
        { dayOfWeek: 0, startTime: "08:00", endTime: "10:00", enabled: false },
        { dayOfWeek: 1, startTime: "07:00", endTime: "09:00", enabled: true },
        { dayOfWeek: 2, startTime: "07:00", endTime: "09:00", enabled: true },
        { dayOfWeek: 3, startTime: "07:00", endTime: "09:00", enabled: true },
        { dayOfWeek: 4, startTime: "07:00", endTime: "09:00", enabled: true },
        { dayOfWeek: 5, startTime: "07:00", endTime: "09:00", enabled: true },
        { dayOfWeek: 6, startTime: "08:00", endTime: "10:00", enabled: false },
      ])
      .run();

    const walk = types[0];
    db.insert(sessions)
      .values([
        { sessionTypeId: walk.id, title: "Morning Walk", date: addDaysISO(today, -1), startTime: "07:30", duration: 30, status: "completed" },
        { sessionTypeId: walk.id, title: "Morning Walk", date: today, startTime: "07:30", duration: 30, status: "scheduled" },
      ])
      .run();

    return { types: 1, sessions: 2 };
  }

  if (persona === "skipper") {
    const types = db
      .insert(sessionTypes)
      .values([
        { name: "Workout", category: "Health", priority: 4, color: "#FCA5A5", icon: "dumbbell" },
        { name: "Reading", category: "Learning", priority: 3, color: "#93C5FD", icon: "book-open" },
        { name: "Deep Work", category: "Focus", priority: 5, color: "#C4B5FD", icon: "brain" },
      ])
      .returning()
      .all();

    db.insert(availability)
      .values([
        { dayOfWeek: 0, startTime: "10:00", endTime: "16:00", enabled: true },
        { dayOfWeek: 1, startTime: "07:00", endTime: "20:00", enabled: true },
        { dayOfWeek: 2, startTime: "07:00", endTime: "20:00", enabled: true },
        { dayOfWeek: 3, startTime: "07:00", endTime: "20:00", enabled: true },
        { dayOfWeek: 4, startTime: "07:00", endTime: "20:00", enabled: true },
        { dayOfWeek: 5, startTime: "07:00", endTime: "20:00", enabled: true },
        { dayOfWeek: 6, startTime: "10:00", endTime: "16:00", enabled: true },
      ])
      .run();

    const wk = types.find((t) => t.name === "Workout")!;
    const rd = types.find((t) => t.name === "Reading")!;
    const dw = types.find((t) => t.name === "Deep Work")!;

    const rows: Array<{
      sessionTypeId: string;
      title: string;
      date: string;
      startTime: string;
      duration: number;
      status: "scheduled" | "completed" | "skipped" | "cancelled";
    }> = [];
    for (let off = -14; off <= -1; off++) {
      const d = addDaysISO(today, off);
      rows.push({ sessionTypeId: wk.id, title: "Workout", date: d, startTime: "07:00", duration: 60, status: off % 4 === 0 ? "completed" : "skipped" });
      rows.push({ sessionTypeId: rd.id, title: "Reading", date: d, startTime: "20:00", duration: 30, status: off % 3 === 0 ? "completed" : "skipped" });
    }
    rows.push({ sessionTypeId: dw.id, title: "Deep Work", date: today, startTime: "09:00", duration: 90, status: "scheduled" });
    rows.push({ sessionTypeId: wk.id, title: "Workout", date: today, startTime: "17:00", duration: 60, status: "scheduled" });

    db.insert(sessions).values(rows).run();
    return { types: types.length, sessions: rows.length };
  }

  return { types: 0, sessions: 0 };
}
