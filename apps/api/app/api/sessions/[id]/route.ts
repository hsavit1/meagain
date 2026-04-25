import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { sessions, sessionTypes } from "@/db/schema";
import {
  conflict,
  handleError,
  notFound,
  ok,
  parseJson,
} from "@/lib/api";
import { findConflicts } from "@/lib/conflicts";
import { addMinutes } from "@/lib/time";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const updateBody = z
  .object({
    sessionTypeId: z.string().min(1).optional(),
    title: z.string().min(1).max(120).optional(),
    date: isoDate.optional(),
    startTime: hhmm.optional(),
    duration: z.number().int().min(5).max(600).optional(),
    status: z.enum(["scheduled", "completed", "cancelled"]).optional(),
    notes: z.string().max(2000).nullable().optional(),
    force: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field must be provided",
  });

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: Request, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const parsed = await parseJson(req, updateBody);
    if ("error" in parsed) return parsed.error;
    const { force, ...patch } = parsed.data;

    const [existing] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id));
    if (!existing) return notFound("Session not found");

    const date = patch.date ?? existing.date;
    const startTime = patch.startTime ?? existing.startTime;
    const duration = patch.duration ?? existing.duration;

    const willChangeTime =
      patch.date !== undefined ||
      patch.startTime !== undefined ||
      patch.duration !== undefined;

    if (willChangeTime && !force && patch.status !== "cancelled") {
      const conflicts = await findConflicts({
        date,
        startTime,
        duration,
        excludeId: id,
      });
      if (conflicts.length) {
        return conflict("Session conflicts with existing sessions", {
          conflicts,
        });
      }
    }

    const [updated] = await db
      .update(sessions)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(sessions.id, id))
      .returning();

    const [type] = await db
      .select({
        id: sessionTypes.id,
        name: sessionTypes.name,
        color: sessionTypes.color,
        icon: sessionTypes.icon,
        priority: sessionTypes.priority,
      })
      .from(sessionTypes)
      .where(eq(sessionTypes.id, updated.sessionTypeId));

    return ok({
      ...updated,
      endTime: addMinutes(updated.startTime, updated.duration),
      sessionType: type,
    });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;
    const [deleted] = await db
      .delete(sessions)
      .where(eq(sessions.id, id))
      .returning({ id: sessions.id });
    if (!deleted) return notFound("Session not found");
    return ok({ success: true });
  } catch (err) {
    return handleError(err);
  }
}
