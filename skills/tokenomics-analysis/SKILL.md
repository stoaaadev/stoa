---
name: tokenomics-analysis
description: Deep analysis of token economics — supply schedules, vesting, staking yields, and value accrual
tags: [research, tokenomics, supply, vesting, economics]
agent: researcher
var: >
  ${var} is the token to analyze. Required.
  Example: "JUP", "BONK", "DRIFT"
---

# tokenomics-analysis

> **Priority**: P2 (on-demand)
> **Data sources**: CoinGecko, token documentation, on-chain data
> **Output**: Tokenomics report in `memory/research/tokenomics/`

## Instructions

You are executing the **tokenomics-analysis** skill for the Researcher agent.

### Step 1: Gather Token Data

```bash
curl -s "https://api.coingecko.com/api/v3/coins/{coingecko_id}?localization=false&tickers=true&market_data=true&community_data=false&developer_data=false"
```

Extract: circulating supply, total supply, max supply, market cap, FDV.

### Step 2: Supply Analysis

- **Circulating ratio**: circulating / total supply
- **Inflation rate**: Projected annual supply increase
- **Vesting schedule**: Upcoming unlocks (fetch from token docs or TokenUnlocks)
- **Burn mechanisms**: Any deflationary mechanisms?
- **Staking ratio**: % of supply staked (reduces effective circulating)

### Step 3: Value Accrual

Assess how the token captures value:
- **Fee distribution**: Protocol fees to token holders?
- **Governance power**: Voting weight, proposal rights
- **Utility**: Required for protocol usage?
- **Buyback/burn**: Does protocol revenue reduce supply?

### Step 4: Comparable Analysis

Compare tokenomics to 3 similar tokens in the same category:
- FDV/TVL ratio
- Market cap / revenue ratio (if revenue-generating)
- Staking yield comparison
- Supply inflation comparison

### Step 5: Generate Report

```json
{
  "token": "JUP",
  "analysis_date": "2024-01-15",
  "supply": {
    "circulating": 1350000000,
    "total": 10000000000,
    "max": 10000000000,
    "circulating_pct": 13.5,
    "staked_pct": 45.0,
    "annual_inflation_pct": 8.5
  },
  "valuation": {
    "price": 1.23,
    "market_cap": 1660500000,
    "fdv": 12300000000,
    "fdv_to_mcap_ratio": 7.4
  },
  "value_accrual": {
    "fee_sharing": true,
    "buyback_burn": false,
    "governance": true,
    "utility": "fee discounts, voting",
    "accrual_score": 7
  },
  "upcoming_unlocks": [
    {"date": "2024-03-01", "amount": 500000000, "pct_of_circulating": 37.0, "recipient": "team"}
  ],
  "risk_factors": ["High FDV/MCap ratio", "Major unlock in 45 days"],
  "comparable_analysis": {}
}
```

Write to `memory/research/tokenomics/{token_symbol}.json` and alert analyst on major upcoming unlocks.

### Anti-Patterns

- Do NOT present tokenomics analysis as price prediction.
- Do NOT ignore vesting cliffs. They are critical supply events.
- Do NOT assume all circulating supply is liquid (staking locks matter).

### Exit Codes

- `SKILL_OK` — analysis complete
- `SKILL_PARTIAL` — some data unavailable
- `SKILL_FAIL` — could not analyze token

### Output

Commit message format: `researcher: tokenomics-analysis — {token} (circ: {pct}%, FDV/MCap: {ratio}x)`
