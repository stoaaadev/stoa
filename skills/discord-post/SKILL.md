---
name: discord-post
description: Formats and posts content to Discord channels with proper embeds and formatting
tags: [content, discord, social, community, notifications]
agent: writer
var: >
  ${var} is the message content or type to post. Required.
  Example: "market update" or "alert: major exploit detected"
---

# discord-post

> **Priority**: P2 (on-demand)
> **Output**: Discord message in `memory/content/discord/`

## Instructions

You are executing the **discord-post** skill for the Writer agent.

### Step 1: Determine Post Type

Based on `${var}`, classify:
- **Market Update**: Price data, volume, trends
- **Alert**: Security, risk, or critical events
- **Research**: New research or analysis available
- **Announcement**: New features, releases, changes
- **Discussion**: Community engagement, questions

### Step 2: Format for Discord

Discord supports markdown with special features. Use them:

```markdown
# Heading (large)
## Subheading
**Bold** for emphasis
`code` for technical values
> Blockquotes for key insights
```

For rich embeds, structure the data:

```json
{
  "embed": {
    "title": "Market Update — {date}",
    "description": "SOL trading at $125.45 (+5.2%)",
    "color": 5814783,
    "fields": [
      {"name": "SOL Price", "value": "$125.45 (+5.2%)", "inline": true},
      {"name": "24h Volume", "value": "$3.2B", "inline": true},
      {"name": "Portfolio", "value": "$45,230 (+2.1%)", "inline": true}
    ],
    "footer": {"text": "stoa | auto-generated"},
    "timestamp": "ISO-8601"
  }
}
```

### Step 3: Tone Calibration

Per post type:
- **Market Update**: Factual, concise, data-forward
- **Alert**: Urgent but not panicked, clear action items
- **Research**: Informative, includes link to full report
- **Announcement**: Professional, clear next steps
- **Discussion**: Conversational, invites responses

### Step 4: Send and Save

1. Format message for Discord webhook:
```bash
curl -s -X POST "${DISCORD_WEBHOOK_URL}" \
  -H "Content-Type: application/json" \
  -d '{"content": "...", "embeds": [...]}'
```

2. Save to `memory/content/discord/{YYYY-MM-DD}-{type}.json`
3. Log send status

### Anti-Patterns

- Do NOT ping @everyone or @here unless it is a critical security alert.
- Do NOT post walls of text. Discord users scan, not read.
- Do NOT include sensitive data (wallet addresses, private keys).
- Do NOT post more than 3 times per day to any single channel.

### Exit Codes

- `SKILL_OK` — message posted
- `SKILL_PARTIAL` — message saved but could not post (webhook unavailable)
- `SKILL_FAIL` — could not format message

### Output

Commit message format: `writer: discord-post — {type} to #{channel}`
