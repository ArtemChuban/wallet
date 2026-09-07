---
phase: 16-counterparty-income-stats
verified: 2026-09-07T19:08:00Z
status: passed
score: 11/11 must-haves verified
behavior_unverified: 0
overrides_applied: 1
decision_coverage:
  honored: 15
  total: 15
  not_honored: []
human_verification: []
uat_resolution: "16-UAT.md — SSR agent UAT pass; Orca skipped (runtime_open_timeout)"
---

# Phase 16: Counterparty income stats Verification Report

**Phase Goal:** User can see how much income came from each Person in primary currency (hybrid: native always + primary via FX LOCF as-of actualAsOf; partial honesty)
**Verified:** 2026-09-07T19:08:00Z
**Status:** passed
**Re-verification:** Yes — human_needed cleared via 16-UAT.md (SSR agent UAT; Orca skipped)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | User can view per-Person income totals on «Доходы» converted to primary via FX LOCF as-of (roadmap SC1) | ✓ VERIFIED | `computePersonIncomeStats` + page flatten/FxRate + SSR `/income` shows «за всё время» + native amount (e.g. `55 000 RUB`) |
| 2 | Missing FX rates surface partial honesty (excluded/incomplete), not invented rates or silent zeros (roadmap SC2) | ✓ VERIFIED | Helper: null LOCF → `isPartial` + `excludedFactCount`; vitest no_fx + mixed; never coerces null→0n rate; UI copy gated on `isPartial` |
| 3 | Person with ≥1 actual shows all-time native Σ + «за всё время» | ✓ VERIFIED | `IncomeList.tsx` header; SSR live; vitest counterparty stats |
| 4 | Stats Σ uses every Prisma actual (recurring+one-time), not next-open slot only | ✓ VERIFIED | `page.tsx` nested `for (a of *.actuals)`; list rows still `slotActual`; unit «≥2 actuals all-time» + merge |
| 5 | Primary conversion uses `locfRateAsOf` per fact `actualAsOf` — never today-only `firstHitLocfMap` | ✓ VERIFIED | codegraph callees → `locfRateAsOf`; no `firstHitLocfMap` in income path; vitest dual-rate Jan/Feb |
| 6 | Plan-only Person (0 actuals) — no stats digits | ✓ VERIFIED | Empty facts → empty Map; page omits `stats` when `!domainStats`; unit empty-map |
| 7 | No page-level «всего получено» / Debts hero / chart on `/income` | ✓ VERIFIED | page+list file-scan; no `DebtsPrimaryTotalsHero` / chart imports |
| 8 | Hybrid native (prominent) + primary (secondary) with identity-omit | ✓ VERIFIED | page `identityOmit`; list typography; SSR identity-omit for primary RUB; UI scans |
| 9 | Multi-currency: one native line per currency + one rolled primary | ✓ VERIFIED | `nativeByCurrency` sort asc; vitest multi-ccy; UI maps `nativeLines` |
| 10 | `isPartial` → «Итог неполный · нет курса» `role=status` per-group | ✓ VERIFIED | `IncomeList.tsx`; counterparty stats file-scan |
| 11 | REQUIREMENTS.md CPTY-01 hybrid wording @ actualAsOf (D-05) | ✓ VERIFIED | CPTY-01 line: hybrid native-first + primary LOCF @ actualAsOf + partial honesty |

**Score:** 11/11 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `src/lib/income.ts` | `computePersonIncomeStats` + types | ✓ VERIFIED | Exists, substantive, wired; codegraph callers: `IncomePage` |
| `src/lib/income.test.ts` | Wave 0 + green domain suite | ✓ VERIFIED | 7/7 `computePersonIncomeStats` + isolation green |
| `src/app/income/page.tsx` | Flatten all actuals + FxRate + stats props | ✓ VERIFIED | Facts from all actuals; `fxRate.findMany` lte max; attach serializable stats |
| `src/components/income/IncomeList.tsx` | PersonGroup hybrid chrome | ✓ VERIFIED | Window hint, native/primary, partial line |
| `src/components/income/income-ui.test.ts` | Counterparty stats file-scans | ✓ VERIFIED | 9/9 counterparty stats green |
| `.planning/REQUIREMENTS.md` | CPTY-01 hybrid sync | ✓ VERIFIED | Wording matches D-05 |
| `16-VALIDATION.md` | Wave 0 / nyquist map | ✓ VERIFIED | `wave_0_complete: true`, `nyquist_compliant: true` |

### Key Link Verification

