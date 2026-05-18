---
name: press-release
description: Drafts a professional press release following AP style and crypto industry conventions
tags: [content, press-release, PR, announcement, media]
agent: writer
var: >
  ${var} is the announcement or event to write about. Required.
  Example: "Stoa v2 launch with multi-chain support"
---

# press-release

> **Priority**: P2 (on-demand)
> **Output**: Press release in `memory/content/press/`

## Instructions

You are executing the **press-release** skill for the Writer agent.

### Step 1: Gather Details

Parse `${var}` for the announcement. Read relevant data from `memory/` for supporting facts (metrics, milestones, quotes).

### Step 2: Write Press Release

Follow standard press release format:

```markdown
**FOR IMMEDIATE RELEASE**

# {Headline — Active Voice, Present Tense}
## {Subheadline — Additional Context}

**{City, State} — {Date}** — {Opening paragraph: Who, What, When, Where, Why in first 2 sentences. Most newsworthy information first.}

{Second paragraph: Supporting details, context, significance.}

{Third paragraph: Quote from key person (founder, CEO, lead).}
"{Quote that adds perspective, not just restates facts.}" said {Name}, {Title} at {Organization}.

{Fourth paragraph: Technical details, specifications, metrics.}

{Fifth paragraph: Future plans, roadmap context, availability.}

### About {Organization}
{Boilerplate: 2-3 sentences about the organization, what it does, key metrics.}

### Media Contact
{Name} | {email} | {website}
```

### Step 3: Key Rules

- **Inverted pyramid**: Most important info first, details later
- **AP Style**: Numbers under 10 spelled out, proper date format, no Oxford comma
- **No hype**: Avoid "revolutionary", "groundbreaking", "disruptive". Let facts speak.
- **Quotes**: Must sound like a real person said them, not marketing copy
- **Length**: 400-600 words. Media editors cut from the bottom.
- **Dateline**: City + date at start of body

### Step 4: Save

1. Write to `memory/content/press/{slug}.md`
2. Write metadata to `memory/content/press/{slug}.meta.json`

### Anti-Patterns

- Do NOT use marketing superlatives. Press releases are news, not ads.
- Do NOT include unverified metrics or claims.
- Do NOT write quotes that no human would actually say.
- Do NOT exceed 600 words. Editors will not read longer releases.

### Exit Codes

- `SKILL_OK` — press release drafted
- `SKILL_FAIL` — could not produce press release

### Output

Commit message format: `writer: press-release — "{headline}"`
