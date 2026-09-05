---
status: testing
phase: 10-repayments-close-write-off
source: [10-VERIFICATION.md]
started: 2026-09-05T12:35:00Z
updated: 2026-09-05T18:32:00Z
driver: orca-cli
---

## Current Test

[testing complete — diagnosing]

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
expected: Two tabs delete+create on same debt — no corrupt ledger; Debt.status matches remaining after each success; stale failure shows «Долг или запись не найдены. Обновите страницу.» (not opaque catch-all).
result: issue
prior_result: issue
reported: "Не удалось сохранить. Проверьте поля и попробуйте снова."
severity: major
retest_after: "10-04 G-10-5"
observed: "Same opaque catch-all after peer-tab delete + stale write (2026-09-05 re-UAT)"

### 6. Create-debt Select with long person name
expected: «Новый долг» dialog stays within max width; person/direction/currency Select triggers truncate long labels and do not overflow the dialog chrome.
result: issue
reported: "Также съехала разметка при создании долга и выбранном человеке с длинным именем" (+ screenshot)
severity: cosmetic
fix_applied: "select.tsx w-full min-w-0 truncate; DebtFormDialog overflow-hidden + min-w-0 form; Orca measure triggerW<dialogW"
result_after_fix: pass

### 7. Debt detail dialog fits viewport
expected: DebtDetailDialog (row click) stays within viewport; long form content scrolls inside the dialog.
result: issue
reported: "А при нажатии на сам долг для работы с ним модалка слишком высокая и не влазиет в экран" (+ screenshot)
severity: major
fix_applied: "DebtDetailDialog max-h min(90dvh) + overflow-y-auto body; Orca fits=true canScroll=true"
result_after_fix: pass

## Summary

total: 7
passed: 6
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-10-5
  truth: "Two tabs delete+create on same debt — no corrupt ledger; after each successful write Debt.status matches remainingMinor; failed writes show actionable Russian error (not opaque catch-all)"
  status: resolved
  reason: "10-04 shipped server P2025 mapping + vitest; re-UAT still opaque → tracked as G-10-8 regression/client gap"
  severity: major
  test: 5
  plan: 10-04

- gap_id: G-10-8
  truth: "After peer-tab delete, stale repay/size/forgive shows «Долг или запись не найдены. Обновите страницу.» (never opaque «Не удалось сохранить…»)"
  status: diagnosed
  reason: "Re-UAT 2026-09-05: still «Не удалось сохранить. Проверьте поля и попробуйте снова.» after 10-04"
  severity: major
  test: 5
  root_cause: "Forgive UI (WR-01+CR-01): ignores errors.deltaMajor → client opaque fallback (same string as server catch-all); clears confirm on failure; forgive tab never shows actionError. Peer history-event delete rarely P2025 so 10-04 server map idle for common smoke. Server P2025 map itself OK for missing debt."
  debug: ".planning/debug/concurrent-stale-opaque-after-g105.md"
  artifacts:
    - path: "src/components/debts/DebtDetailDialog.tsx"
      issue: "forgive handleConfirm: no deltaMajor; setConfirm(null); forgive tab omits actionError"
    - path: "src/app/debts/actions.ts"
      issue: "forgive OVER_FLOOR only errors.deltaMajor; non-P2025 still opaque catch-all"
  missing:
    - "Map Prisma P2025/not-found (and forgive assertSizeDelta fallthrough) to actionable RU + revalidatePath"
    - "Vitest: peer delete debt → createRepayment returns mapped message; peer delete repayment → create still succeeds"
  debug_session: ".planning/debug/concurrent-stale-write-opaque-error.md"

- gap_id: G-10-6
  truth: "Новый долг dialog Select triggers stay within dialog width with long person names (truncate, no overflow)"
  status: resolved
  reason: "User reported layout break with long person name in create-debt Select"
  severity: cosmetic
  test: 6
  root_cause: "SelectTrigger defaulted to w-fit + whitespace-nowrap; long SelectValue forced dialog min-content wider than max-w"
  artifacts:
    - path: "src/components/ui/select.tsx"
      issue: "w-fit / nowrap / missing min-w-0 on trigger and value"
    - path: "src/components/debts/DebtFormDialog.tsx"
      issue: "form/dialog lacked min-w-0 / overflow-hidden belt"
  missing: []
  resolved_by: inline UAT fix (select.tsx + DebtFormDialog)
  resolved_at: 2026-09-05
  debug_session: ""

- gap_id: G-10-7
  truth: "DebtDetailDialog stays within viewport; content scrolls inside dialog"
  status: resolved
  reason: "User reported detail modal too tall / does not fit screen"
  severity: major
  test: 7
  root_cause: "DialogContent had no max-height; stacked repay/size/forgive forms exceeded viewport"
  artifacts:
    - path: "src/components/debts/DebtDetailDialog.tsx"
      issue: "missing max-h + overflow-y-auto on detail dialog"
  missing: []
  resolved_by: inline UAT fix (DebtDetailDialog scroll shell)
  resolved_at: 2026-09-05
  debug_session: ""

## Deferred Follow-Ups

- test: 7
  idea: "DebtDetailDialog redesign — tabs variant 1 (Погашение / Изменение / Простить / История); user approved mock 2026-09-05"
  deferred_at: 2026-09-05
  todo: ".planning/todos/pending/2026-09-05-debt-detail-dialog-tabs-layout.md"
  mock: ".planning/phases/10-repayments-close-write-off/debt-detail-variants-mock.html"
