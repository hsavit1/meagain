# Mobile Screens Plan

## Navigation Structure

```
app/
  _layout.tsx              # Root Stack (anchor: tabs)
  (tabs)/
    _layout.tsx            # Tab bar: Home, Calendar, Stats, Settings
    index.tsx              # Dashboard
    calendar.tsx           # Calendar
    stats.tsx              # Stats
    settings.tsx           # Settings
  new-session.tsx          # Modal: create session
  new-session-type.tsx     # Modal: create/edit session type
  availability.tsx         # Modal: availability editor
  suggestions.tsx          # Screen: full suggestions list
```

## Screen Specs

### Dashboard (`(tabs)/index`)
- Status summary: "X sessions today · Y done"
- Today/Week toggle — filter session list
- Smart Suggestions horizontal scroll strip (2–3 cards, "See all" → suggestions screen)
- Today's Sessions list (colored dot + name + time + done checkmark)
- Progress card: Scheduled / Completed / Rate + avg spacing metric
- Tab bar: Home (active), Calendar, Stats, Settings

### Calendar (`(tabs)/calendar`)
- Header: "Calendar" + month label + "+" button → new-session modal
- Week strip (Mon–Sun, today circled in navy)
- Sessions list grouped by date (tap date in strip to jump)
- Each row: colored circle + name + time range
- Empty state: "No sessions — tap + to add one"
- FAB (bottom-right) → new-session modal

### Stats (`(tabs)/stats`)
- Period picker: Week / Month / All
- Stat cards row: Scheduled / Completed / Rate
- Type breakdown: list of session types with bar + count
- Derived metric: avg spacing in days (prominent display)
- Streak metric: "X-day streak"

### Settings (`(tabs)/settings`)
- Session Types section: list with color dot + name + priority badge + count
  - "New Type" button → new-session-type modal
  - Tap row → new-session-type modal pre-filled (edit)
  - Swipe-left to delete (with confirmation)
- Availability section: summary of enabled days → tap → availability modal

### New Session (`new-session`)
- Session type picker (horizontal scroll chips)
- Date picker (native DateTimePicker)
- Start time picker
- Duration picker (30 / 45 / 60 / 90 / 120 min chips)
- Notes text input (optional)
- "Save Session" button (navy)

### New Session Type (`new-session-type`)
- Name text input
- Category text input
- Priority slider 1–5 with labels
- Color picker (8 preset swatches)
- Icon picker (grid of lucide icon names)
- "Save Type" button

### Availability Editor (`availability`)
- 7 rows (Mon–Sun)
- Each row: day label + enabled toggle + start time + end time (collapsed when disabled)
- "Save" button → PUT /api/availability

### Smart Suggestions (`suggestions`)
- Full list of suggestion cards (lavender background)
- Each card: type name + date + time range + reason text
- "Accept" button → creates session via POST /api/sessions, pops screen
- "Adjust" button → opens new-session modal pre-filled with suggestion values

## Data Fetching Pattern

Use TanStack Query v5. One `QueryClient` in `app/_layout.tsx`.

```ts
// Query keys
['session-types']
['sessions', { startDate, endDate }]
['availability']
['suggestions']
['progress', { since }]
```

API base URL: `http://localhost:3000` (dev) → `process.env.EXPO_PUBLIC_API_URL`.

## Component Structure

```
components/
  session-card.tsx          # colored dot + name + time + status icon
  suggestion-card.tsx       # lavender card with reason + Accept/Adjust
  progress-card.tsx         # sky-blue summary card
  week-strip.tsx            # 7-day scroll with today highlight
  type-chip.tsx             # color dot + name pill for pickers
  stat-card.tsx             # number + label card for stats screen
  availability-row.tsx      # day toggle + time pickers row
```
