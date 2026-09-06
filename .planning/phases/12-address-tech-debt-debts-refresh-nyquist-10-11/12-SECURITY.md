---
phase: "12"
slug: "address-tech-debt-debts-refresh-nyquist-10-11"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-09-07"
---

# Phase 12 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Client Dialog → Server Action | Untrusted FormData; existing Zod gates must stay | debt/person mutation fields |
| RSC page → DebtsList props | status/remaining must match or throw | status, remainingMinor |
| Debts actions → Next cache | Must not invalidate Капитал `/` | revalidatePath("/debts") only |
| Accounts UI ↔ Debts UI | Shared destructive confirm must stay explicit | confirm/back labels, pending copy |
| Planning docs → compliance claims | VALIDATION frontmatter must not overclaim | status, nyquist_compliant, audit |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-12-01 | Tampering | debts Server Actions / client refresh | medium | mitigate | `revalidatePath("/debts")` only in `actions.ts`; `router.refresh()` on DebtDetail/Form/Person/DebtsList success; DISOL tests forbid dashboard root | closed |
| T-12-02 | Tampering | page.tsx status vs remaining | medium | mitigate | `assertStatusSynced` after both `remainingMinor` sites in `src/app/debts/page.tsx` (hard throw) | closed |
| T-12-03 | Spoofing | CLOSED bucket vs hero OPEN filter | low | mitigate | Status remains single UI source; assert keeps DB status honest before props | closed |
| T-12-04 | Tampering | updateDebtMeta initial smuggle | medium | mitigate | `assertInitialImmutable` JSDoc → `updateDebtMetaSchema` omit + `.strict()` as runtime DEBT-03 | closed |
| T-12-05 | Repudiation | DestructiveConfirmStep consumers | medium | mitigate | Verbatim move to `src/components/ui/destructive-confirm-step.tsx`; confirm/back/pending copy unchanged | closed |
| T-12-06 | Tampering | Import path drift | low | mitigate | Four consumers import ui path; `AccountList.test` rejects `components/debts/DestructiveConfirmStep` | closed |
| T-12-07 | Repudiation | 10/11/12 VALIDATION.md flips | medium | mitigate | Suite green then frontmatter; Validation Audit sections cite `npm test` | closed |
| T-12-08 | Tampering | False nyquist_compliant | low | mitigate | Per-Task map rewritten to real 12-01/02/03 IDs; phantom 12-04 rows removed | closed |
| T-12-SC | Tampering | npm installs | high | accept | No package installs this phase (refresh/assert/move/docs only) | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-12-01 | T-12-SC | No new npm packages in phase 12 — refresh, assert, file move, VALIDATION docs only | plan threat model | 2026-09-07 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-07 | 9 | 9 | 0 | gsd-verify-work → secure-phase (L1 ASVS) |

## Security Audit 2026-09-07

| Metric | Count |
|--------|-------|
| Threats found | 9 |
| Closed | 9 |
| Open | 0 |

L1 grep-depth verification (ASVS level 1). `register_authored_at_plan_time: true`. SUMMARY threat flags: none. Auditor skipped per short-circuit (threats_open: 0, plan-time register, asvs_level == 1).

Evidence checked:
- T-12-01: `revalidatePath("/debts")` in `src/app/debts/actions.ts`; no root revalidate; `router.refresh` in four debt dialogs/list
- T-12-02: two `assertStatusSynced` call sites in `src/app/debts/page.tsx`
- T-12-03: status-based bucketing unchanged; assert before serialize
- T-12-04: JSDoc + `updateDebtMetaSchema` omit/`.strict()` in `src/lib/debts.ts` / `src/lib/validations/debts.ts`
- T-12-05: `src/components/ui/destructive-confirm-step.tsx` present; old debts path gone
- T-12-06: four ui imports; AccountList.test path contract
- T-12-07/08: 10/11/12 VALIDATION `status: validated` + `nyquist_compliant: true` + Validation Audit

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-07
