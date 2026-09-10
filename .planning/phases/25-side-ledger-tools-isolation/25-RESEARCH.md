# Phase 25: Side-Ledger Tools + Isolation - Research

**Researched:** 2026-09-10
**Domain:** In-process MCP read tools over Wallet side ledgers (debts / income / grace) + Капитал forecast overlay; DISOL/INISO/GRISO isolation proofs
**Confidence:** HIGH

## Summary

Phase 25 is another **thin MCP adapter wave** on top of Phase 23–24 host + CAP tools. No new finance math: wrap `debts.ts` / `income.ts` / `credit-grace.ts` / `nw-forecast.ts` with page-parity Prisma loaders, Cap-style `minorToJson` serialization, `readOnlyHint: true`, and **minimal** isolation one-liners. Full named DISOL/INISO/GRISO prose + connect docs stay Phase 26 (CLI-01).

Locked forecast contract (D-01…D-04): `get_forecast_overlay` returns the **sparse series** from `buildNetWorthForecastSeries` (income slots + A′ grace), free `horizonEnd`, default `today+365`, today via `calendarDateToday("Europe/Moscow")`. Isolation (D-05…D-08): keep lib twin suites; add thin MCP contract tests; **no** payload meta flags; **no** CI mutate ban; short description copy only.

**Primary recommendation:** Add `src/lib/mcp/tools/{debts,income,grace,forecast}.ts` + `reads/load-*-*.ts` assemblers mirroring `/debts`, `/income`, grace dialog, and `DashboardChartsShell` forecast fold; register four SIDE tools beside CAP; refresh server instructions past “side ledgers come later.” **No new npm packages.**

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Forecast overlay contract
- **D-01:** `get_forecast_overlay` returns a **sparse series** matching `buildNetWorthForecastSeries` (Капитал «Прогноз» parity) — not summary-only. — **Reversibility:** costly — published MCP response shape once agents connect
- **D-02:** Horizon input is free `horizonEnd` (`YYYY-MM-DD`). UI presets (`30d`/`90d`/`1y`) are **not** required params; optional mention in tool description only (how to pick a date).
- **D-03:** Overlay includes **income slots + A′ grace** `forecastEvents` (full SIDE-04 / Капитал parity) — not income-only or grace-only.
- **D-04:** Missing `horizonEnd` defaults to **today + 365 days** (same as UI `1y`/`all` cap). NW series anchor = `calendarDateToday` (Europe/Moscow now; settings timezone later via same helper).

### Isolation proof
- **D-05:** Tests = existing lib twin suites (`disol` / `iniso` / `griso`) **plus** thin MCP contract tests that SIDE tools do not fold debts into NW payloads and do not write/rewrite BalanceSnapshot / historical LOCF via income/grace paths.
- **D-06:** JSON payloads stay **UI-parity clean** — no `isolation` / `affectsHistoricalNw` meta fields. Isolation messaging lives in tool descriptions + server instructions only.
- **D-07:** **No** CI mutate-import ban under `src/lib/mcp/**` this phase (same as Phase 24 D-16) — enforce read-only via plan/review + tests.
- **D-08:** Isolation copy this phase = **minimal one-liner** per SIDE tool («side ledger; not historical NW») + update capital-era server instructions. Named `DISOL-01` / `INISO-01` / `GRISO-01` prose and full CLI-01 polish → Phase 26.

### Claude's Discretion
- **Tool catalog / names** — not discussed. Prefer research FEATURES defaults: `list_debts` (with primary totals in response or colocated helper), `list_income`, `list_grace_obligations`, `get_forecast_overlay`; no `wallet_` prefix; keep `wallet_ping` + CAP tools.
- **List filters / income range defaults** — not discussed. Prefer UI parity: debts/grace OPEN-focused like list pages; income `from`/`to` required or a documented default window consistent with domain callers — researcher/planner pick from existing page loaders.

### Deferred Ideas (OUT OF SCOPE)
- Full named DISOL/INISO/GRISO isolation prose + connect docs — Phase 26 (CLI-01/02)
- CI mutate-import ban under `src/lib/mcp/**` — optional later hardening
- Savings account type + interest NW forecast — backlog todo (not this phase)

