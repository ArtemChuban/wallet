---
phase: 11-charts-primary-totals
reviewed: 2026-09-06T16:46:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - prisma/migrations/20260906161000_debt_opened_as_of/migration.sql
  - prisma/schema.prisma
  - src/app/debts/actions.test.ts
  - src/app/debts/actions.ts
  - src/app/debts/page.tsx
  - src/app/page.tsx
  - src/components/debts/DebtDetailDialog.tsx
  - src/components/debts/DebtFormDialog.tsx
  - src/components/debts/DebtPrincipalStackChart.tsx
  - src/components/debts/DebtsPrimaryTotalsHero.tsx
  - src/lib/debts.test.ts
  - src/lib/debts.ts
  - src/lib/disol.test.ts
  - src/lib/validations/debts.test.ts
  - src/lib/validations/debts.ts
findings:
  critical: 2
  warning: 2
  info: 3
  total: 7
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-09-06T16:46:00Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues_found

## Summary

Phase 11 delivers `Debt.openedAsOf` (create + Moscow backfill), D-09 immutability on update, native `buildDebtPrincipalStackSeries` / `DebtPrincipalStackChart`, `/debts` LOCF primary hero + excluded list, Капитал excluded-account parity, and DISOL-01 isolation. Those write/UI paths look sound. Stack series math has two reachable correctness breaks: chronological replay can emit negative remaining for ledgers that stay non-negative at write time, and events dated before `openedAsOf` produce a non-monotonic X-axis. Tests for the stack invariant are too weak to catch the first bug.

## Critical Issues

### CR-01: Stack series can emit negative `remainingMajor` for valid ledgers

**File:** `src/lib/debts.ts:288-318`
**Issue:** `buildDebtPrincipalStackSeries` replays events in `(asOfDate, id, kind)` order. Write actions (`createRepayment` / `createSizeChange`) only enforce remaining ≥ 0 after each event in **write** order. A backdated repayment after a later size-up can leave final remaining ≥ 0 while the chart’s chronological point for the repayment day goes negative — violating the stacked composition users see (D-03 / D-15 spirit).

Reproduced: open `10000` on `2026-08-01` → size `+10000` on `2026-08-20` → repay `15000` dated `2026-08-10` (allowed: remainingBefore includes size-up). Final remaining `5000`. Series emits Aug 10 with `remainingMajor: -50`.

**Fix:** Prefer order-independent prefix sums per day (same formula as ledger remaining), and/or reject writes whose as-of would make chronological remaining &lt; 0:

```typescript
// Per distinct date D (and openedAsOf seed):
// repaid = Σ repayments with asOfDate <= D
// remaining = initial + Σ sizeDeltas(asOfDate <= D) - repaid
```

### CR-02: Events before `openedAsOf` break X-axis order

**File:** `src/lib/debts.ts:288-312`; `src/app/debts/actions.ts:445-466` (and size-change / forgive mirrors)
**Issue:** Series always `emit(openedAsOf)` first, then walks sorted events. Event actions only reject `asOfDate > today`, never `asOfDate < debt.openedAsOf`. Reachable path: open on `2026-09-01`, repay on `2026-08-01` → points `[{2026-09-01…}, {2026-08-01…}, …]`. `stepAfter` chart gets a non-monotonic time axis (breaks D-04 “axis starts at open date”).

**Fix:** After loading the debt in createRepayment / createSizeChange / forgiveRemaining, reject early dates; optionally clamp/skip pre-open events in the series builder:

```typescript
if (asOfDate < debt.openedAsOf) {
  return {
    errors: { asOfDate: ["Дата не может быть раньше даты открытия"] },
  };
}
```

(Ensure `findUniqueOrThrow` / ledger load selects `openedAsOf`.)

## Warnings

### WR-01: Stack invariant test is tautological — misses CR-01

**File:** `src/lib/debts.test.ts:301-311`
**Issue:** `assertStackInvariant` does `expect(p.repaidMajor + p.remainingMajor).toBeCloseTo(p.repaidMajor + p.remainingMajor)` — always passes. Suite never asserts non-negative remaining or repaid+remaining === principal-at-date for backdated fixtures, so CR-01 stays green.

**Fix:** Assert concrete principals per fixture and `expect(p.remainingMajor).toBeGreaterThanOrEqual(0)`; add a regression case matching CR-01’s write-order vs chronology scenario.

### WR-02: Side-effectful `map` builds totals inputs

**File:** `src/app/debts/page.tsx:81-134`
**Issue:** `totalsInputs.push(...)` inside `peopleRaw.map(...)` couples list shaping to aggregate collection. Easy to break on early return / refactor; harder to review than pure map + separate `flatMap`.

**Fix:**

```typescript
const people = peopleRaw.map(/* pure row mapping including remaining */);
const totalsInputs: DebtPrimaryTotalsInput[] = people.flatMap((p) =>
  p.debts.map((d) => ({ /* id, direction, status, remaining, FX fields */ })),
);
```

## Info

### IN-01: Future `openedAsOf` allowed — weakens flat open→today

**File:** `src/app/debts/actions.ts:252-305`; `src/components/debts/DebtFormDialog.tsx:431-440`
**Issue:** Plan 11-01 explicitly allows any YYYY-MM-DD for `openedAsOf` (like dueDate). Event paths still ban future `asOfDate`. Future open → no `lastDate < today` append; D-04 empty-history flat segment weakens if user picks a future date.
**Fix:** Optional product follow-up: mirror event future ban + `max={calendarDateToday()}` on create input — only if product revisits the 11-01 flag.

### IN-02: Duplicate DISOL-01 file scans

**File:** `src/lib/debts.test.ts:285-296`; `src/lib/disol.test.ts:5-15`
**Issue:** Same three-file “no debts import” gate in two suites; `disol.test.ts` alone also covers chart↔`historical-series`. Drift risk.
**Fix:** Keep the gate only in `disol.test.ts`; drop the duplicate describe from `debts.test.ts`.

### IN-03: `KIND_ORDER` only breaks ties when cross-table ids collide

**File:** `src/lib/debts.ts:222-273`
**Issue:** Sort is asOfDate → id → kind. Autoincrement ids from `DebtRepayment` and `DebtSizeChange` rarely match, so repayment-before-sizeChange almost never applies. Matches CONTEXT D-07 (asOfDate then id); test copy oversells kind ordering. End-of-day totals are order-independent; still confusing for readers.
**Fix:** Comment that kind is tie-break only, or sort `(asOfDate, kind, id)` if product wants repayment-first same day (would need CONTEXT/D-07 update).

---

_Reviewed: 2026-09-06T16:46:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
