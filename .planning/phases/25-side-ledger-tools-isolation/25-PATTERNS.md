# Phase 25: Side-Ledger Tools + Isolation - Pattern Map

**Mapped:** 2026-09-10
**Files analyzed:** 16
**Analogs found:** 16 / 16

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/mcp/tools/debts.ts` | route (MCP tool) | request-response | `src/lib/mcp/tools/accounts.ts` | exact |
| `src/lib/mcp/tools/income.ts` | route (MCP tool) | request-response | `src/lib/mcp/tools/fx.ts` | exact |
| `src/lib/mcp/tools/grace.ts` | route (MCP tool) | request-response | `src/lib/mcp/tools/accounts.ts` | exact |
| `src/lib/mcp/tools/forecast.ts` | route (MCP tool) | request-response | `src/lib/mcp/tools/net-worth.ts` | exact |
| `src/lib/mcp/reads/load-debts.ts` | service | CRUD (read) | `src/lib/mcp/reads/load-net-worth-asof.ts` + `src/app/debts/page.tsx` | exact |
| `src/lib/mcp/reads/load-income.ts` | service | CRUD (read) | `src/lib/mcp/reads/load-net-worth-asof.ts` + `src/app/income/page.tsx` | exact |
| `src/lib/mcp/reads/load-grace.ts` | service | CRUD (read) | `src/lib/mcp/reads/load-account-balance-asof.ts` + `src/components/accounts/CreditGraceDialog.tsx` | role-match |
| `src/lib/mcp/reads/load-forecast-overlay.ts` | service | transform | `src/components/dashboard/DashboardChartsShell.tsx` + `load-net-worth-asof.ts` | exact |
| `src/lib/mcp/create-handler.ts` | config | request-response | self (extend CAP registration) | exact |
| `src/lib/mcp/as-of.ts` | utility | transform | self (`optionalAsOfSchema`) | exact |
| `src/lib/mcp/tools/debts.test.ts` | test | batch | `src/lib/mcp/tools/accounts.test.ts` + `net-worth.test.ts` | exact |
| `src/lib/mcp/tools/income.test.ts` | test | batch | `src/lib/mcp/tools/fx.test.ts` | exact |
| `src/lib/mcp/tools/grace.test.ts` | test | batch | `src/lib/mcp/tools/accounts.test.ts` | exact |
| `src/lib/mcp/tools/forecast.test.ts` | test | batch | `src/lib/mcp/tools/net-worth.test.ts` | exact |
| `src/lib/disol.test.ts` (+ iniso/griso extend) | test | batch | self (import-wall loops) | exact |
| `src/lib/mcp/isolation-contract.test.ts` (optional) | test | batch | `src/lib/iniso.test.ts` / `disol.test.ts` | role-match |

## Pattern Assignments

### `src/lib/mcp/tools/debts.ts` (route, request-response)

**Analog:** `src/lib/mcp/tools/accounts.ts` (list + serialize colocated; OPEN filter like `fx` optional params)

**Imports / registerTool pattern** (lines 1–5, 68–88):
```typescript
import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { minorToJson } from "@/lib/mcp/serialize";

