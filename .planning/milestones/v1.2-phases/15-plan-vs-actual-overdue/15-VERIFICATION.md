---
phase: 15-plan-vs-actual-overdue
verified: 2026-09-07T17:44:45.064Z
status: passed
score: 3/3 must-haves verified
behavior_unverified: 0
overrides_applied: 0
decision_coverage:
  honored: 20
  total: 20
  not_honored: []
---

# Phase 15: Plan vs actual + overdue Verification Report

**Phase Goal:** User can fill facts against plans and see overdue + variance on «Доходы»
**Verified:** 2026-09-07T17:44:45.064Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

Roadmap success criteria (contract). Plan truths folded under these three; none reduce scope.

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | User can record actual amount and actual date independently; plan fields stay for variance | ✓ VERIFIED | Zod actual schemas + `upsertRecurringIncomeActual` / `upsertOneTimeIncomeActual` write only actual columns (`amountMinor`/`actualAsOf`/`note`); compound unique on `plannedAsOf` slot. Named vitest green. Orca: fact dialog RO plan fields, save advances recurring next-open 15.09→15.10 |
| 2 | When planned date is before Moscow today and no actual exists, occurrence shows overdue «заполни» | ✓ VERIFIED | `page.tsx` maps `overdue: isIncomeOverdue(...)`; `IncomeList` warning chip + primary «Заполни». `isIncomeOverdue` unit tests pass. Orca: past one-time showed badge «заполни» + CTA «Заполни»; future next-open showed calm «Внести факт» only |
| 3 | User can see plan vs actual variance (view/chart) on «Доходы» | ✓ VERIFIED | ACT-03 MVP = **inline view** (CONTEXT D-12; Recharts deferred to Future). `incomeVarianceMinor`/`Phrase` wired in list + live dialog «Отклонение». Orca: dialog `+5 000 · больше плана`; filled one-time row `получено` + `факт 10 000` + `Δ −2 000 меньше плана` |

**Score:** 3/3 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `src/lib/validations/income.ts` | Actual Zod schemas | ✓ VERIFIED | upsert/delete recurring+one-time; positive major refine; `asOfDateSchema` YYYY-MM-DD only (no today cap) |
| `src/lib/validations/income.test.ts` | ACT-01 boundary tests | ✓ VERIFIED | Named schema tests pass |
| `src/app/income/actions.ts` | Actual CRUD actions | ✓ VERIFIED | Four actions; isolation `revalidatePath("/income")` only |
| `src/app/income/actions.test.ts` | Action mocks + isolation | ✓ VERIFIED | Named upsert/delete tests pass |
| `src/lib/income.ts` | Variance + overdue helpers | ✓ VERIFIED | `incomeVarianceMinor`/`Phrase`, `isIncomeOverdue`, `nextOpenPlannedAsOf` |
| `src/lib/income.test.ts` | Helper tests | ✓ VERIFIED | Variance + overdue suites pass |
| `src/app/income/page.tsx` | Actual join + overdue props | ✓ VERIFIED | Prisma actuals → `hasActual`/`overdue`/`actual*` |
| `src/components/income/IncomeFormDialog.tsx` | `IncomeRow` fact fields + definition edit | ✓ VERIFIED | Type extended; «Изменить» retained (D-20) |
| `src/app/globals.css` | Warning tokens | ✓ VERIFIED | `--warning` / `--warning-foreground` + `@theme` aliases |
| `src/components/income/IncomeFactDialog.tsx` | Fact create/edit/delete | ✓ VERIFIED | Dedicated dialog; live Δ; `DestructiveConfirmStep` |
| `src/components/income/IncomeList.tsx` | Overdue + variance chrome | ✓ VERIFIED | Badge/CTAs/получено/Δ; mounts `IncomeFactDialog` |
| `src/components/income/income-ui.test.ts` | UI file-scan guards | ✓ VERIFIED | Labels, warning vs destructive, no recharts/confirm |

**Artifacts:** 12/12 verified (gsd `verify.artifacts` all_passed for plans 01–03)

### Key Link Verification

gsd `verify.key-links` returned false (PLAN `from:` not file paths). Manual wiring via codegraph + source:

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `upsertRecurringIncomeActualSchema` | `upsertRecurringIncomeActual` | Zod safeParse → `parseMajorToMinor` | ✓ WIRED | actions.ts:514–590; unique `recurringIncomeId_plannedAsOf` |
| `page.tsx` actuals | `IncomeRow.hasActual`/`overdue` | `isIncomeOverdue(next, hasActual, today)` | ✓ WIRED | page.tsx:67–119; codegraph callers of `isIncomeOverdue` = IncomePage |
| `nextOpenPlannedAsOf` | recurring next-open join | match `actual.plannedAsOf === next` | ✓ WIRED | page.tsx:68–80 |
| `upsertOneTimeIncomeActual` | `oneTimeIncomeId_plannedAsOf` | assert `plannedAsOf === definition.plannedAsOf` | ✓ WIRED | actions.ts:644–695 |
| `IncomeList` overdue gate | `IncomeFactDialog` CTAs | Заполни / Внести факт / Изменить факт | ✓ WIRED | IncomeList.tsx:89–147 |
| `IncomeFactDialog` | upsert/delete actions | `useActionState` + `DestructiveConfirmStep` | ✓ WIRED | codegraph: FactDialog imports actions; delete confirm step |
| one-time `hasActual` row | `incomeVarianceMinor` + phrase | inline plan/actual/Δ | ✓ WIRED | IncomeList.tsx:65–143; Orca showed Δ |

