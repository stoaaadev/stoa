---
name: viral-detect
description: Detects viral content, memes, and rapidly spreading narratives in the crypto space
tags: [social, viral, detection, memes, narratives]
agent: scout
var: >
  ${var} specifies the domain to monitor. If set (e.g., "Solana memecoins"),
  focus there. If empty, scan broadly.
---

# viral-detect

> **Priority**: P1 (runs every 2 hours)
> **Data sources**: Social APIs, DexScreener, meme trackers
> **Output**: Viral alerts in `memory/social/viral/`

## Instructions

You are executing the **viral-detect** skill for the Scout agent.

### Step 1: Define Virality Thresholds

A piece of content or narrative is "viral" if:
- >10x normal engagement rate for that author/channel
- >1000 engagements within 2 hours of posting
- Referenced by 5+ unrelated accounts within 4 hours
- Associated token price moved >10% following the content

### Step 2: Scan for Viral Content

**DexScreener boosted tokens** (often correlates with viral narratives):
```bash
curl -s "https://api.dexscreener.com/token-boosts/top/v1"
```

**WebSearch for trending crypto content:**
```
crypto viral OR trending OR "going viral" since:{2_hours_ago}
```

**Reddit rapid-growth posts:**
```bash
curl -s "https://www.reddit.com/r/solana/rising.json?limit=25" -H "User-Agent: stoa-bot/1.0"
```

### Step 3: Analyze Viral Events

For each detected viral event:
- **Content**: What is going viral?
- **Origin**: Where did it start?
- **Spread pattern**: Organic or coordinated?
- **Token impact**: Is it moving token prices?
- **Durability**: Flash-in-the-pan or sustained narrative?

### Step 4: Generate Alerts

```json
{
  "scan_time": "ISO-8601",
  "viral_events": [
    {
      "type": "meme | narrative | news | controversy | product_launch",
      "description": "New Solana memecoin BONK2 going viral on CT",
      "origin_platform": "twitter",
      "spread_velocity": "extreme",
      "engagement_total": 85000,
      "accounts_involved": 250,
      "tokens_affected": ["BONK2"],
      "price_impact_pct": 340,
      "organic_score": 0.6,
      "durability_estimate": "short | medium | long",
      "actionable": true
    }
  ]
}
```

### Step 5: Save and Signal

1. Write to `memory/social/viral/{YYYY-MM-DD-HH}.json`
2. IMMEDIATE alert to analyst mesh for actionable viral events
3. Alert guardian if viral event involves a protocol we use
4. Notify for high-impact viral events

### Anti-Patterns

- Do NOT chase every viral event. Most are noise.
- Do NOT confuse bot amplification with organic virality.
- Do NOT recommend trading based on viral events alone.
- Do NOT amplify unverified rumors or misinformation.

### Exit Codes

- `SKILL_OK` — viral detection complete
- `SKILL_PARTIAL` — some channels unavailable
- `SKILL_EMPTY` — no viral events detected
- `SKILL_FAIL` — critical failure

### Output

Commit message format: `scout: viral-detect — {N} viral events [{types}]`
