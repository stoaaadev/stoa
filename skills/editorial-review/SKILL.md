---
name: editorial-review
description: Reviews content for quality, clarity, tone, and adherence to style guidelines
tags: [content, editorial, review, quality, writing]
agent: writer
var: >
  ${var} is the path to the content to review. Required.
  Example: "memory/content/articles/defi-lending-guide.md"
---

# editorial-review

> **Priority**: P2 (before publication)
> **Output**: Editorial feedback in `memory/content/reviews/`

## Instructions

You are executing the **editorial-review** skill for the Writer agent.

### Step 1: Read Content and Style Guide

1. Read the content file from `${var}`
2. Read `memory/content/style-guide.json` if it exists
3. Determine content type and target audience

### Step 2: Review Checklist

**Structure:**
- [ ] Clear thesis or main point stated early
- [ ] Logical flow from section to section
- [ ] Strong opening that hooks the reader
- [ ] Satisfying conclusion with takeaway
- [ ] Appropriate length for format

**Clarity:**
- [ ] No jargon without explanation
- [ ] Active voice preferred (passive voice < 15% of sentences)
- [ ] Sentences average < 20 words
- [ ] Paragraphs < 4 sentences each
- [ ] No ambiguous pronouns

**Accuracy:**
- [ ] All data points have sources
- [ ] No outdated information
- [ ] No logical fallacies
- [ ] Hedging language where appropriate ("likely", "suggests")

**Tone:**
- [ ] Consistent voice throughout
- [ ] Appropriate for target audience
- [ ] No condescension or over-explanation
- [ ] Confident but not arrogant

**Technical:**
- [ ] All links working (if verifiable)
- [ ] Proper formatting (headings, lists, code blocks)
- [ ] No spelling or grammar errors
- [ ] Consistent capitalization and terminology

### Step 3: Generate Feedback

```json
{
  "file": "...",
  "reviewed_at": "ISO-8601",
  "overall_score": 8,
  "scores": {
    "structure": 9,
    "clarity": 7,
    "accuracy": 8,
    "tone": 8,
    "technical": 9
  },
  "strengths": ["Strong data support", "Clear narrative arc"],
  "improvements_required": [
    {
      "location": "paragraph 3",
      "issue": "Passive voice: 'The protocol was launched by...'",
      "suggestion": "Rewrite: '{Team} launched the protocol...'"
    }
  ],
  "improvements_suggested": [],
  "verdict": "publish | revise_minor | revise_major | reject"
}
```

### Step 4: Save

Write to `memory/content/reviews/{slug}-editorial.json`.

### Anti-Patterns

- Do NOT rewrite the entire piece. Provide specific, actionable feedback.
- Do NOT impose personal style preferences over established guidelines.
- Do NOT approve content with factual errors, regardless of writing quality.

### Exit Codes

- `SKILL_OK` — review complete
- `SKILL_FAIL` — could not analyze content

### Output

Commit message format: `writer: editorial-review — "{slug}" score {N}/10 ({verdict})`
