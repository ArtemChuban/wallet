---
phase: "22"
slug: "graceiso-regression-polish"
status: verified
threats_open: 0
asvs_level: 1
created: "2026-09-10"
---

# Phase 22 — Security

> GRACEISO regression walls + REQUIREMENTS hygiene. Threat register from 22-01/02 PLAN threat models.
> Built at verify:post (security_enforcement) after UAT. ASVS L1 — register authored at plan time.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Grace FormData → accounts actions | Untrusted mutations; must not reach BalanceSnapshot | create/update/close/reopen/schedule |
| Test suite → production NW libs | Regression walls only | file-scan + golden identity |
| Overlay (nw-forecast) ↔ historical LOCF | Soft boundary; no import coupling | INISO bans |
| Planning docs ↔ shipped evidence | Checkbox must not claim Complete without green suite | GRISO-01 |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-22-01 | Tampering | Five grace mutations | high | mitigate | never-calls on balanceSnapshot upsert/delete (D-04); actions.test.ts | closed |
| T-22-02 | Tampering | net-worth / historical-series | high | mitigate | griso.test.ts bans credit-grace + nw-forecast; golden identity D-09 | closed |
| T-22-03 | Tampering | credit-grace.ts | medium | mitigate | D-07 self-wall — no prisma / net-worth / historical-series imports | closed |
| T-22-04 | Information Disclosure | nw-forecast.ts | medium | mitigate | INISO prisma/BalanceSnapshot/history bans (D-06) | closed |
| T-22-05 | Denial of Service | accounts BAL UX | low | accept | D-08 scopes walls to grace paths only | closed |
| T-22-06 | Spoofing | REQUIREMENTS GRISO-01 checkbox | medium | mitigate | Hygiene after 22-01 green; suite re-run at UAT | closed |
| T-22-SC | Tampering | npm installs | high | mitigate | No new packages (22-01); docs-only 22-02 | closed |

*Status: open · closed*
*Severity: critical > high > medium > low — only open ≥ high count toward threats_open*

---

## Evidence (verify:post 2026-09-10)

- `npx vitest run griso iniso nw-forecast credit-grace nw-forecast-ui accounts/actions` → PASS 113/0
- REQUIREMENTS GRISO-01 checked + Complete; ROADMAP Phase 22 Complete
