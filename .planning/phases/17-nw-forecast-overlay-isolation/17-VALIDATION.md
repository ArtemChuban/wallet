---
phase: "17"
slug: "nw-forecast-overlay-isolation"
status: complete
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-07"
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib/nw-forecast.test.ts src/lib/iniso.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~30–120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/nw-forecast.test.ts src/lib/iniso.test.ts`
- **After every plan wave:** Run `npx vitest run src/lib/nw-forecast.test.ts src/lib/iniso.test.ts src/lib/historical-series.test.ts src/lib/income.test.ts src/app/income/actions.test.ts src/components/dashboard/nw-forecast-ui.test.ts`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 17-01-T1 | 01 | 1 | FCST-01 | T-17-02 | Wave 0 RED scaffolds nw-forecast — never invent FX | unit | `npx vitest run -t "forecast" src/lib/nw-forecast.test.ts` | ✅ | ✅ green |
| 17-01-T2 | 01 | 1 | FCST-01 | T-17-01 | Tracer open slot → builder → shell → ComposedChart Line | unit/file-scan | `npx vitest run src/lib/nw-forecast.test.ts` + grep builder/ComposedChart | ✅ | ✅ green |
| 17-01-T3 | 01 | 1 | FCST-01 | T-17-02 | Membership/cumulative/horizon/FX overlay math | unit | `npx vitest run src/lib/nw-forecast.test.ts` | ✅ | ✅ green |
| 17-02-T1 | 02 | 2 | ISO-01 | T-17-01 | Checkpoint: confirm one-way INISO walls (D-17) | decision | human resume-signal (enforce-iniso auto-selected) | n/a | ✅ green |
| 17-02-T2 | 02 | 2 | ISO-01 | T-17-01 | Past series identity + import walls + actions gate | unit/file-scan | `npx vitest run src/lib/iniso.test.ts` + actions isolation | ✅ | ✅ green |
| 17-02-T3 | 02 | 2 | FCST-01 | T-17-06 | REQUIREMENTS/ROADMAP/STATE FCST-01 one-time sync (D-01) | docs-grep | `grep -n FCST-01 .planning/REQUIREMENTS.md` | ✅ | ✅ green |
| 17-03-T1 | 03 | 3 | FCST-01 | T-17-03 | ComposedChart/Line/ReferenceLine/«Прогноз» + tooltip split | file-scan | `npx vitest run -t "forecast" src/components/dashboard/nw-forecast-ui.test.ts` | ✅ | ✅ green |
| 17-03-T2 | 03 | 3 | FCST-01 | T-17-02 | Partial banner «Прогноз неполный · нет курса» | file-scan | `npx vitest run src/components/dashboard/nw-forecast-ui.test.ts` | ✅ | ✅ green |
| 17-03-T3 | 03 | 3 | FCST-01, ISO-01 | T-17-01 | VALIDATION map + wave merge suite | unit | wave merge vitest + `wave_0_complete: true` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/lib/nw-forecast.test.ts` — membership, cumulative, horizon mirror, FX exclude/partial, empty hide
- [x] `src/lib/iniso.test.ts` — file-scan walls + past `buildNetWorthSeries` identity
- [x] `src/components/dashboard/nw-forecast-ui.test.ts` — chart forecast file-scan
- [x] Framework install: none — Vitest already present

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dashed forecast Line + today ReferenceLine readable | FCST-01 | Visual judgment | Orca UAT on `/`: switch 30д/90д; confirm hinge + «Прогноз» |
| Partial banner tone near chart | FCST-01 | Copy/layout | Missing FX for a future slot → banner; series still or hidden per D-16 |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** phase maps + suites green — human Orca visual queued for `/gsd-verify-work`
