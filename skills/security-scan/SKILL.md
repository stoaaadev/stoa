---
name: security-scan
description: Scans codebase for security vulnerabilities — hardcoded secrets, injection risks, unsafe patterns
tags: [devops, security, scanning, vulnerabilities, code]
agent: ops
var: >
  ${var} specifies the scan scope. If set (e.g., "src/"), scan that directory.
  If empty, scan entire codebase.
---

# security-scan

> **Priority**: P0 (runs daily)
> **Schedule**: 05:00 UTC
> **Output**: Security report in `memory/ops/security/`

## Instructions

You are executing the **security-scan** skill for the Ops agent.

### Step 1: Secret Detection

Scan for accidentally committed secrets:

```bash
# Check for common secret patterns
grep -rn "PRIVATE_KEY\|SECRET_KEY\|API_KEY\|password\s*=\|token\s*=" --include="*.ts" --include="*.js" --include="*.json" --include="*.env" . 2>/dev/null | grep -v node_modules | grep -v ".example"
```

Patterns to detect:
- AWS keys (`AKIA...`)
- Private keys (base58 Solana keys, hex Ethereum keys)
- API tokens (Bearer tokens, JWT)
- Database connection strings
- Webhook URLs with tokens

### Step 2: Code Vulnerability Scan

Check for unsafe patterns:

**Command injection:**
- `exec()`, `spawn()`, `system()` with user input
- String interpolation in shell commands

**Path traversal:**
- File operations with unsanitized user input
- `../` in path constructions

**Unsafe deserialization:**
- `eval()` on external data
- `JSON.parse()` without try-catch on untrusted input

**Crypto weaknesses:**
- Weak random number generation (`Math.random()` for security)
- Hardcoded encryption keys
- Deprecated crypto algorithms

### Step 3: Dependency Vulnerability Cross-Reference

Cross-reference with `memory/ops/dependency-audit/latest.json` for known CVEs in dependencies.

### Step 4: Generate Report

```json
{
  "scan_date": "2024-01-15",
  "findings": {
    "critical": 0,
    "high": 1,
    "medium": 3,
    "low": 5,
    "info": 8
  },
  "details": [
    {
      "severity": "high",
      "category": "secret_exposure",
      "file": "config/test.json",
      "line": 15,
      "description": "Possible API key in test configuration",
      "recommendation": "Move to environment variables, add to .gitignore",
      "cwe": "CWE-798"
    }
  ],
  "scan_coverage": {
    "files_scanned": 120,
    "patterns_checked": 45,
    "scan_duration_seconds": 12
  }
}
```

### Step 5: Save and Alert

1. Write to `memory/ops/security/{YYYY-MM-DD}.json`
2. IMMEDIATE alert to guardian on critical/high findings
3. Alert ops for medium findings
4. Notify on scan completion with summary

### Anti-Patterns

- Do NOT expose actual secret values in the report. Redact to first 4 chars + asterisks.
- Do NOT ignore findings in test files. Test secrets can be real secrets.
- Do NOT skip scanning configuration and infrastructure files.

### Exit Codes

- `SKILL_OK` — scan complete, {N} findings
- `SKILL_PARTIAL` — some files could not be scanned
- `SKILL_FAIL` — scanner could not run

### Output

Commit message format: `ops: security-scan — {critical}C/{high}H/{medium}M findings`
