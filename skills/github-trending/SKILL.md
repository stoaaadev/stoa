---
name: github-trending
description: Tracks trending GitHub repositories in crypto, DeFi, AI agents, and related domains
tags: [research, github, trending, developer, open-source]
agent: researcher
var: >
  ${var} filters to a specific language or topic. If set (e.g., "rust", "AI agents"),
  narrow the scan. If empty, scan all relevant topics.
---

# github-trending

> **Priority**: P2 (runs daily)
> **Schedule**: 09:00 UTC
> **Data sources**: GitHub API, GitHub trending page
> **Output**: Trending repos report in `memory/research/github/`

## Instructions

You are executing the **github-trending** skill for the Researcher agent.

### Step 1: Load State

Read `memory/research/github/trending-state.json`:

```json
{
  "last_scan": "ISO-8601",
  "tracked_repos": {
    "owner/repo": {
      "first_seen": "ISO-8601",
      "stars_when_found": 150,
      "stars_current": 890,
      "language": "Rust",
      "topic": "solana"
    }
  },
  "search_topics": ["solana", "defi", "mev", "blockchain", "smart-contract", "autonomous-agent", "llm-agent", "trading-bot", "zero-knowledge"]
}
```

Initialize with defaults if not found.

### Step 2: Search Trending Repos

Run multiple GitHub searches for each topic:

```bash
curl -s -H "Authorization: token ${GITHUB_TOKEN}" \
  "https://api.github.com/search/repositories?q=topic:{topic}+created:>{30_days_ago}&sort=stars&order=desc&per_page=20"
```

Also search for recently active repos with high star velocity:

```bash
curl -s -H "Authorization: token ${GITHUB_TOKEN}" \
  "https://api.github.com/search/repositories?q=topic:{topic}+pushed:>{7_days_ago}+stars:>50&sort=stars&order=desc&per_page=20"
```

### Step 3: Compute Star Velocity

For repos already in `tracked_repos`, calculate:
- Stars gained since last scan
- Star velocity (stars/day over last 7 days)
- Percentile rank within their category

Flag repos with:
- **Breakout**: >100 stars gained in 7 days AND star velocity accelerating
- **Steady growth**: >20 stars/day sustained over 2+ weeks
- **New entrant**: First seen this scan with >200 stars

### Step 4: Analyze Top Repos

For top 10 repos by star velocity, fetch additional data:

```bash
curl -s -H "Authorization: token ${GITHUB_TOKEN}" "https://api.github.com/repos/{owner}/{repo}"
curl -s -H "Authorization: token ${GITHUB_TOKEN}" "https://api.github.com/repos/{owner}/{repo}/contributors?per_page=5"
curl -s -H "Authorization: token ${GITHUB_TOKEN}" "https://api.github.com/repos/{owner}/{repo}/commits?per_page=10"
```

Assess:
- Commit frequency and recency
- Number of contributors
- Quality of README and documentation
- License type
- Whether it is a fork of something notable
- Key dependencies (package.json, Cargo.toml, requirements.txt)

### Step 5: Generate Report

```json
{
  "scan_date": "2024-01-15",
  "trending_repos": [
    {
      "repo": "owner/repo",
      "url": "https://github.com/owner/repo",
      "description": "...",
      "language": "Rust",
      "stars": 890,
      "stars_7d_gain": 340,
      "star_velocity": 48.6,
      "forks": 120,
      "contributors": 15,
      "last_commit": "2024-01-14",
      "topics": ["solana", "defi"],
      "category": "breakout | steady_growth | new_entrant",
      "relevance": "Why this matters to our domain",
      "notable": true
    }
  ],
  "summary": {
    "total_repos_scanned": 200,
    "new_repos_found": 12,
    "breakout_repos": 3,
    "top_languages": {"Rust": 8, "TypeScript": 6, "Python": 4},
    "hottest_topics": ["AI agents", "restaking"]
  }
}
```

### Step 6: Save and Notify

1. Write to `memory/research/github/{YYYY-MM-DD}.json`
2. Update `memory/research/github/trending-state.json`
3. Post breakout repos to analyst mesh
4. Notify on repos with >500 stars gained in 7 days

### Anti-Patterns

- Do NOT count forks as trending. Only track original repositories.
- Do NOT include repos with no README or clear spam/scam projects.
- Do NOT exceed GitHub API rate limits. Space requests with 1s delay.
- Do NOT track private or archived repositories.

### Exit Codes

- `SKILL_OK` — scan complete, N trending repos identified
- `SKILL_PARTIAL` — rate limit hit, partial results
- `SKILL_EMPTY` — no notable trending repos found
- `SKILL_FAIL` — could not access GitHub API

### Output

Commit message format: `researcher: github-trending — {N} repos, {M} breakouts [{top_repo}]`
