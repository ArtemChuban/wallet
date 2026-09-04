---
phase: 06-historical-charts
verified: 2026-09-04T13:07:00Z
status: passed
score: 10/10 must-haves verified
behavior_unverified: 0
overrides_applied: 0
decision_coverage:
  honored: 16
  total: 16
  not_honored: []
mvp_note: "ROADMAP Phase 6 goal is not user-story shaped (user-story.validate=false). User Flow Coverage uses PLAN user story from 06-01/02/03-PLAN.md. Recommend /gsd mvp-phase 6 to align ROADMAP goal wording."
re_verification:
  previous_status: passed
  previous_score: 10/10
  previous_verified: 2026-09-03T23:28:56Z
  reason: "Stale after 06-01-SUMMARY recommit and Phase 07 feat(07-02) rewire of historical-series onto shared @/lib/locf wrappers"
  gaps_closed: []
  gaps_remaining: []
  regressions: []
  phase07_locf_rewire: "8b51864 feat(07-02): rewire historical-series onto shared locf — local helpers deleted; import locfAmountAsOf/locfRateAsOf from @/lib/locf (pickLatestAsOf). CHART-03 later-FX + full historical-series/dates/locf suites still PASS."
---

# Phase 6: Historical Charts Verification Report

**Phase Goal:** User can trust historical net-worth and per-account charts built from as-of balances and as-of FX
**Verified:** 2026-09-04T13:07:00Z
**Status:** passed
**Re-verification:** Yes — after SUMMARY recommit + Phase 07 shared LOCF rewire (no prior `gaps:`; full goal-backward re-check)
**Mode:** mvp (ROADMAP); PLAN user story used for flow coverage (see mvp_note)

## User Flow Coverage

User story (from PLAN): «As a local Wallet user, I want to trust historical net-worth and per-account charts built from as-of balances and as-of FX, so that capital history stays honest when rates change.»

| Step | Expected | Evidence | Status |
|------|----------|----------|--------|
| Open `/` with accounts | Hero «Капитал», Период presets, NW chart, account list | `page.tsx` hero → partial banner → `DashboardChartsShell` (range + NW + list) | ✓ |
| Change period | NW series recomputes for 30д/90д/1г/всё | `DashboardChartsShell` `useState("30d")` + `buildNetWorthSeries` on `range` | ✓ |
| Expand account | Chart-only body; no set/delete | `DashboardAccountList` expand → `AccountHistoryChart` only in `bg-muted/40` | ✓ |
| Toggle / credit | Native↔primary; credit stack долг/доступно | `AccountHistoryChart` toggle + Area `stackId="credit"`; `buildAccountSeries` credit path | ✓ |
| Outcome | Capital history honest when rates change | Shared `locfRateAsOf` per sample date; CHART-03 unit test mid-point ignores later FX | ✓ |

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | User can see a historical net-worth chart in the primary currency | ✓ VERIFIED | `page.tsx` mounts `DashboardChartsShell` → `NetWorthHistoryChart` Area stack from primary contributions (`stacks` / `nw`); `h-[200px]` ChartContainer |
| 2 | User can see a historical balance chart for an individual account | ✓ VERIFIED | Expand hosts `AccountHistoryChart`; `buildAccountSeries` → Line (non-credit) or stacked Areas (credit) |
| 3 | Each chart point uses balance as of that date × FX as of that date | ✓ VERIFIED | `buildNetWorthSeries` / `buildAccountSeries` call shared `@/lib/locf` `locfAmountAsOf` + `locfRateAsOf` then `computeNetWorthRows` / `convertOtherMinorToPrimaryMinor` per sample date |
| 4 | Changing today’s FX does not rewrite earlier chart points that used a prior rate | ✓ VERIFIED | Behavioral: `vitest -t "past NW point ignores a later FX change"` PASS after Phase 07 LOCF rewire — mid-date `totalPrimaryMinor` stays at earlier rate |
| 5 | Shared range presets are 30д 90д 1г всё, default 30д, group Период | ✓ VERIFIED | `DashboardRangeControl.tsx` labels + `aria-label="Период"`; shell `useState<RangePreset>("30d")` |
| 6 | Sample dates are event∪today (not densified calendar days) | ✓ VERIFIED | Builder unions snapshot/FX/today; test `series length equals distinct event∪today… (D-07)` PASS |
| 7 | Expand is chart-only; aria Показать/Скрыть график счёта; no mutations on `/` | ✓ VERIFIED | Expand body only `AccountHistoryChart`; no Server Actions in dashboard chart files; aria labels present |
| 8 | Credit charts stack долг + доступно; primary converts both; null FX skipped | ✓ VERIFIED | `creditDebtMinor` in `buildAccountSeries`; tests D-11/D-12/D-16 PASS; UI `stackId="credit"`, labels долг/доступно |
| 9 | Empty window = axes only; single point = dots; zero accounts omits chart section | ✓ VERIFIED | Y domain `[0,1]` when empty; `dot={data.length <= 1}`; `page.tsx` shell only when `hasAccounts` |
| 10 | Client chart path stays Prisma-free; demo seed available | ✓ VERIFIED | `historical-series` imports `@/lib/locf` + `@/lib/money` + `@/lib/dates` (client-safe); no Prisma in chart tree; `npm run db:seed` → `prisma/seed.ts` |

