import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function badRequest(error: string, issues?: unknown) {
  return NextResponse.json({ error, issues }, { status: 400 });
}

export function notFound(error = "Not found") {
  return NextResponse.json({ error }, { status: 404 });
}

export function conflict(error: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status: 409 });
}

export function serverError(error = "Internal server error") {
  return NextResponse.json({ error }, { status: 500 });
}

export async function parseJson<T>(
  req: Request,
  schema: ZodSchema<T>,
): Promise<{ data: T } | { error: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { error: badRequest("Invalid JSON body") };
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      error: badRequest("Validation failed", result.error.issues),
    };
  }
  return { data: result.data };
}

export function parseQuery<T>(
  url: URL,
  schema: ZodSchema<T>,
): { data: T } | { error: NextResponse } {
  const obj: Record<string, string> = {};
  for (const [k, v] of url.searchParams) obj[k] = v;
  const result = schema.safeParse(obj);
  if (!result.success) {
    return { error: badRequest("Validation failed", result.error.issues) };
  }
  return { data: result.data };
}

export function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return badRequest("Validation failed", err.issues);
  }
  console.error(err);
  return serverError();
}
