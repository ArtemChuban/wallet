---
gsd_state_version: 1.0
milestone: v1.5
milestone_name: Сберегательный счет (Phases 27–31)
current_phase: 31
current_phase_name: ASSET ↔ SAVINGS type conversion
status: in_progress
stopped_at: Completed 31-02-PLAN.md
last_updated: "2026-09-22T12:38:09.559Z"
last_activity: 2026-09-22
last_activity_desc: Completed 31-01 — Zod + updateAccount ASSET↔SAVINGS matrix
state_head: 63e06f70f675b27d270808207df4cccacfbd75fc
progress:
  total_phases: 5
  completed_phases: 4
  total_plans: 12
  completed_plans: 12
  percent: 80
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-11 — v1.5 Сберегательный счет)

**Core value:** At any moment, see true net worth (assets minus credit-card debt) in the primary currency and in each account's original currency, with history you can trust over time.
**Current focus:** Phase 31 — ASSET ↔ SAVINGS type conversion

## Current Position

Phase: 31 — ASSET ↔ SAVINGS type conversion
Plan: 2 of 2 (next: 31-02)
Status: 31-01 complete — server conversion matrix green
Last activity: 2026-09-22 — completed 31-01-PLAN.md

Progress: [████████░░] 80%

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
| Phase 28-interest-math-forecast-kind P01 | 6min | 2 tasks | 2 files |
| Phase 28-interest-math-forecast-kind P02 | 5min | 2 tasks | 4 files |
| Phase 29 P01 | 5min | 3 tasks | 3 files |
| Phase 29 P02 | 3min | 2 tasks | 4 files |
| Phase 30 P01 | 4min | 3 tasks | 7 files |
| Phase 30 P02 | 2min | 2 tasks | 2 files |
| Phase 31 P01 | 5min | 3 tasks | 4 files |
| Phase 31 P02 | 3min | 2 tasks | 3 files |

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
- [Phase 28]: Month-2 compound expect is 10100n, not a second flat 10000n (D-02 overrides research flat LOCF)
- [Phase 28]: InterestAccountInput and InterestForecastSlot field names match Plan 28-02 so GREEN does not rewrite expects
- [Phase 28]: Today-dated interest includedSlotCount 0 is the hard fail; future +ΔNW already passes on the non-grace addend
- [Phase 28]: Month-2 credit is the truncated interest on principal grown by month 1 only (10000n then 10100n)
- [Phase 28]: slotInWindow and ΔNW both exhaust ForecastSlotKind so interest cannot fall through to the grace predicate or a silent addend
- [Phase 29]: SAVINGS golden series equals snapshot minors only; unused interest fixture voided (SAVISO-02)
- [Phase 29]: D-11 Wave 0 red locks dipped primary grace totals; plannedAmountMinor stays positive
- [Phase 29]: INT-03 FX: missing lists USD; today-dated rate includes; next-day rate drops
- [Phase 29]: D-11 grace line addend is -displayPrimaryMinor; plannedAmountMinor and displayPrimaryMajor stay positive
- [Phase 29]: forecastSavings uses InterestAccountInput keys; balanceMinor string on RSC, BigInt in shell
- [Phase 29]: Interest block mounts only on future tooltip between Прогноз level and grace (D-06)
- [Phase 30]: annualRatePercent via Number(formatBpsToPercentMajor(bps)) for SAVINGS only
- [Phase 30]: Inline interest membership in loadForecastOverlay (no shell extract)
- [Phase 30]: Triple-tag closer INISO-01/GRISO-01/SAVISO-01; drop A′ prose
- [Phase 30]: Skipped UI create (D-15) — live UAT Накопительный 27 already present — Orca UAT found existing SAVINGS seed; create path not exercised this run
- [Phase 30]: Assert no-write via sqlite BalanceSnapshot count + get_net_worth JSON identity — T-30-02 / D-14 dual barrier for overlay-only MCP reads
- [Phase 31]: Optional Zod type enum ASSET|SAVINGS only; FIAT_CREDIT/legacy rejected at schema
- [Phase 31]: Forbidden non-peer transitions return generic Russian save failure (no type detail)
- [Phase 31]: Same-type SAVINGS update omits type field; convert paths set type explicitly
- [Phase 31]: Shared create/convert Select; CONVERT_TYPE_OPTIONS excludes FIAT_CREDIT
- [Phase 31]: 31-UAT pending for end-of-phase Orca verify-work (OPERATOR)

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
- Phase 31 added: ASSET ↔ SAVINGS type conversion in account settings (both ways; reopens Phase 27 type immutability for this pair only)

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

Last session: 2026-09-22T12:38:09.426Z
Stopped at: Completed 31-02-PLAN.md
Resume file: None

## Operator Next Steps

- Next: execute `/gsd-execute-phase 31` plan 31-02 (AccountFormDialog unlock)
- Or: `/gsd-execute-plan` for 31-02
