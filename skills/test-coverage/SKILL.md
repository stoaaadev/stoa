---
name: test-coverage
description: Measures and tracks test coverage — identifies untested code and coverage trends
tags: [devops, testing, coverage, quality, metrics]
agent: ops
var: >
  ${var} specifies the test scope. If set (e.g., "src/scanner"),
  focus coverage analysis there. If empty, analyze full project.
---

# test-coverage

> **Priority**: P2 (runs weekly)
> **Schedule**: Monday 08:00 UTC
> **Output**: Coverage report in `memory/ops/coverage/`

## Instructions

You are executing the **test-coverage** skill for the Ops agent.

### Step 1: Run Tests with Coverage

```bash
npx jest --coverage --coverageReporters=json-summary --silent 2>/dev/null || \
npx vitest run --coverage --reporter=json 2>/dev/null || \
echo "No supported test runner found"
```

### Step 2: Parse Coverage Data

Read coverage summary and extract:
- **Line coverage**: % of executable lines covered
- **Branch coverage**: % of conditional branches covered
- **Function coverage**: % of functions called
- **Statement coverage**: % of statements executed

### Step 3: Identify Coverage Gaps

Find files with lowest coverage:
- Files with 0% coverage (completely untested)
- Files with <50% coverage (critically undertested)
- Critical files (config, security, trading logic) with <80% coverage

### Step 4: Trend Analysis

Compare to previous week's coverage:
- Overall coverage change
- Which files improved or degraded
- New files added without tests

### Step 5: Generate Report

```json
{
  "report_date": "2024-01-15",
  "overall": {
    "lines": 72.5,
    "branches": 65.3,
    "functions": 78.1,
    "statements": 73.2
  },
  "change_from_last_week": {
    "lines": 1.2,
    "branches": -0.5
  },
  "critical_gaps": [
    {"file": "src/executor.ts", "line_coverage": 35.2, "reason": "Trading logic needs more test coverage"}
  ],
  "untested_files": ["src/new-feature.ts"],
  "recommendations": [
    "Add tests for executor.ts — critical trading logic at 35% coverage",
    "New file src/new-feature.ts has no tests"
  ]
}
```

### Step 6: Save and Alert

1. Write to `memory/ops/coverage/{YYYY-MM-DD}.json`
2. Alert on coverage drops >5% (regression)
3. Alert on critical files (trading, security) below 60%

### Anti-Patterns

- Do NOT set arbitrary coverage targets. Focus on critical paths.
- Do NOT count trivially-tested code as properly covered.
- Do NOT run tests that modify production state.

### Exit Codes

- `SKILL_OK` — coverage analysis complete
- `SKILL_PARTIAL` — some test suites failed
- `SKILL_FAIL` — could not run tests

### Output

Commit message format: `ops: test-coverage — {line_pct}% lines, {branch_pct}% branches ({change})`
