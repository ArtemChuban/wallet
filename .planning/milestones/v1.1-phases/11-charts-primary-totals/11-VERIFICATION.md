---
phase: 11-charts-primary-totals
verified: 2026-09-06T16:34:33Z
status: passed
score: 14/17 must-haves verified
behavior_unverified: 0
overrides_applied: 0
decision_coverage:
  honored: 14
  total: 14
  not_honored: []
gaps: []
behavior_unverified_items: []
human_verification:

  - test: "Open debt detail → «История» — confirm one stacked chart only (Погашено + Остаток), no second chart and no «Графики» tab"
    expected: "Single stepAfter stack above timeline; tabs stay Погашение / size / forgive / История"
    why_human: "Backstop truth (no second chart surface) — presence/grep cannot prove absence of a product surface at runtime"
  - test: "Hover chart tooltip; confirm Погашено/Остаток text only (no HTML/note injection)"
    expected: "Plain-text labels and formatted numbers only"
    why_human: "Backstop XSS/tooltip honesty — no automated XSS assertion wired"
  - test: "Visit /debts with zero people/debts — hero still shows Я должен / Мне должны as 0 primary"
    expected: "Hero always visible with 0 / 0 in primary code"
    why_human: "Backstop empty-page hero — unit suite does not render RSC page empty state"
  - test: "Create debt with past openedAsOf; repay; open История — stack steps and stays native (no FX conversion)"
    expected: "Series starts on openedAsOf; repaid rises / remaining falls; amounts match debt currency majors"
    why_human: "Visual/user-flow confirmation of chart UX beyond unit series math"
  - test: "With OPEN non-primary debt missing FX, /debts shows «Итог неполный» naming that debt; Капитал banner lists excluded accounts with нет баланса/нет курса"
    expected: "Partial honesty lists match excluded rows; NW hero unchanged by debts"
    why_human: "End-to-end FX/UI honesty needs live DB rates and visual check"
---

# Phase 11: Charts + primary totals Verification Report

**Phase Goal:** Debt detail charts (native) and section-level primary totals with FX honesty.
**Verified:** 2026-09-06T16:34:33Z
**Status:** human_needed
**Re-verification:** No — initial verification

