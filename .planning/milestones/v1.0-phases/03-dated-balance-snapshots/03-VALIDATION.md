---
phase: "03"
slug: "dated-balance-snapshots"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-03"
validated: "2026-09-04"
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 |
| **Config file** | `vitest.config.ts` (`include: src/**/*.test.ts`) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green + Russian UI human smoke on `/accounts`
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-W0-01 | 01 | 0 | BAL-01 | — | setBalanceSchema shape (date/amount Zod; Russian messages) | unit | `npm test -- --run src/lib/validations/balance.test.ts` | ✅ | ✅ green |
| 03-W0-02 | 01 | 0 | BAL-01 | — | Upsert same (account, date) overwrites amount | unit | `npm test -- --run src/lib/balances.test.ts` | ✅ | ✅ green |
| 03-W0-03 | 01 | 0 | BAL-02 | — | LOCF returns latest asOfDate ≤ D | unit | `npm test -- --run src/lib/balances.test.ts` | ✅ | ✅ green |
| 03-W0-04 | 01 | 0 | BAL-02 | — | Before first snapshot returns null (not 0) | unit | `npm test -- --run src/lib/balances.test.ts` | ✅ | ✅ green |
| 03-P01-01 | 01 | 1 | BAL-01/02 | T-03-04 | Schema has BalanceSnapshot + unique; stub gone | unit | `npm test -- --run src/lib/money.test.ts src/lib/foundation.test.ts` | ✅ | ✅ green |
| 03-P02-01 | 02 | 2 | BAL-01 | T-03-01 | Reject future asOfDate server-side (Server Action) | unit | `npm test -- --run src/app/accounts/actions.test.ts` | ✅ | ✅ green |
| 03-P02-02 | 02 | 2 | BAL-01 | T-03-03 | Credit available outside 0..limit rejected (Server Action) | unit | `npm test -- --run src/app/accounts/actions.test.ts` | ✅ | ✅ green |
| 03-P02-03 | 02 | 2 | — | — | Set-balance Dialog remount / controlled defaults | unit | `npm test -- --run src/components/accounts/SetBalanceDialog.test.ts` | ✅ | ✅ green |
| 03-P02-04 | 02 | 2 | BAL-01 | T-03-05 | Actions export set + delete; no debt column | unit | `npm test -- --run src/app/accounts/actions.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/lib/validations/balance.test.ts` — BAL-01 Zod shape only (past/today date strings, amountMajor, Russian invalid messages); **not** future-date reject or credit 0..limit (those live in Plan 02 `actions.test.ts`)
- [x] `src/lib/balances.test.ts` — BAL-02 LOCF + null-before-first + overwrite
- [x] `src/lib/validations/balance.ts` — schemas under test
- [x] `src/lib/balances.ts` — LOCF + debt helpers under test
- [x] Update `foundation.test.ts` expectations when stub dropped
- [x] Optional: `SetBalanceDialog.test.ts` source-contract (formKey / default today) — Plan 02

### Plan 02 Server Action tests (not Wave 0)

- [x] `src/app/accounts/actions.test.ts` — reject future asOfDate (T-03-01) + credit available outside 0..limit (T-03-03 / D-07)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Russian UI set-balance + history on `/accounts` | BAL-01, BAL-02 | Dialog/a11y + copy | Open `/accounts`, set balance for past/today date, confirm LOCF row + history expand + overwrite message |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-09-04 (Phase 07 Nyquist reconcile — evidence on disk + suite green)

---

## Validation Audit 2026-09-04

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

### Notes

- Evidence-first reconcile (Phase 07 Plan 03 / NYQ-03): Wave 0 and Plan 02 test files already present under `src/` (`validations/balance.test.ts`, `balances.test.ts`, `accounts/actions.test.ts`, `SetBalanceDialog.test.ts`).
- No MISSING Wave 0 paths — auditor not spawned.
- Full suite evidence: `npm test` → 153 passed (2026-09-04, post LOCF consolidation).
- Historical task IDs preserved; File Exists / Status flipped to present/green; Wave 0 boxes checked.
