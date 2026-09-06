---
phase: 11-charts-primary-totals
reviewed: 2026-09-06T16:32:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - prisma/migrations/20260906161000_debt_opened_as_of/migration.sql
  - prisma/schema.prisma
  - src/app/debts/actions.ts
  - src/app/debts/actions.test.ts
  - src/app/debts/page.tsx
  - src/app/page.tsx
  - src/components/debts/DebtDetailDialog.tsx
  - src/components/debts/DebtFormDialog.tsx
  - src/components/debts/DebtPrincipalStackChart.tsx
  - src/components/debts/DebtsPrimaryTotalsHero.tsx
  - src/lib/debts.ts
  - src/lib/debts.test.ts
  - src/lib/disol.test.ts
  - src/lib/validations/debts.ts
  - src/lib/validations/debts.test.ts
findings:
  critical: 2
  warning: 2
  info: 2
  total: 6
status: issues
---

# Phase 11: Code Review Report

**Reviewed:** 2026-09-06T16:32:00Z
**Depth:** standard
**Files Reviewed:** 15
**Status:** issues

## Summary

Phase 11 delivers openedAsOf immutability, native principal stack chart, /debts primary hero, Капитал excluded-account list, and DISOL-01 scan. D-09 write path and hero/banner wiring look sound. Stack series builder + date write rules have correctness gaps: reachable histories can yield negative or non-monotonic chart points, and create/event actions do not bound dates relative to `openedAsOf` / today the way repayment already bounds future `asOfDate`.

## Critical Issues

### CR-01: Stack series can emit negative `remainingMajor` for valid ledgers

**File:** `src/lib/debts.ts:288-318`
**Issue:** `buildDebtPrincipalStackSeries` applies events in `(asOfDate, id, kind)` order. Write path only enforces remaining ≥ 0 after each event in **write** order. Backdated repayments after a later size-up can leave ledger remaining ≥ 0 while chronological replay goes negative mid-series (that day’s emitted point).

Example: open 10000 → size +10000 on `2026-08-20` → repay 15000 dated `2026-08-10` (allowed: past date, remainingBefore includes size-up). Final remaining 5000. Chart applies Aug 10 repay on 10000 first → `remainingMajor` −50.

**Fix:** Either reject event `asOfDate` that would make chronological remaining &lt; 0 (replay check on write), or build series from order-independent prefix sums per day (same formula as `remainingMinor` / repaid cumulative through that date) so points never go negative when the ledger is valid:

```typescript
// Per distinct date D, after processing all events with asOfDate <= D:
// repaid = Σ repayments with asOfDate <= D
// remaining = initial + Σ sizeDeltas(asOfDate <= D) - repaid
```

### CR-02: Events before `openedAsOf` break X-axis order

**File:** `src/lib/debts.ts:288-312`
**Issue:** Series always `emit(openedAsOf)` first, then emits any earlier event dates afterward. `createRepayment` / `createSizeChange` / `forgiveRemaining` only reject `asOfDate > today`, not `asOfDate < debt.openedAsOf`. User can open debt on 2026-09-01 and record repayment on 2026-08-01 → points `[2026-09-01, 2026-08-01, …]`. `stepAfter` chart then plots non-monotonic time.

**Fix:** On event writes, load debt and reject `asOfDate < debt.openedAsOf`. Harden series to sort/skip pre-open events or clamp:

```typescript
// in createRepayment / createSizeChange / forgiveRemaining (after load):
if (asOfDate < debt.openedAsOf) {
  return { errors: { asOfDate: ["Дата не может быть раньше даты открытия"] } };
}
```

## Warnings

### WR-01: Create debt allows future `openedAsOf`

**File:** `src/app/debts/actions.ts:252-305` (and with-new-person branch ~307–350); `src/components/debts/DebtFormDialog.tsx:431-440`
**Issue:** Repayment/size-change/forgive reject future `asOfDate`; `createDebt` persists any YYYY-MM-DD `openedAsOf` with no `<= today` check. Form `<input type="date">` has no `max`. Future open date → chart seed after “today”, no flat open→today segment (DCHART empty-history intent weakens).

**Fix:** Mirror event actions:

```typescript
const today = calendarDateToday();
if (openedAsOf > today) {
  return { errors: { openedAsOf: ["Дата не может быть в будущем"] } };
}
```

Also set `max={calendarDateToday()}` on the create date input.

### WR-02: Side-effectful `map` builds totals inputs

**File:** `src/app/debts/page.tsx:81-134`
**Issue:** `totalsInputs.push(...)` inside `peopleRaw.map(...)` couples list shaping to aggregate collection. Easy to break if map body later returns early or is refactored; harder to read than an explicit loop/`flatMap`.

**Fix:** Build rows first, then derive totals inputs:

```typescript
const people = peopleRaw.map(/* pure row mapping */);
const totalsInputs: DebtPrimaryTotalsInput[] = people.flatMap((p) =>
  p.debts.map((d) => ({ /* from d + currency maps */ })),
);
```

(Keep bigint/`remainingMinor` computation once—either on rows or via a shared helper.)

## Info

### IN-01: Tautological stack invariant assertion

**File:** `src/lib/debts.test.ts:301-311`
**Issue:** `expect(a).toBeCloseTo(a)` never fails. Comment claims principal = repaid + remaining but does not assert a fixed principal or non-negative remaining alone beyond `>= 0` (which still allows chart bugs in CR-01 until fixed).

**Fix:** Assert concrete principal per fixture point, or `expect(p.remainingMajor).toBeGreaterThanOrEqual(0)` plus known `repaid + remaining === expectedPrincipal`.

### IN-02: Duplicate DISOL-01 file scans

**File:** `src/lib/debts.test.ts:285-296` and `src/lib/disol.test.ts:5-15`
**Issue:** Same three-file import ban now lives in two suites. Drift risk if one list updates and the other does not (`disol.test.ts` also covers the chart↔historical-series ban).

**Fix:** Keep the gate only in `disol.test.ts`; delete the duplicate describe from `debts.test.ts`.

---

_Reviewed: 2026-09-06T16:32:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
