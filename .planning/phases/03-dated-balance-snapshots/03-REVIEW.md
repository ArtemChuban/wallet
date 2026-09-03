---
phase: 03-dated-balance-snapshots
reviewed: 2026-09-03T11:32:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - prisma/migrations/20260903120000_balance_snapshot/migration.sql
  - prisma/schema.prisma
  - src/app/accounts/actions.ts
  - src/app/accounts/actions.test.ts
  - src/app/accounts/page.tsx
  - src/components/accounts/AccountList.tsx
  - src/components/accounts/SetBalanceDialog.test.ts
  - src/components/accounts/SetBalanceDialog.tsx
  - src/lib/balances.test.ts
  - src/lib/balances.ts
  - src/lib/foundation.test.ts
  - src/lib/validations/balance.test.ts
  - src/lib/validations/balance.ts
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 03: Code Review Report

**Reviewed:** 2026-09-03T11:32:00Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Reviewed BalanceSnapshot schema/migration, LOCF helpers, Zod contracts, Server Actions (`upsertBalanceSnapshot` / `deleteBalanceSnapshot`), `/accounts` page batch LOCF + history serialization, and AccountList / SetBalanceDialog UI. Core BAL-01/BAL-02 paths look sound: unique `(accountId, asOfDate)`, future-date gate, credit available bounds, null-before-first LOCF, history-only delete. No critical security or data-loss defects found. Three warnings around delete pending-state races, impossible calendar dates slipping past Zod shape checks, and duplicated LOCF logic that can drift from `getBalanceAsOf`.

## Warnings

### WR-01: Delete pending UI races with async `startTransition`

**File:** `src/components/accounts/AccountList.tsx:171-195,287`
**Issue:** `handleDelete` wraps an `async` callback in `startTransition`. React ends the transition when the synchronous portion returns, not when `await deleteBalanceSnapshot(...)` finishes. The history row then receives `pendingId={isPending ? pendingId : null}`, so `isPending === false` clears the disabled state while the Server Action is still in flight. Users can double-submit delete; a thrown action also leaves no `try/finally`, so `pendingId` / error UI may not recover cleanly.
**Fix:** Drive disable state from `pendingId` alone, and always clear it in `finally`:

```tsx
startTransition(() => {
  void (async () => {
    setDeleteError(null);
    setPendingId(snap.id);
    try {
      const formData = new FormData();
      formData.set("id", String(snap.id));
      const result = await deleteBalanceSnapshot(formData);
      if (!result.success) {
        setDeleteError(
          result.message ?? "Не удалось удалить снимок. Попробуйте снова.",
        );
        return;
      }
      if (account.snapshots.length <= 1) {
        setExpanded(false);
      }
    } catch {
      setDeleteError("Не удалось удалить снимок. Попробуйте снова.");
    } finally {
      setPendingId(null);
    }
  })();
});

// ...
pendingId={pendingId}
```

### WR-02: `asOfDate` accepts non-calendar YYYY-MM-DD strings

**File:** `src/lib/validations/balance.ts:3-4` (enforced write path `src/app/accounts/actions.ts:186-202`)
**Issue:** `asOfDateSchema` only checks `/^\d{4}-\d{2}-\d{2}$/`. Values like `2026-02-30` or `2026-13-01` pass Zod and the lexicographic future-date gate, then persist into `BalanceSnapshot`. Later LOCF / FX as-of reads (Phase 04+) will treat those strings as ordered dates and can skew charts.
**Fix:** After the regex, parse and reject impossible calendar dates (UTC or civil components), e.g.:

```ts
function isValidCalendarDate(iso: string): boolean {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

const asOfDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату")
  .refine(isValidCalendarDate, "Укажите дату");
```

### WR-03: LOCF implemented twice (page batch vs `getBalanceAsOf`)

**File:** `src/app/accounts/page.tsx:21-52` and `src/lib/balances.ts:7-13`
**Issue:** `/accounts` reimplements LOCF with `findMany` + first-hit-per-`accountId`, while `getBalanceAsOf` uses `findFirst` + `lte` + `orderBy desc`. Semantics match today, but Phase 04+ callers that use the helper can diverge from list display if only one path is updated (extra order keys, filters, timezone “today”, etc.).
**Fix:** Prefer one shared batch helper (e.g. `getBalancesAsOf(accountIds, asOfDate)`) used by the page, or derive LOCF from the already-loaded `allSnapshots` list so list and helper stay one algorithm.

## Info

### IN-01: Duplicated `creditDebtMinor` on the client

**File:** `src/components/accounts/AccountList.tsx:51-58` (canonical: `src/lib/balances.ts:16-21`)
**Issue:** Client copy exists to avoid importing Prisma-backed `@/lib/balances`. Fine for now; two copies can drift if debt math gains clamping or validation.
**Fix:** Extract a tiny pure module (e.g. `src/lib/credit-debt.ts`) imported by both server helpers and `AccountList`.

### IN-02: `balances.test.ts` “upsert overwrite” does not exercise app write path

**File:** `src/lib/balances.test.ts:75-129`
**Issue:** The overwrite case mocks `prisma.balanceSnapshot.upsert` directly and never calls `upsertBalanceSnapshot`. Real coverage lives in `actions.test.ts`, so this test overstates helper-level write guarantees and can stay green if the action regresses.
**Fix:** Drop or rewrite as an action-level test only; keep `balances.test.ts` focused on `getBalanceAsOf` / `creditDebtMinor` / `calendarDateToday`.

---

_Reviewed: 2026-09-03T11:32:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
