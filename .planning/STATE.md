---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Доходы
status: planning
last_updated: "2026-09-07T12:15:00.000Z"
last_activity: 2026-09-07
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-07 — milestone v1.2 Доходы)

**Core value:** At any moment, see true net worth (assets minus credit-card debt) in the primary currency and in each account's original currency, with history you can trust over time.
**Current focus:** Phase 13 — Income schema + domain math

## Current Position

Phase: 13 of 17 (Income schema + domain math) — v1.2 phases 13–17
Plan: —
Status: Ready to plan
Last activity: 2026-09-07 — Roadmap created for v1.2 Доходы (phases 13–17)

Progress: [░░░░░░░░░░] 0% (v1.2)

## Performance Metrics

**Velocity:**

- Total plans completed: 42 (v1.0: 24 + v1.1: 18)
- Average duration: —
- Total execution time: —

**By Phase:** Prior milestone tables retained in git history / prior STATE; v1.2 plans TBD after plan-phase.

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v1.2 income = side ledger (template → virtual occurrences → optional actual); not double-entry posting
- Actual does not write BalanceSnapshot; forecast is overlay only — never mutates historical LOCF / computeNetWorthRows (ISO-01)
- Reuse Person for counterparties; zero new npm packages; DOM clamp not rrule skip
- Roadmap order: schema+domain → /income CRUD → actual+overdue → stats → forecast+isolation
- DestructiveConfirmStep app-wide; agent-driven UAT via OPERATOR.md + Orca

### Pending Todos

- Add timezone selection to settings (general, minor)
- Integrate local AI agent via subprocess (general, minor)
- Merge debit/crypto/cash account types (database, minor)
- Improve credit account type — grace / statement forecasting (general, major)
- Salary/income tracking — **in progress as v1.2**

### Blockers/Concerns

- Forecast horizon vs Капитал range presets — lock in Phase 17 plan/discuss (~90d recommended)
- Person-as-employer UX copy — validate in Phase 14 discuss if mixing debts+income people confuses
- One-time excluded from NW forecast (FCST-01) — locked; do not regress

### Roadmap Evolution

- Phase 7: LOCF consolidation + Nyquist 3–6 (v1.0)
- Phase 12: debts refresh + Nyquist 10–11 (v1.1)
- Phases 13–17: v1.2 Доходы (schema → CRUD → actual/overdue → stats → forecast+ISO)

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| todos | 2026-09-05-add-salary-income-tracking-with-forecast.md | promoted → v1.2 | 2026-09-07 | v1.1 |
| todos | 2026-09-05-add-timezone-selection-to-settings.md | (presence-only) | 2026-09-07 | v1.1 |
| todos | 2026-09-05-improve-credit-account-type-with-limit-grace-period-and-fore.md | (presence-only) | 2026-09-07 | v1.1 |
| todos | 2026-09-05-integrate-local-ai-agent-via-subprocess.md | (presence-only) | 2026-09-07 | v1.1 |
| todos | 2026-09-05-merge-debit-crypto-cash-account-types-into-one.md | (presence-only) | 2026-09-07 | v1.1 |
| scope | ACCT-01 delete → ACCT-04 (D-14) | deferred | 2026-09-02 | v1 |

## Session Continuity

Last session: 2026-09-07
Stopped at: v1.2 ROADMAP.md written (phases 13–17); ready for `/gsd-plan-phase 13`
Resume file: None
