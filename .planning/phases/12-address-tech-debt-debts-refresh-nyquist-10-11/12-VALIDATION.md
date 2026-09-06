---
phase: "12"
slug: "address-tech-debt-debts-refresh-nyquist-10-11"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-06"
validated: "2026-09-07"
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 |
| **Config file** | `vitest.config.ts` (`include: ["src/**/*.test.ts"]`) |
| **Quick run command** | `npx vitest run src/app/debts/actions.test.ts src/lib/debts.test.ts src/components/accounts/AccountList.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30–90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/app/debts/actions.test.ts src/lib/debts.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

Rewritten to match real execute structure (Plans 01–03 only; no phantom Plan 04). Task IDs = `{phase}-{plan}-{task}` 1-indexed within each plan.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------------|-----------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | TD-REFRESH-01 | T-12-01 | DebtDetailDialog shell `router.refresh()`; `revalidatePath("/debts")` only | unit + grep | `npx vitest run src/app/debts/actions.test.ts` + `grep -q 'router.refresh' src/components/debts/DebtDetailDialog.tsx` | ✅ | ✅ green |
| 12-01-02 | 01 | 1 | TD-REFRESH-01 | T-12-01 | DebtFormDialog / PersonFormDialog / DebtsList call `router.refresh()` | unit + grep | `grep -r 'router.refresh' src/components/debts` | ✅ | ✅ green |
| 12-01-03 | 01 | 1 | TD-STATUS-01, TD-ASSERT-01 | T-12-02 | Page wires `assertStatusSynced`; `assertInitialImmutable` Zod contract docs | unit + grep | `npx vitest run src/lib/debts.test.ts -t assert` + grep page | ✅ | ✅ green |
| 12-02-01 | 02 | 2 | TD-UIHOME-01 | T-12-03 | `DestructiveConfirmStep` at `components/ui/`; four consumers retargeted | unit | `test -f src/components/ui/destructive-confirm-step.tsx` | ✅ | ✅ green |
| 12-02-02 | 02 | 2 | TD-UIHOME-01 | T-12-03 | AccountList.test asserts ui path; rejects debts/ home | unit | `npx vitest run src/components/accounts/AccountList.test.ts` | ✅ | ✅ green |
| 12-03-01 | 03 | 3 | NYQ-10, NYQ-11 | T-12-07 | Phase 10/11 VALIDATION validated + compliant after suite green | docs + suite | `npm test` + grep 10/11-VALIDATION frontmatter | ✅ | ✅ green |
| 12-03-02 | 03 | 3 | NYQ-12 | T-12-07 | Phase 12 VALIDATION reconciled after TD evidence | docs + suite | file status validated; TD greps hold | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Wire/tests for `router.refresh` (default: wire client refresh on debt mutation success)
- [x] `assertStatusSynced` call in `src/app/debts/page.tsx` + automated verify
- [x] Relocate `DestructiveConfirmStep` + update `AccountList.test.ts` imports
- [x] Reconcile `.planning/phases/10-repayments-close-write-off/10-VALIDATION.md`
- [x] Reconcile `.planning/phases/11-charts-primary-totals/11-VALIDATION.md`
- [x] Create `12-VALIDATION.md` (this file)

*Phase 10/11 Wave 0 product tests already on disk — reconcile maps; do not duplicate unless a named path is truly absent.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual list refresh after repay/edit/close | TD-REFRESH-01 | RSC stale can be timing-sensitive in UI | Mutate a debt; confirm list/detail amounts update without hard reload |

*Prefer automation for assert/UI-home/Nyquist doc flips.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-09-07 (evidence-first reconcile Phase 12 Plan 03 / NYQ-12)

---

## Validation Audit 2026-09-07

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

**Evidence:** quick smoke `npx vitest run src/app/debts/actions.test.ts src/lib/debts.test.ts src/components/accounts/AccountList.test.ts` → PASS (78). Full suite `npm test` → 25 files / 265 tests PASS (0 FAIL).

TD greps (Plans 01–02):
- `router.refresh` in `src/components/debts/DebtDetailDialog.tsx` (and Form/Person/DebtsList)
- `assertStatusSynced` in `src/app/debts/page.tsx` (≥2 call sites)
- `src/components/ui/destructive-confirm-step.tsx` present; debts/ home removed

State A audit: seed map had phantom Plan 04 (`12-04-*`) and stale Wave 0 ❌ on refresh. Rewrote Per-Task map to real IDs `12-01-01..03`, `12-02-01..02`, `12-03-01..02`. No MISSING TD wires — auditor not spawned. Frontmatter flipped only after suite + TD evidence.
