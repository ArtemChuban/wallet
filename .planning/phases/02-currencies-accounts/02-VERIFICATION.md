---
phase: 02-currencies-accounts
verified: 2026-09-02T21:11:27Z
status: human_needed
score: 4/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
decision_coverage:
  honored: 20
  total: 20
  not_honored: []
gaps: []
deferred:
  - truth: "Outstanding debt stored on credit accounts and reduces net worth (full ACCT-02 wording)"
    addressed_in: "Phase 3"
    evidence: "Phase 3 goal: dated balance snapshots; CONTEXT D-09 — debt is credit-account balance snapshots, not Account column"
  - truth: "User can delete accounts (full ACCT-01 wording)"
    addressed_in: "ACCT-04 / later"
    evidence: "CONTEXT D-14 — no account delete in v1; archive/close is ACCT-04"
human_verification:
  - test: "Open app → /currencies → confirm seeded RUB with «Основная» → create secondary currency → edit name only → confirm no removal control and no primary switch"
    expected: "RUB primary visible; create persists; only name editable after create; Russian chrome matches UI-SPEC"
    why_human: "MVP user-flow + visual/locale; harvested from 02-04-PLAN human-check. SUMMARY claims prior approval — end-of-phase UAT still confirms goal outcome."
  - test: "Open /accounts → empty/create UI → create FIAT_DEBIT, CRYPTO, CASH, and FIAT_CREDIT (with limit) → rename only → confirm type/currency/limit locked on edit → no delete control"
    expected: "All four types creatable; credit limit required only for credit; edit locks identity fields; Russian empty/CTA copy correct"
    why_human: "MVP user-flow for capital-structure outcome; Dialog pending/lock UX and absence of removal affordances need browser judgment"
  - test: "Create currency and account with long names (near 120 chars); confirm list truncates with ellipsis; full name editable in Dialog"
    expected: "List shows ellipsis; title/tooltip or Dialog shows full name"
    why_human: "PLAN truths tagged verification: backstop — CSS truncate present but visual ellipsis not proven by automated test"
---

# Phase 2: Currencies + Accounts Verification Report

**Phase Goal:** As a local Wallet user, I want to define free-form currencies with one forever primary and manage typed accounts with credit-limit metadata, so that I can set up capital structure before balances and net worth.
**Verified:** 2026-09-02T21:11:27Z
**Status:** human_needed
**Re-verification:** No — initial verification
**Mode:** mvp

## User Flow Coverage

User story: «As a local Wallet user, I want to define free-form currencies with one forever primary and manage typed accounts with credit-limit metadata, so that I can set up capital structure before balances and net worth.»

| Step | Expected | Evidence | Status |
|------|----------|----------|--------|
| Open currencies | Nav → `/currencies`; see seeded primary RUB | `Nav` links; `currencies/page.tsx` `findMany` orderBy code; live DB `RUB\|Рубль\|2\|1`; list badge «Основная» | ✓ code / ⏳ human |
| Create currency | Free-form code/name/scale; never sets primary | `createCurrency` hardcodes `isPrimary: false`; Zod + Dialog; vitest forces false under FormData tamper | ✓ |
| Edit currency | Name only; code/scale locked | `updateCurrencyName` data `{ name }` only; edit Dialog; immutability test | ✓ |
| Open accounts | Nav → `/accounts`; empty CTA «Добавить счёт» | `accounts/page.tsx` + `AccountList` empty state; live `Account` table | ✓ code / ⏳ human |
| Create four types | FIAT_DEBIT / FIAT_CREDIT / CRYPTO / CASH | `AccountType` enum; Dialog `TYPE_OPTIONS`; createAccount tests all four | ✓ |
| Credit limit | Required >0 on FIAT_CREDIT; major→minor via scale | Zod superRefine + `parseMajorToMinor`; action persists `creditLimitMinor`; list formats via `formatMinorToMajor` | ✓ |
| Rename account | Name only; type/currency/limit locked | `updateAccountName` name-only; edit Dialog read-only meta; immutability test | ✓ |
| Outcome | Capital structure ready before balances/NW | Currency+Account catalog wired; no BAL/NW math in this phase | ✓ code / ⏳ human |

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | User can create currencies and rely on exactly one seeded primary currency (RUB; no primary switch in v1) | ✓ VERIFIED | Migration `20260902201000_currency_primary_rub` INSERT RUB + `Currency_one_primary`; live DB primary RUB; `createCurrency` always `isPrimary: false`; export test forbids `setPrimaryCurrency`; foundation.test asserts seed+index (11/11 pass) |
| 2 | User can create and rename accounts of types fiat debit, fiat credit, crypto, and cash (no account delete in v1) | ✓ VERIFIED | Enum + Dialog four types; `createAccount` / `updateAccountName`; actions.test covers all types + name-only update + no `deleteAccount` export; UI has no delete controls |
| 3 | User can set a required credit limit on a credit account at create time | ✓ VERIFIED | Zod requires positive major for FIAT_CREDIT; action parses to `creditLimitMinor`; tests persist `100000n` for `"1000"` @ scale 2; non-credit persists `null` |
| 4 | Credit limit is stored as metadata only (never treated as an asset in later NW math) | ✓ VERIFIED | Schema `creditLimitMinor BigInt?` with metadata comment; no outstandingDebt column; greps show limit used only for create/display — no NW helper treats it as asset (NW deferred Phase 5; must keep this invariant) |