export function registerListAccounts(server: McpServer) {
  server.registerTool(
    "list_accounts",
    {
      description: "...",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async () => {
      const payload = await loadListAccounts();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(payload) }],
      };
    },
  );
}
```

**SIDE deltas:**
- Tool name `list_debts`; optional `includeClosed: z.boolean().optional()` default false (OPEN-focused).
- Description one-liner (D-08): `Side ledger (Долги); not historical net worth / Капитал LOCF.`
- Call `loadDebts({ includeClosed, today })` — no domain math in tool body.
- Export `LIST_DEBTS_DESCRIPTION` const if description contract tested (see `fx.ts` lines 7–11).

---

### `src/lib/mcp/tools/income.ts` (route, request-response)

**Analog:** `src/lib/mcp/tools/fx.ts` (optional filters + as-of-style date schema)

**Core pattern** (lines 13–34):
```typescript
export function registerListFxRates(server: McpServer) {
  server.registerTool(
    "list_fx_rates",
    {
      description: LIST_FX_RATES_DESCRIPTION,
      inputSchema: z.object({
        asOf: optionalAsOfSchema,
        currencyCode: z.string().min(1).optional(),
      }),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ asOf, currencyCode }) => {
      const resolved = resolveAsOf(asOf);
      const payload = await loadFxRatesAsOf(resolved, currencyCode);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(payload) }],
      };
    },
  );
}
```

**SIDE deltas:**
- Tool `list_income`; default = page next-open mode; optional paired `from`/`to` (both required together, reuse YYYY-MM-DD regex from `as-of.ts`).
- Isolation one-liner: Доходы / not historical NW; never write BalanceSnapshot.

---

### `src/lib/mcp/tools/grace.ts` (route, request-response)

**Analog:** `src/lib/mcp/tools/accounts.ts` (param-light list)

Same `registerTool` + `readOnlyHint` + `JSON.stringify` content envelope. Tool `list_grace_obligations`. Description: Грейс side ledger; not historical NW LOCF. Loader returns OPEN + CTA rows with `kind` discriminant.

---

### `src/lib/mcp/tools/forecast.ts` (route, request-response)

**Analog:** `src/lib/mcp/tools/net-worth.ts`

**Core pattern** (lines 6–29):
```typescript
export function registerGetNetWorth(server: McpServer) {
  server.registerTool(
    "get_net_worth",
    {
      description:
        "Read net worth / Капитал as-of a calendar date (YYYY-MM-DD). " +
        "... Accounts-only — no debts/income.",
      inputSchema: z.object({ asOf: optionalAsOfSchema }),
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ asOf }) => {
      const resolved = resolveAsOf(asOf);
      const payload = await loadNetWorthAsOf(resolved);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(payload) }],
      };
    },
  );
}
```

**SIDE deltas:**
- Tool `get_forecast_overlay`; `inputSchema: z.object({ horizonEnd: optionalHorizonEndSchema })`.
- Resolve: `today = calendarDateToday("Europe/Moscow")`; `horizonEnd = arg ?? addCalendarDays(today, 365)`.
- Description: `Капитал forecast overlay (Прогноз): income + A′ grace; not historical NW LOCF.`
- Call `loadForecastOverlay({ today, horizonEnd })` only — no `buildNetWorthSeries`.

---

### `src/lib/mcp/reads/load-debts.ts` (service, CRUD read)

**Analogs:**
1. Structure/serialize — `src/lib/mcp/reads/load-net-worth-asof.ts`
2. Prisma + domain — `src/app/debts/page.tsx`

**Pure serialize + prisma batch** (`load-net-worth-asof.ts` lines 43–95, 92–125):
```typescript
export function serializeNetWorthPayload(args: { /* ... */ }): SerializedNetWorthPayload {
  // map rows → minorToJson(...)
}

export async function loadNetWorthAsOf(asOf: string): Promise<SerializedNetWorthPayload> {
  await ensureSqlitePragmas();
  const [accounts, primaryCurrency, snapshotsLte, ratesLte] = await Promise.all([/* ... */]);
  // firstHitLocfMap → domain pure fn → serialize*
}
```

**Debts page assembler** (`src/app/debts/page.tsx` lines 19–155) — copy query + remaining + totals:
```typescript
const today = calendarDateToday("Europe/Moscow");
// prisma.person.findMany({ include: { debts: { include: { currency, repayments, sizeChanges }}}})
// prisma.fxRate.findMany({ where: { asOfDate: { lte: today }}, orderBy: { asOfDate: "desc" }})
const remaining = remainingMinor(initial, sizeDeltas, repayments);
assertStatusSynced(d.status, remaining);
const { rows, iOwePrimaryMinor, theyOwePrimaryMinor, isPartial } =
  computeDebtPrimaryTotals(totalsInputs);