**Product lock (honored):** One stacked principal chart (`repaidMajor` + `remainingMajor`) in «История» satisfies DCHART-01 + DCHART-02. Older ROADMAP wording about separate remaining + repayment charts is superseded by CONTEXT D-03 / PLAN must_haves.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | Debt create requires calendar `openedAsOf` (YYYY-MM-DD); series/chart start from that date, not wall-clock `createdAt` alone | ✓ VERIFIED | `Debt.openedAsOf` in schema; Moscow backfill migration `20260906161000_debt_opened_as_of`; create Zod requires field; `buildDebtPrincipalStackSeries` seeds at `openedAsOf`; vitest green |
| 2 | «История» shows one stacked chart (`repaidCumulative`/`repaidMajor` + `remaining`/`remainingMajor` = principal) above timeline | ✓ VERIFIED | `DebtPrincipalStackChart` two Areas `stackId="principal"`; mounted first in history tabpanel `DebtDetailDialog.tsx`; series tests assert repaid+remaining |
| 3 | With no events, chart flat from `openedAsOf` to today Europe/Moscow at initial remaining | ✓ VERIFIED | `buildDebtPrincipalStackSeries` open→today flat case in `src/lib/debts.test.ts` (PASS) |
| 4 | Chart series uses native majors only — primary FX not applied to stack points | ✓ VERIFIED | Series uses `minorToMajorNumber` only; chart/series have no LOCF/FX imports; comment “No FX” |
| 5 | Debt chart lives only in existing «История» tab — no second chart surface / no «Графики» tab | ⚠️ insufficient_spec | Single mount + no «Графики» grep; backstop requires held-out/observed proof — see Human Verification |
| 6 | NW math and historical-series builders stay free of debt-domain imports | ✓ VERIFIED | `src/lib/disol.test.ts` import-ban PASS; greps clean on `net-worth.ts` / `historical-series.ts` |
| 7 | Open date immutable after create — edit UI non-writable; update never writes `openedAsOf` | ✓ VERIFIED | Create-only input vs read-only display in `DebtFormDialog`; `updateDebtMetaSchema` omits field + `.strict()`; actions.test smuggle case PASS |
| 8 | Chart remains single stacked `stepAfter` Areas; no RangePreset chrome | ✓ VERIFIED | Both Areas `type="stepAfter"`; no RangePreset/30д/90д/1г in chart file |
| 9 | Empty timeline still shows flat open→today chart above «Пока нет событий» | ✓ VERIFIED | Chart always rendered before `timeline.length === 0` branch; empty copy after chart |
| 10 | Size-change events change stack height only — no third Area series | ✓ VERIFIED | Series size-change tests PASS; chart has exactly two Areas |
| 11 | Tooltip/labels plain text Погашено/Остаток without HTML note injection | ⚠️ insufficient_spec | Tooltip is text nodes in code; backstop — no XSS/security test — see Human Verification |
| 12 | `/debts` header always shows «Я должен» \| «Мне должны» in primary (incl. zeros) | ✓ VERIFIED | `DebtsPrimaryTotalsHero` unconditional on page; columns + primary code present |
| 13 | Totals use `computeDebtPrimaryTotals` on OPEN debts with LOCF `rateToPrimaryScaled` as-of today Europe/Moscow | ✓ VERIFIED | Page builds LOCF map + inputs; helper OPEN-only + FX exclude; `computeDebtPrimaryTotals` vitest PASS |
| 14 | When `isPartial`, banner «Итог неполный» + excluded-debt list with currency/reason | ✓ VERIFIED | Hero partial path lists person/currency/`нет курса`; excluded rows from `includedInTotal === false` |
| 15 | Hero remains visible on empty people/debts page with 0 / 0 primary amounts | ⚠️ insufficient_spec | Code mounts hero unconditionally; backstop empty-page runtime not covered by tests — see Human Verification |
| 16 | Капитал partial banner lists excluded accounts with reason (нет баланса / нет курса) | ✓ VERIFIED | `src/app/page.tsx` ul from `!includedInTotal` with reason copy |
| 17 | `/` does not import `@/lib/debts`; debts never enter `computeNetWorthRows` / historical-series; `net-worth.test.ts` green | ✓ VERIFIED | disol + net-worth vitest PASS; page has no debts import |

**Score:** 14/17 truths verified (0 present-behavior-unverified; 3 backstop insufficient_spec)

### Roadmap Success Criteria (reinterpreted per product lock)

