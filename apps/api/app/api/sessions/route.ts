import { and, asc, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { sessions, sessionTypes } from "@/db/schema";
import {
  badRequest,
  conflict,
  created,
  handleError,
  ok,
  parseJson,
} from "@/lib/api";
import { findConflicts } from "@/lib/conflicts";
import { addMinutes } from "@/lib/time";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD required");
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:MM required");

const querySchema = z.object({
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  status: z.enum(["scheduled", "completed", "cancelled"]).optional(),
  typeId: z.string().optional(),
});

const createBody = z.object({
  sessionTypeId: z.string().min(1),
  title: z.string().min(1).max(120),
  date: isoDate,
  startTime: hhmm,
  duration: z.number().int().min(5).max(600),
  notes: z.string().max(2000).optional(),
  force: z.boolean().optional(),
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

    const { startDate, endDate, status, typeId } = parsed.data;
    const conditions = [
      startDate ? gte(sessions.date, startDate) : undefined,
      endDate ? lte(sessions.date, endDate) : undefined,
      status ? eq(sessions.status, status) : undefined,
      typeId ? eq(sessions.sessionTypeId, typeId) : undefined,
    ].filter(Boolean);

    const rows = await db
      .select({
        id: sessions.id,
        sessionTypeId: sessions.sessionTypeId,
        title: sessions.title,
        date: sessions.date,
        startTime: sessions.startTime,
        duration: sessions.duration,
        status: sessions.status,
        notes: sessions.notes,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt,
        type: {
          id: sessionTypes.id,
          name: sessionTypes.name,
          color: sessionTypes.color,
          icon: sessionTypes.icon,
          priority: sessionTypes.priority,
        },
      })
      .from(sessions)
      .leftJoin(sessionTypes, eq(sessions.sessionTypeId, sessionTypes.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(sessions.date), asc(sessions.startTime));

    return ok(
      rows.map(({ type, ...s }) => ({
        ...s,
        endTime: addMinutes(s.startTime, s.duration),
        sessionType: type,
      })),
    );
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const parsed = await parseJson(req, createBody);
    if ("error" in parsed) return parsed.error;

    const { force, ...data } = parsed.data;

    const typeExists = await db
      .select({ id: sessionTypes.id })
      .from(sessionTypes)
      .where(eq(sessionTypes.id, data.sessionTypeId))
      .limit(1);
    if (typeExists.length === 0) {
      return badRequest("sessionTypeId does not reference a session type");
    }

    if (!force) {
      const conflicts = await findConflicts({
        date: data.date,
        startTime: data.startTime,
        duration: data.duration,
      });
      if (conflicts.length) {
        return conflict("Session conflicts with existing sessions", {
          conflicts,
        });
      }
    }

    const [row] = await db.insert(sessions).values(data).returning();
    const [type] = await db
      .select({
        id: sessionTypes.id,
        name: sessionTypes.name,
        color: sessionTypes.color,
        icon: sessionTypes.icon,
        priority: sessionTypes.priority,
      })
      .from(sessionTypes)
      .where(eq(sessionTypes.id, row.sessionTypeId));

    return created({
      ...row,
      endTime: addMinutes(row.startTime, row.duration),
      sessionType: type,
    });
  } catch (err) {
    return handleError(err);
  }
}
