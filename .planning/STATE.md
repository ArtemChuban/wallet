---
gsd_state_version: 1.0
current_phase: 07
current_phase_name: "Address tech debt: LOCF consolidation + Nyquist 3–6"
status: executing
stopped_at: Completed 07-01-PLAN.md
last_updated: "2026-09-04T09:59:48.721Z"
last_activity: 2026-09-04
last_activity_desc: Phase 07 execution started
state_head: 5415717adc9aa883a1751bedf5a728a6126d49b8
progress:
  total_phases: 7
  completed_phases: 5
  total_plans: 24
  completed_plans: 22
  percent: 71
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-03)

**Core value:** At any moment, see true net worth (assets minus credit-card debt) in the primary currency and in each account's original currency, with history you can trust over time.
**Current focus:** Phase 07 — Address tech debt: LOCF consolidation + Nyquist 3–6

## Current Position

Phase: 07 (Address tech debt: LOCF consolidation + Nyquist 3–6) — EXECUTING
Plan: 2 of 3
Status: Ready to execute
Last activity: 2026-09-04 — Phase 07 execution started

Progress: [███████░░░] 71%

## Performance Metrics

**Velocity:**

- Total plans completed: 21
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 4 | - | - |
| 03 | 3 | - | - |
| 02 | 5 | - | - |
| 4 | 3 | - | - |
| 5 | 3 | - | - |
| 06 | 3 | - | - |

**Recent Trend:**

- Last 5 plans: —
- Trend: —

*Updated after each plan completion*
**Per-Plan Metrics:**

