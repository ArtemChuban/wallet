---
phase: 31-asset-savings-type-conversion
verified: 2026-09-22T12:40:42Z
status: human_needed
score: 8/9 must-haves verified
behavior_unverified: 1
overrides_applied: 0
decision_coverage:
  honored: 16
  total: 16
  not_honored: []
behavior_unverified_items:
  - truth: "Draft type-gate: leave SAVINGS clears rate/DOM state; re-enter SAVINGS starts empty (D-05, D-06, D-07)"
    test: "Edit ASSET or SAVINGS → switch type away from Накопительный → switch back"
    expected: "Rate/DOM inputs hide and clear on leave; both empty when returning to SAVINGS (no draft memory)"
    why_human: "Source-scan proves setAnnualRate/setAccrualDom(\"\") in onValueChange; no React runtime test exercises the state transition"
human_verification:
  - test: "ASSET → SAVINGS convert (UAT §1)"
    expected: "Type Select Актив/Накопительный only; «Валюта не меняется.»; empty rate+DOM on switch; Save enabled while empty; fill → «Сохранено»; list secondary rate line"
    why_human: "Live dialog + list revalidate — vitest cannot drive Orca UI"
  - test: "SAVINGS → ASSET convert + field clear (UAT §2)"
    expected: "Draft switch to Актив hides/clears rate/DOM; Save → ASSET; no rate line after refresh; no confirm chrome"
    why_human: "Live UI + draft state transition; source-scan only for clear path"
  - test: "FIAT_CREDIT / legacy type locked (UAT §3)"
    expected: "Muted type label; «Тип и валюта не меняются.»; currency muted mono; no type Select"
    why_human: "Visual lock state"
  - test: "List secondary rate line updates (UAT §4)"
    expected: "Appears after ASSET→SAVINGS; disappears after SAVINGS→ASSET"
    why_human: "List chrome + revalidate"
  - test: "BalanceSnapshot COUNT unchanged after convert (UAT §5)"
    expected: "sqlite COUNT(*) before == after both directions"
    why_human: "Live DB isolation beyond mocked never-calls"
  - test: "Create type list unchanged (UAT §6)"
    expected: "«Добавить счёт» still ASSET | FIAT_CREDIT | SAVINGS"
    why_human: "Create regression visual"
---

# Phase 31: ASSET ↔ SAVINGS type conversion Verification Report

**Phase Goal:** User can switch an existing account between `ASSET` and `SAVINGS` in account settings, both directions
**Verified:** 2026-09-22T12:40:42Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | In account settings, ASSET→SAVINGS requires annual rate + accrual day (create invariants) and persists | ✓ VERIFIED | `updateAccount` + Zod; vitest `ASSET→SAVINGS persists…`; dialog `name=type` + rate/DOM → `updateAccount`; AccountList wires `AccountFormDialog` edit |
| 2 | SAVINGS→ASSET clears `annualRateBps` + `accrualDayOfMonth` (CHECK-safe) | ✓ VERIFIED | Explicit nulls in one `prisma.account.update`; vitest `SAVINGS→ASSET persists…` asserts keys + nulls |
| 3 | Conversion does not write/drop BalanceSnapshot; history stays | ✓ VERIFIED | No `balanceSnapshot` in `updateAccount` body; vitest never-calls upsert/delete both directions; schema `onDelete: Restrict` on snapshots |
| 4 | Other types (`FIAT_CREDIT` / legacy) immutable — only ASSET↔SAVINGS | ✓ VERIFIED | `convertiblePair` gate + Zod enum; vitest forge rejects; `canConvertType` exact peers; `CONVERT_TYPE_OPTIONS` no FIAT_CREDIT |
| 5 | Client currency on update still ignored (D-03) | ✓ VERIFIED | `updateAccount` never reads currency; vitest asserts no `currencyCode` in update data |
| 6 | `updateAccountSchema` accepts optional ASSET\|SAVINGS; rejects FIAT_CREDIT/legacy on type | ✓ VERIFIED | `z.enum(["ASSET","SAVINGS"]).optional()`; account.test.ts accept/reject cases |
| 7 | Edit ASSET\|SAVINGS shows Select (Актив/Накопительный only); locked types muted label; split DialogDescription | ✓ VERIFIED | `canConvertType` + `CONVERT_TYPE_OPTIONS`; copy «Валюта не меняется.» / «Тип и валюта не меняются.»; source-scan locks green |
| 8 | Draft type-gate: leave SAVINGS clears rate/DOM; re-enter starts empty (D-05…D-07) | ⚠️ PRESENT_BEHAVIOR_UNVERIFIED | `showSavingsFields = accountType === "SAVINGS"` + clear in `onValueChange` present & wired; no runtime test of state transition |
| 9 | One Save submits name+type+rate/DOM; Save enabled while empty; no confirm; success «Сохранено» | ✓ VERIFIED | Submit `disabled` only pending/create-empty-currency; no DestructiveConfirm; action returns «Сохранено» (vitest) |

