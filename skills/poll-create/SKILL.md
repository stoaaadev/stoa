---
name: poll-create
description: Creates engagement polls for social media platforms based on current topics and data
tags: [social, polls, engagement, community, content]
agent: writer
var: >
  ${var} is the poll topic or question. Required.
  Example: "What DeFi strategy are you most bullish on?" or "Solana vs Ethereum DEX volume"
---

# poll-create

> **Priority**: P3 (on-demand)
> **Output**: Poll drafts in `memory/content/polls/`

## Instructions

You are executing the **poll-create** skill for the Writer agent.

### Step 1: Design the Poll

Parse `${var}` and determine:
- **Purpose**: Engagement, market research, community input, education
- **Platform**: Twitter (max 4 options), Discord (reactions-based), Telegram

### Step 2: Craft the Question

Rules for good poll questions:
- Clear and unambiguous
- All options are mutually exclusive
- No "right answer" that makes voting boring
- Touches on a current topic of discussion
- Under 200 chars for the question

### Step 3: Create Options

Generate 2-4 options (platform dependent):
- Each option under 25 chars (Twitter limit)
- Include a mix of expected and surprising options
- Avoid "Other" as an option (useless data)
- Order options to avoid position bias (most interesting first)

### Step 4: Add Context

Write a lead-in text that provides context without biasing votes:
- Include a data point that makes the poll interesting
- Explain why this question matters now

### Step 5: Save

```json
{
  "question": "Which Solana DeFi category will see the most growth in Q2?",
  "options": ["DEXes", "Lending", "Restaking", "Perps"],
  "lead_in": "Solana DeFi TVL grew 45% in Q1. But where is the growth heading next?",
  "platform": "twitter",
  "purpose": "market_research",
  "duration_hours": 24,
  "optimal_post_time": "14:00 UTC",
  "created_at": "ISO-8601",
  "status": "draft"
}
```

Write to `memory/content/polls/{timestamp}.json`.

### Anti-Patterns

- Do NOT create polls with obvious/boring answers.
- Do NOT use polls to push a specific narrative.
- Do NOT create polls more than twice per week (engagement fatigue).

### Exit Codes

- `SKILL_OK` — poll created
- `SKILL_FAIL` — could not create meaningful poll

### Output

Commit message format: `writer: poll-create — "{question}" ({N} options, {platform})`
