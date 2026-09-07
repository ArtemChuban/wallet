---
phase: "17"
slug: "nw-forecast-overlay-isolation"
status: verified
threats_open: 0
asvs_level: 1
created: "2026-09-07"
---

# Phase 17 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| RSC page → shell | Income defs/actuals + NW anchor preload | Serializable forecast membership only — not into past LOCF |
| Shell → nw-forecast | Open planned slots filtered client-side | FX LOCF @ today; null rate → exclude |
| Chart chrome | ComposedChart Line / ReferenceLine / tooltip | Visual forecast-vs-fact boundary |
| Income actions | Local Prisma mutations | Must never write BalanceSnapshot |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-17-01 | Tampering | income → NW history / BalanceSnapshot | high | mitigate | INISO file-scan + past-series identity; actions write-gate; chart merge only | closed |
| T-17-02 | Tampering | invented FX in overlay | high | mitigate | locfRateAsOf @ today; null → exclude + isPartialForecast + banner; vitest FX cases | closed |
| T-17-03 | Elevation of privilege (UX) | chart-as-fact | high | mitigate | Dashed Line + «Прогноз» legend + ReferenceLine; future tooltip without fake stacks; Orca UAT pass | closed |
| T-17-04 | Tampering | nw-forecast.ts coupling | high | mitigate | Import wall money/locf/dates only; INISO file-scan | closed |
| T-17-05 | Info disclosure | new endpoints | low | accept | No new public API; RSC same local trust model | closed |
| T-17-06 | Repudiation | stale FCST-01 docs | medium | mitigate | REQUIREMENTS/ROADMAP/STATE D-01 wording synced (Plan 02) | closed |
| T-17-07 | Spoofing | English/forecast-as-fact copy | medium | mitigate | RU «Прогноз» only; solid Area reserved for fact stacks | closed |
| T-17-SC | Tampering | npm installs | high | mitigate | Zero new packages this phase | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-17-01 | T-17-05 | No new network surface; local-first RSC same as prior phases | plan disposition accept | 2026-09-07 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-07 | 8 | 8 | 0 | agent (verify-work verify:post / ASVS L1 short-circuit) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-07
