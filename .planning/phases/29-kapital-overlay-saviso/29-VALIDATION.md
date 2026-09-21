---
phase: "29"
slug: "kapital-overlay-saviso"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-21"
---

# Phase 29 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib/nw-forecast.test.ts src/lib/saviso.test.ts src/components/dashboard/nw-forecast-ui.test.ts src/lib/iniso.test.ts src/lib/griso.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/nw-forecast.test.ts src/lib/saviso.test.ts src/components/dashboard/nw-forecast-ui.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 29-01-01 | 01 | 0 | SAVISO-01, SAVISO-02 | T-29-01 | Forecast path never writes BalanceSnapshot; historical series ignores interest | unit | `npx vitest run src/lib/saviso.test.ts` | ❌ W0 | ⬜ pending |
| 29-01-02 | 01 | 0 | D-11 | T-29-02 | Grace forecast samples subtract primary minor; event magnitude stays positive | unit | `npx vitest run src/lib/nw-forecast.test.ts` | ✅ expects stale | ⬜ pending |
| 29-01-03 | 01 | 0 | INT-02, INT-03, D-09 | T-29-03 | Interest slots wired; FX miss lists currency; grace subtitle «Ожидаемый платёж»; retired «NW без изменения» absent | unit + file-scan | `npx vitest run src/lib/nw-forecast.test.ts src/components/dashboard/nw-forecast-ui.test.ts` | ✅ partial | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/saviso.test.ts` — SAVISO-01/02 import wall, never-call regex, SAVINGS golden series
- [ ] Extend `src/lib/nw-forecast.test.ts` — grace expects move from flat `0n` to signed primary totals
- [ ] Extend `src/components/dashboard/nw-forecast-ui.test.ts` — «Накопительный», «Ожидаемое начисление», «Ожидаемый платёж»; shell calls `listInterestSlotsInRange`; retired subtitle absent
- [ ] Existing infrastructure covers the framework. No install.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Accrual-day tooltip row order, plus glyph, dashed line rises on interest and falls on grace | INT-02, D-08, D-11 | Vitest is node; no React render harness | Agent UAT on Капитал `/` via Orca: hover accrual day and grace due day |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
