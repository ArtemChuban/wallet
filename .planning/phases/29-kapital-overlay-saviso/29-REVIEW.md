---
phase: 29-kapital-overlay-saviso
reviewed: 2026-09-21T16:35:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - src/lib/nw-forecast.ts
  - src/app/page.tsx
  - src/components/dashboard/DashboardChartsShell.tsx
  - src/components/dashboard/NetWorthHistoryChart.tsx
  - src/lib/saviso.test.ts
  - src/lib/nw-forecast.test.ts
  - src/components/dashboard/nw-forecast-ui.test.ts
findings:
  critical: 0
  warning: 1
  info: 3
  total: 4
status: issues_found
---

# Phase 29: Code Review Report

**Reviewed:** 2026-09-21T16:35:00Z
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Phase 29 wires SAVINGS interest into Капитал overlay and flips grace `forecastDeltaMinor` to `-displayPrimaryMinor` (D-11). Builder math, shell concat (`income → interest → grace`), page `forecastSavings` LOCF adapter, and future tooltip copy/signs match CONTEXT. SAVISO isolation (no snapshot mutators; historical builder untouched) holds. Unit suites green (56 incl. MCP serialize).

codegraph blast radius: `buildNetWorthForecastSeries` → `DashboardChartsShell`, `loadForecastOverlay` (MCP). Shared builder now dips grace for MCP numbers too; MCP tool copy still says «A′» — deferred C-05/Phase 30, not filed as fix-here finding.

One real UX hole: today hinge tooltip still shows fact `Итого` while dashed already includes grace dip.

## Narrative Findings (AI reviewer)

## Warnings

### WR-01: Today tooltip omits dipped Прогноз after D-11

**File:** `src/components/dashboard/NetWorthHistoryChart.tsx:175-224`
**Issue:** Future branch (`asOfDate > today`) shows unsigned Прогноз **level** (already interest↑ / grace↓) then detail rows. Today branch shows stack + fact `Итого` + grace `−payment` only — never `point.forecast`. After D-11, today sample’s dashed value is `anchor − grace` while `Итого` stays undipped LOCF. Old «NW без изменения» made that OK; new minus subtitle implies NW moves, but aggregate shown does not. Hover today with OPEN grace: dashed ≠ `Итого`, no Прогноз figure to reconcile.
**Fix:** When today point has a finite `forecast`, show a Прогноз level row (same formatter as future, no plus) before/after `Итого`, then grace block:

```tsx
{typeof point?.forecast === "number" && !Number.isNaN(point.forecast) ? (
  <div className="flex w-full items-center gap-2">
    <span className="flex-1 text-muted-foreground">Прогноз</span>
    <span className="font-mono font-medium text-foreground tabular-nums">
      {formatChartNumber(point.forecast)}
    </span>
  </div>
) : null}
<ForecastGraceTooltipBlock events={forecastEvents} />
```

## Info

### IN-01: Stale «grace-only flat» comment

**File:** `src/components/dashboard/DashboardChartsShell.tsx:432`
**Issue:** Comment still says «grace-only flat still counts» — false after D-11 (grace dips).
**Fix:** Rewrite to «grace-only dipped series still counts» (or drop «flat»).

### IN-02: Interest row React key embeds float major

**File:** `src/components/dashboard/NetWorthHistoryChart.tsx:83`
**Issue:** `key={...-${ev.displayPrimaryMajor}}` uses JS number. Same-day uniqueness already covered by `parentId`; float in keys is brittle if majors ever collide/noise.
**Fix:** Prefer `key={String(ev.parentId)}` (one interest row per account per day) or `plannedAmountMinor` if added to `ForecastEvent`.

### IN-03: UI chrome tests are file-scan only

**File:** `src/components/dashboard/nw-forecast-ui.test.ts:67-129`
**Issue:** Phase-29 tooltip/sort/sign locks are source regex, not render. Refactors can keep strings and break runtime order/sign. Acceptable Wave-0 pattern; weak regression net for D-02/D-08/D-09.
**Fix:** Optional RTL/render assert: sorted interest names, `+`/`−` prefixes, future block order.

---

_Reviewed: 2026-09-21T16:35:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
