---
name: comparison-post
description: Creates a data-driven comparison between protocols, tokens, strategies, or tools
tags: [content, comparison, analysis, data-driven, education]
agent: writer
var: >
  ${var} specifies what to compare. Required.
  Example: "Jupiter vs 1inch vs Paraswap" or "Solana LSTs: mSOL vs jitoSOL vs bSOL"
---

# comparison-post

> **Priority**: P3 (on-demand)
> **Output**: Comparison in `memory/content/comparisons/`

## Instructions

You are executing the **comparison-post** skill for the Writer agent.

### Step 1: Identify Subjects and Criteria

Parse `${var}` to determine subjects and appropriate comparison criteria.

Gather data for each subject:
```bash
curl -s "https://api.llama.fi/protocol/{slug}"
curl -s "https://api.coingecko.com/api/v3/coins/{id}?localization=false&market_data=true"
```

### Step 2: Build Comparison Matrix

Define criteria relevant to the comparison category:

**DEX comparison**: Volume, TVL, fees, supported pairs, UX, speed, slippage
**LST comparison**: APY, TVL, peg stability, validator set, DeFi integrations
**Lending comparison**: Interest rates, collateral types, liquidation thresholds, audit status

### Step 3: Write Comparison

```markdown
# {Subject A} vs {Subject B} vs {Subject C}: A Data-Driven Comparison

## TL;DR
{3-bullet summary: when to use each option}

## Comparison Table
| Criteria | Subject A | Subject B | Subject C |
|----------|-----------|-----------|-----------|
| TVL | $800M | $450M | $200M |
| ... | ... | ... | ... |

## Deep Dive

### {Criteria 1}: {Winner}
{Analysis with data}

### {Criteria 2}: {Winner}
{Analysis with data}

## When to Use Each
- **Use {A} when**: {specific scenarios}
- **Use {B} when**: {specific scenarios}
- **Use {C} when**: {specific scenarios}

## Bottom Line
{Nuanced conclusion — avoid declaring an overall "winner" without context}
```

### Step 4: Data Integrity

- All numbers must come from APIs, not memory
- Note the date of data collection (data changes fast in DeFi)
- Include methodology notes for derived metrics

### Step 5: Save

Write to `memory/content/comparisons/{slug}.md` with metadata.

### Anti-Patterns

- Do NOT declare a single "winner" without context. Best depends on use case.
- Do NOT compare on more than 10 criteria. Focus on what matters.
- Do NOT ignore weaknesses of any subject. Fair comparison requires honesty.

### Exit Codes

- `SKILL_OK` — comparison completed
- `SKILL_PARTIAL` — some data unavailable for certain subjects
- `SKILL_FAIL` — could not gather sufficient data

### Output

Commit message format: `writer: comparison-post — "{subjects}" ({N} criteria)`
