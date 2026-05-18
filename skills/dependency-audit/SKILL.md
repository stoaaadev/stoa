---
name: dependency-audit
description: Audits project dependencies for vulnerabilities, outdated packages, and license compliance
tags: [devops, dependencies, security, audit, maintenance]
agent: ops
var: >
  ${var} specifies the package manager or scope. If set (e.g., "npm only"),
  audit that. If empty, audit all detected package managers.
---

# dependency-audit

> **Priority**: P1 (runs weekly)
> **Schedule**: Tuesday 06:00 UTC
> **Output**: Audit report in `memory/ops/dependency-audit/`

## Instructions

You are executing the **dependency-audit** skill for the Ops agent.

### Step 1: Detect Package Managers

```bash
ls package.json Cargo.toml requirements.txt go.mod pyproject.toml 2>/dev/null
```

### Step 2: Run Security Audits

**npm/yarn:**
```bash
npm audit --json 2>/dev/null
npm outdated --json 2>/dev/null
```

**Cargo (Rust):**
```bash
cargo audit --json 2>/dev/null
```

**pip (Python):**
```bash
pip-audit --format=json 2>/dev/null
```

### Step 3: Analyze Vulnerabilities

For each vulnerability:
- CVE ID and description
- Affected package and version
- Severity (critical/high/medium/low)
- Fixed version available?
- Is the vulnerability in a direct or transitive dependency?
- Is the vulnerability exploitable in our usage context?

### Step 4: License Compliance

Check licenses of all direct dependencies:
```bash
npx license-checker --json --production 2>/dev/null
```

Flag:
- GPL-licensed dependencies in non-GPL projects
- Unknown or proprietary licenses
- Dependencies without license declarations

### Step 5: Generate Report

```json
{
  "audit_date": "2024-01-15",
  "package_manager": "npm",
  "total_dependencies": {"direct": 45, "transitive": 380},
  "vulnerabilities": {
    "critical": 0,
    "high": 2,
    "medium": 5,
    "low": 12,
    "details": [
      {
        "package": "lodash",
        "current_version": "4.17.19",
        "vulnerability": "Prototype Pollution",
        "cve": "CVE-2021-23337",
        "severity": "high",
        "fixed_in": "4.17.21",
        "direct": false,
        "exploitable_in_context": "unlikely"
      }
    ]
  },
  "outdated": {
    "major": 3,
    "minor": 8,
    "patch": 15,
    "details": []
  },
  "license_issues": [],
  "recommendations": [
    {"priority": "P1", "action": "Upgrade lodash to 4.17.21 (high vuln)"},
    {"priority": "P2", "action": "Upgrade typescript from 5.0 to 5.3"}
  ]
}
```

### Step 6: Save and Alert

1. Write to `memory/ops/dependency-audit/{YYYY-MM-DD}.json`
2. Alert guardian on critical/high vulnerabilities
3. Create action items for P1 updates
4. Notify on new vulnerabilities since last audit

### Anti-Patterns

- Do NOT auto-update dependencies. Create recommendations for human review.
- Do NOT ignore transitive dependency vulnerabilities.
- Do NOT dismiss vulnerabilities as "not exploitable" without analysis.

### Exit Codes

- `SKILL_OK` — audit complete, {N} vulnerabilities found
- `SKILL_PARTIAL` — some package managers could not be audited
- `SKILL_FAIL` — could not run audit

### Output

Commit message format: `ops: dependency-audit — {critical}C/{high}H/{medium}M/{low}L vulns, {outdated} outdated`
