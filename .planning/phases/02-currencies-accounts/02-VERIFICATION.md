---
phase: 02-currencies-accounts
verified: 2026-09-02T22:30:00Z
status: human_needed
score: 5/8 must-haves verified
behavior_unverified: 3
overrides_applied: 0
decision_coverage:
  honored: 20
  total: 20
  not_honored: []
re_verification:
  previous_status: human_needed
  previous_score: 4/4
  gaps_closed:
    - "G-02-1: CurrencyFormBody name Input controlled (useState + value/onChange; zero defaultValue)"
    - "G-02-2: AccountFormBody name Input controlled (mirror pattern; zero defaultValue)"
  gaps_remaining: []
  regressions: []
gaps: []
deferred:
  - truth: "Outstanding debt stored on credit accounts and reduces net worth (full ACCT-02 wording)"
    addressed_in: "Phase 3"
    evidence: "Phase 3 goal: dated balance snapshots; CONTEXT D-09 — debt is credit-account balance snapshots, not Account column"
  - truth: "User can delete accounts (full ACCT-01 wording)"
    addressed_in: "ACCT-04 / later"
    evidence: "CONTEXT D-14 — no account delete in v1; archive/close is ACCT-04"
behavior_unverified_items:
  - truth: "Editing a currency name and saving does not emit Base UI FieldControl uncontrolled default-value console error (G-02-1)"
    test: "Rename a currency while DevTools console open; save through Dialog"
    expected: "No Base UI FieldControl uncontrolled default-value warning; name persists; dialog closes"
    why_human: "Console warning is runtime Base UI behavior after revalidatePath — no automated test asserts console silence"
  - truth: "Editing an account name and saving does not emit Base UI FieldControl uncontrolled default-value console error (G-02-2)"
    test: "Rename an account while DevTools console open; save through Dialog"
    expected: "No FieldControl default-value warning; name persists; dialog closes"
    why_human: "Same revalidatePath + mounted FormBody race; presence of controlled Input does not prove console silence"
  - truth: "formKey remount on dialog open still resets local name state for a fresh edit session"
    test: "Open edit, change name without save, close, reopen same row"
    expected: "Name field shows current saved name (fresh mount-init), not abandoned draft"
    why_human: "Ordering/remount invariant; no component test exercises formKey bump + useState init"
human_verification:
  - test: "Open app → /currencies → confirm seeded RUB with «Основная» → create secondary currency → edit name only → confirm no removal control and no primary switch; Russian chrome matches UI-SPEC"
    expected: "RUB primary visible; create persists; only name editable after create; no removal / no primary switch"
    why_human: "MVP UAT re-run after gap closure; prior UAT blocked on G-02-1 console error"
  - test: "Open /accounts → create FIAT_DEBIT, CRYPTO, CASH, and FIAT_CREDIT (with limit) → rename only → confirm type/currency/limit locked on edit → no delete; Russian empty/CTA copy"
    expected: "All four types creatable; credit limit required only for credit; edit locks identity fields; no delete"
    why_human: "MVP UAT re-run after gap closure; prior UAT blocked on G-02-2 console error"
  - test: "Rename a currency and an account; confirm Browser/Next console shows no Base UI FieldControl uncontrolled default-value warning for CurrencyFormBody or AccountFormBody; names save and dialogs close"
    expected: "No FieldControl default-value console error; names persist; dialogs close on success"
    why_human: "02-05 human-check + G-02-1/G-02-2 closure proof — grep cannot see console"
---

# Phase 2: Currencies + Accounts Verification Report

**Phase Goal:** As a local Wallet user, I want to define free-form currencies with one forever primary and manage typed accounts with credit-limit metadata, so that I can set up capital structure before balances and net worth.
**Verified:** 2026-09-02T22:30:00Z
**Status:** human_needed
**Re-verification:** Yes — after gap-closure plan 02-05 (G-02-1 / G-02-2)
**Mode:** mvp

## User Flow Coverage

User story: «As a local Wallet user, I want to define free-form currencies with one forever primary and manage typed accounts with credit-limit metadata, so that I can set up capital structure before balances and net worth.»

