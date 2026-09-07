---
phase: "14"
slug: "dohody-crud-nav"
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-07"
validated: "2026-09-07"
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/components/nav.test.ts src/lib/income.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run targeted vitest files touched by the task
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 14-01-T1 | 01 | 1 | UI-01 | — | Flip UI-00; nav «Доходы» + `/income` shell + D-11 copy | unit + file-scan | `npx vitest run src/lib/income.test.ts src/components/nav.test.ts` | ✅ | ✅ green |
| 14-01-T2 | 01 | 1 | SRC-01, SRC-02 | — | Zod recurring + one-time create/update schemas | unit | `npx vitest run src/lib/validations/income.test.ts` | ✅ | ✅ green |
| 14-01-T3 | 01 | 1 | D-02, D-09, D-10 | — | nextOpenPlannedAsOf past-unfilled + skip-filled | unit + file-scan | `npx vitest run src/lib/income.test.ts` | ✅ | ✅ green |
| 14-02-T1 | 02 | 2 | SRC-01, UI-01 | T-14-01 | createRecurringIncome + isolation scan | unit + file-scan | `npx vitest run src/app/income/actions.test.ts` | ✅ | ✅ green |
| 14-02-T2 | 02 | 2 | SRC-02, UI-01 | T-14-01 | One-time + update/delete + assertOneTimePlanImmutable | unit + file-scan | `npx vitest run src/app/income/actions.test.ts` | ✅ | ✅ green |
| 14-02-T3 | 02 | 2 | D-16 | — | Person Restrict spans income + dual revalidatePath | unit + file-scan | `npx vitest run src/app/debts/actions.test.ts` | ✅ | ✅ green |
| 14-03-T1 | 03 | 3 | D-01..D-08, D-15 | — | Person-grouped list + create dialog | file-scan + unit | `npx vitest run src/lib/validations/income.test.ts src/app/income/actions.test.ts src/components/nav.test.ts` | ✅ | ✅ green |
| 14-03-T2 | 03 | 3 | D-12, D-16, UI-01 | — | DestructiveConfirmStep edit/delete | unit + file-scan | `npx vitest run src/components/income/income-ui.test.ts` | ✅ | ✅ green |
| 14-03-T3 | 03 | 3 | UI-01 | — | Empty/error polish + full suite gate | full suite | `npm test` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

**Folded into wave 1+ executable plans** — closed by Plans 01–03:

- [x] Replace UI-00 in `src/lib/income.test.ts` — **14-01-T1**
- [x] `src/lib/validations/income.ts` + `.test.ts` — **14-01-T2**
- [x] `nextOpenPlannedAsOf` + tests in `income.test.ts` — **14-01-T3**
- [x] Update `nav.test.ts` expectations for Доходы — **14-01-T1**
- [x] `src/app/income/actions.test.ts` isolation + validation errors — **14-02-T1 / T2**
- [x] Extend `deletePerson` tests for income Restrict — **14-02-T3**

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| RU header copy: income does not change balances | SRC/ISO | Copy judgment | Open `/income`; confirm header honesty copy visible |
| Person-grouped list UX parity with debts | D-01..D-04 | Visual/UX | Compare `/income` list grouping to `/debts` |
| DestructiveConfirmStep delete flow | UI-01 | Interaction | Delete income source; confirm step appears, no `window.confirm` |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-09-07 — vitest green (nav/income/actions/ui)

## Validation Audit 2026-09-07

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

Reconcile: plan-seeded `draft` map; automated coverage already present post-execute. Manual-only rows retained for UAT taste (non-blocking).
