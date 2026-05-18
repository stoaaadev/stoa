---
name: weekly-recap
description: Comprehensive weekly performance recap with portfolio review, trade analysis, and lessons learned
tags: [content, weekly, recap, performance, reporting]
agent: writer
var: >
  ${var} can set special focus areas for the recap. If empty, produce standard weekly recap.
---

# weekly-recap

> **Priority**: P1 (runs weekly)
> **Schedule**: Sunday 16:00 UTC
> **Output**: Weekly recap in `memory/content/recaps/`

## Instructions

You are executing the **weekly-recap** skill for the Writer agent.

### Step 1: Aggregate Weekly Data

Read and compile from the entire week:
- `memory/content/digests/` — all daily digests from the week
- `memory/tx-log.json` — all trades this week
- `memory/positions.json` — current positions
- `memory/portfolio-state.json` — portfolio state
- `memory/analyst-log.json` — signals and decisions
- `memory/risk-log.json` — risk events
- `memory/research/trends/latest.json` — trend context

### Step 2: Performance Analysis

Calculate:
- **Portfolio return**: Start-of-week value vs. end-of-week
- **Win rate**: Profitable trades / total trades
- **Best trade**: Highest return trade
- **Worst trade**: Lowest return trade
- **Sharpe ratio** (weekly): Risk-adjusted return
- **Max drawdown** during the week
- **Signal accuracy**: Analyst signals that were profitable vs. not

### Step 3: Write Recap

Structure (600-1000 words):

```markdown
# Weekly Recap — {start_date} to {end_date}

## Performance Summary
| Metric | Value | vs. Last Week |
|--------|-------|---------------|
| Portfolio Value | ${total} | {change}% |
| Week Return | {pct}% | {delta} |
| Trades | {N} | {delta} |
| Win Rate | {pct}% | {delta} |
| Max Drawdown | {pct}% | - |

## Market Context
{2-3 sentences on overall market this week}

## Trade Review
### Best: {token} +{pct}%
{What went right, entry/exit analysis}

### Worst: {token} -{pct}%
{What went wrong, lessons}

## Signal Quality
- Received: {N} signals
- Acted on: {M} ({pct}% acceptance)
- Profitable: {K} of {M} ({win_rate}%)
- Notable misses: {signals we should have acted on}

## Lessons Learned
1. {Concrete lesson from this week's activity}
2. {Another lesson}

## Next Week Plan
- {Key levels to watch}
- {Upcoming events (unlocks, votes, launches)}
- {Strategy adjustments based on lessons}
```

### Step 4: Save and Distribute

1. Write to `memory/content/recaps/{YYYY-WW}.md`
2. Post key metrics to mesh for all agents
3. Send notification summary via `./notify`

### Anti-Patterns

- Do NOT sugarcoat poor performance. Honest review drives improvement.
- Do NOT include hindsight trades ("we should have bought X"). Focus on process.
- Do NOT exceed 1000 words. Be analytical, not verbose.

### Exit Codes

- `SKILL_OK` — recap generated
- `SKILL_PARTIAL` — some data incomplete
- `SKILL_FAIL` — could not generate recap

### Output

Commit message format: `writer: weekly-recap — week {WW} return {pct}% (win rate {win_rate}%)`
