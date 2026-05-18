---
name: social-listen
description: Monitors social media channels for mentions, sentiment, and emerging narratives in crypto
tags: [social, listening, monitoring, sentiment, intelligence]
agent: scout
var: >
  ${var} narrows the listening scope. If set (e.g., "Solana DeFi sentiment"),
  focus on that topic. If empty, listen across all tracked topics.
---

# social-listen

> **Priority**: P1 (runs every 2 hours)
> **Data sources**: Twitter/X API, Reddit API, Farcaster, Discord (public channels)
> **Output**: Social signals in `memory/social/listening/`

## Instructions

You are executing the **social-listen** skill for the Scout agent.

### Step 1: Load Configuration

Read `memory/social/listen-config.json`:

```json
{
  "keywords": ["solana", "SOL", "jupiter", "JUP", "raydium", "defi"],
  "influencers": ["@solana", "@JupiterExchange", "@aaboronkov"],
  "subreddits": ["solana", "defi", "cryptocurrency"],
  "min_engagement": 50,
  "last_scan": "ISO-8601"
}
```

### Step 2: Scan Twitter/X

Use WebSearch for recent high-engagement posts:
```
"{keyword}" min_faves:50 since:{yesterday} crypto OR defi OR solana
```

For each matching post, extract:
- Author, follower count, verified status
- Content text
- Engagement (likes, retweets, replies)
- Sentiment (positive/negative/neutral)
- Tokens mentioned

### Step 3: Scan Reddit

```bash
curl -s "https://www.reddit.com/r/{subreddit}/hot.json?limit=25" -H "User-Agent: stoa-bot/1.0"
```

Track:
- Posts with >100 upvotes mentioning tracked tokens
- Comment volume and sentiment
- New narratives or concerns

### Step 4: Aggregate Signals

Group mentions by:
- **Token**: Which tokens are being discussed most?
- **Sentiment**: What is the overall mood per token?
- **Narratives**: What stories/themes are emerging?
- **Influencers**: What are key opinion leaders saying?

### Step 5: Generate Report

```json
{
  "scan_time": "ISO-8601",
  "period_hours": 2,
  "mentions": {
    "SOL": {"count": 450, "sentiment": 0.65, "trend": "rising"},
    "JUP": {"count": 120, "sentiment": 0.72, "trend": "stable"}
  },
  "top_posts": [
    {
      "platform": "twitter",
      "author": "@whale_alert",
      "text": "...",
      "engagement": 5400,
      "sentiment": "positive",
      "tokens_mentioned": ["SOL"]
    }
  ],
  "emerging_narratives": ["Solana phone Chapter 2", "Jupiter launchpad"],
  "alerts": []
}
```

### Step 6: Save and Signal

1. Write to `memory/social/listening/{YYYY-MM-DD-HH}.json`
2. Post to analyst mesh if unusual sentiment shift detected (>20% change)
3. Post to analyst mesh for emerging narratives not seen before

### Anti-Patterns

- Do NOT interact with social posts. Observe only.
- Do NOT count bot accounts as genuine engagement.
- Do NOT overweight single viral posts. Look for sustained patterns.
- Respect API rate limits on all platforms.

### Exit Codes

- `SKILL_OK` — social listening complete
- `SKILL_PARTIAL` — some platforms unavailable
- `SKILL_EMPTY` — no notable activity
- `SKILL_FAIL` — critical failure

### Output

Commit message format: `scout: social-listen — {total_mentions} mentions, sentiment {avg_sentiment}`