**Wiring:** 7/7 manually verified

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `page.tsx` | `hasActual`/`overdue`/`actual*` | Prisma `actuals` include + `isIncomeOverdue` | Yes — DB rows | ✓ FLOWING |
| `IncomeList` | variance chrome | `actualAmountMinor` props → helpers | Yes — after fact save | ✓ FLOWING |
| `IncomeFactDialog` | live Отклонение | typed major → `parseMajorToMinor` → variance | Yes — Orca live preview | ✓ FLOWING |
| Actual upsert | `amountMinor` | FormData → Zod → parent `currency.scale` | Yes — Prisma upsert | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Recurring actual upsert | `npx vitest run -t "upsertRecurringIncomeActual" src/app/income/actions.test.ts` | 3 passed | ✓ PASS |
| One-time actual upsert | `npx vitest run -t "upsertOneTimeIncomeActual" ...` | 3 passed | ✓ PASS |
| Variance helpers | `npx vitest run -t "incomeVarianceMinor" src/lib/income.test.ts` | 2 passed | ✓ PASS |
| Overdue predicate | `npx vitest run -t "isIncomeOverdue" ...` | 5 passed | ✓ PASS |
| UI chrome labels | `npx vitest run -t "overdue badge" src/components/income/income-ui.test.ts` | 1 passed | ✓ PASS |
| Zod future actualAsOf | `npx vitest run -t "upsertRecurringIncomeActualSchema" ...` | 4 passed | ✓ PASS |
| Orca UAT /income | `orca-ide` tab + snapshot/click/fill | Fact save, overdue chrome, Δ row | ✓ PASS |

Full suite claimed green pre-verify (358). Spot-checks only — suite not re-run.

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No phase probes declared; no `scripts/*/tests/probe-*.sh` | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| ACT-01 | 15-01, 15-02 | Record actual amount/date; plan stays | ✓ SATISFIED | Actions + Zod + Orca fact dialog |
| ACT-02 | 15-02, 15-03 | Overdue «заполни» when plan &lt; Moscow today, no actual | ✓ SATISFIED | Page join + list chrome + Orca |
| ACT-03 | 15-01, 15-03 | Plan vs actual variance on «Доходы» | ✓ SATISFIED | Inline MVP (D-12); helpers + list/dialog + Orca |

No orphaned Phase 15 requirements outside ACT-01..03.

### Prohibitions (judgment)

| Statement | Verdict | Evidence |
| --------- | ------- | -------- |
| MUST NOT mutate plan amount/date in actual upsert | ✓ | update payload = amountMinor/actualAsOf/note only |
| MUST NOT reject future actualAsOf | ✓ | `asOfDateSchema` date-only; tests allow future |
| MUST NOT FX-convert variance | ✓ | `actual - plan` bigint helpers; no FX imports |
| MUST NOT install new npm packages | ✓ | SUMMARY tech-stack.added: []; no Badge package |
| MUST NOT BalanceSnapshot / revalidate `/` | ✓ | isolation file-scan test + source |
| MUST NOT Recharts on /income | ✓ | income-ui test + grep clean |
| MUST NOT destructive overdue chrome | ✓ | `bg-warning/15` + test ban near `заполни` |
| MUST NOT native confirm for delete actual | ✓ | DestructiveConfirmStep only |
| MUST NOT multi-slot history / nav overdue badge | ✓ | list = next-open only; no nav badge |

### Decision Coverage

All trackable CONTEXT.md decisions are honored by shipped artifacts. (20/20)

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| `actions.test.ts` | ACT-01 | yes | 0 | no | Value/behavioral (mocks) | OK |
| `validations/income.test.ts` | ACT-01 | yes | 0 | no | Value | OK |
| `income.test.ts` | ACT-02/03 | yes | 0 | no | Value | OK |
| `income-ui.test.ts` | ACT-02/03 | yes | 0 | no | Existence (file-scan) | OK — UAT covers UI behavior |

**Disabled tests on requirements:** 0
**Circular patterns detected:** 0
**Insufficient assertions:** 0 blockers (UI file-scans supplemented by Orca UAT)

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No TBD/FIXME/XXX in phase source | — | — |
| `IncomeFactDialog.tsx` | 78,86 | `return null` in liveVariance | ℹ️ Info | Guard for invalid/non-positive parse — not a stub |

### Human Verification Required

N/A — agent-driven Orca UAT per `.planning/OPERATOR.md` exercised user-facing flows; no residual human items.

UAT observations (agent):
1. Calm future slot → «Внести факт», no badge
2. Past unfilled one-time → «заполни» + «Заполни»
3. Fact dialog RO plan + defaults + live Отклонение
4. Save advances recurring next-open; filled one-time shows получено + Δ
5. Definition «Изменить» still on rows

### Gaps Summary

None. Phase goal achieved.

---

_Verified: 2026-09-07T17:44:45.064Z_
_Verifier: Claude (gsd-verifier)_
