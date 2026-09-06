---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Долги людям
current_phase: 12
current_phase_name: "Address tech debt: debts refresh + Nyquist 10–11"
status: Plans revised — execute next
stopped_at: Phase 12 plans revised (checker feedback) — execute next
last_updated: "2026-09-06T22:00:00.000Z"
last_activity: 2026-09-06
last_activity_desc: Phase 12 plans revised for checker (12-02 import graph, 12-03 Nyquist verifies, RESEARCH RESOLVED)
state_head: bb098382ce2890ff3d3b8fe14576698715e82d7c
progress:
  total_phases: 5
  completed_phases: 4
  total_plans: 18
  completed_plans: 15
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-09-06 after Phase 11)

**Core value:** At any moment, see true net worth (assets minus credit-card debt) in the primary currency and in each account's original currency, with history you can trust over time.
**Current focus:** Phase 12 tech debt — plans ready; `/gsd-execute-phase 12`

## Current Position

Phase: 12 — Address tech debt: debts refresh + Nyquist 10–11
Plan: 12-01 (Wave 1) ready
Status: Plans ready — execute next
Total Plans in Phase: 3
Last activity: 2026-09-06 — Phase 12 PLAN.md files written (12-01..12-03)

## Performance Metrics

**Velocity:**

- Total plans completed: 32
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
| 07 | 3 | - | - |
| 10 | 4 | - | - |
| 11 | 4 | - | - |

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
| Phase 07 P02 | 1 min | 2 tasks | 3 files |
| Phase 07 P03 | 2min | 2 tasks | 4 files |
| Phase 08 P01 | 3min | 3 tasks | 5 files |
| Phase 08 P02 | 3min | 2 tasks | 2 files |
| Phase 08 P03 | 2min | 2 tasks | 2 files |
| Phase 09-people-debts-crud-nav P01 | 3min | 3 tasks | 7 files |
| Phase 09-people-debts-crud-nav P02 | 4min | 3 tasks | 6 files |
| Phase 09-people-debts-crud-nav P03 | 7min | 3 tasks | 7 files |
| Phase 09 P04 | 2min | 2 tasks | 2 files |
| Phase 10 P01 | 3min | 3 tasks | 6 files |
| Phase 10-repayments-close-write-off P02 | 5min | 3 tasks | 8 files |
| Phase 10 P03 | 3min | 3 tasks | 5 files |
| Phase 10-repayments-close-write-off P04 | 2 min | 2 tasks | 2 files |
| Phase 11 P01 | 5min | 3 tasks | 12 files |
| Phase 11-charts-primary-totals P02 | 2min | 3 tasks | 3 files |
| Phase 11-charts-primary-totals P03 | 1 min | 2 tasks | 2 files |
| Phase 11-charts-primary-totals P04 | 1 min | 2 tasks | 2 files |

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
- [Phase 07]: Deleted private locfAmountAsOf/locfRateAsOf in historical-series; import shared wrappers — LOCF-03 / D-05 single semantics surface
- [Phase 07]: Kept getBalanceAsOf/getRateAsOf as Prisma findFirst; pointer comments to @/lib/locf only — LOCF-04 keep thin wrappers; no page N× get*AsOf
- [Phase 07]: Docs-only Nyquist close for phases 3-6; no auditor - all Wave 0 paths present
- [Phase 07]: PROJECT.md Active and nav Валюты left untouched during NYQ-03..06 (D-02 deferred)
- [Phase 08]: size-change-two-tables (D-01/D-02): no writeOffMinor; repayments + DebtSizeChange events
- [Phase 08]: remainingMinor = initial + Σ delta − Σ repayments; status synced from remaining (CLOSED↔0)
- [Phase 08]: A6: computeDebtPrimaryTotals takes rateToPrimaryScaled not asOfDate (LOCF at call site)
- [Phase 08]: assertInitialImmutable(stored, proposed) rejects unequal create-time principal
- [Phase 08]: updateDebtMetaSchema omits all initial* fields; .strict() rejects smuggled initialAmountMajor
- [Phase 08]: createSizeChangeSchema accepts signed deltaMajor strings; zero-delta deferred to assertSizeDelta
- [Phase 09]: Duplicate person P2002 copy: «Человек с таким именем уже есть»
- [Phase 09]: PersonFormDialog create-only in 09-01; rename/delete deferred to 09-02
- [Phase 09]: revalidatePath('/debts') only for person create — never touch dashboard /
- [Phase 09]: Client skips confirm when debtCount>0 and shows PERSON-02 blocked copy immediately (D-07) — Matches D-07: debts present → blocked error; none → destructive confirm
- [Phase 09]: P2003 race fallback: «Не удалось удалить. Попробуйте снова.» — Belt for count-then-delete race per plan assumptions
- [Phase 09]: NewDebtButton / header «Новый долг» stub until Plan 03 DebtFormDialog — D-21/D-22 labels now; form wiring is Plan 03
- [Phase 09]: Exported createDebtWithNewPersonSchema for compound D-06 validation and tests
- [Phase 09]: Single createDebt action branches on personId presence vs new-person name field
- [Phase 09]: Person mode toggle (Существующий / Новый человек) inside debt create dialog
- [Phase 09]: Reuse DestructiveConfirmStep for AccountList snapshot delete (D-17)
- [Phase 09]: AccountList confirm test uses .ts extension to match vitest include pattern
- [Phase 10]: Over-repay maps to Russian amountMajor «Сумма больше остатка долга»
- [Phase 10]: History chrome placeholder until Plan 02; DebtRow.status from stored Debt.status
- [Phase 10]: Size-change delete UI and Списание label deferred to Plan 03; deleteSizeChangeSchema stub landed in 10-02
- [Phase 10]: CLOSED debts use per-person collapsed Закрытые (N) via debt.status
- [Phase 10]: no-forgive-label / no-isForgive: user declined separate Списание label; forgive is UX+server delta only
- [Phase 10]: Intentional override of CONTEXT D-07 label distinction (Изменение суммы for all size-changes)
- [Phase 10]: Shared staleRecordRefreshState for P2025 and app missing-record throws — Same user recovery path for Prisma not-found and REPAYMENT_NOT_FOUND / SIZE_CHANGE_NOT_FOUND
- [Phase 10]: forgiveRemaining wraps assertSizeDelta like createSizeChange; maps codes + raw messages — H4: never leave assertSizeDelta fallthrough to opaque save catch-all
- [Phase 11]: openedAsOf-moscow-backfill: required Debt.openedAsOf; migration backfills from createdAt as Europe/Moscow (+3h) calendar date — Human checkpoint Task 1; matches CONTEXT D-08 and avoids UTC off-by-one near midnight
- [Phase 11]: Stack series keys repaidMajor/remainingMajor; kind tertiary repayment before sizeChange — RESEARCH A3/A4/A5; end-of-day collapse one point per asOfDate
- [Phase 11]: Edit shows read-only openedAsOf (not omit) for honesty; still never posts the field (D-09 A-edge)
- [Phase 11]: TDD RED skipped for schema/action immutability — 11-01 already green; Task 1 added missing action smuggle assertion only
- [Phase 11]: Hero always mounts above DebtsList/empty CTA even with zero people (D-12)
- [Phase 11]: Excluded row labels join person name + currencyCode + нет курса for no_fx (D-13)
- [Phase 11]: Excluded-account reasons reuse DashboardAccountList copy: нет баланса | нет курса — Match /debts partial honesty UX on Капитал without new copy invent
- [Phase 11]: Optional DebtPrincipalStackChart historical-series ban included in disol.test.ts — Locks T-11-05 bidirectional isolation for chart series

