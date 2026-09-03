---
phase: 04-dated-fx
verified: 2026-09-03T15:16:00Z
status: passed
score: 20/20 must-haves verified
behavior_unverified: 0
overrides_applied: 0
human_verification_approved: true
human_verification_note: "Plan 03 Russian UI smoke on /currencies/rates approved by user"
decision_coverage:
  honored: 17
  total: 17
  not_honored: []
---

# Phase 4: Dated FX Verification Report

**Phase Goal:** As a local Wallet user, I want to maintain dated exchange rates between the primary currency and other currencies, so that multi-currency amounts convert honestly as of any date (FX-01, FX-02).
**Verified:** 2026-09-03T15:16:00Z
**Status:** passed
**Re-verification:** No — initial verification

## User Flow Coverage (MVP Mode)

| Step | Expected | Evidence | Status |
|------|----------|----------|--------|
| Open Currencies area | Nav «Валюты» lands on `/currencies/rates`; tabs «Валюты» \| «Курсы» | `src/components/nav.tsx`, `src/app/currencies/layout.tsx` | ✓ VERIFIED |
| Set first dated rate | SetRateDialog → upsertFxRate → LOCF row with rate · на DD.MM.YYYY | `SetRateDialog.tsx`, `actions.ts`, `RateList.tsx`, `actions.test.ts` | ✓ VERIFIED |
| Honest empty state | «Нет курса» + «Задать первый курс»; no invented 0.00/1.00 | `RateList.tsx` LocfDisplay, `getRateAsOf` returns null | ✓ VERIFIED |
| Overwrite / backdate | Same-date upsert overwrites; older dates keep prior LOCF | `fx.test.ts` forward-effective + upsert tests; `upsertFxRate` compound unique | ✓ VERIFIED |
| View / delete history | Inline expand newest-first; confirm delete; empty after last | `RateList.tsx`, `rates/page.tsx`, `deleteFxRate` in `actions.ts` | ✓ VERIFIED |
| Multi-currency honesty as of any date | `getRateAsOf` LOCF ≤ D; `convertOtherMinorToPrimaryMinor` truncating BigInt math | `src/lib/fx.ts`, `fx.test.ts`, `money.test.ts` | ✓ VERIFIED |

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can set a dated primary↔other exchange rate (FX-01 / SC1) | ✓ VERIFIED | `upsertFxRate` + `SetRateDialog` wired via `useActionState`; `actions.test.ts` upsert cases pass |
| 2 | Conversion as of date D uses latest rate with effective date ≤ D (FX-02 / SC2) | ✓ VERIFIED | `getRateAsOf` uses `asOfDate: { lte }` + `orderBy desc`; `fx.test.ts` LOCF table cases |
| 3 | User cannot create FX pairs that are not primary ↔ other (SC3) | ✓ VERIFIED | `upsertFxRate` rejects `isPrimary` with «Выберите валюту, отличную от основной»; rates page lists non-primary only |
| 4 | Rate changes apply forward without rewriting earlier as-of conversions (SC4) | ✓ VERIFIED | `fx.test.ts` "later insert leaves earlier as-of unchanged" |
| 5 | Before first rate, `getRateAsOf` returns null — never invents 0 or 1 (D-15) | ✓ VERIFIED | `fx.ts` JSDoc + `fx.test.ts` null assertion |
| 6 | Same (currencyCode, asOfDate) upsert overwrites `rateToPrimaryScaled` (D-11) | ✓ VERIFIED | `prisma.fxRate.upsert` on `currencyCode_asOfDate`; `fx.test.ts` overwrite mock |
| 7 | `rateToPrimaryScaled` stored at scale 8 BigInt (FX-01 precision) | ✓ VERIFIED | `RATE_SCALE_E8` in `money.ts`; schema `BigInt`; `actions.test.ts` expects `9050000000n` for "90.5" |
| 8 | `invertRateScaled` integer truncation; rejects ≤ 0n | ✓ VERIFIED | `money.ts` + `money.test.ts` |
| 9 | `convertOtherMinorToPrimaryMinor` truncating BigInt division | ✓ VERIFIED | `fx.ts` + `fx.test.ts` scale-2 examples |
| 10 | FxRate migrated; FxRateStub gone; unique `currencyCode_asOfDate` | ✓ VERIFIED | `prisma/schema.prisma`, migration `20260903140000_fx_rate`, `foundation.test.ts` |
| 11 | Currencies tabs «Валюты» \| «Курсы»; nav defaults to `/currencies/rates` (D-02/D-03) | ✓ VERIFIED | `layout.tsx`, `nav.tsx` href `/currencies/rates` |
| 12 | Future asOfDate rejected server-side «Дата не может быть в будущем» (D-08) | ✓ VERIFIED | `actions.ts` + `actions.test.ts` |
| 13 | Rate ≤ 0 rejected «Курс должен быть больше 0»; direction invert before persist (D-05/D-06/D-09) | ✓ VERIFIED | `actions.ts` + invert test in `actions.test.ts` |
| 14 | LOCF null → «Нет курса» + «Задать первый курс»; populated → secondary CTA (D-14/D-15) | ✓ VERIFIED | `RateList.tsx` LocfDisplay + conditional SetRateDialog variant |
| 15 | `rateToPrimaryScaled` serialized as string across RSC→client | ✓ VERIFIED | `rates/page.tsx` `.toString()` on BigInt props |
| 16 | Rate history expands inline, newest-first, delete only on history rows (D-10/D-12/D-13) | ✓ VERIFIED | `rates/page.tsx` `orderBy asOfDate desc`; `RateList.tsx` expand + `deleteFxRate`; no `deleteFxRate` in `SetRateDialog.tsx` |
| 17 | Delete confirm «Удалить курс за {date}? Это нельзя отменить.»; aria expand labels; 44×44 targets | ✓ VERIFIED | `RateList.tsx` `window.confirm`, `min-h-11 min-w-11`, aria-labels |
| 18 | History panel `bg-muted/40`; delete `variant="destructive"» | ✓ VERIFIED | `RateList.tsx` classes |
| 19 | No amount convert/preview calculator; no top-level `/fx` nav (D-17/D-01) | ✓ VERIFIED | No calculator UI in rates components; `nav.tsx` has no `/fx` |
| 20 | Russian UI smoke on `/currencies/rates` (Plan 03 checkpoint) | ✓ VERIFIED | User-approved human verification per orchestrator signal |

**Score:** 20/20 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `prisma/schema.prisma` | FxRate model + unique; stub removed | ✓ VERIFIED | `model FxRate` with `@@unique currencyCode_asOfDate`; no `FxRateStub` |
| `prisma/migrations/20260903140000_fx_rate/migration.sql` | DROP stub CREATE FxRate | ✓ VERIFIED | Migration SQL present |
| `src/lib/fx.ts` | getRateAsOf, convertOtherMinorToPrimaryMinor | ✓ VERIFIED | Exports both; awaits `ensureSqlitePragmas` |
| `src/lib/money.ts` | parseRateToScaled, formatRateScaled, invertRateScaled | ✓ VERIFIED | All exported beside `RATE_SCALE_E8` |
| `src/lib/validations/fx.ts` | setFxRateSchema, deleteFxRateSchema | ✓ VERIFIED | Zod strict schemas with Russian messages |
| `src/app/currencies/actions.ts` | upsertFxRate, deleteFxRate | ✓ VERIFIED | Both exported and tested |
| `src/app/currencies/rates/page.tsx` | RSC LOCF + history batch | ✓ VERIFIED | `calendarDateToday("Europe/Moscow")`, history desc |
| `src/components/currencies/RateList.tsx` | LOCF rows + expand/delete | ✓ VERIFIED | Wired to `deleteFxRate` |
| `src/components/currencies/SetRateDialog.tsx` | Set-rate dialog | ✓ VERIFIED | `useActionState(upsertFxRate)` |
| `src/app/currencies/layout.tsx` | Валюты \| Курсы tabs | ✓ VERIFIED | Link tabs with exact-path active |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `SetRateDialog.tsx` | `upsertFxRate` | `useActionState` + FormData | ✓ WIRED | `form action={formAction}` with hidden fields |
| `rates/page.tsx` | LOCF batch | `findMany` lte today + first-per-code | ✓ WIRED | `locfByCurrency` Map |
| `upsertFxRate` | `prisma.fxRate.upsert` | `currencyCode_asOfDate` | ✓ WIRED | Compound unique upsert in `actions.ts` |
| `nav.tsx` | `/currencies/rates` | href + prefix active | ✓ WIRED | `href: "/currencies/rates"` |
| History «Удалить курс» | `deleteFxRate` | FormData id + revalidate | ✓ WIRED | `RateList.tsx` `handleDelete` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `rates/page.tsx` | `locf` per currency | `prisma.fxRate.findMany` lte today | Yes — DB query | ✓ FLOWING |
| `rates/page.tsx` | `history` per currency | `prisma.fxRate.findMany` all rates desc | Yes — DB query | ✓ FLOWING |
| `RateList.tsx` | displayed rate | `formatRateScaled(BigInt(locf.rateToPrimaryScaled))` | Yes — from serialized DB value | ✓ FLOWING |
| `getRateAsOf` | rate row | `prisma.fxRate.findFirst` lte D | Yes — DB query | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Full test suite | `npm test` | 16 files, 110 tests passed | ✓ PASS |
| LOCF null before first rate | `npx vitest run src/lib/fx.test.ts -t "before first rate"` | Test passed | ✓ PASS |
| Future date server rejection | Covered in `actions.test.ts` via full suite | Passed | ✓ PASS |
| deleteFxRate revalidates paths | Covered in `actions.test.ts` via full suite | Passed | ✓ PASS |

### Probe Execution

Step 7c: SKIPPED — no phase-declared probes or `scripts/*/tests/probe-*.sh` for this phase.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| FX-01 | 04-01, 04-02, 04-03 | User can set a dated exchange rate between primary and another currency | ✓ SATISFIED | `upsertFxRate`, `SetRateDialog`, history overwrite/delete |
| FX-02 | 04-01, 04-02, 04-03 | Totals/charts as of D use latest rate with effective date ≤ D | ✓ SATISFIED | `getRateAsOf` LOCF helper + honest null display; `convertOtherMinorToPrimaryMinor` for Phase 5–6 |

### Prohibitions (Negative Checks)

| Prohibition | Status | Evidence |
|-------------|--------|----------|
| MUST NOT invent rate 0 or 1 when no FxRate (FX-02) | ✓ VERIFIED | `getRateAsOf` returns null; `RateList` shows «Нет курса» |
| MUST NOT keep FxRateStub after migration (FX-01) | ✓ VERIFIED | Migration drops stub; schema has only `FxRate` |
| MUST NOT store second rate column or direction in DB (FX-01) | ✓ VERIFIED | Schema has single `rateToPrimaryScaled`; direction UX-only |
| MUST NOT create FxRate rows for primary currency (FX-01) | ✓ VERIFIED | Server rejects `isPrimary` |
| MUST NOT add top-level `/fx` nav (FX-01) | ✓ VERIFIED | No `/fx` in `nav.tsx` |
| MUST NOT put delete in SetRateDialog (FX-01) | ✓ VERIFIED | `grep deleteFxRate SetRateDialog.tsx` — no matches |
| MUST NOT show amount calculator on rates tab (FX-02) | ✓ VERIFIED | No convert/preview UI in rates components |
| MUST NOT mark history row as current/latest badge (FX-02) | ✓ VERIFIED | No badge/latest marker in `RateList.tsx` |

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| `src/lib/fx.test.ts` | FX-02 | 7 | 0 | No | Behavioral (LOCF table) | PASS |
| `src/lib/money.test.ts` | FX-01 | 4+ | 0 | No | Value | PASS |
| `src/lib/validations/fx.test.ts` | FX-01 | 6+ | 0 | No | Value | PASS |
| `src/app/currencies/actions.test.ts` | FX-01 | 14 | 0 | No | Behavioral | PASS (duplicate `deleteFxRate` describe block — info only) |
| `src/components/currencies/SetRateDialog.test.ts` | FX-01 | 5 | 0 | No | Structural grep | PASS |

**Disabled tests on requirements:** 0
**Circular patterns detected:** 0
**Insufficient assertions:** 0 blockers (SetRateDialog tests are structural; server paths have behavioral tests)

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `src/app/currencies/actions.test.ts` | 253–347 | Duplicate `describe("deleteFxRate")` block | ℹ️ Info | Tests still pass; redundant coverage |

### Decision Coverage

All trackable CONTEXT.md decisions are honored by shipped artifacts (17/17).

### Human Verification Required

Plan 03 checkpoint «Russian UI smoke on /currencies/rates» — **approved by user** (orchestrator signal). Covers visual/locale confirmation of tabs, LOCF display, direction toggle, history expand/delete, and prohibition compliance (no invented rates, no calculator).

## Gaps Summary

No gaps found. Phase 4 delivers the dated FX data contract (FxRate + LOCF helpers), set-rate UI under Currencies, and expandable history with delete. All 110 automated tests pass. FX-01 and FX-02 requirements satisfied in codebase with behavioral test evidence for core LOCF and server-action paths.

---

_Verified: 2026-09-03T15:16:00Z_
_Verifier: Claude (gsd-verifier)_
