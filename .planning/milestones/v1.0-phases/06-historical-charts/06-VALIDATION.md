---
phase: "06"
slug: "historical-charts"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-04"
validated: "2026-09-04"
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
| 06-00-01 | 00 | 0 | CHART-01 | — | N/A | unit | `npm test -- src/lib/historical-series.test.ts` | ✅ | ✅ green |
| 06-00-02 | 00 | 0 | CHART-02 | — | N/A | unit | `npm test -- src/lib/historical-series.test.ts` | ✅ | ✅ green |
| 06-00-03 | 00 | 0 | CHART-03 | — | N/A | unit | `npm test -- src/lib/historical-series.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/lib/historical-series.ts` — series builders
- [x] `src/lib/historical-series.test.ts` — stubs/tests for CHART-01–03, D-07, D-14–16
- [x] `src/lib/dates.ts` — `addCalendarDays` / `windowStartForPreset` helpers + tests (extend if needed)
- [x] `npx shadcn@latest add chart` — pulls recharts (Wave 0 or first UI plan)
- [x] No component test runner for Recharts — accept manual UAT for D-13/D-15 paint

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Empty axes / single-point / stacked credit paint | D-13, D-15, D-11 | No Recharts component test runner | Open `/`, set range, expand credit row; confirm empty axes, single dot, stacked areas |
| Shared range preset NW + account | D-08 | UI state | Change preset on NW chart; open account expand — same preset |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-09-04 (Phase 07 Nyquist reconcile — evidence on disk + suite green)

---

## Validation Audit 2026-09-04

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

### Notes

- Evidence-first reconcile (Phase 07 Plan 03 / NYQ-06): Wave 0 files already on disk (`historical-series.ts` / `historical-series.test.ts`, `dates.ts`, `components/ui/chart.tsx`).
- No MISSING Wave 0 paths — auditor not spawned. No new chart/UI product features; nav Валюты and PROJECT.md Active untouched.
- Full suite evidence: `npm test` → 153 passed (2026-09-04, post LOCF consolidation).
- Historical task IDs preserved; File Exists / Status flipped to present/green; Wave 0 boxes checked.