### Pending Todos

- Add timezone selection to settings (general, minor)
- Integrate local AI agent via subprocess — Claude Code CLI / Cursor agent (general, minor)
- Merge debit, crypto, and cash account types into one type (database, minor)
- Improve credit account type — limit, grace period, statement-date forecasting (general, major)
- Add salary/income tracking with plan vs actual and forecast (general, major)

### Blockers/Concerns

- SQLite journal_mode (WAL vs DELETE) — prefer WAL on native btrfs; confirm in Plan 04 smoke
- Package legitimacy human gate before npm install (Plan 01)
- One-way money/FX door human decision before schema (Plan 03)

### Roadmap Evolution

- Phase 7 added: Address tech debt: LOCF consolidation + Nyquist 3–6
- Phase 12 added: Address tech debt: debts refresh + Nyquist 10–11

## Deferred Items

Items acknowledged and deferred at milestone close, most recent first:

| Category | Item | Status | Deferred At | Milestone |
|----------|------|--------|-------------|-----------|
| maintainability | Triplicate LOCF (helpers unused; page batch + historical-series copies) | closed (Phase 07) | 2026-09-04 | v1 |
| nyquist | Phases 3–6 VALIDATION.md still `draft` / NOT-VALIDATED | closed (Phase 07) | 2026-09-04 | v1 |
| docs | PROJECT.md Active still lists charts unchecked | closed (moved to Validated at Phase 07 transition) | 2026-09-04 | v1 |
| scope | ACCT-01 delete → ACCT-04 (D-14) | deferred | 2026-09-02 | v1 |

## Session Continuity

Last session: 2026-09-06T22:00:00.000Z
Stopped at: Phase 12 planned (3 plans) — execute next
Resume file: none

## Quick Tasks Completed

| Date | Task | Result |
|------|------|--------|
| 2026-09-05 | DebtDetailDialog tabs (variant 1) | Shipped; Orca: tablist + one panel; История без формы |

## Operator Next Steps

- `/gsd-execute-phase 12` — Wave 1: 12-01 tracer refresh+assert; then 12-02 UI home; 12-03 Nyquist
- Plans: `.planning/phases/12-address-tech-debt-debts-refresh-nyquist-10-11/12-0{1,2,3}-PLAN.md`
