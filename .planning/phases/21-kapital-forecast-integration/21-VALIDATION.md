---
phase: "21"
slug: "kapital-forecast-integration"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-09"
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 |
| **Config file** | `vitest.config.ts` (`include: src/**/*.test.ts`) |
| **Quick run command** | `npx vitest run src/lib/nw-forecast.test.ts src/components/dashboard/nw-forecast-ui.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30–90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/nw-forecast.test.ts src/components/dashboard/nw-forecast-ui.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 21-W0 | 01 | 0 | GRFCST-01/02 | T-21-01 | Never invent FX; exclude + banner | unit + file-scan | `npx vitest run src/lib/nw-forecast.test.ts src/components/dashboard/nw-forecast-ui.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | GRFCST-01 | — | OPEN future due sampled; ΔNW=0 vs income baseline | unit | `npx vitest run src/lib/nw-forecast.test.ts -t "grace"` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | GRFCST-01 | — | Overdue OPEN folds to today | unit | `npx vitest run src/lib/nw-forecast.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | GRFCST-01 | — | CLOSED / early-closed excluded | unit | membership / nw-forecast tests | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | GRFCST-01 | — | Grace-only → flat non-empty points (D-07) | unit | `npx vitest run src/lib/nw-forecast.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | GRFCST-01 | — | Same-day income+grace: income moves NW; grace in metadata | unit | `npx vitest run src/lib/nw-forecast.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | GRFCST-02 | T-21-01 | Missing FX excludes grace; unique currency codes | unit | `npx vitest run src/lib/nw-forecast.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | GRFCST-02 | T-21-01 | Banner lists codes; no kind tags | file-scan | `npx vitest run src/components/dashboard/nw-forecast-ui.test.ts` | ⚠️ extend | ⬜ pending |
| TBD | TBD | TBD | GRFCST-01 | T-21-03 | Tooltip RU strings present | file-scan | `npx vitest run src/components/dashboard/nw-forecast-ui.test.ts` | ❌ W0 | ⬜ pending |
| TBD | TBD | TBD | Isolation | T-21-02 | net-worth / historical-series ban credit-grace | file-scan | extend credit-grace / light scan | ✅ partial | ⬜ pending |
| TBD | TBD | TBD | Income regression | — | Phase 17 forecast tests green | unit | `npx vitest run src/lib/nw-forecast.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Planner must replace TBD task IDs with concrete plan/task refs when PLAN.md exists.*

---

## Wave 0 Requirements

- [ ] Extend `src/lib/nw-forecast.test.ts` — A′ 0-delta, today-fold, grace-only flat, FX codes, CLOSED out, income regression
- [ ] Membership helper tests if extracted to `credit-grace.ts`
- [ ] Extend `src/components/dashboard/nw-forecast-ui.test.ts` — banner codes pattern; tooltip copy «Платёж для беспроцентного» / «NW без изменения»
- [ ] Optional shell unit for merge metadata if logic non-trivial

*(Framework already installed — no Vitest install task.)*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Капитал chart tooltip feel (two blocks, hinge overdue) | GRFCST-01 | Subjective layout / Orca UAT | Agent: `npm run dev` + Orca; open `/`, hover today + future due with income+grace |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
