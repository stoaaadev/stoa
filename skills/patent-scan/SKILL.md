---
name: patent-scan
description: Scans patent databases for blockchain, DeFi, and AI-agent related patent filings
tags: [research, patents, intellectual-property, legal, intelligence]
agent: researcher
var: >
  ${var} specifies patent search terms. If set (e.g., "automated market maker"),
  focus on that technology. If empty, scan default blockchain/DeFi terms.
---

# patent-scan

> **Priority**: P3 (runs weekly)
> **Schedule**: Thursday 08:00 UTC
> **Data sources**: USPTO API, Google Patents, WIPO
> **Output**: Patent reports in `memory/research/patents/`

## Instructions

You are executing the **patent-scan** skill for the Researcher agent.

### Step 1: Load Configuration

Read `memory/research/patents/config.json`:

```json
{
  "search_terms": ["blockchain consensus", "decentralized exchange", "automated market maker", "smart contract", "zero knowledge proof", "autonomous trading agent", "MEV protection", "liquidity pool"],
  "assignees_watch": ["Coinbase", "Circle", "Jump Trading", "Paradigm"],
  "last_scan": "ISO-8601",
  "known_patents": []
}
```

### Step 2: Query Patent Databases

**USPTO PatentsView API:**
```bash
curl -s "https://api.patentsview.org/patents/query" \
  -X POST -H "Content-Type: application/json" \
  -d '{"q":{"_and":[{"_text_any":{"patent_abstract":"{search_term}"}},{"_gte":{"patent_date":"{30_days_ago}"}}]},"f":["patent_number","patent_title","patent_abstract","patent_date","assignees"],"o":{"per_page":25}}'
```

**Google Patents (via search):**
Use WebSearch: `site:patents.google.com "{search_term}" blockchain after:{last_scan_date}`

### Step 3: Filter and Analyze

For each new patent filing:
1. Check if patent_number is in `known_patents` (dedup)
2. Score relevance to our domain (0.0-1.0)
3. Classify: utility_patent | design_patent | provisional
4. Identify assignee (company/individual)
5. Assess potential impact on open-source DeFi

```json
{
  "patent_number": "US20240012345A1",
  "title": "Method for Optimizing Automated Market Maker Curves",
  "filing_date": "2024-01-10",
  "assignee": "Jump Trading LLC",
  "abstract_summary": "Novel AMM curve design that reduces impermanent loss by 40%",
  "relevance_score": 0.8,
  "impact_assessment": "Could restrict innovation in concentrated liquidity designs",
  "category": "AMM | MEV | Consensus | Smart Contract | Oracle",
  "status": "filed | granted | rejected",
  "url": "https://patents.google.com/patent/US20240012345A1"
}
```

### Step 4: Assignee Intelligence

Track which companies are filing most aggressively in our space:
- Patent count by assignee (rolling 12 months)
- Technology focus areas per assignee
- Filing velocity trends

### Step 5: Save and Alert

1. Write to `memory/research/patents/{YYYY-MM-DD}.json`
2. Update `known_patents` in config
3. Alert on patents from watched assignees (potential competitive threat)
4. Notify on granted patents that could affect open-source DeFi

### Anti-Patterns

- Do NOT provide legal interpretation of patent claims. Report facts only.
- Do NOT assume a filed patent will be granted.
- Do NOT ignore international filings (WIPO, EPO).

### Exit Codes

- `SKILL_OK` — patent scan complete, N new filings found
- `SKILL_PARTIAL` — some databases unavailable
- `SKILL_EMPTY` — no new relevant patents
- `SKILL_FAIL` — critical failure

### Output

Commit message format: `researcher: patent-scan — {N} new filings [{top_assignee}]`
