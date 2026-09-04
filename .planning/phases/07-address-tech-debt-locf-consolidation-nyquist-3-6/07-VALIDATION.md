---
phase: "07"
slug: "address-tech-debt-locf-consolidation-nyquist-3-6"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-04"
---

# Phase 07 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 |
| **Config file** | `vitest.config.ts` (`include: src/**/*.test.ts`) |
| **Quick run command** | `npx vitest run src/lib/locf.test.ts src/lib/balances.test.ts src/lib/fx.test.ts src/lib/historical-series.test.ts` |
| **Full suite command** | `npm test` (= `vitest run`) |
| **Estimated runtime** | ~5–15 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick LOCF command above
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green; phases 3–6 VALIDATION.md show `status: validated` + `nyquist_compliant: true`
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 07-00-01 | 00 | 0 | LOCF-01 | T-07-01 | null before first; never invent 0/1 | unit | `npx vitest run src/lib/locf.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-01 | 01 | 1 | LOCF-01 / LOCF-05 | T-07-01 | pure ↔ Map parity | unit | `npx vitest run src/lib/locf.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | LOCF-02 | T-07-01 | pages use shared Map builder | unit + source | `npx vitest run src/lib/locf.test.ts` + grep rewire | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 2 | LOCF-03 | T-07-01 | CHART-03 / D-16 green | unit | `npx vitest run src/lib/historical-series.test.ts` | ✅ | ⬜ pending |
| 07-02-02 | 02 | 2 | LOCF-04 | T-07-01 | Prisma get*AsOf contracts | unit | `npx vitest run src/lib/balances.test.ts src/lib/fx.test.ts` | ✅ | ⬜ pending |
| 07-03-01 | 03 | 3 | NYQ-03 | — | Phase 3 VALIDATION reconciled | docs + suite | `npm test` + edit `03-VALIDATION.md` | ✅ draft | ⬜ pending |
| 07-03-02 | 03 | 3 | NYQ-04 | — | Phase 4 VALIDATION reconciled | docs + suite | `npm test` + edit `04-VALIDATION.md` | ✅ draft | ⬜ pending |
| 07-03-03 | 03 | 3 | NYQ-05 | — | Phase 5 VALIDATION reconciled | docs + suite | `npm test` + edit `05-VALIDATION.md` | ✅ draft | ⬜ pending |
| 07-03-04 | 03 | 3 | NYQ-06 | — | Phase 6 VALIDATION reconciled | docs + suite | `npm test` + edit `06-VALIDATION.md` | ✅ draft | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/locf.ts` — shared pure + batch helpers (`pickLatestAsOf`, `firstHitLocfMap`)
- [ ] `src/lib/locf.test.ts` — LOCF-01 / LOCF-05 parity + null-before-first
- [ ] Rewire `src/app/page.tsx`, `src/app/accounts/page.tsx`, `src/app/currencies/rates/page.tsx`, `src/lib/historical-series.ts` (Wave 1–2, not stubs-only)
- [ ] Reconcile `03|04|05|06-VALIDATION.md` (Wave 3 — not new product tests unless auditor finds MISSING)

*Existing infrastructure covers Vitest + balances/fx/historical-series suites. Framework install: none.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual spot-check dashboard/account expand charts after series rewire | LOCF-03 / CHART-03 | Chart rendering not fully covered by unit series tests | Open `/`, expand account chart, confirm line still draws for 30д window |

*All other phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
