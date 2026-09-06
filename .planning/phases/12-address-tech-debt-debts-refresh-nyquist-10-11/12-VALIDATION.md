---
phase: "12"
slug: "address-tech-debt-debts-refresh-nyquist-10-11"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-06"
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

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------------|-----------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | TD-REFRESH-01 | T-12-01 | Success paths keep `revalidatePath("/debts")` only; never `/` | unit | `npx vitest run src/app/debts/actions.test.ts` | ✅ | ⬜ pending |
| 12-01-02 | 01 | 1 | TD-REFRESH-01 | T-12-01 | Client success handlers call `router.refresh()` | unit + grep | `grep -r 'router.refresh' src/components/debts` | ❌ W0 | ⬜ pending |
| 12-02-01 | 02 | 1 | TD-STATUS-01 | T-12-02 | Page wires `assertStatusSynced` with recomputed remaining | unit + grep | `npx vitest run src/lib/debts.test.ts -t assert` + grep page | ✅ / ❌ page | ⬜ pending |
| 12-02-02 | 02 | 1 | TD-ASSERT-01 | — | Initial assert documented or wired; status assert outcome clear | unit/docs | `npx vitest run src/lib/debts.test.ts -t assert` | ✅ | ⬜ pending |
| 12-03-01 | 03 | 2 | TD-UIHOME-01 | T-12-03 | Confirm imported from `components/ui/`; AccountList green | unit | `npx vitest run src/components/accounts/AccountList.test.ts` | ✅ | ⬜ pending |
| 12-04-01 | 04 | 2 | NYQ-10 | — | Phase 10 VALIDATION frontmatter validated + compliant | docs + suite | `npm test` + grep 10-VALIDATION frontmatter | ✅ draft | ⬜ pending |
| 12-04-02 | 04 | 2 | NYQ-11 | — | Phase 11 VALIDATION frontmatter validated + compliant | docs + suite | `npm test` + grep 11-VALIDATION frontmatter | ✅ draft | ⬜ pending |
| 12-04-03 | 04 | 2 | NYQ-12 | — | Phase 12 VALIDATION reconciled after execute | docs | file exists; status validated | ✅ seed | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Wire/tests for `router.refresh` (default: wire client refresh on debt mutation success)
- [ ] `assertStatusSynced` call in `src/app/debts/page.tsx` + automated verify
- [ ] Relocate `DestructiveConfirmStep` + update `AccountList.test.ts` imports
- [ ] Reconcile `.planning/phases/10-repayments-close-write-off/10-VALIDATION.md`
- [ ] Reconcile `.planning/phases/11-charts-primary-totals/11-VALIDATION.md`
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

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