**Score:** 10/10 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `src/lib/dates.ts` | window helpers / RangePreset | ✓ VERIFIED | `windowStartForPreset`, `addCalendarDays`; client-safe |
| `src/lib/locf.ts` | shared LOCF wrappers (Phase 07) | ✓ VERIFIED | `pickLatestAsOf` + `locfAmountAsOf` / `locfRateAsOf`; used by historical-series |
| `src/lib/historical-series.ts` | NW + account LOCF builders | ✓ VERIFIED | 299 lines; imports shared locf; `buildNetWorthSeries` + `buildAccountSeries` + credit stack |
| `src/lib/historical-series.test.ts` | CHART-01/02/03 coverage | ✓ VERIFIED | 509 lines; later-FX, D-07, D-14, D-16, credit stack |
| `src/components/ui/chart.tsx` | shadcn Chart primitives | ✓ VERIFIED | Present; recharts@3.10.1 |
| `src/components/dashboard/NetWorthHistoryChart.tsx` | NW history chart | ✓ VERIFIED | Stacked Areas by account; empty/single-point contracts |
| `src/components/dashboard/DashboardChartsShell.tsx` | shared range + revive | ✓ VERIFIED | BigInt revive; hosts NW + list |
| `src/components/dashboard/DashboardRangeControl.tsx` | Russian presets | ✓ VERIFIED | 30д/90д/1г/всё + Период |
| `src/components/dashboard/AccountHistoryChart.tsx` | per-account chart | ✓ VERIFIED | Line + credit Area + toggle |
| `src/components/dashboard/DashboardAccountList.tsx` | expand chrome | ✓ VERIFIED | Chart-only expand; shared `range` |
| `src/app/page.tsx` | serialize + layout | ✓ VERIFIED | String minors; hero → shell → list |
| `prisma/seed.ts` | demo seed | ✓ VERIFIED | `db:seed` wired in package.json |

gsd `verify.artifacts` — 06-01: 8/8, 06-02: 4/4, 06-03: 3/3 all_passed.

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `historical-series.ts` | `@/lib/locf` | `locfAmountAsOf` / `locfRateAsOf` | ✓ WIRED | Phase 07 rewire; codegraph callees confirm |
| `historical-series.ts` | `computeNetWorthRows` | per-date LOCF inputs | ✓ WIRED | codegraph callees + source |
| `page.tsx` | `DashboardChartsShell` | serialized payloads | ✓ WIRED | strings for minors; no BigInt across RSC |
| `DashboardChartsShell` | `buildNetWorthSeries` | range change | ✓ WIRED | `useMemo` on `range` |
| `DashboardChartsShell` | `DashboardAccountList` | `range` prop D-08 | ✓ WIRED | list inside shell with shared preset |
| `DashboardAccountList` | `AccountHistoryChart` | expand body | ✓ WIRED | only child in expand panel |
| `AccountHistoryChart` | `buildAccountSeries` | mode + range | ✓ WIRED | codegraph callers |
| `buildAccountSeries` | `creditDebtMinor` | credit stack | ✓ WIRED | import from `@/lib/money` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `page.tsx` | snapshots / rates | `prisma.balanceSnapshot` / `prisma.fxRate` | Yes | ✓ FLOWING |
| `DashboardChartsShell` | points | revive strings → BigInt → `buildNetWorthSeries` | Yes | ✓ FLOWING |
| LOCF per sample | amount / rate | shared `locfAmountAsOf` / `locfRateAsOf` | Yes | ✓ FLOWING |
| `AccountHistoryChart` | series | same revived arrays + `buildAccountSeries` | Yes | ✓ FLOWING |
| Chart Y majors | `nw` / `value` / debt·available | `minorToMajorNumber(...)` at lib boundary | Yes (lib keeps BigInt) | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| CHART-03 later FX | `npx vitest run -t "past NW point ignores a later FX change"` | 1 passed | ✓ PASS |
| D-16 null FX skip | focused `-t` filter in suite | covered in full suite | ✓ PASS |
| Series + dates + locf | `npx vitest run src/lib/historical-series.test.ts src/lib/dates.test.ts src/lib/locf.test.ts` | 31 passed | ✓ PASS |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No phase probes declared | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| CHART-01 | 01, 03 | Historical NW chart in primary | ✓ SATISFIED | Shell + NetWorthHistoryChart on `/` |
| CHART-02 | 02, 03 | Per-account history chart | ✓ SATISFIED | Expand + AccountHistoryChart (+ credit stack) |
| CHART-03 | 01–03 | As-of balance × as-of FX | ✓ SATISFIED | Shared LOCF builders + later-FX unit test post-07 rewire |

