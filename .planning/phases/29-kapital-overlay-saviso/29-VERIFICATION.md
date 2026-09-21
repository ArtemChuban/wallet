---
phase: 29-kapital-overlay-saviso
verified: 2026-09-21T16:37:31Z
status: human_needed
score: 13/17 must-haves verified
behavior_unverified: 1
overrides_applied: 0
decision_coverage:
  honored: 13
  total: 13
  not_honored: []
gaps: []
behavior_unverified_items:
  - truth: "Same-day SAVINGS credits sort by amount descending then account name А→Я (D-02 probe Альфа/Яндекс/Бета)"
    test: "Hover a future accrual day with ≥2 interest events (amounts 20, 20, 10; names Альфа, Яндекс, Бета) or unit-test the sort comparator"
    expected: "Row order Альфа, Яндекс, Бета"
    why_human: "UI suite only file-scans localeCompare(ru, base); no runtime assert of probe order"
human_verification:
  - test: "Капитал hover UAT — accrual day + grace due day (harvested from 29-02 PLAN human-check)"
    expected: "Interest block once with plus amount; later forecast days keep higher line without that block; grace row has minus and dashed line lower; overdue grace on today leaves fact Итого unchanged"
    why_human: "Live chart geometry and tooltip mount order need browser observation (OPERATOR agent UAT via Orca)"
  - test: "Backstop — banner currency-code list wraps in p-4 card"
    expected: "Codes wrap inside existing p-4 card; no ellipsis; no kind word (доходы/грейс/накопительный)"
    why_human: "verification: backstop — insufficient_spec; no held-out visual test"
  - test: "Backstop — partial-forecast banner template wraps"
    expected: "Fixed Russian «Прогноз неполный · нет курса {CODES}» wraps in the card"
    why_human: "verification: backstop — insufficient_spec"
  - test: "Backstop — muted dash steps up on accrual and down on grace; today hinge gap"
    expected: "Same muted strokeDasharray 5 5 Line rises on accrual day and falls on grace day; overdue grace on today can gap dashed sample vs fact Итого"
    why_human: "verification: backstop — geometry + hinge gap not proven by unit minors alone"
  - test: "Prohibition — Forecast code must not write BalanceSnapshot"
    expected: "No create/update/upsert/delete on balanceSnapshot from forecast path"
    why_human: "judgment-tier prohibition — saviso never-call scan is strong evidence but needs human accept (unverified-prohibition)"
  - test: "Prohibition — Forecast code must not rewrite historical net-worth LOCF"
    expected: "buildNetWorthSeries SAVINGS totals stay snapshot minors; no interest on historical input"
    why_human: "judgment-tier prohibition — saviso golden series evidence; human accept required"
  - test: "Prohibition — Forecast code must not invent FX rates when conversion rate missing"
    expected: "Missing rate drops slot and lists currency code only"
    why_human: "judgment-tier prohibition — INT-03 tests cover drop; human accept required"
---

# Phase 29: Капитал overlay + SAVISO Verification Report

