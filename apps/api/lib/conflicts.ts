import { and, eq, ne, notInArray } from "drizzle-orm";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { addMinutes, intervalsOverlap } from "./time";

export type ConflictRow = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
};

export async function findConflicts(args: {
  date: string;
  startTime: string;
  duration: number;
  excludeId?: string;
}): Promise<ConflictRow[]> {
  const endTime = addMinutes(args.startTime, args.duration);

  const sameDay = await db
    .select({
      id: sessions.id,
      title: sessions.title,
      date: sessions.date,
      startTime: sessions.startTime,
      duration: sessions.duration,
      status: sessions.status,
    })
    .from(sessions)
    .where(
      and(
        eq(sessions.date, args.date),
        notInArray(sessions.status, ["cancelled", "skipped"]),
        args.excludeId ? ne(sessions.id, args.excludeId) : undefined,
      ),
    );

  return sameDay
    .filter((s) =>
      intervalsOverlap(
        args.startTime,
        endTime,
        s.startTime,
        addMinutes(s.startTime, s.duration),
      ),
    )
    .map((s) => ({
      id: s.id,
      title: s.title,
      date: s.date,
      startTime: s.startTime,
      endTime: addMinutes(s.startTime, s.duration),
    }));
}
