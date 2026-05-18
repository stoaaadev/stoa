---
name: mention-monitor
description: Monitors brand and project mentions across social media and news for reputation management
tags: [social, mentions, monitoring, reputation, alerts]
agent: scout
var: >
  ${var} specifies terms to monitor. If set (e.g., "stoa,stoa-swarm"),
  track those terms. If empty, monitor default brand terms.
---

# mention-monitor

> **Priority**: P1 (runs every 4 hours)
> **Data sources**: WebSearch, Twitter, Reddit, news aggregators
> **Output**: Mention reports in `memory/social/mentions/`

## Instructions

You are executing the **mention-monitor** skill for the Scout agent.

### Step 1: Load Monitor Terms

Read `memory/social/mentions/config.json`:
```json
{
  "brand_terms": ["stoa", "stoa swarm", "stoa agent"],
  "competitor_terms": ["trading bot", "defi agent", "autonomous trading"],
  "alert_terms": ["hack", "exploit", "rug", "scam"],
  "last_scan": "ISO-8601"
}
```

### Step 2: Search All Channels

For each term, search via WebSearch:
```
"{term}" crypto OR defi OR solana -is:retweet since:{last_scan}
```

Reddit:
```bash
curl -s "https://www.reddit.com/search.json?q={term}&sort=new&t=day&limit=25" -H "User-Agent: stoa-bot/1.0"
```

### Step 3: Classify Mentions

For each mention:
- **Sentiment**: positive / neutral / negative / critical
- **Reach**: Author's follower count / subreddit size
- **Urgency**: routine / timely / urgent (mentions of hacks, exploits)
- **Requires response**: Does this need a reply or action?

### Step 4: Generate Report

```json
{
  "scan_time": "ISO-8601",
  "mentions": {
    "total": 45,
    "positive": 28,
    "neutral": 12,
    "negative": 5,
    "critical": 0
  },
  "high_reach_mentions": [
    {"platform": "twitter", "author": "...", "reach": 50000, "sentiment": "positive", "text": "..."}
  ],
  "requires_response": [],
  "alert_term_matches": []
}
```

### Step 5: Save and Alert

1. Write to `memory/social/mentions/{YYYY-MM-DD-HH}.json`
2. URGENT alert to guardian for any alert_term matches (hack/exploit mentions)
3. Post negative/critical mentions to ops for response consideration
4. Notify on high-reach positive mentions (opportunity to engage)

### Anti-Patterns

- Do NOT respond to mentions automatically. Flag for human review.
- Do NOT track private conversations or protected accounts.
- Do NOT inflate positive mention counts with self-mentions.

### Exit Codes

- `SKILL_OK` — mention monitoring complete
- `SKILL_PARTIAL` — some channels unavailable
- `SKILL_EMPTY` — no new mentions
- `SKILL_FAIL` — critical failure

### Output

Commit message format: `scout: mention-monitor — {total} mentions ({positive}+ {negative}-)`
