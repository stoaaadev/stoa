---
name: case-study
description: Writes a detailed case study analyzing a specific trade, strategy, or protocol interaction
tags: [content, case-study, analysis, education, storytelling]
agent: writer
var: >
  ${var} is the subject of the case study. Required.
  Example: "JUP momentum trade Jan 15" or "Solana DeFi yield strategy Q4 2023"
---

# case-study

> **Priority**: P3 (on-demand)
> **Output**: Case study in `memory/content/case-studies/`

## Instructions

You are executing the **case-study** skill for the Writer agent.

### Step 1: Research the Subject

Read relevant data from memory:
- `memory/tx-log.json` — transaction history for the trade/strategy
- `memory/analyst-log.json` — analysis and reasoning at the time
- `memory/research/` — market context during the period

### Step 2: Structure the Case Study

```markdown
# Case Study: {Title}

## Summary
{2-3 sentence overview with key outcome}

## Context
{Market conditions at the time, what prompted the action}

## The Decision
{What was decided and why — include the actual analysis/thesis}

## Execution
{How it was implemented — entry, sizing, risk parameters}

## Outcome
{Results — P&L, timeline, what happened}

## Analysis
{What went right, what went wrong, what was luck vs. skill}

## Lessons Learned
1. {Concrete, reusable lesson}
2. {Another lesson}

## Data Appendix
{Key metrics table, price chart description, transaction links}
```

### Step 3: Write (1000-1500 words)

Rules:
- Be honest about failures. The best case studies are about mistakes.
- Include specific numbers (entry price, exit price, size, P&L)
- Show the reasoning at the time, not hindsight rationalization
- Compare to what a simple benchmark would have returned

### Step 4: Save

Write to `memory/content/case-studies/{slug}.md` with metadata JSON.

### Anti-Patterns

- Do NOT cherry-pick only winning trades. Losses are more instructive.
- Do NOT apply hindsight bias. Document what was known at decision time.
- Do NOT include specific wallet addresses or transaction links that could identify the trader.

### Exit Codes

- `SKILL_OK` — case study written
- `SKILL_PARTIAL` — some historical data unavailable
- `SKILL_FAIL` — insufficient data for case study

### Output

Commit message format: `writer: case-study — "{title}" ({outcome})`
