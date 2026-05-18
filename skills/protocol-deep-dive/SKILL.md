---
name: protocol-deep-dive
description: Comprehensive analysis of a specific DeFi protocol — mechanics, risks, tokenomics, and competitive position
tags: [research, protocol, analysis, defi, deep-dive]
agent: researcher
var: >
  ${var} is the protocol name or identifier to analyze. Required.
  Example: "Jupiter", "Kamino Finance", "Drift Protocol"
---

# protocol-deep-dive

> **Priority**: P2 (on-demand)
> **Data sources**: DeFiLlama, CoinGecko, GitHub, protocol docs, governance forums
> **Output**: Deep dive report in `memory/research/protocols/`

## Instructions

You are executing the **protocol-deep-dive** skill for the Researcher agent.

### Step 1: Identify Protocol

Resolve `${var}` to protocol identifiers:
```bash
curl -s "https://api.llama.fi/protocols" | jq '.[] | select(.name | ascii_downcase | contains("{query}"))'
```

Collect: DeFiLlama slug, CoinGecko ID, GitHub org, official website, docs URL.

### Step 2: Core Metrics

**TVL and growth:**
```bash
curl -s "https://api.llama.fi/protocol/{slug}"
```
Extract: current TVL, TVL history (7d, 30d, 90d trends), chain breakdown, TVL by pool/vault.

**Token data (if applicable):**
```bash
curl -s "https://api.coingecko.com/api/v3/coins/{coingecko_id}?localization=false&tickers=true&market_data=true&community_data=true&developer_data=true"
```
Extract: price, market cap, FDV, circulating supply, total supply, trading volume.

### Step 3: Technical Architecture

From docs and GitHub:
- What blockchain(s) is it deployed on?
- What programming language are the contracts in?
- Is the code audited? By whom? When?
- Is the code open source? License?
- Key dependencies (oracles, bridges, other protocols)

```bash
curl -s -H "Authorization: token ${GITHUB_TOKEN}" "https://api.github.com/orgs/{github_org}/repos?sort=pushed&per_page=10"
```

### Step 4: Risk Assessment

Evaluate:
- **Smart contract risk**: Audit status, code complexity, upgrade mechanisms
- **Oracle risk**: What price feeds are used? Single point of failure?
- **Governance risk**: Who controls upgrades? Timelock duration?
- **Liquidity risk**: How concentrated is TVL? Withdrawal mechanics?
- **Regulatory risk**: Is the protocol compliant? KYC requirements?

Score each risk dimension 1-5 (1=low risk, 5=critical).

### Step 5: Competitive Position

Compare to top 3 competitors in same category:
- TVL comparison
- Feature comparison
- Fee structure comparison
- User count / unique wallets
- Token performance comparison

### Step 6: Generate Report

```json
{
  "protocol": "Jupiter",
  "report_date": "2024-01-15",
  "category": "DEX Aggregator",
  "chains": ["Solana"],
  "metrics": {
    "tvl_usd": 800000000,
    "tvl_7d_change_pct": 12.3,
    "daily_volume_usd": 450000000,
    "unique_users_7d": 125000,
    "token_price": 1.23,
    "market_cap": 1500000000,
    "fdv": 12000000000
  },
  "architecture": {
    "contracts_language": "Rust (Anchor)",
    "audited": true,
    "auditors": ["OtterSec", "Neodyme"],
    "open_source": true,
    "oracles": ["Pyth", "Switchboard"]
  },
  "risk_scores": {
    "smart_contract": 2,
    "oracle": 2,
    "governance": 3,
    "liquidity": 1,
    "regulatory": 3,
    "overall": 2.2
  },
  "competitive_position": "Market leader in Solana DEX aggregation",
  "strengths": ["Best routing", "Highest volume", "Active development"],
  "weaknesses": ["Token FDV concern", "Concentration risk"],
  "opportunities": ["Perps growth", "Cross-chain expansion"],
  "threats": ["New aggregators", "Direct DEX competition"]
}
```

Write to `memory/research/protocols/{protocol_slug}.json` and post to analyst mesh.

### Anti-Patterns

- Do NOT copy marketing material as analysis. Be critical and objective.
- Do NOT skip risk assessment. Every protocol has risks.
- Do NOT present opinions as facts. Quantify where possible.

### Exit Codes

- `SKILL_OK` — deep dive complete
- `SKILL_PARTIAL` — some data sources unavailable
- `SKILL_FAIL` — could not identify or analyze protocol

### Output

Commit message format: `researcher: protocol-deep-dive — {protocol_name} (risk: {overall_score}/5)`