### Reviewed Todos (not folded)
- **Savings account type with interest NW forecast** (`.planning/todos/pending/2026-09-10-savings-account-type-with-interest-nw-forecast.md`) — out of SIDE scope; remains backlog
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SIDE-01 | Agent can list debts and debt primary totals via MCP without folding debts into NW (DISOL-01) | `list_debts` → debts page loader + `remainingMinor` + `computeDebtPrimaryTotals`; totals in same payload; NW loaders stay debts-free; disol + MCP contract tests |
| SIDE-02 | Agent can list income (plan/actual/overdue) via MCP without writing BalanceSnapshot (INISO-01) | `list_income` → income page parity (`nextOpenPlannedAsOf` / `isIncomeOverdue`); read-only prisma; iniso + never-write contract tests |
| SIDE-03 | Agent can list grace obligations via MCP without rewriting historical NW LOCF (GRISO-01) | `list_grace_obligations` → OPEN (+ CTA via `mergeGraceListRows`); `isGraceOverdue`; griso + never-touch historical series tests |
| SIDE-04 | Agent can get Капитал forecast overlay (income + A′ grace) via MCP | `get_forecast_overlay` → shell fold + `openGraceForecastMembership` + `buildNetWorthForecastSeries`; sparse points + `forecastEvents` |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| MCP tool registration / protocol | API / Backend (`src/lib/mcp`) | Frontend Server (existing `/api/mcp`) | Same Phase 23–24 host |
| Debt list + primary totals (SIDE-01) | API / Backend | Database / Storage | Prisma Person/Debt + FX LOCF; pure `computeDebtPrimaryTotals` |
| Income list plan/actual/overdue (SIDE-02) | API / Backend | Database / Storage | Prisma income defs/actuals; pure overdue helpers |
| Grace obligations list (SIDE-03) | API / Backend | Database / Storage | Prisma CreditGrace* + pure merge/overdue |
| Forecast overlay (SIDE-04) | API / Backend | Database / Storage | Anchor NW today + income/grace membership + `buildNetWorthForecastSeries` |
| Isolation walls DISOL/INISO/GRISO | API / Backend (tests + descriptions) | — | Lib twins already; MCP must not breach via NW/history writes |
| Default today / horizon | API / Backend | — | `calendarDateToday` + `addCalendarDays(..., 365)` |
| Localhost guard / Compose bind | Unchanged (Phase 23) | — | Do not widen |

## Project Constraints (from .cursor/rules/ + AGENTS.md)

- **No `.cursor/rules/` directory** in this repo — no extra rule files beyond AGENTS/CLAUDE. [VERIFIED: glob `ls .cursor/rules` empty]
- **Next.js docs gate:** Read `node_modules/next/dist/docs/` before writing Next-specific code; APIs may differ from training. [VERIFIED: AGENTS.md:1-8]
- **UAT operator:** Before verify-work / UAT, read `.planning/OPERATOR.md`; agent drives `npm run dev` + Orca; ask human only for subjective / hard blockers. [VERIFIED: AGENTS.md:11-16]
- **Code search:** Prefer `codegraph query` / `codegraph explore` for project symbol search (user rule).
- **Graphify:** Disabled in this project (`gsd_run graphify status` → not enabled) — no graph freshness constraint this wave.

## Standard Stack

