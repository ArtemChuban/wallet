---
status: complete
phase: 10-repayments-close-write-off
source: [10-VERIFICATION.md]
started: 2026-09-05T12:35:00Z
updated: 2026-09-05T20:30:00Z
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
expected: Two tabs delete+create on same debt — no corrupt ledger; Debt.status matches remaining after each success; stale failure shows «Долг или запись не найдены. Обновите страницу.» (not opaque catch-all).
result: skipped
reason: "User accepted current opaque stale-tab error as OK (2026-09-05); G-10-8 deferred — ledger OK, UX polish optional"
severity: major

### 6. Create-debt Select with long person name
expected: «Новый долг» dialog stays within max width; person/direction/currency Select triggers truncate long labels and do not overflow the dialog chrome.
result: pass
prior_result: issue
reported: "Также съехала разметка при создании долга и выбранном человеке с длинным именем" (+ screenshot)
severity: cosmetic
fix_applied: "select.tsx w-full min-w-0 truncate; DebtFormDialog overflow-hidden + min-w-0 form; Orca measure triggerW<dialogW"
result_after_fix: pass

### 7. Debt detail dialog fits viewport
expected: DebtDetailDialog (row click) stays within viewport; long form content scrolls inside the dialog.
result: pass
prior_result: issue
reported: "А при нажатии на сам долг для работы с ним модалка слишком высокая и не влазиет в экран" (+ screenshot)
severity: major
fix_applied: "DebtDetailDialog max-h min(90dvh) + overflow-y-auto body; Orca fits=true canScroll=true"
result_after_fix: pass

## Summary

total: 7
passed: 6
issues: 0
pending: 0
skipped: 1
blocked: 0

## Gaps

- gap_id: G-10-5
  truth: "Two tabs delete+create on same debt — no corrupt ledger; after each successful write Debt.status matches remainingMinor; failed writes show actionable Russian error (not opaque catch-all)"
  status: resolved
  reason: "10-04 shipped server P2025 mapping + vitest; client opaque UX deferred as G-10-8 (user accepted)"
  severity: major
  test: 5
  plan: 10-04

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

- test: 5
  idea: "G-10-8 forgive client: show deltaMajor / refresh RU; keep confirm on failure; forgive-tab actionError (10-05-PLAN.md drafted, not executed — user waived)"
  deferred_at: 2026-09-05
  gap_id: G-10-8
  plan: ".planning/phases/10-repayments-close-write-off/10-05-PLAN.md"
  debug: ".planning/debug/concurrent-stale-opaque-after-g105.md"

- test: 7
  idea: "DebtDetailDialog redesign — tabs variant 1 (Погашение / Изменение / Простить / История); user approved mock 2026-09-05"
  deferred_at: 2026-09-05
  todo: ".planning/todos/pending/2026-09-05-debt-detail-dialog-tabs-layout.md"
  mock: ".planning/phases/10-repayments-close-write-off/debt-detail-variants-mock.html"