| Step | Expected | Evidence | Status |
|------|----------|----------|--------|
| Open currencies | Nav → `/currencies`; seeded primary RUB | `Nav` links; `currencies/page.tsx` findMany; live DB primary RUB (`isPrimary=1`); list badge «Основная» | ✓ code / ⏳ human re-UAT |
| Create currency | Free-form code/name/scale; never sets primary | `createCurrency` hardcodes `isPrimary: false`; Zod + Dialog; actions tests | ✓ |
| Edit currency | Name only; controlled Input; code/scale locked | `updateCurrencyName` data `{ name }` only; `value={name}` / `onChange`; zero `defaultValue` | ✓ code / ⏳ console human |
| Open accounts | Nav → `/accounts`; empty CTA «Добавить счёт» | `accounts/page.tsx` + `AccountList`; live Account rows | ✓ code / ⏳ human re-UAT |
| Create four types | FIAT_DEBIT / FIAT_CREDIT / CRYPTO / CASH | Enum + Dialog `TYPE_OPTIONS`; createAccount tests | ✓ |
| Credit limit | Required >0 on FIAT_CREDIT; major→minor | Zod + `parseMajorToMinor`; `creditLimitMinor` persist | ✓ |
| Rename account | Name only; controlled Input; locks | `updateAccountName`; AccountFormBody controlled name; edit read-only meta | ✓ code / ⏳ console human |
| Outcome | Capital structure before balances/NW | Currency+Account catalog wired; no BAL/NW math | ✓ code / ⏳ human |

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | User can create currencies and rely on exactly one seeded primary currency (RUB; no primary switch in v1) | ✓ VERIFIED | Migration seed + `Currency_one_primary`; live DB primary RUB; `createCurrency` always `isPrimary: false`; no `setPrimaryCurrency` export; foundation + currency action tests pass |
| 2 | User can create and rename accounts of types fiat debit, fiat credit, crypto, and cash (no account delete in v1) | ✓ VERIFIED | Four-type enum + Dialog; `createAccount` / `updateAccountName`; actions tests all types + name-only; no `deleteAccount` export / no delete UI |
| 3 | User can set a required credit limit on a credit account at create time | ✓ VERIFIED | Zod FIAT_CREDIT refine; `parseMajorToMinor` → `creditLimitMinor`; account action + validation tests |
| 4 | Credit limit is stored as metadata only (never treated as an asset in later NW math) | ✓ VERIFIED | Schema comment + `BigInt?`; usages only create/display; no NW helper treats limit as asset |
| 5 | Editing a currency name and saving does not emit Base UI FieldControl uncontrolled default-value console error (G-02-1) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Controlled `useState` + `value`/`onChange`; `defaultValue` count 0; no post-mount `setName` sync — console silence needs browser |
| 6 | Editing an account name and saving does not emit Base UI FieldControl uncontrolled default-value console error (G-02-2) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Mirror controlled pattern in AccountFormBody; `defaultValue` count 0 — console silence needs browser |
| 7 | Currency and account name edit still submits via FormData field `name` and closes dialog on success | ✓ VERIFIED | Both Inputs keep `name="name"`; `updateCurrencyName` / `updateAccountName` tests pass (39 tests in spot-check set); success `useEffect` → `onSuccess` → `setOpen(false)` present |
| 8 | formKey remount on dialog open still resets local name state for a fresh edit session | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `onOpenChange` bumps `formKey`; FormBody `key={formKey}`; mount-init `useState` — no test exercises remount reset |

