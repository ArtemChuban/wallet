---
phase: "19"
slug: "schema-pure-grace-domain-math"
status: verified
threats_open: 0
asvs_level: 1
created: "2026-09-10"
---

# Phase 19 — Security

> Schema + pure grace math + Zod/action gates. Threat register from 19-01/02/03 PLAN threat models.
> Built at verify:post (security_enforcement) after UAT. ASVS L1 — register authored at plan time.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Schema/migration → SQLite | Dual DOM CHECKs + Cascade obligation FK | statementDayOfMonth / dueDayOfMonth |
| FormData / client → Server Action | Untrusted DOM ints and clear intent | updateGraceSchedule |
| Pure credit-grace helpers → callers | Untrusted DOM ints / date strings | cycle math only |
| Grace write path → snapshot ledger | Must not write BalanceSnapshot | Account DOM fields only |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-19-01 | Tampering | Dual DOM / CHECK / Zod | high | mitigate | Account_grace_dom_invariant + updateGraceScheduleSchema both-null-or-both 1–31; vitest green | closed |
| T-19-02 | Tampering | Obligation without schedule | medium | mitigate | D-13 documented in credit-grace validations; helpers empty without schedule | closed |
| T-19-03 | Tampering | Snapshot / NW coupling | high | mitigate | Pure lib; updateGraceSchedule Account-only; isolation smoke bans NW/historical imports | closed |
| T-19-04 | Elevation of Privilege | Cascade account delete | medium | accept | Locked D-15 — Cascade wipes obligations; RU chrome Phase 20 | closed |
| T-19-05 | Tampering | Duplicate cycle rows | medium | mitigate | @@unique([accountId, cycleStartAsOf]) (D-09) | closed |
| T-19-SC | Tampering | npm installs | high | mitigate | Zero new packages this phase | closed |

*Status: open · closed*
*Severity: critical > high > medium > low — only open ≥ high count toward threats_open*

---

## Evidence (verify:post 2026-09-10)

- `npx vitest run` credit-grace + foundation + account Zod + accounts/actions → pass
- `prisma migrate deploy` — no pending
- GRISO isolation smoke in credit-grace.test.ts (T-19-03)
