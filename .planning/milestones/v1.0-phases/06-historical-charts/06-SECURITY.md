---
phase: "06"
slug: "historical-charts"
status: verified
threats_open: 0
asvs_level: 1
created: "2026-09-04"
---

# Phase 06 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|----------------|
| RSC → client chart island | Snapshot/rate minors as strings; client BigInt revive + series rebuild | Read-only DB-derived series |
| ChartTooltip / labels | Account names + formatted amounts | React text; ChartConfig colors |
| Expand body on `/` | Chart-only UI | No mutations / Server Actions |
| npm recharts via shadcn chart | Third-party chart render | Pinned dependency |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-06-01 | Tampering | ChartTooltip labels | medium | mitigate | Names/amounts as React text; no user HTML in tooltips | closed |
| T-06-02 | Tampering | chartConfig | low | mitigate | ChartConfig built in source (`satisfies ChartConfig`); no JSON.parse of user config. shadcn `ChartStyle` uses `dangerouslySetInnerHTML` only for static CSS color vars from config | closed |
| T-06-03 | Information | Client series rebuild | low | accept | Client filters preset enum and recomputes from server-fetched rows; no new mutation surface | closed |
| T-06-04 | Elevation | `/` chart UI | low | mitigate | No chart Server Actions; read-only dashboard | closed |
| T-06-05 | Tampering | AccountHistoryChart tooltip | medium | mitigate | `accountName` and amounts via React text / format helpers; no dangerouslySetInnerHTML in dashboard charts | closed |
| T-06-06 | Tampering | Expand body | low | mitigate | Chart-only expand; no set/delete forms (D-04) | closed |
| T-06-07 | Information | Primary-mode series | low | accept | Skipping null-FX points may reveal FX gaps; intentional honesty per D-16 | closed |
| T-06-08 | Tampering | Credit Area tooltips | medium | mitigate | Static Russian labels долг/доступно; amounts via format helpers as React text | closed |
| T-06-09 | Repudiation | Chart paint UAT | low | accept | Manual checkpoint records human confirmation; no audit log in v1 | closed |
| T-06-10 | Elevation | Expand body | low | mitigate | Still no Server Actions or delete/set controls (D-04) | closed |
| T-06-SC | Tampering | npm recharts | high | mitigate | Package Legitimacy OK; pinned `recharts@3.10.1`; no new installs in Plans 02–03 | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on (high) count toward threats_open*
*Disposition: mitigate · accept · transfer*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-06-01 | T-06-03 | Client recomputes series from server rows only; preset is enum — accepted plan threat model | plan threat model | 2026-09-04 |
| AR-06-02 | T-06-07 | Null-FX gaps intentional (D-16 honesty) | plan threat model | 2026-09-04 |
| AR-06-03 | T-06-09 | Human UAT confirmation sufficient for v1; no chart audit log | plan threat model | 2026-09-04 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-04 | 11 | 11 | 0 | verify-work verify:post (ASVS L1) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-04
