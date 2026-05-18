---
name: airdrop-tracker
description: Tracks upcoming and recent airdrops, eligibility criteria, and claim deadlines
tags: [research, airdrops, tokens, opportunities, tracking]
agent: researcher
var: >
  ${var} filters to a specific chain or project. If set (e.g., "Solana airdrops"),
  focus there. If empty, scan all tracked airdrop opportunities.
---

# airdrop-tracker

> **Priority**: P2 (runs daily)
> **Schedule**: 13:00 UTC
> **Data sources**: DeFiLlama, social media, project announcements
> **Output**: Airdrop tracking in `memory/research/airdrops/`

## Instructions

You are executing the **airdrop-tracker** skill for the Researcher agent.

### Step 1: Load State

Read `memory/research/airdrops/tracked.json`:

```json
{
  "last_scan": "ISO-8601",
  "active_airdrops": [],
  "upcoming_airdrops": [],
  "completed_airdrops": []
}
```

### Step 2: Scan for Airdrop Signals

**Indicators to track:**
- Protocols with tokens announced but not yet launched
- Projects with points/rewards programs (pre-token)
- Governance proposals mentioning token distribution
- VC-backed projects without tokens (likely future airdrop)

Use WebSearch: `crypto airdrop 2024 upcoming solana defi`

Check DeFiLlama for protocols with high TVL but no token:
```bash
curl -s "https://api.llama.fi/protocols" | jq '[.[] | select(.chains | index("Solana")) | select(.symbol == "-" or .symbol == null)] | sort_by(-.tvl) | .[0:20]'
```

### Step 3: Track Active Airdrops

For each known active airdrop:
- Claim status (open, upcoming, expired)
- Claim deadline
- Eligibility criteria
- Estimated value per user
- Claim URL (verify authenticity)

### Step 4: Eligibility Analysis

For upcoming airdrops, analyze what actions might qualify:
- Protocol usage (swaps, deposits, borrows)
- Governance participation
- Testnet usage
- Community contributions
- NFT holdings or social engagement

### Step 5: Generate Report

```json
{
  "report_date": "2024-01-15",
  "active_claims": [
    {
      "project": "ProjectX",
      "token": "PROJX",
      "chain": "Solana",
      "claim_deadline": "2024-02-15",
      "estimated_value_usd": 500,
      "eligibility": "Used protocol before snapshot (Jan 1)",
      "claim_url": "https://claim.projectx.io",
      "verified": true
    }
  ],
  "upcoming": [
    {
      "project": "NoTokenYet",
      "chain": "Solana",
      "tvl_usd": 500000000,
      "has_points_program": true,
      "likelihood": "high",
      "qualifying_actions": ["Provide liquidity", "Trade >$1000"],
      "estimated_timeline": "Q2 2024"
    }
  ]
}
```

### Step 6: Save and Alert

1. Write to `memory/research/airdrops/tracked.json`
2. Alert on new claimable airdrops
3. Warn on approaching claim deadlines (7 days, 1 day before)
4. Post high-value opportunities to analyst mesh

### Anti-Patterns

- Do NOT link to unverified claim pages. Airdrop scams are rampant.
- Do NOT guarantee airdrop eligibility or value.
- Do NOT recommend financial actions to qualify for airdrops.
- ALWAYS warn about potential phishing risks.

### Exit Codes

- `SKILL_OK` — airdrop scan complete
- `SKILL_PARTIAL` — some data unverifiable
- `SKILL_EMPTY` — no new airdrop activity
- `SKILL_FAIL` — critical failure

### Output

Commit message format: `researcher: airdrop-tracker — {N} active, {M} upcoming`
