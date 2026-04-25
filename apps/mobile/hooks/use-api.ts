import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const queryKeys = {
  sessionTypes: ["session-types"] as const,
  sessions: (filters?: Record<string, string | undefined>) =>
    ["sessions", filters ?? {}] as const,
  availability: ["availability"] as const,
  suggestions: (limit?: number) => ["suggestions", limit ?? 5] as const,
  progress: (range?: { since?: string; until?: string }) =>
    ["progress", range?.since ?? "all", range?.until ?? "all"] as const,
};

export function useSessionTypes() {
  return useQuery({
    queryKey: queryKeys.sessionTypes,
    queryFn: () => api.sessionTypes.list(),
  });
}

export function useSessions(filters?: {
  startDate?: string;
  endDate?: string;
  status?: string;
  typeId?: string;
}) {
  return useQuery({
    queryKey: queryKeys.sessions(filters),
    queryFn: () => api.sessions.list(filters),
  });
}

export function useAvailability() {
  return useQuery({
    queryKey: queryKeys.availability,
    queryFn: () => api.availability.get(),
  });
}

export function useSuggestions(limit = 5) {
  return useQuery({
    queryKey: queryKeys.suggestions(limit),
    queryFn: () => api.suggestions.list({ limit }),
    staleTime: 0,
  });
}

export function useProgress(range?: { since?: string; until?: string }) {
  return useQuery({
    queryKey: queryKeys.progress(range),
    queryFn: () =>
      api.progress.get(
        range?.since || range?.until
          ? { since: range.since, until: range.until }
          : undefined,
      ),
  });
}

export function useCreateSessionType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.sessionTypes.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sessionTypes });
    },
  });
}

export function useUpdateSessionType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof api.sessionTypes.update>[1];
    }) => api.sessionTypes.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sessionTypes });
      qc.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useDeleteSessionType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.sessionTypes.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sessionTypes });
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}

export function useSetAvailability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.availability.set,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.availability });
      qc.invalidateQueries({ queryKey: ["suggestions"] });
    },
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.sessions.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: queryKeys.sessionTypes });
      qc.invalidateQueries({ queryKey: ["progress"] });
      qc.invalidateQueries({ queryKey: ["suggestions"] });
    },
  });
}

export function useUpdateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof api.sessions.update>[1];
    }) => api.sessions.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: queryKeys.sessionTypes });
      qc.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.sessions.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: queryKeys.sessionTypes });
      qc.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}

export function usePersonas() {
  return useQuery({
    queryKey: ["personas"] as const,
    queryFn: () => api.dev.listPersonas().then((r) => r.personas),
    staleTime: Infinity,
  });
}

export function useSeedPersona() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.dev.seed,
    onSuccess: () => {
      qc.invalidateQueries();
    },
  });
}
