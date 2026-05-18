---
name: developer-activity
description: Tracks developer activity across blockchain ecosystems — commits, contributors, new repos
tags: [research, developers, github, activity, metrics]
agent: researcher
var: >
  ${var} specifies which ecosystem or organization to analyze. If set (e.g., "Solana",
  "Jupiter"), focus there. If empty, scan all tracked ecosystems.
---

# developer-activity

> **Priority**: P2 (runs weekly)
> **Schedule**: Sunday 10:00 UTC
> **Data sources**: GitHub API, Electric Capital developer report methodology
> **Output**: Developer activity reports in `memory/research/dev-activity/`

## Instructions

You are executing the **developer-activity** skill for the Researcher agent.

### Step 1: Load Tracked Organizations

Read `memory/research/dev-activity/orgs.json`:

```json
{
  "ecosystems": {
    "solana": {
      "orgs": ["solana-labs", "solana-foundation", "jito-foundation", "marinade-finance", "orca-so", "raydium-io", "drift-labs", "marginfi-v2"],
      "repos": ["coral-xyz/anchor"]
    }
  },
  "last_scan": "ISO-8601"
}
```

### Step 2: Collect Activity Metrics

For each organization:

```bash
curl -s -H "Authorization: token ${GITHUB_TOKEN}" "https://api.github.com/orgs/{org}/repos?sort=pushed&per_page=30"
```

For each active repo (pushed in last 30 days):

```bash
# Commit activity
curl -s -H "Authorization: token ${GITHUB_TOKEN}" "https://api.github.com/repos/{org}/{repo}/stats/commit_activity"

# Contributors
curl -s -H "Authorization: token ${GITHUB_TOKEN}" "https://api.github.com/repos/{org}/{repo}/stats/contributors"

# Recent commits
curl -s -H "Authorization: token ${GITHUB_TOKEN}" "https://api.github.com/repos/{org}/{repo}/commits?since={7_days_ago}&per_page=100"
```

### Step 3: Compute Metrics

Per organization:
- **Active developers**: Unique committers in last 30 days
- **Full-time developers**: >10 commits/month
- **Part-time developers**: 1-10 commits/month
- **Commit velocity**: Commits per week (4-week rolling average)
- **New contributors**: First-time committers this month
- **Repo activity**: Active repos / total repos ratio

Per ecosystem:
- Total active developers
- Developer growth rate (vs. last month)
- Most active repos
- New repos created

### Step 4: Trend Analysis

Compare to historical data:
- Is developer activity growing, stable, or declining?
- Which protocols are gaining/losing developers?
- Are new developers entering or is growth from existing teams?

### Step 5: Generate Report

```json
{
  "report_date": "2024-01-15",
  "ecosystem": "Solana",
  "metrics": {
    "total_active_devs_30d": 2450,
    "full_time_devs": 890,
    "part_time_devs": 1560,
    "dev_growth_30d_pct": 5.2,
    "total_commits_7d": 12500,
    "new_repos_7d": 34,
    "new_contributors_7d": 89
  },
  "top_orgs_by_activity": [
    {"org": "solana-labs", "commits_7d": 450, "active_devs": 89}
  ],
  "trending_repos": [
    {"repo": "org/repo", "commits_7d": 120, "description": "..."}
  ],
  "notable_changes": [
    "Drift Protocol developer count up 30% — hiring push",
    "New anchor-based lending protocol with 15 contributors"
  ]
}
```

### Step 6: Save and Distribute

1. Write to `memory/research/dev-activity/{YYYY-MM-DD}.json`
2. Post summary to analyst mesh (developer trends correlate with protocol success)
3. Notify on significant developer growth/decline (>20% change)

### Anti-Patterns

- Do NOT count bots or CI commits as developer activity.
- Do NOT include forked repos unless they have significant original commits.
- Respect GitHub API rate limits strictly. Use conditional requests (If-Modified-Since).

### Exit Codes

- `SKILL_OK` — activity report generated
- `SKILL_PARTIAL` — some orgs could not be fully analyzed (rate limits)
- `SKILL_FAIL` — critical failure

### Output

Commit message format: `researcher: developer-activity — {ecosystem} {N} active devs ({change}%)`
