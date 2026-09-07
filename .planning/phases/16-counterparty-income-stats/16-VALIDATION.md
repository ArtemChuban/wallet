---
phase: "16"
slug: "counterparty-income-stats"
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| 16-W0-01 | 00 | 0 | CPTY-01 | T-16-01 | Never invent FX / silent zero | unit | `npx vitest run -t "computePersonIncomeStats" src/lib/income.test.ts` | ❌ W0 | ⬜ pending |
| 16-W0-02 | 00 | 0 | CPTY-01 | T-16-02 | No debts mixed into income Σ | file-scan | `npx vitest run -t "counterparty stats" src/components/income/income-ui.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

Planner fills remaining task rows when PLAN.md exists.

---

## Wave 0 Requirements

- [ ] Extend `src/lib/income.test.ts` — `computePersonIncomeStats` cases (native multi-ccy, primary @ actualAsOf, no_fx partial, empty actuals, merged kinds)
- [ ] Extend `src/components/income/income-ui.test.ts` — file-scan for «за всё время»/«всего», «Итог неполный»/«нет курса», no page-level DebtsPrimaryTotalsHero on income, no `window.confirm`
- [ ] Optional: page wiring file-scan that `page.tsx` calls stats helper / loads `fxRate`

*Framework already present — no install.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual hierarchy native > primary in Person header | CPTY-01 | Layout/spacing judgment | Orca UAT: open `/income`, Person with actuals — native right, primary smaller under; partial badge when FX missing |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
