---
name: influencer-track
description: Tracks crypto influencer activity, callouts, and portfolio changes
tags: [social, influencers, tracking, signals, intelligence]
agent: scout
var: >
  ${var} focuses on specific influencers or topics. If set (e.g., "CT whales"),
  narrow scope. If empty, track all watched influencers.
---

# influencer-track

> **Priority**: P2 (runs every 6 hours)
> **Data sources**: Twitter/X, YouTube, Farcaster, on-chain correlation
> **Output**: Influencer activity in `memory/social/influencers/`

## Instructions

You are executing the **influencer-track** skill for the Scout agent.

### Step 1: Load Influencer List

Read `memory/social/influencers/watchlist.json`:

```json
{
  "influencers": [
    {
      "name": "CryptoAnalyst",
      "twitter": "@cryptoanalyst",
      "category": "trader | researcher | founder | media",
      "follower_count": 500000,
      "reliability_score": 0.7,
      "known_wallets": []
    }
  ],
  "last_scan": "ISO-8601"
}
```

### Step 2: Track Recent Activity

For each influencer, use WebSearch:
```
from:@{twitter_handle} crypto OR token OR buy OR sell since:{last_scan_date}
```

Identify:
- Token callouts (mentions of specific tokens with positive/negative framing)
- Portfolio reveals or changes
- Market predictions or analysis
- Partnerships or sponsorship disclosures

### Step 3: Analyze Signal Quality

For each influencer, maintain a track record:
- Previous callouts and their 7d/30d performance
- Hit rate (% of callouts that were profitable within stated timeframe)
- Average return of callouts
- Disclosure quality (do they disclose bags?)

### Step 4: Generate Report

```json
{
  "scan_time": "ISO-8601",
  "notable_activity": [
    {
      "influencer": "CryptoAnalyst",
      "platform": "twitter",
      "action": "Bullish callout on TOKEN",
      "content_summary": "...",
      "engagement": 12000,
      "tokens_mentioned": ["TOKEN"],
      "historical_accuracy": 0.65,
      "reliability_score": 0.7
    }
  ],
  "consensus_tokens": ["tokens mentioned by 3+ influencers"],
  "contrarian_signals": ["tokens where influencers disagree"]
}
```

### Step 5: Save and Signal

1. Write to `memory/social/influencers/{YYYY-MM-DD}.json`
2. Update reliability scores based on callout outcomes
3. Post consensus signals (3+ influencers bullish on same token) to analyst
4. Flag potential coordinated pump signals to guardian

### Anti-Patterns

- Do NOT treat influencer callouts as trading signals. They are data points.
- Do NOT track private conversations or DMs. Public posts only.
- Do NOT assign high reliability to influencers without sufficient track record (min 10 callouts).
- Flag paid promotions and sponsored content separately.

### Exit Codes

- `SKILL_OK` — influencer tracking complete
- `SKILL_PARTIAL` — some influencers not reachable
- `SKILL_EMPTY` — no notable activity
- `SKILL_FAIL` — critical failure

### Output

Commit message format: `scout: influencer-track — {N} notable callouts [{consensus_tokens}]`
