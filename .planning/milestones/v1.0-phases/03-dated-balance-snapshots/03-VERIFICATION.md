---
phase: 03-dated-balance-snapshots
verified: 2026-09-03T11:35:29Z
status: passed
score: 7/8 must-haves verified
behavior_unverified: 1
overrides_applied: 0
decision_coverage:
  honored: 16
  total: 16
  not_honored: []
mvp_goal_note: "ROADMAP Phase 3 goal is not As-a/I-want/so-that form (user-story.validate=false). PLAN phase goals are valid user stories — User Flow Coverage uses PLAN story. Recommend /gsd mvp-phase 3 to align ROADMAP goal."
gaps: []
deferred: []
behavior_unverified_items:

  - truth: "After last snapshot deleted, expand collapses and row reverts to «Задать первый баланс» with no invented 0 (UI empty E4)"
    test: "Create one snapshot → expand history → delete sole row via confirm"
    expected: "Expand closes; row shows emphasized «Задать первый баланс»; no 0.00 / invented zero"
    why_human: "Client collapses expand locally; LOCF/CTA reset depends on revalidatePath + RSC re-render — no test exercises delete→empty→first-CTA transition"
coincidental_reliance_items: []
unverified_prohibitions:

  - statement: "MUST NOT invent a zero balance when no snapshot exists for asOfDate D"
    verification: judgment
    note: "Code paths avoid 0n/0.00 when locf null; human smoke should confirm no invented zero in UI"
  - statement: "MUST NOT keep BalanceAmountStub alongside BalanceSnapshot after migration"
    verification: judgment
    note: "schema has BalanceSnapshot only; stub model absent — judgment OK"
  - statement: "MUST NOT store outstanding debt as a second money column / writable FormData field"
    verification: judgment
    note: "amountMinor only; actions.test ignores debtMinor FormData — judgment OK"
  - statement: "MUST NOT add /balances route or /accounts/[id]; MUST NOT put delete in SetBalanceDialog; MUST NOT mark history as «текущий»"
    verification: judgment
    note: "Negative greps clean; human review recommended"
human_verification:

  - test: "Open /accounts → non-credit «Задать первый баланс» → set past-date balance → confirm row amount · на DD.MM.YYYY; overwrite same date; set older date; LOCF as-of today is latest ≤ today"
    expected: "Past set works; overwrite replaces; LOCF row matches latest applicable snapshot; Russian chrome"
    why_human: "Plan 03 checkpoint:human-verify + ROADMAP SC1/SC3; unit tests mock Prisma — browser flow not exercised"
  - test: "Expand history (newest first) → delete one snapshot with confirm «Удалить снимок за {date}?…» → after last delete CTA returns to «Задать первый баланс» with no 0.00"
    expected: "History inline under row; delete history-only; empty state honest (E4)"
    why_human: "Post-delete empty transition is PRESENT_BEHAVIOR_UNVERIFIED; visual/aria confirm needed"
  - test: "FIAT_CREDIT: dialog «Доступный лимит»; row shows доступно + долг; history shows available only; available outside 0..limit rejected; future date → «Дата не может быть в будущем»"
    expected: "Credit copy and debt derivation match UI-SPEC; future rejected in Russian"
    why_human: "Credit UX + locale strings need human eyes; actions tests cover server reject only"
  - test: "Long account name (≤120) truncates with ellipsis in list; full name still editable in Account edit Dialog"
    expected: "truncate ellipsis on list; edit Dialog shows full name"
    why_human: "PLAN 02 must_have marked verification: backstop — presence of CSS truncate is not behavioral proof"
---

# Phase 3: Dated Balance Snapshots Verification Report

**Phase Goal:** User can record account balances as of a chosen date and read the correct as-of balance over time
**Verified:** 2026-09-03T11:35:29Z
**Status:** human_needed
**Re-verification:** No — initial verification
**Mode:** mvp

> **MVP goal format:** ROADMAP goal fails `user-story.validate`. PLAN goals use valid As-a/I-want/so-that. User Flow Coverage below uses PLAN story. Align ROADMAP via `/gsd mvp-phase 3` when convenient.

## User Flow Coverage

User story: «As a local Wallet user, I want to record account balances as of a chosen date and read the correct as-of balance over time, so that capital history stays trustworthy before FX and net worth.»

