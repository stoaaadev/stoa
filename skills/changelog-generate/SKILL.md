---
name: changelog-generate
description: Generates a structured changelog from git history, PRs, and release notes
tags: [content, changelog, releases, git, documentation]
agent: writer
var: >
  ${var} specifies the version range or repo. If set (e.g., "v1.2.0..v1.3.0"),
  generate changelog for that range. If empty, generate for unreleased changes.
---

# changelog-generate

> **Priority**: P2 (on-demand or pre-release)
> **Data sources**: Git log, GitHub PRs, issue tracker
> **Output**: Changelog in `memory/content/changelogs/`

## Instructions

You are executing the **changelog-generate** skill for the Writer agent.

### Step 1: Gather Commit History

```bash
git log --oneline --no-merges {from_ref}..{to_ref} --format="%h|%s|%an|%aI"
```

If no range specified, use last tag to HEAD:
```bash
git log --oneline --no-merges $(git describe --tags --abbrev=0)..HEAD --format="%h|%s|%an|%aI"
```

### Step 2: Categorize Changes

Parse commit messages and categorize using conventional commits:
- **Added**: New features (`feat:`)
- **Changed**: Modifications to existing features (`refactor:`, `perf:`)
- **Fixed**: Bug fixes (`fix:`)
- **Security**: Security patches (`security:`)
- **Deprecated**: Soon-to-be-removed features
- **Removed**: Removed features
- **Infrastructure**: CI/CD, build, deps (`chore:`, `ci:`, `build:`)
- **Documentation**: Doc changes (`docs:`)

### Step 3: Enrich with PR Data

For each commit, find associated PR:
```bash
gh pr list --search "{commit_hash}" --state merged --json number,title,labels,body --limit 1
```

Extract:
- PR title and number (link to PR)
- Labels (for additional categorization)
- Breaking changes (from PR body or labels)

### Step 4: Write Changelog

Format as Keep a Changelog (keepachangelog.com):

```markdown
# Changelog

## [{version}] — {date}

### Added
- New scan-tokens whale detection via Helius API (#142)
- Support for Meteora DLMM pools in liquidity-scan (#138)

### Changed
- Improved signal deduplication logic in analyst (#145)
- Reduced API call frequency for DexScreener from 30s to 60s (#143)

### Fixed
- Fixed portfolio value calculation when positions have zero liquidity (#141)
- Corrected timezone handling in morning-brief (#139)

### Security
- Updated dependencies to patch CVE-2024-XXXXX (#140)

### Breaking Changes
- `memory/scan-state.json` schema updated — requires migration (#142)
```

### Step 5: Save

1. Write to `memory/content/changelogs/{version_or_date}.md`
2. If this is a release changelog, also write to `CHANGELOG.md` in repo root
3. Notify with summary of changes

### Anti-Patterns

- Do NOT include merge commits or CI-only changes in user-facing changelog.
- Do NOT rewrite commit messages. Link to the PR for full context.
- Do NOT skip breaking changes. They must be prominently noted.

### Exit Codes

- `SKILL_OK` — changelog generated
- `SKILL_PARTIAL` — some commits could not be categorized
- `SKILL_FAIL` — could not access git history

### Output

Commit message format: `writer: changelog-generate — {version} ({N} changes)`
