---
phase: 27-savings-schema-crud
verified: 2026-09-11T16:45:00Z
status: passed
score: 8/8 must-haves verified
behavior_unverified: 0
overrides_applied: 0
re_verification: true
decision_coverage:
  honored: 16
  total: 16
  not_honored: []
human_verification: []
uat_resolved: "27-UAT.md — 4/4 pass via Orca 2026-09-11"
prohibitions_review:
  - statement: "MUST NOT deliver interest ÷12 / ForecastSlotKind interest / Капитал Прогноз overlay / MCP rate fields (Phases 28–30)"
    disposition: honored
    evidence: "ForecastSlotKind remains income|grace; savings-accrual-display display-only; MCP list_accounts has no annualRateBps/accrualDayOfMonth"
    flagged: true
    note: unverified-prohibition — human review recommended (judgment-tier)
---

# Phase 27: SAVINGS schema + CRUD Verification Report

**Phase Goal:** Users can create and manage SAVINGS accounts whose balances count in net worth like other assets
**Verified:** 2026-09-11T16:32:50Z
**Status:** passed
**Re-verification:** Yes — UAT 4/4 via Orca; status promoted from human_needed

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | User can create a SAVINGS account with name, currency, annual interest rate, and accrual day-of-month (type distinct from debit/credit/crypto/cash) | ✓ VERIFIED | `AccountType.SAVINGS` in schema; `createAccountSchema` + `createAccount` persist `annualRateBps`+`accrualDayOfMonth`; Vitest `persists SAVINGS annualRateBps + accrualDayOfMonth` PASS |
| 2 | User can edit and see annual rate + accrual day on SAVINGS list/detail and create/edit forms | ✓ VERIFIED | `updateAccount` saves name+rate+DOM; form labels «Годовой %»/«День начисления»; list shows `formatBpsToPercentMajor`% + `formatAccrualCountdown` (raw DOM forms only per D-12); update Vitest PASS |
| 3 | SAVINGS account balances appear in Капитал net-worth totals and history like other asset accounts | ✓ VERIFIED | `isAssetType("SAVINGS")`; `NetWorthAccountType` includes SAVINGS; `computeNetWorthRows` non-credit path; `page.tsx` maps all accounts incl. type; Vitest `SAVINGS LOCF contributes positive like ASSET` PASS |
| 4 | Manual BalanceSnapshot path for SAVINGS works the same as other asset accounts (no auto interest write) | ✓ VERIFIED | `upsertBalanceSnapshot` non-credit ≥0 path; Vitest accepts SAVINGS + rejects negative; `does not call BalanceSnapshot on SAVINGS metadata update` PASS; no interest writer |
| 5 | 0% annual rate persists as annualRateBps 0; null rate forbidden | ✓ VERIFIED | Zod refine + Vitest `persists SAVINGS annualRateBps 0` / reject without rate |
| 6 | SQLite `Account_savings_rate_invariant` enforces rate+DOM iff type SAVINGS | ✓ VERIFIED | Migration `20260911161446_savings_account` + live `sqlite_master` CHECK; credit/grace CHECKs retained; migrate status up to date |
| 7 | Create/edit chrome: type-gated fields, title «Изменить счёт», description does not inventory editable fields | ✓ VERIFIED | `showSavingsFields`; title/description in `AccountFormDialog.tsx`; type/currency ignored on update (`findUnique` + name-only for non-SAVINGS) |
| 8 | No interest-overlay / MCP rate-field creep in this phase | ✓ VERIFIED | `ForecastSlotKind = "income" \| "grace"` only; MCP `list_accounts` metadata without rate/DOM; display helper comment Phase 28 |