| Plan | Duration | Tasks | Files |
|------|----------|-------|-------|
| Phase 01 P01 | 4min | 2 tasks | 23 files |
| Phase 01 P02 | 2min | 2 tasks | 6 files |
| Phase 01 P03 | 3min | 3 tasks | 7 files |
| Phase 01 P04 | 77min | 3 tasks | 15 files |
| Phase 02-currencies-accounts P01 | 4min | 3 tasks | 7 files |
| Phase 02-currencies-accounts P02 | 4min | 2 tasks | 10 files |
| Phase 02-currencies-accounts P03 | 5min | 3 tasks | 11 files |
| Phase 02-currencies-accounts P04 | 35min | 3 tasks | 4 files |
| Phase 02-currencies-accounts P05 | 1min | 2 tasks | 2 files |
| Phase 03 P01 | 5min | 3 tasks | 7 files |
| Phase 03-dated-balance-snapshots P02 | 6min | 3 tasks | 6 files |
| Phase 03-dated-balance-snapshots P03 | 15min | 3 tasks | 4 files |
| Phase 04-dated-fx P01 | 4min | 3 tasks | 9 files |
| Phase 04-dated-fx P02 | 6min | 3 tasks | 9 files |
| Phase 05-net-worth-dashboard P01 | 3 min | 3 tasks | 5 files |
| Phase 05 P02 | 4min | 3 tasks | 3 files |
| Phase 05-net-worth-dashboard P03 | 7min | 3 tasks | 2 files |
| Phase 06-historical-charts P01 | 14min | 3 tasks | 11 files |
| Phase 06-historical-charts P02 | 5min | 3 tasks | 6 files |
| Phase 06 P03 | 1min | 3 tasks | 11 files |
| Phase 07 P01 | 2 min | 2 tasks | 5 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Roadmap follows research build order: persist → currencies/accounts → snapshots → FX → NW dashboard → charts
- Polish-only / Russian ops hardening folded into UI-bearing phases (no standalone polish phase)
- v1 excludes transactions, auto FX APIs, and bank sync
- Phase 1 locks Next.js + Prisma + shadcn (D-01–D-04); money INTEGER + scale + rate×10^8 (D-07–D-09)
- [Phase 01]: Human-approved exact pins: next@16.3.4, prisma 7.10.0 stack, better-sqlite3@13.0.3 (no Prisma 8 RC)
- [Phase 01]: Scaffolded create-next-app via temp dir rsync because repo root already had .planning/
- [Phase 01]: Used shadcn defaults (-d): base-nova style, CSS variables, lucide icons
- [Phase 01]: Kept Plan 01 layout fonts/globals.css import; Task 2 already satisfied
- [Phase 01]: Human locked-context: INTEGER minor units, required Currency.scale, FX × 10^8 BigInt
- [Phase 01]: Host DATABASE_URL default file:./data/wallet.db; Compose overrides later
- [Phase 01]: Safe/larger COPY of node_modules + src/generated into runner for migrate + Prisma client
- [Phase 01]: npm overrides pin better-sqlite3@13.0.3; rebuild native addon in Docker deps stage
- [Phase 01]: Ready page force-dynamic so DB status is not baked at image build time
- [Phase 02]: Kept D-01 seed in migration SQL with Currency_one_primary partial unique index — CONTEXT D-01/D-02; migrate deploy must seed RUB
- [Phase 02]: Briefly stopped wallet-web container so host migrate deploy could unlock SQLite — Compose app held data/wallet.db lock
- [Phase 02]: Used Select for create scale 0–18 with hidden FormData field — Select UX for bounded scale; hidden input posts FormData for Server Action
- [Phase 02]: Remount CurrencyFormBody on Dialog open so useActionState success does not stick — Stale success closed Dialog immediately on reopen
- [Phase 02]: Serialized creditLimitMinor as string for client Dialog props (RSC BigInt boundary)
- [Phase 02]: Briefly stopped wallet-web so host migrate deploy could unlock SQLite
- [Phase 02]: SelectValue uses TYPE_LABELS formatter so trigger shows Russian type labels, not enum codes
- [Phase 02]: Human-verify checkpoint PASSED after Select label defect fix (user: Все окей)
- [Phase 02]: Controlled dialog name via mount-init useState; formKey remount resets; no post-mount prop sync useEffect
- [Phase 02]: Create and edit name Inputs both controlled so control mode never flips across revalidatePath
- [Phase 03]: BalanceSnapshot + accountId_asOfDate unique; LOCF null-before-first; calendarDateToday Europe/Moscow
- [Phase 03]: Future-date and credit 0..limit deferred to Plan 02 Server Actions
- [Phase 03]: Batch LOCF on page with findMany lte today (not N getBalanceAsOf calls)
- [Phase 03]: Credit labels shipped in tracer dialog; bounds enforced in Task 2 TDD
- [Phase 03]: Human-verify PASS for Russian /accounts balance chrome (set, LOCF, credit, history delete)
- [Phase 03]: History panel bg-muted/40; delete destructive; expand aria Показать/Скрыть историю балансов
- [Phase 4]: FxRate replaces FxRateStub with currencyCode_asOfDate unique LOCF identity
- [Phase 4]: getRateAsOf returns null before first rate — never 0 or 1 (D-15)
- [Phase 4]: Rate helpers at scale 8: parseRateToScaled, formatRateScaled, invertRateScaled
- [Phase 4]: Nav Валюты href /currencies/rates with active on any /currencies* path (D-03)
- [Phase 4]: Layout tabs exact-path active so Валюты and Курсы never highlight together
- [Phase 4]: fromPrimary inverts via invertRateScaled before upsert; storage always rateToPrimaryScaled
- [Phase 5]: Primary-currency accounts convert via identity; never require an FxRate row — FX table stores non-primary pairs only (Phase 4 D-16); requiring a rate for RUB would exclude primary debit accounts (RESEARCH pitfall 3)
- [Phase 5]: DashboardAccountList is a Server Component with pre-formatted native/primary strings — D-16 forbids actions on dashboard; formatting on the RSC avoids BigInt client serialization
- [Phase 5]: Credit copy, partial banner, empty state, and DB try/catch deferred to Plans 02–03 — Plan 01 scope is tracer math plus hero and flat asset list; Plan 02/03 own chrome
- [Phase 5]: Credit/exclusion labels in DashboardAccountList; page passes formatted majors + excludeReason/isCredit
- [Phase 5]: Partial banner omitted when isPartial false; body copy verbatim from UI-SPEC
- [Phase 5]: Empty CTA uses Button asChild Link to /accounts — same pattern as RateList empty state
- [Phase 5]: DB failures stay on / inside mx-auto max-w-3xl shell; no separate readiness route
- [Phase 06]: Pinned recharts@3.10.1; chart.tsx from official registry after shadcn CLI hang
- [Phase 06]: RSC serializes chart minors as strings; client rebuilds series on RangePreset
- [Phase 06]: Moved account list inside DashboardChartsShell for shared RangePreset (D-08)
- [Phase 06]: Credit rows keep Line path; isCredit reserved for Plan 03 stacked Areas
- [Phase 06]: Credit stack from creditDebtMinor+available LOCF, not NW contribution
- [Phase 06]: Human-verify 06-03 Task 3 PASSED: approved RU UI charts on /
- [Phase 06]: Post-checkpoint: client-safe money/dates, db:seed, NW stacked by account
- [Phase 07]: Hybrid LOCF API: pickLatestAsOf + firstHitLocfMap + typed wrappers — RESEARCH Q2 / D-01 discretion; minimal drift from page batch + series pure
- [Phase 07]: firstHitLocfMap stores full row; pages read amount/rate fields — Preserves existing Map value shape without mapping adapters

### Pending Todos

None yet.

### Blockers/Concerns

- SQLite journal_mode (WAL vs DELETE) — prefer WAL on native btrfs; confirm in Plan 04 smoke
- Package legitimacy human gate before npm install (Plan 01)
- One-way money/FX door human decision before schema (Plan 03)

### Roadmap Evolution

- Phase 7 added: Address tech debt: LOCF consolidation + Nyquist 3–6

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| maintainability | Triplicate LOCF (helpers unused; page batch + historical-series copies) | open | 2026-09-04 | v1 |
| nyquist | Phases 3–6 VALIDATION.md still `draft` / NOT-VALIDATED | open | 2026-09-04 | v1 |
| docs | PROJECT.md Active still lists charts unchecked | open | 2026-09-04 | v1 |
| scope | ACCT-01 delete → ACCT-04 (D-14) | deferred | 2026-09-02 | v1 |

## Session Continuity

Last session: 2026-09-04T09:59:48.582Z
Stopped at: Completed 07-01-PLAN.md
Resume file: None
