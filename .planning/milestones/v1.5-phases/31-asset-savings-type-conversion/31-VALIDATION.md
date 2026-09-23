---
phase: "31"
slug: "asset-savings-type-conversion"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-22"
validated: "2026-09-22"
---

# Phase 31 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.11 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `./node_modules/.bin/vitest run src/app/accounts/actions.test.ts src/lib/validations/account.test.ts src/components/accounts/AccountFormDialog.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds (quick) / ~2–5 min (full) |

---

## Sampling Rate

- **After every task commit:** Run quick Vitest trio above
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green + Orca UAT per `31-UAT.md` / OPERATOR.md
- **Max feedback latency:** 60 seconds (quick)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 31-01-T1 | 01 | 1 | ACCT-04 | T-31-01 / T-31-03 | ASSET→SAVINGS persists; never calls BalanceSnapshot | unit | `./node_modules/.bin/vitest run src/app/accounts/actions.test.ts` | ✅ | ✅ green |
| 31-01-T2 | 01 | 1 | ACCT-04 | T-31-02 / T-31-01 / T-31-05 | SAVINGS→ASSET null clear; forbidden matrix reject; no forge rewrite | unit | `./node_modules/.bin/vitest run src/app/accounts/actions.test.ts` | ✅ | ✅ green |
| 31-01-T3 | 01 | 1 | ACCT-04 | T-31-01 | updateAccountSchema optional type ASSET\|SAVINGS; reject FIAT_CREDIT on type | unit | `./node_modules/.bin/vitest run src/lib/validations/account.test.ts` | ✅ | ✅ green |
| 31-02-T1 | 02 | 2 | ACCT-04 | T-31-06 / T-31-08 | canConvertType unlock + «Валюта не меняется.» + draft SAVINGS gate | unit | `./node_modules/.bin/vitest run src/components/accounts/AccountFormDialog.test.ts` | ✅ | ✅ green |
| 31-02-T2 | 02 | 2 | ACCT-04 | T-31-06 / T-31-07 | Dialog source-scan locks + UAT scaffold (ASSET/SAVINGS/BalanceSnapshot/orca) | unit + file | `./node_modules/.bin/vitest run src/components/accounts/AccountFormDialog.test.ts && test -f .planning/phases/31-asset-savings-type-conversion/31-UAT.md && grep -E -q 'ASSET\|SAVINGS\|BalanceSnapshot\|orca' .planning/phases/31-asset-savings-type-conversion/31-UAT.md` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Extend `src/app/accounts/actions.test.ts` — describe `updateAccount ASSET↔SAVINGS (ACCT-04)`: both directions, forbidden rejects, never-calls snapshot; rewrite Phase 27 forge-type ignore case
- [x] Extend `src/lib/validations/account.test.ts` — optional `type` on `updateAccountSchema`; reject FIAT_CREDIT on update type field
- [x] Extend `src/components/accounts/AccountFormDialog.test.ts` — source locks for `canConvertType` / CONVERT_TYPE_OPTIONS / draft gate (Plan 02)

*Framework already present; gaps are test extensions, not new harness install. No `MISSING` sentinels in PLAN.md.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Orca: ASSET→SAVINGS + SAVINGS→ASSET via «Изменить счёт»; FIAT_CREDIT/legacy locked; BalanceSnapshot / NW unchanged | ACCT-04 / D-16 | Live UI + DB drive per OPERATOR.md | Agent: `npm run dev` + Orca; follow checklist in `31-UAT.md` (Plan 02 scaffold) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-09-22 (Nyquist audit — Fix all gaps; existing vitest suite green 85/85)

---

## Validation Audit 2026-09-22

| Metric | Count |
|--------|-------|
| Gaps found | 5 |
| Resolved | 5 |
| Escalated | 0 |

### Gap resolution notes

| Task ID | Gap type (pre-audit) | Resolution | Evidence |
|---------|----------------------|------------|----------|
| 31-01-T1 | map pending / Wave 0 unchecked | Existing ACCT-04 describe: ASSET→SAVINGS persist + never-calls BalanceSnapshot | `vitest run src/app/accounts/actions.test.ts` — pass |
| 31-01-T2 | map pending | SAVINGS→ASSET null clear + forbidden FIAT_CREDIT/legacy + D-12 missing fields + ASSET name-only | same file — pass |
| 31-01-T3 | map pending | optional type ASSET\|SAVINGS accept; FIAT_CREDIT/legacy reject | `vitest run src/lib/validations/account.test.ts` — pass |
| 31-02-T1 | map pending; fragile shell grep | Source-scan locks in AccountFormDialog.test.ts (canConvertType / CONVERT / draft / copy); automated cmd → vitest | `vitest run …AccountFormDialog.test.ts` — pass |
| 31-02-T2 | map pending | Dialog locks + `31-UAT.md` tokens ASSET\|SAVINGS\|BalanceSnapshot\|orca | vitest + file grep — pass |

No new test files required — Wave 0 extensions already shipped in Plans 01–02. Adversarial re-run: 3 files, **85 passed**. Implementation untouched. Manual Orca remains Manual-Only (by design).
