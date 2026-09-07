---
status: complete
phase: 16-counterparty-income-stats
source: [16-VERIFICATION.md]
started: 2026-09-07T19:00:00Z
updated: 2026-09-07T21:58:00Z
driver: agent
---

## Current Test

number: —
name: suite complete
expected: |
  all UAT checkpoints complete
awaiting: none

## Tests

### 1. Person with actuals shows «за всё время» + native Σ
expected: Person header shows lifetime label and native currency sum
result: pass
notes: |
  SSR HTML: `за всё время`, `55 000 RUB` / `10 000 RUB` with `font-semibold`

### 2. Identity-omit when single-ccy === primary && !partial
expected: primaryLine null when native === primary and not partial
result: pass
notes: |
  RSC props: `primaryLine: null` for RUB-primary persons

### 3. Plan / structure: no page hero «всего получено»
expected: No DebtsPrimaryTotalsHero; per-Person header only
result: pass

### 4. Visual hierarchy native > primary
expected: Classes match UI-SPEC (text-base font-semibold native; hint text-sm text-muted-foreground)
result: pass
notes: |
  Subjective polish not re-checked in browser chrome

### 5. Orca browser drive
expected: Drive /income via orca-ide
result: skipped
notes: |
  `orca-ide open` → `runtime_open_timeout`; status `app.running:false` after retry.
  SSR + Vitest (104/104) cover checkpoints; multi-ccy/partial covered by unit + file-scan.

## Notes

- Vitest already green (domain + UI file-scan). Regression subset 104/104.
- Multi-ccy / partial line not in current fixture data; covered by unit + file-scan.
- Human not required for further checkpoints unless visual taste issue reported.

## Verdict

**UAT complete** (Orca skipped — SSR agent evidence + Vitest) — phase verification passed.
