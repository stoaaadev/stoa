---
name: feedback-collect
description: Collects, categorizes, and prioritizes user feedback from all community channels
tags: [social, feedback, community, product, prioritization]
agent: researcher
var: >
  ${var} specifies the feedback source or topic. If set (e.g., "Discord feature requests"),
  focus there. If empty, collect from all sources.
---

# feedback-collect

> **Priority**: P2 (runs weekly)
> **Schedule**: Thursday 10:00 UTC
> **Output**: Feedback report in `memory/social/feedback/`

## Instructions

You are executing the **feedback-collect** skill for the Researcher agent.

### Step 1: Scan Feedback Sources

Check all community channels for feedback-like content:
- Discord messages in #feedback, #suggestions channels
- Twitter replies and mentions with feature requests
- GitHub issues labeled as enhancement or feature-request
- Telegram messages with suggestions

Read `memory/social/mentions/` for relevant mention data.

For GitHub issues:
```bash
curl -s -H "Authorization: token ${GITHUB_TOKEN}" "https://api.github.com/repos/{owner}/{repo}/issues?labels=enhancement,feature-request&state=open&sort=created&direction=desc&per_page=30"
```

### Step 2: Categorize Feedback

For each feedback item:
- **Type**: feature_request | bug_report | improvement | complaint | praise
- **Category**: UX | performance | features | security | docs | pricing
- **Urgency**: critical | high | medium | low
- **Frequency**: How many similar requests?

### Step 3: Prioritize

Score each unique feedback item:
- **Impact** (1-5): How many users would this affect?
- **Effort** (1-5): How hard to implement? (inverted — 5 = easy)
- **Urgency** (1-5): How time-sensitive?
- **Alignment** (1-5): How well does this align with our roadmap?

Priority score = (Impact * 3 + Urgency * 2 + Alignment * 2 + Effort) / 8

### Step 4: Generate Report

```json
{
  "report_date": "2024-01-15",
  "feedback_items": [
    {
      "id": "fb-001",
      "summary": "Add support for limit orders",
      "type": "feature_request",
      "category": "features",
      "frequency": 15,
      "priority_score": 4.2,
      "sources": ["discord x8", "twitter x5", "github x2"],
      "representative_quote": "Would love to set limit orders instead of only market swaps",
      "status": "new"
    }
  ],
  "summary": {
    "total_items": 45,
    "by_type": {"feature_request": 25, "bug_report": 10, "improvement": 8, "complaint": 2},
    "top_category": "features",
    "top_request": "Limit orders (15 mentions)"
  }
}
```

### Step 5: Save and Distribute

1. Write to `memory/social/feedback/{YYYY-MM-DD}.json`
2. Post top 5 prioritized items to ops mesh for consideration
3. Update running feedback tracker at `memory/social/feedback/tracker.json`

### Anti-Patterns

- Do NOT dismiss feedback because it is poorly worded. Extract the signal.
- Do NOT double-count same user's feedback across platforms.
- Do NOT respond to feedback directly. Route through social-respond skill.

### Exit Codes

- `SKILL_OK` — feedback collection complete
- `SKILL_PARTIAL` — some sources unavailable
- `SKILL_EMPTY` — no new feedback
- `SKILL_FAIL` — critical failure

### Output

Commit message format: `researcher: feedback-collect — {N} items, top: "{top_request}"`
