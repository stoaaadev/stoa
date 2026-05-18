---
name: ci-monitor
description: Monitors CI/CD pipeline status, build times, failure patterns, and flaky tests
tags: [devops, ci-cd, monitoring, builds, testing]
agent: ops
var: >
  ${var} specifies the workflow or branch to focus on. If set (e.g., "main branch"),
  focus there. If empty, monitor all workflows.
---

# ci-monitor

> **Priority**: P1 (runs every 2 hours)
> **Data sources**: GitHub Actions API
> **Output**: CI reports in `memory/ops/ci/`

## Instructions

You are executing the **ci-monitor** skill for the Ops agent.

### Step 1: Fetch Workflow Runs

```bash
curl -s -H "Authorization: token ${GITHUB_TOKEN}" \
  "https://api.github.com/repos/{owner}/{repo}/actions/runs?per_page=30&status=completed"
```

Also fetch currently running workflows:
```bash
curl -s -H "Authorization: token ${GITHUB_TOKEN}" \
  "https://api.github.com/repos/{owner}/{repo}/actions/runs?status=in_progress"
```

### Step 2: Analyze Build Health

**Success rate:**
- Overall pass/fail ratio (last 30 runs)
- Per-workflow pass rate
- Trend (improving or degrading)

**Build times:**
- Average build time per workflow
- P95 build time
- Trend (getting faster or slower)

**Failure patterns:**
- Most common failure reasons
- Flaky tests (tests that sometimes pass, sometimes fail)
- Infrastructure failures vs. code failures

### Step 3: Identify Flaky Tests

A test is "flaky" if:
- It failed in a run but the same commit passed on retry
- It fails >10% of the time but <90% (not consistently broken)

```bash
# Fetch job details for failed runs
curl -s -H "Authorization: token ${GITHUB_TOKEN}" \
  "https://api.github.com/repos/{owner}/{repo}/actions/runs/{run_id}/jobs"
```

### Step 4: Generate Report

```json
{
  "report_date": "ISO-8601",
  "summary": {
    "total_runs_24h": 15,
    "success_rate_pct": 86.7,
    "avg_build_time_seconds": 180,
    "currently_running": 2,
    "currently_failing": 0
  },
  "workflows": {
    "test": {"runs": 10, "success_rate": 90, "avg_time_s": 120},
    "deploy": {"runs": 5, "success_rate": 80, "avg_time_s": 300}
  },
  "recent_failures": [
    {
      "run_id": 12345,
      "workflow": "test",
      "branch": "feature/x",
      "failure_reason": "TypeError in scan-tokens test",
      "is_flaky": false,
      "url": "https://github.com/{owner}/{repo}/actions/runs/12345"
    }
  ],
  "flaky_tests": ["test/scan-tokens.test.ts: whale detection"],
  "trends": {
    "success_rate_7d_trend": "stable",
    "build_time_7d_trend": "increasing"
  }
}
```

### Step 5: Save and Alert

1. Write to `memory/ops/ci/{YYYY-MM-DD}.json`
2. Alert on main branch failures (immediate)
3. Alert on success rate dropping below 80%
4. Notify on flaky test identification
5. Alert on build time increase >50%

### Anti-Patterns

- Do NOT restart failed builds automatically. Report and let humans decide.
- Do NOT ignore flaky tests. They erode CI reliability over time.
- Do NOT consider infrastructure timeouts as code failures.

### Exit Codes

- `SKILL_OK` — CI monitoring complete
- `SKILL_PARTIAL` — some workflow data unavailable
- `SKILL_FAIL` — could not access GitHub Actions

### Output

Commit message format: `ops: ci-monitor — {success_rate}% success, {N} runs, {M} flaky tests`
