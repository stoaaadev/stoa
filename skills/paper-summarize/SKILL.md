---
name: paper-summarize
description: Deep-reads and summarizes a specific research paper or whitepaper into structured intelligence
tags: [research, papers, summary, analysis, intelligence]
agent: researcher
var: >
  ${var} is the paper URL or arxiv ID to summarize. Required.
  Example: "https://arxiv.org/abs/2401.12345" or "2401.12345"
---

# paper-summarize

> **Priority**: P2 (on-demand)
> **Data sources**: arxiv, Semantic Scholar, direct URL fetch
> **Output**: Structured summary in `memory/research/summaries/`

## Instructions

You are executing the **paper-summarize** skill for the Researcher agent.

### Step 1: Resolve Paper Source

Parse `${var}` to determine the paper source:
- If it matches `\d{4}\.\d{4,5}` — it is an arxiv ID
- If it is a URL to arxiv — extract the ID
- If it is any other URL — fetch directly

For arxiv papers:
```bash
curl -s "http://export.arxiv.org/api/query?id_list={arxiv_id}"
```

For other URLs:
```bash
curl -sL "{url}" -o /tmp/paper_content.html
```

Use WebFetch if the URL requires JavaScript rendering.

### Step 2: Extract Paper Metadata

Collect:
- Title
- Authors and affiliations
- Publication date
- Abstract
- References count
- Paper length (pages)

For arxiv, also fetch Semantic Scholar data:
```bash
curl -s "https://api.semanticscholar.org/graph/v1/paper/ArXiv:{arxiv_id}?fields=title,abstract,citationCount,influentialCitationCount,references,fieldsOfStudy,tldr,venue,year"
```

### Step 3: Deep Analysis

Read the abstract and available text to produce:

1. **Core Contribution** (2-3 sentences): What is the paper's main claim or innovation?
2. **Methodology** (2-3 sentences): How did they approach the problem?
3. **Key Results** (bullet points): What did they find or prove?
4. **Limitations** (bullet points): What are the acknowledged or apparent weaknesses?
5. **Relevance to Stoa** (1-2 sentences): How does this relate to our trading/DeFi/agent domain?
6. **Actionable Insights** (bullet points): What can we do with this knowledge?

### Step 4: Extract Key Figures and Data

Identify and describe:
- Key numerical results (performance metrics, benchmarks)
- Comparison tables (how this compares to prior work)
- Any formulas or algorithms that are directly implementable

### Step 5: Map Related Work

From the references and Semantic Scholar data:
1. Identify the 3-5 most relevant cited papers
2. Note if any cited work is already in our `memory/research/` archive
3. Flag papers we should read next (add to `memory/research/reading-queue.json`)

### Step 6: Save Summary

Write to `memory/research/summaries/{paper_id_or_slug}.json`:

```json
{
  "paper_id": "2401.12345",
  "title": "...",
  "authors": ["..."],
  "published": "2024-01-15",
  "url": "https://arxiv.org/abs/2401.12345",
  "summarized_at": "ISO-8601",
  "core_contribution": "...",
  "methodology": "...",
  "key_results": ["..."],
  "limitations": ["..."],
  "relevance_to_stoa": "...",
  "actionable_insights": ["..."],
  "key_data_points": {},
  "related_papers": [{"title": "...", "id": "...", "relevance": "..."}],
  "reading_time_estimate": "15 min",
  "complexity_level": "introductory | intermediate | advanced",
  "tags": ["defi", "mev", "solana"]
}
```

Post high-relevance summaries to analyst mesh.

### Anti-Patterns

- Do NOT reproduce entire sections verbatim. Summarize in your own words.
- Do NOT skip the limitations section. Every paper has weaknesses.
- Do NOT rate a paper's relevance without explaining why.
- Do NOT attempt to parse binary PDF content. Work with HTML/text versions.

### Exit Codes

- `SKILL_OK` — paper summarized successfully
- `SKILL_PARTIAL` — summary generated but some sections incomplete
- `SKILL_FAIL` — could not access or parse the paper

### Output

Commit message format: `researcher: paper-summarize — "{short_title}"`
