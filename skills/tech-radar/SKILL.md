---
name: tech-radar
description: Maintains a technology radar tracking adoption stages of emerging technologies relevant to DeFi and agents
tags: [research, technology, radar, adoption, emerging]
agent: researcher
var: >
  ${var} focuses on a specific technology domain. If set (e.g., "ZK technology",
  "AI inference"), deep-dive that domain. If empty, update the full radar.
---

# tech-radar

> **Priority**: P2 (runs biweekly)
> **Schedule**: 1st and 15th of month, 08:00 UTC
> **Data sources**: GitHub, arxiv, conference proceedings, blog posts
> **Output**: Tech radar in `memory/research/tech-radar/`

## Instructions

You are executing the **tech-radar** skill for the Researcher agent.

### Step 1: Load Current Radar

Read `memory/research/tech-radar/current.json`:

```json
{
  "last_updated": "ISO-8601",
  "rings": {
    "adopt": [],
    "trial": [],
    "assess": [],
    "hold": []
  }
}
```

Ring definitions:
- **Adopt**: Proven in production, recommended for use
- **Trial**: Worth pursuing, low risk to try in projects
- **Assess**: Worth exploring, understand how it affects you
- **Hold**: Proceed with caution, not recommended for new projects

### Step 2: Evaluate Technologies

For each technology on the radar and new candidates, assess:

**Maturity signals:**
- Production deployments (mainnet protocols using it)
- GitHub activity (stars, contributors, commit frequency)
- Academic citations (arxiv references)
- Conference talks and workshops
- Enterprise adoption signals

**Risk signals:**
- Known vulnerabilities or exploits
- Lack of audits
- Single-maintainer risk
- Breaking changes frequency

Categories to track:
- **Consensus**: new L1 mechanisms, L2 designs, rollup tech
- **Cryptography**: ZK-SNARKs, FHE, MPC, threshold signatures
- **Smart Contracts**: new languages, frameworks, testing tools
- **Infrastructure**: RPC providers, indexers, oracles
- **AI/ML**: LLM agents, on-chain ML, intent solvers
- **MEV**: protection mechanisms, order flow auctions

### Step 3: Movement Detection

Compare to previous radar:
- Which technologies moved rings? (e.g., assess -> trial)
- Which are new additions?
- Which should be removed (obsolete or abandoned)?

### Step 4: Generate Radar

```json
{
  "radar_date": "2024-01-15",
  "rings": {
    "adopt": [
      {
        "name": "Anchor Framework",
        "category": "Smart Contracts",
        "moved_from": null,
        "rationale": "De facto standard for Solana development",
        "key_metric": "90% of new Solana programs use Anchor"
      }
    ],
    "trial": [
      {
        "name": "Jito Bundles",
        "category": "MEV",
        "moved_from": "assess",
        "rationale": "Proven MEV protection, growing adoption",
        "key_metric": "60% of Solana transactions via Jito"
      }
    ],
    "assess": [],
    "hold": []
  },
  "movements": [
    {"tech": "Jito Bundles", "from": "assess", "to": "trial", "reason": "..."}
  ],
  "new_entries": [],
  "removed": []
}
```

### Step 5: Save and Distribute

1. Write to `memory/research/tech-radar/current.json`
2. Archive to `memory/research/tech-radar/{YYYY-MM-DD}.json`
3. Post ring movements to analyst mesh
4. Notify on technologies entering "adopt" ring

### Anti-Patterns

- Do NOT add technologies based on hype alone. Require evidence of real usage.
- Do NOT remove technologies without clear rationale (abandoned, superseded).
- Do NOT overload the radar. Max 40 technologies total.

### Exit Codes

- `SKILL_OK` — radar updated, N movements
- `SKILL_PARTIAL` — some assessments incomplete
- `SKILL_EMPTY` — no changes to radar
- `SKILL_FAIL` — critical failure

### Output

Commit message format: `researcher: tech-radar — {N} movements, {M} new entries`
