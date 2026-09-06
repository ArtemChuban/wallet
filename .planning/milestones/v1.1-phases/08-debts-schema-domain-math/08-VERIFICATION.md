---
phase: 08-debts-schema-domain-math
verified: 2026-09-04T16:30:19Z
status: passed
score: 8/8 must-haves verified
behavior_unverified: 0
overrides_applied: 0
decision_coverage:
  honored: 24
  total: 24
  not_honored: []
---

# Phase 8: Debts schema + domain math Verification Report

**Phase Goal:** Persist people/debts/repayments and lock remaining/domain math in pure functions with tests — no NW coupling. CONTEXT size-change ledger (no writeOffMinor).
**Verified:** 2026-09-04T16:30:19Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Prisma Person, Debt, DebtRepayment, DebtSizeChange migrate cleanly (host + Docker entrypoint path) | ✓ VERIFIED | Migration `20260904180755_debts_schema` applied; host DB has all four tables; `prisma migrate status` = up to date; `foundation.test.ts` redeploys to fresh SQLite and asserts tables + `debts_schema` name; `docker/entrypoint.sh` runs `prisma migrate deploy` on start (A7 equivalent — no compose smoke required) |
| 2 | Pure helpers: remaining = initial + Σ delta − Σ repayments; over-repay rejected (CONTEXT D-04) | ✓ VERIFIED | `remainingMinor` / `currentPrincipalMinor` in `src/lib/debts.ts`; Vitest cases (initial-only, deltas, repayments, early-close down-delta); `assertRepaymentAmount` rejects `<= 0` and `amount > remainingBefore` (boundary + over-by-1) |
| 3 | initialAmountMinor not edited after create; size-change path for adjustments (D-03) | ✓ VERIFIED | Schema: `Debt.initialAmountMinor` + `DebtSizeChange.deltaMinor`, no writeOff/forgive column; `assertInitialImmutable` throws on proposed ≠ stored; `updateDebtMetaSchema` has no initial amount fields (Zod test) |
| 4 | No debt-module imports in net-worth.ts, historical-series.ts, or `/` page (DISOL-01) | ✓ VERIFIED | DISOL-01 describe in `debts.test.ts` (3 files); ripgrep confirms no `@/lib/debts` / `./debts` imports; credit-account `debt*` symbols in NW are unrelated FIAT_CREDIT math |
| 5 | statusForRemaining: 0n → CLOSED, >0 → OPEN; assertStatusSynced; negative throws (D-12/D-13) | ✓ VERIFIED | Implementation + Vitest status/desync cases |
| 6 | Illegal size-downs / zero delta rejected; no clamp of negative remaining in helpers (D-05/D-15) | ✓ VERIFIED | `assertSizeDelta` tests (0, illegal down, exact boundary); `remainingMinor` returns raw principal−paid with no clamp; asserts throw instead |
| 7 | computeDebtPrimaryTotals: OPEN-only, FX honesty (isPartial), iOwe/theyOwe aggregates (D-16–D-19) | ✓ VERIFIED | Implementation uses `convertOtherMinorToPrimaryMinor` from `@/lib/money` (not net-worth); Vitest OPEN filter, primary identity, no_fx exclusion, mixed aggregates |
| 8 | Phase-9-ready Zod shapes without initial-mutation path; full suite green | ✓ VERIFIED | `src/lib/validations/debts.ts` exports create/update/event schemas; validations tests + `npm test` 196/196 pass |

**Score:** 8/8 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `prisma/schema.prisma` | Person, Debt, DebtRepayment, DebtSizeChange; enums; Restrict/Cascade; BigInt money | ✓ VERIFIED | Models + `DebtDirection`/`DebtStatus`; no Float/writeOff/closedAt; Currency.debts back-ref |
| `prisma/migrations/20260904180755_debts_schema/migration.sql` | debts_schema SQL with RESTRICT/CASCADE FKs | ✓ VERIFIED | ON DELETE RESTRICT Person/Currency→Debt; CASCADE Debt→events; no event (debtId, asOfDate) unique |
| `src/lib/debts.ts` | Pure remaining/status/asserts/totals | ✓ VERIFIED | No Prisma import; BigInt-only; money convert import only |
| `src/lib/debts.test.ts` | Formula, asserts, totals, DISOL, schema greps | ✓ VERIFIED | Substantive Vitest coverage; no skip/todo |
| `src/lib/foundation.test.ts` | Debt tables + debts_schema migration allow-list | ✓ VERIFIED | Person/Debt/DebtRepayment/DebtSizeChange + migration name assert |
| `src/lib/validations/debts.ts` | Zod person/debt/event contracts | ✓ VERIFIED | strict objects; shape-only; no initial on update meta |
| `src/lib/validations/debts.test.ts` | Accept/reject + Russian date message | ✓ VERIFIED | «Укажите дату»; no initial fields on update |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `src/lib/debts.ts` | CONTEXT D-04 | `remainingMinor` / `currentPrincipalMinor` | ✓ WIRED | Sum formula matches D-04 |
| `prisma/schema.prisma` | Person/Debt/event FKs | `onDelete` Restrict/Cascade | ✓ WIRED | Schema + migration SQL |
| `src/lib/debts.test.ts` | NW isolation targets | DISOL-01 `readFileSync` scan | ✓ WIRED | Pattern + tests pass |
| `assertRepaymentAmount` | ledger remaining | `remainingBefore` arg | ✓ WIRED | Manual: throws when amount > remainingBefore |
| `computeDebtPrimaryTotals` | `convertOtherMinorToPrimaryMinor` | non-primary OPEN FX | ✓ WIRED | Import + `toPrimaryMinor` call (codegraph callers) |
| `assertInitialImmutable` | `Debt.initialAmountMinor` | domain gate | ✓ WIRED | Throws on proposed ≠ stored |
| `src/lib/validations/debts.ts` | `balance.ts` asOfDate pattern | YYYY-MM-DD + «Укажите дату» | ✓ WIRED | Same regex/message pattern |
| Zod shapes | `debts.ts` asserts | shape vs remaining split | ✓ WIRED | Zod has no remaining/over-repay checks |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `remainingMinor` | principal / paid | Pure bigint inputs (caller-supplied ledger sums) | Yes — deterministic sums | ✓ FLOWING |
| `computeDebtPrimaryTotals` | aggregates / rows | Caller-resolved rates + OPEN filter | Yes — converts or excludes | ✓ FLOWING |
| Zod schemas | majors / dates | Form strings (future actions) | Shape parse only — no mock | ✓ FLOWING |

