---
phase: "28"
slug: "interest-math-forecast-kind"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-21"
validated: "2026-09-22"
---

# Phase 28 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Post-execution audit: Wave 0 + Plan 02 suites green; Nyquist gaps filled 2026-09-22.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.11 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `./node_modules/.bin/vitest run src/lib/savings-interest.test.ts src/lib/nw-forecast.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `./node_modules/.bin/vitest run src/lib/savings-interest.test.ts src/lib/nw-forecast.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 28-01-01 | 01 | 0 | INT-01 | T-28-01, T-28-04 | ÷12 truncate; compound 10000n→10100n; clamp/future-only; zero-skip; no Math.pow | unit | `./node_modules/.bin/vitest run src/lib/savings-interest.test.ts` | ✅ | ✅ green |
| 28-01-02 | 01 | 0 | INT-01 | T-28-02 | interest +ΔNW; today excluded; grace mix; kind list includes interest | unit | `./node_modules/.bin/vitest run src/lib/nw-forecast.test.ts` | ✅ | ✅ green |
| 28-02-01 | 02 | 1 | INT-01 | T-28-01…T-28-03 | bigint ÷12 only; future-only window; builder does not import interest module | unit | `./node_modules/.bin/vitest run src/lib/savings-interest.test.ts src/lib/nw-forecast.test.ts` | ✅ | ✅ green |
| 28-02-02 | 02 | 1 | INT-01 | T-28-03, T-28-05 | independent principals→30000n; missing FX excludes interest; SerializedForecastEvent.kind includes interest | unit | `./node_modules/.bin/vitest run src/lib/savings-interest.test.ts src/lib/nw-forecast.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/lib/savings-interest.test.ts` — INT-01 formula, compound chain, clamp series, future-only, zero skip, no `Math.pow`
- [x] `src/lib/nw-forecast.test.ts` — interest ΔNW, today excluded, grace regression kept
- [x] Framework install: none — Existing infrastructure covers framework

---

## Manual-Only Verifications

All phase behaviors have automated verification.

> Note: Plan 28-02 D-12 “overlay loader membership stays income+grace only” was a Phase-28 deferral. Phase 29 INT-02 wired `listInterestSlotsInRange` into `loadForecastOverlay` / shell. Ship-time verified in `28-VERIFICATION.md`; current membership covered by Phase 29 suites — not re-asserted here.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-09-22

---

## Validation Audit 2026-09-22

| Metric | Count |
|--------|-------|
| Gaps found | 2 |
| Resolved | 2 |
| Escalated | 0 |
| Phase suite | 43 passed / 0 failed |

| Gap | Type | Action | Result |
|-----|------|--------|--------|
| 28-02-02 missing FX | PARTIAL — no `excludedMissingFxCount` assert | Strengthened `non-primary interest without a rate…` | green |
| 28-02-02 D-12 kind union | MISSING — no source lock on `SerializedForecastEvent.kind` | Added `SerializedForecastEvent.kind union includes interest (D-12)` | green |

**Verdict:** INT-01 Nyquist-compliant. Formula, compound membership, kind interest window/+ΔNW, stair-step, FX exclude, and serialized kind union automated.
