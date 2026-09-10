---
phase: "21"
slug: "kapital-forecast-integration"
status: verified
threats_open: 0
asvs_level: 1
created: "2026-09-09"
---

# Phase 21 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Built at verify:post from PLAN threat models (register_authored_at_plan_time: true, ASVS L1).

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Prisma OPEN grace → Капитал `/` RSC | Obligation amount/name/currency for overlay only | `forecastGrace` prop — never NW rows |
| Builder FX LOCF → shell banner/tooltip | Missing rates exclude slots; codes to banner | `excludedMissingFxCurrencies` / `forecastEvents` |
| Chart tooltip → DOM | Account names + amounts as React text | No HTML injection APIs |
| Grace libs → BalanceSnapshot / NW history | Must stay disconnected (GRISO) | Import wall + vitest scan |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-21-01 | Tampering | buildNetWorthForecastSeries FX gate | high | mitigate | `locfRateAsOf` null → exclude + record currency; never invent rate | closed |
| T-21-02 | Tampering | Grace leaking into NW / historical-series | high | mitigate | Import wall on `nw-forecast`; GRISO scan; no BalanceSnapshot APIs | closed |
| T-21-03 | Information Disclosure | Over-broad CLOSED obligation data | medium | mitigate | `openGraceForecastMembership` OPEN-only | closed |
| T-21-04 | Spoofing | Spoofed sampleAsOf past due | low | accept | Single-user local; membership from dueAsOf+today | closed |
| T-21-05 | Tampering | Shell/builder FX path | high | mitigate | Shell calls builder; banner codes from builder meta; no invent | closed |
| T-21-06 | Tampering | page.tsx NW path | high | mitigate | Grace via `forecastGrace` only; `computeNetWorthRows` unchanged | closed |
| T-21-07 | Information Disclosure | CLOSED over-fetch on `/` | medium | mitigate | `where: { status: "OPEN" }` | closed |
| T-21-08 | Tampering | XSS via accountName in forecastEvents | low | accept | React text nodes; no `dangerouslySetInnerHTML` | closed |
| T-21-09 | Tampering | Tooltip accountName / amounts | low | accept | Text nodes / `formatChartNumber` only | closed |
| T-21-10 | Information Disclosure | FX-excluded grace in tooltip | medium | mitigate | Events only after FX gate; banner owns honesty | closed |
| T-21-11 | Tampering | Second series implying historical change | high | mitigate | Single dashed «Прогноз» Line | closed |
| T-21-SC | Tampering | npm installs | high | mitigate | Zero new packages this phase | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above `workflow.security_block_on` (high) count toward threats_open*
*Disposition: mitigate · accept · transfer*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-21-01 | T-21-04 | Local single-user wallet; sampleAsOf recomputed from dueAsOf+today in helper | plan disposition | 2026-09-09 |
| AR-21-02 | T-21-08 | React text rendering; no HTML injection APIs in dashboard tooltip path | plan disposition | 2026-09-09 |
| AR-21-03 | T-21-09 | Tooltip accountName/amounts are text nodes only | plan disposition | 2026-09-09 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-09 | 12 | 12 | 0 | verify-work / secure-phase L1 |

Evidence: gsd-security-auditor SECURED — FX exclude paths in `nw-forecast.ts`, OPEN filters in page+membership, single dashed Line, GRISO scans, no new packages.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-09
