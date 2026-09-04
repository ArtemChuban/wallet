---
phase: "02"
slug: "currencies-accounts"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
created: "2026-09-03"
---

# Phase 02 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser FormData → createCurrency / updateCurrencyName | Untrusted create/update fields cross into SQLite | code, name, scale, isPrimary, name-only update |
| Browser FormData → createAccount / updateAccountName | Untrusted account fields and credit-limit strings | name, type, currencyCode, creditLimitMajor |
| Migration SQL → host SQLite | DDL + seed INSERT materialize currency catalog | RUB seed, Currency_one_primary index |
| Account.creditLimitMinor → future NW math | Metadata must not cross into assets | creditLimitMinor BigInt display only |
| Client Dialog FormData → name updates | Name string untrusted; server Zod validates | name field |
| RSC revalidate → mounted client FormBody | Prop refresh must not alter control contract mid-edit | controlled name Input state |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-02-01 | Tampering | currencies/accounts update actions | high | mitigate | Name-only Zod schemas; ignore extra FormData keys for code/scale/primary/type/limit | closed |
| T-02-02 | Tampering | createCurrency isPrimary | high | mitigate | Hardcode `isPrimary: false`; partial unique index `Currency_one_primary` | closed |
| T-02-03 | Elevation of Privilege | primary designation | medium | mitigate | No primary-switch UI (D-02); seed-only primary RUB | closed |
| T-02-04 | Denial of Service | scale/code inputs | medium | mitigate | Zod code max 16; scale 0–18 bounds in currency.ts | closed |
| T-02-05 | Tampering | money.ts parse | high | mitigate | BigInt-only `parseMajorToMinor`; no Number/parseFloat path | closed |
| T-02-06 | Tampering | creditLimitMajor input | high | mitigate | Zod superRefine + `parseMajorToMinor`; reject zero/negative | closed |
| T-02-07 | Spoofing | creditLimit as wealth | high | mitigate | Schema metadata-only comment; `formatMinorToMajor` display; no NW helpers treat limit as asset | closed |
| T-02-08 | Tampering | debt field smuggling | medium | mitigate | No debt column; Zod schemas omit debt | closed |
| T-02-09 | Tampering | duplicate account names | medium | mitigate | Prisma `@unique` on Account.name + Russian P2002 mapping | closed |
| T-02-10 | Repudiation / Tampering | removal exports | medium | mitigate | Actions export create/update only; tests assert no delete* | closed |
| T-02-11 | Tampering | FormDialog name Input | low | accept | Controlled UI state only; Server Actions still validate name | closed |
| T-02-12 | Information Disclosure | name field in client state | low | accept | Same data already rendered in list/dialog; no new secret surface | closed |
| T-02-SC | Tampering | dependency tree | low | accept | No new packages beyond Plan 02 official @shadcn registry; reuse Phase 1 pins | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

### Verification evidence (ASVS L1)

| Threat ID | Evidence |
|-----------|----------|
| T-02-01 | `updateCurrencyNameSchema` / `updateAccountNameSchema` name-only; actions tests ignore tampered FormData |
| T-02-02 | `createCurrency` hardcodes `isPrimary: false`; migration `Currency_one_primary`; actions.test.ts FormData primary claim |
| T-02-03 | CurrencyList badge only; no switchPrimary action/export |
| T-02-04 | `src/lib/validations/currency.ts` scaleSchema `.min(0).max(18)` |
| T-02-05 | `src/lib/money.ts` BigInt digits path; no parseFloat |
| T-02-06 | `account.ts` FIAT_CREDIT superRefine; `createAccount` `creditLimitMinor <= 0n` reject |
| T-02-07 | `prisma/schema.prisma` metadata comment on creditLimitMinor; AccountList uses formatMinorToMajor |
| T-02-08 | No `debt` matches in schema/validations/accounts actions |
| T-02-09 | `Account.name @unique`; P2002 → «Счёт с таким названием уже есть» |
| T-02-10 | actions.test.ts `not.arrayContaining(["deleteAccount"|"deleteCurrency"])` |
| T-02-11 | `value={name}` on CurrencyFormDialog / AccountFormDialog Inputs |
| T-02-12 | Accepted — list already shows names |
| T-02-SC | Accepted — no new runtime packages in Plans 01/03/04/05; Plan 02 shadcn official only |

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-02-01 | T-02-11 | Controlled client name state; server Zod still bounds name length/content | plan 02-05 | 2026-09-03 |
| AR-02-02 | T-02-12 | Name already visible in list/dialog; no new secret surface | plan 02-05 | 2026-09-03 |
| AR-02-03 | T-02-SC | No new packages (or official @shadcn only); Phase 1 pins reused | plans 02-01..05 | 2026-09-03 |

*Accepted risks do not resurface in future audit runs.*

---

## Unregistered Threat Flags

None — SUMMARY.md files have no `## Threat Flags` section; register sourced from PLAN.md `<threat_model>` blocks (02-01..05).

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-03 | 13 | 13 | 0 | gsd-secure-phase (ASVS L1 short-circuit) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-03
