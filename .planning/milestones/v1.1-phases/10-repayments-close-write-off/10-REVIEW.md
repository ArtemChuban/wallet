---
phase: 10-repayments-close-write-off
reviewed: 2026-09-05T18:30:09Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - src/app/debts/actions.ts
  - src/app/debts/actions.test.ts
  - src/app/debts/page.tsx
  - src/components/debts/DebtDetailDialog.tsx
  - src/components/debts/DebtFormDialog.tsx
  - src/components/debts/DebtsList.tsx
  - src/lib/validations/debts.ts
  - src/lib/validations/debts.test.ts
findings:
  critical: 1
  warning: 4
  info: 3
  total: 8
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-09-05T18:30:09Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Re-reviewed Phase 10 after Plan 04 G-10-5 staleness mapping (`isRecordNotFound` / `staleRecordRefreshState`, P2025 + missing-record refresh RU, forgive `assertSizeDelta` mapping). Server Action mapping and Vitest coverage look sound: refresh RU ≠ generic save catch-all, `revalidatePath("/debts")` only, peer-delete→create still succeeds.

Main gap is **client**: forgive failure path discards the error surface, so G-10-5 refresh copy never reaches the user on forgive. Also: forgive UI ignores `errors.deltaMajor`, pending label still says «Удаление…», timeline still sorts by cross-table `id`, and `deleteSizeChange` floor violations stay opaque.

## Critical Issues

### CR-01: Forgive failures clear confirm and hide error (G-10-5 silent)

**File:** `src/components/debts/DebtDetailDialog.tsx:202-210`, `470-517`
**Issue:** On forgive failure, `handleConfirm` sets `actionError` then `setConfirm(null)`. That leaves the confirm step (the only forgive surface that renders `actionError`) and returns to the forgive tab, which **never renders** `actionError`. Server can correctly return «Долг или запись не найдены. Обновите страницу.» (P2025) or other messages; UI shows nothing. Undermines Plan 04 / G-10-5 for the forgive path (repay/size forms still show `repayState.message` / `sizeState.message`).
**Fix:** Keep confirm open on failure, and/or render `actionError` on the forgive tab:

```tsx
const result = await forgiveRemaining({}, formData);
if (!result.success) {
  setActionError(
    result.errors?.asOfDate?.[0] ??
      result.errors?.deltaMajor?.[0] ??
      result.message ??
      "Не удалось сохранить. Проверьте поля и попробуйте снова.",
  );
  // Do NOT setConfirm(null) — keep DestructiveConfirmStep so alert stays visible
  return;
}
onSuccess();
```

And/or on the forgive tabpanel:

```tsx
{actionError ? (
  <p className="text-sm text-destructive" role="alert">
    {actionError}
  </p>
) : null}
```

## Warnings

### WR-01: Forgive UI ignores `errors.deltaMajor` (G-10-5 OVER_FLOOR)

**File:** `src/components/debts/DebtDetailDialog.tsx:203-208`
**Issue:** Plan 04 maps forgive `OVER_FLOOR` / `DELTA_ZERO` to `errors.deltaMajor` with actionable RU (`actions.ts:864-882`). Forgive `handleConfirm` only reads `errors.asOfDate` and `message`. Even after CR-01, OVER_FLOOR falls through to the opaque generic string. Forgive form has no `deltaMajor` field; must lift that error into `actionError` / `message`.
**Fix:** Include `result.errors?.deltaMajor?.[0]` in the forgive error chain (see CR-01 snippet), or map forgive assert failures to `message` on the server so all clients share one field.

### WR-02: Forgive confirm pending label says «Удаление…»

**File:** `src/components/debts/DebtDetailDialog.tsx:275-283` (via `DestructiveConfirmStep.tsx:47`)
**Issue:** Forgive uses `DestructiveConfirmStep`, which hardcodes pending text to «Удаление…». During «Простить остаток» UI claims a delete is in progress.
**Fix:** Add optional `pendingLabel` (default «Удаление…») on `DestructiveConfirmStep`; pass `pendingLabel="Сохранение…"` for forgive.

### WR-03: Mixed timeline tie-break uses incomparable cross-table `id`

**File:** `src/components/debts/DebtDetailDialog.tsx:100-105`
**Issue:** Same-day repayment vs size-change rows sort with `b.id - a.id`. Separate AUTOINCREMENT sequences — ids are not shared insert order. Phase 8 added `createdAt` for mixed ordering; page select still omits it (`page.tsx:20-34`). Money math OK; history order can be wrong.
**Fix:** Select `createdAt` on both event includes, thread through `DebtRepaymentEvent` / `DebtSizeChangeEvent`, sort by `asOfDate` DESC then `createdAt` DESC (then `id` as same-kind last resort).

### WR-04: `deleteSizeChange` opaque when remaining would go negative

**File:** `src/app/debts/actions.ts:938-958`
**Issue:** Deleting a size-up already consumed by repayments can yield `remaining < 0`. `statusForRemaining` throws `"remaining must never be < 0"`; transaction rolls back (good), but catch maps everything except missing-record to «Не удалось удалить. Попробуйте снова.» — user cannot tell the floor blocked the delete.
**Fix:**

```ts
} catch (error) {
  if (
    error instanceof Error &&
    (error.message === "SIZE_CHANGE_NOT_FOUND" || isRecordNotFound(error))
  ) {
    return staleRecordRefreshState();
  }
  if (
    error instanceof Error &&
    error.message === "remaining must never be < 0"
  ) {
    return {
      message:
        "Нельзя удалить: после удаления остаток стал бы отрицательным. Сначала удалите погашения.",
    };
  }
  return { message: "Не удалось удалить. Попробуйте снова." };
}
```

## Info

### IN-01: `asOfDate` accepts impossible calendar days

**File:** `src/lib/validations/debts.ts:3-5`
**Issue:** Schema only checks `YYYY-MM-DD` shape (`2026-02-31` passes). Normal `<input type="date">` avoids this; crafted FormData can persist bogus dates.
**Fix:** Shared calendar validity refine (parse + round-trip) on repayment / size-change / forgive schemas.

### IN-02: Fractional-digit repayment/size errors lose scale detail

**File:** `src/app/debts/actions.ts:540-548`, `748-754`
**Issue:** `too many fractional digits` returns «Некорректная сумма», while `resolveInitialMinor` returns «Не больше N знаков после запятой».
**Fix:** Reuse scale-specific Russian (include `debt.currency.scale`) on repayment and size-change paths.

### IN-03: Debt row is a `role="button"` wrapping another button

**File:** `src/components/debts/DebtsList.tsx:50-86`
**Issue:** Row opens detail via `role="button"` while «Изменить» is a nested real `<button>` (stopPropagation helps click, not full a11y tree rules).
**Fix:** Separate hit targets — remaining/meta as button/link, actions outside — or explicit «Открыть».

---

_Reviewed: 2026-09-05T18:30:09Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
_Note: Absence of isForgive / «Списание» label treated as intentional user deviation — not flagged. Server-side G-10-5 P2025 mapping in actions.ts + actions.test.ts verified sound; gap is DebtDetailDialog forgive error surfacing._