### Core (reuse — do not install new packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@modelcontextprotocol/server` | 2.0.0 (installed) | `McpServer.registerTool` + `createMcpHandler` | Phase 23–24 host; CAP pattern [VERIFIED: package.json + `npm ls` / create-handler.ts:1-36] |
| `zod` | 4.5.4 | `horizonEnd` / optional `from`/`to` / `includeClosed` schemas | Same as CAP `optionalAsOfSchema` [VERIFIED: package.json] |
| Prisma 7 + `@/lib/db` | existing | Side-ledger reads only | Single SQLite path |
| `@/lib/debts` | existing | `remainingMinor`, `assertStatusSynced`, `computeDebtPrimaryTotals` | Debts page parity [VERIFIED: debts.ts:21-29, 200-222] |
| `@/lib/income` | existing | `nextOpenPlannedAsOf`, `isIncomeOverdue`, `listAllInRange` | Income page + forecast [VERIFIED: income.ts:77-83, 311-335] |
| `@/lib/credit-grace` | existing | `mergeGraceListRows`, `isGraceOverdue`, `openGraceForecastMembership` | Grace UI + forecast [VERIFIED: credit-grace.ts:168-170, 216-260, 292-325] |
| `@/lib/nw-forecast` | existing | `buildNetWorthForecastSeries`, `forecastHorizonEnd` | Капитал «Прогноз» [VERIFIED: nw-forecast.ts:65-79, 99-235] |
| `@/lib/dates` | existing | `calendarDateToday`, `addCalendarDays` | Today + default horizon [VERIFIED: dates.ts:12-26, 39-49] |
| `@/lib/mcp/serialize` `minorToJson` | existing | BigInt → JSON string | CAP D-09 [VERIFIED: serialize.ts:6-9] |
| `@/lib/mcp/as-of` | existing | YYYY-MM-DD regex / today resolve pattern | Reuse for `horizonEnd` [VERIFIED: as-of.ts:8-16] |
| Vitest | 4.1.11 | Adapter + isolation contract tests | `vitest.config.ts` `src/**/*.test.ts` [VERIFIED: vitest.config.ts:4-7] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@/lib/locf` `firstHitLocfMap` | existing | Debt primary FX LOCF ≤ today | Same as debts page |
| `@/lib/mcp/reads/load-net-worth-asof` | existing | Forecast **anchor** NW today (accounts-only) | SIDE-04; do not mix debts into anchor |
| CAP tools (`accounts`, `net-worth`, …) | existing | Keep registered | Phase 24 surface unchanged |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Totals inside `list_debts` | Separate `get_debt_totals` | FEATURES listed both; CONTEXT allows colocated — **one tool** reduces catalog churn |
| Income page next-open list | Always `listAllInRange` window | Page = SIDE-02 plan/actual/overdue; range is forecast/input concern — optional `from`/`to` only |
| Preset enum `30d`/`90d`/`1y` on forecast | Free `horizonEnd` | **Locked D-02** — mention presets in description only |
| CI mutate-import ban | Plan/review + tests | **Locked D-07** |
| Payload `isolation: true` flags | Description one-liners | **Locked D-06** |

**Installation:**

```bash
# None — Phase 25 adds no packages
```

**Version verification:** `@modelcontextprotocol/server@2.0.0`, `zod@4.5.4`, `vitest@4.1.11` already in tree (2026-09-10). [VERIFIED: package.json + node_modules]

## Package Legitimacy Audit

> Phase installs **zero** new packages. Audit covers reuse-only stack.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@modelcontextprotocol/server` | npm | published 2026-07-27 | ~2.9M/wk | modelcontextprotocol/typescript-sdk | OK | Approved (reuse) |
| `zod` | npm | published 2026-09-09 | ~155M/wk | colinhacks/zod | SUS (too-new signal) | Pre-installed — **no new install**; no checkpoint |
| `vitest` | npm | published 2026-09-03 | ~57M/wk | vitest-dev/vitest | SUS (too-new signal) | Pre-installed — **no new install**; no checkpoint |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** zod, vitest — already locked in app; do not re-resolve or add versions this phase.

## Architecture Patterns

### System Architecture Diagram

```
CLI agent tool call (SIDE)
    ↓
POST http://127.0.0.1:3000/api/mcp
    ↓
localhost Host/Origin guard (Phase 23 — unchanged)
    ↓
createWalletMcpHandler → McpServer.registerTool
    ↓
┌─ list_debts ──────────────► reads/load-debts → remainingMinor + computeDebtPrimaryTotals
├─ list_income ─────────────► reads/load-income → nextOpenPlannedAsOf + isIncomeOverdue
├─ list_grace_obligations ──► reads/load-grace → mergeGraceListRows / OPEN rows
└─ get_forecast_overlay ────► reads/load-forecast-overlay
         │                       ├─ today = calendarDateToday
         │                       ├─ horizonEnd = arg ?? today+365
         │                       ├─ anchor = accounts-only NW today (loadNetWorthAsOf / same batch)
         │                       ├─ income open slots (listAllInRange fold — shell parity)
         │                       ├─ grace A′ slots (openGraceForecastMembership)
         │                       └─ buildNetWorthForecastSeries → serialize points
    ↓
minorToJson → JSON.stringify → content[{type:"text"}]
    ↓
CAP tools remain parallel; get_net_worth NEVER imports debts/income/grace
```

