---
name: content-calendar
description: Maintains a content publishing calendar with scheduled topics, deadlines, and status tracking
tags: [content, planning, calendar, scheduling, editorial]
agent: writer
var: >
  ${var} specifies the planning horizon. If set (e.g., "next 2 weeks"),
  plan for that period. If empty, plan for the next 7 days.
---

# content-calendar

> **Priority**: P2 (runs weekly)
> **Schedule**: Monday 07:00 UTC
> **Output**: Content calendar in `memory/content/calendar/`

## Instructions

You are executing the **content-calendar** skill for the Writer agent.

### Step 1: Review Current Calendar

Read `memory/content/calendar/current.json`:
```json
{
  "entries": [
    {
      "date": "2024-01-15",
      "type": "thread",
      "topic": "...",
      "status": "published | draft | planned | overdue",
      "skill": "write-thread",
      "priority": "P1"
    }
  ]
}
```

Mark overdue items. Check what was published vs. planned.

### Step 2: Identify Content Opportunities

Read recent research and trends:
- `memory/research/trends/latest.json` — hot topics
- `memory/research/funding/{recent}.json` — newsworthy raises
- `memory/research/governance/{recent}.json` — governance events
- Upcoming events (token unlocks, protocol launches)

Score each potential topic:
- **Timeliness** (1-5): Is this relevant now?
- **Audience interest** (1-5): Will people care?
- **Data availability** (1-5): Do we have unique data/insight?
- **Effort** (1-5, inverted): How much work to produce?

### Step 3: Plan Content Mix

Weekly content targets:
- 1 long-form article or blog post
- 2-3 Twitter threads
- 1 newsletter (if weekly)
- Daily digests (automated)
- 2-3 standalone tweets
- 1 Discord/Telegram update

Assign topics to slots, balancing:
- Variety (don't repeat same topic format)
- Cadence (spread content evenly across the week)
- Platform diversity (not all Twitter, not all long-form)

### Step 4: Generate Calendar

```json
{
  "week_of": "2024-01-15",
  "planned_pieces": 12,
  "entries": [
    {
      "date": "2024-01-15",
      "day": "Monday",
      "content": [
        {"type": "thread", "topic": "Solana TVL milestone", "skill": "write-thread", "priority": "P1"},
        {"type": "digest", "topic": "daily", "skill": "daily-digest", "priority": "P1"}
      ]
    }
  ],
  "backlog": [
    {"topic": "Deep dive on Jito restaking", "type": "article", "priority": "P3"}
  ]
}
```

### Step 5: Save

Write to `memory/content/calendar/current.json` and archive previous to `memory/content/calendar/{YYYY-WW}.json`.

### Anti-Patterns

- Do NOT plan more content than can be produced. 12-15 pieces/week max.
- Do NOT schedule content without available source material.
- Do NOT neglect platform diversity. Audiences differ across platforms.

### Exit Codes

- `SKILL_OK` — calendar planned
- `SKILL_PARTIAL` — some slots unfilled due to lack of topics
- `SKILL_FAIL` — could not generate calendar

### Output

Commit message format: `writer: content-calendar — week {WW} ({N} pieces planned)`
