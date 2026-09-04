---
phase: 07-address-tech-debt-locf-consolidation-nyquist-3-6
reviewed: 2026-09-04T10:15:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - src/lib/locf.ts
  - src/lib/locf.test.ts
  - src/app/accounts/page.tsx
  - src/app/currencies/rates/page.tsx
  - src/app/page.tsx
  - src/lib/historical-series.ts
  - src/lib/balances.ts
  - src/lib/fx.ts
findings:
  critical: 0
  warning: 1
  info: 2
  total: 3
status: issues
---

# Phase 07: Code Review Report

**Reviewed:** 2026-09-04T10:15:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues

## Summary

Reviewed LOCF consolidation (`locf.ts` + three RSC batch Maps + historical-series rewire + Prisma wrapper comments). Shared pick/map semantics match null-before-first; current page queries satisfy the desc + `lte` precondition. No security issues. One maintainability footgun on `firstHitLocfMap` (unenforced precondition) plus two info-level doc/complexity notes.

## Narrative Findings (AI reviewer)

Adversarial pass over phase 07 key-files. Call sites for `firstHitLocfMap` are currently correct; the shared API still allows silent wrong LOCF if a future caller drops sort/filter. Series rewire preserves D-16 null-FX skip. Prisma `get*AsOf` wrappers unchanged in behavior.

## Warnings

### WR-01: `firstHitLocfMap` precondition unenforced

**File:** `src/lib/locf.ts:26-41`
**Issue:** `firstHitLocfMap` documents that rows must already be filtered `asOfDate <= D` and sorted `asOfDate desc`, but does not validate or sort. First-key-wins on ascending or unfiltered input silently returns the oldest (or future) row per key, while `pickLatestAsOf` would still be correct — breaking the LOCF-05 pure↔map contract and understating balances/FX on any miswired caller. Phase 07 made this the shared surface for `/accounts`, `/currencies/rates`, and `/`.
**Fix:** Either enforce the contract at runtime, or make the batch helper order-independent:

```typescript
export function firstHitLocfMap<K, T>(
  rows: readonly T[],
  keyOf: (row: T) => K,
  asOfOf: (row: T) => string,
): Map<K, T> {
  const map = new Map<K, T>();
  for (const row of rows) {
    const key = keyOf(row);
    const prev = map.get(key);
    if (!prev || asOfOf(row) > asOfOf(prev)) {
      map.set(key, row);
    }
  }
  return map;
}
```

Or keep first-hit and add a debug assert / Vitest that ascending input diverges from `pickLatestAsOf`, so regressions fail loudly. Update the three page call sites if the signature gains `asOfOf`.

## Info

### IN-01: Stacks JSDoc disagrees with implementation

**File:** `src/lib/historical-series.ts:45-48` vs `121-126`
**Issue:** Type comment says excluded accounts omit the stack key; code always writes `0` when `!includedInTotal`. Chart path spreads stacks into Recharts points with `connectNulls={false}`, so `0` is likely intentional; the comment is stale and can mislead a future “fix”.
**Fix:** Update the JSDoc to say excluded accounts contribute `0` for stable stack keys (or change code to omit keys only if charts are updated to match).

### IN-02: `buildAccountSeries` still very long after LOCF rewire

**File:** `src/lib/historical-series.ts:171-299`
**Issue:** Function remains ~130 lines with nested credit/native/primary branches. Phase 07 only swapped imports; complexity still concentrates LOCF + conversion + credit-stack rules in one body, raising miss risk on later edits.
**Fix:** Extract credit-stack point builders (native vs primary) into small helpers sharing the `locfAmountAsOf` / `locfRateAsOf` + D-16 continue pattern.

---

_Reviewed: 2026-09-04T10:15:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
