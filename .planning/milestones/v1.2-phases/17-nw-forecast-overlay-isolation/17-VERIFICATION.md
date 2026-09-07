---
phase: 17-nw-forecast-overlay-isolation
verified: 2026-09-07T21:50:00Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
decision_coverage:
  honored: 18
  total: 18
  not_honored: []
behavior_unverified_items: []
human_verification:
  - test: "Orca on `/`: switch 30д/90д/1г/всё — dashed «Прогноз» Line, today ReferenceLine hinge, horizon grows with preset"
    expected: "Forecast series visible when open slots exist; hinge at today; X-axis spans past+future through horizon end"
    result: pass
    evidence: "17-UAT.md #10 — 30д hide Line; 90д/1г/всё dashed Прогноз + ReferenceLine; axis grows"
  - test: "Missing FX for a future non-primary slot → banner «Прогноз неполный · нет курса»; Line hide/keep per D-16"
    expected: "role=status banner near NW chart; if all slots FX-excluded → banner only, no Line; if some convert → Line + banner"
    result: n/a
    evidence: "No missing-FX fixture in DB; banner wiring covered by automated tests"
coincidental_reliance_items:

  - truth: "Past NW series / computeNetWorthRows unchanged with or without income data; income actions never write BalanceSnapshot"
    reason: fixture-only
    harden: "INISO golden calls buildNetWorthSeries twice with identical inputs; income fixture voided. Real proof = import walls + API surface + actions write-gate — keep those; optional: assert computeNetWorthRows input type forbids income fields too"
---

# Phase 17: NW forecast overlay + isolation Verification Report

**Phase Goal:** Капитал shows forward NW projection from open planned pay (recurring + future one-time); historical NW stays account-only
**Verified:** 2026-09-07T21:50:00Z
**Status:** passed
**Re-verification:** Yes — Orca UAT closed human visual gate

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | On `/`, user sees NW chart with future dashed overlay from open planned income (recurring + future one-time) converted via FX LOCF | ✓ VERIFIED | Orca UAT 2026-09-07: 30д no Line (no open slots); 90д/1г/всё legend «Прогноз» + dashed overlay + ReferenceLine hinge; horizon grows with preset. Math still green in vitest. |
| 2 | Horizon mirrors dashboard lookback preset (`all` capped at 1y); filled/today/overdue slots stay out of overlay | ✓ VERIFIED | `forecastHorizonEnd` 30/90/365/all→365 tested. Builder ignores `plannedAsOf ≤ today` / beyond horizon. Shell: `from = today+1`, skips oneTime with actual, skips filled recurring via `occurrenceKeyString`. |
| 3 | Past NW series / `computeNetWorthRows` unchanged with or without income data; income actions never write BalanceSnapshot | ✓ VERIFIED | `iniso.test.ts`: no income/nw-forecast imports in `net-worth.ts` / `historical-series.ts`; nw-forecast bans prisma/BalanceSnapshot/NW imports; API keys exclude income. `actions.ts` has zero BalanceSnapshot refs; actions.test write-gate green. |
| 4 | Isolation regressions (file-scan / property) and Nyquist validation for v1.2 income phases are green | ✓ VERIFIED | Wave merge: `npx vitest run` nw-forecast + iniso + historical-series + income + actions + nw-forecast-ui → **PASS 99 FAIL 0**. `17-VALIDATION.md`: `wave_0_complete: true`, `nyquist_compliant: true`, task IDs mapped. |
| 5 | REQUIREMENTS FCST-01 + ROADMAP SC + STATE describe recurring + future one-time (D-01 docs sync) | ✓ VERIFIED | REQUIREMENTS FCST-01 = “recurring + future one-time”; ROADMAP goal/SC1 same; STATE decision “FCST-01 docs = recurring + future one-time”; no stale one-time-excluded blocker. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `src/lib/nw-forecast.ts` | forecastHorizonEnd + buildNetWorthForecastSeries | ✓ VERIFIED | Pure; dates/locf/money only; cumulative + FX exclude |
| `src/lib/nw-forecast.test.ts` | membership/horizon/FX suite | ✓ VERIFIED | Green |
| `src/lib/iniso.test.ts` | INISO file-scan + past identity | ✓ VERIFIED | Green (golden weak — see coincidental_reliance) |
| `src/app/page.tsx` | income load + anchor + forecastIncome | ✓ VERIFIED | Wired to DashboardChartsShell |
| `src/components/dashboard/DashboardChartsShell.tsx` | useMemo forecast + merge + banner | ✓ VERIFIED | showForecast / partial banner |
| `src/components/dashboard/NetWorthHistoryChart.tsx` | ComposedChart + Line + ReferenceLine + tooltip | ✓ VERIFIED | strokeDasharray 5 5, stepAfter, «Прогноз» |
| `src/components/dashboard/nw-forecast-ui.test.ts` | chart file-scan | ✓ VERIFIED | Green |
| `.planning/REQUIREMENTS.md` / `ROADMAP.md` / `STATE.md` | D-01 wording | ✓ VERIFIED | Synced |
| `17-VALIDATION.md` | Nyquist map | ✓ VERIFIED | Complete |

