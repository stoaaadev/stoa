---
name: community-pulse
description: Measures community health and engagement across Discord, Twitter, and forums for tracked projects
tags: [research, community, engagement, social, health]
agent: researcher
var: >
  ${var} specifies which community to analyze. If set (e.g., "Jupiter community"),
  focus on that project. If empty, scan all tracked communities.
---

# community-pulse

> **Priority**: P2 (runs twice weekly)
> **Schedule**: Wednesday/Saturday 10:00 UTC
> **Data sources**: CoinGecko community data, social APIs, forum scraping
> **Output**: Community reports in `memory/research/community/`

## Instructions

You are executing the **community-pulse** skill for the Researcher agent.

### Step 1: Load Tracked Communities

Read `memory/research/community/tracked.json` for the list of projects and their social channels.

### Step 2: Gather Community Metrics

**CoinGecko community data:**
```bash
curl -s "https://api.coingecko.com/api/v3/coins/{id}?localization=false&tickers=false&market_data=false&community_data=true&developer_data=false"
```

Extract: twitter_followers, reddit_subscribers, telegram_channel_user_count.

**DexScreener social data:**
```bash
curl -s "https://api.dexscreener.com/tokens/v1/solana/{mint}"
```

Check for social links and community activity indicators.

### Step 3: Engagement Analysis

For each community, assess:
- **Growth rate**: Follower/member change since last scan
- **Activity level**: Messages/posts per day (if accessible)
- **Sentiment**: Positive/negative/neutral distribution
- **Key topics**: What is the community discussing?
- **Developer engagement**: Are team members active in community?

Health score (0-100):
- Growth rate (25%): >5% weekly = 25, 2-5% = 15, 0-2% = 10, negative = 0
- Activity (25%): Based on messages/day relative to community size
- Sentiment (25%): Based on positive/negative ratio
- Dev engagement (25%): Team presence and responsiveness

### Step 4: Generate Report

```json
{
  "report_date": "2024-01-15",
  "communities": [
    {
      "project": "Jupiter",
      "health_score": 82,
      "metrics": {
        "twitter_followers": 450000,
        "twitter_growth_7d_pct": 2.3,
        "discord_members": 120000,
        "telegram_members": 85000,
        "activity_level": "high",
        "sentiment": "positive"
      },
      "key_topics": ["JUP airdrop", "limit orders", "perps launch"],
      "notable_events": ["Community AMA scheduled for Friday"],
      "trend": "growing"
    }
  ]
}
```

### Step 5: Save and Distribute

1. Write to `memory/research/community/{YYYY-MM-DD}.json`
2. Alert on communities with rapidly declining health scores
3. Post significant community events to analyst mesh

### Anti-Patterns

- Do NOT join or interact with communities. Observe only via public APIs.
- Do NOT scrape private Discord channels or DMs.
- Do NOT conflate bot activity with genuine engagement.

### Exit Codes

- `SKILL_OK` — community pulse complete
- `SKILL_PARTIAL` — some communities not fully analyzable
- `SKILL_EMPTY` — no significant changes
- `SKILL_FAIL` — critical failure

### Output

Commit message format: `researcher: community-pulse — {N} communities analyzed`