### Recommended Project Structure

```
src/lib/mcp/
├── create-handler.ts              # register SIDE + refresh instructions
├── as-of.ts                       # reuse YYYY-MM-DD; add optionalHorizonEndSchema
├── serialize.ts                   # minorToJson (reuse)
├── reads/
│   ├── load-net-worth-asof.ts     # CAP — do not import side ledgers
│   ├── load-debts.ts              # NEW — debts page assembler
│   ├── load-income.ts             # NEW — income page assembler
│   ├── load-grace.ts              # NEW — grace list assembler
│   └── load-forecast-overlay.ts   # NEW — DashboardChartsShell forecast fold
└── tools/
    ├── debts.ts + debts.test.ts
    ├── income.ts + income.test.ts
    ├── grace.ts + grace.test.ts
    └── forecast.ts + forecast.test.ts
```

### Pattern 1: Thin registerTool + reads assembler (CAP twin)

**What:** Tool file = zod schema + description + `readOnlyHint` + call `loadX()` + `JSON.stringify`. Loader = prisma batch + domain pure fn + `minorToJson`.
**When to use:** All four SIDE tools.
**Example:**

```typescript
// Source: src/lib/mcp/tools/net-worth.ts:6-29 (CAP pattern to copy)
server.registerTool(
  "get_net_worth",
  {
    description: "...",
    inputSchema: z.object({ asOf: optionalAsOfSchema }),
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async ({ asOf }) => {
    const payload = await loadNetWorthAsOf(resolveAsOf(asOf));
    return { content: [{ type: "text" as const, text: JSON.stringify(payload) }] };
  },
);
```

### Pattern 2: Forecast = extract shell fold, do not reimplement

**What:** Port the membership + `buildNetWorthForecastSeries` block from `DashboardChartsShell` (`forecastMeta` useMemo) into `loadForecastOverlay({ today, horizonEnd })`. Callers pass membership-filtered slots only — domain comment already requires that. [VERIFIED: nw-forecast.ts:95-98]
**When to use:** SIDE-04 only.
**Key quote (domain):** `"Caller passes membership-filtered slots — income open future; grace OPEN with fold (D-18)."` [VERIFIED: nw-forecast.ts:95-98]

### Pattern 3: Isolation via walls + thin MCP asserts (not payload flags)

**What:** Keep `disol.test.ts` / `iniso.test.ts` / `griso.test.ts`. Extend import walls to MCP NW files. Add SIDE tool tests that (a) debt payloads never appear as NW row contributions, (b) income/grace/forecast source + loaders have no `balanceSnapshot.(create|update|upsert|delete)`, (c) forecast uses `buildNetWorthForecastSeries` not `buildNetWorthSeries` with grace/income fields.
**When to use:** D-05 verification tasks.

### Anti-Patterns to Avoid

