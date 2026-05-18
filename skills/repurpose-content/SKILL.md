---
name: repurpose-content
description: Transforms existing content into different formats for multiple platforms
tags: [content, repurpose, multi-platform, adaptation, efficiency]
agent: writer
var: >
  ${var} is the source content path and target format. Required.
  Example: "memory/content/articles/solana-defi.md -> thread,newsletter,tweet"
---

# repurpose-content

> **Priority**: P3 (on-demand)
> **Output**: Repurposed content in `memory/content/repurposed/`

## Instructions

You are executing the **repurpose-content** skill for the Writer agent.

### Step 1: Read Source Content

Read the source content file from `${var}`. Identify:
- Content type (article, thread, newsletter, research report)
- Key points and data
- Core narrative
- Target formats requested

### Step 2: Extract Core Elements

From the source, extract:
- **Headlines**: 3-5 potential headline variations
- **Key stats**: All numerical data points
- **Quotes**: Notable quotes or insights
- **Arguments**: Main arguments in bullet form
- **Visuals**: Any charts or image descriptions

### Step 3: Transform Per Format

**Article -> Thread**: Extract 5-8 key points, add hook, structure as tweet sequence
**Article -> Tweet**: Pick single most surprising stat or insight, compose single tweet
**Article -> Newsletter section**: Summarize in 100-200 words with "why it matters"
**Article -> Discord post**: Format with embeds, shorter paragraphs
**Thread -> Article**: Expand each tweet into a paragraph, add transitions and context
**Research -> Blog**: Simplify technical language, add narrative arc
**Any -> Summary**: 3-bullet TL;DR

### Step 4: Quality Check

For each repurposed piece:
- Does it stand alone? (Reader shouldn't need the original)
- Is it optimized for the target platform?
- Does it maintain factual accuracy?
- Is the tone appropriate for the platform?

### Step 5: Save

Write each repurposed piece to `memory/content/repurposed/{source_slug}-{format}.{ext}`:
```json
{
  "source": "memory/content/articles/solana-defi.md",
  "outputs": [
    {"format": "thread", "path": "memory/content/threads/solana-defi-repurposed.json"},
    {"format": "tweet", "path": "memory/content/tweets/solana-defi-repurposed.json"}
  ],
  "created_at": "ISO-8601"
}
```

### Anti-Patterns

- Do NOT just copy-paste and truncate. Each format needs genuine adaptation.
- Do NOT lose data accuracy in simplification.
- Do NOT create content that contradicts the source.

### Exit Codes

- `SKILL_OK` — content repurposed into {N} formats
- `SKILL_PARTIAL` — some formats could not be generated
- `SKILL_FAIL` — could not read or process source content

### Output

Commit message format: `writer: repurpose-content — "{source}" -> {N} formats`
