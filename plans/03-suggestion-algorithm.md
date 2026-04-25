# Smart Suggestion Algorithm

## Goal

Propose N time slots (default 5) within the next `lookahead` days (default 14) that best fit:
1. The user's availability windows
2. Existing sessions (no overlaps)
3. Session type priority
4. Spacing/fatigue heuristic (avoid clustering high-priority sessions)

## Input

- `availability: Availability[]` — weekly windows per day-of-week
- `sessions: Session[]` — all sessions within the lookahead window (status != cancelled)
- `sessionTypes: SessionType[]` — all types, for priority + last-scheduled date

## Algorithm

```
candidates = []

for each day D in [today, today + lookahead]:
  dayOfWeek = D.getDay()
  window = availability.find(a => a.dayOfWeek == dayOfWeek && a.enabled)
  if (!window) continue

  for each sessionType T in sessionTypes:
    // Try to fit a default-duration slot (60 min) in the window
    slotStart = window.startTime
    while slotStart + 60 <= window.endTime:
      if no existing session overlaps [slotStart, slotStart+60] on day D:
        score = computeScore(T, D, sessions)
        candidates.push({ type: T, date: D, startTime: slotStart, score, reason })
      slotStart += 30  // 30-min stride

sort candidates by score DESC
return top N deduplicated (one slot per type per day)
```

## Score Function

```
score(type T, day D, sessions):
  // 1. Priority boost (higher priority = more urgent to schedule)
  priorityScore = T.priority * 20   // range 20–100

  // 2. Spacing bonus (days since last session of same type)
  lastSession = max(sessions where typeId == T.id and status == completed)
  daysSinceLast = lastSession ? daysBetween(lastSession.date, D) : 999
  spacingScore = min(daysSinceLast * 5, 50)   // cap at 50

  // 3. Load penalty (how many sessions already on day D)
  sessionsOnDay = sessions.filter(s => s.date == D).length
  loadPenalty = sessionsOnDay * 15

  // 4. High-priority clustering penalty
  highPriorityOnDay = sessions.filter(s => s.date == D && s.sessionType.priority >= 4).length
  clusterPenalty = T.priority >= 4 ? highPriorityOnDay * 25 : 0

  return priorityScore + spacingScore - loadPenalty - clusterPenalty
```

## Reason String Generation

```
daysSinceLast == 999  → "First {type} session — great time to start"
daysSinceLast >= 7    → "It's been {daysSinceLast} days since your last {type}"
daysSinceLast >= 3    → "Good spacing ({daysSinceLast} days) since last {type}"
sessionsOnDay == 0    → "Open day — no other sessions scheduled"
T.priority == 5       → "High-priority type — keep momentum"
default               → "Fits your {dayOfWeek} availability window"
```

## Key Trade-offs

- **Greedy, not optimal**: we rank individual slots independently rather than solving a global scheduling problem. Fast, explainable, good enough.
- **30-min stride**: balances suggestion variety vs. too many near-identical slots.
- **Single session type per slot**: avoids over-suggesting one dominant type.
- **No ML**: pure heuristic — easier to explain in the follow-up call, easier to unit test.
