---
phase: 10-repayments-close-write-off
reviewed: 2026-09-05T12:27:00Z
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
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-09-05T12:27:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Reviewed Phase 10 repayment / size-change / forgive Server Actions, Zod schemas, debts page serialization, and detail/list UI. Core ledger path looks sound: interactive `$transaction`, domain asserts, `/debts`-only revalidate, React text for notes, no `window.confirm`. Intentional no-`isForgive` / no-«Списание» deviation not flagged.

Three warnings: forgive confirm shows delete pending copy; mixed timeline tie-breaks on cross-table `id`; size-change delete that would break remaining floor surfaces a generic error.

## Warnings

### WR-01: Forgive confirm pending label says «Удаление…»

**File:** `src/components/debts/DebtDetailDialog.tsx:259-267` (via `DestructiveConfirmStep`)
**Issue:** Forgive uses `DestructiveConfirmStep`, which hardcodes pending button text to «Удаление…» (`DestructiveConfirmStep.tsx:47`). During «Простить остаток» the UI claims a delete is in progress.
**Fix:** Add an optional `pendingLabel` (default «Удаление…») on `DestructiveConfirmStep`, and pass a forgive-specific value from the detail dialog:

```tsx
<DestructiveConfirmStep
  message={`Будет списан остаток ${remainingLabel} ${debt.currencyCode}. Долг закроется. Это нельзя отменить.`}
  confirmLabel="Простить остаток"
  pendingLabel="Сохранение…"
  pending={isActing}
  onConfirm={handleConfirm}
  onBack={() => {
    if (!isActing) setConfirm(null);
  }}
/>
```

### WR-02: Mixed timeline tie-break uses incomparable cross-table `id`

**File:** `src/components/debts/DebtDetailDialog.tsx:100-105`
**Issue:** Same-day repayment vs size-change rows sort with `b.id - a.id`. `DebtRepayment` and `DebtSizeChange` use separate AUTOINCREMENT sequences, so ids are not a shared insert order. Phase 8 research (pitfall 3 / A4) already noted this and added `createdAt` for mixed ordering; Phase 10 timeline still sorts by `id`. Same-day history can show the wrong newest-first order (money math stays correct — sums are order-independent).
**Fix:** Select `createdAt` on both event includes in `src/app/debts/page.tsx`, thread it through `DebtRepaymentEvent` / `DebtSizeChangeEvent`, and sort:

```ts
items.sort((a, b) => {
  if (a.asOfDate !== b.asOfDate) {
    return a.asOfDate < b.asOfDate ? 1 : -1;
  }
  if (a.createdAt !== b.createdAt) {
    return a.createdAt < b.createdAt ? 1 : -1;
  }
  return b.id - a.id; // same kind only as last resort
});
```

### WR-03: `deleteSizeChange` opaque failure when remaining would go negative

**File:** `src/app/debts/actions.ts:877-896`
**Issue:** After deleting a size-up that repayments already consumed, `remainingMinor` can be `< 0`. `statusForRemaining` then throws `"remaining must never be < 0"`. The transaction rolls back (good), but the catch maps every non-`SIZE_CHANGE_NOT_FOUND` error to «Не удалось удалить. Попробуйте снова.» — user cannot tell the floor invariant blocked the delete.
**Fix:** Map the domain error to a field/message before the generic fallback:

```ts
} catch (error) {
  if (error instanceof Error && error.message === "SIZE_CHANGE_NOT_FOUND") {
    return { message: "Не удалось удалить. Попробуйте снова." };
  }
  if (error instanceof Error && error.message === "remaining must never be < 0") {
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
**Issue:** Schema only checks `YYYY-MM-DD` shape, so values like `2026-02-31` pass Zod and the future-date string compare. Normal `<input type="date">` avoids this; crafted FormData can persist bogus dates.
**Fix:** Add a small calendar validity refine (UTC or Moscow parse + round-trip) shared by repayment / size-change / forgive schemas.

### IN-02: Fractional-digit repayment/size errors lose scale detail

**File:** `src/app/debts/actions.ts:525-533`, `729-735`
**Issue:** `too many fractional digits` returns «Некорректная сумма», while `resolveInitialMinor` returns «Не больше N знаков после запятой».
**Fix:** Reuse the scale-specific Russian message (include `debt.currency.scale`) for repayment and size-change paths.

### IN-03: Debt row is a `role="button"` wrapping another button

**File:** `src/components/debts/DebtsList.tsx:50-86`
**Issue:** Row opens detail via `role="button"` while «Изменить» is a nested real `<button>` (stopPropagation helps click, not full a11y tree rules).
**Fix:** Prefer a layout where the remaining/meta hit target is a button/link and actions sit outside it, or use an explicit «Открыть» control.

---

_Reviewed: 2026-09-05T12:27:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
_Note: Absence of isForgive / «Списание» label treated as intentional user deviation — not flagged._
