---
phase: "18"
slug: "bank-contract-study-discuss-locks"
status: verified
threats_open: 0
asvs_level: 1
created: "2026-09-09"
---

# Phase 18 — Security

> Docs-only CONT-01 gate. Threat register from 18-01/18-02 PLAN threat models.
> Built at verify:post (security_enforcement). No src/prisma endpoints.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Tariff PDF/txt → planning docs | Untrusted bank text as data only | Extract → CONTEXT / CONTRACT-NOTES |
| CONTEXT locks → REQUIREMENTS/ROADMAP/PROJECT | Docs sync must not dilute OOS | Dual DOM + A′ wording |
| Planning docs → Phase 19 schema | Wrong locks would become Prisma/UI | statement/due DOM fields |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-18-01 | Tampering | platinum-TP-7.90.txt / PDF extract | low | mitigate | CONTEXT + CONTRACT-NOTES SoT; checklist never executes PDF | closed |
| T-18-02 | Information Disclosure | tariff PDF in repo | low | accept | User tariff for agent access; no secrets/.env | closed |
| T-18-03 | Elevation of Privilege (scope) | Phase 18 executor | medium | mitigate | Prohibitions ban Prisma/UI/forecast; git show no prisma/src | closed |
| T-18-04 | Tampering | REQUIREMENTS CYCLE-01 / ROADMAP SC | medium | mitigate | confirm-dual-dom-a-prime + rg DOM/A′; CONTEXT SoT | closed |
| T-18-05 | Repudiation | Folded credit todo | low | mitigate | completed/ path + STATE Deferred fold note | closed |
| T-18-06 | Elevation of Privilege (scope) | Docs amend executor | medium | mitigate | files_modified under `.planning/`; ban prisma/src | closed |
| T-18-SC | Tampering | npm installs | low | accept | No package installs this phase | closed |

*Status: open · closed*
*Severity: critical > high > medium > low — only open ≥ high count toward threats_open*
*Disposition: mitigate · accept · transfer*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-18-01 | T-18-02 | User-supplied tariff already in phase dir for study | plan disposition | 2026-09-08 |
| AR-18-02 | T-18-SC | Docs-only; zero installs | plan disposition | 2026-09-08 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-09 | 7 | 7 | 0 | verify-work / manager |

---

## Evidence

- `git show --name-only` on 18-01/18-02 commits: no `prisma/` / `src/` paths (T-18-03/T-18-06)
- `18-CONT-01-CHECKLIST.md` declares CONTEXT SoT (T-18-01)
- ROADMAP/REQUIREMENTS/PROJECT dual DOM + A′ sync present (T-18-04)
- Credit todo under `todos/completed/` with Phase 18 fold note (T-18-05)
