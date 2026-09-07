---
status: complete
phase: 17-nw-forecast-overlay-isolation
source: 17-01-SUMMARY.md, 17-02-SUMMARY.md, 17-03-SUMMARY.md
started: 2026-09-07T21:42:00Z
updated: 2026-09-07T21:50:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Pure cumulative NW forecast builder with horizon mirror + FX@today exclude
expected: Pure cumulative NW forecast builder with horizon mirror + FX@today exclude
result: pass
source: automated
coverage_id: D1

### 2. Капитал shell merges open planned income into dashed Прогноз Line
expected: Капитал shell merges open planned income into dashed Прогноз Line
result: pass
source: automated
coverage_id: D2

### 3. net-worth/historical-series stay free of income/nw-forecast imports
expected: net-worth/historical-series stay free of income/nw-forecast imports
result: pass
source: automated
coverage_id: D3

### 4. INISO file-scan walls + past-series golden identity (ISO-01 / D-17 / D-18)
expected: INISO file-scan walls + past-series golden identity (ISO-01 / D-17 / D-18)
result: pass
source: automated
coverage_id: D1

### 5. Income actions never write BalanceSnapshot
expected: Income actions never write BalanceSnapshot
result: pass
source: automated
coverage_id: D2

### 6. FCST-01 / ROADMAP / STATE wording includes future one-time (D-01)
expected: FCST-01 / ROADMAP / STATE wording includes future one-time (D-01)
result: pass
source: automated
coverage_id: D3

### 7. ComposedChart dashed Line + ReferenceLine hinge + D-11 tooltip/legend split
expected: ComposedChart dashed Line + ReferenceLine hinge + D-11 tooltip/legend split
result: pass
source: automated
coverage_id: D1

### 8. Partial honesty banner near NW chart with hide/showForecast wiring
expected: Partial honesty banner near NW chart with hide/showForecast wiring
result: pass
source: automated
coverage_id: D2

### 9. Nyquist VALIDATION map closed; wave merge suite green
expected: Nyquist VALIDATION map closed; wave merge suite green
result: pass
source: automated
coverage_id: D3

### 10. Orca visual — dashed Прогноз + today hinge + partial banner tone
expected: On `/`, switch 30д/90д/1г/всё. When open future income slots exist in horizon: dashed «Прогноз» Line after today hinge (ReferenceLine), X-axis spans past+future, fact Areas left of today unchanged. Overlay reads as forecast-not-fact. Partial banner «Прогноз неполный · нет курса» only when FX exclude; if no open slots in preset, Line hidden.
result: pass
coverage_id: D4
observed: |
  Agent Orca on http://localhost:3000/ (2026-09-07).
  30д: no «Прогноз» legend/Line (D-08 — no open slots in horizon).
  90д: legend «Прогноз»; axis → 07.12.2026; ticks 15.10/15.11; dashed overlay after fact stack.
  1г/всё: «Прогноз» + axis → 08.09.2027; stair-step dashed Line.
  DOM (всё): recharts-line-curve=1, reference-line=1.
  Partial banner: not shown — no missing-FX fixture in current DB (wiring covered by automated D2); N/A live tone check.

## Summary

total: 10
passed: 10
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
