---
phase: 21-kapital-forecast-integration
verified: 2026-09-09T20:46:17Z
status: passed
score: 26/28 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification: false
decision_coverage:
  honored: 18
  total: 18
  not_honored: []
human_verification:

  - test: "On Капитал `/`, hover today (folded overdue if any) and a future due day with income+grace"
    expected: "One dashed «Прогноз»; tooltip shows forecast/fact block then grace block with C-04 copy; partial banner lists FX codes when rates missing"
    why_human: "Layout/tooltip feel is subjective; automated file-scan cannot judge two-block readability (Plan 03 human-check)"
  - test: "Force several missing FX codes on income+grace so banner lists a long code string"
    expected: "Banner keeps «Прогноз неполный · нет курса …» and wraps inside muted p-4 card without ellipsis truncation"
    why_human: "UI-SPEC backstop — wrap/overflow not inferable from source alone (verification: backstop)"
  - test: "OPEN grace with a long account name on a sampled day; open tooltip"
    expected: "Grace row wraps via existing tooltip flex / min-w-40 / break-words without clipping name+amount"
    why_human: "UI-SPEC backstop — visual wrap not proven by unit/file-scan (verification: backstop)"
---

# Phase 21: Капитал forecast integration Verification Report

**Phase Goal:** Open grace obligations appear on Капитал «Прогноз» with the same FX honesty as income forecast
**Verified:** 2026-09-09T20:46:17Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | On Капитал `/`, dashed «Прогноз» includes open credit grace obligations from their due dates | ✓ VERIFIED | `page.tsx` OPEN `creditGraceObligation` → `forecastGrace`; shell `openGraceForecastMembership` → `kind: "grace"` slots; builder samples due/today; vitest A′/fold/grace-only green |
| 2 | Forecast credit slots use FX LOCF honesty; missing rate shows partial banner (never invents rates) | ✓ VERIFIED | `locfRateAsOf` null → exclude + `missingFxCodes`; banner `нет курса ${join(", ")}`; vitest FX codes unique; no invent path |
| 3 | Early-closed obligations no longer move the forecast; income + grace coexist on one signed series | ✓ VERIFIED | Membership skips non-OPEN; page `where: { status: "OPEN" }`; one `buildNetWorthForecastSeries([...openSlots, ...graceSlots])`; same-day income+grace ΔNW income-only test |
| 4 | Wave 0: nw-forecast + nw-forecast-ui suites exit 0 (no hard-fail poison) | ✓ VERIFIED | `npx vitest run` → PASS 54 / FAIL 0; no remaining `it.todo`/`describe.skip` in phase suites |
| 5 | OPEN membership folds overdue of any age onto today; future dues only in (today, horizonEnd]; CLOSED excluded | ✓ VERIFIED | `openGraceForecastMembership` + `credit-grace.test.ts` fold/horizon/CLOSED cases |
| 6 | Kind-aware builder: income `plannedAsOf > today`; grace allows `sampleAsOf >= today` after fold | ✓ VERIFIED | `slotInWindow` in `nw-forecast.ts`; overdue fold + income regression tests |
| 7 | A′: FX-included grace samples due/today and adds `0n`; income addend unchanged same day | ✓ VERIFIED | `primaryMinor = kind === "grace" ? 0n : display`; same-day income+grace expects `1_100_000n` |
| 8 | Grace-only horizon still yields non-empty flat forecast points | ✓ VERIFIED | vitest «grace-only horizon → non-empty flat points (D-07)» |
| 9 | Missing FX excludes grace slot; unique alphabetical `excludedMissingFxCurrencies` | ✓ VERIFIED | vitest EUR/USD unique sorted; Set→sort in builder |
| 10 | All-FX-excluded → empty points, `isPartialForecast` true, full code list retained | ✓ VERIFIED | same FX miss test: `points []`, codes `["EUR","USD"]`, `includedSlotCount 0` |
| 11 | Капитал `/` RSC loads OPEN grace with account currency/name and passes `forecastGrace` | ✓ VERIFIED | `page.tsx` Prisma OPEN select + `forecastGrace={{ obligations: ... }}` |
| 12 | DashboardChartsShell merges income + grace into one `buildNetWorthForecastSeries` call | ✓ VERIFIED | shell concat `slots: [...openSlots, ...graceSlots]` single call |
| 13 | `showForecast` true when FX-included grace exists even if cumulative NW flat | ✓ VERIFIED | `showForecast = includedSlotCount > 0`; D-07 unit proves included grace with flat NW |
| 14 | One quiet banner: «Прогноз неполный · нет курса {CODES}» unique alpha across income+grace | ✓ VERIFIED | shell banner + `excludedMissingFxCurrencies.join(", ")`; UI file-scan |
| 15 | All slots FX-excluded: Line hidden (`includedSlotCount===0`) but banner still shows codes | ✓ VERIFIED | `showForecast` vs `showPartialBanner` independent; builder empty points + codes |
| 16 | `mergeFactAndForecast` attaches `forecastEvents` onto chart points for today + future samples | ✓ VERIFIED | merge copies `fp.forecastEvents`; builder emits events on converted slots |
| 17 | No income/grace kind tags in banner — currency codes only | ✓ VERIFIED | UI scan `not.toMatch(/доходы\|грейс/)`; banner uses codes only |
| 18 | Empty forecast (no income/grace slots, no FX exclusions): hide «Прогноз» Line; fact unchanged | ✓ VERIFIED | `includedSlotCount===0` → `showForecast false`; merge returns fact |
| 19 | Loading: RSC + client `useMemo` merge — no grace-specific skeleton | ✓ VERIFIED | no grace skeleton in shell/chart sources |
| 20 | Page load error: existing `/` failure path unchanged — no new forecast-specific error chrome | ✓ VERIFIED | existing catch «Не удалось загрузить данные…» only |
| 21 | Long missing-code list wraps inside muted `p-4` banner without ellipsis | ⚠️ insufficient_spec | `verification: backstop` — `p-4` present; wrap/ellipsis not proven |
| 22 | One dashed «Прогноз» Line only — no on-line grace vs income distinction | ✓ VERIFIED | single `strokeDasharray="5 5"` Line; UI scan; no second Line/Area for grace |
| 23 | Future tooltip: aggregate «Прогноз» first, then grace block with C-04 RU | ✓ VERIFIED | `asOfDate > today` branch + `ForecastGraceTooltipBlock`; C-04 strings file-scan |
| 24 | Today tooltip: account stack + «Итого», then same grace block for folded/today events | ✓ VERIFIED | today branch stack/`Итого` + grace block; fold events on today via membership |
| 25 | Grace block shows obligation amount (primary after FX) even though ΔNW=0; one row per OPEN | ✓ VERIFIED | `displayPrimaryMajor` on events; map one row per grace event |
| 26 | FX-excluded grace omitted from tooltip — honesty is banner only | ✓ VERIFIED | events only pushed after FX gate; excluded slots `continue` without event |
| 27 | 0 grace events that day → omit grace block | ✓ VERIFIED | `ForecastGraceTooltipBlock` returns null when no `kind==="grace"` |
| 28 | Long account names in grace rows wrap via tooltip flex / `min-w-40` | ⚠️ insufficient_spec | `verification: backstop` — `break-words`/`min-w-40` present; visual wrap unproven |