| Step | Expected | Evidence | Status |
|------|----------|----------|--------|
| Open accounts | `/accounts` list with set-balance CTAs | `src/app/accounts/page.tsx` + `AccountList` | ✓ code / ⏳ human |
| Set balance | Dialog amount + asOfDate (past/today); upsert persists | `SetBalanceDialog` → `upsertBalanceSnapshot`; actions tests | ✓ code / ⏳ human |
| See LOCF | Row shows native amount · на date (or credit available/debt) | Batch LOCF in `page.tsx`; `LocfDisplay` | ✓ code / ⏳ human |
| History | Inline expand newest-first; delete with confirm | `AccountList` expand + `deleteBalanceSnapshot` | ✓ code / ⏳ human |
| Empty honest | Before first / after last delete — no invented 0 | `getBalanceAsOf` null; `locf == null` → «Задать первый баланс» | ✓ helper / ⏳ E4 human |
| Outcome | Capital history trustworthy before FX/NW | BAL-01 write + BAL-02 LOCF wired end-to-end in code | ✓ code / ⏳ human |

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | User can set an account balance for a chosen as-of date (including dates in the past) | ✓ VERIFIED | `upsertBalanceSnapshot` + `SetBalanceDialog` (`type=date`, `max={today}`); `actions.test.ts` upsert path; `SetBalanceDialog.test.ts` date contract |
| 2 | Asking for balance as of date D returns the latest snapshot with date ≤ D | ✓ VERIFIED | `getBalanceAsOf` `findFirst` where `asOfDate: { lte }` `orderBy desc`; `balances.test.ts` between/exact cases pass |
| 3 | User can see each account’s current native balance from its latest applicable snapshot | ✓ VERIFIED | `page.tsx` batches snapshots `lte today`, first-per-account LOCF; `LocfDisplay` renders amount+code · на DD.MM.YYYY (credit: доступно/долг) |
| 4 | Days before an account’s first snapshot show no invented zero balance | ✓ VERIFIED | `getBalanceAsOf` returns null (`balances.test.ts`); UI: `locf == null` → «Задать первый баланс», `LocfDisplay` returns null — never `0.00` |
| 5 | Same (accountId, asOfDate) upsert overwrites amountMinor | ✓ VERIFIED | Schema `@@unique(..., name: "accountId_asOfDate")`; `prisma.balanceSnapshot.upsert`; balances + actions tests |
| 6 | Future asOfDate rejected server-side with «Дата не может быть в будущем» | ✓ VERIFIED | `asOfDate > calendarDateToday()` in action; `actions.test.ts` asserts Russian error |
| 7 | FIAT_CREDIT stores available in amountMinor; debt = limit − available on row | ✓ VERIFIED | Upsert writes only `amountMinor`; `creditDebtMinor` in list; actions test ignores `debtMinor` FormData |
| 8 | After last snapshot deleted, expand collapses and row reverts to «Задать первый баланс» with no invented 0 | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | Expand collapse coded; CTA depends on RSC revalidate — no behavioral test for E4 |