**Score:** 8/9 truths verified (1 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/lib/validations/account.ts` | optional type ASSET\|SAVINGS | ✓ VERIFIED | gsd artifacts 4/4; substantive schema |
| `src/app/accounts/actions.ts` | transition matrix + null clear | ✓ VERIFIED | effectiveType + convertiblePair + SAVINGS/ASSET branches |
| `src/app/accounts/actions.test.ts` | conversion matrix + never-calls | ✓ VERIFIED | ACCT-04 describe; both directions |
| `src/lib/validations/account.test.ts` | optional type accept/reject | ✓ VERIFIED | updateAccountSchema cases |
| `src/components/accounts/AccountFormDialog.tsx` | edit unlock + draft gate | ✓ VERIFIED | canConvertType + CONVERT options |
| `src/components/accounts/AccountFormDialog.test.ts` | source-scan locks | ✓ VERIFIED | unlock / options / gate / copy |
| `.planning/.../31-UAT.md` | Orca UAT scaffold | ✓ VERIFIED | 6 pending agent-driven checks |

### Key Link Verification

gsd `verify.key-links` reported false (PLAN used symbolic `from:`, not file paths). Manual:

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `updateAccountSchema.safeParse` | transition matrix | `validated.data.type` → `effectiveType` after findUnique | ✓ WIRED | actions.ts L235–260 |
| SAVINGS→ASSET branch | `prisma.account.update` | type ASSET + null rate/DOM | ✓ WIRED | L306–315 |
| conversion tests | balanceSnapshot mocks | never.toHaveBeenCalled | ✓ WIRED | actions.test.ts L312–313, L353–354 |
| `canConvertType` | type Select | exact ASSET\|\|SAVINGS | ✓ WIRED | AccountFormDialog L149–152, L202+ |
| Select onValueChange | annualRate / accrualDom | clear when next !== SAVINGS | ✓ WIRED | L207–214 (runtime untested) |
| hidden `name=type` | `updateAccount` | FormData type | ✓ WIRED | L204 + action FormData type parse |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| updateAccount ASSET→SAVINGS | type / annualRateBps / accrualDayOfMonth | FormData → Zod → parsePercentToBps → prisma.account.update | Yes (mocked in unit; real path wired) | ✓ FLOWING |
| updateAccount SAVINGS→ASSET | annualRateBps / accrualDayOfMonth | Explicit null in update data | Yes | ✓ FLOWING |
| AccountFormDialog edit type | accountType | account.type init + Select | User draft → FormData | ✓ FLOWING |
| Currency on edit | — | Not submitted (label only) | N/A ignored | ✓ FLOWING (D-03) |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Phase 31 test trio | `vitest run actions.test.ts account.test.ts AccountFormDialog.test.ts` | 3 files, 85 passed | ✓ PASS |
| ASSET→SAVINGS persist | `vitest run … -t "ASSET→SAVINGS persists"` | 1 passed | ✓ PASS |
| SAVINGS→ASSET persist | `vitest run … -t "SAVINGS→ASSET persists"` | 1 passed | ✓ PASS |
| Snapshot never-calls | `vitest run … -t "never calls BalanceSnapshot"` | 1 passed (ASSET→SAVINGS case; SAVINGS→ASSET embeds never-calls) | ✓ PASS |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No phase probes declared | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| ACCT-04 | 31-01, 31-02 | ASSET↔SAVINGS switch; rate/DOM; clear; snapshots stay; other types immutable | ✓ SATISFIED (code) / ? NEEDS HUMAN (live UAT) | Server+UI+vitest; 31-UAT.md pending |

Orphaned requirements for Phase 31: none.

### Decision Coverage

All trackable CONTEXT.md decisions are honored by shipped artifacts. (16/16 honored, 0 not_honored)

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| `actions.test.ts` (ACCT-04 describe) | ACCT-04 | yes | 0 | no | Behavioral / value | PASS |
| `account.test.ts` (optional type) | ACCT-04 | yes | 0 | no | Value | PASS |
| `AccountFormDialog.test.ts` | ACCT-04 | yes | 0 | no | Existence (source-scan) | WARNING — intentional; live UI deferred to UAT |

**Disabled tests on requirements:** 0
**Circular patterns detected:** 0
**Insufficient assertions:** 1 WARNING (dialog source-scan vs live Select behavior — mitigated by UAT scaffold)

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No TBD/FIXME/XXX/TODO/skip in phase files | — | — |

### Human Verification Required

### 1. ASSET → SAVINGS convert (UAT §1)

**Test:** Open «Изменить» on ASSET; switch to Накопительный; fill rate+DOM; Save
**Expected:** Select peers only; «Валюта не меняется.»; empty fields then «Сохранено»; list rate line
**Why human:** Live Orca UI

### 2. SAVINGS → ASSET convert + field clear (UAT §2)

**Test:** Edit SAVINGS; switch to Актив; Save
**Expected:** Fields clear in draft; type ASSET after refresh; no confirm
**Why human:** Draft state transition + live UI (also covers behavior_unverified truth #8)

### 3. FIAT_CREDIT / legacy locked (UAT §3)

**Test:** Edit FIAT_CREDIT or soft legacy
**Expected:** Muted label; «Тип и валюта не меняются.»
**Why human:** Visual

### 4. List secondary rate line (UAT §4)

**Test:** Convert both directions; watch list row
**Expected:** Rate line appears/disappears after revalidate
**Why human:** List chrome

### 5. BalanceSnapshot COUNT (UAT §5)

**Test:** sqlite COUNT before/after convert both ways
**Expected:** Unchanged
**Why human:** Live DB beyond mocks

### 6. Create type list (UAT §6)

**Test:** «Добавить счёт» type Select
**Expected:** Still ASSET \| FIAT_CREDIT \| SAVINGS
**Why human:** Create regression visual

### Gaps Summary

No code gaps. Automated must-haves hold except draft type-gate runtime (present + wired, unexercised). Phase blocked on agent-driven Orca UAT per `31-UAT.md` / OPERATOR.md — not on missing implementation.

---

_Verified: 2026-09-22T12:40:42Z_
_Verifier: Claude (gsd-verifier)_
