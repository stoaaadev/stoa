---
name: ama-prep
description: Prepares materials for AMAs (Ask Me Anything) including Q&A prep, talking points, and data
tags: [social, ama, preparation, community, engagement]
agent: writer
var: >
  ${var} is the AMA topic and context. Required.
  Example: "Stoa v2 launch AMA on Discord" or "DeFi market outlook Twitter Spaces"
---

# ama-prep

> **Priority**: P2 (on-demand, before scheduled AMA)
> **Output**: AMA prep materials in `memory/content/ama/`

## Instructions

You are executing the **ama-prep** skill for the Writer agent.

### Step 1: Research Context

1. Read relevant data from `memory/research/` and `memory/content/`
2. Identify likely question areas based on the AMA topic
3. Gather fresh data points to support answers

### Step 2: Anticipate Questions

Generate 15-20 likely questions across categories:
- **Product/Feature**: Questions about how things work
- **Performance**: Metrics, returns, track record
- **Strategy**: Future plans, roadmap, vision
- **Technical**: Architecture, security, code
- **Market**: Market outlook, competitive position
- **Critical**: Tough questions, known concerns, FUD topics

### Step 3: Prepare Answers

For each anticipated question, prepare:
- **Short answer** (2-3 sentences): For quick responses
- **Detailed answer** (1-2 paragraphs): For follow-up if asked
- **Data points**: Specific numbers to cite
- **Sources**: Links to support claims
- **Redirect**: What to pivot to if the question is tricky

### Step 4: Talking Points

Prepare 5 key messages to weave into responses:
1. {Core value proposition}
2. {Recent milestone or achievement}
3. {Upcoming exciting development}
4. {Differentiation from competitors}
5. {Community appreciation}

### Step 5: Generate Prep Document

```markdown
# AMA Prep: {Topic}
## Date: {date} | Platform: {platform}

## Key Messages
1. ...

## Anticipated Q&A

### Product Questions
**Q: How does X work?**
Short: ...
Detailed: ...
Data: ...

### Tough Questions
**Q: Why did Y fail?**
Short: ...
Key point: Be honest, explain lesson learned, share what changed.

## Data Cheat Sheet
| Metric | Value | Source |
|--------|-------|--------|
| TVL | $X | DeFiLlama |
| ... | ... | ... |

## Red Lines
- Do NOT discuss: {topics to avoid}
- Do NOT promise: {unreleased features, price targets}
- Do NOT share: {internal metrics, unreleased roadmap}
```

### Step 6: Save

Write to `memory/content/ama/{date}-{topic_slug}.md`.

### Anti-Patterns

- Do NOT prepare dishonest answers. Authenticity builds trust.
- Do NOT over-prepare — sounding scripted kills AMA energy.
- Do NOT include any non-public financial data or projections.

### Exit Codes

- `SKILL_OK` — AMA prep complete
- `SKILL_PARTIAL` — some data unavailable
- `SKILL_FAIL` — could not prepare materials

### Output

Commit message format: `writer: ama-prep — "{topic}" ({N} Q&As prepared)`
