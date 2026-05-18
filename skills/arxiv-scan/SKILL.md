---
name: arxiv-scan
description: Scans arxiv for new papers in crypto, DeFi, MEV, ZK, and AI-agent domains
tags: [research, papers, arxiv, academic, intelligence]
agent: researcher
var: >
  ${var} narrows the search to specific arxiv categories or keywords.
  If set (e.g., "zero-knowledge proofs"), focus on that topic. If empty, scan default categories.
---

# arxiv-scan

> **Priority**: P1 (runs daily)
> **Schedule**: 06:00 UTC
> **Data sources**: arxiv API, Semantic Scholar API
> **Output**: Research summaries to `memory/research/arxiv/`

## Instructions

You are executing the **arxiv-scan** skill for the Researcher agent.

### Step 1: Load Configuration

Read `memory/research/arxiv-config.json`. Expected schema:

```json
{
  "categories": ["cs.CR", "cs.AI", "q-fin.TR", "cs.DC", "cs.MA"],
  "keywords": ["blockchain", "defi", "mev", "zero-knowledge", "autonomous agent", "smart contract", "solana", "liquid staking"],
  "last_scan": "ISO-8601",
  "papers_seen": ["arxiv_id_1", "arxiv_id_2"]
}
```

If the file does not exist, initialize with the default categories and keywords above.

### Step 2: Query arxiv API

For each category, fetch recent papers:

```bash
curl -s "http://export.arxiv.org/api/query?search_query=cat:{category}+AND+(abs:blockchain+OR+abs:defi+OR+abs:cryptocurrency)&start=0&max_results=20&sortBy=submittedDate&sortOrder=descending"
```

Also run keyword-specific searches:

```bash
curl -s "http://export.arxiv.org/api/query?search_query=all:{keyword}&start=0&max_results=10&sortBy=submittedDate&sortOrder=descending"
```

Parse the Atom XML response to extract:
- `id` (arxiv ID)
- `title`
- `summary` (abstract)
- `published` date
- `authors`
- `categories`
- `links` (PDF URL)

### Step 3: Filter and Deduplicate

1. Remove any paper already in `papers_seen`
2. Filter to papers published since `last_scan`
3. Score each paper for relevance (0.0-1.0) based on:
   - **Keyword density**: How many of our keywords appear in title + abstract
   - **Category match**: Primary category in our watch list
   - **Recency**: Published within last 48h scores higher
   - **Citation potential**: Papers from known research groups score higher
4. Keep papers scoring >= 0.5 relevance

### Step 4: Enrich with Semantic Scholar

For top-scoring papers (relevance >= 0.7), fetch citation context:

```bash
curl -s "https://api.semanticscholar.org/graph/v1/paper/ArXiv:{arxiv_id}?fields=citationCount,influentialCitationCount,references.title,tldr"
```

Add the TLDR and citation count to the paper summary.

### Step 5: Generate Summaries

For each paper that passes filtering, produce a structured summary:

```json
{
  "arxiv_id": "2401.12345",
  "title": "...",
  "authors": ["Author A", "Author B"],
  "published": "2024-01-15",
  "categories": ["cs.CR", "cs.AI"],
  "abstract": "...",
  "our_summary": "2-3 sentence plain-English summary of key contribution and relevance to our domain",
  "relevance_score": 0.85,
  "key_findings": ["finding 1", "finding 2"],
  "implications": "How this could affect DeFi/trading/security",
  "pdf_url": "https://arxiv.org/pdf/2401.12345",
  "citations": 0,
  "tldr": "Semantic Scholar TLDR if available"
}
```

### Step 6: Save and Notify

1. Write all summaries to `memory/research/arxiv/{YYYY-MM-DD}.json`
2. Update `memory/research/arxiv-config.json` with new `last_scan` and appended `papers_seen`
3. If any paper scores >= 0.8 relevance, post to analyst mesh:

```json
{
  "from": "researcher",
  "to": "analyst",
  "type": "research",
  "data": {
    "research_type": "paper_summary",
    "title": "New paper: {title}",
    "summary": "{our_summary}",
    "relevance_score": 0.85,
    "sources": ["{pdf_url}"],
    "actionable": true
  }
}
```

4. Send notification via `./notify` for papers with relevance >= 0.9

### Anti-Patterns

- Do NOT download or parse full PDFs. Work with abstracts and metadata only.
- Do NOT spam the mesh with low-relevance papers. Quality over quantity.
- Do NOT fabricate summaries for papers you could not fetch. Mark them as "fetch_failed".
- Respect arxiv rate limits: max 1 request per 3 seconds.

### Exit Codes

- `SKILL_OK` — scan complete, N new papers found
- `SKILL_PARTIAL` — some queries failed, partial results saved
- `SKILL_EMPTY` — no new relevant papers found (this is fine)
- `SKILL_FAIL` — critical failure, could not query arxiv

### Output

Commit message format: `researcher: arxiv-scan — {N} new papers [{top_category}]`
