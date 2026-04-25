import { and, eq, gte, lte, notInArray } from "drizzle-orm";
import { db } from "@/db";
import { sessions, sessionTypes, availability } from "@/db/schema";
import {
  addDaysISO,
  addMinutes,
  dayOfWeekISO,
  diffDaysISO,
  intervalsOverlap,
  timeToMinutes,
  todayISO,
} from "./time";

export type Suggestion = {
  sessionTypeId: string;
  sessionType: {
    id: string;
    name: string;
    color: string;
    icon: string;
    priority: number;
  };
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  reason: string;
  score: number;
};

export async function buildSuggestions(opts: {
  limit: number;
  lookahead: number;
  slotMinutes: number;
}): Promise<Suggestion[]> {
  const today = todayISO();
  const endDate = addDaysISO(today, opts.lookahead);

  const [types, windows, recentSessions] = await Promise.all([
    db.select().from(sessionTypes),
    db.select().from(availability).where(eq(availability.enabled, true)),
    db
      .select()
      .from(sessions)
      .where(
        and(
          gte(sessions.date, today),
          lte(sessions.date, endDate),
          notInArray(sessions.status, ["cancelled", "skipped"]),
        ),
      ),
  ]);

  if (types.length === 0 || windows.length === 0) return [];

  const completedAll = await db
    .select({ sessionTypeId: sessions.sessionTypeId, date: sessions.date })
    .from(sessions)
    .where(eq(sessions.status, "completed"));

  const lastCompletedByType = new Map<string, string>();
  for (const s of completedAll) {
    const cur = lastCompletedByType.get(s.sessionTypeId);
    if (!cur || s.date > cur) lastCompletedByType.set(s.sessionTypeId, s.date);
  }

  const sessionsByDay = new Map<string, typeof recentSessions>();
  for (const s of recentSessions) {
    const arr = sessionsByDay.get(s.date) ?? [];
    arr.push(s);
    sessionsByDay.set(s.date, arr);
  }

  const candidates: Suggestion[] = [];

  for (let offset = 0; offset <= opts.lookahead; offset++) {
    const date = addDaysISO(today, offset);
    const dow = dayOfWeekISO(date);
    const window = windows.find((w) => w.dayOfWeek === dow);
    if (!window) continue;

    const daySessions = sessionsByDay.get(date) ?? [];
    const winStart = timeToMinutes(window.startTime);
    const winEnd = timeToMinutes(window.endTime);

    for (const type of types) {
      let bestForType: Suggestion | null = null;

      for (
        let slot = winStart;
        slot + opts.slotMinutes <= winEnd;
        slot += 30
      ) {
        const startTime = minutesToHHMM(slot);
        const endTime = addMinutes(startTime, opts.slotMinutes);

        const overlaps = daySessions.some((s) =>
          intervalsOverlap(
            startTime,
            endTime,
            s.startTime,
            addMinutes(s.startTime, s.duration),
          ),
        );
        if (overlaps) continue;

        const { score, reason } = scoreSlot({
          type,
          date,
          today,
          daySessions,
          lastCompletedDate: lastCompletedByType.get(type.id),
        });

        if (!bestForType || score > bestForType.score) {
          bestForType = {
            sessionTypeId: type.id,
            sessionType: {
              id: type.id,
              name: type.name,
              color: type.color,
              icon: type.icon,
              priority: type.priority,
            },
            date,
            startTime,
            endTime,
            duration: opts.slotMinutes,
            reason,
            score,
          };
        }
      }

      if (bestForType) candidates.push(bestForType);
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, opts.limit);
}

function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function scoreSlot(args: {
  type: { id: string; name: string; priority: number };
  date: string;
  today: string;
  daySessions: Array<{ sessionTypeId: string; date: string }>;
  lastCompletedDate: string | undefined;
}): { score: number; reason: string } {
  const { type, date, today, daySessions, lastCompletedDate } = args;

  const priorityScore = type.priority * 20;

  // Spacing relative to the proposed slot — drives the score.
  const spacingFromSlot =
    lastCompletedDate === undefined ? 999 : diffDaysISO(date, lastCompletedDate);
  const spacingScore = Math.min(spacingFromSlot * 5, 50);

  // Days since last completion as of today — drives the human-facing reason.
  const daysSinceToday =
    lastCompletedDate === undefined
      ? null
      : Math.max(0, diffDaysISO(today, lastCompletedDate));

  const sessionsOnDay = daySessions.length;
  const loadPenalty = sessionsOnDay * 15;

  const highPriorityOnDay = daySessions.length;
  const clusterPenalty =
    type.priority >= 4 ? highPriorityOnDay * 25 : 0;

  const score = priorityScore + spacingScore - loadPenalty - clusterPenalty;

  let reason: string;
  if (daysSinceToday === null) {
    reason = `First ${type.name} session — great time to start`;
  } else if (daysSinceToday === 0) {
    reason = `You did ${type.name} today — this slot keeps the rhythm going`;
  } else if (daysSinceToday >= 7) {
    reason = `It's been ${daysSinceToday} days since your last ${type.name}`;
  } else if (daysSinceToday >= 3) {
    reason = `Good spacing — last ${type.name} was ${daysSinceToday} days ago`;
  } else if (sessionsOnDay === 0) {
    reason = `Open day — no other sessions scheduled`;
  } else if (type.priority === 5) {
    reason = `High-priority type — keep momentum`;
  } else {
    reason = `Last ${type.name} was ${daysSinceToday} day${
      daysSinceToday === 1 ? "" : "s"
    } ago — fits your availability`;
  }

  return { score, reason };
}
