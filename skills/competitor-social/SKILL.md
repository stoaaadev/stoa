---
name: competitor-social
description: Monitors competitor social media activity, engagement, and messaging strategy
tags: [social, competitors, monitoring, strategy, intelligence]
agent: scout
var: >
  ${var} specifies competitors to focus on. If set (e.g., "Jupiter,Drift"),
  track those projects. If empty, scan all tracked competitors.
---

# competitor-social

> **Priority**: P2 (runs daily)
> **Schedule**: 10:00 UTC
> **Data sources**: Twitter/X, Discord (public), Medium/blogs
> **Output**: Competitor social intel in `memory/social/competitors/`

## Instructions

You are executing the **competitor-social** skill for the Scout agent.

### Step 1: Load Competitor Accounts

Read `memory/social/competitors/accounts.json` for competitor social handles.

### Step 2: Track Competitor Activity

For each competitor, use WebSearch to find recent posts:
```
from:@{handle} since:{yesterday}
```

Track:
- Post frequency (posts per day)
- Engagement rate (avg likes+RTs / followers)
- Key announcements or product updates
- Marketing campaigns or promotions
- Community response and sentiment

### Step 3: Messaging Analysis

Identify:
- What features are competitors promoting?
- What narratives are they pushing?
- Any negative messaging about our space?
- Partnership or integration announcements
- Hiring activity (signals growth areas)

### Step 4: Generate Report

```json
{
  "report_date": "2024-01-15",
  "competitors": [
    {
      "name": "CompetitorX",
      "posts_today": 5,
      "avg_engagement": 2500,
      "key_announcements": ["Launched v3 with limit orders"],
      "messaging_themes": ["Speed", "Low fees", "User experience"],
      "sentiment_toward_them": "positive",
      "notable": "Announced $10M marketing budget"
    }
  ]
}
```

### Step 5: Save and Signal

1. Write to `memory/social/competitors/{YYYY-MM-DD}.json`
2. Alert analyst on major competitor announcements
3. Alert on competitor messaging shifts

### Anti-Patterns

- Do NOT engage with competitor content. Observe only.
- Do NOT spread misinformation about competitors.
- Do NOT access competitor private channels.

### Exit Codes

- `SKILL_OK` — competitor social scan complete
- `SKILL_PARTIAL` — some competitors not fully analyzed
- `SKILL_EMPTY` — no notable activity
- `SKILL_FAIL` — critical failure

### Output

Commit message format: `scout: competitor-social — {N} competitors, {M} notable announcements`