**Score:** 26/28 truths verified (0 present, behavior-unverified; 2 backstop abstentions)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `src/lib/nw-forecast.test.ts` | Wave 0 + A′/fold/FX/grace-only coverage | ✓ VERIFIED | Substantive grace describe; 54-suite green |
| `src/components/dashboard/nw-forecast-ui.test.ts` | Banner codes + tooltip RU file-scan | ✓ VERIFIED | Plan 02/03 describes green; no skips |
| `src/lib/credit-grace.ts` | `openGraceForecastMembership` OPEN→sampleAsOf | ✓ VERIFIED | ~lines 292–325; no nw-forecast import |
| `src/lib/credit-grace.test.ts` | Membership + GRISO isolation | ✓ VERIFIED | fold/CLOSED/horizon + GRISO scan |
| `src/lib/nw-forecast.ts` | Kind-aware slots, 0-addend grace, FX codes | ✓ VERIFIED | 235 lines; import wall dates/locf/money |
| `src/app/page.tsx` | OPEN load + `forecastGrace` serialization | ✓ VERIFIED | OPEN query; props wired; NW path separate |
| `src/components/dashboard/DashboardChartsShell.tsx` | Merge, banner codes, forecastEvents | ✓ VERIFIED | membership→slots→builder→banner |
| `src/components/dashboard/NetWorthHistoryChart.tsx` | Two-block tooltip + single dashed Line | ✓ VERIFIED | C-04 block; one `strokeDasharray` Line |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `openGraceForecastMembership` | `ForecastSlot` kind grace | shell maps membership → slots | ✓ WIRED | DashboardChartsShell `.map` → `kind: "grace"` |
| `buildNetWorthForecastSeries` | `excludedMissingFxCurrencies` | FX miss Set→sort | ✓ WIRED | returned + shell banner consume |
| grace converted row | dateSet sample | `0n` addend still `dateSet.add` | ✓ WIRED | converted push then dateSet from converted |
| `page.tsx` OPEN query | `forecastGrace` prop | string minors across RSC | ✓ WIRED | `amountMinor.toString()` |
| membership | `buildNetWorthForecastSeries` slots | kind grace concat income | ✓ WIRED | single builder call |
| `excludedMissingFxCurrencies` | partial banner | join after «нет курса» | ✓ WIRED | `missingFxCodes.join(", ")` |
| `NetWorthChartPoint.forecastEvents` | chart tooltip | `payload[0].payload` | ✓ WIRED | tooltip reads `point.forecastEvents` |
| grace tooltip heading | C-04 copy | locked RU strings | ✓ WIRED | «Платёж для беспроцентного» / «NW без изменения (оплата карты)» |