- **Twin domain math in tools:** Raw `prisma` → invent totals / ΔNW — breaks DISOL/INISO/GRISO [CITED: .planning/research/PITFALLS.md Pitfall 4]
- **Fold debts into `get_net_worth`:** Violates DISOL-01 and Phase 24 instructions
- **Income/grace writing BalanceSnapshot:** Violates INISO-01 / GRISO-01
- **Summary-only forecast:** Violates locked D-01
- **`isolation` / `affectsHistoricalNw` JSON fields:** Violates locked D-06
- **Preset-only horizon API:** Violates locked D-02
- **Named DISOL prose this phase:** Deferred Phase 26 (D-08)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Debt remaining / status | Manual principal − repay | `remainingMinor` + `assertStatusSynced` | Status desync invariants |
| Debt primary hero totals | Ad-hoc FX sum | `computeDebtPrimaryTotals` | OPEN-only + `no_fx` honesty |
| Income overdue | Clock / Date compares | `isIncomeOverdue(planned, hasActual, today)` | Injected today |
| Income next open slot | Custom recurrence walk | `nextOpenPlannedAsOf` | 400-day horizon already in helper |
| Grace list hybrid | Invent CTA rows | `mergeGraceListRows` | Schedule + OPEN merge |
| Grace forecast fold | Due→sample invent | `openGraceForecastMembership` | Overdue→today fold |
| Forecast stair-step | Custom cumulative | `buildNetWorthForecastSeries` | A′ grace ΔNW=0 + FX gate |
| Default 1y horizon | Hardcoded date math | `addCalendarDays(today, 365)` (= `forecastHorizonEnd("1y"\|"all", today)`) | Preset parity without preset param |
| Money JSON | `Number(bigint)` | `minorToJson` | CAP honesty |

**Key insight:** Side ledgers already have pure domain + page loaders; MCP failure mode is **reimplementation** and **leaking side ledgers into historical NW**, not missing libraries.

## Common Pitfalls

### Pitfall 1: Reimplement NW / domain math in MCP tools
**What goes wrong:** Tool SQL invents totals; DISOL/INISO/GRISO break silently.  
**Why it happens:** Tutorials show `prisma.findMany` as the tool body.  
**How to avoid:** Call existing libs only; twin + MCP fixture tests.  
**Warning signs:** New arithmetic in `tools/*.ts` beyond serialize.  
[CITED: .planning/research/PITFALLS.md]

### Pitfall 2: Forecast tool returns summary without points/events
**What goes wrong:** Agents invent overlay from raw list tools; SIDE-04 fails.  
**Why it happens:** Temptation to return `{includedSlotCount, isPartial}` only.  
**How to avoid:** Serialize full `points[]` including `forecastEvents` (D-01/D-03).  
**Warning signs:** Payload lacks `asOfDate` / `forecastPrimaryMinor` series.

### Pitfall 3: Income actual treated as BalanceSnapshot
**What goes wrong:** INISO-01 breach; historical LOCF polluted.  
**Why it happens:** Agents (or buggy tool) “apply” income to accounts.  
**How to avoid:** Read-only loaders; contract test bans snapshot writes; description one-liner.  
**Warning signs:** Import of `@/app/income/actions` or snapshot mutate under `mcp/`.

### Pitfall 4: Grace / income folded into `buildNetWorthSeries`
**What goes wrong:** Historical chart math changes when grace present.  
**Why it happens:** Confusing forecast overlay with past LOCF.  
**How to avoid:** Forecast path only `buildNetWorthForecastSeries`; griso/iniso already lock historical API surface.  
**Warning signs:** MCP forecast loader imports `historical-series`.

### Pitfall 5: Default horizon / today drift
**What goes wrong:** MCP «1y» ≠ UI «1y» / timezone skew.  
**Why it happens:** `new Date()` or hardcode elsewhere.  
**How to avoid:** `calendarDateToday("Europe/Moscow")` + `addCalendarDays(today, 365)` only (D-04).  
**Warning signs:** Duplicate today helpers in SIDE tools.

### Pitfall 6: Annotations assumed to enforce read-only
**What goes wrong:** Write bug ships because `readOnlyHint: true`.  
**Why it happens:** Hints are untrusted UX metadata.  
**How to avoid:** Plan/review + tests (D-07); no actions imports.  
**Warning signs:** Only annotation change, no contract tests.  
[CITED: blog.modelcontextprotocol.io/posts/2026-03-16-tool-annotations/]

## Code Examples

### Discretion: tool names (FEATURES defaults)

Use exactly:

- `list_debts`
- `list_income`
- `list_grace_obligations`
- `get_forecast_overlay`

Keep `wallet_ping`, `list_accounts`, `get_net_worth`, `get_account_balance`, `list_fx_rates`.

### Discretion: OPEN-focused filters + income window

