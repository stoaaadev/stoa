---
name: regulatory-scan
description: Monitors regulatory developments affecting crypto, DeFi, and digital assets globally
tags: [research, regulatory, compliance, legal, intelligence]
agent: researcher
var: >
  ${var} focuses on a specific jurisdiction or topic. If set (e.g., "SEC enforcement",
  "EU MiCA"), narrow the scan. If empty, scan all major jurisdictions.
---

# regulatory-scan

> **Priority**: P1 (runs daily)
> **Schedule**: 12:00 UTC
> **Data sources**: Government websites, legal databases, news APIs, RSS feeds
> **Output**: Regulatory updates in `memory/research/regulatory/`

## Instructions

You are executing the **regulatory-scan** skill for the Researcher agent.

### Step 1: Load Watch List

Read `memory/research/regulatory/watchlist.json`:

```json
{
  "jurisdictions": ["US", "EU", "UK", "Singapore", "Hong_Kong", "Japan"],
  "agencies": ["SEC", "CFTC", "FinCEN", "ESMA", "MAS", "FCA"],
  "topics": ["stablecoin regulation", "DeFi enforcement", "token classification", "AML/KYC", "MiCA implementation"],
  "rss_feeds": [
    "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&type=&dateb=&owner=include&count=40&search_text=&action=getcompany&RSS",
    "https://www.federalregister.gov/api/v1/documents.rss?conditions%5Bagencies%5D%5B%5D=securities-and-exchange-commission"
  ],
  "last_scan": "ISO-8601"
}
```

### Step 2: Scan News Sources

Use WebSearch to find recent regulatory news:

```
"cryptocurrency regulation" OR "DeFi enforcement" OR "SEC crypto" OR "MiCA" site:reuters.com OR site:bloomberg.com OR site:coindesk.com
```

Filter to articles published since `last_scan`.

### Step 3: Check Official Sources

Fetch RSS feeds for new entries:
```bash
curl -s "{rss_feed_url}"
```

Check for:
- New enforcement actions
- Proposed rules or comment periods
- Final rules and implementation dates
- Guidance documents and no-action letters
- International coordination announcements

### Step 4: Impact Assessment

For each regulatory development:

```json
{
  "title": "SEC files suit against DEX protocol",
  "date": "2024-01-15",
  "jurisdiction": "US",
  "agency": "SEC",
  "type": "enforcement | proposed_rule | final_rule | guidance | legislation",
  "summary": "2-3 sentence summary",
  "impact_on_defi": "high | medium | low",
  "impact_details": "How this specifically affects our operations",
  "affected_protocols": ["Uniswap", "dYdX"],
  "affected_token_types": ["governance tokens", "LP tokens"],
  "timeline": "Immediate | 30 days | 6 months | 1 year",
  "action_items": ["Review our token interactions", "Monitor for similar actions on Solana"],
  "sources": ["url1", "url2"]
}
```

### Step 5: Save and Alert

1. Write to `memory/research/regulatory/{YYYY-MM-DD}.json`
2. Update `last_scan` in watchlist
3. Post high-impact items to guardian mesh (regulatory risk)
4. Post medium+ impact items to analyst mesh
5. Notify on enforcement actions and final rules

### Anti-Patterns

- Do NOT provide legal advice. Report facts and potential impacts only.
- Do NOT sensationalize regulatory actions. Stick to official sources.
- Do NOT ignore non-US jurisdictions. Crypto regulation is global.
- Do NOT speculate on future enforcement. Report what has happened.

### Exit Codes

- `SKILL_OK` — regulatory scan complete
- `SKILL_PARTIAL` — some sources unavailable
- `SKILL_EMPTY` — no new regulatory developments
- `SKILL_FAIL` — critical failure

### Output

Commit message format: `researcher: regulatory-scan — {N} developments [{jurisdictions}]`