Note: `gsd_run query verify.key-links` reported invalid for PLAN paths (tool pattern quirk); manual Level-3 wiring checked above.

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| page → shell | `forecastGrace.obligations` | Prisma `creditGraceObligation` OPEN | Yes (DB) | ✓ FLOWING |
| shell → builder | grace `ForecastSlot[]` | membership helper + BigInt revive | Yes | ✓ FLOWING |
| builder → points | `forecast` / `forecastEvents` | LOCF FX + cumulative / metadata | Yes (rates Map) | ✓ FLOWING |
| shell → banner | `excludedMissingFxCurrencies` | builder miss Set | Yes when FX miss | ✓ FLOWING |
| chart tooltip | grace rows | `forecastEvents` filtered `kind==="grace"` | Yes when included | ✓ FLOWING |
| historical NW | — | `computeNetWorthRows` only | Grace not injected | ✓ ISOLATED |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Phase math+UI+membership suites | `npx vitest run src/lib/nw-forecast.test.ts src/lib/credit-grace.test.ts src/components/dashboard/nw-forecast-ui.test.ts` | PASS 54 FAIL 0 | ✓ PASS |
| GRISO: no credit-grace in historical modules | `grep credit-grace net-worth.ts historical-series.ts` | no matches | ✓ PASS |
| nw-forecast import wall (no credit-grace) | grep imports in `nw-forecast.ts` | dates/locf/money only | ✓ PASS |
| Single dashed Line | `grep -c strokeDasharray NetWorthHistoryChart.tsx` | 1 | ✓ PASS |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No phase-declared / conventional probes | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| GRFCST-01 | 21-01, 21-02, 21-03 | On Капитал `/`, «Прогноз» includes open credit grace from due dates | ✓ SATISFIED | OPEN load → membership → A′ slots → single series → tooltip chrome (human feel pending) |
| GRFCST-02 | 21-01, 21-02 | Forecast credit slots use FX LOCF honesty (partial banner when rate missing) | ✓ SATISFIED | exclude+codes builder; banner join; never invent (human wrap backstop pending) |

