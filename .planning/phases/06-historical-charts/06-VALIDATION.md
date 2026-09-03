---
phase: "06"
slug: "historical-charts"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-04"
---

# Phase 06 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.11 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test -- src/lib/historical-series.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5–15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- src/lib/historical-series.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|---------|-----------------|-----------|-------------------|-------------|--------|
| 06-00-01 | 00 | 0 | CHART-01 | — | N/A | unit | `npm test -- src/lib/historical-series.test.ts` | ❌ W0 | ⬜ pending |
| 06-00-02 | 00 | 0 | CHART-02 | — | N/A | unit | `npm test -- src/lib/historical-series.test.ts` | ❌ W0 | ⬜ pending |
| 06-00-03 | 00 | 0 | CHART-03 | — | N/A | unit | `npm test -- src/lib/historical-series.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/historical-series.ts` — series builders
- [ ] `src/lib/historical-series.test.ts` — stubs/tests for CHART-01–03, D-07, D-14–16
- [ ] `src/lib/dates.ts` — `addCalendarDays` / `windowStartForPreset` helpers + tests (extend if needed)
- [ ] `npx shadcn@latest add chart` — pulls recharts (Wave 0 or first UI plan)
- [ ] No component test runner for Recharts — accept manual UAT for D-13/D-15 paint

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Empty axes / single-point / stacked credit paint | D-13, D-15, D-11 | No Recharts component test runner | Open `/`, set range, expand credit row; confirm empty axes, single dot, stacked areas |
| Shared range preset NW + account | D-08 | UI state | Change preset on NW chart; open account expand — same preset |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
