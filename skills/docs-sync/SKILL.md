---
name: docs-sync
description: Ensures documentation stays in sync with code changes — detects drift and generates update tasks
tags: [devops, documentation, sync, drift, maintenance]
agent: ops
var: >
  ${var} specifies the docs directory to check. If set (e.g., "docs/api"),
  check that directory. If empty, check all documentation.
---

# docs-sync

> **Priority**: P2 (runs weekly)
> **Schedule**: Wednesday 06:00 UTC
> **Data sources**: Git log, file system, code analysis
> **Output**: Drift report in `memory/ops/docs/`

## Instructions

You are executing the **docs-sync** skill for the Ops agent.

### Step 1: Map Code to Docs

Build a mapping of source files to documentation files:
- README.md sections -> project structure
- API docs -> function signatures
- SKILL.md files -> skill behavior
- AGENT.md files -> agent capabilities
- Configuration docs -> config schemas

### Step 2: Detect Drift

For each mapped pair, check:
```bash
# When was the code last modified?
git log -1 --format="%aI" -- "{code_file}"
# When was the doc last modified?
git log -1 --format="%aI" -- "{doc_file}"
```

Flag drift when:
- Code modified after docs (docs may be stale)
- New files added with no corresponding docs
- Config schemas changed but docs not updated
- Function signatures changed but API docs unchanged

### Step 3: Analyze Severity

- **Critical drift**: API endpoints changed, breaking changes undocumented
- **Major drift**: New features added without docs
- **Minor drift**: Internal refactoring, docs still mostly accurate
- **Cosmetic**: Formatting, typos in code comments

### Step 4: Generate Report

```json
{
  "report_date": "2024-01-15",
  "total_doc_files": 35,
  "in_sync": 28,
  "drifted": 7,
  "drift_items": [
    {
      "doc_file": "skills/scan-tokens/SKILL.md",
      "code_files": ["src/scan-tokens.ts"],
      "code_last_modified": "2024-01-14",
      "doc_last_modified": "2024-01-01",
      "severity": "major",
      "likely_changes": "New whale detection parameter added"
    }
  ],
  "missing_docs": ["src/new-feature.ts has no corresponding documentation"],
  "action_items": []
}
```

### Step 5: Save

1. Write to `memory/ops/docs/{YYYY-MM-DD}.json`
2. Create update tasks for critical and major drift items
3. Notify on critical drift detection

### Anti-Patterns

- Do NOT auto-update documentation. Flag drift for human writers.
- Do NOT treat all drift as critical. Internal code changes often do not affect docs.

### Exit Codes

- `SKILL_OK` — sync check complete
- `SKILL_PARTIAL` — some files could not be analyzed
- `SKILL_EMPTY` — all docs in sync
- `SKILL_FAIL` — critical failure

### Output

Commit message format: `ops: docs-sync — {N} drifted, {M} critical [{affected_docs}]`
