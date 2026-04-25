import { z } from "zod";
import { db } from "@/db";
import { availability } from "@/db/schema";
import { badRequest, handleError, ok, parseJson } from "@/lib/api";

const dayOfWeek = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

const timeStr = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:MM required");

const window = z.object({
  dayOfWeek,
  startTime: timeStr,
  endTime: timeStr,
  enabled: z.boolean(),
});

const putBody = z.object({
  windows: z.array(window).length(7),
});

const DEFAULTS = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  startTime: "09:00",
  endTime: "17:00",
  enabled: false,
}));

export async function GET() {
  try {
    const rows = await db.select().from(availability).orderBy(availability.dayOfWeek);
    if (rows.length === 7) return ok(rows);

    const inserted = await db
      .insert(availability)
      .values(DEFAULTS)
      .returning();
    return ok(inserted.sort((a, b) => a.dayOfWeek - b.dayOfWeek));
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: Request) {
  try {
    const parsed = await parseJson(req, putBody);
    if ("error" in parsed) return parsed.error;

    const days = new Set(parsed.data.windows.map((w) => w.dayOfWeek));
    if (days.size !== 7) {
      return badRequest("Each dayOfWeek (0..6) must appear exactly once");
    }

    for (const w of parsed.data.windows) {
      if (w.enabled && w.startTime >= w.endTime) {
        return badRequest(
          `Day ${w.dayOfWeek}: startTime must be earlier than endTime`,
        );
      }
    }

    const result = db.transaction((tx) => {
      tx.delete(availability).run();
      return tx.insert(availability).values(parsed.data.windows).returning().all();
    });

    return ok(result.sort((a, b) => a.dayOfWeek - b.dayOfWeek));
  } catch (err) {
    return handleError(err);
  }
}
