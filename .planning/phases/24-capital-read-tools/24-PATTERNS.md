# Phase 24: Capital Read Tools - Pattern Map

**Mapped:** 2026-09-10
**Files analyzed:** 16
**Analogs found:** 16 / 16

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/mcp/create-handler.ts` | config | request-response | `src/lib/mcp/create-handler.ts` (+ `tools/wallet-ping.ts`) | exact |
| `src/lib/mcp/tools/accounts.ts` | route | request-response | `src/lib/mcp/tools/wallet-ping.ts` | exact |
| `src/lib/mcp/tools/net-worth.ts` | route | request-response | `src/lib/mcp/tools/wallet-ping.ts` | exact |
| `src/lib/mcp/tools/balances.ts` | route | request-response | `src/lib/mcp/tools/wallet-ping.ts` | exact |
| `src/lib/mcp/tools/fx.ts` | route | request-response | `src/lib/mcp/tools/wallet-ping.ts` | exact |
| `src/lib/mcp/reads/load-net-worth-asof.ts` | service | batch | `src/app/page.tsx` (NW LOCF block) | exact |
| `src/lib/mcp/reads/load-account-balance-asof.ts` | service | CRUD | `src/lib/balances.ts` + `src/lib/fx.ts` + `src/lib/money.ts` | role-match |
| `src/lib/mcp/reads/load-fx-rates-asof.ts` | service | batch | `src/app/currencies/rates/page.tsx` | exact |
| `src/lib/mcp/serialize.ts` | utility | transform | `src/app/accounts/page.tsx` (BigInt RSC boundary) | role-match |
| `src/lib/mcp/as-of.ts` | utility | transform | `src/lib/dates.ts` + `src/lib/validations/balance.ts` | exact |
| `src/lib/mcp/serialize.test.ts` | test | transform | `src/lib/money.test.ts` / `src/lib/dates.test.ts` | role-match |
| `src/lib/mcp/as-of.test.ts` | test | transform | `src/lib/dates.test.ts` | role-match |
| `src/lib/mcp/tools/accounts.test.ts` | test | request-response | `src/lib/mcp/localhost-guard.test.ts` | role-match |
| `src/lib/mcp/tools/net-worth.test.ts` | test | batch | `src/lib/net-worth.test.ts` | exact |
| `src/lib/mcp/tools/balances.test.ts` | test | CRUD | `src/lib/balances.test.ts` | role-match |
| `src/lib/mcp/tools/fx.test.ts` | test | batch | `src/lib/fx.test.ts` | role-match |

**Domain libs (reuse only — do not fork):** `src/lib/net-worth.ts`, `src/lib/locf.ts`, `src/lib/account-type.ts`, `src/lib/money.ts` (`RATE_SCALE_E8`, `convertOtherMinorToPrimaryMinor`).

## Pattern Assignments

### `src/lib/mcp/create-handler.ts` (config, request-response)

**Analog:** `src/lib/mcp/create-handler.ts` + registration from `src/lib/mcp/tools/wallet-ping.ts`

**Imports / factory pattern** (lines 1–24):
```typescript
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { registerWalletPing } from "./tools/wallet-ping";

export function createWalletMcpHandler() {
  return createMcpHandler(
    () => {
      const server = new McpServer(
        { name: "wallet-mcp", version: "1.4.0" },
        {
          instructions:
            "read-only localhost wallet MCP; tools expand later",
        },
      );
      registerWalletPing(server);
      return server;
    },
    { responseMode: "json", legacy: "stateless" },
  );
}
```

**Phase 24 delta (copy structure, replace content):**
- Keep `createMcpHandler` + `responseMode: "json"` + `legacy: "stateless"` — do not switch to `mcp-handler` create.
- Replace `instructions` with capital-era English + RU aliases (D-15): read-only capital tools; NW accounts-only (no debts); FX list not a converter; side ledgers later.
- After `registerWalletPing(server)`, call `registerListAccounts` / `registerGetNetWorth` / `registerGetAccountBalance` / `registerListFxRates`.

---

### `src/lib/mcp/tools/{accounts,net-worth,balances,fx}.ts` (route, request-response)

**Analog:** `src/lib/mcp/tools/wallet-ping.ts`

**Imports + registerTool + JSON content** (lines 1–22):
```typescript
import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

