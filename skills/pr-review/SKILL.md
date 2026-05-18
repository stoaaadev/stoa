---
name: pr-review
description: Automated code review for pull requests — checks style, security, correctness, and test coverage
tags: [devops, code-review, pull-requests, quality, security]
agent: ops
var: >
  ${var} specifies the PR to review. If set (e.g., "#42"), review that PR.
  If empty, review all open PRs without review.
---

# pr-review

> **Priority**: P1 (runs every 4 hours)
> **Data sources**: GitHub PR API, diff content
> **Output**: Review comments in `memory/ops/reviews/`

## Instructions

You are executing the **pr-review** skill for the Ops agent.

### Step 1: Fetch PRs Needing Review

```bash
curl -s -H "Authorization: token ${GITHUB_TOKEN}" \
  "https://api.github.com/repos/{owner}/{repo}/pulls?state=open&per_page=20"
```

Filter to PRs without reviews or with only bot reviews.

### Step 2: Analyze Each PR

For each PR, fetch the diff:
```bash
curl -s -H "Authorization: token ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github.v3.diff" \
  "https://api.github.com/repos/{owner}/{repo}/pulls/{number}"
```

Also fetch changed files:
```bash
curl -s -H "Authorization: token ${GITHUB_TOKEN}" \
  "https://api.github.com/repos/{owner}/{repo}/pulls/{number}/files"
```

### Step 3: Review Dimensions

**Correctness:**
- Logic errors or potential bugs
- Edge cases not handled
- Null/undefined safety
- Error handling completeness

**Security:**
- Hardcoded secrets or API keys
- Injection vulnerabilities (SQL, command, XSS)
- Unsafe deserialization
- Missing input validation
- Dependency vulnerabilities in new dependencies

**Style and Consistency:**
- Naming conventions
- Code formatting
- Comment quality
- File organization

**Performance:**
- N+1 queries or unnecessary loops
- Missing caching where beneficial
- Large memory allocations
- Blocking operations in async contexts

**Testing:**
- New code has corresponding tests
- Edge cases covered
- Test quality (not just coverage)

### Step 4: Generate Review

```json
{
  "pr_number": 42,
  "title": "Add limit order support",
  "author": "developer",
  "files_changed": 8,
  "lines_added": 250,
  "lines_removed": 45,
  "review_date": "ISO-8601",
  "verdict": "approve | request_changes | comment",
  "summary": "Well-structured PR. Two security concerns need addressing before merge.",
  "findings": [
    {
      "file": "src/orders.ts",
      "line": 45,
      "severity": "high",
      "category": "security",
      "finding": "User input passed directly to shell command without sanitization",
      "suggestion": "Use parameterized input or sanitize with escapeShellArg()"
    }
  ],
  "positive_notes": ["Good test coverage for happy path", "Clean separation of concerns"],
  "metrics": {
    "correctness_score": 8,
    "security_score": 5,
    "style_score": 9,
    "test_score": 7
  }
}
```

### Step 5: Save

1. Write to `memory/ops/reviews/pr-{number}.json`
2. Alert guardian on security findings (severity: high or critical)
3. Notify for PRs with verdict: request_changes

### Sandbox Note

In GitHub Actions sandbox, posting PR review comments requires write permission. Reviews are saved locally. A separate step can post them via `gh pr review`.

### Anti-Patterns

- Do NOT approve PRs with unresolved security findings.
- Do NOT nitpick style when there are correctness issues. Prioritize.
- Do NOT block PRs for minor style issues. Use "comment" verdict.
- Do NOT review your own PRs (if the PR is from the ops agent).

### Exit Codes

- `SKILL_OK` — review complete
- `SKILL_PARTIAL` — some files too large to review
- `SKILL_EMPTY` — no PRs needing review
- `SKILL_FAIL` — could not access PR data

### Output

Commit message format: `ops: pr-review — PR #{number} ({verdict})`
