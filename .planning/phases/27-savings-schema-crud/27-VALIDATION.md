---
phase: "27"
slug: "savings-schema-crud"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-11"
---

# Phase 27 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib/validations/account.test.ts src/lib/account-type.test.ts src/lib/net-worth.test.ts src/lib/savings-rate.test.ts src/lib/savings-accrual-display.test.ts src/lib/savings-account-schema.test.ts src/app/accounts/actions.test.ts src/components/accounts/AccountFormDialog.test.ts src/components/accounts/AccountList.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30–90 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick vitest subset above
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 27-01-T1 | 01 | 0 | ACCT-01…03 | T-27-02/03/04 | Zod/soft/NW SAVINGS contracts | unit | `npx vitest run src/lib/validations/account.test.ts src/lib/account-type.test.ts src/lib/net-worth.test.ts` | ✅ | ✅ green |
| 27-01-T2 | 01 | 0 | ACCT-01/03 | T-27-05 | Display clamp + create SAVINGS actions | unit | `npx vitest run src/lib/savings-accrual-display.test.ts src/app/accounts/actions.test.ts` | ✅ | ✅ green |
| 27-02-T2 | 02 | 1 | ACCT-01/02 | T-27-01…04 | Zod+CHECK+create+NW+bps helpers | unit | `npx vitest run src/lib/validations/account.test.ts src/lib/account-type.test.ts src/lib/net-worth.test.ts src/lib/savings-rate.test.ts src/lib/savings-account-schema.test.ts src/app/accounts/actions.test.ts -t 'createAccount'` | ✅ | ✅ green |
| 27-02-T3 | 02 | 1 | ACCT-01 | — | migrate deploy + CHECK triad live | migrate+unit | `DATABASE_URL=file:./data/wallet.db npx prisma migrate status; npx vitest run src/lib/foundation.test.ts src/lib/savings-account-schema.test.ts` | ✅ | ✅ green |
| 27-03-T1 | 03 | 2 | ACCT-01 | T-27-01/05 | update SAVINGS; no snapshot | unit | `npx vitest run src/app/accounts/actions.test.ts src/lib/validations/account.test.ts` | ✅ | ✅ green |
| 27-03-T2 | 03 | 2 | ACCT-03 | — | form labels/title D-09/D-13 | source+unit | `npx vitest run src/components/accounts/AccountFormDialog.test.ts` | ✅ | ✅ green |
| 27-04-T1 | 04 | 3 | ACCT-03 | — | days-until clamp | unit | `npx vitest run src/lib/savings-accrual-display.test.ts` | ✅ | ✅ green |
| 27-04-T2 | 04 | 3 | ACCT-03 | — | list rate%+countdown | source+unit | `npx vitest run src/components/accounts/AccountList.test.ts` | ✅ | ✅ green |
| 27-04-T3 | 04 | 3 | ACCT-02 | T-27-05 | SAVINGS snapshot manual only | unit | `npx vitest run src/app/accounts/actions.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Extend `src/lib/validations/account.test.ts` — SAVINGS createAccountSchema refine (ACCT-01); update refine owned by Plan 03 — **27-01-T1**
- [x] Extend `src/lib/account-type.test.ts` — SAVINGS label + `isAssetType` (ACCT-02/03) — **27-01-T1**
- [x] Extend `src/lib/net-worth.test.ts` — SAVINGS inclusion (ACCT-02) — **27-01-T1**
- [x] New `src/lib/savings-accrual-display.test.ts` — clamp + today/next month (ACCT-03) — **27-01-T2**
- [x] Extend `src/app/accounts/actions.test.ts` — create SAVINGS + update/no-snapshot green (Plan 03) — **27-01-T2**
- [x] Nyquist gap fill 2026-09-22: `savings-rate.test.ts`, `savings-account-schema.test.ts`, AccountFormDialog/AccountList source contracts

*Existing Vitest infrastructure covers framework — no install Wave 0.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| List secondary line RU copy (сегодня / через N дн.) | ACCT-03 | Visual/pluralization judgment | Orca: create SAVINGS, confirm list subtitle under name |
| Create/edit dialog field gate | ACCT-01/03 | Interaction UX | Orca: type switch ASSET↔SAVINGS shows/hides rate+DOM |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-09-22 — phase suite 136 green (gap-fill + prior contracts)

## Validation Audit 2026-09-22

| Metric | Count |
|--------|-------|
| Gaps found | 4 |
| Resolved | 4 |
| Escalated | 0 |

Tests added/extended:
- `src/lib/savings-rate.test.ts` — parsePercentToBps / formatBpsToPercentMajor (ACCT-01 / D-01…D-03)
- `src/lib/savings-account-schema.test.ts` — SAVINGS enum + CHECK triad source contract (D-14/D-15)
- `src/components/accounts/AccountFormDialog.test.ts` — D-09/D-13 chrome (Изменить счёт, Годовой %, День начисления)
- `src/components/accounts/AccountList.test.ts` — secondary rate% + countdown, no raw DOM
