---
phase: 28-interest-math-forecast-kind
verified: 2026-09-21T11:36:16Z
status: passed
score: 6/6 must-haves verified
behavior_unverified: 0
overrides_applied: 0
decision_coverage:
  honored: 13
  total: 13
  not_honored: []
human_verification: []
---

# Phase 28: Interest math + forecast kind Verification Report

**Phase Goal:** Expected monthly interest is a locked, reusable formula ready for the forecast overlay
**Verified:** 2026-09-21T11:36:16Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | Expected monthly interest equals today LOCF × annual rate / 12, truncate toward 0; no APY/`Math.pow`. Next month uses principal grown by that truncated credit only (SC #1, D-02, D-08, D-09, INT-01) | ✓ VERIFIED | `monthlyInterestMinor` is one bigint division by `12n * 10000n`. Vitest: `1_000_000n` at 1650 bps → `13750n`; chain `10000n` then `10100n`; truncated `8n` then `9n`. Source smoke rejects `Math.pow` |
| 2 | Accrual dates come from `nextAccrualAsOf` → `clampDayOfMonth`, including short February and leap day (SC #2, D-01, D-07) | ✓ VERIFIED | Enumerator calls `nextAccrualAsOf`. Tests: DOM 31 from 2026-02-10 → 2026-02-28 and 2026-03-31; leap 2024-02-29; horizonEnd inclusive |
| 3 | Kind `interest` ΔNW is `+displayPrimaryMinor`; grace stays `0n` (SC #3, D-12) | ✓ VERIFIED | Exhaustive `forecastDeltaMinor`. Future interest `50_000n` on anchor `1_000_000n` → `1_050_000n`. Same-day interest+grace moves NW by interest only. Grace-only future slot stays `1_000_000n` |
| 4 | Interest membership is future-only (`plannedAsOf > today`); a run that starts on the accrual day does not emit that day (SC #4, D-07, D-12) | ✓ VERIFIED | `slotInWindow` interest shares income `> today`. Today-dated interest → `includedSlotCount` 0. Enumerator cursor is `addCalendarDays(today, 1)`. Sticky 2026-02-28 when today is that day emits only 2026-03-31 |
| 5 | Two SAVINGS accounts grow separate principals; the builder sums precomputed deltas and does not recompute interest (D-03, D-04) | ✓ VERIFIED | `1_000_000n` and `2_000_000n` at 1200 bps → `10000n` and `20000n`, distinct `parentId`. Hand-mapped series anchor `0n` → `30000n`. `nw-forecast.ts` does not reference `savings-interest` |
| 6 | `SerializedForecastEvent.kind` accepts `interest`; overlay loader still builds only income and grace slots (D-12) | ✓ VERIFIED | Union is `"income" \| "grace" \| "interest"`. `loadForecastOverlay` slots are `[...openSlots, ...graceSlots]`. No `listInterestSlotsInRange` call. No Dashboard/page import of the interest module |

**Score:** 6/6 truths verified (0 present, behavior-unverified)

Wave 0 plan 28-01 truths (suites red because the module was absent, today-dated interest `includedSlotCount` 1) are the pre-implementation lock. Plan 28-02 turned the same expects green. They are not open gaps.

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `src/lib/savings-interest.ts` | `monthlyInterestMinor` and `listInterestSlotsInRange` | ✓ VERIFIED | Pure module. Imports only `addCalendarDays` and `nextAccrualAsOf`. Emits only `interestMinor > 0n`. `parentId` = `accountId`. Currency fields pass through |
| `src/lib/nw-forecast.ts` | `ForecastSlotKind` interest, income-style window, exhaustive ΔNW | ✓ VERIFIED | Kind union widened. `slotInWindow` and `forecastDeltaMinor` switch with `never` default |
| `src/lib/mcp/reads/load-forecast-overlay.ts` | Serialized kind includes interest; membership unchanged | ✓ VERIFIED | Kind union widened. Slot list remains income + grace |
| `src/lib/savings-interest.test.ts` | INT-01 formula, compound chain, calendar, isolation | ✓ VERIFIED | Hard expects (no `it.todo` / `it.skip`). Golden minors present |
| `src/lib/nw-forecast.test.ts` | Interest window, ΔNW, stair-step, missing FX, grace regression | ✓ VERIFIED | `interestSlot` sets `parentId` = `accountId`, no `dueAsOf` |

**Artifacts:** 5/5 verified

### Key Link Verification

Automated `verify.key-links` reported 0/3 because plan `from:` values are symbols, not file paths. Manual trace:

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `listInterestSlotsInRange` | `nextAccrualAsOf` | cursor = day after today; advance day after each accrual | ✓ WIRED | `savings-interest.ts` imports `nextAccrualAsOf`; `addCalendarDays(today, 1)` then `addCalendarDays(accrual, 1)` |
| `ForecastSlot` kind `interest` | `buildNetWorthForecastSeries` `primaryMinor` | exhaustive switch | ✓ WIRED | `interest` returns `displayPrimaryMinor`; `grace` returns `0n` |
| `ForecastSlotKind` | `SerializedForecastEvent.kind` | same three-literal union | ✓ WIRED | Both `"income" \| "grace" \| "interest"`. Loader does not emit interest rows |

**Wiring:** 3/3 connections verified

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `savings-interest.ts` | `interestMinor` | `(balanceMinor * BigInt(annualRateBps)) / (12n * 10000n)` then `principal += interestMinor` | Yes | ✓ FLOWING |
| `nw-forecast.ts` | `primaryMinor` for interest | caller `plannedAmountMinor` after FX gate, via `forecastDeltaMinor` | Yes | ✓ FLOWING |
| `load-forecast-overlay.ts` | forecast slots | income open slots + grace membership only | Interest rows intentionally absent (D-12, Phase 29) | ✓ FLOWING for this phase's contract |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| INT-01 formula, compound chain, calendar, kind window, stair-step, missing FX, grace flat | `./node_modules/.bin/vitest run src/lib/savings-interest.test.ts src/lib/nw-forecast.test.ts` | 2 files, 38 tests, exit 0 | ✓ PASS |

### Probe Execution

No phase-declared probes and no `scripts/*/tests/probe-*.sh` for this phase. Step 7c skipped.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| INT-01 | 28-01, 28-02 | Expected monthly interest = LOCF × annual rate / 12, credited on accrual DOM with `clampDayOfMonth` | ✓ SATISFIED | Month-1 credit matches ÷12 truncate. Dates via `nextAccrualAsOf`/`clampDayOfMonth`. D-02 grows later months by the truncated credit (locked in CONTEXT; not an APY engine) |

No orphaned Phase 28 requirement IDs. INT-02, INT-03, SAVISO-*, MCP-* stay on Phases 29–30.

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| `src/lib/savings-interest.test.ts` | INT-01 | all `it` (no skip/todo) | 0 | No — goldens are literals (`13750n`, `10000n`, `10100n`, `8n`, `9n`), not captured from the SUT | Value | PASS |
| `src/lib/nw-forecast.test.ts` | INT-01 | interest + grace cases active | 0 | No | Value (`1_050_000n`, `30000n`, `includedSlotCount` 0) | PASS |

**Disabled tests on requirements:** 0
**Circular patterns detected:** 0
**Insufficient assertions:** 0

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No TBD/FIXME/XXX/TODO/HACK/placeholder in phase files | — | — |

### Decision Coverage

All trackable CONTEXT.md decisions are honored by shipped artifacts. 13/13 (D-01..D-13). Non-blocking.

### Human Verification

N/A — domain-math phase. No Dashboard, page, or MCP membership wire. Acceptance criteria are unit-tested.

### Gaps Summary

None. Phase goal holds in code: reusable ÷12 truncate helper, compound membership from today LOCF, kind `interest` with +ΔNW and a future-only window, serialized kind widened, overlay membership still income + grace.

---

_Verified: 2026-09-21T11:36:16Z_
_Verifier: Claude (gsd-verifier)_
