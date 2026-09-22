---
phase: "31"
slug: "asset-savings-type-conversion"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-22"
---

# Phase 31 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.11 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `./node_modules/.bin/vitest run src/app/accounts/actions.test.ts src/lib/validations/account.test.ts` (after wave 2: also `src/components/accounts/AccountFormDialog.test.ts`) |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds (quick) / ~2–5 min (full) |

---

## Sampling Rate

- **After every task commit:** Run quick Vitest pair above (add dialog test after Plan 02)
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green + Orca UAT per `31-UAT.md` / OPERATOR.md
- **Max feedback latency:** 60 seconds (quick)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 31-01-T1 | 01 | 1 | ACCT-04 | T-31-01 / T-31-03 | ASSET→SAVINGS persists; never calls BalanceSnapshot | unit | `./node_modules/.bin/vitest run src/app/accounts/actions.test.ts` | ✅ extend | ⬜ pending |
| 31-01-T2 | 01 | 1 | ACCT-04 | T-31-02 / T-31-01 / T-31-05 | SAVINGS→ASSET null clear; forbidden matrix reject; no forge rewrite | unit | `./node_modules/.bin/vitest run src/app/accounts/actions.test.ts` | ✅ extend | ⬜ pending |
| 31-01-T3 | 01 | 1 | ACCT-04 | T-31-01 | updateAccountSchema optional type ASSET\|SAVINGS; reject FIAT_CREDIT on type | unit | `./node_modules/.bin/vitest run src/lib/validations/account.test.ts` | ✅ extend | ⬜ pending |
| 31-02-T1 | 02 | 2 | ACCT-04 | T-31-06 / T-31-08 | canConvertType unlock + «Валюта не меняется.» + draft SAVINGS gate | source-scan | `grep -E -q 'canConvertType\|CONVERT_TYPE_OPTIONS' src/components/accounts/AccountFormDialog.tsx && grep -F -q 'Валюта не меняется' src/components/accounts/AccountFormDialog.tsx && grep -v '^[[:space:]]*//' src/components/accounts/AccountFormDialog.tsx \| grep -F -q 'accountType === "SAVINGS"'` | ✅ | ⬜ pending |
| 31-02-T2 | 02 | 2 | ACCT-04 | T-31-06 / T-31-07 | Dialog source-scan locks + UAT scaffold (ASSET/SAVINGS/BalanceSnapshot/orca) | unit + file | `./node_modules/.bin/vitest run src/components/accounts/AccountFormDialog.test.ts && test -f .planning/phases/31-asset-savings-type-conversion/31-UAT.md && grep -E -q 'ASSET\|SAVINGS\|BalanceSnapshot\|orca' .planning/phases/31-asset-savings-type-conversion/31-UAT.md` | ✅ extend / ❌ UAT | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Extend `src/app/accounts/actions.test.ts` — describe `updateAccount ASSET↔SAVINGS (ACCT-04)`: both directions, forbidden rejects, never-calls snapshot; rewrite Phase 27 forge-type ignore case
- [ ] Extend `src/lib/validations/account.test.ts` — optional `type` on `updateAccountSchema`; reject FIAT_CREDIT on update type field
- [ ] Extend `src/components/accounts/AccountFormDialog.test.ts` — source locks for `canConvertType` / CONVERT_TYPE_OPTIONS / draft gate (Plan 02)

*Framework already present; gaps are test extensions, not new harness install. No `MISSING` sentinels in PLAN.md.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Orca: ASSET→SAVINGS + SAVINGS→ASSET via «Изменить счёт»; FIAT_CREDIT/legacy locked; BalanceSnapshot / NW unchanged | ACCT-04 / D-16 | Live UI + DB drive per OPERATOR.md | Agent: `npm run dev` + Orca; follow checklist in `31-UAT.md` (Plan 02 scaffold) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