**Score:** 4/4 truths verified (0 present, behavior-unverified)

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Outstanding debt on credit accounts / NW reduction | Phase 3 | CONTEXT D-09; Phase 3 dated balances |
| 2 | Account delete | ACCT-04 / later | CONTEXT D-14; ROADMAP SC notes archive is ACCT-04 |

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `prisma/schema.prisma` | Currency.isPrimary + Account + creditLimitMinor | ✓ VERIFIED | Enum four types; FK currencyCode; optional BigInt limit |
| `prisma/migrations/20260902201000_currency_primary_rub` | RUB seed + one-primary index | ✓ VERIFIED | INSERT + partial unique index SQL |
| `prisma/migrations/20260902202603_account_credit_limit` | Account table | ✓ VERIFIED | Table + name unique + FK |
| `src/lib/money.ts` | parse/format BigInt helpers | ✓ VERIFIED | `parseMajorToMinor` / `formatMinorToMajor` |
| `src/lib/validations/currency.ts` | Zod create/update | ✓ VERIFIED | Free-form code; scale 0–18; name-only update |
| `src/lib/validations/account.ts` | Zod + credit limit refine | ✓ VERIFIED | Four types; FIAT_CREDIT limit rules |
| `src/app/currencies/page.tsx` | RSC list /currencies | ✓ VERIFIED | Prisma findMany → CurrencyList |
| `src/app/currencies/actions.ts` | create/update Server Actions | ✓ VERIFIED | Wired; no delete |
| `src/components/currencies/*` | List + Dialog | ✓ VERIFIED | Empty/populated; truncate; badge |
| `src/components/nav.tsx` | Готовность · Валюты · Счета | ✓ VERIFIED | Links `/` `/currencies` `/accounts`; in layout |
| `src/app/accounts/page.tsx` | RSC list /accounts | ✓ VERIFIED | Accounts + currencies; BigInt serialized |
| `src/app/accounts/actions.ts` | create/update + creditLimitMinor | ✓ VERIFIED | parseMajorToMinor for credit |
| `src/components/accounts/*` | List + four-type Dialog | ✓ VERIFIED | Credit field create-only; edit locks |
| `src/app/*/actions.test.ts` | Immutability / no-removal | ✓ VERIFIED | Export + tamper FormData tests |

