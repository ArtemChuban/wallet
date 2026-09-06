---
phase: "11"
slug: "charts-primary-totals"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-09-06"
---

# Phase 11 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser form → Server Action createDebt | Untrusted FormData including openedAsOf calendar string | openedAsOf, majors, direction, note |
| Browser edit form → updateDebtMeta | Untrusted FormData may smuggle openedAsOf | debtId, direction, dueDate, note |
| Client chart props → Recharts render | Serialized majors/dates from RSC; notes must not become HTML | chart series points, tooltip labels |
| SQLite FX + debts → RSC totals | Server-trusted DB reads; no client-supplied rates for aggregates | remainingMinor, LOCF rates |
| NW rows → Капитал banner list | Server-rendered account exclusion reasons; no new client input | excludeReason, account labels |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-11-01 | Tampering | createDebt / openedAsOf Zod | medium | mitigate | `asOfDateSchema` YYYY-MM-DD on `createDebtSchema` / `createDebtWithNewPersonSchema` (`src/lib/validations/debts.ts`) | closed |
| T-11-01 | Tampering | Totals inputs (Plan 03 reuse) | low | accept | Inputs built server-side from Prisma + LOCF; no FormData path into aggregates | closed |
| T-11-02 | Tampering | updateDebtMeta mass-assignment | high | mitigate | `updateDebtMetaSchema` omits `openedAsOf` + `.strict()`; action writes meta only; edit UI create-only date field (`DebtFormDialog`) | closed |
| T-11-03 | XSS | DebtPrincipalStackChart tooltip | medium | mitigate | Plain-text `DebtStackTooltip` labels (Погашено / Остаток); no `debt.note` HTML; no `dangerouslySetInnerHTML` | closed |
| T-11-04 | Information Disclosure | Excluded debt list | low | accept | Single-user local app; list shows person/currency already visible on /debts | closed |
| T-11-05 | Tampering | Isolation bypass via shared series | high | mitigate | `disol.test.ts` forbids debts imports in NW modules/page; chart series stays in `debts.ts` | closed |
| T-11-SC | Tampering | npm installs | high | accept | No new packages this phase — recharts@3.10.1 already pinned | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

*Note: Plan 03 reused threat ID `T-11-01` for totals inputs (accept); createDebt openedAsOf mitigation also verified under same ID.*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-11-01 | T-11-01 (totals) | Aggregates use server Prisma + LOCF only — no client FormData into primary totals | plan threat model | 2026-09-06 |
| AR-11-02 | T-11-04 | Single-user local wallet; excluded-debt banner names already-visible /debts rows | plan threat model | 2026-09-06 |
| AR-11-03 | T-11-SC | No new npm packages in phase 11 — recharts already pinned; supply-chain legitimacy N/A | plan threat model | 2026-09-06 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-06 | 7 | 7 | 0 | gsd-secure-phase (L1 ASVS) |

## Security Audit 2026-09-06

| Metric | Count |
|--------|-------|
| Threats found | 7 |
| Closed | 7 |
| Open | 0 |

L1 grep-depth verification (ASVS level 1). `register_authored_at_plan_time: true`. SUMMARY threat flags: none. Auditor skipped per short-circuit (threats_open: 0, plan-time register, asvs_level == 1).

Evidence checked:
- T-11-01: `asOfDateSchema` + create schemas in `src/lib/validations/debts.ts`
- T-11-02: `updateDebtMetaSchema` omit + `.strict()`; `actions.test.ts` smuggle assertion; edit mode read-only date in `DebtFormDialog.tsx`
- T-11-03: `DebtPrincipalStackChart.tsx` text-only tooltip; no note injection
- T-11-05: `src/lib/disol.test.ts` NW/debts isolation

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-06