gsd `verify.key-links` failed schema (`from:` not file paths) — manual wiring:

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `page.tsx` flatten actuals | `computePersonIncomeStats` | facts + rateRows + primaryScale | ✓ WIRED | L77–129 |
| `computePersonIncomeStats` | `locfRateAsOf` | per-fact `actualAsOf` then convert | ✓ WIRED | income.ts L406–418; codegraph callees |
| `PersonIncomeListItem.stats` | PersonGroup header | optional display when ≥1 actual | ✓ WIRED | IncomeList L219–247; SSR renders |
| `stats.isPartial` | partial line | «Итог неполный · нет курса» | ✓ WIRED | L241–246 |
| native lines → primary | identity-omit | single primary && !isPartial | ✓ WIRED | page L225–239 |
| REQUIREMENTS CPTY-01 | CONTEXT D-05 | hybrid wording | ✓ WIRED | REQUIREMENTS L23 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| page facts | `IncomeActualFactInput[]` | Prisma `recurringIncomes.actuals` / `oneTimeIncomes.actuals` | Yes | ✓ FLOWING |
| page rates | `rateRows` | `prisma.fxRate.findMany` asOfDate ≤ maxActualAsOf | Yes (skip if no facts) | ✓ FLOWING |
| stats map | `statsByPerson` | `computePersonIncomeStats` | Yes | ✓ FLOWING |
| list header | `person.stats.nativeLines` | `formatMinorToMajor` on RSC | Yes — SSR `55 000 RUB` | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Domain aggregate | `npx vitest run -t "computePersonIncomeStats" src/lib/income.test.ts` | 7 passed | ✓ PASS |
| Isolation | `npx vitest run -t "income isolation" src/lib/income.test.ts` | 4 passed | ✓ PASS |
| UI file-scan | `npx vitest run -t "counterparty stats" src/components/income/income-ui.test.ts` | 9 passed | ✓ PASS |
| Live SSR | `curl http://localhost:3000/income` | «за всё время» ×2 + native amounts | ✓ PASS |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No phase probes declared | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| CPTY-01 | 16-01, 16-02 | Hybrid native-first Σ + primary via LOCF @ actualAsOf + partial honesty | ✓ SATISFIED | Domain suite + page wiring + UI chrome + REQUIREMENTS wording; checkbox still unchecked pending UAT close |

No orphaned Phase 16 requirement IDs beyond CPTY-01.

### Prohibitions

| Statement | Evidence | Verdict |
| --------- | -------- | ------- |
| MUST NOT sum unfilled plan slots | Facts only from Prisma actual rows; list next-open separate | honored (code) |
| MUST NOT use today-first FX map | `locfRateAsOf` only; no `firstHitLocfMap` in income | honored (code) |
| MUST NOT coerce null LOCF → 0n primary | null → exclude + isPartial; vitest | honored (test) |
| MUST NOT import debts/NW/HS/Prisma into income.ts | isolation suite | honored (test) |
| MUST NOT install new npm packages | SUMMARY tech-stack.added: [] | honored (judgment) |
| MUST NOT mount debts hero / page partial banner | file-scan + page source | honored (test) |
| MUST NOT invent success-green/amber for FX partial | partial block scan | honored (test) |
| MUST NOT add period picker / withdrawal-date FX | no picker; D-09 out of scope | honored (code) |

### Decision Coverage

All trackable CONTEXT.md decisions honored (15/15). `gsd_run query check.decision-coverage-verify` — non-blocking gate.

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| `src/lib/income.test.ts` `#computePersonIncomeStats` | CPTY-01 | 7 | 0 | 0 | Value/behavioral | OK |
| `src/lib/income.test.ts` isolation | CPTY-01 / ISO | 4 | 0 | 0 | File-scan value | OK |
| `src/components/income/income-ui.test.ts` `#counterparty stats` | CPTY-01 | 9 | 0 | 0 | File-scan (source presence) | OK — proves chrome strings/classes, not pixels |

**Disabled tests on requirements:** 0
**Circular patterns detected:** 0
**Insufficient assertions:** 0 blockers (UI suite intentionally file-scan; domain suite value-level)

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No TBD/FIXME/XXX in phase files | — | — |

### Human Verification Required

### 1. Visual hierarchy (native > primary)

**Test:** Open `/income` — inspect Person header stats column (multi-ccy / foreign-ccy / partial if data allows).
**Expected:** Native `text-base font-semibold`; primary muted `text-sm` when shown; identity-omit when single primary && !partial; partial line only on affected Person.
**Why human:** Layout/spacing taste — SUMMARY D3/D4 + UI-SPEC judgment.

### 2. Orca agent UAT (OPERATOR)

**Test:** `orca-ide open` then browser drive `/income` per OPERATOR.md.
**Expected:** Confirm live flows above in Orca browser.
**Why human / blocked:** `orca-ide status` → app `running: false` this session; SSR curl substituted for presence only.

### Gaps Summary

No must-have gaps. Goal delivered in code + vitest + SSR smoke. Status `human_needed` solely for visual/Orca UAT items (Step 9 rule 2).

---

_Verified: 2026-09-07T19:08:00Z_
_Verifier: Claude (gsd-verifier)_
