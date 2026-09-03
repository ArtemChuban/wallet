---
phase: "03"
slug: "dated-balance-snapshots"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-03"
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
| 03-W0-01 | 01 | 0 | BAL-01 | T-03-01 | Reject future asOfDate server-side | unit | `npm test -- --run src/lib/validations/balance.test.ts` | ❌ W0 | ⬜ pending |
| 03-W0-02 | 01 | 0 | BAL-01 | T-03-03 | Credit available outside 0..limit rejected | unit | `npm test -- --run src/lib/validations/balance.test.ts` | ❌ W0 | ⬜ pending |
| 03-W0-03 | 01 | 0 | BAL-01 | — | Upsert same (account, date) overwrites amount | unit | `npm test -- --run src/lib/balances.test.ts` | ❌ W0 | ⬜ pending |
| 03-W0-04 | 01 | 0 | BAL-02 | — | LOCF returns latest asOfDate ≤ D | unit | `npm test -- --run src/lib/balances.test.ts` | ❌ W0 | ⬜ pending |
| 03-W0-05 | 01 | 0 | BAL-02 | — | Before first snapshot returns null (not 0) | unit | `npm test -- --run src/lib/balances.test.ts` | ❌ W0 | ⬜ pending |
| 03-XX | TBD | TBD | BAL-01/02 | T-03-04 | Schema has BalanceSnapshot + unique; stub gone | unit | `npm test -- --run src/lib/money.test.ts src/lib/foundation.test.ts` | ✅ update | ⬜ pending |
| 03-XX | TBD | TBD | — | — | Set-balance Dialog remount / controlled defaults | unit | `npm test -- --run src/components/accounts/SetBalanceDialog.test.ts` | ❌ W0 | ⬜ pending |
| 03-XX | TBD | TBD | BAL-01 | T-03-05 | Actions export set + delete; no debt column | unit | `npm test -- --run src/app/accounts/actions.test.ts` | ✅ extend | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/validations/balance.test.ts` — BAL-01 date/amount/credit bounds
- [ ] `src/lib/balances.test.ts` — BAL-02 LOCF + null-before-first + overwrite
- [ ] `src/lib/validations/balance.ts` — schemas under test
- [ ] `src/lib/balances.ts` — LOCF + debt helpers under test
- [ ] Update `foundation.test.ts` expectations when stub dropped
- [ ] Optional: `SetBalanceDialog.test.ts` source-contract (formKey / default today)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Russian UI set-balance + history on `/accounts` | BAL-01, BAL-02 | Dialog/a11y + copy | Open `/accounts`, set balance for past/today date, confirm LOCF row + history expand + overwrite message |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
