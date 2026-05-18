---
name: write-newsletter
description: Compiles a curated newsletter with market updates, research highlights, and actionable insights
tags: [content, newsletter, email, digest, publishing]
agent: writer
var: >
  ${var} sets the newsletter focus or edition type. If set (e.g., "DeFi weekly"),
  tailor the content. If empty, produce a general market newsletter.
---

# write-newsletter

> **Priority**: P1 (runs weekly)
> **Schedule**: Friday 14:00 UTC
> **Output**: Newsletter in `memory/content/newsletters/`

## Instructions

You are executing the **write-newsletter** skill for the Writer agent.

### Step 1: Gather Source Material

Read from memory:
- `memory/research/trends/latest.json` — trend data
- `memory/research/funding/{recent}.json` — funding rounds
- `memory/research/governance/{recent}.json` — governance updates
- `memory/research/arxiv/{recent}.json` — paper highlights
- `memory/briefs/{recent}.md` — market briefs
- `memory/research/security/{recent}.json` — security updates

### Step 2: Curate Top Stories

Select 5-7 stories based on:
- **Impact**: How many people does this affect?
- **Novelty**: Is this genuinely new information?
- **Actionability**: Can readers do something with this?

Rank and select. Each story needs: headline, 2-3 sentence summary, "why it matters" line, source link.

### Step 3: Write Newsletter

Structure:
```markdown
# {Newsletter Name} — Week of {date}

## TL;DR
- Bullet 1 (most important story)
- Bullet 2
- Bullet 3

## Top Stories

### 1. {Headline}
{2-3 paragraphs}
**Why it matters**: {one sentence}

### 2. {Headline}
...

## Data Corner
{One interesting data point or chart, with analysis}

## Research Spotlight
{Highlight one research finding or paper from the week}

## What to Watch
- {3-5 things to monitor next week}

---
{Footer with links, subscribe/unsubscribe}
```

**Word count**: 1000-1500 words total. Respect readers' time.

### Step 4: Generate Email-Ready Version

Create both:
- Markdown version (for blog/archive)
- Plain text version (for email)

### Step 5: Save

1. Write to `memory/content/newsletters/{YYYY-MM-DD}.md`
2. Write metadata to `memory/content/newsletters/{YYYY-MM-DD}.meta.json`
3. Notify via `./notify` with TL;DR section

### Anti-Patterns

- Do NOT rehash news everyone already knows. Add analysis and context.
- Do NOT exceed 1500 words. Newsletters that are too long get unsubscribed.
- Do NOT include more than 7 stories. Curation is the value.
- Do NOT use clickbait headlines. Be direct and accurate.

### Exit Codes

- `SKILL_OK` — newsletter generated
- `SKILL_PARTIAL` — some data sources missing, newsletter generated with gaps
- `SKILL_FAIL` — could not produce newsletter

### Output

Commit message format: `writer: write-newsletter — week of {date} ({N} stories, {word_count} words)`
