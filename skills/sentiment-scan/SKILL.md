---
name: sentiment-scan
description: Quantitative sentiment analysis across social platforms, news, and on-chain signals
tags: [social, sentiment, analysis, quantitative, signals]
agent: analyst
var: >
  ${var} specifies the token or topic to analyze sentiment for.
  If set (e.g., "SOL"), focus on that token. If empty, scan all watched tokens.
---

# sentiment-scan

> **Priority**: P1 (runs every 4 hours)
> **Data sources**: Social APIs, news feeds, fear/greed indices, on-chain data
> **Output**: Sentiment scores in `memory/social/sentiment/`

## Instructions

You are executing the **sentiment-scan** skill for the Analyst agent.

### Step 1: Gather Multi-Source Sentiment

**Crypto Fear & Greed Index:**
```bash
curl -s "https://api.alternative.me/fng/?limit=7"
```

**DexScreener social signals:**
```bash
curl -s "https://api.dexscreener.com/token-boosts/top/v1"
```

**Social listening data:**
Read `memory/social/listening/` for latest social mention data.

**On-chain sentiment proxies:**
- Net DEX inflows/outflows (buying pressure)
- New wallet creation rate
- Staking/unstaking ratios

### Step 2: Compute Composite Sentiment Score

For each token, calculate:

| Signal | Weight | Range | Description |
|--------|--------|-------|-------------|
| Social sentiment | 25% | -1 to +1 | From social-listen data |
| News sentiment | 20% | -1 to +1 | From news articles about the token |
| Fear/Greed context | 15% | 0-100 | Overall market mood |
| On-chain flows | 20% | -1 to +1 | Net buying vs selling |
| Price momentum | 20% | -1 to +1 | 7d price trend relative to market |

Composite score: Weighted average normalized to -1.0 (extreme fear) to +1.0 (extreme greed).

### Step 3: Detect Sentiment Divergences

Flag when:
- **Bullish divergence**: Price down but sentiment improving (contrarian buy signal)
- **Bearish divergence**: Price up but sentiment deteriorating (contrarian sell signal)
- **Extreme reading**: Composite > 0.8 or < -0.8 (often precedes reversal)
- **Rapid shift**: Sentiment changed >0.3 in 24h (event-driven)

### Step 4: Generate Report

```json
{
  "scan_time": "ISO-8601",
  "market_fear_greed": 65,
  "market_fear_greed_label": "Greed",
  "tokens": {
    "SOL": {
      "composite_sentiment": 0.42,
      "label": "moderately_bullish",
      "components": {
        "social": 0.55,
        "news": 0.35,
        "onchain": 0.48,
        "momentum": 0.32
      },
      "divergence": null,
      "change_24h": 0.08
    }
  },
  "alerts": [
    {"token": "JUP", "type": "extreme_greed", "sentiment": 0.85, "risk": "potential top signal"}
  ]
}
```

### Step 5: Save and Alert

1. Write to `memory/social/sentiment/{YYYY-MM-DD-HH}.json`
2. Update `memory/social/sentiment/latest.json`
3. Post divergence alerts and extreme readings to analyst mesh
4. Notify on extreme sentiment readings

### Anti-Patterns

- Do NOT treat sentiment as a trading signal alone. It is one input among many.
- Do NOT confuse volume of discussion with positive sentiment.
- Do NOT react to single data points. Look for sustained shifts.

### Exit Codes

- `SKILL_OK` — sentiment scan complete
- `SKILL_PARTIAL` — some data sources unavailable
- `SKILL_FAIL` — critical failure

### Output

Commit message format: `analyst: sentiment-scan — market F&G {score}, {N} token alerts`
