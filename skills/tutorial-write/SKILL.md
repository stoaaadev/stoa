---
name: tutorial-write
description: Writes a step-by-step tutorial for DeFi operations, tool usage, or technical tasks
tags: [content, tutorial, education, how-to, documentation]
agent: writer
var: >
  ${var} is the tutorial topic. Required.
  Example: "How to provide liquidity on Orca CLMM" or "Setting up Jupiter DCA"
---

# tutorial-write

> **Priority**: P3 (on-demand)
> **Output**: Tutorial in `memory/content/tutorials/`

## Instructions

You are executing the **tutorial-write** skill for the Writer agent.

### Step 1: Research the Topic

1. Identify the specific task or workflow to document
2. Read protocol docs via WebFetch if needed
3. Identify prerequisites (wallet setup, token balances, approvals)
4. Verify current UI/API matches what we will document

### Step 2: Structure the Tutorial

```markdown
# {Tutorial Title}

## Prerequisites
- {What the reader needs before starting}
- Estimated time: {X} minutes
- Difficulty: Beginner | Intermediate | Advanced

## Overview
{What we are doing and why, in 2-3 sentences}

## Step 1: {Action Verb + Object}
{Clear instruction}
{Screenshot/diagram description if relevant}

> **Note**: {Important caveat or tip}

## Step 2: {Action Verb + Object}
...

## Step N: Verify
{How to confirm the task was completed successfully}

## Troubleshooting
### {Common Issue 1}
{Solution}

### {Common Issue 2}
{Solution}

## What's Next?
{Logical next steps or related tutorials}
```

### Step 3: Write Guidelines

- Every step starts with an action verb ("Click", "Enter", "Navigate", "Run")
- One action per step (never "Click X and then enter Y")
- Include expected results ("You should see a confirmation dialog")
- Note points of no return ("This transaction is irreversible")
- Include approximate gas/fee estimates where relevant
- Code blocks for any CLI commands or contract interactions

### Step 4: Review

- Follow the tutorial yourself mentally — does each step flow logically?
- Are prerequisites complete? Would a reader get stuck?
- Are fee warnings included before any cost-incurring step?

### Step 5: Save

Write to `memory/content/tutorials/{slug}.md` with metadata.

### Anti-Patterns

- Do NOT assume knowledge. If in doubt, explain it.
- Do NOT include outdated UI references. Note the version/date.
- Do NOT skip error handling. Include what to do when things go wrong.
- Do NOT combine multiple tutorials into one. Keep scope tight.

### Exit Codes

- `SKILL_OK` — tutorial written
- `SKILL_PARTIAL` — some steps unverifiable
- `SKILL_FAIL` — could not produce tutorial

### Output

Commit message format: `writer: tutorial-write — "{title}" ({N} steps, {difficulty})`
