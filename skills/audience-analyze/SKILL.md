---
name: audience-analyze
description: Analyzes audience demographics, interests, and behavior patterns for content optimization
tags: [social, audience, analytics, demographics, strategy]
agent: researcher
var: >
  ${var} specifies the platform or audience segment. If set (e.g., "Twitter followers"),
  focus on that. If empty, analyze all platform audiences.
---

# audience-analyze

> **Priority**: P3 (runs monthly)
> **Schedule**: 1st of month, 09:00 UTC
> **Output**: Audience report in `memory/social/audience/`

## Instructions

You are executing the **audience-analyze** skill for the Researcher agent.

### Step 1: Gather Audience Data

Collect from all available sources:
- Content engagement data from `memory/content/analytics/`
- Social growth data from `memory/social/growth/`
- Notification delivery metrics from `memory/content/telegram/` and `memory/content/discord/`

### Step 2: Analyze Patterns

**Content preferences:**
- Which topics get highest engagement?
- Which formats (thread, article, tweet) perform best?
- What reading level resonates? (measure by engagement vs. complexity)

**Timing patterns:**
- When are audiences most active?
- Time zone distribution (infer from engagement timing)
- Weekday vs. weekend engagement

**Growth segments:**
- Where are new followers coming from (which content drives growth)?
- What is the retention rate (followers gained vs. lost)?
- What is the follower quality (engagement rate of new followers)?

### Step 3: Build Audience Personas

Define 2-3 audience personas:

```json
{
  "personas": [
    {
      "name": "DeFi Trader",
      "description": "Active Solana DeFi user, follows for alpha and market data",
      "interests": ["trading", "yield", "token analysis"],
      "preferred_format": "thread",
      "active_hours_utc": "14:00-22:00",
      "engagement_behavior": "likes data, shares alpha, ignores opinion pieces"
    }
  ]
}
```

### Step 4: Generate Report

```json
{
  "report_date": "2024-01-15",
  "audience_size": {
    "twitter": 15000,
    "discord": 5000,
    "telegram": 3000,
    "newsletter": 2000
  },
  "top_content_topics": ["market analysis", "protocol comparisons", "alpha"],
  "optimal_posting_times": {"twitter": "14:00 UTC", "discord": "16:00 UTC"},
  "personas": [],
  "recommendations": [
    "Increase data-heavy threads — 2x engagement vs. average",
    "Post between 14:00-16:00 UTC for maximum reach"
  ]
}
```

### Step 5: Save

Write to `memory/social/audience/{YYYY-MM}.json`.

### Anti-Patterns

- Do NOT collect personally identifiable information.
- Do NOT make audience assumptions without data backing.
- Do NOT over-segment a small audience. Minimum 1000 followers per segment.

### Exit Codes

- `SKILL_OK` — audience analysis complete
- `SKILL_PARTIAL` — some platform data unavailable
- `SKILL_FAIL` — insufficient data for analysis

### Output

Commit message format: `researcher: audience-analyze — {total_audience} total, {N} personas`
