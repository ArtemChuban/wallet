# Stack Research

**Domain:** Income/salary plan-vs-actual ledger + NW forecast overlay on existing Wallet
**Researched:** 2026-09-07
**Confidence:** HIGH
**Milestone:** v1.2 Доходы (subsequent — ADD to existing app; do not replace core stack)

## Recommended Stack

### Core Technologies (reuse — do NOT replace)

| Technology | Version (pinned in `package.json`) | Purpose for v1.2 | Why recommended |
|------------|--------------------------------------|------------------|-----------------|
| Next.js | 16.3.4 App Router | `/income` (Доходы) RSC page + Server Actions; nav link; Капитал `/` stays NW home | Same CRUD/revalidate pattern as accounts + `/debts` |
| Prisma | 7.10.0 + `@prisma/adapter-better-sqlite3` 7.10.0 + `better-sqlite3` 13.0.3 | New income models + migrations on existing SQLite | Matches money/FX/Person conventions; no second DB |
| React | 19.2.8 | Client charts/dialogs for plan→actual + overdue highlight | Already on shadcn Dialog / ChartContainer |
| Zod | 4.5.4 | Validate day-of-month, amounts, plan/actual dates | Already action-layer standard |
| recharts | 3.10.1 | NW history + **future projection** series | Official `strokeDasharray`, `connectNulls`, `ReferenceLine` cover forecast UX — no new chart lib |
| Vitest | 4.1.11 | Pure tests: occurrence generation, overdue, forecast overlay math | Same as debts/NW series |
| shadcn/ui + Tailwind 4 | existing | «Доходы» list/forms; overdue visual | Keep Russian-first UI constitution (in-dialog destructive confirm) |

### Supporting Libraries (in-repo — prefer these over npm)

| Library / module | Version | Purpose | When to use |
|------------------|---------|---------|-------------|
| `@/lib/dates` | — (extend) | Moscow `calendarDateToday`, `addCalendarDays`, **new** day-of-month → YYYY-MM-DD (clamp to last day of month) | Recurring salary schedule + overdue (`planDate < today && no actual`) |
| `@/lib/money` | — | INTEGER minor units + `Currency.scale`; primary conversion | Multi-currency income amounts |
| `@/lib/fx` + `@/lib/locf` | — | FX rate×10^8 LOCF as-of plan/projection date | Convert income → primary for stats + NW forecast points |
| `@/lib/historical-series` + `@/lib/net-worth` | — | Historical NW LOCF series | Keep as source of past NW; **do not** feed income into `computeNetWorthRows` |
| New pure `@/lib/income*.ts` (app code) | — | Templates → occurrences; plan vs actual; forecast cumulative overlay | All domain logic; chart only renders numbers |
| Existing `Person` model | Prisma | Income counterparty + per-person stats | Reuse debts counterparties; avoid parallel “Employer” table unless product forces rename |
| `lucide-react` | ^1.39.0 | Optional nav icon | Text-first nav still fine |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest 4.1.11 | Occurrence clamp (31→Feb), overdue boolean, forecast hinge at `today` | Prefer pure functions; no Prisma in unit math tests |
| `tsx` + `prisma db seed` | Seed sample recurring salary if useful | Optional; not a runtime dep |
| Docker (existing) | Unchanged deploy | No new services/workers |

## Installation

```bash
# v1.2 stack additions: NONE expected.
# Keep pins: next@16.3.4 prisma@7.10.0 recharts@3.10.1 zod@4.5.4 vitest@4.1.11

# Do NOT install for this milestone:
# npm install rrule date-fns luxon dayjs temporal-polyfill cron cron-parser
# npm install victory chart.js nivo @visx/xychart decimal.js bigint-money
```

Schema/work is Prisma migration + TypeScript modules only.

## Alternatives Considered

| Recommended | Alternative | When alternative wins |
|-------------|-------------|------------------------|
| Extend `@/lib/dates` for monthly day-of-month | `rrule@2.8.1` | Need RFC5545 export, weekly/complex rules, or interchange with calendars |
| Dual recharts series + `ReferenceLine` | New chart library (Victory/Nivo/Chart.js) | Never for v1.2 — breaks shadcn `chart.tsx` and existing NW stack |
| Stay on `AreaChart` / switch to `ComposedChart` only if needed | Always `ComposedChart` | Prefer minimal change: stacked historical Areas + dashed forecast `Line`/`Area` may require `ComposedChart` — still same package |
| Reuse `Person` as counterparty | New `IncomeCounterparty` model | Only if product forbids mixing employers with debt people |
| Pure forecast overlay lib | Mutate `computeNetWorthRows` / rewrite historical LOCF with planned pay | Never in v1.2 (PROJECT lock: projection ≠ rewriting past NW) |
| Manual plan/actual fields on occurrences | Auto-post balance snapshots on “received” | Deferred (Out of Scope) |

## What NOT to Use

