---
name: issue-triage
description: Triages new GitHub issues — categorizes, labels, prioritizes, and routes to appropriate assignees
tags: [devops, issues, triage, github, workflow]
agent: ops
var: >
  ${var} specifies the issue to triage. If set (e.g., "#123"), triage that issue.
  If empty, triage all unlabeled/untriaged issues.
---

# issue-triage

> **Priority**: P1 (runs every 6 hours)
> **Data sources**: GitHub Issues API
> **Output**: Triage decisions in `memory/ops/triage/`

## Instructions

You are executing the **issue-triage** skill for the Ops agent.

### Step 1: Fetch Untriaged Issues

```bash
curl -s -H "Authorization: token ${GITHUB_TOKEN}" \
  "https://api.github.com/repos/{owner}/{repo}/issues?state=open&labels=&per_page=50&sort=created&direction=desc"
```

Filter to issues without the `triaged` label.

### Step 2: Analyze Each Issue

For each untriaged issue, determine:

**Category:**
- `bug` — Something is broken
- `feature` — New functionality request
- `enhancement` — Improvement to existing functionality
- `question` — User needs help
- `documentation` — Docs improvement needed
- `security` — Security-related issue

**Priority:**
- `P0-critical` — System down, data loss, security breach
- `P1-high` — Major feature broken, affects many users
- `P2-medium` — Minor bug, improvement with clear value
- `P3-low` — Nice to have, cosmetic, edge case

**Routing:**
Based on affected component, suggest assignee team/person.

### Step 3: Check for Duplicates

Search existing issues for similar titles/content:
```bash
curl -s -H "Authorization: token ${GITHUB_TOKEN}" \
  "https://api.github.com/search/issues?q=repo:{owner}/{repo}+is:issue+{keywords}"
```

If duplicate found, note the original issue number.

### Step 4: Apply Triage (Dry Run)

Generate triage recommendations (do NOT apply directly):

```json
{
  "triage_date": "ISO-8601",
  "issues_triaged": [
    {
      "number": 123,
      "title": "Portfolio value calculation wrong when...",
      "category": "bug",
      "priority": "P1-high",
      "labels_to_add": ["bug", "P1-high", "portfolio"],
      "suggested_assignee": "team-backend",
      "duplicate_of": null,
      "summary": "Portfolio value calculation fails when a position has zero liquidity",
      "suggested_response": "Thanks for reporting. This looks like a bug in the portfolio calculation when..."
    }
  ]
}
```

### Step 5: Save

1. Write to `memory/ops/triage/{YYYY-MM-DD}.json`
2. For P0-critical issues, alert guardian immediately
3. Notify on new P1-high issues

### Sandbox Note

In GitHub Actions sandbox, applying labels and assignees requires write permission. The triage output is saved as recommendations. A separate workflow or human applies them.

### Anti-Patterns

- Do NOT close issues without explicit approval.
- Do NOT apply labels directly — save as recommendations.
- Do NOT dismiss user-reported issues as invalid without investigation.
- Do NOT expose internal details in suggested responses.

### Exit Codes

- `SKILL_OK` — triage complete, {N} issues triaged
- `SKILL_PARTIAL` — some issues could not be fully analyzed
- `SKILL_EMPTY` — no untriaged issues
- `SKILL_FAIL` — could not access issues

### Output

Commit message format: `ops: issue-triage — {N} issues triaged ({critical} P0, {high} P1)`