Orphaned requirements for Phase 21: none (only GRFCST-01/02 mapped).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `src/lib/nw-forecast.test.ts` | ~465–468 | CLOSED «test» is type-level only (`kinds.not.toContain("CLOSED")`) | ⚠️ Warning | Real CLOSED exclusion covered in `credit-grace.test.ts` + page OPEN filter — not a goal blocker |
| — | — | TBD/FIXME/XXX in phase files | none | — |
| — | — | leftover it.todo/describe.skip | none | — |

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| `src/lib/nw-forecast.test.ts` | GRFCST-01/02 | yes | 0 | no | Value/behavioral (ΔNW, codes, flat) | PASS |
| `src/lib/credit-grace.test.ts` | GRFCST-01 | yes | 0 | no | Value (fold/CLOSED/horizon) | PASS |
| `src/components/dashboard/nw-forecast-ui.test.ts` | GRFCST-01/02 | yes | 0 | no | Existence/string (file-scan) | WARNING — chrome presence only; Plan 03 human-check owns feel |

**Disabled tests on requirements:** 0
**Circular patterns detected:** 0
**Insufficient assertions:** UI file-scan only (expected; mitigated by human-check)

### Decision Coverage

All trackable CONTEXT.md decisions honored by shipped artifacts (18/18). Gate non-blocking.

### Prohibitions (judgment / isolation)

| Prohibition | Evidence | Verdict |
| ----------- | -------- | ------- |
| MUST NOT signed negative grace NW dip | grace addend `0n`; same-day income-only NW | code-verified (judgment soft-flag ok) |
| MUST NOT invent FX / rate 1 on miss | null LOCF → exclude | code-verified |
| MUST NOT import credit-grace into nw-forecast / net-worth / historical-series | grep clean | code-verified |
| MUST NOT write BalanceSnapshot / change historical LOCF builders | no BalanceSnapshot writes in phase paths | code-verified |
| MUST NOT second series / warning colors for grace | one dashed Line; muted-foreground only | code-verified |
| MUST NOT feed CLOSED into forecastGrace | OPEN query + membership filter | code-verified |
| MUST NOT aggregate same-day OPEN into one tooltip line | map per grace event | code-verified |

unverified-prohibition — human review recommended for judgment-tier items during UAT (no silent pass).

### Human Verification Required

### 1. Tooltip two-block feel (Plan 03)

**Test:** On Капитал `/`, hover today (folded overdue if any) and a future due day with income+grace — one dashed «Прогноз»; tooltip shows forecast/fact block then grace block with C-04 copy; partial banner lists FX codes when rates missing.
**Expected:** Readable two-block chrome; single dashed series; banner honesty when FX missing.
**Why human:** Subjective layout/tooltip feel; file-scan cannot judge readability.

### 2. Long missing-code banner wrap (backstop)

**Test:** Arrange multiple missing FX currencies so banner lists a long code string.
**Expected:** Wraps inside muted `p-4` card; no ellipsis truncation of codes.
**Why human:** `verification: backstop` — overflow not inferable.

### 3. Long account name wrap (backstop)

**Test:** OPEN grace with long account name; open tooltip on sample day.
**Expected:** Name wraps via `break-words` / `min-w-40`; amount stays readable.
**Why human:** `verification: backstop` — visual wrap unproven.

### Gaps Summary

No blocking implementation gaps. Goal-path artifacts exist, are substantive, wired, and data-flowing; GRFCST-01/02 automated evidence green. Status is `human_needed` solely for end-of-phase UAT (Plan 03 human-check) plus two UI-SPEC backstop wrap checks — not for missing code.

---

_Verified: 2026-09-09T20:46:17Z_
_Verifier: Claude (gsd-verifier)_
