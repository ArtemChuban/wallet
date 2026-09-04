---
phase: "09"
slug: "people-debts-crud-nav"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-09-05"
---

# Phase 09 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Browser → Server Actions | Untrusted FormData into person/debt CRUD | name, ids, majors, direction, dates, notes |
| UI confirm step → delete actions | User intent gate before destructive write | personId / debtId / snapshot id |
| RSC → client props | Serialized list rows only (no secrets) | person/debt display fields; remainingMinor as string |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-09-01 | Tampering | createPerson | medium | mitigate | `createPersonSchema.strict()` + trim/max; reject empty names (`src/lib/validations/debts.ts`, `createPerson` action) | closed |
| T-09-01 | Tampering | updateDebtMeta | high | mitigate | Plan 03 reused ID. `updateDebtMetaSchema` omits initial*; `.strict()`; action writes meta fields only | closed |
| T-09-02 | Tampering | Person.name unique | low | mitigate | Map P2002 → «Человек с таким именем уже есть»; no silent overwrite | closed |
| T-09-03 | Information Disclosure | /debts RSC | low | accept | Single-user local app; no auth layer | closed |
| T-09-04 | Tampering | deletePerson | high | mitigate | Pre-count debts + `onDelete: Restrict`; blocked RU message; no cascade from person delete | closed |
| T-09-05 | Tampering | renamePerson | medium | mitigate | `renamePersonSchema.strict()`; P2002 unique handling | closed |
| T-09-06 | Repudiation | DestructiveConfirmStep | low | mitigate | Explicit second-step confirm with loss copy before delete | closed |
| T-09-07 | Tampering | createDebt amount | medium | mitigate | Zod positive major + `parseMajorToMinor` scale check | closed |
| T-09-08 | Tampering | compound create | medium | mitigate | Nested `person.create` + `debts.create` — atomic; no orphan person on debt failure | closed |
| T-09-09 | Destruction | deleteDebt | medium | mitigate | In-dialog confirm with cascade loss copy; Cascade FK for events | closed |
| T-09-10 | Destruction | AccountList snapshot delete | medium | mitigate | `DestructiveConfirmStep` before `deleteBalanceSnapshot` | closed |
| T-09-11 | Tampering | Scope creep RateList | low | accept | Explicitly out of D-17 — RateList unchanged this phase | closed |
| T-09-SC | Tampering | npm installs | high | accept | No new packages this phase — legitimacy N/A | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

*Note: Plan 03 reused threat ID `T-09-01` for `updateDebtMeta`; both createPerson and updateDebtMeta mitigations verified.*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-09-01 | T-09-03 | Single-user local wallet; /debts RSC has no auth — disclosure accepted for v1.1 scope | plan threat model | 2026-09-04 |
| AR-09-02 | T-09-11 | RateList confirm migration explicitly out of D-17 this phase | plan threat model | 2026-09-04 |
| AR-09-03 | T-09-SC | No new npm packages in phase 09 — supply-chain legitimacy N/A | plan threat model | 2026-09-04 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-05 | 13 | 13 | 0 | gsd-secure-phase (L1 ASVS) |

## Security Audit 2026-09-05

| Metric | Count |
|--------|-------|
| Threats found | 13 |
| Closed | 13 |
| Open | 0 |

L1 grep-depth verification (ASVS level 1). `register_authored_at_plan_time: true`. SUMMARY threat flags: none open. Auditor skipped per short-circuit (threats_open: 0, plan-time register, asvs_level == 1).

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-05
