---
name: engagement-report
description: Analyzes engagement metrics for our own content across platforms
tags: [social, engagement, metrics, analytics, performance]
agent: writer
var: >
  ${var} specifies the time period or platform. If set (e.g., "last 7 days twitter"),
  narrow scope. If empty, analyze all platforms for last 7 days.
---

# engagement-report

> **Priority**: P2 (runs weekly)
> **Schedule**: Sunday 12:00 UTC
> **Output**: Engagement report in `memory/content/analytics/`

## Instructions

You are executing the **engagement-report** skill for the Writer agent.

### Step 1: Gather Published Content

Read all content published this period from:
- `memory/content/tweets/` — tweets published
- `memory/content/threads/` — threads published
- `memory/content/discord/` — Discord posts
- `memory/content/telegram/` — Telegram broadcasts

### Step 2: Collect Engagement Data

For each published piece, record:
- **Impressions**: How many people saw it
- **Engagements**: Likes, retweets, replies, saves
- **Engagement rate**: Engagements / impressions
- **Click-through rate**: Clicks / impressions (if tracked)
- **Follower change**: Net new followers attributable to the piece

### Step 3: Analyze Performance

**By content type:**
- Which format gets highest engagement rate?
- Which format gets most reach?
- Which format drives most follower growth?

**By topic:**
- Which topics resonate most?
- Which topics underperform expectations?

**By timing:**
- What time of day gets best engagement?
- Which day of week performs best?

### Step 4: Generate Report

```json
{
  "report_date": "2024-01-15",
  "period": "2024-01-08 to 2024-01-15",
  "summary": {
    "total_pieces_published": 15,
    "total_impressions": 125000,
    "total_engagements": 8500,
    "avg_engagement_rate": 6.8,
    "follower_change": 340
  },
  "top_performers": [
    {"type": "thread", "topic": "...", "engagement_rate": 12.5, "impressions": 45000}
  ],
  "worst_performers": [],
  "insights": [
    "Data-led threads outperform opinion threads by 2x",
    "Tuesday 14:00 UTC is optimal posting time"
  ],
  "recommendations": [
    "Increase thread output — highest ROI format",
    "Test more question-led hooks"
  ]
}
```

### Step 5: Save

Write to `memory/content/analytics/{YYYY-MM-DD}.json`. Post insights to content-calendar planning.

### Anti-Patterns

- Do NOT optimize purely for engagement. Quality and accuracy come first.
- Do NOT compare engagement across platforms without normalizing.
- Do NOT draw conclusions from <5 data points. Wait for statistical significance.

### Exit Codes

- `SKILL_OK` — engagement report generated
- `SKILL_PARTIAL` — some platform data unavailable
- `SKILL_FAIL` — could not generate report

### Output

Commit message format: `writer: engagement-report — {N} pieces, avg {rate}% engagement`