**Score:** 7/8 truths verified (1 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `prisma/schema.prisma` | BalanceSnapshot + unique; stub gone | ✓ VERIFIED | Model + `accountId_asOfDate`; no `BalanceAmountStub` |
| `prisma/migrations/20260903120000_balance_snapshot/` | DROP stub / CREATE snapshot | ✓ VERIFIED | migration.sql present; `migrate status` up to date |
| `src/lib/balances.ts` | getBalanceAsOf, creditDebtMinor, calendarDateToday | ✓ VERIFIED | LOCF + Moscow default; `ensureSqlitePragmas` before read |
| `src/lib/validations/balance.ts` | setBalanceSchema / deleteBalanceSchema | ✓ VERIFIED | Zod strict schemas |
| `src/app/accounts/actions.ts` | upsert + delete Server Actions | ✓ VERIFIED | Wired + tested |
| `src/components/accounts/SetBalanceDialog.tsx` | Russian set-balance Dialog | ✓ VERIFIED | useActionState → upsert; no delete |
| `src/app/accounts/page.tsx` | LOCF + history props | ✓ VERIFIED | Batch LOCF + newest-first history as strings |
| `src/components/accounts/AccountList.tsx` | LOCF row + expand history + delete | ✓ VERIFIED | Inline history; destructive delete; first/secondary CTAs |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `SetBalanceDialog.tsx` | `upsertBalanceSnapshot` | useActionState + FormData | ✓ WIRED | Manual (gsd path-from failed — component name not file path) |
| `page.tsx` | LOCF as-of-today | `calendarDateToday` + batch `balanceSnapshot.findMany` lte | ✓ WIRED | Equivalent to getBalanceAsOf per account; pattern tool verified calendarDateToday |
| `upsertBalanceSnapshot` | `prisma.balanceSnapshot.upsert` | `accountId_asOfDate` | ✓ WIRED | Manual |
| `AccountList` history Удалить | `deleteBalanceSnapshot` | confirm + FormData id + revalidatePath | ✓ WIRED | Manual |
| `page.tsx` history query | `AccountList` expand | snapshots props newest-first strings | ✓ WIRED | Manual |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `page.tsx` → AccountList | `locf` | `prisma.balanceSnapshot.findMany` lte today | Yes | ✓ FLOWING |
| `page.tsx` → AccountList | `snapshots` | `prisma.balanceSnapshot.findMany` desc | Yes | ✓ FLOWING |
| `LocfDisplay` | amount / debt | `locf.amountMinor` + `creditLimitMinor` | Yes (props from DB) | ✓ FLOWING |
| `upsertBalanceSnapshot` | `amountMinor` | Zod + `parseMajorToMinor` → upsert | Yes | ✓ FLOWING |
| `getBalanceAsOf` | return row | `findFirst` lte desc | Yes (null if empty) | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| LOCF + Zod + actions + foundation + dialog source tests | `npm test -- --run src/lib/balances.test.ts src/lib/validations/balance.test.ts src/app/accounts/actions.test.ts src/lib/foundation.test.ts src/components/accounts/SetBalanceDialog.test.ts` | 5 files, 39 tests passed | ✓ PASS |
| Schema BalanceSnapshot / stub gone / unique | grep schema | all match | ✓ PASS |
| Dialog wires upsert; no delete in dialog | grep | match / negative match | ✓ PASS |
| Host migrate up to date | `DATABASE_URL=file:./data/wallet.db npx prisma migrate status` | Database schema is up to date | ✓ PASS |
| Full UI E2E set→LOCF→delete | (needs running app) | skipped | ? SKIP |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No phase-declared `probe-*.sh` | SKIPPED |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| BAL-01 | 03-01, 03-02, 03-03 | User can set account balance as of chosen date (backdating allowed) | ✓ SATISFIED (code) / ⏳ human UI | Upsert + Dialog + history overwrite/delete; REQUIREMENTS.md marks Complete |
| BAL-02 | 03-01, 03-02, 03-03 | Balance as of D = latest snapshot with date ≤ D | ✓ SATISFIED (code) / ⏳ human UI | getBalanceAsOf + list LOCF; null before first |

Orphaned requirements for Phase 3: none (only BAL-01, BAL-02 mapped; both claimed by all three plans).

### Decision Coverage

All trackable CONTEXT.md decisions honored by shipped artifacts (16/16). Non-blocking.

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| `src/lib/balances.test.ts` | BAL-02, BAL-01 | yes | 0 | no | Value (LOCF/null/upsert mock) | OK |
| `src/lib/validations/balance.test.ts` | BAL-01 | yes | 0 | no | Value (Zod) | OK |
| `src/app/accounts/actions.test.ts` | BAL-01, BAL-02 adj. | yes | 0 | no | Behavioral (future/credit/upsert/delete) | OK |
| `src/components/accounts/SetBalanceDialog.test.ts` | BAL-01 | yes | 0 | no | Existence (source regex) | OK (weak for UX) |
| `src/lib/foundation.test.ts` | BAL-01 schema | yes | 0 | no | Value (table allow-list) | OK |

**Disabled tests on requirements:** 0  
**Circular patterns detected:** 0  
**Insufficient assertions:** 1 warning — SetBalanceDialog tests are source-string only (no render/interaction)

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No TBD/FIXME/XXX in phase files | — | — |
| `AccountList.tsx` | 60 | `return null` when !locf | ℹ️ Info | Intentional empty LOCF (BAL-02) |
| `actions.test.ts` | 259 | FormData `debtMinor` | ℹ️ Info | Negative test — debt not persisted |

### Human Verification Required

### 1. Russian set-balance + LOCF smoke

**Test:** Walk Plan 03 how-to-verify checklist on `/accounts` (past set, overwrite, LOCF ≤ today).  
**Expected:** Russian CTAs/dialogs; row shows correct native LOCF; no invented zero.  
**Why human:** Locale + visual; Prisma mocked in unit tests.

### 2. History expand + delete → empty E4

**Test:** Expand → delete snapshots until none remain.  
**Expected:** Confirm copy; after last delete → «Задать первый баланс»; no 0.00.  
**Why human:** State transition after revalidatePath not covered by tests.

### 3. Credit available/debt + future reject

**Test:** FIAT_CREDIT set available; confirm row/history; try future date and over-limit.  
**Expected:** UI-SPEC credit copy; debt derived; Russian errors.  
**Why human:** Visual debt line + dialog titles.

### 4. Long name truncate (backstop)

**Test:** Account name near 120 chars on list vs edit Dialog.  
**Expected:** Ellipsis on list; full name in edit.  
**Why human:** `verification: backstop` — CSS presence ≠ observed truncate.

### Gaps Summary

No automated blockers. Schema, LOCF helpers, Server Actions, Dialog, and list/history wiring present and tested. Phase goal achieved in code; blocked on human UAT (Plan 03 checkpoint) plus one behavior-unverified empty-after-delete truth. No gaps for `/gsd-plan-phase --gaps`.

---

_Verified: 2026-09-03T11:35:29Z_
_Verifier: Claude (gsd-verifier)_
