---
phase: "20"
slug: "obligation-crud-cycle-ui"
status: verified
threats_open: 0
asvs_level: 1
created: "2026-09-09"
---

# Phase 20 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Built at verify:post from PLAN threat models (register_authored_at_plan_time: true, ASVS L1).

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| FormData / client → Server Actions | Untrusted DOM, amount, cycleStart, spoofed dueAsOf / closedAsOf | Grace create/update/close/reopen + schedule |
| Grace dialog UI → AccountList props | Serialized BigInt + schedule ints from RSC | READ-only props |
| Grace writes → BalanceSnapshot | Must remain disconnected (GRISO) | No snapshot mutations on grace paths |
| Client today string → overdue chrome | Calendar compare must use injected RSC today | `today` prop from `calendarDateToday()` |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-20-01 | Tampering | Crafted amount / DOM / closedAsOf FormData | high | mitigate | Zod create + updateGraceScheduleSchema + updateCreditGraceObligationSchema; OPEN-only update gate | closed |
| T-20-02 | Tampering | Client spoofed dueAsOf on create | high | mitigate | Server `dueAsOfForCycle` overwrite in `createCreditGraceObligation` | closed |
| T-20-03 | Tampering | BalanceSnapshot write from grace paths | high | mitigate | Grace actions touch CreditGraceObligation / Account DOM only; vitest asserts snapshot APIs unused on create/update/close/reopen | closed |
| T-20-04 | Tampering | Create without schedule | medium | mitigate | `assertAccountHasGraceSchedule` before create | closed |
| T-20-05 | Tampering | Duplicate cycle insert | medium | mitigate | `@@unique([accountId, cycleStartAsOf])` + P2002 → RU error | closed |
| T-20-06 | Tampering | Close without closedAsOf | medium | mitigate | Zod CLOSED↔closedAsOf refine; UI required date in DestructiveConfirmStep | closed |
| T-20-07 | Repudiation | Accidental close | low | accept | Reopen with confirm (D-12); single-user local app | closed |
| T-20-08 | Spoofing | Client-skewed today for overdue | medium | mitigate | Inject `today` from `calendarDateToday()` on accounts page; `isGraceOverdue` pure compare | closed |
| T-20-09 | Information Disclosure | Snapshot debt duplicated in grace UI | medium | mitigate | UX-01 disclaimer + source-scan forbids debt amount in grace dialog | closed |
| T-20-SC | Tampering | npm installs | high | mitigate | Zero new packages this phase | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above `workflow.security_block_on` (high) count toward threats_open*
*Disposition: mitigate · accept · transfer*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-20-01 | T-20-07 | Accidental close reversible via reopen confirm; local single-user wallet | plan disposition | 2026-09-09 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-09 | 10 | 10 | 0 | verify-work / secure-phase L1 |

Evidence: 63/63 vitest (actions + validations + credit-grace + UI source-scan); grep confirms `dueAsOfForCycle`, schedule assert, Zod schemas, `calendarDateToday` injection; no `window.confirm` in grace components.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-09
