**Output: Link to loom**

**Overview**

Build an end-to-end mobile application using **Expo (React Native, TypeScript)** for the client and **Next.js (TypeScript)** for the backend API.

You will reference the provided Figma as an **aesthetic guide**. It contains only two example screens—not full mocks—so you should **implement the full app yourself while matching the general visual style, structure, and feel** shown in the examples.

**Figma:** https://www.figma.com/design/qoDYjaq7TMKYsdI793wGml/Smart-Session-Planner?node-id=0-1&t=fF0K7B30KzhsnIV1-1

We want to see your ability to design coherent screens, make reasonable UX decisions, implement the style with fidelity, and use AI effectively to accelerate development. We will ask about your workflow during the follow-up call.

**Time expectation:** ~2–4 days

**Submission:** GitHub repository only

---

## Requirements

### Tech Stack

- **Mobile app:** Expo (React Native, TypeScript)
- **Backend:** Next.js App Router with /api routes
- **Storage:** Any reasonable persistent option (SQLite, Postgres, Prisma, etc.)

### UI Requirement

Use the Figma as a **style reference** rather than strict mocks.

- Match the **overall aesthetic**, spacing sensibility, typography, and visual hierarchy.
- Create the additional screens needed for the assignment using the same style language.
- No need for pixel-perfect accuracy or animations.

---

## Core Features

### 1. Session Types

- Create/edit/delete session types
- Fields: name, category/tag, priority (1–5)
- Show count of completed sessions per type

### 2. User Availability

- User defines weekly availability windows (e.g., Mon: 7–9am, Sat: 10–2pm)
- Store and fetch these via your API

### 3. Scheduling & Smart Suggestions

- Create scheduled sessions (type, date/time, duration).
- List upcoming sessions.
- Avoid or clearly surface overlapping/conflicting sessions.
- Implement a **non-trivial suggestion algorithm** that proposes time slots based on:
  - User availability
  - Existing sessions
  - Priority
  - A simple spacing/fatigue heuristic (e.g., avoid clustering too many high-priority sessions in one day)
- Allow users to accept a suggested time to create a session.

### 4. Progress Summary

- Display overall stats (e.g., total scheduled, completed, breakdown by type).
- Include at least one derived metric (e.g., average spacing, streaks, etc.).

---

## Non-functional Expectations

- Clear project structure and organization
- Clean API design and reasonable data modeling
- Sensible UX inspired by the Figma examples
- Error handling where appropriate

---

## Deliverables

- GitHub repo containing:
  - Expo client
  - Next.js API
  - `README.md` with:
    - Setup instructions
    - Environment variables
    - Assumptions and limitations
  - `ARCHITECTURE.md` with brief high-level notes

We will ask about:

- How and where you used AI
- Where you chose _not_ to use AI
- Prompts/patterns that worked well
- How you validated or corrected AI outputs
- How you approached the scheduling algorithm and key trade-offs
