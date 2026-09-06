---
phase: 11-charts-primary-totals
fixed_at: 2026-09-06T16:58:26Z
review_path: .planning/phases/11-charts-primary-totals/11-REVIEW.md
iteration: 1
findings_in_scope: 4
fixed: 4
skipped: 0
status: all_fixed
---

# Phase 11: Code Review Fix Report

**Fixed at:** 2026-09-06T16:58:26Z
**Source review:** `.planning/phases/11-charts-primary-totals/11-REVIEW.md`
**Iteration:** 1

**Summary:**
- Findings in scope: 4 (CR-01, CR-02, WR-01, WR-02; Info skipped)
- Fixed: 4
- Skipped: 0

**Verification:** Vitest ran in the isolated review-fix worktree (symlinked `node_modules` / `src/generated` from main checkout). Suites: `src/lib/debts.test.ts`, `src/app/debts/actions.test.ts` — 75 passed.

## Fixed Issues

### CR-01: Stack series can emit negative `remainingMajor` for valid ledgers

**Files modified:** `src/lib/debts.ts`, `src/lib/debts.test.ts`, `src/app/debts/actions.ts`, `src/app/debts/actions.test.ts`
**Commit:** 93f8180
**Applied fix:** Rewrote `buildDebtPrincipalStackSeries` to chronological prefix sums via `remainingMinorAsOf`; createRepayment / createSizeChange / forgiveRemaining reject writes that would make chronological remaining &lt; 0 at `asOfDate`. Regression tests for prefix math and backdated over-repay.

**Commit status:** fixed: requires human verification (chrono write-guard logic)

### CR-02: Events before `openedAsOf` break X-axis order

**Files modified:** `src/app/debts/actions.ts`, `src/app/debts/actions.test.ts`, `src/lib/debts.test.ts`
**Commit:** bb1e2f6
**Applied fix:** After loading debt, reject `asOfDate < openedAsOf` with RU message on repayment / size-change / forgive; series already skips pre-open events (from CR-01). Tests for reject + monotonic axis.

### WR-01: Stack invariant test is tautological — misses CR-01

**Files modified:** `src/lib/debts.test.ts`
**Commit:** 3dd5814
**Applied fix:** `assertStackInvariant` now asserts `remainingMajor` / `repaidMajor` ≥ 0; chronological fixture asserts concrete principal-at-date sums.

### WR-02: Side-effectful `map` builds totals inputs

**Files modified:** `src/app/debts/page.tsx`
**Commit:** 2175d94
**Applied fix:** Pure `people` map; separate `peopleRaw.flatMap` builds `totalsInputs`.

---

_Fixed: 2026-09-06T16:58:26Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