**Artifacts:** all substantive and wired (gsd `verify.artifacts` choked on migration **directory** paths — checked manually)

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `currencies/actions.ts` | `prisma.currency` | Zod then create/update | ✓ WIRED | create + name-only update |
| `accounts/actions.ts` | `prisma.account` | Zod + parseMajorToMinor | ✓ WIRED | creditLimitMinor on FIAT_CREDIT |
| `Account.currencyCode` | `Currency.code` | Prisma FK | ✓ WIRED | schema + migration |
| `nav.tsx` | `/currencies`, `/accounts` | Next Link | ✓ WIRED | layout renders Nav |
| `CurrencyFormDialog` | `createCurrency` / `updateCurrencyName` | useActionState | ✓ WIRED | imports actions |
| `AccountFormDialog` | `createAccount` / `updateAccountName` | useActionState | ✓ WIRED | imports actions |
| migration SQL | Currency RUB | INSERT on migrate deploy | ✓ WIRED | live DB row present |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `currencies/page.tsx` | `currencies` | `prisma.currency.findMany` | Live RUB (+ any user rows) | ✓ FLOWING |
| `accounts/page.tsx` | `accounts` / `currencies` | `prisma.account` + `currency` | Live Account table + Currency FK | ✓ FLOWING |
| `createAccount` | `creditLimitMinor` | Form major → `parseMajorToMinor(scale)` | Persisted BigInt metadata | ✓ FLOWING |
| `AccountList` limit text | formatted limit | `formatMinorToMajor` + code | Display only — not NW asset | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Currency actions immutability / primary lock | `npm test -- --run src/app/currencies/actions.test.ts` | 3 tests pass | ✓ PASS |
| Account create types + immutability | `npm test -- --run src/app/accounts/actions.test.ts` | 4 tests pass | ✓ PASS |
| Account Zod credit rules | `npm test -- --run src/lib/validations/account.test.ts` | pass | ✓ PASS |
| Currency Zod | `npm test -- --run src/lib/validations/currency.test.ts` | pass | ✓ PASS |
| Money + schema adjacency | `npm test -- --run src/lib/money.test.ts` | pass | ✓ PASS |
| RUB seed + Account schema in migrated DB | `npm test -- --run src/lib/foundation.test.ts` | 11/11 pass | ✓ PASS |
| Live SQLite seed | `sqlite3 data/wallet.db …` | `RUB\|Рубль\|2\|1`; Account table exists | ✓ PASS |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No phase-declared / conventional `scripts/*/tests/probe-*.sh` | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| CURR-01 | 02-01, 02-02, 02-04 | Create currencies; one primary (e.g. RUB) | ✓ SATISFIED | Seeded forever-primary RUB (CONTEXT D-01/D-02 — no switch UI); create/edit wired |
| ACCT-01 | 02-03, 02-04 | Create/edit/delete accounts of four types | ✓ SATISFIED (phase-scoped) | Create + rename four types verified; **delete intentionally out of scope** (D-14 → ACCT-04) — see Deferred |
| ACCT-02 | 02-03, 02-04 | Credit limit + outstanding debt; debt reduces NW | ✓ SATISFIED (phase-scoped) | Credit limit metadata verified; **debt/NW deferred** Phase 3/5 (D-09) — see Deferred |

**Orphaned requirements:** none — REQUIREMENTS maps CURR-01, ACCT-01, ACCT-02 to Phase 2; all claimed by plans.

**Coverage note:** Full REQUIREMENTS wording exceeds Phase 2 CONTEXT narrowing. Phase goal/SCs met; deferred slices tracked above.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No TBD/FIXME/XXX/TODO in phase `src/` files | — | — |
| — | — | No delete/removal Server Action exports | — | — |
| `src/app/accounts/actions.ts` | ~68–76 | Misleading error when scale parse fails (maps to «больше 0») | ℹ️ Info | From 02-REVIEW WR-01 — advisory; does not fail must_haves |

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| `currencies/actions.test.ts` | CURR-01 | 3 | 0 | 0 | Behavioral (FormData → prisma data) | OK |
| `accounts/actions.test.ts` | ACCT-01, ACCT-02 | 4 | 0 | 0 | Behavioral | OK |
| `validations/account.test.ts` | ACCT-01, ACCT-02 | many | 0 | 0 | Value | OK |
| `validations/currency.test.ts` | CURR-01 | many | 0 | 0 | Value | OK |
| `foundation.test.ts` | CURR-01 / schema | 11 | 0 | 0 | Value (live/temp DB) | OK |

**Disabled tests on requirements:** 0
**Circular patterns detected:** 0
**Insufficient assertions:** 0 (review WR-* are product polish, not missing tests for SCs)

### Decision Coverage

All trackable CONTEXT.md decisions are honored by shipped artifacts. (20/20 honored; gate non-blocking)

### Human Verification Required

### 1. Currencies user flow (MVP)

**Test:** Open app → `/currencies` → confirm seeded RUB «Основная» → create secondary → edit name only → confirm no removal / no primary switch
**Expected:** RUB primary; create works; name-only edit; Russian chrome per UI-SPEC
**Why human:** Visual/locale + MVP flow; harvested from 02-04-PLAN

### 2. Accounts user flow (MVP)

**Test:** `/accounts` → create all four types including credit with limit → rename only → confirm locks + no delete
**Expected:** Four types; required limit on credit; identity fields locked on edit
**Why human:** End-to-end capital-structure outcome in browser

### 3. Long-name ellipsis (backstop)

**Test:** Long (~120) currency/account names in list
**Expected:** Truncate + ellipsis; full name in Dialog
**Why human:** `verification: backstop` — CSS `truncate` present; ellipsis not auto-proven

### Gaps Summary

No blocking gaps against ROADMAP success criteria. Automated score **4/4**. Status **human_needed** for MVP user-flow UAT (and backstop visual). 02-REVIEW warnings advisory only — not blockers.

---

_Verified: 2026-09-02T21:11:27Z_
_Verifier: Claude (gsd-verifier)_