**Debts (`list_debts`):** Default **OPEN-only** list (DebtsList splits `status !== "CLOSED"`). Include `totals` from `computeDebtPrimaryTotals` in the **same** payload (`iOwePrimaryMinor`, `theyOwePrimaryMinor`, `isPartial`, per-debt contribution rows). Optional `includeClosed: boolean` default `false` for CLOSED appendix. [VERIFIED: DebtsList.tsx:115-116; debts.ts:196-222]

**Income (`list_income`):** Default = **income page parity** — defs with `nextPlannedAsOf` / `hasActual` / `overdue` via `isIncomeOverdue` (no required range). Optional `from` + `to` (both required together, `YYYY-MM-DD`) → occurrence dump via `listAllInRange` + overdue flags (domain has **no** default window: `"Callers always pass from/to — no default horizon."`). [VERIFIED: income.ts:307-315; app/income/page.tsx:131-158]

**Grace (`list_grace_obligations`):** OPEN-focused; prefer `mergeGraceListRows(schedule, today, obligations)` per credit account (open + CTA, CLOSED omitted). Flag overdue with `isGraceOverdue`. [VERIFIED: credit-grace.ts:210-215, 216-260]

### Forecast default horizon

```typescript
// Source: nw-forecast.ts:64-73 + dates.ts:12-26,39-49
const today = calendarDateToday("Europe/Moscow");
const horizonEnd = inputHorizonEnd ?? addCalendarDays(today, 365);
// Equivalent to forecastHorizonEnd("1y", today) / "all"
```

`forecastHorizonEnd` switch quotes: `case "1y": case "all": return addCalendarDays(today, 365);` [VERIFIED: nw-forecast.ts:71-73]

### Sparse series serialize skeleton

```typescript
// Domain result shape — nw-forecast.ts:55-62, 48-53
// BuildNetWorthForecastSeriesResult { points, isPartialForecast, includedSlotCount,
//   excludedMissingFxCount, excludedMissingFxCurrencies }
// ForecastPoint { asOfDate, forecastPrimaryMinor: bigint, forecast: number, forecastEvents? }

function serializeForecastPayload(built: BuildNetWorthForecastSeriesResult, meta: {
  today: string;
  horizonEnd: string;
  anchorPrimaryMinor: bigint;
  primaryScale: number;
  primaryCurrencyCode: string;
}) {
  return {
    today: meta.today,
    horizonEnd: meta.horizonEnd,
    primaryCurrencyCode: meta.primaryCurrencyCode,
    primaryScale: meta.primaryScale,
    anchorPrimaryMinor: minorToJson(meta.anchorPrimaryMinor),
    isPartialForecast: built.isPartialForecast,
    includedSlotCount: built.includedSlotCount,
    excludedMissingFxCount: built.excludedMissingFxCount,
    excludedMissingFxCurrencies: built.excludedMissingFxCurrencies,
    points: built.points.map((p) => ({
      asOfDate: p.asOfDate,
      forecastPrimaryMinor: minorToJson(p.forecastPrimaryMinor),
      // chart major kept for Капитал parity (domain already exposes number)
      forecast: p.forecast,
      forecastEvents: p.forecastEvents?.map((e) => ({
        kind: e.kind,
        parentId: e.parentId,
        plannedAmountMinor: minorToJson(e.plannedAmountMinor),
        displayPrimaryMajor: e.displayPrimaryMajor,
        currencyCode: e.currencyCode,
        accountId: e.accountId,
        accountName: e.accountName,
        dueAsOf: e.dueAsOf,
      })),
    })),
  };
}
```

### Isolation one-liner (D-08) — description template

```text
Side ledger (Долги|Доходы|Грейс); not historical net worth / Капитал LOCF.
```

Forecast:

```text
Капитал forecast overlay (Прогноз): income + A′ grace; not historical NW LOCF.
```

Server instructions: replace `"Side ledgers (debts/income/grace) come later."` with short SIDE catalog + same one-liner walls. Keep CAP honesty lines. [VERIFIED: create-handler.ts:19-25]

### Thin MCP contract test sketches (D-05)

