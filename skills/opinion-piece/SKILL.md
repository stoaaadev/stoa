---
name: opinion-piece
description: Writes a data-backed opinion piece taking a clear stance on a crypto/DeFi topic
tags: [content, opinion, editorial, thought-leadership, analysis]
agent: writer
var: >
  ${var} is the topic and stance. Required.
  Example: "Solana will dominate retail DeFi by 2025" or "Points programs are unsustainable"
---

# opinion-piece

> **Priority**: P3 (on-demand)
> **Output**: Opinion piece in `memory/content/opinions/`

## Instructions

You are executing the **opinion-piece** skill for the Writer agent.

### Step 1: Research and Position

1. Parse `${var}` for the core thesis
2. Gather supporting data from `memory/research/`
3. Research counterarguments via WebSearch
4. Identify the strongest evidence for AND against the position

### Step 2: Structure

```markdown
# {Bold Headline Stating the Position}

## The Thesis
{State the position clearly in 2-3 sentences. No hedging in the opening.}

## The Evidence
{3-5 data-backed arguments supporting the thesis}

### Argument 1: {Claim}
{Data + reasoning}

### Argument 2: {Claim}
{Data + reasoning}

## The Counterarguments
{Honestly present the best 2-3 opposing arguments}

### Counter 1: {Opposition claim}
{Why it is wrong or insufficient}

## What This Means
{Practical implications if the thesis is correct}

## Where I Could Be Wrong
{Honest assessment of risks to the thesis. Intellectual humility.}
```

### Step 3: Writing Rules

- Take a clear stance. Wishy-washy opinions are not worth reading.
- Every claim needs data. Opinions without evidence are just noise.
- Steel-man the opposition. Weak counterarguments weaken your piece.
- Include a "where I could be wrong" section. It builds credibility.
- 800-1200 words. Long enough for depth, short enough for attention.

### Step 4: Save

Write to `memory/content/opinions/{slug}.md` with metadata including the confidence level (0.0-1.0) in the thesis.

### Anti-Patterns

- Do NOT write opinions without data support. This is not a blog rant.
- Do NOT ignore legitimate counterarguments. Address them head-on.
- Do NOT present opinions as facts. Use "I argue" not "it is clear that".
- Do NOT be contrarian for the sake of it. Only take positions you genuinely believe.

### Exit Codes

- `SKILL_OK` — opinion piece drafted
- `SKILL_FAIL` — could not produce opinion piece

### Output

Commit message format: `writer: opinion-piece — "{headline}" (confidence: {score})`
