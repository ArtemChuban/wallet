# DEBUG: concurrent stale write opaque error

## Symptom

- **Test:** 10-UAT #5 Optional concurrency smoke
- **Reported:** «Не удалось сохранить. Проверьте поля и попробуйте снова.» after deleting in one tab then trying to write off / repay part of debt in another
- **Severity:** major
- **gap_id:** G-10-5

## Reproduction

1. Open same debt detail in two tabs (`localhost:3000/debts`)
2. Tab B: delete a history event (repayment / size-change) and confirm
3. Tab A: stale dialog still open — submit partial repay or size-change («списать часть»)
4. Observe opaque form-level error (not field-level «Сумма больше остатка…»)

**Agent note:** Sequential delete→createRepayment on stale tab *can* succeed (reproduced 2026-09-05). Failure is intermittent / depends on what was deleted vs what stale tab submits (e.g. debt gone, over-floor unmapped path, Prisma errors).

## Hypotheses

| ID | Hypothesis | Priority | Result |
|----|------------|----------|--------|
| H1 | Catch-all in createRepayment/createSizeChange/forgiveRemaining masks Prisma P2025 / busy / unmapped domain throws as opaque RU message | HIGH | CONFIRMED (code) |
| H2 | Zod `.strict()` rejects Next action extras | HIGH | REJECTED — actions pick named keys only |
| H3 | Stale dialog submits after peer delete; domain over-repay should be field error | MED | PARTIAL — over-repay mapped; other throws not |
| H4 | forgiveRemaining does not map assertSizeDelta failures | MED | CONFIRMED (code) — only NOTHING_TO_FORGIVE mapped |
| H5 | SQLITE_BUSY despite busy_timeout=5000 | LOW | INCONCLUSIVE |

## Investigation

- `createRepayment` / `createSizeChange` catch: map OVER_REPAY, AMOUNT_NOT_POSITIVE, fractional, bad amount, OVER_FLOOR, DELTA_ZERO — else generic message (`src/app/debts/actions.ts`)
- `forgiveRemaining` catch: only `NOTHING_TO_FORGIVE`; any other throw → same generic message
- `findUniqueOrThrow` on missing debt → Prisma error → generic
- Stale `DebtDetailDialog` does not auto-close/refresh when peer `revalidatePath('/debts')` updates list; body keeps old `remainingMinor` until remount
- Empty confirm dialog flash observed once during Orca delete (possible RSC race) — secondary

## Root Cause

Concurrent / stale-tab writes that throw **unmapped** errors (Prisma record missing after peer delete, unexpected domain throws in `forgiveRemaining`, adapter/lock errors) are collapsed by action catch-alls into «Не удалось сохранить. Проверьте поля и попробуйте снова.» with no refresh guidance. Ledger may stay consistent, but UAT concurrency truth fails because the user-visible failure is opaque and unrecoverable without manual reload.

## Proposed Fix

1. Map Prisma `P2025` / not-found → «Долг или запись не найдены. Обновите страницу.» on create/delete/forgive debt event actions
2. Map remaining `assertSizeDelta` errors inside `forgiveRemaining` (should not happen for −remaining, but must not be opaque)
3. On those staleness errors: `revalidatePath('/debts')` so next open is fresh
4. Add vitest: delete repayment then createRepayment still succeeds; delete debt then createRepayment returns mapped not-found message (not generic)
5. Optional UX: when detail open and remaining/event ids drift, close dialog or show banner — follow-up if needed

## Status

- **Status:** diagnosed
- **Created:** 2026-09-05T13:20:00Z
- **Diagnosed:** 2026-09-05T13:25:00Z
- **Resolved:** 
