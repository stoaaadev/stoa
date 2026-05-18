---
name: community-growth
description: Tracks and analyzes community growth metrics across platforms for watched projects
tags: [social, community, growth, metrics, analysis]
agent: researcher
var: >
  ${var} specifies the project to analyze. If set, focus on that project.
  If empty, analyze all tracked projects.
---

# community-growth

> **Priority**: P2 (runs weekly)
> **Schedule**: Monday 11:00 UTC
> **Data sources**: CoinGecko, social platform APIs
> **Output**: Growth reports in `memory/social/growth/`

## Instructions

You are executing the **community-growth** skill for the Researcher agent.

### Step 1: Gather Baseline Metrics

For each tracked project:
```bash
curl -s "https://api.coingecko.com/api/v3/coins/{id}?localization=false&tickers=false&market_data=false&community_data=true&developer_data=true"
```

Extract:
- Twitter followers
- Reddit subscribers and active accounts
- Telegram members
- Discord members (if trackable)
- GitHub stars and contributors

Read previous week's data from `memory/social/growth/latest.json`.

### Step 2: Calculate Growth Rates

For each metric:
- Absolute change (this week - last week)
- Growth rate (% change)
- 4-week moving average growth rate
- Acceleration (is growth speeding up or slowing down?)

### Step 3: Benchmark Analysis

Compare growth rates to:
- Category average (e.g., all Solana DeFi projects)
- Market leaders (top 5 by TVL)
- Historical averages for same project

### Step 4: Generate Report

```json
{
  "report_date": "2024-01-15",
  "projects": [
    {
      "name": "Jupiter",
      "metrics": {
        "twitter_followers": {"current": 450000, "change": 12000, "growth_pct": 2.7},
        "discord_members": {"current": 120000, "change": 5000, "growth_pct": 4.3},
        "github_stars": {"current": 2500, "change": 150, "growth_pct": 6.4}
      },
      "overall_growth_score": 82,
      "trend": "accelerating",
      "vs_category_avg": "+45%",
      "notable": "Discord growth 2x category average"
    }
  ],
  "category_averages": {},
  "fastest_growing": "Project with highest composite growth",
  "declining": ["Projects with negative growth"]
}
```

### Step 5: Save and Distribute

1. Write to `memory/social/growth/{YYYY-MM-DD}.json`
2. Update `memory/social/growth/latest.json`
3. Alert analyst on projects with unusual growth acceleration
4. Alert on projects with declining community metrics

### Anti-Patterns

- Do NOT count bot followers. Look for organic growth signals.
- Do NOT compare absolute numbers across different-sized projects. Use growth rates.
- Do NOT treat social metrics as token price predictors directly.

### Exit Codes

- `SKILL_OK` — growth analysis complete
- `SKILL_PARTIAL` — some projects missing data
- `SKILL_FAIL` — critical failure

### Output

Commit message format: `researcher: community-growth — {N} projects, fastest: {project} (+{pct}%)`