```

**SIDE deltas:**
- Split pure `serializeDebtsPayload` (SQLite-free tests) vs `loadDebts`.
- Default filter OPEN (`status !== "CLOSED"`); optional includeClosed.
- Money via `minorToJson` (not `.toString()` only for UI display paths) — CAP honesty.
- Payload includes colocated `totals` (`iOwePrimaryMinor`, `theyOwePrimaryMinor`, `isPartial`, contribution rows).
- **No** `isolation` / `affectsHistoricalNw` fields (D-06).

---

### `src/lib/mcp/reads/load-income.ts` (service, CRUD read)

**Analogs:**
1. MCP loader shape — `load-net-worth-asof.ts`
2. Page parity — `src/app/income/page.tsx` lines 25–188

**Page next-open fold** (income page):
```typescript
const today = calendarDateToday("Europe/Moscow");
const nextPlannedAsOf = nextOpenPlannedAsOf(def, r.actuals, today);
const hasActual = slotActual != null;
overdue: isIncomeOverdue(nextPlannedAsOf, hasActual, today),
```

**SIDE deltas:**
- Default mode = page parity (defs + nextPlannedAsOf / hasActual / overdue).
- Optional `from`+`to` → `listAllInRange` + overdue flags (domain requires explicit window).
- Read-only prisma only — never import `@/app/income/actions` or `balanceSnapshot.*` mutates.

---

### `src/lib/mcp/reads/load-grace.ts` (service, CRUD read)

**Analogs:**
1. MCP assemble/serialize — `src/lib/mcp/reads/load-account-balance-asof.ts` (pure assemble + async load)
2. List merge — `src/lib/credit-grace.ts` `mergeGraceListRows` + `CreditGraceDialog.tsx` lines 130–132, 377

**mergeGraceListRows** (`credit-grace.ts` lines 216–260):
```typescript
export function mergeGraceListRows(
  schedule: CreditGraceSchedule | null,
  today: string,
  obligations: GraceObligationListItem[],
): GraceListRow[] {
  // OPEN rows + CTA for missing schedule windows; CLOSED omitted from list
  return [...openRows, ...ctaRows];
}
```

**Dialog call site** (`CreditGraceDialog.tsx` 130–132, 377):
```typescript
const listRows = hasSchedule
  ? mergeGraceListRows(schedule, today, account.creditGraceObligations)
  : [];
const overdue = isGraceOverdue(row.obligation.dueAsOf, today);
```

**SIDE deltas:**
- Prisma: credit accounts + schedules + OPEN obligations (page/dialog parity).
- Serialize `kind: "open" | "cta"`; minors via `minorToJson`.
- No historical-series / BalanceSnapshot writes.

---

### `src/lib/mcp/reads/load-forecast-overlay.ts` (service, transform)

**Analogs:**
1. Fold logic — `src/components/dashboard/DashboardChartsShell.tsx` `forecastMeta` (lines 235–377)
2. Anchor NW — `src/lib/mcp/reads/load-net-worth-asof.ts` (`loadNetWorthAsOf(today)` accounts-only)
3. Domain — `src/lib/nw-forecast.ts` `buildNetWorthForecastSeries` / `forecastHorizonEnd`

**Shell fold to port** (DashboardChartsShell 235–375):
```typescript
const horizonEnd = forecastHorizonEnd(range, today); // MCP: free date or today+365
const from = addCalendarDays(today, 1);
const raw = listAllInRange(/* defs+actuals */, from, horizonEnd);
// open income slots: plannedAsOf > today, no actual
const graceSlots = openGraceForecastMembership(obligations, today, horizonEnd)
  .map((m) => ({ kind: "grace" as const, /* ... */ }));
