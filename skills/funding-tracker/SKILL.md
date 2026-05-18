---
name: funding-tracker
description: Tracks venture capital funding rounds, grants, and treasury allocations in the crypto ecosystem
tags: [research, funding, venture-capital, grants, intelligence]
agent: researcher
var: >
  ${var} focuses on a specific sector or investor. If set (e.g., "Solana ecosystem",
  "a16z portfolio"), narrow the scope. If empty, scan all crypto funding.
---

# funding-tracker

> **Priority**: P2 (runs twice weekly)
> **Schedule**: Monday/Thursday 09:00 UTC
> **Data sources**: Crunchbase (if available), DeFiLlama raises, crypto news, Twitter/X
> **Output**: Funding reports in `memory/research/funding/`

## Instructions

You are executing the **funding-tracker** skill for the Researcher agent.

### Step 1: Load State

Read `memory/research/funding/state.json`:

```json
{
  "last_scan": "ISO-8601",
  "known_rounds": ["round_id_1"],
  "tracked_investors": ["a16z", "Paradigm", "Multicoin", "Polychain", "Solana Ventures", "Jump Crypto"],
  "tracked_sectors": ["DeFi", "Infrastructure", "Gaming", "AI", "Social"]
}
```

### Step 2: Fetch Recent Raises

**DeFiLlama Raises API:**
```bash
curl -s "https://api.llama.fi/raises"
```

Filter to raises announced since `last_scan`.

**Supplement with news search:**
Use WebSearch: `"funding round" OR "series A" OR "seed round" crypto blockchain {date_range}`

### Step 3: Enrich Each Round

For each funding round, collect:
- Project name and description
- Round type (Pre-seed, Seed, Series A/B/C, Strategic, Grant)
- Amount raised (USD)
- Valuation (if disclosed)
- Lead investor(s)
- All participating investors
- Project category/sector
- Chain/ecosystem affiliation
- Token status (has token, planning token, no token)

### Step 4: Analysis

**Sector trends:**
- Total funding by sector (rolling 30 days)
- Average round size by sector
- Number of rounds by sector
- Compare to previous period

**Investor activity:**
- Most active investors this period
- New investor entries to crypto
- Investor sentiment (which sectors are they doubling down on?)

**Signal extraction:**
- Projects with >$10M raises in Solana ecosystem (potential new protocols)
- Investors making first crypto investment (signals mainstream adoption)
- Sectors with accelerating funding (leading indicator)

### Step 5: Generate Report

```json
{
  "report_date": "2024-01-15",
  "period": "2024-01-08 to 2024-01-15",
  "rounds": [
    {
      "project": "NewProtocol",
      "amount_usd": 25000000,
      "round_type": "Series A",
      "valuation_usd": 250000000,
      "lead_investor": "Paradigm",
      "investors": ["Paradigm", "Multicoin", "Solana Ventures"],
      "sector": "DeFi",
      "chain": "Solana",
      "description": "Cross-margin lending protocol",
      "relevance": "Direct competitor to MarginFi",
      "has_token": false
    }
  ],
  "summary": {
    "total_raised_usd": 340000000,
    "round_count": 18,
    "avg_round_size": 18888888,
    "top_sector": "DeFi",
    "top_investor": "a16z",
    "solana_specific_raises": 4
  }
}
```

### Step 6: Save and Distribute

1. Write to `memory/research/funding/{YYYY-MM-DD}.json`
2. Update state with known_rounds
3. Alert analyst on Solana ecosystem raises >$10M
4. Notify on raises from tracked investors

### Anti-Patterns

- Do NOT include unverified or rumored funding rounds without clearly marking them.
- Do NOT conflate grant programs with VC funding.
- Do NOT double-count rounds reported by multiple sources.

### Exit Codes

- `SKILL_OK` — funding scan complete, N rounds tracked
- `SKILL_PARTIAL` — some sources unavailable
- `SKILL_EMPTY` — no new funding rounds found
- `SKILL_FAIL` — critical failure

### Output

Commit message format: `researcher: funding-tracker — {N} rounds, ${total_raised} total [{top_sector}]`
