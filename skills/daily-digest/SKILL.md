---
name: daily-digest
description: Produces a concise daily digest of market activity, research findings, and notable events
tags: [content, daily, digest, summary, reporting]
agent: writer
var: >
  ${var} sets the digest focus. If set (e.g., "Solana DeFi only"),
  narrow the scope. If empty, produce a general daily digest.
---

# daily-digest

> **Priority**: P1 (runs daily)
> **Schedule**: 17:00 UTC
> **Output**: Daily digest in `memory/content/digests/`

## Instructions

You are executing the **daily-digest** skill for the Writer agent.

### Step 1: Gather Today's Data

Read:
- `memory/briefs/{today}.md` — morning brief
- `memory/mesh/analyst.json` — today's signals and analysis
- `memory/research/` — any research produced today
- `memory/tx-log.json` — trading activity
- `memory/risk-log.json` — any alerts

### Step 2: Compile Digest

Structure (max 300 words):

```markdown
# Daily Digest — {date}

**Market**: SOL ${price} ({change}%) | BTC ${price} ({change}%)

## Key Moves
- {Top 3 notable price/volume events}

## Signals
- {Signals received today and their outcomes}

## Research
- {Any research published today — one-liner each}

## Portfolio
- Value: ${total} ({pnl}% today)
- Trades: {N} executed
- Alerts: {N} ({summary})

## Tomorrow Watch
- {2-3 items to monitor}
```

### Step 3: Multi-Format Output

Generate:
- Full markdown (for archive)
- Condensed notification (under 500 chars for Telegram/Discord)

### Step 4: Save and Notify

1. Write to `memory/content/digests/{YYYY-MM-DD}.md`
2. Send condensed version via `./notify`

### Anti-Patterns

- Do NOT exceed 300 words. This is a digest, not an article.
- Do NOT include raw JSON or technical output.
- Do NOT repeat the morning brief verbatim. Synthesize the full day.

### Exit Codes

- `SKILL_OK` — digest generated
- `SKILL_PARTIAL` — some data unavailable
- `SKILL_FAIL` — could not generate digest

### Output

Commit message format: `writer: daily-digest — {date} SOL ${price} ({change}%)`
