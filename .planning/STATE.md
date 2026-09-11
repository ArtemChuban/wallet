---
gsd_state_version: 1.0
milestone: v1.5
milestone_name: Сберегательный счет (Phases 27–30)
current_phase: 27
current_phase_name: SAVINGS schema + CRUD
status: planned
stopped_at: Phase 27 plans written (27-01…04)
last_updated: "2026-09-11T15:57:56.764Z"
last_activity: 2026-09-11
last_activity_desc: Phase 27 PLAN.md set created (4 plans)
state_head: 7ac1624fe70c2e8c0ffdf17ac8534d9c625686a3
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 4
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-11 — v1.5 Сберегательный счет)

**Core value:** At any moment, see true net worth (assets minus credit-card debt) in the primary currency and in each account's original currency, with history you can trust over time.
**Current focus:** Phase 27 — SAVINGS schema + CRUD

## Current Position

Phase: 27 of 30 (SAVINGS schema + CRUD)
Plan: 27-01 … 27-04
Status: Ready to execute (4 plans)
Last activity: 2026-09-11 — Phase 27 plans written

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

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table. v1.5 locks from scoping/research: distinct `SAVINGS` AccountType (not flag on debit); annual%÷12 monthly; forecast overlay only (no auto BalanceSnapshot); SAVISO twin of INISO/GRISO; PARITY-01 MCP in same milestone.

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

Last session: 2026-09-11T15:57:56.764Z
Stopped at: Phase 27 planning complete
Resume file: .planning/phases/27-savings-schema-crud/27-01-PLAN.md

## Operator Next Steps

- Execute Phase 27: `/gsd-execute-phase 27` (Wave 0 → tracer+migrate → edit UI → list/D-16)
