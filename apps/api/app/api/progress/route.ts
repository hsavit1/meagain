import { and, asc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { sessions, sessionTypes } from "@/db/schema";
import { badRequest, handleError, ok } from "@/lib/api";
import { addDaysISO, diffDaysISO, todayISO } from "@/lib/time";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const querySchema = z.object({
  since: isoDate.optional(),
  until: isoDate.optional(),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const obj: Record<string, string> = {};
    for (const [k, v] of url.searchParams) obj[k] = v;

    const parsed = querySchema.safeParse(obj);
    if (!parsed.success) {
      return badRequest("Validation failed", parsed.error.issues);
    }

    const conditions = [
      parsed.data.since ? gte(sessions.date, parsed.data.since) : undefined,
      parsed.data.until ? lte(sessions.date, parsed.data.until) : undefined,
    ].filter(Boolean);

    const rows = await db
      .select({
        id: sessions.id,
        sessionTypeId: sessions.sessionTypeId,
        date: sessions.date,
        status: sessions.status,
        typeName: sessionTypes.name,
        typeColor: sessionTypes.color,
      })
      .from(sessions)
      .leftJoin(sessionTypes, eq(sessions.sessionTypeId, sessionTypes.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(sessions.date));

    let totalScheduled = 0;
    let totalCompleted = 0;
    let totalSkipped = 0;
    let totalCancelled = 0;
    const byTypeMap = new Map<
      string,
      {
        name: string;
        color: string;
        completed: number;
        scheduled: number;
        skipped: number;
      }
    >();

    for (const r of rows) {
      const id = r.sessionTypeId;
      const cur = byTypeMap.get(id) ?? {
        name: r.typeName ?? "Unknown",
        color: r.typeColor ?? "#999999",
        completed: 0,
        scheduled: 0,
        skipped: 0,
      };

      if (r.status === "completed") {
        totalCompleted++;
        cur.completed++;
      } else if (r.status === "skipped") {
        totalSkipped++;
        cur.skipped++;
      } else if (r.status === "cancelled") {
        totalCancelled++;
      } else {
        cur.scheduled++;
      }

      if (r.status !== "cancelled") totalScheduled++;
      byTypeMap.set(id, cur);
    }

    const completedRows = rows.filter((r) => r.status === "completed");
    const datesByType = new Map<string, string[]>();
    for (const r of completedRows) {
      const arr = datesByType.get(r.sessionTypeId) ?? [];
      arr.push(r.date);
      datesByType.set(r.sessionTypeId, arr);
    }

    let totalGap = 0;
    let gapCount = 0;
    for (const dates of datesByType.values()) {
      if (dates.length < 2) continue;
      const sorted = [...new Set(dates)].sort();
      for (let i = 1; i < sorted.length; i++) {
        totalGap += diffDaysISO(sorted[i], sorted[i - 1]);
        gapCount++;
      }
    }
    const avgSpacingDays = gapCount > 0 ? totalGap / gapCount : null;

    const completedDates = new Set(completedRows.map((r) => r.date));
    let currentStreakDays = 0;
    {
      let cursor = todayISO();
      while (completedDates.has(cursor)) {
        currentStreakDays++;
        cursor = addDaysISO(cursor, -1);
      }
    }

    const sortedCompletedDates = [...completedDates].sort();
    let longestStreakDays = 0;
    {
      let run = 0;
      let prev: string | null = null;
      for (const d of sortedCompletedDates) {
        if (prev && diffDaysISO(d, prev) === 1) run++;
        else run = 1;
        prev = d;
        if (run > longestStreakDays) longestStreakDays = run;
      }
    }

    const byType = [...byTypeMap.entries()].map(([typeId, v]) => ({
      typeId,
      name: v.name,
      color: v.color,
      completed: v.completed,
      scheduled: v.scheduled,
      skipped: v.skipped,
      total: v.completed + v.scheduled + v.skipped,
    }));

    return ok({
      totalScheduled,
      totalCompleted,
      totalSkipped,
      totalCancelled,
      completionRate: totalScheduled === 0 ? 0 : totalCompleted / totalScheduled,
      byType,
      avgSpacingDays:
        avgSpacingDays === null ? null : Math.round(avgSpacingDays * 10) / 10,
      currentStreakDays,
      longestStreakDays,
    });
  } catch (err) {
    return handleError(err);
  }
}
