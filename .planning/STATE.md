---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Доходы
current_phase: 14
current_phase_name: Доходы CRUD + nav
status: planning
stopped_at: Phase 14 plans written — ready for execute
last_updated: "2026-09-07T14:45:00.000Z"
last_activity: 2026-09-07
last_activity_desc: Phase 14 PLAN.md ×3 written
state_head: ef5f894
progress:
  total_phases: 5
  completed_phases: 1
  total_plans: 6
  completed_plans: 3
  percent: 20
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-07 — milestone v1.2 Доходы)

**Core value:** At any moment, see true net worth (assets minus credit-card debt) in the primary currency and in each account's original currency, with history you can trust over time.
**Current focus:** Phase 14 — Доходы CRUD + nav

## Current Position

Phase: 14 — Доходы CRUD + nav
Plan: 01 ready (3 plans, waves 1–3)
Status: Planned — ready for `/gsd-execute-phase 14`
Last activity: 2026-09-07 — Phase 14 plans written (14-01..14-03)

Progress: [██░░░░░░░░] 20% (v1.2 — 0/5 phases verified)

## Performance Metrics

**Velocity:**

- Total plans completed: 42 (v1.0: 24 + v1.1: 18)
- Average duration: —
- Total execution time: —

**By Phase:** Prior milestone tables retained in git history / prior STATE; v1.2 plans TBD after plan-phase.

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 13 P01 | 3min | 3 tasks | 7 files |
| Phase 13 P02 | 2min | 2 tasks | 2 files |
| Phase 13 P03 | 2min | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v1.2 income = side ledger (template → virtual occurrences → optional actual); not double-entry posting
- Actual does not write BalanceSnapshot; forecast is overlay only — never mutates historical LOCF / computeNetWorthRows (ISO-01)
- Reuse Person for counterparties; zero new npm packages; DOM clamp not rrule skip
- Roadmap order: schema+domain → /income CRUD → actual+overdue → stats → forecast+isolation
- DestructiveConfirmStep app-wide; agent-driven UAT via OPERATOR.md + Orca
- [Phase 13]: Four models (CONTEXT D-03/D-04) — auto-selected over polymorphic IncomeSource+enum
- [Phase 13]: Tracer ignores actuals; freeze-merge deferred to Plan 02
- [Phase 13]: A2 month-keyed freeze: frozen actual plannedAsOf wins over differing DOM candidate
- [Phase 13]: listAllInRange requires explicit from/to; no default horizon
- [Phase 13]: assertOneTimePlanImmutable throws when hasActual and plan date/amount differ
- [Phase 13]: ISO-01 light: bidirectional income↔NW/historical file-scan + UI-00 existsSync

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

Last session: 2026-09-07T12:08:10.674Z
Stopped at: Phase 14 context gathered
Resume file: /home/artem/Documents/wallet/.planning/phases/14-dohody-crud-nav/14-CONTEXT.md
