---
phase: 05-net-worth-dashboard
reviewed: 2026-09-03T19:44:26Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/app/page.tsx
  - src/components/dashboard/DashboardAccountList.tsx
  - src/components/nav.tsx
  - src/lib/net-worth.test.ts
  - src/lib/net-worth.ts
findings:
  critical: 1
  warning: 1
  info: 3
  total: 5
status: issues_found
---

# Phase 5: Code Review Report

**Reviewed:** 2026-09-03T19:44:26Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewed net-worth aggregation (`computeNetWorthRows`), home RSC dashboard wiring, nav, read-only account list, and unit tests. Happy-path math (primary identity, FX convert of debt only, asset sum, `no_balance` / `no_fx` exclusions, `isPartial`) matches NW-01–03 / ACCT-03 and the ten passing tests. One critical defect remains: the credit path can turn available credit into a **positive** hero contribution when `creditLimitMinor` is null or available exceeds limit. Mutations still omit `revalidatePath("/")` for the live home dashboard.

XSS: account `name` and amounts render as React text children (no `dangerouslySetInnerHTML`). DB errors stay fixed Russian copy. BigInt stays off the RSC→list boundary (pre-formatted strings only). Nav order/labels match D-01–D-04.

## Critical Issues

### CR-01: Credit null/over-available limit inflates NW with available as asset

**File:** `src/lib/net-worth.ts:86-108`
**Issue:** For `FIAT_CREDIT`, `creditLimitMinor ?? 0n` plus unclamped `creditDebtMinor(limit, available)` lets debt go negative. Contribution is `-primaryDebt`, so negative debt becomes a **positive** hero contribution — available credit counted as an asset (ACCT-03 / core value violation). Type allows `creditLimitMinor: null`; SQLite CHECK and set-balance bounds usually block this in the app path, but this pure helper (Phase 6 reuse) still accepts those inputs and mis-computes. Reproduced: `creditLimitMinor: null`, `locfAmountMinor: 100_000n` → `contributionPrimaryMinor: +100_000n`; `limit: 100_000n`, `available: 150_000n` → `contributionPrimaryMinor: +50_000n`.

**Fix:**
```typescript
if (account.type === "FIAT_CREDIT") {
  if (account.creditLimitMinor == null) {
    return {
      accountId: account.id,
      includedInTotal: false,
      excludeReason: "no_balance",
      contributionPrimaryMinor: 0n,
      nativeDisplayMinor: account.locfAmountMinor,
      debtNativeMinor: null,
      primaryDisplayMinor: null,
    };
  }
  const rawDebt = creditDebtMinor(
    account.creditLimitMinor,
    account.locfAmountMinor,
  );
  const debtNativeMinor = rawDebt < 0n ? 0n : rawDebt;
  // ... convert debtNativeMinor only; contributionPrimaryMinor = -primaryDebt
}
```
Add unit tests for `creditLimitMinor: null` and `available > limit` asserting `contributionPrimaryMinor <= 0n` and never `+available`.

## Warnings

### WR-01: Mutations never revalidate `/` after Phase 5 home dashboard

**File:** `src/app/page.tsx:10` (consumer); gap in `src/app/accounts/actions.ts` / `src/app/currencies/actions.ts`
**Issue:** `/` is now the live NW dashboard (`force-dynamic`), but create/update balance, account, and FX actions only call `revalidatePath("/accounts")` or `/currencies*`. No `revalidatePath("/")`. Client navigations / router cache can still show stale «Капитал» after edits even with force-dynamic.

**Fix:** In every action that changes accounts, balances, currencies, or FX rates, also:
```typescript
revalidatePath("/");
```

## Info

### IN-01: Hero/list amounts use `formatMinorToMajor` ASCII form, not UI-SPEC locale example

**File:** `src/app/page.tsx:96-119`
**Issue:** UI-SPEC example shows `1 234 567,89 RUB`; `formatMinorToMajor` yields `1234567.89`. Same helper as rest of app — consistent, not Russian-grouped.
**Fix:** Optional shared locale formatter later; keep one formatter for all money UI.

### IN-02: Silent primary fallback to RUB / scale 2

**File:** `src/app/page.tsx:73-74`
**Issue:** If no primary currency row, hero formats with `RUB` and scale `2` while conversion still trusts `account.currency.isPrimary`. Seeded primary makes this rare; mismatch would mis-label or mis-scale the hero.
**Fix:** Treat missing primary like DB error (same catch path) instead of inventing RUB.

### IN-03: No unit coverage for credit limit null / available-over-limit

**File:** `src/lib/net-worth.test.ts:35-48`
**Issue:** Credit tests cover happy-path debt and “limit alone does not inflate hero,” but never assert the defensive cases that currently fail ACCT-03 (`creditLimitMinor: null`, `locfAmountMinor > creditLimitMinor`).
**Fix:** Add two cases expecting `contributionPrimaryMinor <= 0n` and `includedInTotal` / clamp behavior matching the CR-01 fix.

---

_Reviewed: 2026-09-03T19:44:26Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
