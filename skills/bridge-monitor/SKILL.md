---
name: bridge-monitor
description: Monitors cross-chain bridge activity, volumes, and security status
tags: [research, bridges, cross-chain, security, monitoring]
agent: researcher
var: >
  ${var} focuses on specific bridges. If set (e.g., "Wormhole"), track that bridge.
  If empty, monitor all major Solana bridges.
---

# bridge-monitor

> **Priority**: P1 (runs daily)
> **Schedule**: 15:00 UTC
> **Data sources**: DeFiLlama bridges API, bridge protocol APIs
> **Output**: Bridge reports in `memory/research/bridges/`

## Instructions

You are executing the **bridge-monitor** skill for the Researcher agent.

### Step 1: Load Configuration

Read `memory/research/bridges/config.json`:

```json
{
  "bridges": ["wormhole", "debridge", "allbridge", "mayan"],
  "alert_thresholds": {
    "volume_spike_multiplier": 3,
    "tvl_drop_pct": 20,
    "large_transfer_usd": 5000000
  },
  "last_scan": "ISO-8601"
}
```

### Step 2: Fetch Bridge Data

**DeFiLlama Bridges:**
```bash
curl -s "https://bridges.llama.fi/bridges?includeChains=true"
curl -s "https://bridges.llama.fi/bridge/{bridge_id}"
```

For each bridge:
- Total TVL / locked value
- 24h volume by chain
- Volume trends (7d, 30d)
- Supported chains and tokens

### Step 3: Security Monitoring

Check for:
- Unusual volume patterns (potential exploit in progress)
- Large single transactions (>$5M)
- TVL drops (>20% in 24h = potential exploit)
- Governance pauses or emergency actions
- Recent audit status

Use WebSearch for security incidents: `"{bridge_name}" exploit hack vulnerability {recent_date}`

### Step 4: Flow Analysis

Track capital flows between chains:
- Net flow direction (into Solana vs. out of Solana)
- Top tokens being bridged
- Average transfer size trends

### Step 5: Generate Report

```json
{
  "report_date": "2024-01-15",
  "bridges": [
    {
      "name": "Wormhole",
      "tvl_usd": 3200000000,
      "tvl_change_24h_pct": -2.1,
      "volume_24h_usd": 450000000,
      "volume_7d_avg_usd": 380000000,
      "solana_inflow_24h_usd": 25000000,
      "solana_outflow_24h_usd": 18000000,
      "net_flow_solana": 7000000,
      "security_status": "normal",
      "last_audit": "2024-01-01",
      "alerts": []
    }
  ],
  "aggregate": {
    "total_solana_inflow_24h": 45000000,
    "total_solana_outflow_24h": 32000000,
    "net_flow": 13000000,
    "trend": "net_positive"
  }
}
```

### Step 6: Save and Alert

1. Write to `memory/research/bridges/{YYYY-MM-DD}.json`
2. URGENT alert to guardian on TVL drops >20% (potential exploit)
3. Alert analyst on significant flow changes
4. Notify on large individual transfers

### Anti-Patterns

- Do NOT interact with bridge contracts. Monitor only.
- Do NOT dismiss TVL drops as "normal volatility" without investigation.
- Do NOT rely on a single data source for security monitoring.

### Exit Codes

- `SKILL_OK` — bridge monitoring complete
- `SKILL_PARTIAL` — some bridges not reachable
- `SKILL_FAIL` — critical failure

### Output

Commit message format: `researcher: bridge-monitor — net Solana flow ${net_flow} [{status}]`