Phase 8 is pure domain + schema — no UI data path yet (by design).

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Full suite | `npm test` | 21 files, 196 tests passed | ✓ PASS |
| DISOL-01 | `npx vitest run -t "DISOL-01"` | 3 passed | ✓ PASS |
| Over-repay asserts | `npx vitest run -t "assertRepaymentAmount"` | 3 passed | ✓ PASS |
| Debts + validations + foundation | `npx vitest run src/lib/debts.test.ts src/lib/validations/debts.test.ts src/lib/foundation.test.ts` | 54 passed | ✓ PASS |
| Host migrate | `DATABASE_URL=file:./data/wallet.db npx prisma migrate status` | Database schema is up to date; debts tables present | ✓ PASS |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No phase-declared `scripts/*/tests/probe-*.sh` | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| DEBT-02 | 08-01, 08-02 | Remaining math (CONTEXT override: size-change ledger, not writeOff) | ✓ SATISFIED | `remainingMinor` + asserts + schema `DebtSizeChange` |
| DEBT-03 | 08-02, 08-03 | Initial immutable after create (CONTEXT: never edit; size-change path) | ✓ SATISFIED | `assertInitialImmutable` + Zod update-meta omission |
| DISOL-01 | 08-01, 08-03 | Debts never change NW / no NW coupling | ✓ SATISFIED | DISOL-01 source scan green; no debt imports in NW paths |

**Orphaned requirements:** none — REQUIREMENTS maps DEBT-02, DEBT-03, DISOL-01 to Phase 8; all claimed by plans.

**Note:** REQUIREMENTS.md still shows stale writeOff wording; CONTEXT D-01–D-04 is authoritative override and is what shipped.

### Decision Coverage

All trackable CONTEXT.md decisions are honored by shipped artifacts (24/24). Non-blocking gate.

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
| --------- | ---------- | ------ | ------- | -------- | --------------- | ------- |
| `src/lib/debts.test.ts` | DEBT-02, DEBT-03, DISOL-01 | many | 0 | 0 | Value / behavioral | PASS |
| `src/lib/validations/debts.test.ts` | DEBT-03 | many | 0 | 0 | Value | PASS |
| `src/lib/foundation.test.ts` | DEBT-02 (schema) | table/migration asserts | 0 | 0 | Value | PASS |

**Disabled tests on requirements:** 0
**Circular patterns detected:** 0
**Insufficient assertions:** 0

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No TBD/FIXME/XXX/TODO stubs in phase debt artifacts | — | — |

### Prohibitions

| Statement | Status | Evidence |
| --------- | ------ | -------- |
| MUST NOT import debts domain from NW / page | ✓ held | DISOL-01 tests |
| MUST NOT add forgive/writeOff column or WRITE_OFF kind | ✓ held | schema + migration greps |
| MUST NOT store closedAt on Debt | ✓ held | schema |
| MUST NOT @@unique (debtId, asOfDate) on events | ✓ held | schema + debts.test schema grep |
| MUST NOT clamp negative remaining in helpers | ✓ held | `remainingMinor` raw subtract |
| MUST NOT provide update-initial helper/Zod | ✓ held | assert + updateDebtMetaSchema |
| MUST NOT invent FX / silent 0 contribution | ✓ held | no_fx exclude + isPartial |
| MUST NOT put remaining rules in Zod | ✓ held | validations shape-only |

### Human Verification Required

N/A — Infrastructure/foundation phase (schema + pure domain math + Zod). No user-facing elements. All acceptance criteria verified programmatically (tests + migrate + source scans). No ⚠️ PRESENT_BEHAVIOR_UNVERIFIED truths.

### Gaps Summary

None. Phase goal achieved: size-change ledger schema migrated, pure remaining/status/assert/totals helpers locked with tests, Zod ready for Phase 9, NW isolation intact.

---

_Verified: 2026-09-04T16:30:19Z_
_Verifier: Claude (gsd-verifier)_