**Phase Goal:** Users see future SAVINGS interest on dashed «Прогноз» without rewriting historical NW. Also D-11: the same dashed line falls by the grace payment in primary currency.
**Verified:** 2026-09-21T16:37:31Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | On Капитал `/`, dashed «Прогноз» includes future SAVINGS interest credits alongside income and grace | ✓ VERIFIED | `DashboardChartsShell` calls `listInterestSlotsInRange` → `kind: "interest"` → concat income→interest→grace; `future interest slot adds planned amount to NW` passes; page `forecastSavings` carries `annualRateBps`/`accrualDayOfMonth` |
| 2 | Missing FX for non-primary SAVINGS shows the same partial-honesty banner pattern as other overlay sources | ✓ VERIFIED | INT-03 vitests list `excludedMissingFxCurrencies`; shell banner `Прогноз неполный · нет курса` + `.join(", ")`; no kind tags in banner scan |
| 3 | Recording/viewing interest forecast never creates BalanceSnapshot and never changes historical NW LOCF | ✓ VERIFIED | `saviso.test.ts` never-call on snapshot mutators; golden `totalPrimaryMinor` = `100_000n`×2; historical builders ban `savings-interest` import |
| 4 | Regression suite proves SAVISO (never-calls + golden historical identity without interest) | ✓ VERIFIED | `src/lib/saviso.test.ts` — 7 tests green in phase suite |
| 5 | Dashed line falls by grace payment in primary (D-11) | ✓ VERIFIED | `forecastDeltaMinor` grace → `-displayPrimaryMinor`; `future OPEN grace dips line by payment` expects `950_000n`; interest+grace net `1_000_000n` |
| 6 | INT-03 FX boundary: miss lists code; rate asOf today includes; rate day-after drops | ✓ VERIFIED | Named vitests in `nw-forecast.test.ts` (USD miss / today / day-after) |
| 7 | INT-03 precision: FX via `convertOtherMinorToPrimaryMinor`; no second rounding mode | ✓ VERIFIED | Source expect in `nw-forecast.test.ts`; builder still imports convert helper; no `savings-interest` import in builder |
| 8 | Grace tooltip: subtitle «Ожидаемый платёж», minus prefix on positive major | ✓ VERIFIED | `ForecastGraceTooltipBlock` source + UI file-scan green |
| 9 | «Прогноз» figure is NW level with no plus prefix | ✓ VERIFIED | `formatChartNumber(forecastVal)` without `` `+` `` template; UI scan asserts |
| 10 | Hide dashed Line when no FX-included slot; fact chart stays | ✓ VERIFIED | `showForecast = includedSlotCount > 0`; builder empty-points test when all FX-excluded |
| 11 | Chart shell: existing RSC load + client useMemo; no overlay skeleton | ✓ VERIFIED | `page.tsx` → `DashboardChartsShell`; forecast in `useMemo`; no skeleton markup |
| 12 | Future tooltip: «Накопительный» / «Ожидаемое начисление» / plus rows; interest only when `asOfDate > today` | ✓ VERIFIED | `ForecastInterestTooltipBlock` mounts only on future branch; UI scan + source |
| 13 | Future tooltip order: Прогноз level → interest → grace (D-06) | ✓ VERIFIED | Mount order in `NetWorthChartTooltip` future return |
| 14 | Same-day interest rows sort amount-desc then А→Я (D-02 probe) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Sort present in source; file-scan locks `localeCompare(..., "ru", { sensitivity: "base" })`; probe order not executed |
| 15 | Currency codes wrap in p-4 card, no ellipsis, no kind word | ⚠️ insufficient_spec | Backstop — `p-4` + no ellipsis/truncate in banner source; wrap unproven |
| 16 | Partial-forecast banner fixed Russian template wraps in card | ⚠️ insufficient_spec | Backstop — string present; wrap unproven |
| 17 | Same muted dash steps up on accrual and down on grace; today hinge can gap vs fact Итого | ⚠️ insufficient_spec | Backstop — minors + sign proven; live geometry / hinge gap need UAT |

**Score:** 13/17 truths verified (1 present, behavior-unverified; 3 abstained backstop)

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | MCP forecast interest events / tool copy | Phase 30 | Goal: «Agents see the same SAVINGS read surfaces as the UI (PARITY-01)»; C-05 lock — no MCP edits this phase |

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `src/lib/saviso.test.ts` | SAVISO import wall, never-call, golden | ✓ VERIFIED | 94 lines; isolation suite green |
| `src/lib/nw-forecast.test.ts` | Signed grace + INT-03 expects | ✓ VERIFIED | D-11/INT-03 cases green |
| `src/components/dashboard/nw-forecast-ui.test.ts` | Tooltip/shell file-scan | ✓ VERIFIED | Phase-29 describe green |
| `src/lib/nw-forecast.ts` | Grace addend negation | ✓ VERIFIED | `case "grace": return -displayPrimaryMinor` |
| `src/app/page.tsx` | `forecastSavings` RSC InterestAccountInput keys | ✓ VERIFIED | string `balanceMinor` + rate/DOM fields |
| `src/components/dashboard/DashboardChartsShell.tsx` | BigInt adapter + `listInterestSlotsInRange` | ✓ VERIFIED | codegraph callers confirm shell is production caller |
| `src/components/dashboard/NetWorthHistoryChart.tsx` | Interest block + grace copy/sign | ✓ VERIFIED | `ForecastInterestTooltipBlock` + minus grace |

### Key Link Verification

Automated `verify.key-links` on 29-02 returned false for all five links — PLAN `from:` values are conceptual labels, not file paths (tool schema miss). Manual/codegraph check:

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `page.tsx` forecastSavings | `listInterestSlotsInRange` | RSC string → shell BigInt adapter | ✓ WIRED | page maps SAVINGS; shell `BigInt(row.balanceMinor)` + rate/DOM |
| interest ForecastSlot | `buildNetWorthForecastSeries` | slots concat income→interest→grace | ✓ WIRED | `[...openSlots, ...interestSlots, ...graceSlots]` |
| `forecastDeltaMinor` grace | `forecastPrimaryMinor` | `-displayPrimaryMinor` | ✓ WIRED | switch arm + cumulative addend |
| point forecastEvents | `ForecastInterestTooltipBlock` | future tooltip, kind interest | ✓ WIRED | filter `kind === "interest"`; future branch only |
| `excludedMissingFxCurrencies` | partial banner | same code list, no kind word | ✓ WIRED | `missingFxCodes.join(", ")`; banner scan rejects kind words |

