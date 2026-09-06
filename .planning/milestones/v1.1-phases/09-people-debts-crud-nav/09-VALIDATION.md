---
phase: "09"
slug: "people-debts-crud-nav"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-04"
validated: "2026-09-05"
---

# Phase 09 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/app/debts/actions.test.ts src/components/nav.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run targeted vitest for touched module
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

Built from PLAN task order. Task IDs = `{phase}-{plan}-{task}` 1-indexed within each plan.

| Task ID | Plan | Task name (short) | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|-------------------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | Wave 0: createPerson + DNAV-01 nav tests | 1 | PERSON-01, DNAV-01 | T-09-01, T-09-02 | Schema + unique-name map | unit | `npx vitest run src/app/debts/actions.test.ts src/components/nav.test.ts` | ✅ | ✅ green |
| 09-01-02 | 01 | Tracer: nav → /debts → create person → list | 1 | PERSON-01, DNAV-01 | T-09-01, T-09-03 | createPerson + /debts revalidate only | unit | same | ✅ | ✅ green |
| 09-01-03 | 01 | Keep DISOL isolation + debts suite green | 1 | DISOL-01 | — | No NW debt imports | unit | `npx vitest run src/lib/debts.test.ts` | ✅ | ✅ green |
| 09-02-01 | 02 | renamePerson + deletePerson actions | 1 | PERSON-01, PERSON-02 | T-09-04, T-09-05 | Delete blocked when debts>0 | unit | `npx vitest run src/app/debts/actions.test.ts` | ✅ | ✅ green |
| 09-02-02 | 02 | DestructiveConfirmStep + person header UX | 1 | PERSON-02 | T-09-06 | No window.confirm in debts UI | grep/unit | `! grep -R window.confirm src/components/debts/` | ✅ | ✅ green |
| 09-02-03 | 02 | Person groups empty chrome + dual CTAs | 1 | PERSON-01 | — | Empty «Нет долгов» + header CTAs | smoke/grep | plan verify greps on page/DebtsList | ✅ | ✅ green |
| 09-03-01 | 03 | Debt create: existing + compound new person | 1 | DEBT-01 | T-09-07, T-09-08 | Nested write; positive amount | unit | `npx vitest run src/app/debts/actions.test.ts src/lib/validations/debts.test.ts` | ✅ | ✅ green |
| 09-03-02 | 03 | updateDebtMeta + deleteDebt lock/smuggle | 1 | DEBT-01 | T-09-01, T-09-09 | Initial/person/currency immutable | unit | `npx vitest run src/app/debts/actions.test.ts` | ✅ | ✅ green |
| 09-03-03 | 03 | DebtFormDialog + compact rows + cascade | 1 | DEBT-01 | T-09-09 | remainingMinor rows; cascade confirm | unit + manual | actions tests + UAT chrome | ✅ | ✅ green |
| 09-04-01 | 04 | AccountList no browser native confirm | 1 | PERSON-02 / D-17 | T-09-10 | No window.confirm in AccountList | unit | `npx vitest run src/components/accounts/AccountList.test.ts` | ✅ | ✅ green |
| 09-04-02 | 04 | Migrate snapshot delete to DestructiveConfirmStep | 1 | PERSON-02 / D-17 | T-09-10 | In-dialog RU loss copy | unit | same + nav regression | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/app/debts/actions.test.ts` — PERSON-01/02, DEBT-01 action behaviors
- [x] `src/components/nav.test.ts` — DNAV-01 link order/href
- [x] `src/components/accounts/AccountList.test.ts` — D-17 / no `window.confirm`
- [x] Existing `src/lib/validations/debts.test.ts` + `src/lib/debts.test.ts` kept green

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| «Долги» nav active state + Russian CRUD chrome | DNAV-01 / PERSON-01 | Visual active-state + copy | Open `/debts`, confirm nav label/order/active; create/rename person; create debt |
| DebtFormDialog compact-row chrome | DEBT-01 | Full dialog UX beyond unit tests | Create/edit/delete debt in UI; confirm remainingMinor rows and cascade copy |

*Automated coverage exists for all requirement IDs; rows above are visual-only supplements (already covered in 09-UAT.md 8/8).*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-09-05

---

## Validation Audit 2026-09-05

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

**Evidence:** `npx vitest run src/app/debts/actions.test.ts src/components/nav.test.ts src/components/accounts/AccountList.test.ts src/lib/validations/debts.test.ts src/lib/debts.test.ts` → PASS (63) FAIL (0).

State A audit: draft VALIDATION map was stale (Wave 0 pending); filesystem + SUMMARY evidence showed all PERSON-01, PERSON-02, DEBT-01, DNAV-01, D-17 paths already green. No auditor spawn — zero MISSING/PARTIAL gaps.
