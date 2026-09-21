---
phase: "28"
slug: "interest-math-forecast-kind"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-21"
---

# Phase 28 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

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
| 28-01-01 | 01 | 0 | INT-01 | T-28-01, T-28-04 | N/A (red contracts) | unit stubs | `./node_modules/.bin/vitest run src/lib/savings-interest.test.ts` | ❌ W0 | ⬜ pending |
| 28-01-02 | 01 | 0 | INT-01 | T-28-02 | N/A (red contracts) | unit stubs | `./node_modules/.bin/vitest run src/lib/nw-forecast.test.ts` | ✅ file / ❌ cases | ⬜ pending |
| 28-02-01 | 02 | 1 | INT-01 | T-28-01, T-28-02, T-28-03 | bigint ÷12 only; future-only window; no snapshot write | unit | `./node_modules/.bin/vitest run src/lib/savings-interest.test.ts src/lib/nw-forecast.test.ts` | ❌ W0 | ⬜ pending |
| 28-02-02 | 02 | 1 | INT-01 | T-28-03, T-28-05 | independent principals; missing FX excludes interest | unit | `./node_modules/.bin/vitest run src/lib/savings-interest.test.ts src/lib/nw-forecast.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Planner fills concrete Task IDs when PLAN.md exists.*

---

## Wave 0 Requirements

- [ ] `src/lib/savings-interest.test.ts` — INT-01 formula, compound chain, clamp series, future-only, zero skip, no `Math.pow`
- [ ] `src/lib/nw-forecast.test.ts` — interest ΔNW, today excluded, grace regression kept
- [ ] Framework install: none — Existing infrastructure covers framework

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
