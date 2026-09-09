---
phase: "20"
slug: "obligation-crud-cycle-ui"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-09"
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/app/accounts/actions.test.ts src/lib/validations/credit-grace.test.ts src/lib/credit-grace.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30–90 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick command (or targeted files touched)
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 20-01-T1 | 01 | 1 | OBL/UX infra | — | N/A | unit | `npx vitest run src/lib/validations/credit-grace.test.ts` | ❌ W0 | ⬜ pending |
| 20-01-T2 | 01 | 1 | OBL-02 prep | — | pendingLabel API | source | `grep -q pendingLabel src/components/ui/destructive-confirm-step.tsx` | ✅ | ⬜ pending |
| 20-01-T3 | 01 | 1 | CYCLE-02, OBL-01 | T-20-02/03 | server dueAsOf; no balanceSnapshot | unit + files | `npx vitest run src/lib/credit-grace.test.ts src/lib/validations/credit-grace.test.ts src/app/accounts/actions.test.ts` | ⚠️ partial | ⬜ pending |
| 20-02-T1 | 02 | 2 | OBL-01, OBL-02 | T-20-03 | no balanceSnapshot writes | unit | `npx vitest run src/app/accounts/actions.test.ts` | ⚠️ extend | ⬜ pending |
| 20-02-T2 | 02 | 2 | OBL-02 | T-20-06 | DestructiveConfirmStep only | UI source | `npx vitest run src/components/accounts/credit-grace-ui.test.ts` | ❌ W0 | ⬜ pending |
| 20-03-T1 | 03 | 3 | OBL-03, CYCLE-02 | T-20-08 | isGraceOverdue chrome | unit + UI | `npx vitest run src/lib/credit-grace.test.ts src/components/accounts/credit-grace-ui.test.ts` | ⚠️ | ⬜ pending |
| 20-03-T2 | 03 | 3 | UX-01 | T-20-09 | disclaimer + Задолженность | UI source | `npx vitest run src/components/accounts/credit-grace-ui.test.ts src/app/accounts/actions.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Task IDs match 20-01…03 PLAN.md task order.*

---

## Wave 0 Requirements

- [ ] `src/lib/validations/credit-grace.test.ts` — schema pairing / positive amount / closedAsOf refine
- [ ] Extend `src/app/accounts/actions.test.ts` — create / update / close / reopen / P2002 / no `balanceSnapshot`
- [ ] `src/components/accounts/credit-grace-ui.test.ts` (or AccountList.test extend) — DestructiveConfirmStep import, no `window.confirm`, locked RU strings, grace button only on credit

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual overdue highlight + RU copy readability | OBL-03, UX-01 | Subjective chrome | Agent UAT via Orca per `.planning/OPERATOR.md` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
