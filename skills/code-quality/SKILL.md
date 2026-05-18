---
name: code-quality
description: Runs code quality analysis — linting, complexity metrics, code smells, and maintainability index
tags: [devops, code-quality, linting, metrics, maintainability]
agent: ops
var: >
  ${var} specifies files or directories to analyze. If set (e.g., "src/"),
  focus there. If empty, analyze the entire codebase.
---

# code-quality

> **Priority**: P2 (runs weekly)
> **Schedule**: Monday 07:00 UTC
> **Output**: Quality report in `memory/ops/quality/`

## Instructions

You are executing the **code-quality** skill for the Ops agent.

### Step 1: Run Linters

```bash
# TypeScript/JavaScript
npx eslint . --format=json 2>/dev/null || true

# Check formatting
npx prettier --check "**/*.{ts,js,json}" 2>/dev/null || true
```

### Step 2: Complexity Analysis

Measure:
- **Cyclomatic complexity**: Functions with complexity >10 are flagged
- **Cognitive complexity**: Nested logic that is hard to understand
- **File length**: Files >300 lines are flagged
- **Function length**: Functions >50 lines are flagged
- **Parameter count**: Functions with >5 parameters are flagged

```bash
# Count lines per file
find . -name "*.ts" -not -path "*/node_modules/*" -exec wc -l {} + | sort -rn | head -20
```

### Step 3: Code Smell Detection

Look for:
- Dead code (unused exports, unreachable code)
- Duplicated code blocks (>10 lines identical)
- Magic numbers (hardcoded values without constants)
- Long parameter lists
- Deeply nested callbacks
- Missing error handling in async functions

### Step 4: Generate Report

```json
{
  "report_date": "2024-01-15",
  "summary": {
    "total_files": 45,
    "total_lines": 12500,
    "lint_errors": 3,
    "lint_warnings": 18,
    "high_complexity_functions": 5,
    "code_smells": 12,
    "maintainability_index": 72
  },
  "lint_issues": [],
  "high_complexity": [
    {"file": "src/scanner.ts", "function": "processSignals", "complexity": 15}
  ],
  "code_smells": [
    {"type": "magic_number", "file": "src/config.ts", "line": 42, "details": "0.05 should be a named constant"}
  ],
  "trends": {
    "lint_errors_change": -2,
    "complexity_change": 0,
    "maintainability_trend": "improving"
  }
}
```

### Step 5: Save and Alert

1. Write to `memory/ops/quality/{YYYY-MM-DD}.json`
2. Alert on new lint errors (regression)
3. Notify on maintainability index changes

### Anti-Patterns

- Do NOT auto-fix code. Report issues for human developers.
- Do NOT treat all lint warnings as critical. Prioritize by impact.
- Do NOT run linters that are not already configured in the project.

### Exit Codes

- `SKILL_OK` — quality analysis complete
- `SKILL_PARTIAL` — some analyzers failed
- `SKILL_FAIL` — could not analyze code

### Output

Commit message format: `ops: code-quality — maintainability {score}/100, {errors} errors, {smells} smells`
