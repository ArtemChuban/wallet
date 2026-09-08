# Stack Research

**Domain:** Credit-card grace-period tracking + NW forecast obligation overlay (Wallet v1.3)
**Researched:** 2026-09-08
**Confidence:** HIGH
**Milestone:** v1.3 Кредитка (subsequent — ADD to existing app; do not replace core stack)

## Recommended Stack

### Core Technologies (reuse — do NOT replace)

| Technology | Version (pinned in `package.json`) | Purpose for v1.3 | Why recommended |
|------------|--------------------------------------|------------------|-----------------|
| Next.js | 16.3.4 App Router | Credit-account grace fields + amount-due / early-close Server Actions; Капитал `/` forecast payload | Same RSC + action + `revalidatePath` pattern as accounts / income |
| Prisma | 7.10.0 + `@prisma/adapter-better-sqlite3` 7.10.0 + `better-sqlite3` 13.0.3 | New grace config + obligation rows on existing SQLite | Matches `String` YYYY-MM-DD + `BigInt` minor conventions; no second DB |
| React | 19.2.8 | Dialogs for amount-due / early close; dashboard chart shell | Already on shadcn Dialog + `DashboardChartsShell` |
| Zod | 4.5.4 | Validate grace start date, days-to-due (>0), obligation majors/as-of | Action-layer standard (`src/lib/validations/*`) |
| recharts | 3.10.1 | Same dashed «Прогноз» `Line` (`strokeDasharray="5 5"`) | Phase 17 already ships overlay chrome — merge credit slots into same series |
| Vitest | 4.1.11 | Pure tests: cycle due dates, open vs closed obligations, forecast cumulative (±) | Same as `nw-forecast.test.ts` / income |
| shadcn/ui + Tailwind 4 | existing | Credit forms; destructive early-close second step | UI constitution — no `window.confirm` |

### Supporting Libraries (in-repo — prefer these over npm)

