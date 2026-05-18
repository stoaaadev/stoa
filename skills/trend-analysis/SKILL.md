---
name: trend-analysis
description: Identifies emerging trends across crypto, tech, and DeFi by analyzing multiple data signals
tags: [research, trends, analysis, intelligence, market]
agent: researcher
var: >
  ${var} focuses the analysis on a specific domain. If set (e.g., "liquid staking",
  "AI agents"), deep-dive that trend. If empty, scan broadly across all domains.
---

# trend-analysis

> **Priority**: P1 (runs weekly)
> **Schedule**: Monday 08:00 UTC
> **Data sources**: CoinGecko, GitHub, Google Trends proxy, DeFiLlama, social APIs
> **Output**: Trend report in `memory/research/trends/`

## Instructions

You are executing the **trend-analysis** skill for the Researcher agent.

### Step 1: Load Previous Trends

Read `memory/research/trends/latest.json` to understand:
- Previously identified trends and their scores
- Trend trajectories (rising, peaking, declining, dead)
- Last analysis timestamp

### Step 2: Gather Multi-Source Signals

**A. DeFi TVL Trends:**
```bash
curl -s "https://api.llama.fi/v2/historicalChainTvl/Solana"
curl -s "https://api.llama.fi/protocols"
```
- Track 7d and 30d TVL changes by protocol and category
- Flag categories with >20% TVL growth in 7d

**B. Token Category Performance:**
```bash
curl -s "https://api.coingecko.com/api/v3/coins/categories"
```
- Identify top-performing categories by 7d market cap change
- Flag categories with >15% gain and >$100M market cap

**C. GitHub Developer Activity:**
```bash
curl -s -H "Authorization: token ${GITHUB_TOKEN}" "https://api.github.com/search/repositories?q=stars:>100+pushed:>{7_days_ago}&sort=stars&order=desc&per_page=30"
```
- Track trending repos in crypto/DeFi/AI categories
- Identify new repos with rapid star growth

**D. Social Volume:**
- Check `memory/research/social-signals.json` for trending topics
- Cross-reference with DexScreener trending:
```bash
curl -s "https://api.dexscreener.com/token-boosts/top/v1"
```

### Step 3: Trend Scoring

For each identified trend, compute a composite score:

| Signal | Weight | Metric |
|--------|--------|--------|
| TVL growth | 25% | 7d % change in category TVL |
| Token performance | 20% | 7d % price change of top tokens |
| Developer activity | 20% | New repos + commit velocity |
| Social volume | 20% | Mention count + sentiment |
| Institutional signals | 15% | Funding rounds + partnerships |

Score each 0.0-1.0, then compute weighted average.

### Step 4: Classify Trend Stage

For each trend, determine lifecycle stage:
- **Emerging** (score 0.3-0.5): Early signals, low awareness
- **Growing** (score 0.5-0.7): Accelerating adoption, increasing social volume
- **Peaking** (score 0.7-0.9): Maximum hype, potential overvaluation
- **Declining** (score dropping 2 consecutive weeks): Narrative fatigue

Compare to previous week's scores to determine trajectory (accelerating, stable, decelerating).

### Step 5: Generate Report

```json
{
  "report_date": "2024-01-15",
  "trends": [
    {
      "name": "Liquid Restaking",
      "score": 0.78,
      "stage": "growing",
      "trajectory": "accelerating",
      "key_signals": [
        "EigenLayer TVL +45% in 7d",
        "3 new LRT protocols launched",
        "Vitalik blog post on restaking"
      ],
      "top_tokens": ["EIGEN", "ETHFI", "REZ"],
      "top_protocols": ["EigenLayer", "EtherFi", "Renzo"],
      "risk_factors": ["Smart contract risk", "Circular dependency"],
      "relevance_to_solana": "Jito restaking gaining traction",
      "actionable": true
    }
  ],
  "new_trends": ["trends identified for the first time"],
  "dead_trends": ["trends that dropped below 0.2 score"],
  "meta": {
    "total_trends_tracked": 15,
    "data_sources_used": 5,
    "confidence": 0.8
  }
}
```

### Step 6: Save and Distribute

1. Write report to `memory/research/trends/{YYYY-MM-DD}.json`
2. Update `memory/research/trends/latest.json` with current state
3. Post top 3 trends to analyst mesh
4. Send notification summary via `./notify`

### Anti-Patterns

- Do NOT chase micro-trends that last < 1 week. Focus on sustained movements.
- Do NOT confuse price pumps with genuine trends. Look for fundamental backing.
- Do NOT overweight social signals. They are noisy and manipulable.
- Do NOT present trends as investment advice. Report data, not opinions.

### Exit Codes

- `SKILL_OK` — trend analysis complete, N trends identified
- `SKILL_PARTIAL` — some data sources unavailable
- `SKILL_EMPTY` — no significant trend changes detected
- `SKILL_FAIL` — critical failure

### Output

Commit message format: `researcher: trend-analysis — {N} trends tracked, {M} new [{top_trend}]`
