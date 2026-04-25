# Execution Order

## Phase 1 — Designs (in progress)
- [x] Dashboard screen
- [ ] Calendar screen
- [ ] Stats screen
- [ ] Settings screen
- [ ] New Session modal
- [ ] New Session Type modal
- [ ] Availability Editor modal
- [ ] Smart Suggestions screen

## Phase 2 — API Backend
1. Prisma schema + migration (`apps/api/prisma/schema.prisma`)
2. `apps/api/lib/prisma.ts` singleton
3. Session Types routes (`GET /api/session-types`, `POST`, `PUT [id]`, `DELETE [id]`)
4. Availability routes (`GET /api/availability`, `PUT`)
5. Sessions routes (`GET /api/sessions`, `POST`, `PUT [id]`, `DELETE [id]`)
6. Suggestion algorithm (`apps/api/lib/suggestions.ts`)
7. `GET /api/suggestions` route
8. `GET /api/progress` route

## Phase 3 — Mobile App
1. Root layout: `QueryClientProvider`, `Stack` navigator
2. Tab layout: 4 tabs (Home, Calendar, Stats, Settings)
3. API client (`apps/mobile/lib/api.ts`) — typed fetch wrapper
4. TanStack Query hooks (`apps/mobile/hooks/use-sessions.ts`, etc.)
5. Dashboard screen
6. Calendar screen
7. Stats screen
8. Settings screen + Session Type list
9. New Session modal
10. New Session Type modal
11. Availability Editor modal
12. Smart Suggestions screen

## Phase 4 — Polish & Deliverables
1. Seed data (a few session types + past sessions for non-empty state)
2. Error states and loading skeletons
3. README.md (setup, env vars, assumptions)
4. ARCHITECTURE.md
5. Final git push + Loom recording
