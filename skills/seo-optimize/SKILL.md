---
name: seo-optimize
description: Optimizes existing content for search engines — keywords, meta tags, structure, and readability
tags: [content, seo, optimization, search, marketing]
agent: writer
var: >
  ${var} is the path to the content file to optimize. Required.
  Example: "memory/content/articles/solana-defi-growth.md"
---

# seo-optimize

> **Priority**: P3 (on-demand)
> **Output**: Optimized content + SEO report

## Instructions

You are executing the **seo-optimize** skill for the Writer agent.

### Step 1: Analyze Current Content

Read the content file specified in `${var}`. Analyze:
- Current title and heading structure (H1, H2, H3)
- Word count and reading level
- Keyword usage and density
- Internal and external link count
- Meta description (from .meta.json if exists)

### Step 2: Keyword Research

Based on the content topic, identify:
- **Primary keyword**: Main search term to target
- **Secondary keywords** (3-5): Related terms
- **Long-tail keywords** (2-3): Specific phrases

Use WebSearch to check:
- What similar articles rank for
- "People also ask" type queries
- Related searches

### Step 3: Optimization Checklist

Score and fix each element:

| Element | Target | Current | Status |
|---------|--------|---------|--------|
| Title | Contains primary keyword, <60 chars | ... | pass/fail |
| Meta description | Contains keyword, 120-155 chars | ... | pass/fail |
| H1 | One H1 with primary keyword | ... | pass/fail |
| H2s | Include secondary keywords | ... | pass/fail |
| First paragraph | Contains primary keyword in first 100 words | ... | pass/fail |
| Keyword density | 1-2% for primary keyword | ... | pass/fail |
| Internal links | >= 2 links to related content | ... | pass/fail |
| External links | >= 2 authoritative sources | ... | pass/fail |
| Image alt text | All images have descriptive alt text | ... | pass/fail |
| URL slug | Short, contains keyword, kebab-case | ... | pass/fail |
| Readability | Flesch-Kincaid grade 8-10 | ... | pass/fail |

### Step 4: Apply Optimizations

Edit the content file with improvements:
- Rewrite title if needed
- Add/update meta description
- Restructure headings if needed
- Add keyword mentions naturally (no stuffing)
- Add internal links
- Improve readability of dense paragraphs

### Step 5: Save Report

Write SEO report to `memory/content/seo/{slug}-seo.json`:
```json
{
  "file": "...",
  "analyzed_at": "ISO-8601",
  "primary_keyword": "...",
  "score_before": 45,
  "score_after": 82,
  "changes_made": ["Rewrote title", "Added meta description", "Added 3 internal links"],
  "checklist_results": {}
}
```

### Anti-Patterns

- Do NOT keyword-stuff. Natural language always wins.
- Do NOT sacrifice readability for SEO. Human experience is priority.
- Do NOT change the core message or facts for SEO purposes.

### Exit Codes

- `SKILL_OK` — content optimized
- `SKILL_PARTIAL` — some optimizations could not be applied
- `SKILL_FAIL` — could not analyze content

### Output

Commit message format: `writer: seo-optimize — "{slug}" (score {before} -> {after})`