| # | Roadmap SC | Mapped truth | Status |
| --- | ---------- | ------------ | ------ |
| 1 | Remaining-over-time in debt currency | Stack `remainingMajor` layer (#2/#4) | ✓ VERIFIED |
| 2 | Repayment-amounts chart | Stack `repaidMajor` layer — not separate chart (#2) | ✓ VERIFIED |
| 3 | `/debts` I-owe / they-owe + partial banner | #12–#14 | ✓ VERIFIED |
| 4 | Капитал NW unchanged when debts exist | #6/#16/#17 | ✓ VERIFIED |

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `prisma/schema.prisma` | `Debt.openedAsOf` required | ✓ VERIFIED | Field present |
| `prisma/migrations/…debt_opened_as_of/` | Backfill migration | ✓ VERIFIED | Moscow `+3 hours` strftime backfill |
| `src/lib/debts.ts` | `buildDebtPrincipalStackSeries` | ✓ VERIFIED | Substantive native series |
| `src/components/debts/DebtPrincipalStackChart.tsx` | Client stacked stepAfter chart | ✓ VERIFIED | Wired to series builder |
| `src/components/debts/DebtDetailDialog.tsx` | Chart-first История | ✓ VERIFIED | Mount + order |
| `src/components/debts/DebtFormDialog.tsx` | Create-only Дата | ✓ VERIFIED | Edit read-only |
| `src/app/debts/actions.ts` | Persist create; never update openedAsOf | ✓ VERIFIED | update data omits field |
| `src/app/debts/page.tsx` | LOCF + totals + hero | ✓ VERIFIED | Flowing |
| `src/components/debts/DebtsPrimaryTotalsHero.tsx` | Columns + partial list | ✓ VERIFIED | Substantive |
| `src/app/page.tsx` | Excluded-account list | ✓ VERIFIED | D-14 |
| `src/lib/disol.test.ts` | DISOL-01 import scan | ✓ VERIFIED | PASS |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `DebtDetailDialog.tsx` | `DebtPrincipalStackChart.tsx` | history tabpanel chart-first | ✓ WIRED | Import + render before timeline |
| `DebtPrincipalStackChart.tsx` | `src/lib/debts.ts` | `buildDebtPrincipalStackSeries` | ✓ WIRED | Client calls builder with props |
| `actions.ts` | `validations/debts.ts` | create `openedAsOf` | ✓ WIRED | FormData → schema → Prisma create |
| `DebtFormDialog.tsx` | create vs update schemas | create-only `openedAsOf` | ✓ WIRED | `name="openedAsOf"` only in create branch |
| `DebtPrincipalStackChart.tsx` | `chart.tsx` | ChartContainer + ChartTooltip | ✓ WIRED | Text tooltip content |
| `debts/page.tsx` | `computeDebtPrimaryTotals` | LOCF then helper | ✓ WIRED | Real Prisma FX + debts |
| `debts/page.tsx` | `DebtsPrimaryTotalsHero` | formatted props | ✓ WIRED | Unconditional render |
| `page.tsx` | `net-worth.ts` | `isPartial` / excluded rows | ✓ WIRED | List from `!includedInTotal` |
| `disol.test.ts` | NW modules | import-ban assertions | ✓ WIRED | File reads + expects |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| Stack chart | `data` points | `buildDebtPrincipalStackSeries` from debt props | Ledger repayments/sizeChanges + openedAsOf | ✓ FLOWING |
| `/debts` hero | `iOweDisplay` / `theyOweDisplay` | Prisma debts + LOCF rates → `computeDebtPrimaryTotals` | OPEN aggregates | ✓ FLOWING |
| Partial debt list | `excludedDebts` | totals rows `!includedInTotal` + person/currency join | Real exclude reasons | ✓ FLOWING |
| Капитал excluded list | `excludedAccounts` | `computeNetWorthRows` `!includedInTotal` | Account name/currency/reason | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Stack series suite | `npx vitest run src/lib/debts.test.ts -t buildDebtPrincipalStackSeries` | PASS (6) | ✓ PASS |
| openedAsOf immutability | `npx vitest run src/app/debts/actions.test.ts -t openedAsOf` | PASS (1) | ✓ PASS |
| DISOL isolation | `npx vitest run src/lib/disol.test.ts` | PASS (4) | ✓ PASS |
| Phase regression bundle | `npx vitest run src/lib/debts.test.ts src/lib/validations/debts.test.ts src/app/debts/actions.test.ts src/lib/disol.test.ts src/lib/net-worth.test.ts` | PASS (114) FAIL (0) | ✓ PASS |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No phase probes declared | SKIPPED |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| DCHART-01 | 11-01, 11-02 | Remaining-balance-over-time in debt currency | ✓ SATISFIED | Stack `remainingMajor` native series + chart |
| DCHART-02 | 11-01, 11-02 | Repayment-amounts chart | ✓ SATISFIED | Stack `repaidMajor` layer (CONTEXT one-chart lock) |
| DTOTAL-01 | 11-03 | I-owe / they-owe primary + partial banner | ✓ SATISFIED | Hero + LOCF + excluded list |
| DISOL-01 | 11-01, 11-04 | Debts never change NW / NW charts | ✓ SATISFIED | disol import bans + no debts on `/` math |

No orphaned Phase 11 requirement IDs — all four accounted for in PLAN frontmatter and REQUIREMENTS.md.

### Decision Coverage

All trackable CONTEXT.md decisions honored by shipped artifacts (14/14). Gate non-blocking.

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| `src/lib/debts.test.ts` | DCHART-01/02, DTOTAL-01 | yes | 0 | no | Value/behavioral series + totals | PASS |
| `src/lib/validations/debts.test.ts` | DCHART (D-08/D-09) | yes | 0 | no | Value (Zod shape/strict) | PASS |
| `src/app/debts/actions.test.ts` | D-09 | yes | 0 | no | Behavioral (Prisma data omit) | PASS |
| `src/lib/disol.test.ts` | DISOL-01 | yes | 0 | no | Value (import-ban scan) | PASS |
| `src/lib/net-worth.test.ts` | DISOL-01 | yes | 0 | no | Value (NW math regression) | PASS |

**Disabled tests on requirements:** 0
**Circular patterns detected:** 0
**Insufficient assertions:** 0 blockers (UI backstops flagged separately as insufficient_spec)

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No TBD/FIXME/XXX/TODO stubs in phase key files | — | — |

### Prohibitions

| Statement | Enforcement evidence | Flag |
| --------- | -------------------- | ---- |
| MUST NOT add second debt chart / new chart tab | Single chart mount; no «Графики» | flagged — human confirm (judgment/backstop) |
| MUST NOT convert debt chart through primary FX | Series native-only code path | clear in code |
| MUST NOT import debts into historical-series/net-worth/`page.tsx` | `disol.test.ts` PASS | enforced |
| MUST NOT change `computeNetWorthRows` math | net-worth suite green; banner list-only | enforced |
| MUST NOT expose editable openedAsOf on edit | form + schema + action tests | enforced |
| MUST NOT add RangePreset on debt chart | grep clean on chart file | clear in code |
| MUST NOT add third stack series | two Areas only; series tests | enforced |
| MUST NOT hide hero when totals zero | unconditional hero render | clear in code |
| MUST NOT `revalidatePath('/')` from debts totals wiring | debts page has no revalidate; actions use `/debts` | clear in code |
| MUST NOT include CLOSED in primary aggregates | helper OPEN filter + tests | enforced |
| MUST NOT list personal debts on Капитал banner | account-only excluded list | clear in code |

### Human Verification Required

### 1. Single chart surface (backstop)

**Test:** Open debt detail → «История» — confirm one stacked chart only; no «Графики» tab.
**Expected:** One stepAfter stack (Погашено + Остаток) above timeline.
**Why human:** Backstop absence-of-surface cannot be certified by presence checks alone.

### 2. Tooltip honesty (backstop)

**Test:** Hover chart points; inspect tooltip content.
**Expected:** Plain «Погашено» / «Остаток» text + numbers; no HTML/note injection.
**Why human:** No automated XSS assertion.

### 3. Empty `/debts` hero (backstop)

**Test:** Open `/debts` with no people/debts (or after clearing).
**Expected:** Hero still shows 0 / 0 in primary for both columns.
**Why human:** RSC empty-state not covered by unit tests.

### 4. Chart user flow

**Test:** Create past-dated debt, repay, view История.
**Expected:** Series starts on open date; stack steps correctly in native currency.
**Why human:** Visual/UX confirmation beyond unit math.

### 5. Partial honesty parity

**Test:** Missing FX on OPEN debt → `/debts` banner; excluded accounts on Капитал.
**Expected:** Named exclusions with currency/reason; NW figures ignore debts.
**Why human:** Needs live FX/DB state and visual check.

### Gaps Summary

No implementation gaps found. Goal delivered in codebase: native stacked debt chart in «История», `/debts` primary hero + FX honesty, Капитал excluded-account list, DISOL isolation locked by tests. Status is `human_needed` solely for backstop/visual UAT items — not for missing code.

---

_Verified: 2026-09-06T16:34:33Z_
_Verifier: Claude (gsd-verifier)_
