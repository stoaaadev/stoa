---
name: changelog-update
description: Keeps CHANGELOG.md up to date with recent commits, PRs, and releases
tags: [devops, changelog, documentation, releases, tracking]
agent: ops
var: >
  ${var} specifies the update scope. If set (e.g., "since v1.2.0"),
  update from that point. If empty, update from last changelog entry.
---

# changelog-update

> **Priority**: P2 (runs daily)
> **Schedule**: 18:00 UTC
> **Data sources**: Git log, GitHub PRs
> **Output**: Updated changelog entries in `memory/ops/changelog/`

## Instructions

You are executing the **changelog-update** skill for the Ops agent.

### Step 1: Find Last Changelog Entry

Read existing `CHANGELOG.md` to find the most recent entry date/version.

```bash
git log --oneline --after="{last_entry_date}" --format="%h|%s|%an|%aI"
```

### Step 2: Categorize New Changes

Group commits by type (parse conventional commit prefixes):
- `feat:` -> Added
- `fix:` -> Fixed
- `docs:` -> Documentation
- `perf:` -> Performance
- `refactor:` -> Changed
- `security:` -> Security

### Step 3: Draft Unreleased Section

```markdown
## [Unreleased]

### Added
- {feature description} ({commit_hash})

### Fixed
- {bug fix description} ({commit_hash})
```

### Step 4: Save

Write draft to `memory/ops/changelog/pending.md` for human review before merging into CHANGELOG.md.

### Anti-Patterns

- Do NOT modify CHANGELOG.md directly. Save as pending for review.
- Do NOT include merge commits or CI-only changes.

### Exit Codes

- `SKILL_OK` — changelog entries drafted
- `SKILL_EMPTY` — no new changes to document
- `SKILL_FAIL` — could not access git history

### Output

Commit message format: `ops: changelog-update — {N} new entries pending`