| Avoid | Why | Use instead |
|-------|-----|-------------|
| `rrule` | Monthly DOM-only; RFC **skips** invalid days (31st → no Feb occurrence); `Date`/TZ fights YYYY-MM-DD calendar | `dates.ts` clamp-to-last-day helper + Vitest matrix |
| `date-fns` / `luxon` / `dayjs` / `temporal-polyfill` | Second calendar model; app already Moscow-aware string dates | Extend `@/lib/dates` |
| `cron` / `node-cron` / job queues | No background scheduler in Docker single-user app; occurrences are query-time or materialize-on-write | Generate occurrences in Server Action / pure lib |
| Victory / Chart.js / Nivo / visx | Duplicate chart stack; lose shadcn ChartContainer theming | `recharts@3.10.1` APIs already present |
| `decimal.js` / money npm libs | Conflicts with INTEGER minor + BigInt FX | `@/lib/money` |
| FullCalendar / react-big-calendar | Wrong UX (calendar grid ≠ income ledger) | List + overdue highlight on «Доходы» |
| Replacing Next / Prisma / recharts | Out of milestone scope; validated stack | Keep pins above |

## Stack Patterns by Variant

**If NW chart stays stacked Areas (current `NetWorthHistoryChart`):**
- Build one row array: historical `nw`/`stacks` through `today`; future rows with `nwForecast` (and null historical stacks).
- Render forecast as separate `Area` or `Line` with `strokeDasharray="5 5"`; hinge: share today’s value on both series keys so the stroke meets.
- Optional vertical `ReferenceLine` `x={today}` for “сейчас”.
- Leave `connectNulls` default `false` unless hinge sharing is intentional.

**If stacked Areas + forecast Line fight `AreaChart` children:**
- Switch that one component to `ComposedChart` from the **same** `recharts@3.10.1` — not a new dependency.

**If recurring salary day is 29/30/31:**
- Product rule: clamp to last calendar day of month (salary mental model). Implement in `@/lib/dates`; do not rely on rrule skip semantics.

**If income currency ≠ primary:**
- Convert with existing FX LOCF as-of the plan/projection date (`locfRateAsOf` / `convertOtherMinorToPrimaryMinor`). Missing rate → same honesty as NW (omit/flag), never invent 1.0.

**If marking actual:**
- Persist actual amount/date only; **do not** write `BalanceSnapshot` in v1.2.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `recharts@3.10.1` | `react@19.2.8`, shadcn `components/ui/chart.tsx` | `Area.strokeDasharray`, `Area.connectNulls`, `ReferenceLine` verified in official API docs |
| `prisma@7.10.0` | SQLite + existing BigInt money columns | New income models follow `Debt`/`Person` patterns (`asOf` as `String` YYYY-MM-DD) |
| `zod@4.5.4` | Next Server Actions | Validate `dayOfMonth` 1–31; resolve clamp in domain, not Zod alone |
| `vitest@4.1.11` | Pure TS under `src/lib/` | No browser chart tests required for forecast math |
| `rrule@2.8.1` (rejected) | — | Latest npm; still wrong fit for DOM clamp |

## Integration Points (roadmap-facing)

1. **Prisma** — income template + occurrence tables; FK to `Currency` + `Person`; money as `BigInt` minor.
2. **recharts** — extend `NetWorthHistoryChart` (or sibling) with forecast series; reuse `ChartContainer` / `formatChartNumber`.
3. **Domain lib** — `buildNetWorthSeries` stays historical; new `buildNwForecastOverlay(...)` appends future points from recurring plan amounts × FX.
4. **UI** — new App Router page «Доходы»; overdue = CSS/state when `plannedAsOf < calendarDateToday()` and actual empty.

## Sources

- `package.json` pins (Next 16.3.4, Prisma 7.10.0, recharts 3.10.1, Zod 4.5.4, Vitest 4.1.11) — **HIGH** (repo fact)
- https://recharts.github.io/en-US/api/Area/ — `strokeDasharray`, `connectNulls` — provider webfetch, classify-confidence **LOW** alone; cross-checked with live pin → treat pattern as **HIGH** for “no new chart lib”
- https://recharts.github.io/en-US/api/ReferenceLine/ — vertical `x` hinge — webfetch **LOW** alone; same cross-check
- Stack Overflow / community dual-series forecast pattern (historical + prediction null-split + `strokeDasharray`) — websearch **MEDIUM**
- https://github.com/jkbrzt/rrule/issues/657 + RFC BYMONTHDAY skip behavior — websearch **MEDIUM** (reason to reject rrule for salary DOM)
- npm `rrule@2.8.1`, `date-fns@4.4.0` version checks — npm view (classify-confidence **LOW** for provider; versions confirmed against registry)
- Existing `@/lib/dates.ts`, `NetWorthHistoryChart.tsx`, `prisma/schema.prisma` (`Person`) — **HIGH** (codebase)

---
*Stack research for: Wallet v1.2 Доходы (income plan-vs-actual + NW forecast)*
*Researched: 2026-09-07*
*Verdict: add zero npm packages; extend Prisma schema + dates/income/forecast libs + recharts series only.*