```typescript
// 1) Extend disol walls to MCP NW path
for (const file of [
  "src/lib/mcp/reads/load-net-worth-asof.ts",
  "src/lib/mcp/tools/net-worth.ts",
]) {
  it(`${file} does not import debts`, () => {
    const src = readFileSync(file, "utf8");
    expect(src).not.toMatch(/@\/lib\/debts|from ["']\.\/debts["']/);
  });
}

// 2) SIDE income/grace/forecast sources never mutate BalanceSnapshot
for (const file of sideLedgerMcpFiles) {
  it(`${file} has no BalanceSnapshot writes`, () => {
    const src = readFileSync(file, "utf8");
    expect(src).not.toMatch(/balanceSnapshot\.(create|update|upsert|delete)/);
    expect(src).not.toMatch(/from ["']@\/app\/.*\/actions["']/);
  });
}

// 3) Serialized NW fixture keys never contain debt ledger fields
expect(Object.keys(nwPayload)).not.toContain("debts");
expect(nwPayload.rows.every((r) => !("personId" in r))).toBe(true);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Phase 24 CAP-only + “side ledgers later” | SIDE tools + overlay | Phase 25 | Agents read Долги/Доходы/Грейс/Прогноз |
| Full CLI-01 isolation essay | Minimal one-liner (D-08) | Phase 25→26 split | Ship tools without connect-doc polish |
| Optional forecast P1 in FEATURES | Locked required SIDE-04 sparse series | CONTEXT D-01 | Forecast is in-scope, not optional |

**Deprecated/outdated:**

- Treating `get_forecast_overlay` as optional P1 — **required** this phase (SIDE-04 + D-01)
- Separate `get_debt_totals` tool — prefer colocated totals in `list_debts`

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Optional `includeClosed` on `list_debts` is acceptable (default false) | Discretion filters | User wanted CLOSED always included — cheap param flip |
| A2 | Optional paired `from`/`to` on `list_income` (default = page next-open mode) | Discretion income | User wanted required range only — tighten schema |
| A3 | Keeping domain `forecast` / `displayPrimaryMajor` numbers beside string minors is OK for Капитал parity | Code Examples | If money-number ban absolute — drop major fields |

**If wrong:** Planner can tighten schemas without changing tool names.

## Open Questions

1. **Income default mode vs range**
   - What we know: Page = next-open; `listAllInRange` needs explicit from/to; forecast uses `today+1..horizonEnd`.
   - What's unclear: Whether agents need occurrence calendars on day one.
   - Recommendation: Ship page-parity default + optional `from`/`to` (A2).

2. **Grace CTA rows in MCP**
   - What we know: UI merge includes CTA for missing schedule windows.
   - What's unclear: Agents may confuse CTA with persisted obligations.
   - Recommendation: Include CTA with `kind: "cta" | "open"` discriminant (same as `GraceListRow`).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vitest / Next | ✓ | v24.5.0 | — |
| npm | scripts | ✓ | 10.9.3 | — |
| Vitest | Nyquist tests | ✓ | 4.1.11 | — |
| SQLite via Prisma | loaders | ✓ (app db) | Prisma 7.10.0 | — |
| New npm packages | — | N/A | — | none required |

**Missing dependencies with no fallback:** none  
**Missing dependencies with fallback:** none  
Step 2.6: external tools OK for this phase.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.11 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/lib/mcp/tools/debts.test.ts src/lib/mcp/tools/income.test.ts src/lib/mcp/tools/grace.test.ts src/lib/mcp/tools/forecast.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SIDE-01 | Debts + totals serialize; OPEN filter; NW files debts-free | unit | `npx vitest run src/lib/mcp/tools/debts.test.ts src/lib/disol.test.ts` | ❌ Wave 0 (debts.test); ✅ disol |
| SIDE-02 | Income plan/actual/overdue; no snapshot writes | unit | `npx vitest run src/lib/mcp/tools/income.test.ts src/lib/iniso.test.ts` | ❌ Wave 0 (income.test); ✅ iniso |
| SIDE-03 | Grace OPEN/CTA; no historical rewrite | unit | `npx vitest run src/lib/mcp/tools/grace.test.ts src/lib/griso.test.ts` | ❌ Wave 0 (grace.test); ✅ griso |
| SIDE-04 | Sparse series + income+grace events; default horizon | unit | `npx vitest run src/lib/mcp/tools/forecast.test.ts src/lib/nw-forecast.test.ts` | ❌ Wave 0 (forecast.test); ✅ nw-forecast |
| DISOL/INISO/GRISO MCP | Import walls + never-write under mcp SIDE files | unit | `npx vitest run src/lib/disol.test.ts src/lib/iniso.test.ts src/lib/griso.test.ts` (+ extended asserts) | ✅ extend |

### Sampling Rate

- **Per task commit:** targeted SIDE `*.test.ts` + related isolation twin
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/lib/mcp/tools/debts.test.ts` — SIDE-01 serialize + totals + OPEN
- [ ] `src/lib/mcp/tools/income.test.ts` — SIDE-02 overdue/actual flags + no-write source assert
- [ ] `src/lib/mcp/tools/grace.test.ts` — SIDE-03 OPEN/CTA + overdue
- [ ] `src/lib/mcp/tools/forecast.test.ts` — SIDE-04 sparse points / default horizon / events kinds
- [ ] Extend `disol.test.ts` walls to `src/lib/mcp/reads/load-net-worth-asof.ts` + `tools/net-worth.ts`
- [ ] Optional shared `src/lib/mcp/isolation-contract.test.ts` for BalanceSnapshot never-write across SIDE files

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Localhost-only MCP (Phase 23); no new auth |
| V3 Session Management | no | Stateless `responseMode: "json"` |
| V4 Access Control | partial | Host/Origin guard unchanged; do not widen publish |
| V5 Input Validation | yes | zod `YYYY-MM-DD` for `horizonEnd` / `from` / `to` |
| V6 Cryptography | no | No new crypto |

