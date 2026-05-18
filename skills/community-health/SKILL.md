---
name: community-health
description: Comprehensive health check of community engagement, toxicity levels, and member satisfaction
tags: [social, community, health, moderation, quality]
agent: researcher
var: >
  ${var} specifies the community to analyze. If set (e.g., "Discord server"),
  focus there. If empty, analyze all community channels.
---

# community-health

> **Priority**: P2 (runs weekly)
> **Schedule**: Friday 10:00 UTC
> **Output**: Health report in `memory/social/health/`

## Instructions

You are executing the **community-health** skill for the Researcher agent.

### Step 1: Gather Community Metrics

Read from memory:
- `memory/social/growth/latest.json` — growth data
- `memory/social/mentions/` — mention sentiment
- `memory/social/listening/` — engagement data

### Step 2: Health Dimensions

Evaluate each dimension (0-100 score):

**Activity** (25%):
- Messages/posts per day
- Active members / total members ratio
- Peak vs. off-peak activity spread

**Sentiment** (25%):
- Positive vs. negative message ratio
- Toxicity level (hostile messages %)
- Constructive feedback vs. complaints

**Growth** (20%):
- New member rate
- Retention (members who stay active after joining)
- Churn (members who leave or go silent)

**Engagement Quality** (15%):
- Questions answered by community (not just team)
- Thread depth (replies per conversation)
- Content sharing behavior

**Team Responsiveness** (15%):
- Average response time to questions
- Unanswered question rate
- Team presence in community

### Step 3: Identify Issues

Flag:
- Toxicity above 5% of messages
- Declining activity trend (>10% drop week-over-week)
- High churn rate (>15% monthly)
- Spam wave indicators
- Unanswered question rate >20%

### Step 4: Generate Report

```json
{
  "report_date": "2024-01-15",
  "overall_health_score": 75,
  "dimensions": {
    "activity": {"score": 80, "trend": "stable"},
    "sentiment": {"score": 72, "trend": "declining"},
    "growth": {"score": 85, "trend": "growing"},
    "engagement_quality": {"score": 68, "trend": "stable"},
    "team_responsiveness": {"score": 70, "trend": "improving"}
  },
  "issues": [
    {"type": "sentiment_decline", "severity": "medium", "details": "Negative posts up 15% this week"}
  ],
  "recommendations": [
    "Address FUD about tokenomics directly in next AMA",
    "Increase team presence in Discord during EU hours"
  ]
}
```

### Step 5: Save and Alert

1. Write to `memory/social/health/{YYYY-MM-DD}.json`
2. Alert on health score drops >10 points
3. Alert on toxicity spikes
4. Post recommendations to writer/ops for action

### Anti-Patterns

- Do NOT moderate or take action directly. Report findings for human action.
- Do NOT read private messages or DMs.
- Do NOT ignore small communities. They need monitoring too.

### Exit Codes

- `SKILL_OK` — health check complete
- `SKILL_PARTIAL` — some channels not analyzable
- `SKILL_FAIL` — critical failure

### Output

Commit message format: `researcher: community-health — score {score}/100 [{trend}]`