### Key Link Verification

Automated `verify.key-links` failed (PLAN `from:` not file paths). Manual wiring:

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `page.tsx` income + `computeNetWorthRows` | `DashboardChartsShell` | `anchorPrimaryMinor` + `forecastIncome` | ✓ WIRED | Serializable defs/actuals |
| `DashboardChartsShell` range | `forecastHorizonEnd` + `buildNetWorthForecastSeries` | useMemo deps `[range, …]` | ✓ WIRED | Recompute per preset |
| Open slots | `buildNetWorthForecastSeries` | `listAllInRange` + actual filter | ✓ WIRED | D-01/D-02 membership at shell |
| `isPartialForecast` | banner | `role=status` «Прогноз неполный · нет курса» | ✓ WIRED | After NW chart |
| `showForecast` / today | Line + ReferenceLine | chart props | ✓ WIRED | Conditional mount |
| tooltip `asOfDate > today` | «Прогноз» only | NetWorthChartTooltip | ✓ WIRED | No fake stack |
| `iniso` file-scan | net-worth / historical / nw-forecast | readFileSync regex | ✓ WIRED | Tests green |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| page → shell | forecastIncome | prisma recurring/oneTime + actuals | Yes | ✓ FLOWING |
| page → shell | anchorPrimaryMinor | `computeNetWorthRows` totals | Yes | ✓ FLOWING |
| shell → builder | openSlots | `listAllInRange` + filters | Yes | ✓ FLOWING |
| builder → chart | forecast points | cumulative + FX LOCF @ today | Yes (pure) | ✓ FLOWING |
| chart Areas | account stacks | existing fact series | Yes | ✓ FLOWING |
| historical NW | buildNetWorthSeries | accounts/snapshots/rates only | Yes; no income | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Forecast math + INISO + UI file-scan + actions | `npx vitest run src/lib/nw-forecast.test.ts src/lib/iniso.test.ts src/components/dashboard/nw-forecast-ui.test.ts src/app/income/actions.test.ts` | PASS 48 | ✓ PASS |
| Wave merge (Nyquist) | `… + historical-series + income` | PASS 99 | ✓ PASS |
| Live `/` overlay visual | Orca tab localhost:3000 | pass (17-UAT #10) | ✓ PASS |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No phase probe scripts | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| FCST-01 | 01, 02, 03 | Dashed overlay recurring + future one-time via FX LOCF | ✓ SATISFIED | Code+tests green; Orca UAT visual pass |
| ISO-01 | 01, 02 | No historical NW mutation; no BalanceSnapshot from income | ✓ SATISFIED | iniso + actions |

Orphaned requirements for Phase 17: none (only FCST-01, ISO-01).

### Prohibitions

| Statement | Evidence | Verdict |
| --------- | -------- | ------- |
| MUST NOT feed income into computeNetWorthRows / past series | Import walls + API surface | enforced (test) |
| MUST NOT invent FX 0/1 | exclude + isPartialForecast tests | enforced (test) |
| MUST NOT fixed independent 90d horizon | horizon suite all→365 | enforced (test) |
| MUST NOT new npm packages | no deps added (lock `hasInstallScript` noise only) | enforced (judgment+diff) |
| MUST NOT solid Area forecast / fake future stacks / IncomeList stats on Капитал | Line not Area; tooltip branch; no IncomeList import | enforced (file-scan/judgment) |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No TBD/FIXME/XXX/TODO in phase key files | — | — |

### Decision Coverage

All trackable CONTEXT.md decisions honored by shipped artifacts (18/18). Gate non-blocking.

### Human Verification Required

### 1. Orca visual forecast chrome (PLAN 03)

**Test:** On `/`, switch 30д/90д/1г/всё — confirm dashed «Прогноз», today ReferenceLine, horizon growth.
**Expected:** Overlay readable as forecast-not-fact; hinge clear; fact Areas unchanged left of today.
**Why human:** Visual / interaction judgment.

### 2. Partial FX honesty

**Test:** Future slot missing LOCF rate → observe banner and Line visibility (D-15/D-16).
**Expected:** «Прогноз неполный · нет курса» `role=status`; all-excluded → banner only.
**Why human:** Layout/tone + live FX fixture.

### Gaps Summary

No code gaps. Automated FCST math + ISO walls + Nyquist green. Live Orca UAT passed (truth #1). Partial FX banner live tone N/A without fixture; wiring covered by unit tests.

---

_Verified: 2026-09-07T21:50:00Z_
_Verifier: agent (gsd-verify-work + Orca)_
