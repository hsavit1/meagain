import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { sessionTypes, sessions } from "@/db/schema";
import { created, handleError, ok, parseJson } from "@/lib/api";

const createBody = z.object({
  name: z.string().min(1).max(80),
  category: z.string().min(1).max(40),
  priority: z.number().int().min(1).max(5),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().min(1).max(40),
});

export async function GET() {
  try {
    const rows = await db
      .select({
        id: sessionTypes.id,
        name: sessionTypes.name,
        category: sessionTypes.category,
        priority: sessionTypes.priority,
        color: sessionTypes.color,
        icon: sessionTypes.icon,
        createdAt: sessionTypes.createdAt,
        updatedAt: sessionTypes.updatedAt,
        completedCount: sql<number>`coalesce(sum(case when ${sessions.status} = 'completed' then 1 else 0 end), 0)`,
        scheduledCount: sql<number>`coalesce(sum(case when ${sessions.status} = 'scheduled' then 1 else 0 end), 0)`,
      })
      .from(sessionTypes)
      .leftJoin(sessions, eq(sessions.sessionTypeId, sessionTypes.id))
      .groupBy(sessionTypes.id)
      .orderBy(sessionTypes.createdAt);

    return ok(rows);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const parsed = await parseJson(req, createBody);
    if ("error" in parsed) return parsed.error;

    const [row] = await db
      .insert(sessionTypes)
      .values(parsed.data)
      .returning();
    return created(row);
  } catch (err) {
    return handleError(err);
  }
}