Orphaned requirements for Phase 6: none (CHART-01–03 only).

### Decision Coverage

All trackable CONTEXT.md decisions honored by shipped artifacts (16/16). `gsd_run query check.decision-coverage-verify` — not_honored: [].

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| `historical-series.test.ts` | CHART-01/02/03 | yes | 0 | no | Value (BigInt totals, skip counts) | PASS |
| `dates.test.ts` | window presets | yes | 0 | no | Value | PASS |
| `locf.test.ts` | LOCF-01/shared path | yes | 0 | no | Value | PASS |

**Disabled tests on requirements:** 0
**Circular patterns detected:** 0
**Insufficient assertions:** 0

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `src/components/ui/chart.tsx` | ~95 | `dangerouslySetInnerHTML` in ChartStyle | ℹ️ Info | Theme CSS vars only (shadcn); not tooltip/DB strings — prohibition on tooltip/label XSS still held |

No TBD/FIXME/XXX/TODO debt markers in phase chart / historical-series / locf files.

### Prohibitions

| Statement | Status | Evidence |
|-----------|--------|----------|
| MUST NOT densify to one point per calendar day | honored | D-07 test + sparse dateSet |
| MUST NOT apply today's FX to past points | honored | CHART-03 later-FX test (post-07) |
| MUST NOT mark NW points partial | honored | D-14 test |
| MUST NOT add `/history` or `/charts` route | honored | charts on `/` only |
| MUST NOT add chart Server Actions on `/` | honored | dashboard chart tree read-only client |
| MUST NOT use dangerouslySetInnerHTML in tooltips/labels | honored | tooltips React text; ChartStyle CSS-only |
| MUST NOT invent primary points when FX null | honored | D-16 skip |
| MUST NOT use connectNulls true | honored | `connectNulls={false}` on Line/Area |
| MUST NOT plot assets vs liabilities (NW-04) | honored | no A/L breakdown |
| MUST NOT show empty-state copy overlay | honored | axes-only empty path |
| MUST NOT stack debt-only in primary credit | honored | D-12 converts both segments |

### Human Verification Required

N/A for new items — Plan 06-03 Task 3 human-verify **already PASSED** (Russian UI charts smoke on `/`). Phase 07 LOCF rewire is pure semantics consolidation; unit suite regression-checked. No additional Step 8 items for this re-verify.

### Phase 07 impact check

| Change | Risk to Phase 6 goal | Outcome |
|--------|---------------------|---------|
| Delete local LOCF helpers in `historical-series.ts` | CHART-03 semantics drift | Shared `@/lib/locf` same `asOfDate <= D` pick; CHART-03 + 31 tests PASS |
| Downstream consumers still call `buildNetWorthSeries` / `buildAccountSeries` | Wiring break | codegraph callers: shell + AccountHistoryChart unchanged |

### Gaps Summary

None. Phase goal still achieved after Phase 07 LOCF consolidation: as-of LOCF NW and per-account charts on `/`, CHART-01–03 covered by wiring + unit behavior.

---

_Verified: 2026-09-04T13:07:00Z_
_Verifier: Claude (gsd-verifier)_
