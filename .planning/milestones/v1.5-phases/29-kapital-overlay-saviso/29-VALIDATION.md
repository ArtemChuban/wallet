---
phase: "29"
slug: "kapital-overlay-saviso"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-21"
validated: "2026-09-22"
---

# Phase 29 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Post-execution audit 2026-09-22: D-02 sort probe filled; phase suite 64 green; UAT 7/7 pass.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib/nw-forecast.test.ts src/lib/saviso.test.ts src/components/dashboard/nw-forecast-ui.test.ts` |
| **Full suite command** | `npm test` |
| **Phase suite command** | `npx vitest run src/lib/nw-forecast.test.ts src/lib/saviso.test.ts src/components/dashboard/nw-forecast-ui.test.ts src/lib/iniso.test.ts src/lib/griso.test.ts` |
| **Estimated runtime** | ~3–30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/nw-forecast.test.ts src/lib/saviso.test.ts src/components/dashboard/nw-forecast-ui.test.ts`
- **After every plan wave:** Run phase suite (or `npm test`)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 29-01-01 | 01 | 0 | SAVISO-01, SAVISO-02 | T-29-01 | Forecast path never writes BalanceSnapshot; historical series ignores interest | unit | `npx vitest run src/lib/saviso.test.ts` | ✅ | ✅ green |
| 29-01-02 | 01 | 0 | D-11 | T-29-02 | Grace forecast samples subtract primary minor; event magnitude stays positive | unit | `npx vitest run src/lib/nw-forecast.test.ts` | ✅ | ✅ green |
| 29-01-03 | 01 | 0 | INT-02, INT-03, D-09 | T-29-03 | Interest slots wired; FX miss lists currency; grace subtitle «Ожидаемый платёж»; retired «NW без изменения» absent | unit + file-scan | `npx vitest run src/lib/nw-forecast.test.ts src/components/dashboard/nw-forecast-ui.test.ts` | ✅ | ✅ green |
| 29-02-01 | 02 | 1 | INT-02, INT-03, D-11 | T-29-01…T-29-SC | Grace `-displayPrimaryMinor`; interest slots raise line; FX miss lists codes | unit | `npx vitest run src/lib/nw-forecast.test.ts src/lib/saviso.test.ts` | ✅ | ✅ green |
| 29-02-02 | 02 | 1 | INT-02, D-02 | — | Tooltip sort/copy/sign file-scan; D-02 probe Альфа/Яндекс/Бета runtime; interest block future-only | unit + file-scan | `npx vitest run src/components/dashboard/nw-forecast-ui.test.ts src/lib/nw-forecast.test.ts src/lib/saviso.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/lib/saviso.test.ts` — SAVISO-01/02 import wall, never-call regex, SAVINGS golden series
- [x] Extend `src/lib/nw-forecast.test.ts` — grace expects move from flat `0n` to signed primary totals
- [x] Extend `src/components/dashboard/nw-forecast-ui.test.ts` — «Накопительный», «Ожидаемое начисление», «Ожидаемый платёж»; shell calls `listInterestSlotsInRange`; retired subtitle absent
- [x] D-02 runtime probe — extract chart sort comparator; amounts 20/20/10 → Альфа, Яндекс, Бета
- [x] Existing infrastructure covers the framework. No install.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions | UAT |
|----------|-------------|------------|-------------------|-----|
| Accrual-day tooltip row order visuals, plus glyph, dashed line rises on interest and falls on grace | INT-02, D-08, D-11 | Vitest is node; no React render harness for Recharts hover geometry | Agent UAT on Капитал `/` via Orca: hover accrual day and grace due day | ✅ pass (29-UAT.md 7/7) |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-09-21; re-validated 2026-09-22 (D-02 gap fixed)

---

## Validation Audit 2026-09-21

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Phase suite | 63 passed / 0 failed |
| UAT | 7/7 pass |

**Verdict:** Requirements INT-02, INT-03, SAVISO-01, SAVISO-02 covered by existing Wave 0 + Plan 02 Vitest suites. No new tests generated. Manual hover UAT already complete in `29-UAT.md`.

---

## Validation Audit 2026-09-22

| Metric | Count |
|--------|-------|
| Gaps found | 1 |
| Resolved | 1 |
| Escalated | 0 |
| Phase suite | 64 passed / 0 failed |
| UAT | 7/7 pass (unchanged) |

**Gap:** D-02 same-day interest row order (Альфа / Яндекс / Бета) was file-scan-only (`localeCompare` present); VERIFICATION marked PRESENT_BEHAVIOR_UNVERIFIED.

**Resolution:** Added runtime probe in `src/components/dashboard/nw-forecast-ui.test.ts` that extracts the production `.sort` comparator from `ForecastInterestTooltipBlock` and asserts probe order + amount-desc precedence.

**Verdict:** Phase 29 Nyquist-compliant. All requirement behaviors have automated verification; hover geometry remains manual-only (already UAT-passed).
