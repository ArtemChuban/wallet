---
phase: "03"
slug: "dated-balance-snapshots"
status: verified
threats_open: 0
asvs_level: 1
created: "2026-09-03"
---

# Phase 03 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|----------------|
| Migration SQL → host SQLite | DDL creates BalanceSnapshot + unique index | Schema / DDL |
| Zod / Server Actions → SQLite | Untrusted asOfDate / amountMajor / accountId | FormData → DB writes |
| Browser confirm → delete action | User intent gate before snapshot delete | UI → deleteBalanceSnapshot |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-03-01 | Tampering | asOfDate Zod + future gate | high | mitigate | YYYY-MM-DD schema; server `asOfDate > today` Russian reject | closed |
| T-03-02 | Tampering | LOCF helper | high | mitigate | `getBalanceAsOf` returns null when empty — never coerce to 0n | closed |
| T-03-03 | Tampering | unique overwrite | medium | accept | Intended D-09 upsert; @@unique(accountId, asOfDate) | closed |
| T-03-04 | Tampering | debt column smuggling | high | mitigate | BalanceSnapshot has only amountMinor; no debtMinor field | closed |
| T-03-05 | Tampering | accountId | medium | mitigate | Zod positive int + prisma account must exist | closed |
| T-03-06 | Tampering | credit available bounds | high | mitigate | After parseMajorToMinor enforce 0..creditLimitMinor | closed |
| T-03-07 | Tampering | debt field smuggling | high | mitigate | Zod .strict(); upsert data only amountMinor | closed |
| T-03-08 | Tampering | float money | high | mitigate | parseMajorToMinor BigInt only | closed |
| T-03-09 | Tampering | deleteBalanceSnapshot id | medium | mitigate | Zod positive int; prisma delete by id | closed |
| T-03-10 | Repudiation | accidental delete | medium | mitigate | window.confirm with dated Russian copy | closed |
| T-03-11 | Elevation of Privilege | delete from Dialog | low | mitigate | Delete only in history list; dialog not wired | closed |
| T-03-SC | Tampering | npm installs | high | accept | No new packages this phase | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on (high) count toward threats_open*
*Disposition: mitigate · accept · transfer*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-03-01 | T-03-03 | Same-day overwrite is intended BAL-01 / D-09 upsert identity | plan threat model | 2026-09-03 |
| AR-03-02 | T-03-SC | No new npm/pip/cargo packages in phase — install legitimacy N/A | plan threat model | 2026-09-03 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-03 | 12 | 12 | 0 | verify-work verify:post (ASVS L1) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-03
