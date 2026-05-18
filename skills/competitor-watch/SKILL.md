---
name: competitor-watch
description: Monitors competitor projects for new releases, partnerships, TVL changes, and strategic moves
tags: [research, competitive-intelligence, monitoring, strategy]
agent: researcher
var: >
  ${var} specifies competitors to focus on. If set (e.g., "Marinade,Jito"),
  deep-dive those projects. If empty, scan all watched competitors.
---

# competitor-watch

> **Priority**: P2 (runs twice weekly)
> **Schedule**: Tuesday/Friday 10:00 UTC
> **Data sources**: GitHub API, DeFiLlama, CoinGecko, project blogs/RSS
> **Output**: Competitor intel in `memory/research/competitors/`

## Instructions

You are executing the **competitor-watch** skill for the Researcher agent.

### Step 1: Load Competitor List

Read `memory/research/competitor-list.json`:

```json
{
  "competitors": [
    {
      "name": "ProjectX",
      "github_org": "projectx-labs",
      "token": "PROJX",
      "coingecko_id": "projectx",
      "defillama_slug": "projectx",
      "website": "https://projectx.io",
      "rss_feed": "https://blog.projectx.io/rss",
      "twitter": "projectx_defi",
      "category": "DEX"
    }
  ]
}
```

If the file does not exist, create it with an empty competitors array and exit with `SKILL_EMPTY`.

### Step 2: GitHub Activity Scan

For each competitor's GitHub org:

```bash
curl -s -H "Authorization: token ${GITHUB_TOKEN}" "https://api.github.com/orgs/{github_org}/repos?sort=pushed&per_page=10"
```

Track:
- New repositories created since last scan
- Repos with significant recent commit activity (>10 commits in 7d)
- New releases or tags:
```bash
curl -s -H "Authorization: token ${GITHUB_TOKEN}" "https://api.github.com/repos/{org}/{repo}/releases?per_page=5"
```
- Open issues and PR velocity

### Step 3: On-Chain and Market Data

**TVL tracking:**
```bash
curl -s "https://api.llama.fi/protocol/{defillama_slug}"
```
- Current TVL and 7d/30d change
- TVL by chain breakdown
- New chain deployments

**Token performance:**
```bash
curl -s "https://api.coingecko.com/api/v3/coins/{coingecko_id}?localization=false&tickers=false&community_data=true&developer_data=true"
```
- Price, market cap, 7d/30d change
- Developer activity score
- Community metrics (Twitter followers, Reddit subscribers)

### Step 4: News and Announcements

Check for recent blog posts, announcements, partnership news:
- Fetch RSS feeds if configured
- Check for governance proposals (if DAO-governed)
- Look for new integrations or partnerships mentioned on their socials

### Step 5: Comparative Analysis

For each competitor, generate a delta report:

```json
{
  "name": "ProjectX",
  "report_date": "2024-01-15",
  "changes_since_last_scan": {
    "tvl_change_pct": 12.5,
    "tvl_current_usd": 150000000,
    "token_price_change_7d_pct": 8.3,
    "github_commits_7d": 45,
    "new_releases": ["v2.1.0 - Added limit orders"],
    "new_repos": [],
    "partnerships": ["Integrated with Wormhole"],
    "governance_proposals": [],
    "notable_events": ["Launched on Base chain"]
  },
  "threat_level": "low | medium | high",
  "threat_assessment": "ProjectX expanding to Base could pull liquidity from Solana",
  "opportunities": ["Their limit order feature suggests market demand we could capitalize on"]
}
```

### Step 6: Save and Alert

1. Write individual reports to `memory/research/competitors/{name}/{YYYY-MM-DD}.json`
2. Write consolidated summary to `memory/research/competitors/latest-summary.json`
3. For any competitor with `threat_level: "high"`, alert the analyst mesh
4. Send notification for significant strategic moves

### Anti-Patterns

- Do NOT stalk individual developers or contributors. Focus on public project metrics.
- Do NOT make value judgments about competitor quality. Report facts.
- Do NOT access private repositories or non-public data.
- Respect GitHub API rate limits: 5000 requests/hour with token.

### Exit Codes

- `SKILL_OK` — competitor scan complete, N competitors analyzed
- `SKILL_PARTIAL` — some competitors could not be fully analyzed
- `SKILL_EMPTY` — no significant changes detected
- `SKILL_FAIL` — critical failure

### Output

Commit message format: `researcher: competitor-watch — {N} competitors, {M} notable changes`