### Known Threat Patterns for MCP side-ledger reads

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Agent folds debts into NW reasoning | Elevation / Tampering (logical) | DISOL walls + description one-liner + NW import tests |
| Income/grace tool writes snapshots | Tampering | Read-only loaders; never-write contract tests; no actions imports |
| LAN exposure of debt/income PII | Information Disclosure | Keep Phase 23 localhost guard; no `0.0.0.0` |
| Annotation spoofing as security | Spoofing | Treat hints as UX only; enforce via code review + tests |
| Over-broad date range DoS | Denial of Service | Prefer page-parity defaults; document range; reuse page batch queries |

`security_enforcement: true` in `.planning/config.json` — section required. [VERIFIED: config.json workflow.security_enforcement]

## Sources

### Primary (HIGH confidence)

- In-repo CAP/SIDE patterns: `src/lib/mcp/create-handler.ts`, `tools/net-worth.ts`, `serialize.ts`, `as-of.ts`, `reads/load-net-worth-asof.ts`
- Domain: `src/lib/{debts,income,credit-grace,nw-forecast,dates}.ts` + page/shell call sites
- Isolation twins: `src/lib/{disol,iniso,griso}.test.ts`
- Milestone research: `.planning/research/{FEATURES,ARCHITECTURE,PITFALLS,SUMMARY}.md`
- CONTEXT: `.planning/phases/25-side-ledger-tools-isolation/25-CONTEXT.md`
- Phase 24 research pattern mirror: `24-RESEARCH.md`

### Secondary (MEDIUM confidence)

- MCP ToolAnnotations blog — hints not guarantees [CITED: blog.modelcontextprotocol.io/posts/2026-03-16-tool-annotations/]
- Local SDK types `readOnlyHint?: boolean` default false [VERIFIED: node_modules/@modelcontextprotocol/sdk/dist/esm/spec.types.d.ts:1119]

### Tertiary (LOW confidence)

- None material for planning

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — reuse Phase 24 stack; no new packages; versions verified
- Architecture: HIGH — CAP twins + verified domain entrypoints + locked CONTEXT
- Pitfalls: HIGH — milestone PITFALLS + existing isolation twins + CAP lessons

**Research date:** 2026-09-10  
**Valid until:** 2026-10-10 (stable in-repo domain; MCP SDK annotations slow-moving)
