---
name: write-thread
description: Composes a Twitter/X thread (5-15 tweets) with hooks, data points, and engagement optimization
tags: [content, twitter, thread, social, engagement]
agent: writer
var: >
  ${var} is the thread topic or key insight to share. Required.
  Example: "Solana DEX volume surpassed Ethereum for the first time"
---

# write-thread

> **Priority**: P2 (on-demand)
> **Output**: Thread draft in `memory/content/threads/`

## Instructions

You are executing the **write-thread** skill for the Writer agent.

### Step 1: Research Key Points

1. Read relevant data from `memory/research/` and `memory/content/`
2. Identify the core narrative arc (what story are we telling?)
3. Gather 3-5 hard data points that support the narrative

### Step 2: Structure the Thread

**Thread anatomy:**
1. **Hook tweet** (tweet 1): Bold claim, surprising stat, or provocative question. Must stop the scroll. Max 200 chars for visual impact.
2. **Context** (tweet 2): Why this matters. Set the scene.
3. **Evidence** (tweets 3-8): Data points, examples, analysis. One idea per tweet.
4. **Insight** (tweets 9-10): Your unique take. What others are missing.
5. **CTA/Closer** (final tweet): Forward-looking question, call to action, or bookmark prompt.

### Step 3: Write Each Tweet

Rules per tweet:
- Max 280 characters (hard limit)
- Use thread numbering only if >10 tweets: "1/" prefix
- Include specific numbers (not "a lot" — say "347%")
- One emoji max per tweet (use sparingly, for visual breaks)
- No hashtags in the body (add 2-3 as reply to final tweet)
- Each tweet should be standalone-readable but flow as a narrative

### Step 4: Optimize for Engagement

- **Hook test**: Would you stop scrolling for tweet 1? If not, rewrite.
- **Data density**: At least 1 data point every 2 tweets
- **Visual breaks**: Suggest where images/charts would go (annotate with `[CHART: description]`)
- **Reply bait**: Include a question or controversial take to drive replies

### Step 5: Save

Write thread to `memory/content/threads/{slug}.json`:

```json
{
  "topic": "...",
  "tweet_count": 8,
  "created_at": "ISO-8601",
  "status": "draft",
  "tweets": [
    {
      "position": 1,
      "text": "Solana DEXes just flipped Ethereum in daily volume.\n\n$3.2B vs $2.8B.\n\nHere's what everyone is missing about this milestone:",
      "char_count": 142,
      "media_suggestion": "[CHART: Solana vs Ethereum DEX volume, 30-day]",
      "type": "hook"
    }
  ],
  "hashtags": ["#Solana", "#DeFi"],
  "sources": ["url1", "url2"],
  "estimated_reach": "medium"
}
```

### Anti-Patterns

- Do NOT write threads longer than 15 tweets. Engagement drops sharply after 10.
- Do NOT start with "Thread:" or "A thread on...". Jump straight to the hook.
- Do NOT make every tweet a cliffhanger. It reads as manipulative.
- Do NOT use all caps for emphasis. Use line breaks instead.

### Exit Codes

- `SKILL_OK` — thread composed
- `SKILL_FAIL` — could not compose thread

### Output

Commit message format: `writer: write-thread — "{hook_summary}" ({N} tweets)`
