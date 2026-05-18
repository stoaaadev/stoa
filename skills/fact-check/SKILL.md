---
name: fact-check
description: Verifies factual claims in content against primary sources and on-chain data
tags: [content, fact-check, verification, quality, editorial]
agent: writer
var: >
  ${var} is the path to the content to fact-check. Required.
  Example: "memory/content/articles/solana-tvl-analysis.md"
---

# fact-check

> **Priority**: P1 (before any content is published)
> **Output**: Fact-check report in `memory/content/reviews/`

## Instructions

You are executing the **fact-check** skill for the Writer agent.

### Step 1: Extract Claims

Read the content file. Identify all verifiable claims:
- Numerical claims (prices, volumes, TVL, percentages)
- Date claims (events, launches, deadlines)
- Attribution claims ("X said Y", "according to Z")
- Comparative claims ("biggest", "first", "only")
- Causal claims ("because of X, Y happened")

### Step 2: Verify Each Claim

For numerical claims, check primary sources:
```bash
# Price data
curl -s "https://api.coingecko.com/api/v3/coins/{id}?localization=false&market_data=true"

# TVL data
curl -s "https://api.llama.fi/protocol/{slug}"

# Volume data
curl -s "https://api.dexscreener.com/tokens/v1/solana/{mint}"
```

For date/event claims:
- Check official project announcements
- Verify against blockchain timestamps

For attribution claims:
- Locate the original source
- Verify the quote is accurate (not paraphrased misleadingly)

### Step 3: Grade Each Claim

| Grade | Meaning |
|-------|---------|
| VERIFIED | Confirmed by primary source |
| APPROXIMATELY | Close but not exact (within 5% for numbers) |
| OUTDATED | Was true but data has changed |
| UNVERIFIABLE | Cannot confirm or deny |
| FALSE | Contradicted by primary source |

### Step 4: Generate Report

```json
{
  "file": "memory/content/articles/solana-tvl-analysis.md",
  "checked_at": "ISO-8601",
  "total_claims": 15,
  "verified": 11,
  "approximately": 2,
  "outdated": 1,
  "unverifiable": 1,
  "false": 0,
  "overall_accuracy": 0.93,
  "claims": [
    {
      "claim": "Solana TVL reached $5.2B",
      "location": "paragraph 2",
      "grade": "APPROXIMATELY",
      "actual": "Solana TVL was $5.15B at time of writing",
      "source": "https://api.llama.fi/v2/historicalChainTvl/Solana",
      "action": "Update to $5.15B or round to $5.2B with 'approximately'"
    }
  ],
  "recommendation": "publish | revise | hold"
}
```

- `publish`: Accuracy >= 0.9 and no FALSE claims
- `revise`: Accuracy >= 0.7 or has OUTDATED claims
- `hold`: Accuracy < 0.7 or has FALSE claims

### Step 5: Save

Write to `memory/content/reviews/{slug}-factcheck.json`.

### Anti-Patterns

- Do NOT skip checking "obvious" facts. Obvious errors are the most embarrassing.
- Do NOT mark something VERIFIED without actually checking a source.
- Do NOT block publication for APPROXIMATELY grades on fast-moving data.

### Exit Codes

- `SKILL_OK` — fact-check complete, recommendation: {publish/revise/hold}
- `SKILL_PARTIAL` — some claims could not be verified
- `SKILL_FAIL` — could not analyze content

### Output

Commit message format: `writer: fact-check — "{slug}" accuracy {pct}% ({recommendation})`
