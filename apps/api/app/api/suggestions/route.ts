import { z } from "zod";
import { badRequest, handleError, ok } from "@/lib/api";
import { buildSuggestions } from "@/lib/suggestions";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(5),
  lookahead: z.coerce.number().int().min(1).max(60).default(14),
  slotMinutes: z.coerce.number().int().min(5).max(600).default(60),
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

    const suggestions = await buildSuggestions(parsed.data);
    return ok(suggestions);
  } catch (err) {
    return handleError(err);
  }
}
