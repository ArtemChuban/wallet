---
phase: "16"
slug: "counterparty-income-stats"
status: draft
nyquist_compliant: true
wave_0_complete: true
created: "2026-09-07"
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 |
| **Config file** | project vitest config (existing) |
| **Quick run command** | `npx vitest run -t "computePersonIncomeStats" src/lib/income.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~30–90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run -t "computePersonIncomeStats" src/lib/income.test.ts` (or touched UI scan)
- **After every plan wave:** Run `npx vitest run src/lib/income.test.ts src/components/income/income-ui.test.ts`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 16-01-T1 | 01 | 1 | CPTY-01 | T-16-01 | Wave 0 RED scaffolds — never invent FX | unit | `npx vitest run -t "computePersonIncomeStats" src/lib/income.test.ts` (expect fail RED) | ✅ | ✅ green |
| 16-01-T2 | 01 | 1 | CPTY-01 | T-16-01 / T-16-02 | `computePersonIncomeStats` + page/header; no debts bleed | unit + file-scan | `npx vitest run src/lib/income.test.ts src/components/income/income-ui.test.ts` | ✅ | ✅ green |
| 16-01-T3 | 01 | 1 | CPTY-01 | T-16-01 | Mixed no_fx partial + isolation | unit | `npx vitest run -t "computePersonIncomeStats" src/lib/income.test.ts && npx vitest run -t "income isolation" src/lib/income.test.ts` | ✅ | ✅ green |
| 16-02-T1 | 02 | 2 | CPTY-01 | T-16-01 / T-16-02 | Hybrid chrome; partial «Итог неполный · нет курса»; no Debts hero | file-scan | `npx vitest run -t "counterparty stats" src/components/income/income-ui.test.ts` | ✅ | ✅ green |
| 16-02-T2 | 02 | 2 | CPTY-01 | T-16-06 | REQUIREMENTS CPTY-01 hybrid @ actualAsOf | docs-grep | `grep CPTY-01 .planning/REQUIREMENTS.md` + hybrid/native/actualAsOf | ✅ | ✅ green |
| 16-02-T3 | 02 | 2 | CPTY-01 | T-16-01 / T-16-02 | Phase gate suite + VALIDATION map | unit + file-scan | `npx vitest run src/lib/income.test.ts src/components/income/income-ui.test.ts src/app/income/actions.test.ts src/lib/validations/income.test.ts` | ✅ | ✅ green |
| 16-W0-01 | 00→01 | 0 | CPTY-01 | T-16-01 | Never invent FX / silent zero | unit | `npx vitest run -t "computePersonIncomeStats" src/lib/income.test.ts` | ✅ | ✅ green |
| 16-W0-02 | 00→02 | 0 | CPTY-01 | T-16-02 | No debts mixed; page fxRate + computePersonIncomeStats; DestructiveConfirmStep | file-scan | `npx vitest run -t "counterparty stats" src/components/income/income-ui.test.ts` | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Extend `src/lib/income.test.ts` — `computePersonIncomeStats` cases (native multi-ccy, primary @ actualAsOf, no_fx partial, empty actuals, merged kinds)
- [x] Extend `src/components/income/income-ui.test.ts` — file-scan for «за всё время»/«всего», «Итог неполный»/«нет курса», no page-level DebtsPrimaryTotalsHero on income, no `window.confirm`
- [x] Optional: page wiring file-scan that `page.tsx` calls stats helper / loads `fxRate`

*Framework already present — no install. Wave 0 closed by Plans 01–02.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual hierarchy native > primary in Person header | CPTY-01 | Layout/spacing judgment | Orca UAT: open `/income`, Person with actuals — native right, primary smaller under; partial badge when FX missing |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending (executor filled map; auditor/verify-work confirms)
