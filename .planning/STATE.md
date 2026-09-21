---
gsd_state_version: 1.0
milestone: v1.5
milestone_name: Сберегательный счет (Phases 27–30)
current_phase: 28
current_phase_name: Interest math + forecast kind
status: ready_to_execute
stopped_at: Phase 28 plans written
last_updated: "2026-09-21T11:00:00.000Z"
last_activity: 2026-09-21
last_activity_desc: Phase 28 plans written
state_head: 81ff0b18024ff1632bb1709c84caadd6c976e370
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 6
  completed_plans: 4
  percent: 25
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-11 — v1.5 Сберегательный счет)

**Core value:** At any moment, see true net worth (assets minus credit-card debt) in the primary currency and in each account's original currency, with history you can trust over time.
**Current focus:** Phase 28 — interest math + forecast kind (2 plans)

## Current Position

Phase: 28 of 30 (Interest math + forecast kind)
Plan: 28-01 then 28-02 (not started)
Status: Plans ready
Last activity: 2026-09-21 — Phase 28 plans written

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**

- Total plans completed: 83 (v1.0: 24 + v1.1: 18 + v1.2: 14 + v1.3: 13 + v1.4: 14)
- Average duration: —
- Total execution time: —

**By Phase:** v1.5 not started. Prior: v1.4 Local MCP complete (23–26).

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 25 P01 | 3min | 3 tasks | 8 files |
| Phase 25 P02 | 4min | 2 tasks | 4 files |
| Phase 25 P03 | 4min | 2 tasks | 4 files |
| Phase 25 P04 | 5min | 3 tasks | 8 files |
| Phase 26 P01 | 2min | 2 tasks | 6 files |
| Phase 26 P03 | 4min | 2 tasks | 1 files |
| Phase 26 P02 | 3min | 3 tasks | 11 files |
| Phase 26 P04 | 2min | 3 tasks | 5 files |
| Phase 27 P01 | 3min | 2 tasks | 5 files |
| Phase 27 P02 | 4min | 3 tasks | 10 files |
| Phase 27 P03 | 4min | 2 tasks | 7 files |
| Phase 27 P04 | 3min | 3 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table. v1.5 locks from scoping/research: distinct `SAVINGS` AccountType (not flag on debit); annual%÷12 monthly; forecast overlay only (no auto BalanceSnapshot); SAVISO twin of INISO/GRISO; PARITY-01 MCP in same milestone.

- [Phase 27]: Wave 0: update/D-16 as describe.skip+it.todo only (Plan 03); create hard-fail
- [Phase 27]: formatAccrualCountdown(today, nextAsOf) locked in Wave 0 tests for Plan 04
- [Phase 27]: Auto-selected savings-check-enum (D-14/D-15) for Account_savings_rate_invariant
- [Phase 27]: createAccount omits savings columns for non-SAVINGS; form gates FormData
- [Phase 27]: Single updateAccount action; updateAccountName kept as alias
- [Phase 27]: Zod updateAccountSchema optional rate/DOM; SAVINGS requiredness after findUnique
- [Phase 27]: Page/list pass annualRateBps+DOM for edit prefill (countdown Plan 04)
- [Phase 27]: formatAccrualCountdown(today, nextAsOf) two-arg; days via UTC calendar delta
- [Phase 27]: page.tsx rate/DOM serialize from 27-03; 27-04 wired list secondary only
- [Phase 27]: No interest ÷12 / auto snapshot writer (Phases 28–30)

### Pending Todos

- Add timezone selection to settings (general, minor)

### Blockers/Concerns

- None blocking Phase 27 planning
- Nyquist VALIDATION still draft on archived phases 19–22 (carry-forward tech_debt from v1.3)
- v1.4 audit tech_debt: SUMMARY transport wording; 25-01 frontmatter; 26-VERIFICATION/UAT doc drift
- Phase 28 plan must lock principal LOCF as-of policy (today-anchor flat vs as-of accrual) + truncate policy for bps÷12

### Roadmap Evolution

- Phase 7: LOCF consolidation + Nyquist 3–6 (v1.0)
- Phase 8–12: debts refresh + Nyquist 10–11 (v1.1)
- Phases 13–17: v1.2 Доходы — SHIPPED 2026-09-08
- Phases 18–22: v1.3 Кредитка — SHIPPED 2026-09-10
- Phases 23–26: v1.4 Local MCP — SHIPPED 2026-09-11
- Phases 27–30: v1.5 Сберегательный счет — roadmap created 2026-09-11

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| todos | 2026-09-10-savings-account-type-with-interest-nw-forecast.md | promoted → v1.5 (active) | 2026-09-11 | v1.4 |
| todos | 2026-09-05-add-salary-income-tracking-with-forecast.md | promoted → v1.2 (shipped) | 2026-09-07 | v1.1 |
| todos | 2026-09-05-add-timezone-selection-to-settings.md | (presence-only) | 2026-09-07 | v1.1 |
| todos | 2026-09-05-improve-credit-account-type-with-limit-grace-period-and-fore.md | folded/closed via Phase 18 CONT-01 (dual DOM + A′) | 2026-09-08 | v1.3 |
| todos | 2026-09-05-integrate-local-ai-agent-via-subprocess.md | closed → v1.4 Local MCP (completed 2026-09-10) | 2026-09-07 | v1.1 |
| todos | 2026-09-05-merge-debit-crypto-cash-account-types-into-one.md | done via quick 260908-0i7 | 2026-09-08 | v1.2 |
| scope | ACCT-01 delete → ACCT-04 (D-14) | deferred | 2026-09-02 | v1 |

## Session Continuity

Last session: 2026-09-21T11:00:00.000Z
Stopped at: Phase 28 plans written
Resume file: .planning/phases/28-interest-math-forecast-kind/28-01-PLAN.md

## Operator Next Steps

- Execute Phase 28: `/gsd-execute-phase 28` (wave 0 red tests, then tracer)
