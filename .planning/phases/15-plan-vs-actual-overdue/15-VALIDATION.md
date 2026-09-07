---
phase: "15"
slug: "plan-vs-actual-overdue"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-07"
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test -- src/lib/income.test.ts src/app/income/actions.test.ts src/components/income/income-ui.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- src/lib/income.test.ts src/app/income/actions.test.ts src/components/income/income-ui.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 15-W0 | 01 | 0 | ACT-* | — | N/A | stubs | `npm test -- src/lib/validations/income.test.ts` | ❌ W0 | ⬜ pending |
| ACT-01 | 01+ | 1+ | ACT-01 | T-15-01 | Zod + parent exists; no plan mutate | unit | `npm test -- src/app/income/actions.test.ts` | ⚠️ extend | ⬜ pending |
| ACT-01-Z | 01+ | 1+ | ACT-01 | T-15-01 | reject non-positive actual | unit | `npm test -- src/lib/validations/income.test.ts` | ❌ W0 | ⬜ pending |
| ACT-02 | 02+ | 2+ | ACT-02 | — | «заполни» + warning, not destructive | unit/file-scan | `npm test -- src/components/income/income-ui.test.ts` | ⚠️ extend | ⬜ pending |
| ACT-03 | 02+ | 2+ | ACT-03 | — | Δ copy / one-time filled chrome | unit | `npm test -- src/lib/income.test.ts` + income-ui | ⚠️ extend | ⬜ pending |
| ISO | * | * | ISO light | T-15-04 | no BalanceSnapshot / no revalidate `/` | file-scan | `npm test -- src/app/income/actions.test.ts` | ✅ keep | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Extend `src/lib/validations/income.ts` — actual upsert/delete Zod schemas + unit coverage
- [ ] Extend `src/app/income/actions.test.ts` — upsert/delete actual + isolation scan
- [ ] Extend `src/components/income/income-ui.test.ts` — «заполни», «Внести факт», «Изменить факт», DestructiveConfirm on fact delete, ban `window.confirm`
- [ ] Optional: `incomeVarianceMinor` tests if helper extracted
- [ ] Framework install: none

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Overdue amber chrome + fact dialog UX on live «Доходы» | ACT-02, ACT-03 | Visual / Orca UAT | Agent-driven per `.planning/OPERATOR.md` + Orca after phase gate |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
