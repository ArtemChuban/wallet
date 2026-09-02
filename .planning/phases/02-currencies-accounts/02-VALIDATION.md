---
phase: "2"
slug: "currencies-accounts"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| 02-01-01 | 01 | 1 | CURR-01 | T-02-05 | Wave 0 currency Zod + money parse/format test files | unit (red-first) | `test -f src/lib/validations/currency.test.ts` + money.test greps | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | CURR-01 | T-02-02 / T-02-05 | Tracer: isPrimary + RUB seed SQL + money/Zod green | unit + schema | `npm test -- --run src/lib/validations/currency.test.ts src/lib/money.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | CURR-01 | T-02-02 | [BLOCKING] migrate deploy + foundation RUB assert | unit + migrate | host migrate deploy + `npm test -- --run src/lib/foundation.test.ts` | ⚠️ extend | ⬜ pending |
| 02-02-01 | 02 | 2 | CURR-01 | T-02-01 / T-02-02 | Tracer: createCurrency/updateCurrencyName + /currencies + nav | file + unit | page/actions/nav greps + currency.test.ts | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | CURR-01 | T-02-01 | Currency Dialog pending UX + list chrome | grep | CurrencyFormDialog pending + outline/ghost row CTAs | ❌ | ⬜ pending |
| 02-03-01 | 03 | 3 | ACCT-01/02 | T-02-06 | Wave 0 account Zod + creditLimitMinor test files | unit (red-first) | `test -f src/lib/validations/account.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 3 | ACCT-01/02 | T-02-06 / T-02-07 | Tracer: Account + createAccount creditLimitMinor path | unit + schema | `npm test -- --run src/lib/validations/account.test.ts src/lib/money.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-03 | 03 | 3 | ACCT-02 | T-02-07 | [BLOCKING] Account migrate deploy + foundation | unit + migrate | host migrate deploy + `npm test -- --run src/lib/foundation.test.ts` | ⚠️ extend | ⬜ pending |
| 02-04-01 | 04 | 4 | ACCT-01 | — | Four account types creatable; non-credit null limit | unit | `npm test -- --run src/lib/validations/account.test.ts` | ❌ W0 | ⬜ pending |
| 02-04-02 | 04 | 4 | ACCT-01/CURR-01 | T-02-01 | Name-only updates; no removal exports | unit | `npm test -- --run src/app/accounts/actions.test.ts src/app/currencies/actions.test.ts` | ❌ W0 | ⬜ pending |
| 02-04-03 | 04 | 4 | CURR-01/ACCT-01 | — | checkpoint:human-verify RU UI smoke | full suite + human | `npm test` then human walk /currencies + /accounts | ⚠️ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Planner fills concrete Task IDs when PLAN.md waves are authored.*

---

## Wave 0 Requirements

- [ ] `src/lib/money.test.ts` — add parse/format + `creditLimitMinor BigInt` schema assertions
- [ ] `src/lib/validations/currency.test.ts` — CURR-01 Zod rules
- [ ] `src/lib/validations/account.test.ts` — ACCT-01/02 Zod rules (credit required, no debt field)
- [ ] Optional integration: better-sqlite3 in-memory migrate+seed assert one primary (pattern in `foundation.test.ts`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Russian UI chrome on `/currencies` and `/accounts` | CURR-01, ACCT-01 | Locale/visual copy | After migrate + app up: open both routes; confirm RU labels, empty states, Dialog create/edit |
| Seeded RUB appears as primary on fresh volume | CURR-01 | Docker migrate path | Empty `data/`, migrate deploy (or compose up); list currencies shows RUB primary |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