**Score:** 8/8 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `prisma/schema.prisma` | SAVINGS + rate/DOM cols | ✓ VERIFIED | Enum + Int? fields + CHECK docs |
| `prisma/migrations/…savings_account/` | RedefineTables + invariant | ✓ VERIFIED | Live DB applied |
| `src/lib/savings-rate.ts` | percent↔bps | ✓ VERIFIED | Wired from actions + form |
| `src/lib/savings-accrual-display.ts` | next/countdown display | ✓ VERIFIED | Used by AccountList |
| `src/lib/account-type.ts` | soft + Накопительный | ✓ VERIFIED | isAssetType + label |
| `src/lib/net-worth.ts` | NetWorthAccountType SAVINGS | ✓ VERIFIED | Union + asset LOCF path |
| `src/lib/validations/account.ts` | create/update Zod | ✓ VERIFIED | Write enum + refine |
| `src/app/accounts/actions.ts` | create/update/snapshot | ✓ VERIFIED | parsePercentToBps; D-16 |
| `src/components/accounts/AccountFormDialog.tsx` | TYPE_OPTIONS + gates | ✓ VERIFIED | create+edit |
| `src/components/accounts/AccountList.tsx` | secondary rate+countdown | ✓ VERIFIED | No raw DOM on secondary |
| `src/app/accounts/page.tsx` | serialize rate/DOM + today | ✓ VERIFIED | Props to list/form |
| Wave 0 `*.test.ts` (5 files) | contracts green | ✓ VERIFIED | Exist + named cases PASS |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| AccountFormDialog create | createAccount → schema → Account | FormData percent+DOM → `parsePercentToBps` | ✓ WIRED | actions.ts + dialog |
| AccountFormDialog edit | updateAccount | DB type === SAVINGS requires rate+DOM | ✓ WIRED | findUnique; ignore client type |
| Account_savings_rate_invariant | annualRateBps / accrualDayOfMonth | CHECK iff SAVINGS | ✓ WIRED | migration + live DB |
| NetWorthAccountType | computeNetWorthRows | non-credit LOCF | ✓ WIRED | net-worth.ts + page.tsx |
| accounts/page.tsx | AccountList / AccountFormDialog | annualRateBps, accrualDayOfMonth, today | ✓ WIRED | serialize + `<AccountList today={today}>` |
| formatAccrualCountdown | clampDayOfMonth | nextAccrualAsOf | ✓ WIRED | savings-accrual-display.ts |
| upsertBalanceSnapshot | SAVINGS Account | non-credit ≥0 | ✓ WIRED | else-if amountMinor < 0; tests |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| AccountList secondary rate | annualRateBps | prisma.account via page | Yes | ✓ FLOWING |
| AccountList countdown | accrualDayOfMonth + today | prisma + calendarDateToday | Yes | ✓ FLOWING |
| NW hero | locfAmountMinor by type | BalanceSnapshot LOCF | Yes (same path as ASSET) | ✓ FLOWING |
| Form edit prefill | annualRateBps / DOM | account prop from page | Yes | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Create persist rate+DOM | `vitest run actions.test.ts -t 'persists SAVINGS annualRateBps'` | 2 passed | ✓ PASS |
| NW SAVINGS LOCF | `vitest run -t 'SAVINGS LOCF contributes positive like ASSET'` | 1 passed | ✓ PASS |
| No snapshot on metadata update | `vitest run -t 'does not call BalanceSnapshot on SAVINGS metadata update'` | 1 passed | ✓ PASS |
| Manual snapshot SAVINGS | `vitest run -t 'accepts non-credit ≥0 amount like ASSET'` | 1 passed | ✓ PASS |
| Countdown chrome | `vitest run -t 'returns через N дн.'` | 1 passed | ✓ PASS |
| Soft label | `vitest run -t 'SAVINGS is asset soft-read'` | 1 passed | ✓ PASS |
| Zod create accept | `vitest run account.test.ts -t 'accepts SAVINGS with annualRatePercentMajor'` | 1 passed | ✓ PASS |
| Update name+rate+DOM | `vitest run -t 'updates SAVINGS name'` | 1 passed | ✓ PASS |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No phase probes declared | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| ACCT-01 | 27-01…03 | Create/manage SAVINGS + rate + DOM | ✓ SATISFIED | Schema, Zod, actions, form |
| ACCT-02 | 27-01,02,04 | NW inclusion like assets | ✓ SATISFIED | isAssetType + computeNetWorthRows + snapshot |
| ACCT-03 | 27-01,03,04 | See rate + accrual day on UI | ✓ SATISFIED | Form fields + list %/countdown |

No orphaned Phase 27 requirements. INT-*/SAVISO-*/MCP-* correctly later phases.

### Decision Coverage

All trackable CONTEXT.md decisions are honored by shipped artifacts. (16/16 honored, 0 not_honored)

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| validations/account.test.ts | ACCT-01 | yes | 0 skip/todo | no | Value | OK |
| account-type.test.ts | ACCT-02/03 | yes | 0 | no | Value | OK |
| net-worth.test.ts | ACCT-02 | yes | 0 | no | Value | OK |
| savings-accrual-display.test.ts | ACCT-03 | yes | 0 | no | Value | OK |
| actions.test.ts | ACCT-01/02 | yes | 0 skip/todo | no | Behavioral | OK |

**Disabled tests on requirements:** 0
**Circular patterns detected:** 0
**Insufficient assertions:** 0

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No TBD/FIXME/XXX/TODO in phase key files | — | — |

### Human Verification Required

### 1. Create SAVINGS flow

**Test:** /accounts → Новый счёт → Накопительный; fill name, currency, Годовой %, День начисления; also try 0%; switch type away/back
**Expected:** Gated fields only for SAVINGS; no DOM default; create succeeds; CHECK/Zod reject missing rate/DOM
**Why human:** Browser gating + UX (agent UAT via Orca per OPERATOR.md)

### 2. Edit SAVINGS + non-SAVINGS

**Test:** Edit SAVINGS (prefill rate+DOM); edit ASSET/credit (no savings fields); confirm title «Изменить счёт»
**Expected:** Coherent update; type/currency immutable copy; pending «Сохранение…»
**Why human:** Dialog chrome

### 3. List secondary + manual balance

**Test:** SAVINGS row shows Накопительный · CCY · rate% · сегодня|через N дн.; set/update balance
**Expected:** No raw DOM on list; LOCF like ASSET; snapshot persists
**Why human:** Visual meta layout

### 4. Капитал inclusion / no overlay creep

**Test:** Open `/` with SAVINGS that has LOCF
**Expected:** Principal in totals; no interest Прогноз slots from this phase
**Why human:** Dashboard eyes

### Gaps Summary

No blocking code gaps. Roadmap SC 1–4 + ACCT-01…03 delivered in schema/actions/UI/tests. Status `human_needed` solely for end-of-phase UAT (user-facing). Judgment-tier prohibition (no Phase 28–30 creep) honored in code; flagged for human ack.

---

_Verified: 2026-09-11T16:32:50Z_
_Verifier: Claude (gsd-verifier)_

## VERIFICATION BLOCKED

Automated goal truths **8/8 VERIFIED**. No gaps. Phase close blocked on agent/human UAT (Orca) — status `human_needed`.
