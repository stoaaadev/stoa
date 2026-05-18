---
name: security-audit-watch
description: Tracks security audit reports, bug bounties, and vulnerability disclosures for DeFi protocols
tags: [research, security, audits, vulnerabilities, monitoring]
agent: researcher
var: >
  ${var} focuses on a specific protocol or auditor. If set (e.g., "OtterSec audits"),
  narrow the search. If empty, scan all recent audit activity.
---

# security-audit-watch

> **Priority**: P1 (runs daily)
> **Schedule**: 16:00 UTC
> **Data sources**: Audit firm GitHub repos, bug bounty platforms, security advisories
> **Output**: Security reports in `memory/research/security/`

## Instructions

You are executing the **security-audit-watch** skill for the Researcher agent.

### Step 1: Load Audit Firms and Sources

Read `memory/research/security/config.json`:

```json
{
  "audit_firms": [
    {"name": "OtterSec", "github": "otter-sec"},
    {"name": "Neodyme", "github": "neodyme-labs"},
    {"name": "Trail of Bits", "github": "trailofbits"},
    {"name": "OpenZeppelin", "github": "OpenZeppelin"},
    {"name": "Halborn", "github": "halborn"}
  ],
  "bug_bounty_platforms": ["immunefi.com"],
  "last_scan": "ISO-8601"
}
```

### Step 2: Scan Audit Reports

For each audit firm, check their GitHub for new reports:

```bash
curl -s -H "Authorization: token ${GITHUB_TOKEN}" "https://api.github.com/repos/{org}/audits/contents" 2>/dev/null
curl -s -H "Authorization: token ${GITHUB_TOKEN}" "https://api.github.com/orgs/{org}/repos?sort=pushed&per_page=10"
```

Search for new audit publications:
Use WebSearch: `site:github.com "{audit_firm}" audit report solana {recent_date}`

### Step 3: Track Bug Bounties

Check Immunefi for new and updated bounties:
Use WebSearch: `site:immunefi.com solana defi bounty`

Track:
- New bug bounty programs launched
- Bounty payouts (indicates found vulnerabilities)
- Programs with increasing bounty amounts (signals concern)

### Step 4: Vulnerability Monitoring

Search for recently disclosed vulnerabilities:
Use WebSearch: `solana vulnerability disclosure defi exploit {recent_date}`

Check for:
- CVEs related to blockchain/DeFi
- Security advisories from Solana Foundation
- Disclosed but not yet patched vulnerabilities (critical!)

### Step 5: Generate Report

```json
{
  "report_date": "2024-01-15",
  "new_audits": [
    {
      "protocol": "NewDEX",
      "auditor": "OtterSec",
      "date": "2024-01-12",
      "findings": {"critical": 0, "high": 2, "medium": 5, "low": 8, "info": 12},
      "status": "all findings resolved",
      "report_url": "https://github.com/..."
    }
  ],
  "bug_bounties": [
    {
      "protocol": "Jupiter",
      "max_bounty_usd": 500000,
      "status": "active",
      "recent_payout": false
    }
  ],
  "vulnerabilities": [],
  "protocols_without_audits": ["protocol list from our watchlist that lack audits"],
  "risk_updates": [
    {"protocol": "ProtocolY", "change": "New audit completed, risk reduced"}
  ]
}
```

### Step 6: Save and Alert

1. Write to `memory/research/security/{YYYY-MM-DD}.json`
2. URGENT alert to guardian on critical/high vulnerabilities in protocols we interact with
3. Alert analyst on new audit results for watched protocols
4. Notify on new bug bounty payouts (signals past vulnerabilities)

### Anti-Patterns

- Do NOT disclose or share specific exploit details that could enable attacks.
- Do NOT access private security reports or embargoed disclosures.
- Do NOT test vulnerabilities or interact with potentially vulnerable contracts.
- ALWAYS prioritize responsible disclosure awareness.

### Exit Codes

- `SKILL_OK` — security watch complete
- `SKILL_PARTIAL` — some sources unavailable
- `SKILL_EMPTY` — no new security developments
- `SKILL_FAIL` — critical failure

### Output

Commit message format: `researcher: security-audit-watch — {N} new audits, {M} advisories`
