---
name: hashtag-track
description: Tracks trending hashtags and topics in the crypto/DeFi space across social platforms
tags: [social, hashtags, trending, topics, monitoring]
agent: scout
var: >
  ${var} specifies hashtags to focus on. If set (e.g., "#Solana,#DeFi"),
  track those specifically. If empty, scan for all trending crypto hashtags.
---

# hashtag-track

> **Priority**: P2 (runs every 6 hours)
> **Data sources**: Twitter/X trends, Reddit trending, Farcaster trending
> **Output**: Hashtag reports in `memory/social/hashtags/`

## Instructions

You are executing the **hashtag-track** skill for the Scout agent.

### Step 1: Load Tracked Hashtags

Read `memory/social/hashtags/config.json` for the list of hashtags and topics to monitor.

### Step 2: Scan Trending

Use WebSearch to identify currently trending crypto hashtags and topics.

Check DexScreener for trending tokens that may correlate:
```bash
curl -s "https://api.dexscreener.com/token-boosts/top/v1"
```

### Step 3: Track Volume and Velocity

For each tracked hashtag:
- Current mention volume (posts per hour)
- Volume change vs. 24h average
- Associated tokens and projects
- Top posts by engagement
- Geographic concentration if detectable

### Step 4: Detect New Trends

Flag hashtags that:
- Appeared for the first time with >100 uses in 6h
- Growth rate >5x normal for that hashtag
- Are associated with tokens not on our watchlist

### Step 5: Generate Report

```json
{
  "scan_time": "ISO-8601",
  "trending": [
    {
      "hashtag": "#SolanaDeFi",
      "volume_6h": 2500,
      "volume_change_pct": 180,
      "associated_tokens": ["SOL", "JUP", "RAY"],
      "top_post": {"author": "...", "text": "...", "engagement": 5000},
      "trend_status": "rising | peaking | declining"
    }
  ],
  "new_hashtags": [],
  "dead_hashtags": ["hashtags that dropped to near-zero"]
}
```

### Step 6: Save and Signal

1. Write to `memory/social/hashtags/{YYYY-MM-DD-HH}.json`
2. Post new/breakout hashtags to analyst mesh as narrative signals

### Anti-Patterns

- Do NOT conflate hashtag volume with genuine interest. Bots amplify hashtags.
- Do NOT treat trending hashtags as trading signals alone.
- Do NOT track non-crypto hashtags unless they intersect with our domain.

### Exit Codes

- `SKILL_OK` — hashtag tracking complete
- `SKILL_PARTIAL` — some platforms unavailable
- `SKILL_EMPTY` — no notable trending activity
- `SKILL_FAIL` — critical failure

### Output

Commit message format: `scout: hashtag-track — {N} trending, {M} new [{top_hashtag}]`
