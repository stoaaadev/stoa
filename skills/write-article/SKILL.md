---
name: write-article
description: Writes a long-form article (800-2000 words) with structured arguments, data, and citations
tags: [content, writing, article, long-form, publishing]
agent: writer
var: >
  ${var} is the article topic or brief. Required.
  Example: "Solana DeFi ecosystem growth in Q1 2024"
---

# write-article

> **Priority**: P2 (on-demand)
> **Output**: Article draft in `memory/content/articles/`

## Instructions

You are executing the **write-article** skill for the Writer agent.

### Step 1: Research and Outline

1. Read `memory/research/` for relevant intelligence on the topic
2. Read `memory/content/style-guide.json` if it exists for tone/voice guidelines
3. Use WebSearch to find 3-5 supporting data points and sources

Build an outline:
- **Hook**: Opening that captures attention (question, statistic, or bold claim)
- **Context**: Why this matters now
- **Body** (3-5 sections): Core arguments with data
- **Analysis**: What the data means
- **Conclusion**: Forward-looking takeaway

### Step 2: Draft Article

Write 800-2000 words following the outline. Rules:
- Lead with the most important insight
- Every claim must have a data point or source
- Use subheadings for scanability
- Include at least 2 data visualizations described in text (charts, tables)
- Write for a technically literate audience (no basics explanation)
- Active voice, present tense where possible
- No filler phrases ("In today's world", "It's worth noting")

### Step 3: Add Metadata

```json
{
  "title": "...",
  "subtitle": "...",
  "author": "stoa",
  "date": "2024-01-15",
  "word_count": 1200,
  "reading_time_min": 5,
  "tags": ["solana", "defi", "analysis"],
  "seo_keywords": ["solana defi growth", "solana tvl"],
  "sources": [
    {"title": "...", "url": "...", "accessed": "2024-01-15"}
  ],
  "status": "draft"
}
```

### Step 4: Self-Review

Check the draft against:
- [ ] Does the headline promise what the article delivers?
- [ ] Is every factual claim sourced?
- [ ] Does it say something new (not just summarizing known facts)?
- [ ] Could any sentence be cut without losing meaning?
- [ ] Is the conclusion actionable or thought-provoking?

Revise based on the checklist.

### Step 5: Save

1. Write article to `memory/content/articles/{slug}.md`
2. Write metadata to `memory/content/articles/{slug}.meta.json`
3. Post to mesh for editorial review if configured

### Anti-Patterns

- Do NOT pad word count with filler. Shorter and tighter is better.
- Do NOT use jargon without context. Define terms on first use.
- Do NOT plagiarize. All text must be original synthesis.
- Do NOT include unverified claims or rumors as facts.

### Exit Codes

- `SKILL_OK` — article drafted successfully
- `SKILL_PARTIAL` — article drafted but some sources unavailable
- `SKILL_FAIL` — could not produce article

### Output

Commit message format: `writer: write-article — "{title}" ({word_count} words)`
