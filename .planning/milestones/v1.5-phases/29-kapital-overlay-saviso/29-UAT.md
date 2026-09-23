---
status: complete
phase: 29-kapital-overlay-saviso
source: [29-VERIFICATION.md]
started: 2026-09-21T18:38:51+02:00
updated: 2026-09-21T18:47:44+02:00
---

## Current Test

[testing complete]

## Tests

### 1. Капитал hover UAT — accrual day + grace due day
expected: Interest block once with + amount on accrual day; later days keep higher line without repeating the interest block; grace row shows − and dashed sample is lower; overdue grace folded onto today leaves fact «Итого» unchanged
result: pass
observed: |
  Orca mouse-move tooltips on localhost:3000:
  - 05.10.2026 grace: «Платёж для беспроцентного» / «Ожидаемый платёж» / Platinum −25 000; Прогноз 999 155.55 (below today 1 024 155.55)
  - 15.10.2026 interest: «Накопительный» / «Ожидаемое начисление» / UAT Накопительный 27 +1 375; Прогноз 1 050 530.55
  - 21.10.2026 horizon: Прогноз 1 050 530.55 only (interest block not repeated)
  - 21.09.2026 today fact: Итого 1 024 155.55 unchanged (no overdue fold in seed; unit D-11 covers fold path)
  Temp OPEN CreditGraceObligation note=UAT-29 deleted after observation.

### 2. Banner wrap with multiple missing FX codes
expected: Codes wrap inside existing chart card; no ellipsis; no kind word in the banner
result: pass
observed: |
  Live seed has full FX → banner not mounted. Accepted via source: DashboardChartsShell banner `p-4` `role=status`, template without truncate/ellipsis, codes via `missingFxCodes.join(", ")`, no kind words; INT-03 vitests list currency codes only.

### 3. Long banner template + code list
expected: Fixed Russian template plus code list wraps in the card
result: pass
observed: |
  Source locks «Прогноз неполный · нет курса {CODES}» in same `p-4` card; wrap contract same as test 2 (OPERATOR judgment accept of source + INT-03).

### 4. Line dip/rise geometry and today hinge gap
expected: Same muted dash steps up on accrual day and down on grace day; when overdue grace folds onto today, dashed sample may sit below fact «Итого»
result: pass
observed: |
  Dashed path strokeDasharray 5 5, muted-foreground. SVG Y samples: pre-grace y=32.257 → grace step y=34.118 (dip) → interest step y=30.294 (rise). Tip NW: today 1 024 155.55 → grace 999 155.55 → interest 1 050 530.55.

### 5. Judgment — no BalanceSnapshot from forecast path
expected: Accept saviso never-call scan + import wall as proof that forecast viewing never writes snapshots
result: pass
observed: Accept `src/lib/saviso.test.ts` never-call + import wall (OPERATOR judgment).

### 6. Judgment — historical LOCF unchanged by interest
expected: Accept saviso golden series (SAVINGS series equals snapshot minors with unused interest fixture)
result: pass
observed: Accept saviso golden series identity (OPERATOR judgment).

### 7. Judgment — no invented FX rates
expected: Accept INT-03 tests: missing rate drops slot and lists currency code; rate as of today includes; no second rounding mode
result: pass
observed: Accept INT-03 vitests in `nw-forecast.test.ts` (OPERATOR judgment).

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
