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
| 21-01-T1 | 01 | 1 | GRFCST-01/02 | T-21-01 | Never invent FX; Wave 0 stubs non-poisoning | unit + file-scan | `npx vitest run src/lib/nw-forecast.test.ts src/components/dashboard/nw-forecast-ui.test.ts` | ⚠️ extend | ⬜ pending |
| 21-01-T2 | 01 | 1 | GRFCST-01 | T-21-03 | CLOSED excluded; overdue folds to today | unit | `npx vitest run src/lib/credit-grace.test.ts` | ⚠️ extend | ⬜ pending |
| 21-01-T3 | 01 | 1 | GRFCST-01/02 | T-21-01 | A′ 0-delta; grace-only flat; FX codes unique | unit | `npx vitest run src/lib/nw-forecast.test.ts src/lib/credit-grace.test.ts` | ⚠️ extend | ⬜ pending |
| 21-02-T1 | 02 | 2 | GRFCST-01/02 | T-21-01 | Banner lists codes; OPEN merge one series | unit + file-scan | `npx vitest run src/lib/nw-forecast.test.ts src/components/dashboard/nw-forecast-ui.test.ts` | ⚠️ extend | ⬜ pending |
| 21-02-T2 | 02 | 2 | Isolation | T-21-02 | net-worth / historical-series ban credit-grace | file-scan | `npx vitest run src/lib/credit-grace.test.ts` | ✅ partial | ⬜ pending |
| 21-03-T1 | 03 | 3 | GRFCST-01 | T-21-05 | Tooltip RU strings; single dashed series | file-scan | `npx vitest run src/components/dashboard/nw-forecast-ui.test.ts src/lib/nw-forecast.test.ts` | ⚠️ extend | ⬜ pending |
| 21-03-T2 | 03 | 3 | GRFCST-01/02 | — | Phase sampling green + human tooltip feel | unit + file-scan | `npx vitest run src/lib/nw-forecast.test.ts src/components/dashboard/nw-forecast-ui.test.ts src/lib/credit-grace.test.ts` | ⚠️ extend | ⬜ pending |
| Income regression | 01 | 1 | — | — | Phase 17 forecast tests green | unit | `npx vitest run src/lib/nw-forecast.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

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