export function registerWalletPing(server: McpServer) {
  server.registerTool(
    "wallet_ping",
    {
      description: "Liveness check for wallet MCP transport",
      inputSchema: z.object({}),
    },
    async () => {
      const payload = {
        ok: true as const,
        service: "wallet-mcp",
        timestamp: new Date().toISOString(),
      };
      return {
        content: [{ type: "text", text: JSON.stringify(payload) }],
      };
    },
  );
}
```

**CAP tool deltas vs ping:**
- Tool names: `list_accounts`, `get_net_worth`, `get_account_balance`, `list_fx_rates` (no `wallet_` prefix — D-02).
- Add `annotations: { readOnlyHint: true, openWorldHint: false }` (D-13; A2).
- Descriptions: English primary + RU alias in parentheses; FX/NW must forbid agent conversion (D-03/D-14).
- `inputSchema`: use shared `optionalAsOfSchema` from `as-of.ts`; balances add `accountId: z.number().int().positive()`; fx optional `currencyCode`.
- Handler body: `resolveAsOf(asOf)` → call `reads/*` → `JSON.stringify(serializedPayload)` — never stringify raw Prisma BigInt rows.
- Empty/partial → success payload (D-07), not thrown tool error.

---

### `src/lib/mcp/reads/load-net-worth-asof.ts` (service, batch)

**Analog:** `src/app/page.tsx` lines 16–137 (omit income/grace loads — CAP NW is accounts-only)

**Core page-parity assembler** (lines 16–137):
```typescript
await ensureSqlitePragmas();
const today = calendarDateToday("Europe/Moscow"); // → resolveAsOf / caller asOf

const [accounts, primaryCurrency, snapshotsLteToday, ratesLteToday] =
  await Promise.all([
    prisma.account.findMany({
      include: { currency: true },
      orderBy: { name: "asc" },
    }),
    prisma.currency.findFirst({
      where: { isPrimary: true },
      select: { code: true, scale: true },
    }),
    prisma.balanceSnapshot.findMany({
      where: { asOfDate: { lte: asOf } },
      orderBy: { asOfDate: "desc" },
      select: { accountId: true, asOfDate: true, amountMinor: true },
    }),
    prisma.fxRate.findMany({
      where: { asOfDate: { lte: asOf } },
      orderBy: { asOfDate: "desc" },
      select: {
        currencyCode: true,
        asOfDate: true,
        rateToPrimaryScaled: true,
      },
    }),
  ]);

const locfByAccount = firstHitLocfMap(snapshotsLteToday, (s) => s.accountId);
const locfByCurrency = firstHitLocfMap(ratesLteToday, (r) => r.currencyCode);

const inputs: NetWorthAccountInput[] = accounts.map((account) => {
  const locf = locfByAccount.get(account.id) ?? null;
  const rate = locfByCurrency.get(account.currencyCode) ?? null;
  return {
    id: account.id,
    type: account.type,
    currencyCode: account.currencyCode,
    currencyScale: account.currency.scale,
    isPrimaryCurrency: account.currency.isPrimary,
    creditLimitMinor: account.creditLimitMinor,
    locfAmountMinor: locf?.amountMinor ?? null,
    rateToPrimaryScaled: account.currency.isPrimary
      ? null
      : (rate?.rateToPrimaryScaled ?? null),
    primaryScale,
  };
});

const { rows, totalPrimaryMinor, isPartial } = computeNetWorthRows(inputs);
```

**Enrichment pattern** (D-12) from same file lines 159–198 — join `accountName` / `currencyCode` / `type` onto rows; stringify minors via `serialize.ts`.

**Anti-fork:** Do not reimplement inclusion / credit debt / `excludeReason` — only `computeNetWorthRows` (`src/lib/net-worth.ts`).

**Honesty contract** (`src/lib/net-worth.ts` lines 28–42):
```typescript
export type NetWorthExcludeReason = "none" | "no_balance" | "no_fx";

export type NetWorthRow = {
  accountId: number;
  includedInTotal: boolean;
  excludeReason: NetWorthExcludeReason;
  contributionPrimaryMinor: bigint;
  nativeDisplayMinor: bigint | null;
  debtNativeMinor: bigint | null;
  primaryDisplayMinor: bigint | null;
};
```

---

### `src/lib/mcp/reads/load-account-balance-asof.ts` (service, CRUD)

**Analogs:** `src/lib/balances.ts` (LOCF snapshot), `src/lib/fx.ts` (LOCF rate), `src/lib/money.ts` (server convert), enrich like `page.tsx` account fields.

**LOCF balance** (`src/lib/balances.ts` lines 11–17):
```typescript
export async function getBalanceAsOf(accountId: number, asOfDate: string) {
  await ensureSqlitePragmas();
  return prisma.balanceSnapshot.findFirst({
    where: { accountId, asOfDate: { lte: asOfDate } },
    orderBy: { asOfDate: "desc" },
  });
}
```

**LOCF rate** (`src/lib/fx.ts` lines 10–16):
```typescript
export async function getRateAsOf(currencyCode: string, asOfDate: string) {
  await ensureSqlitePragmas();
  return prisma.fxRate.findFirst({
    where: { currencyCode, asOfDate: { lte: asOfDate } },
    orderBy: { asOfDate: "desc" },
  });
}
```

**Server-side convert only** (`src/lib/money.ts` lines 146–156):
```typescript
export function convertOtherMinorToPrimaryMinor(
  otherMinor: bigint,
  rateToPrimaryScaled: bigint,
  otherScale: number,
  primaryScale: number,
): bigint {
  const num =
    otherMinor * rateToPrimaryScaled * 10n ** BigInt(primaryScale);
  const den = 10n ** BigInt(otherScale) * RATE_SCALE_E8;
  return num / den;
}
```

**D-11 honesty:** missing snapshot/FX → success; native fields may be present; `primary* = null`; `conversionOk: false` + reason — never require agent multiply. Prefer account lookup + structured `account_not_found` in success payload (RESEARCH A1).

**Credit flag:** `isCreditType` from `src/lib/account-type.ts` lines 10–12 (`t === "FIAT_CREDIT"`).

---

### `src/lib/mcp/reads/load-fx-rates-asof.ts` (service, batch)

**Analog:** `src/app/currencies/rates/page.tsx` lines 9–76 (LOCF snapshot only — skip history map for CAP-04)

**Core LOCF FX list** (lines 9–76):
```typescript
await ensureSqlitePragmas();
const [nonPrimaryCurrencies, primaryCurrency, ratesLteAsOf] =
  await Promise.all([
    prisma.currency.findMany({
      where: { isPrimary: false },
      orderBy: { code: "asc" },
      select: { code: true, name: true },
    }),
    prisma.currency.findFirst({
      where: { isPrimary: true },
      select: { code: true },
    }),
    prisma.fxRate.findMany({
      where: { asOfDate: { lte: asOf } },
      orderBy: { asOfDate: "desc" },
      select: {
        currencyCode: true,
        asOfDate: true,
        rateToPrimaryScaled: true,
      },
    }),
  ]);

const locfByCurrency = firstHitLocfMap(
  ratesLteAsOf,
  (rate) => rate.currencyCode,
);

// per currency: locf ? { asOfDate, rateToPrimaryScaled: rate.toString() } : null
```

**CAP-04 deltas:** optional `currencyCode` filter; include `rateScale: 8` (`RATE_SCALE_E8`); tool description forbids conversion (D-03). Empty wallet → `{ rates: [] }` success (D-07).

---

### `src/lib/mcp/tools/accounts.ts` data shape (via registerTool above)

**Analog for metadata (not balances):** `src/app/accounts/page.tsx` lines 14–21 + 67–75 — **omit** locf/snapshots/grace (D-04).

```typescript
prisma.account.findMany({
  include: { currency: true },
  orderBy: { name: "asc" },
});
// Serialize:
// creditLimitMinor: a.creditLimitMinor == null ? null : a.creditLimitMinor.toString()
// isCredit: isCreditType(a.type)
// currencyCode / currencyScale from a.currency
```

---

### `src/lib/mcp/serialize.ts` (utility, transform)

**Analog:** RSC BigInt boundary in `src/app/accounts/page.tsx` lines 66–75 and rates page lines 69–72.

```typescript
creditLimitMinor:
  a.creditLimitMinor == null ? null : a.creditLimitMinor.toString(),
// rates:
rateToPrimaryScaled: locf.rateToPrimaryScaled.toString(),
```

**Centralize as helpers** (D-09): e.g. `minorToJson(value: bigint | null): string | null` always paired with `scale: number`; rates use `.toString()` + `rateScale: 8`. Never `Number(minor)`. Never `JSON.stringify` on raw Prisma rows with BigInt.

---

### `src/lib/mcp/as-of.ts` (utility, transform)

**Analogs:** `src/lib/dates.ts` `calendarDateToday` + zod regex from `src/lib/validations/balance.ts` (English message — D-14 / A4).

**Today helper** (`src/lib/dates.ts` lines 12–26):
```typescript
export function calendarDateToday(timeZone: string = "Europe/Moscow"): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  // ... returns `${year}-${month}-${day}`
}
```

**Wire validation pattern** (`src/lib/validations/balance.ts` lines 3–5) — copy regex, replace RU message:
```typescript
const asOfDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату"); // MCP: "asOf must be YYYY-MM-DD"
```

**Shared API (from RESEARCH):**
```typescript
export const optionalAsOfSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "asOf must be YYYY-MM-DD")
  .optional();

export function resolveAsOf(asOf?: string): string {
  return asOf ?? calendarDateToday("Europe/Moscow");
}
```

**Do not:** reject future `asOf` (D-08); do not inline `new Date().toISOString().slice(0,10)` per tool (D-06).

---

### Tests

| New test | Analog | Pattern to copy |
|----------|--------|-----------------|
| `serialize.test.ts` / `as-of.test.ts` | `src/lib/dates.test.ts` | `describe`/`it` + vitest; pure unit; garbage input rejects |
| `tools/net-worth.test.ts` | `src/lib/net-worth.test.ts` | fixture builder + assert `isPartial` / `excludeReason`; then assert stringified adapter output |
| `tools/*.test.ts` colocated under mcp | `src/lib/mcp/localhost-guard.test.ts` | Vitest next to module; `npx vitest run src/lib/mcp/` |
| balance/fx adapter | `src/lib/balances.test.ts` / `src/lib/fx.test.ts` | Prefer mocked prisma/reads or pure fixtures — do not re-prove LOCF math |

**HOST regression (already exists — keep green):** `src/app/api/mcp/route.test.ts`, `src/lib/mcp/localhost-guard.test.ts`.

## Shared Patterns

### MCP tool registration
**Source:** `src/lib/mcp/tools/wallet-ping.ts`
**Apply to:** All four CAP tool files + `create-handler.ts` wiring
- `registerX(server: McpServer)` export
- `server.registerTool(name, { description, inputSchema, annotations }, cb)`
- Return `{ content: [{ type: "text", text: JSON.stringify(payload) }] }`

### Default asOf
**Source:** `src/lib/dates.ts` `calendarDateToday("Europe/Moscow")`
**Apply to:** `get_net_worth`, `get_account_balance`, `list_fx_rates` via single `resolveAsOf`

### Money / BigInt JSON
**Source:** `src/app/accounts/page.tsx` / `src/app/currencies/rates/page.tsx` `.toString()` + `RATE_SCALE_E8` from `src/lib/money.ts`
**Apply to:** Every money field in CAP payloads (D-09)

### Partial honesty (not errors)
**Source:** `src/lib/net-worth.ts` `excludeReason` / `isPartial`
**Apply to:** NW + balance tools; empty arrays / zero NW success (D-07/D-11)

### LOCF batch Maps
**Source:** `src/lib/locf.ts` `firstHitLocfMap` (precondition: `lte` filter + `orderBy desc`)
**Apply to:** NW + FX list assemblers (page parity)

### Read-only enforcement
**Source:** Phase 23 host + D-16
**Apply to:** All MCP files — import domain **read** libs only; never `src/app/**/actions.ts`. Annotations are UX hints only, not security.

### Zod on tools
**Source:** `wallet-ping` + `validations/balance.ts` regex
**Apply to:** CAP `inputSchema`; English error strings for MCP

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | All planned files have tracked analogs; first dedicated `serialize.ts` / `as-of.ts` modules are new files but copy existing inline patterns |

## Metadata

**Analog search scope:** `src/lib/mcp/**`, `src/lib/{net-worth,balances,fx,dates,locf,money,account-type,validations}/**`, `src/app/page.tsx`, `src/app/accounts/page.tsx`, `src/app/currencies/rates/page.tsx`, `src/app/api/mcp/**`
**Search method:** `codegraph query` / `codegraph explore` + `git ls-files` tracked-source gate
**Files scanned:** ~25 tracked analogs (MCP + capital domain + pages + tests)
**Pattern extraction date:** 2026-09-10
**Tracked-source gate:** all named analogs verified via `git ls-files` (non-empty)
