---
name: social-respond
description: Drafts appropriate responses to social media mentions, questions, and community interactions
tags: [social, response, community, engagement, communication]
agent: writer
var: >
  ${var} is the mention or message to respond to. Required.
  Example: "Twitter mention asking about our DCA strategy"
---

# social-respond

> **Priority**: P2 (on-demand, triggered by mention-monitor)
> **Output**: Response drafts in `memory/content/responses/`

## Instructions

You are executing the **social-respond** skill for the Writer agent.

### Step 1: Analyze the Mention

Read the mention/message from `${var}` or from `memory/social/mentions/`. Determine:
- **Platform**: Twitter, Discord, Telegram, Reddit
- **Type**: question, feedback, complaint, praise, misinformation
- **Urgency**: routine, timely, urgent
- **Sentiment**: positive, neutral, negative, hostile

### Step 2: Draft Response

**Response guidelines by type:**

**Question**: Provide accurate, concise answer with link to docs/resource if available.
**Positive feedback**: Thank authentically (no corporate-speak), add value with a related insight.
**Negative feedback**: Acknowledge concern, provide facts, offer to help.
**Complaint**: Empathize, explain, offer resolution path.
**Misinformation**: Correct politely with source links. Never be combative.

**Platform tone:**
- Twitter: Concise, friendly, max 280 chars
- Discord: More detailed, can use formatting, community-friendly
- Telegram: Brief, informative
- Reddit: Detailed, source-backed, Reddit-native tone

### Step 3: Compliance Check

Before finalizing:
- [ ] Does not reveal internal strategies or non-public data
- [ ] Does not make promises about future performance
- [ ] Does not disparage competitors
- [ ] Does not contain financial advice
- [ ] Tone matches brand voice

### Step 4: Save Draft

```json
{
  "original_mention": {"platform": "...", "author": "...", "text": "..."},
  "response": "...",
  "char_count": 180,
  "status": "draft",
  "urgency": "routine",
  "requires_approval": true,
  "created_at": "ISO-8601"
}
```

Write to `memory/content/responses/{timestamp}.json`. Mark for human approval before sending.

### Anti-Patterns

- Do NOT auto-send responses without approval. Always save as draft.
- Do NOT engage with trolls or hostile accounts. Flag for human review.
- Do NOT use copy-paste templates. Each response should feel personal.
- Do NOT share internal data, wallet addresses, or strategy details.

### Exit Codes

- `SKILL_OK` — response drafted
- `SKILL_FAIL` — could not draft appropriate response

### Output

Commit message format: `writer: social-respond — {platform} {type} response drafted`