const built = buildNetWorthForecastSeries({
  anchorPrimaryMinor: anchorMinor,
  slots: [...openSlots, ...graceSlots],
  rates: seriesRates,
  primaryScale,
  today,
  horizonEnd,
});
```

**Horizon default** (`nw-forecast.ts` 65–73 + dates):
```typescript
// case "1y" | "all": return addCalendarDays(today, 365);
const today = calendarDateToday("Europe/Moscow");
const horizonEnd = inputHorizonEnd ?? addCalendarDays(today, 365);
```

**Serialize:** string minors via `minorToJson` for `anchorPrimaryMinor`, `forecastPrimaryMinor`, event `plannedAmountMinor`; keep `forecast` / `displayPrimaryMajor` numbers for Капитал parity (RESEARCH A3). Sparse `points[]` + `forecastEvents` required (D-01/D-03).

**Anti-pattern:** do not call `buildNetWorthSeries`; do not import debts into anchor.

---

### `src/lib/mcp/create-handler.ts` (config, request-response)

**Analog:** self — Phase 24 CAP registration (lines 13–36)

```typescript
export function createWalletMcpHandler() {
  return createMcpHandler(
    () => {
      const server = new McpServer(
        { name: "wallet-mcp", version: "1.4.0" },
        {
          instructions:
            "Read-only localhost capital MCP (Капитал): wallet_ping, list_accounts, " +
            "get_net_worth, get_account_balance, list_fx_rates. " +
            // REPLACE "Side ledgers ... come later." with SIDE catalog + one-liner walls
            "Side ledgers (debts/income/grace) come later.",
        },
      );
      registerWalletPing(server);
      registerGetNetWorth(server);
      registerListAccounts(server);
      registerGetAccountBalance(server);
      registerListFxRates(server);
      // ADD: registerListDebts, registerListIncome, registerListGraceObligations, registerGetForecastOverlay
      return server;
    },
    { responseMode: "json", legacy: "stateless" },
  );
}
```

---

### `src/lib/mcp/as-of.ts` (utility, transform)

**Analog:** self — extend optional date schema (lines 8–16)

```typescript
export const optionalAsOfSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "asOf must be YYYY-MM-DD")
  .optional();

