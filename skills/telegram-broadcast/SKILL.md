---
name: telegram-broadcast
description: Formats and sends messages to Telegram channels/groups with proper formatting
tags: [content, telegram, social, broadcast, notifications]
agent: writer
var: >
  ${var} is the message content or type to broadcast. Required.
  Example: "daily market summary" or "urgent: exploit alert"
---

# telegram-broadcast

> **Priority**: P2 (on-demand)
> **Output**: Telegram message in `memory/content/telegram/`

## Instructions

You are executing the **telegram-broadcast** skill for the Writer agent.

### Step 1: Determine Message Type

Classify `${var}`:
- **Alert** (urgent): Security events, major price moves, halt events
- **Update** (timely): Market updates, trade executions, portfolio changes
- **Report** (scheduled): Daily/weekly summaries, research briefs
- **Info** (low priority): General updates, new features

### Step 2: Format for Telegram

Telegram supports HTML formatting:
- `<b>bold</b>` for emphasis
- `<code>monospace</code>` for numbers/addresses
- `<a href="url">link text</a>` for links
- Line breaks for structure (no markdown headings)

**Message template by type:**

Alert:
```
🚨 <b>ALERT: {title}</b>

{description}

<b>Impact:</b> {impact_summary}
<b>Action:</b> {what_to_do}

{timestamp}
```

Report:
```
📊 <b>{Report Title}</b>

{key_metrics_as_list}

Full report: {link}
```

### Step 3: Character Limit

Telegram limit: 4096 characters per message.
- If content exceeds limit, split into multiple messages
- First message should contain the most critical info
- Add "1/N" prefix for multi-part messages

### Step 4: Send

```bash
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "${TELEGRAM_CHAT_ID}",
    "text": "{formatted_message}",
    "parse_mode": "HTML",
    "disable_web_page_preview": true
  }'
```

Or use `./notify` for multi-channel delivery:
```bash
./notify "{plain_text_message}"
```

### Step 5: Save

Write to `memory/content/telegram/{YYYY-MM-DD}-{type}.json` with message text and delivery status.

### Anti-Patterns

- Do NOT send more than 5 messages per hour (rate limit).
- Do NOT include full wallet addresses or private data.
- Do NOT use excessive emojis. Max 2 per message.
- Do NOT send empty or test messages to production channels.

### Exit Codes

- `SKILL_OK` — message sent
- `SKILL_PARTIAL` — message saved but delivery failed
- `SKILL_FAIL` — could not format message

### Output

Commit message format: `writer: telegram-broadcast — {type} ({char_count} chars)`
