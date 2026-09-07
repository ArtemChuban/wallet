---
phase: "17"
slug: "nw-forecast-overlay-isolation"
status: draft
nyquist_compliant: false
wave_0_complete: false
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
- **After every plan wave:** Run `npx vitest run src/lib/nw-forecast.test.ts src/lib/iniso.test.ts src/lib/historical-series.test.ts src/lib/income.test.ts src/app/income/actions.test.ts`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 17-W0-01 | 00→01 | 0 | FCST-01 | T-17-FX | RED scaffolds nw-forecast — never invent FX | unit | `npx vitest run -t "forecast" src/lib/nw-forecast.test.ts` (expect fail until impl) | ❌ W0 | ⬜ pending |
| 17-W0-02 | 00→01 | 0 | ISO-01 | T-17-ISO | RED scaffolds INISO file-scan + past series | unit | `npx vitest run src/lib/iniso.test.ts` (expect fail until impl) | ❌ W0 | ⬜ pending |
| 17-01-T? | 01 | 1 | FCST-01 | T-17-FX | Membership/cumulative/horizon/FX overlay math | unit | `npx vitest run src/lib/nw-forecast.test.ts` | ❌ W0 | ⬜ pending |
| 17-01-T? | 01 | 1 | ISO-01 | T-17-ISO | Past series identity + import walls | unit/file-scan | `npx vitest run src/lib/iniso.test.ts` | ❌ W0 | ⬜ pending |
| 17-02-T? | 02 | 2 | FCST-01 | T-17-CHART | ComposedChart/Line/ReferenceLine/«Прогноз» | file-scan | `npx vitest run -t "forecast" src/components/dashboard/` | ❌ W0 | ⬜ pending |
| 17-02-T? | 02 | 2 | FCST-01 | — | REQUIREMENTS/ROADMAP FCST-01 one-time sync | docs-grep | `grep -n FCST-01 .planning/REQUIREMENTS.md` | ⚠️ stale | ⬜ pending |
| 17-02-T? | 02 | 2 | ISO-01 | T-17-ISO | Income actions never BalanceSnapshot | file-scan | `npx vitest run -t "income actions isolation" src/app/income/actions.test.ts` | ✅ | ⬜ pending |

*Planner fills exact Task IDs. Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/nw-forecast.test.ts` — membership, cumulative, horizon mirror, FX exclude/partial, empty hide
- [ ] `src/lib/iniso.test.ts` — file-scan walls + past `buildNetWorthSeries` identity
- [ ] Optional: dashboard chart forecast file-scan under `src/components/dashboard/`
- [ ] Framework install: none — Vitest already present

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dashed forecast Line + today ReferenceLine readable | FCST-01 | Visual judgment | Orca UAT on `/`: switch 30д/90д; confirm hinge + «Прогноз» |
| Partial banner tone near chart | FCST-01 | Copy/layout | Missing FX for a future slot → banner; series still or hidden per D-16 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
