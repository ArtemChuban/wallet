---
status: diagnosed
phase: 10-repayments-close-write-off
source: [10-VERIFICATION.md]
started: 2026-09-05T12:35:00Z
updated: 2026-09-05T13:25:00Z
driver: orca-cli
---

## Current Test

[testing complete]

## Tests

### 1. Row click / meta edit separation
expected: On /debts, click entire debt row → DebtDetailDialog opens. Click «Изменить» → meta edit Dialog alone (stopPropagation).
result: pass
observed: Row → dialog «Долг — Зоя». «Изменить» → dialog «Изменить долг» alone (no detail).

### 2. Timeline visual
expected: Mixed newest-first История; repayments «Погашение»; size-changes «Изменение суммы» (no «Списание»).
result: pass
observed: Labels «Погашение» / «Изменение суммы» only; no «Списание».

### 3. «Закрытые (N)» subsection
expected: CLOSED debt under same person group, collapsed by default; expand and open full detail.
result: pass
observed: «Закрытые (1)» collapsed by default; expand + detail works.

### 4. Forgive confirm + hide at zero
expected: «Простить остаток» confirm shows remaining amount + close intent; after forgive debt CLOSED; CTA hidden when remaining is 0.
result: pass
observed: Confirm copy + CLOSED + CTA hidden at zero.

### 5. Optional concurrency smoke
expected: Two tabs delete+create on same debt — no corrupt ledger; Debt.status matches remaining after each success.
result: issue
reported: "Не удалось сохранить. Проверьте поля и попробуйте снова. Вот такая ошибка, когда попытался списать часть долга после удаления в другой вкладке"
severity: major

## Summary

total: 5
passed: 4
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-10-5
  truth: "Two tabs delete+create on same debt — no corrupt ledger; after each successful write Debt.status matches remainingMinor; failed writes show actionable Russian error (not opaque catch-all)"
  status: failed
  reason: "User reported: Не удалось сохранить. Проверьте поля и попробуйте снова. when trying to write off/repay part of debt after delete in another tab"
  severity: major
  test: 5
  root_cause: "createRepayment/createSizeChange/forgiveRemaining catch-alls map only a subset of domain errors; Prisma not-found and other throws become opaque «Не удалось сохранить…». Stale DebtDetailDialog can submit after peer-tab delete without refresh guidance."
  artifacts:
    - path: "src/app/debts/actions.ts"
      issue: "catch-all message hides P2025 / unmapped throws on concurrent stale writes"
    - path: "src/components/debts/DebtDetailDialog.tsx"
      issue: "open detail keeps stale remaining/events across peer revalidatePath"
  missing:
    - "Map Prisma P2025/not-found (and forgive assertSizeDelta fallthrough) to actionable RU + revalidatePath"
    - "Vitest: peer delete debt → createRepayment returns mapped message; peer delete repayment → create still succeeds"
  debug_session: ".planning/debug/concurrent-stale-write-opaque-error.md"