Plan 01 key-links: 4/4 automated ✓.

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| forecastSavings | balanceMinor / rate / DOM | Prisma accounts + LOCF map on page | Yes — live account rows | ✓ FLOWING |
| interestSlots | interestMinor | `listInterestSlotsInRange` Phase 28 math | Yes — compound enumerator | ✓ FLOWING |
| forecastPrimaryMinor | cumulative addends | `buildNetWorthForecastSeries` | Yes — signed grace + interest | ✓ FLOWING |
| tooltip displayPrimaryMajor | unsigned major | builder event payload | Yes — FX-gated | ✓ FLOWING |
| fact `nw` on today hinge | historical total | `mergeFactAndForecast` copies forecast onto existing point without overwriting `nw` | Yes when fact point exists | ✓ FLOWING |
| fact `nw` when no today fact point | `fp.forecast` assigned to `nw` on new today row | Edge path in `mergeFactAndForecast` | Possible hollow if empty fact series | ⚠️ WARNING — pre-existing edge; normal LOCF series has today |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Phase suite | `vitest run saviso + nw-forecast + nw-forecast-ui` | 3 files, 52 passed | ✓ PASS |
| D-11 grace dip | `vitest run -t "future OPEN grace dips line by payment"` | 1 passed | ✓ PASS |
| Interest addend | `vitest run -t "future interest slot adds planned amount"` | 1 passed | ✓ PASS |
| INT-03 FX miss | `vitest run -t "non-primary interest without a rate lists USD"` | 1 passed | ✓ PASS |
| SAVISO never-call | `vitest run saviso -t "never calls balanceSnapshot"` | 4 passed | ✓ PASS |
| Regression gate (orchestrator) | `npm test` | 54 files, 621 green (reported) | ✓ PASS |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No phase probes declared; no `scripts/*/tests/probe-*.sh` | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| INT-02 | 29-01, 29-02 | Dashed «Прогноз» includes future SAVINGS interest overlay slots | ✓ SATISFIED | Shell membership + interest addend tests + tooltip block |
| INT-03 | 29-01, 29-02 | FX LOCF honesty / partial banner for non-primary | ✓ SATISFIED | FX boundary vitests + shared banner |
| SAVISO-01 | 29-01, 29-02 | Never write BalanceSnapshot / never change historical LOCF | ✓ SATISFIED | saviso never-call + import wall |
| SAVISO-02 | 29-01, 29-02 | Regression suite for SAVISO isolation | ✓ SATISFIED | `saviso.test.ts` |

Orphaned requirements mapped to Phase 29 but missing from plans: none.

Deferred (not this phase): MCP-01, MCP-02, PARITY-01 → Phase 30.

### Decision Coverage

All trackable CONTEXT.md decisions honored by shipped artifacts (13/13). `gsd_run query check.decision-coverage-verify` — non-blocking.

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| `src/lib/saviso.test.ts` | SAVISO-01/02 | 7 | 0 | no | Value + source wall | PASS |
| `src/lib/nw-forecast.test.ts` | INT-02/03, D-11 | active | 0 | no | Value (minors, FX lists) | PASS |
| `src/components/dashboard/nw-forecast-ui.test.ts` | INT-02 UI | active | 0 | no | Existence (file-scan) | PASS — proves source, not live hover |

**Disabled tests on requirements:** 0
**Circular patterns detected:** 0
**Insufficient assertions:** 1 WARNING — UI file-scan does not prove D-02 probe order or live geometry (routed to human/backstop)

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | TBD/FIXME/XXX in phase-modified files | — | none found |
| `DashboardChartsShell.tsx` | ~190 | new today point may set `nw = forecast` when no fact row | ⚠️ Warning | Empty-fact edge; normal LOCF path preserves fact `nw` |

### Human Verification Required

### 1. Капитал hover UAT (accrual + grace)

**Test:** `npm run dev` → `http://localhost:3000/` → hover future accrual day and grace due day (agent UAT via Orca per OPERATOR.md).
**Expected:** Interest block once with `+` amount; later days keep higher line without repeating block; grace `-` and lower dashed sample; overdue grace on today leaves fact «Итого» unchanged.
**Why human:** Live Recharts hover / hinge geometry.

### 2–4. Backstop visual truths

**Test:** Observe banner wrap with multiple missing FX codes; observe dashed line rise/fall and today hinge gap.
**Expected:** Per UI-SPEC backstop rows (wrap, no ellipsis, muted dash shared).
**Why human:** `verification: backstop` — abstain without held-out observation (`insufficient_spec`).

### 5–7. Judgment-tier prohibitions

**Test:** Review saviso + INT-03 evidence; accept that forecast path must not write snapshots, rewrite LOCF, or invent FX.
**Expected:** Human accept of judgment prohibitions (unverified-prohibition until accepted).
**Why human:** ADR-550 judgment-tier — not a silent pass.

### Gaps Summary

No blocking implementation gaps. Goal math and wiring present: interest raises dashed «Прогноз», grace dips it, SAVISO isolation locked, FX honesty shared. Status is `human_needed` for live UAT, three UI-SPEC backstops, D-02 sort probe behavior, and three judgment prohibitions — not `gaps_found`.

---

_Verified: 2026-09-21T16:37:31Z_
_Verifier: Claude (gsd-verifier)_
