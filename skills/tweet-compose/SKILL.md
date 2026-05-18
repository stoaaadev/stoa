---
name: tweet-compose
description: Composes a single high-impact tweet optimized for engagement
tags: [content, twitter, social, engagement, short-form]
agent: writer
var: >
  ${var} is the message or data point to tweet about. Required.
  Example: "SOL flipped ETH in daily DEX volume" or "New exploit analysis ready"
---

# tweet-compose

> **Priority**: P3 (on-demand)
> **Output**: Tweet draft in `memory/content/tweets/`

## Instructions

You are executing the **tweet-compose** skill for the Writer agent.

### Step 1: Analyze the Message

Parse `${var}` to identify:
- Core message / news item
- Key data point (number, stat, comparison)
- Emotional valence (bullish, bearish, neutral, alarming)
- Urgency (breaking, timely, evergreen)

### Step 2: Compose Tweet Variants

Generate 3 variants with different approaches:

**Variant A — Data-led:**
Lead with the number. "Solana DEX volume: $3.2B in 24h. That's a new ATH."

**Variant B — Insight-led:**
Lead with the "so what." "Everyone's watching SOL price. The real story is DEX volume just hit $3.2B."

**Variant C — Question-led:**
Engage with curiosity. "Which chain did more DEX volume yesterday — Ethereum or Solana? (The answer might surprise you)"

Rules for all variants:
- Max 280 characters (hard limit)
- Include specific numbers when available
- No hashtags in main text (add as reply)
- Max 1 emoji (only if it adds meaning)
- No links in tweet body (add as reply for better reach)
- Write at a 8th-grade reading level

### Step 3: Engagement Optimization

Score each variant:
- **Stop power** (1-5): Would you pause scrolling?
- **Reply potential** (1-5): Does it invite responses?
- **Share potential** (1-5): Would someone RT this?
- **Information density** (1-5): Does it teach something?

Select the highest-scoring variant.

### Step 4: Save

```json
{
  "created_at": "ISO-8601",
  "selected_tweet": "...",
  "char_count": 142,
  "variants": [
    {"text": "...", "approach": "data-led", "score": 15},
    {"text": "...", "approach": "insight-led", "score": 18},
    {"text": "...", "approach": "question-led", "score": 12}
  ],
  "reply_additions": {
    "source_link": "...",
    "hashtags": "#Solana #DeFi",
    "follow_up_context": "..."
  },
  "status": "draft",
  "optimal_post_time": "estimated best time based on audience timezone"
}
```

Write to `memory/content/tweets/{timestamp}.json`.

### Anti-Patterns

- Do NOT use all caps or excessive exclamation marks.
- Do NOT be sycophantic or hyperbolic ("MASSIVE", "HUGE", "INSANE").
- Do NOT use engagement bait ("You won't believe...").
- Do NOT include more than one call-to-action.

### Exit Codes

- `SKILL_OK` — tweet composed
- `SKILL_FAIL` — could not compose tweet

### Output

Commit message format: `writer: tweet-compose — "{first_20_chars}..." ({char_count} chars)`
