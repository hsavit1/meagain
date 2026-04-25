import { env } from "./env";
import type {
  Availability,
  ConflictRow,
  Persona,
  PersonaInfo,
  ProgressSummary,
  Session,
  SessionTypeWithCounts,
  Suggestion,
} from "./types";

const BASE = env.EXPO_PUBLIC_API_URL;

export class ApiError extends Error {
  status: number;
  body: unknown;
  conflicts?: ConflictRow[];

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
    if (
      body &&
      typeof body === "object" &&
      "conflicts" in body &&
      Array.isArray((body as { conflicts: unknown }).conflicts)
    ) {
      this.conflicts = (body as { conflicts: ConflictRow[] }).conflicts;
    }
  }
}

async function request<T>(
  path: string,
  init?: RequestInit & { query?: Record<string, string | number | undefined> },
): Promise<T> {
  const url = new URL(BASE + path);
  if (init?.query) {
    for (const [k, v] of Object.entries(init.query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const message =
      body && typeof body === "object" && "error" in body
        ? String((body as { error: string }).error)
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, message, body);
  }

  return body as T;
}

export const api = {
  sessionTypes: {
    list: () => request<SessionTypeWithCounts[]>("/api/session-types"),
    create: (body: {
      name: string;
      category: string;
      priority: number;
      color: string;
      icon: string;
    }) =>
      request<SessionTypeWithCounts>("/api/session-types", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (
      id: string,
      body: Partial<{
        name: string;
        category: string;
        priority: number;
        color: string;
        icon: string;
      }>,
    ) =>
      request<SessionTypeWithCounts>(`/api/session-types/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    remove: (id: string) =>
      request<{ success: true; deletedSessions: number }>(
        `/api/session-types/${id}`,
        { method: "DELETE" },
      ),
  },
  availability: {
    get: () => request<Availability[]>("/api/availability"),
    set: (windows: Omit<Availability, "id">[]) =>
      request<Availability[]>("/api/availability", {
        method: "PUT",
        body: JSON.stringify({ windows }),
      }),
  },
  sessions: {
    list: (query?: {
      startDate?: string;
      endDate?: string;
      status?: string;
      typeId?: string;
    }) => request<Session[]>("/api/sessions", { query }),
    create: (body: {
      sessionTypeId: string;
      title: string;
      date: string;
      startTime: string;
      duration: number;
      notes?: string;
      force?: boolean;
    }) =>
      request<Session>("/api/sessions", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (
      id: string,
      body: Partial<{
        sessionTypeId: string;
        title: string;
        date: string;
        startTime: string;
        duration: number;
        status: "scheduled" | "completed" | "skipped" | "cancelled";
        notes: string | null;
        force: boolean;
      }>,
    ) =>
      request<Session>(`/api/sessions/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    remove: (id: string) =>
      request<{ success: true }>(`/api/sessions/${id}`, { method: "DELETE" }),
  },
  suggestions: {
    list: (query?: { limit?: number; lookahead?: number; slotMinutes?: number }) =>
      request<Suggestion[]>("/api/suggestions", { query }),
  },
  progress: {
    get: (query?: { since?: string; until?: string }) =>
      request<ProgressSummary>("/api/progress", { query }),
  },
  dev: {
    listPersonas: () =>
      request<{ personas: PersonaInfo[] }>("/api/dev/seed"),
    seed: (persona: Persona) =>
      request<{ persona: Persona; types: number; sessions: number }>(
        "/api/dev/seed",
        { method: "POST", body: JSON.stringify({ persona }) },
      ),
  },
};
