---
name: repo-health
description: Comprehensive repository health assessment — code quality, test coverage, dependency freshness, and documentation
tags: [devops, repository, health, quality, monitoring]
agent: ops
var: >
  ${var} specifies the repository to analyze. If set (e.g., "owner/repo"),
  analyze that repo. If empty, analyze the current stoa repository.
---

# repo-health

> **Priority**: P1 (runs weekly)
> **Schedule**: Monday 06:00 UTC
> **Data sources**: GitHub API, local git, npm/cargo audit
> **Output**: Health report in `memory/ops/repo-health/`

## Instructions

You are executing the **repo-health** skill for the Ops agent.

### Step 1: Gather Repository Metrics

```bash
# Basic repo info
curl -s -H "Authorization: token ${GITHUB_TOKEN}" "https://api.github.com/repos/{owner}/{repo}"

# Open issues and PRs
curl -s -H "Authorization: token ${GITHUB_TOKEN}" "https://api.github.com/repos/{owner}/{repo}/issues?state=open&per_page=100"
curl -s -H "Authorization: token ${GITHUB_TOKEN}" "https://api.github.com/repos/{owner}/{repo}/pulls?state=open&per_page=100"

# Recent commits
curl -s -H "Authorization: token ${GITHUB_TOKEN}" "https://api.github.com/repos/{owner}/{repo}/commits?per_page=30"

# Branch protection
curl -s -H "Authorization: token ${GITHUB_TOKEN}" "https://api.github.com/repos/{owner}/{repo}/branches/main/protection"
```

### Step 2: Code Quality Assessment

**Commit hygiene:**
- Average commit message length
- Conventional commit usage rate
- Merge commit vs. squash vs. rebase ratio

**PR discipline:**
- Average PR size (lines changed)
- Average time to merge
- PRs without reviews
- Stale PRs (>14 days open with no activity)

**Issue health:**
- Open issue count and age distribution
- Issues without labels
- Issues without assignees
- Average time to first response

### Step 3: Dependency Health

```bash
# Check for outdated dependencies
npm outdated --json 2>/dev/null || true
# Security audit
npm audit --json 2>/dev/null || true
```

Track:
- Total dependencies (direct + transitive)
- Outdated dependencies count
- Known vulnerabilities (critical, high, medium, low)
- Last dependency update date

### Step 4: Documentation Check

- README exists and is up-to-date
- CHANGELOG maintained
- API documentation exists
- Contributing guidelines present
- License file present

### Step 5: Generate Health Report

```json
{
  "report_date": "2024-01-15",
  "repo": "owner/repo",
  "overall_health_score": 78,
  "dimensions": {
    "code_quality": {"score": 82, "issues": []},
    "pr_discipline": {"score": 75, "stale_prs": 3, "avg_merge_time_hours": 18},
    "issue_health": {"score": 70, "open_issues": 45, "avg_age_days": 12, "unlabeled": 8},
    "dependency_health": {"score": 85, "outdated": 5, "vulnerabilities": {"critical": 0, "high": 1}},
    "documentation": {"score": 72, "missing": ["API docs", "CONTRIBUTING.md"]},
    "ci_cd": {"score": 80, "last_green_build": "2024-01-14T22:00:00Z"}
  },
  "action_items": [
    {"priority": "P1", "action": "Fix 1 high-severity vulnerability in lodash"},
    {"priority": "P2", "action": "Close or update 3 stale PRs"},
    {"priority": "P3", "action": "Add labels to 8 unlabeled issues"}
  ]
}
```

### Step 6: Save and Alert

1. Write to `memory/ops/repo-health/{YYYY-MM-DD}.json`
2. Alert guardian on critical vulnerabilities
3. Post action items to ops mesh
4. Notify if health score drops >10 points from last week

### Anti-Patterns

- Do NOT modify any code or config during health checks. Observe only.
- Do NOT merge or close issues/PRs. Create action items for human review.
- Do NOT expose security vulnerability details in notifications.

### Exit Codes

- `SKILL_OK` — health check complete
- `SKILL_PARTIAL` — some checks failed
- `SKILL_FAIL` — could not access repository

### Output

Commit message format: `ops: repo-health — score {score}/100, {N} action items`
