---
phase: "29"
slug: "kapital-overlay-saviso"
status: verified
threats_open: 0
asvs_level: 1
created: "2026-09-21"
---

# Phase 29 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Retroactive verify from PLAN threat models (29-01 + 29-02), ASVS L1, `block_on: high`.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| RSC page → client shell | SAVINGS rate/DOM/balance for interest enumerator | `forecastSavings` — string minors; no snapshot writes |
| Client slots → `buildNetWorthForecastSeries` | Currency codes + planned amounts untrusted until FX gate | `locfRateAsOf` miss → exclude + banner codes |
| Forecast display → snapshot store | Overlay must not post a balance | Import wall + saviso never-call scan |
| Wave 0 red contracts → Plan 29-02 | Wrong expects would lock flat grace or second rounding | Golden minors + INT-03 FX expects |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-29-01 | Tampering | page.tsx, nw-forecast.ts, DashboardChartsShell, saviso.test.ts | high | mitigate | No `balanceSnapshot.(create\|update\|upsert\|delete)` on forecast path; saviso scans those files + historical builders; `BuildNetWorthSeriesInput` keys stay accounts/snapshots/rates/primaryScale/preset/today (D-12 / SAVISO-01/02) | closed |
| T-29-02 | Tampering | `forecastDeltaMinor` grace arm + `mergeFactAndForecast` | high | mitigate | Grace returns `-displayPrimaryMinor`; event magnitude stays positive; merge copies `forecast` onto existing fact and does not write dipped value into `nw` (D-11) | closed |
| T-29-03 | Tampering | FX gate in nw-forecast.ts | high | mitigate | Non-primary slots use `locfRateAsOf(..., today)` + `convertOtherMinorToPrimaryMinor`; miss drops slot and appends currency code; no invented rate / no second rounding helper (INT-03) | closed |
| T-29-04 | Tampering | `listInterestSlotsInRange` inputs | medium | mitigate | Shell adapter is InterestAccountInput fields only (`accountId`, `accountName`, `balanceMinor`, `annualRateBps`, `accrualDayOfMonth`, currency…); income/grace slots concat after enumerator, never passed into it (C-04); UI scan locks wiring | closed |
| T-29-05 | Information Disclosure | tooltip rows | low | accept | One row per event scoped to accountId/accountName; React text nodes; local single-user dashboard; no new MCP read surface (deferred Phase 30) | closed |
| T-29-SC | Tampering | npm installs | high | mitigate | Zero new packages this phase; Vitest already local | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above `workflow.security_block_on` (high) count toward threats_open*
*Disposition: mitigate · accept · transfer*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-29-01 | T-29-05 | Local single-user dashboard; tooltip already scoped per event to accountId/accountName; sort display-only; no new agent read surface in this phase | plan disposition (29-02) | 2026-09-21 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-21 | 6 | 6 | 0 | gsd-security-auditor (retroactive / secure-phase L1) |

Evidence (L1 present-at-boundary):

| Threat | Evidence |
|--------|----------|
| T-29-01 | `src/lib/saviso.test.ts:24-33` never-call scan; `:70-81` builder key wall; `page.tsx` only `balanceSnapshot.findMany` |
| T-29-02 | `src/lib/nw-forecast.ts:81-90` grace negation; `DashboardChartsShell.tsx:156-195` merge sets `forecast` only on existing fact; `nw-forecast.test.ts:325-360` 1_000_000→950_000 dip |
| T-29-03 | `src/lib/nw-forecast.ts:159-170` null rate → exclude + code; `nw-forecast.test.ts:626-699` INT-03 expects |
| T-29-04 | `DashboardChartsShell.tsx:386-413` InterestAccountInput map then concat income/interest/grace; `nw-forecast-ui.test.ts:110-119` file-scan |
| T-29-05 | `NetWorthHistoryChart.tsx:63-95` / grace block — text nodes, no `dangerouslySetInnerHTML`; accepted AR-29-01 |
| T-29-SC | Phase commits touch forecast/UI/tests only; no `package.json` change in phase 29 |

### Unregistered Flags

None (29-02 SUMMARY `## Threat Flags`: none beyond plan model).

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-21