**Score:** 5/8 truths verified (3 present, behavior-unverified)

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Outstanding debt on credit accounts / NW reduction | Phase 3 | CONTEXT D-09; Phase 3 dated balances |
| 2 | Account delete | ACCT-04 / later | CONTEXT D-14; ROADMAP SC notes archive is ACCT-04 |

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `prisma/schema.prisma` | Currency.isPrimary + Account + creditLimitMinor | ✓ VERIFIED | Enum four types; FK; metadata BigInt |
| `prisma/migrations/20260902201000_currency_primary_rub` | RUB seed + one-primary index | ✓ VERIFIED | Prior + live primary row |
| `prisma/migrations/20260902202603_account_credit_limit` | Account table | ✓ VERIFIED | Live Account schema |
| `src/lib/money.ts` | parse/format BigInt helpers | ✓ VERIFIED | Used by account create/display |
| `src/lib/validations/currency.ts` | Zod create/update | ✓ VERIFIED | Tests pass |
| `src/lib/validations/account.ts` | Zod + credit limit refine | ✓ VERIFIED | Tests pass |
| `src/app/currencies/page.tsx` | RSC list /currencies | ✓ VERIFIED | Prisma → CurrencyList |
| `src/app/currencies/actions.ts` | create/update Server Actions | ✓ VERIFIED | revalidatePath; no delete |
| `src/components/currencies/CurrencyFormDialog.tsx` | Controlled name (G-02-1) | ✓ VERIFIED | `gsd verify.artifacts` pass; controlled name |
| `src/components/currencies/*` | List + Dialog | ✓ VERIFIED | Badge, truncate, Dialog |
| `src/components/nav.tsx` | Готовность · Валюты · Счета | ✓ VERIFIED | Links in layout |
| `src/app/accounts/page.tsx` | RSC list /accounts | ✓ VERIFIED | BigInt serialized |
| `src/app/accounts/actions.ts` | create/update + creditLimitMinor | ✓ VERIFIED | revalidatePath |
| `src/components/accounts/AccountFormDialog.tsx` | Controlled name (G-02-2) | ✓ VERIFIED | `gsd verify.artifacts` pass; controlled name |
| `src/components/accounts/*` | List + four-type Dialog | ✓ VERIFIED | Credit create-only; edit locks |
| `src/app/*/actions.test.ts` | Immutability / no-removal | ✓ VERIFIED | Spot-check pass |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `currencies/actions.ts` | `prisma.currency` | Zod then create/update | ✓ WIRED | create + name-only update |
| `accounts/actions.ts` | `prisma.account` | Zod + parseMajorToMinor | ✓ WIRED | creditLimitMinor on FIAT_CREDIT |
| `Account.currencyCode` | `Currency.code` | Prisma FK | ✓ WIRED | schema + live DB |
| `nav.tsx` | `/currencies`, `/accounts` | Next Link | ✓ WIRED | layout renders Nav |
| `CurrencyFormDialog` | `createCurrency` / `updateCurrencyName` | useActionState | ✓ WIRED | imports actions |
| `AccountFormDialog` | `createAccount` / `updateAccountName` | useActionState | ✓ WIRED | imports actions |
| CurrencyFormBody name `useState` | Input `value`/`onChange` + `name="name"` | controlled binding | ✓ WIRED | Manual (gsd key-links `from` not file paths — tool false-negative) |
| AccountFormBody name `useState` | Input `value`/`onChange` + `name="name"` | controlled binding | ✓ WIRED | Same |
| `revalidatePath` while FormBody mounted | Controlled Input | no control-mode flip | ✓ WIRED (code) / ⏳ human console | Controlled from mount; no `defaultValue`; no prop→state sync |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `currencies/page.tsx` | `currencies` | `prisma.currency.findMany` | Live RUB (+ USDT etc.) | ✓ FLOWING |
| `accounts/page.tsx` | `accounts` / `currencies` | prisma queries | Live Account + Currency FK | ✓ FLOWING |
| `createAccount` | `creditLimitMinor` | Form major → `parseMajorToMinor` | Persisted BigInt metadata | ✓ FLOWING |
| `AccountList` limit text | formatted limit | `formatMinorToMajor` | Display only | ✓ FLOWING |
| Edit name Inputs | local `name` state | mount-init from row / `""` | FormData `name` on submit | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Currency + account actions + Zod + money + foundation | `npm test -- --run src/app/currencies/actions.test.ts src/app/accounts/actions.test.ts src/lib/validations/currency.test.ts src/lib/validations/account.test.ts src/lib/money.test.ts src/lib/foundation.test.ts` | 6 files / 39 tests pass | ✓ PASS |
| Zero `defaultValue` in both dialogs | `grep -c defaultValue …FormDialog.tsx` | `0` / `0` | ✓ PASS |
| Controlled name + formKey | Read CurrencyFormDialog / AccountFormDialog | `useState` name; `value`/`onChange`; `key={formKey}` on open | ✓ PASS |
| Live primary currency | `sqlite3 … Currency WHERE isPrimary` | RUB primary present | ✓ PASS |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No phase-declared / conventional `scripts/*/tests/probe-*.sh` | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| CURR-01 | 02-01, 02-02, 02-04, 02-05 | Create currencies; one primary (e.g. RUB) | ✓ SATISFIED | Seeded forever-primary RUB; create/edit wired; 02-05 controlled rename path |
| ACCT-01 | 02-03, 02-04, 02-05 | Create/edit/delete accounts of four types | ✓ SATISFIED (phase-scoped) | Create + rename four types; **delete out of scope** (D-14 → ACCT-04); 02-05 controlled rename |
| ACCT-02 | 02-03, 02-04 | Credit limit + outstanding debt; debt reduces NW | ✓ SATISFIED (phase-scoped) | Credit limit metadata verified; **debt/NW deferred** Phase 3/5 (D-09) |