| Library / module | Version | Purpose | When to use |
|------------------|---------|---------|-------------|
| `@/lib/dates` | — (extend if needed) | `calendarDateToday`, `addCalendarDays`, `clampDayOfMonth`, Moscow TZ | **Primary** for grace: `dueAsOf = addCalendarDays(cycleStart, graceDays)`; monthly cycle walk |
| `@/lib/nw-forecast` | — (extend) | Cumulative sparse forecast from today anchor + slots | Feed **open credit obligations as negative** `plannedAmountMinor` (or signed slot) into same `buildNetWorthForecastSeries` |
| `@/lib/income.ts` patterns | — (mirror, don't import into NW history) | `monthsOverlapping` / occurrence keys / open-membership | Model monthly grace cycles the same way salary DOM walks months — lift shared month-walk to `@/lib/dates` only if duplication hurts |
| `@/lib/money` + `@/lib/locf` | — | Minor units + FX LOCF as-of today for non-primary credit currencies | Same honesty as income forecast (exclude + «Прогноз неполный» banner) |
| `@/lib/net-worth` + `@/lib/historical-series` | — | Historical NW only | **Do not** import grace/forecast into these (mirror INISO / ISO-01) |
| New pure `@/lib/credit-grace*.ts` (app code) | — | Cycle generation, open obligation → forecast slots, early-close membership | Keep Prisma out of unit math |
| Existing `Account` (`FIAT_CREDIT`) | Prisma | Grace config lives on credit accounts | No parallel “credit product” entity unless contract study forces it |
| Bank contract notes | markdown under `.planning/` | Document issuer grace rules before plan lock | **Not** a library — human-authored rules → product decisions |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest 4.1.11 | Due-date matrix (month-end start + N days), closed obligation excluded from overlay | Prefer pure functions; inject `today` |
| Prisma migrate | Schema for grace fields + obligation entries | Only “install” step for v1.3 |
| Docker (existing) | Unchanged | No cron workers / schedulers |

## Installation

```bash
# v1.3 stack additions: NONE expected.
# Keep pins: next@16.3.4 prisma@7.10.0 recharts@3.10.1 zod@4.5.4 vitest@4.1.11

# Do NOT install for this milestone:
# npm install date-fns @date-fns/utc luxon dayjs temporal-polyfill
# npm install rrule cron cron-parser node-cron
# npm install victory chart.js nivo @visx/xychart fullcalendar
# npm install decimal.js bigint-money
```

Schema/work is Prisma migration + TypeScript modules only.

## Alternatives Considered

| Recommended | Alternative | When alternative wins |
|-------------|-------------|------------------------|
| Extend `@/lib/dates` + `addCalendarDays` | `date-fns@4.4.0` (+ `@date-fns/utc`) | Never for v1.3 — app has **no** date-fns today; local `Date` math needs UTC wrappers and duplicates YYYY-MM-DD model |
| Month walk + fixed day offset | `rrule@2.8.1` | Only if contract requires RFC5545 / “Nth weekday” / exported ICS — not monthly start+N days |
| Query-time cycle + obligation rows | `cron-parser` / `node-cron` | Never — no background jobs; due dates are pure calendar math at read/forecast time |
| Merge obligations into existing `ForecastSlot` series | Second recharts series / new chart lib | Only if UX later demands separate «доход» vs «кредит» dashed lines; still same package |
| Manual amount-due entry | Derive due from `BalanceSnapshot` history | Explicitly out of scope for v1.3 |
| Forecast overlay only | Write `BalanceSnapshot` on amount-due / early close | Violates ISO-01 / income isolation pattern |

## What NOT to Use

| Avoid | Why | Use instead |
|-------|-----|-------------|
| `date-fns` / `@date-fns/utc` / `luxon` / `dayjs` / Temporal polyfill | Second calendar model; TZ/DST traps on `addMonths` without UTCDate; `addCalendarDays` already correct for grace due | Extend `@/lib/dates` (optional thin `addCalendarMonths` with clamp if cycle anchor advances by month) |
| `rrule` | Overkill; RFC BYMONTHDAY **skips** invalid days — conflicts with income clamp semantics | `monthsOverlapping`-style walk + `addCalendarDays(start, days)` |
| `cron` / `cron-parser` / job queues | Docker single-user app; no daemon | Generate cycles/slots in pure lib + Server Action |
| New chart library | Breaks shadcn `chart.tsx` + Phase 17 chrome | `recharts@3.10.1` dashed `Line` already on Капитал |
| Money npm libs | Conflicts with INTEGER minor + BigInt FX | `@/lib/money` |
| Interest / APR calculation engines | Out of scope unless contract study forces more | Manual amount-due + early close only |
| Bank/OCR/PDF parsers for contracts | Contract study is documentation | Human notes → decisions in PROJECT/CONTEXT |

## Stack Patterns by Variant

**If grace = cycle start date + integer days (product lock):**
- Persist start + `graceDays` on `FIAT_CREDIT` (or per-cycle row keyed by start).
- Due date = `addCalendarDays(cycleStartAsOf, graceDays)` — no month library required for the offset itself.
- Next cycle start: advance by calendar month with **documented clamp** (reuse `clampDayOfMonth` / income month walk). Product must lock end-of-month behavior after bank contract study.

**If forecast overlay includes credit obligations:**
- Build open obligation slots with **negative** primary minor (payment reduces NW forecast).
- Pass them into `buildNetWorthForecastSeries` alongside income slots (same cumulative stair-step).
- Keep one dashed «Прогноз» Line; do not rewrite `computeNetWorthRows` / historical LOCF.
- FX: convert with `locfRateAsOf(..., today)` like income; missing rate → partial banner.

**If early close / repayment recorded:**
- Persist close entry; exclude that cycle’s obligation from open slots (mirror income “actual fills plan”).
- Do **not** auto-write `BalanceSnapshot`.

**If bank contract study changes rules:**
- Update planning docs + pure helpers; still no scheduling npm package unless rules become RFC-complex (unlikely for consumer grace).

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `recharts@3.10.1` | `react@19.2.8`, existing `NetWorthHistoryChart` | `Line.strokeDasharray` verified; Phase 17 already uses `"5 5"` |
| `prisma@7.10.0` | SQLite + BigInt money | New grace/obligation models: `asOf` as `String` YYYY-MM-DD |
| `zod@4.5.4` | Next Server Actions | Validate `graceDays` positive int; dates via existing asOf schemas |
| `vitest@4.1.11` | Pure TS under `src/lib/` | Extend `nw-forecast.test.ts` for negative slots |
| `date-fns@4.4.0` (rejected) | Would also need `@date-fns/utc` for safe calendar math | npm latest checked 2026-09-08; still wrong fit |
| `rrule@2.8.1` (rejected) | — | Justified only for complex RFC recurrence |

## Integration Points (roadmap-facing)

1. **Prisma** — extend `Account` (FIAT_CREDIT) and/or add grace-cycle + obligation tables; money as `BigInt` minor; dates as `String` YYYY-MM-DD.
2. **`@/lib/dates`** — reuse `addCalendarDays` for due; optional month-advance helper; **do not** add date-fns.
3. **`@/lib/nw-forecast` + `DashboardChartsShell`** — load open credit obligations into forecast slot pipeline with income; same `forecastHorizonEnd` / merge / partial banner.
4. **`NetWorthHistoryChart`** — no new series type required if cumulative overlay stays one `forecast` key.
5. **INISO wall** — `iniso.test.ts` pattern: grace/forecast must not import into `net-worth` / `historical-series` / BalanceSnapshot writers.
6. **Contract docs** — `.planning/` notes only; not runtime deps.

## Sources

- `package.json` pins (Next 16.3.4, Prisma 7.10.0, recharts 3.10.1, Zod 4.5.4, Vitest 4.1.11) — **HIGH** (repo fact; no date-fns present)
- `src/lib/dates.ts`, `src/lib/nw-forecast.ts`, `src/components/dashboard/DashboardChartsShell.tsx`, `NetWorthHistoryChart.tsx` (`strokeDasharray="5 5"`) — **HIGH** (codebase)
- `prisma/schema.prisma` (`Account.creditLimitMinor`, income models as side-ledger pattern) — **HIGH** (codebase)
- https://recharts.github.io/en-US/api/Line/ — `strokeDasharray`, `connectNulls` — webfetch alone **LOW**; cross-checked with Phase 17 usage → **HIGH** for “reuse chart”
- date-fns TZ/`addMonths` issues + `@date-fns/utc` requirement — websearch **MEDIUM** (reason to reject adding date-fns)
- rrule vs simple month+offset / billing clamp guidance — websearch **MEDIUM** (rrule only for complex RFC patterns)
- npm view `date-fns@4.4.0`, `rrule@2.8.1`, `cron-parser@5.10.0` — registry versions **LOW** provider; versions confirmed

---
*Stack research for: Wallet v1.3 Кредитка (grace periods + forecast obligations)*
*Researched: 2026-09-08*
*Verdict: add zero npm packages; Prisma schema + extend `@/lib/dates` / credit-grace pure lib / `nw-forecast` slot pipeline only. Bank contract = docs, not a library.*
