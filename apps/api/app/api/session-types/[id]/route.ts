import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { sessionTypes, sessions } from "@/db/schema";
import { handleError, notFound, ok, parseJson } from "@/lib/api";

const updateBody = z
  .object({
    name: z.string().min(1).max(80).optional(),
    category: z.string().min(1).max(40).optional(),
    priority: z.number().int().min(1).max(5).optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
    icon: z.string().min(1).max(40).optional(),
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

    const [updated] = await db
      .update(sessionTypes)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(sessionTypes.id, id))
      .returning();

    if (!updated) return notFound("Session type not found");
    return ok(updated);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  try {
    const { id } = await ctx.params;

    const sessionRows = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.sessionTypeId, id));

    const [deleted] = await db
      .delete(sessionTypes)
      .where(eq(sessionTypes.id, id))
      .returning({ id: sessionTypes.id });

    if (!deleted) return notFound("Session type not found");
    return ok({ success: true, deletedSessions: sessionRows.length });
  } catch (err) {
    return handleError(err);
  }
}
