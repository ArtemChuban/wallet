---
phase: "2"
slug: "currencies-accounts"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-02"
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 |
| **Config file** | `vitest.config.ts` (`include: src/**/*.test.ts`) |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10–60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite green + migrate on empty DB shows RUB primary + manual RU UI smoke
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | CURR-01 | T-02-05 | Wave 0 currency Zod + money parse/format | unit | `npm test -- --run src/lib/validations/currency.test.ts src/lib/money.test.ts` | ✅ | ✅ green |
| 02-01-02 | 01 | 1 | CURR-01 | T-02-02 / T-02-05 | isPrimary + RUB seed + money/Zod | unit + schema | `npm test -- --run src/lib/validations/currency.test.ts src/lib/money.test.ts` | ✅ | ✅ green |
| 02-01-03 | 01 | 1 | CURR-01 | T-02-02 | [BLOCKING] migrate deploy + foundation RUB | unit + migrate | `npm test -- --run src/lib/foundation.test.ts` | ✅ | ✅ green |
| 02-02-01 | 02 | 2 | CURR-01 | T-02-01 / T-02-02 | createCurrency/updateCurrencyName + nav | unit | `npm test -- --run src/app/currencies/actions.test.ts` | ✅ | ✅ green |
| 02-02-02 | 02 | 2 | CURR-01 | T-02-01 | Currency Dialog pending UX + outline CTA | unit (source-contract) | `npm test -- --run src/components/currencies/CurrencyFormDialog.test.ts` | ✅ | ✅ green |
| 02-03-01 | 03 | 3 | ACCT-01/02 | T-02-06 | Wave 0 account Zod + creditLimitMinor | unit | `npm test -- --run src/lib/validations/account.test.ts` | ✅ | ✅ green |
| 02-03-02 | 03 | 3 | ACCT-01/02 | T-02-06 / T-02-07 | Account + createAccount creditLimitMinor | unit + schema | `npm test -- --run src/lib/validations/account.test.ts src/lib/money.test.ts` | ✅ | ✅ green |
| 02-03-03 | 03 | 3 | ACCT-02 | T-02-07 | [BLOCKING] Account migrate + foundation | unit + migrate | `npm test -- --run src/lib/foundation.test.ts` | ✅ | ✅ green |
| 02-04-01 | 04 | 4 | ACCT-01 | — | Four account types; non-credit null limit | unit | `npm test -- --run src/lib/validations/account.test.ts` | ✅ | ✅ green |
| 02-04-02 | 04 | 4 | ACCT-01/CURR-01 | T-02-01 | Name-only updates; no removal exports | unit | `npm test -- --run src/app/accounts/actions.test.ts src/app/currencies/actions.test.ts` | ✅ | ✅ green |
| 02-04-03 | 04 | 4 | CURR-01/ACCT-01 | — | checkpoint:human-verify RU UI smoke | full suite + human | `npm test` then human walk /currencies + /accounts | — | ⚠️ manual |
| 02-05-01 | 05 | 5 | CURR-01 / G-02-1 | — | Controlled currency-name Input, no defaultValue | unit (source-contract) | `npm test -- --run src/components/currencies/CurrencyFormDialog.test.ts` | ✅ | ✅ green |
| 02-05-02 | 05 | 5 | ACCT-01 / G-02-2 | — | Controlled account-name Input, no defaultValue | unit (source-contract) | `npm test -- --run src/components/accounts/AccountFormDialog.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky/manual*

---

## Wave 0 Requirements

- [x] `src/lib/money.test.ts` — parse/format + `creditLimitMinor BigInt` schema assertions
- [x] `src/lib/validations/currency.test.ts` — CURR-01 Zod rules
- [x] `src/lib/validations/account.test.ts` — ACCT-01/02 Zod rules (credit required, no debt field)
- [x] Optional integration: better-sqlite3 in-memory migrate+seed assert one primary (in `foundation.test.ts`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Russian UI chrome on `/currencies` and `/accounts` | CURR-01, ACCT-01 | Locale/visual copy | After migrate + app up: open both routes; confirm RU labels, empty states, Dialog create/edit |
| Seeded RUB appears as primary on fresh volume | CURR-01 | Docker migrate path | Empty `data/`, migrate deploy (or compose up); list currencies shows RUB primary |
| End-to-end rename without FieldControl console warning | G-02-1 / G-02-2 | Browser console | Rename currency + account; confirm no Base UI uncontrolled default-value warning |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** validated 2026-09-03 — suite 46/46 green

## Validation Audit 2026-09-03

| Metric | Count |
|--------|-------|
| Gaps found | 3 |
| Resolved | 3 |
| Escalated | 0 |

Tests added: `CurrencyFormDialog.test.ts`, `AccountFormDialog.test.ts` (source-contract pending UX + controlled name fields).
