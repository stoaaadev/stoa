---
name: governance-tracker
description: Monitors DAO governance proposals across key protocols for impactful votes and changes
tags: [research, governance, dao, voting, proposals]
agent: researcher
var: >
  ${var} focuses on a specific protocol's governance. If set (e.g., "Jupiter DAO"),
  track only that. If empty, scan all watched DAOs.
---

# governance-tracker

> **Priority**: P1 (runs daily)
> **Schedule**: 11:00 UTC
> **Data sources**: Snapshot API, Realms API (Solana), protocol governance forums
> **Output**: Governance updates in `memory/research/governance/`

## Instructions

You are executing the **governance-tracker** skill for the Researcher agent.

### Step 1: Load Watched DAOs

Read `memory/research/governance/watched-daos.json`:

```json
{
  "daos": [
    {
      "name": "Jupiter DAO",
      "platform": "snapshot | realms | tally | custom",
      "snapshot_space": "jup.eth",
      "realms_pubkey": "...",
      "forum_url": "https://forum.jup.ag",
      "token": "JUP"
    }
  ],
  "last_scan": "ISO-8601",
  "known_proposals": ["proposal_id_1"]
}
```

### Step 2: Fetch Active Proposals

**Snapshot (EVM DAOs):**
```bash
curl -s -X POST "https://hub.snapshot.org/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ proposals(where: {space: \"{space}\", state: \"active\"}, orderBy: \"created\", orderDirection: desc, first: 20) { id title body choices start end snapshot state scores scores_total quorum } }"}'
```

**Realms (Solana DAOs):**
```bash
curl -s "https://app.realms.today/api/splGovernance/proposals?programPublicKey={realms_pubkey}"
```

### Step 3: Analyze Proposals

For each new or active proposal:
1. **Classify type**: parameter_change | treasury_spend | token_emission | protocol_upgrade | partnership | other
2. **Assess impact**: How does this affect TVL, token price, user experience, or security?
3. **Track voting progress**: Current votes for/against, quorum status, time remaining
4. **Identify whales**: Are large token holders voting? Which direction?

Impact scoring:
- **Critical** (score 5): Protocol upgrade, major parameter change, large treasury spend
- **High** (score 4): Fee changes, new integrations, medium treasury spend
- **Medium** (score 3): Minor parameter tweaks, small grants
- **Low** (score 1-2): Administrative, cosmetic changes

### Step 4: Generate Updates

```json
{
  "scan_date": "2024-01-15",
  "active_proposals": [
    {
      "dao": "Jupiter DAO",
      "proposal_id": "...",
      "title": "JUP-42: Increase fee share to stakers",
      "type": "parameter_change",
      "status": "active",
      "impact_score": 4,
      "impact_summary": "Would increase JUP staking yield by ~2%, potentially attracting more stakers",
      "votes_for_pct": 78.5,
      "votes_against_pct": 21.5,
      "quorum_reached": true,
      "ends_at": "2024-01-18T00:00:00Z",
      "our_assessment": "Likely to pass. Bullish for JUP staking narrative.",
      "url": "https://snapshot.org/#/jup.eth/proposal/..."
    }
  ],
  "recently_passed": [],
  "recently_failed": [],
  "upcoming": []
}
```

### Step 5: Save and Alert

1. Write to `memory/research/governance/{YYYY-MM-DD}.json`
2. Update `known_proposals` in state file
3. Alert analyst mesh for critical/high impact proposals
4. Notify on proposals nearing deadline with close votes

### Anti-Patterns

- Do NOT vote or interact with governance contracts. Observe only.
- Do NOT speculate on vote outcomes. Report current data.
- Do NOT ignore failed proposals. They reveal community preferences.

### Exit Codes

- `SKILL_OK` — governance scan complete
- `SKILL_PARTIAL` — some DAOs could not be queried
- `SKILL_EMPTY` — no new or active proposals
- `SKILL_FAIL` — critical failure

### Output

Commit message format: `researcher: governance-tracker — {N} active proposals across {M} DAOs`