**Orphaned requirements:** none — REQUIREMENTS maps CURR-01, ACCT-01, ACCT-02 to Phase 2; all claimed by plans.

**Coverage note:** Full REQUIREMENTS wording exceeds Phase 2 CONTEXT narrowing. Phase goal/SCs met; deferred slices tracked above.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No TBD/FIXME/XXX in gap-closure dialog files | — | — |
| — | — | No `defaultValue` left on name Inputs | — | — |
| — | — | No delete/setPrimary Server Action exports | — | — |

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| `currencies/actions.test.ts` | CURR-01 | 3 | 0 | 0 | Behavioral | OK |
| `accounts/actions.test.ts` | ACCT-01, ACCT-02 | 4 | 0 | 0 | Behavioral | OK |
| `validations/account.test.ts` | ACCT-01, ACCT-02 | many | 0 | 0 | Value | OK |
| `validations/currency.test.ts` | CURR-01 | many | 0 | 0 | Value | OK |
| `foundation.test.ts` | CURR-01 / schema | 11 | 0 | 0 | Value | OK |

**Disabled tests on requirements:** 0
**Circular patterns detected:** 0
**Insufficient assertions:** 0 for roadmap SCs; G-02 console silence has no unit test (expected — human)

### Decision Coverage

All trackable CONTEXT.md decisions are honored by shipped artifacts. (20/20 honored; gate non-blocking)

### Human Verification Required

### 1. Currencies user flow (MVP) — re-UAT

**Test:** Open app → `/currencies` → confirm seeded RUB «Основная» → create secondary → edit name only → confirm no removal / no primary switch
**Expected:** RUB primary; create works; name-only edit; Russian chrome per UI-SPEC
**Why human:** Prior UAT failed on G-02-1; must re-confirm full flow after 02-05

### 2. Accounts user flow (MVP) — re-UAT

**Test:** `/accounts` → create all four types including credit with limit → rename only → confirm locks + no delete
**Expected:** Four types; required limit on credit; identity fields locked on edit
**Why human:** Prior UAT failed on G-02-2; must re-confirm capital-structure outcome

### 3. Gap re-check — FieldControl console (G-02-1 / G-02-2)

**Test:** Rename a currency and an account with DevTools console open
**Expected:** No Base UI FieldControl uncontrolled default-value warning; names persist; dialogs close
**Why human:** Harvested from 02-05-PLAN `<human-check>`; runtime console only

**Already passed (prior UAT):** Long-name ellipsis backstop — no re-check required unless chrome regresses.

### Gaps Summary

No blocking code gaps against ROADMAP success criteria or 02-05 artifact wiring. Controlled name fields close G-02-1/G-02-2 **code paths**. Status remains **human_needed**: re-run MVP UAT flows + confirm console clean on rename. Automated score **5/8** (3 behavior-unverified: console×2 + formKey remount).

---

_Verified: 2026-09-02T22:30:00Z_
_Verifier: Claude (gsd-verifier)_
