---
name: ecosystem-map
description: Maps and tracks the ecosystem of protocols, integrations, and relationships within a blockchain
tags: [research, ecosystem, mapping, protocols, intelligence]
agent: researcher
var: >
  ${var} specifies the ecosystem to map. If set (e.g., "Solana DeFi", "Cosmos"),
  focus on that ecosystem. If empty, map the default Solana ecosystem.
---

# ecosystem-map

> **Priority**: P2 (runs weekly)
> **Schedule**: Wednesday 08:00 UTC
> **Data sources**: DeFiLlama, CoinGecko, GitHub, protocol docs
> **Output**: Ecosystem map in `memory/research/ecosystems/`

## Instructions

You are executing the **ecosystem-map** skill for the Researcher agent.

### Step 1: Load Existing Map

Read `memory/research/ecosystems/{ecosystem_slug}.json` for the previous map state.

### Step 2: Gather Protocol Data

Fetch all protocols for the target chain:
```bash
curl -s "https://api.llama.fi/protocols"
```

Filter by chain and categorize:
- **DEXes**: Jupiter, Raydium, Orca, Meteora, Phoenix
- **Lending**: MarginFi, Kamino, Solend, Drift
- **Liquid Staking**: Marinade, Jito, BlazeStake
- **Perps**: Drift, Zeta, Flash Trade
- **NFT/Gaming**: Tensor, Magic Eden
- **Infra**: Helius, Triton, Jito (MEV)

For each protocol, collect:
```bash
curl -s "https://api.llama.fi/protocol/{slug}"
```

Extract: TVL, TVL change 7d/30d, chains deployed, category, token (if any).

### Step 3: Map Integrations

Identify cross-protocol dependencies:
- Which protocols use Jupiter as a routing backend?
- Which lending protocols accept which LSTs?
- What yield strategies span multiple protocols?

Build an adjacency list of integrations.

### Step 4: Identify Gaps and Opportunities

Compare to other ecosystems (Ethereum, Arbitrum):
- What protocol categories exist on Ethereum but not Solana?
- Where is Solana TVL concentrated vs. distributed?
- Which categories are growing fastest?

### Step 5: Generate Map

```json
{
  "ecosystem": "Solana",
  "map_date": "2024-01-15",
  "total_tvl_usd": 5200000000,
  "tvl_change_7d_pct": 8.5,
  "protocol_count": 145,
  "categories": {
    "DEX": {
      "tvl_usd": 2100000000,
      "protocols": [{"name": "Jupiter", "tvl": 800000000, "tvl_change_7d": 12.3}],
      "trend": "growing"
    }
  },
  "integrations": [
    {"from": "Kamino", "to": "Jupiter", "type": "routing"},
    {"from": "MarginFi", "to": "Marinade", "type": "collateral"}
  ],
  "gaps": ["Options protocols underrepresented", "No major RWA protocol"],
  "emerging": ["Restaking growing 40% weekly"]
}
```

### Step 6: Save and Distribute

1. Write to `memory/research/ecosystems/{ecosystem_slug}.json`
2. Post summary to analyst mesh
3. Notify if major shifts detected (>20% TVL change in any category)

### Anti-Patterns

- Do NOT include dead protocols (TVL < $10K and no commits in 90 days).
- Do NOT fabricate integration relationships. Only map confirmed integrations.
- Do NOT make this a static snapshot. Focus on deltas from last week.

### Exit Codes

- `SKILL_OK` — ecosystem map updated
- `SKILL_PARTIAL` — some data sources unavailable
- `SKILL_FAIL` — critical failure

### Output

Commit message format: `researcher: ecosystem-map — {ecosystem} {N} protocols, TVL ${total}`