export function resolveAsOf(asOf?: string): string {
  return asOf ?? calendarDateToday("Europe/Moscow");
}
```

**SIDE:** add `optionalHorizonEndSchema` (same regex, message `horizonEnd must be YYYY-MM-DD`) and/or paired `from`/`to` helpers. Default horizon resolve stays in forecast tool/loader (`addCalendarDays(..., 365)`), not in `resolveAsOf`.

---

### `src/lib/mcp/tools/debts.test.ts` / `income.test.ts` / `grace.test.ts` / `forecast.test.ts` (test, batch)

**Analogs:**
- List serialize — `src/lib/mcp/tools/accounts.test.ts` (SQLite-free pure serialize)
- NW honesty + asOf schema — `src/lib/mcp/tools/net-worth.test.ts`
- Description contract — `src/lib/mcp/tools/fx.test.ts` (`LIST_FX_RATES_DESCRIPTION`)

**accounts.test pattern** (lines 9–46):
```typescript
describe("list_accounts (CAP-01)", () => {
  it("returns account type, currency, creditLimitMinor string, isCredit", () => {
    const payload = serializeListAccountsPayload([/* fixtures */]);
    expect(typeof payload.accounts[1]!.creditLimitMinor).toBe("string");
  });
});
```

**net-worth.test extras** (lines 138–146): schema + `resolveAsOf` defaults.

**SIDE asserts:**
- Debts: totals strings; OPEN filter; no isolation meta keys; NW fixture keys never contain debt fields (contract).
- Income/grace/forecast: source never-write (`balanceSnapshot.(create|update|upsert|delete)`, no `@/app/**/actions`).
- Forecast: sparse points + event kinds; default horizon = today+365; uses forecast series not historical.

---

### `src/lib/disol.test.ts` (+ iniso/griso) (test, batch)

**Analog:** self — import wall loops

**disol** (lines 4–15):
```typescript
describe("DISOL-01 isolation", () => {
  for (const file of [
    "src/lib/net-worth.ts",
    "src/lib/historical-series.ts",
    "src/app/page.tsx",
    // EXTEND:
    // "src/lib/mcp/reads/load-net-worth-asof.ts",
    // "src/lib/mcp/tools/net-worth.ts",
  ]) {
    it(`${file} does not import debts domain module`, () => {
      const src = readFileSync(file, "utf8");
      expect(src).not.toMatch(/@\/lib\/debts|from ["']\.\/debts["']/);
    });
  }
});
```

**iniso/griso:** keep existing NW/historical walls; optionally add SIDE MCP file never-write / never-import-historical asserts (or shared `isolation-contract.test.ts`).

---

## Shared Patterns

### MCP tool registration
**Source:** `src/lib/mcp/tools/net-worth.ts`, `accounts.ts`, `fx.ts`
**Apply to:** All four SIDE tool files
- `McpServer.registerTool(name, { description, inputSchema, annotations: { readOnlyHint: true, openWorldHint: false } }, handler)`
- Return `{ content: [{ type: "text", text: JSON.stringify(payload) }] }`
- Thin: zod → resolve dates → `loadX()` → stringify. No finance math in tools.

### Money JSON
**Source:** `src/lib/mcp/serialize.ts` lines 6–9
**Apply to:** All SIDE loaders/serializers
```typescript
export function minorToJson(value: bigint | null): string | null {
  if (value === null) return null;
  return value.toString();
}
```

### Date / today
**Source:** `src/lib/mcp/as-of.ts` + `@/lib/dates`
**Apply to:** debts/income/grace/forecast loaders and forecast horizon
- `calendarDateToday("Europe/Moscow")`
- YYYY-MM-DD zod regex
- Forecast default: `addCalendarDays(today, 365)`

### Read assembler split
**Source:** `load-net-worth-asof.ts` (`serialize*` pure + `load*` prisma)
**Apply to:** `load-debts`, `load-income`, `load-grace`, `load-forecast-overlay`
- Pure serialize/assemble exported for Vitest without SQLite
- Domain: `remainingMinor` / `computeDebtPrimaryTotals` / `nextOpenPlannedAsOf` / `mergeGraceListRows` / `buildNetWorthForecastSeries` — never reimplement

### Isolation messaging
**Source:** CONTEXT D-06/D-08; CAP description style in `net-worth.ts` / `fx.ts`
**Apply to:** SIDE tool descriptions + `create-handler` instructions
- One-liner in description only; **no** payload meta flags
- Replace handler line `"Side ledgers (debts/income/grace) come later."`

### Isolation tests
**Source:** `src/lib/disol.test.ts`, `iniso.test.ts`, `griso.test.ts`
**Apply to:** extended walls + SIDE `*.test.ts`
- `readFileSync` import walls
- Never-write BalanceSnapshot under SIDE MCP paths
- NW CAP files stay debts-free

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | All SIDE files have CAP twin and/or page/shell fold analogs |

## Metadata

**Analog search scope:** `src/lib/mcp/**`, `src/app/{debts,income,page}.tsx`, `src/components/dashboard/DashboardChartsShell.tsx`, `src/components/accounts/CreditGraceDialog.tsx`, `src/lib/{debts,income,credit-grace,nw-forecast,disol,iniso,griso}*`
**Search method:** codegraph `query` / `explore` / `node` + git-tracked gate (`git ls-files`)
**Files scanned:** ~40 (MCP tools/reads + domain + pages + isolation twins)
**Pattern extraction date:** 2026-09-10
**Tracked-source gate:** all named analogs verified via `git ls-files` (non-empty)
