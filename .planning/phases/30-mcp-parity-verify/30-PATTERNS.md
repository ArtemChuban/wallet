# Phase 30: MCP PARITY + VERIFY - Pattern Map

**Mapped:** 2026-09-22
**Files analyzed:** 9
**Analogs found:** 9 / 9

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/mcp/tools/accounts.ts` | utility (MCP tool + serialize) | request-response | `src/lib/mcp/tools/accounts.ts` (`creditLimitMinor` null keys) | exact |
| `src/lib/mcp/tools/accounts.test.ts` | test | transform | `src/lib/mcp/tools/accounts.test.ts` | exact |
| `src/lib/mcp/reads/load-forecast-overlay.ts` | service (read loader) | transform | `src/components/dashboard/DashboardChartsShell.tsx` (interest map + concat) | exact |
| `src/lib/mcp/tools/forecast.ts` | config (tool description) | request-response | `src/lib/mcp/tools/forecast.ts` | exact |
| `src/lib/mcp/create-handler.ts` | config (server instructions) | request-response | `src/lib/mcp/create-handler.ts` | exact |
| `src/lib/mcp/isolation-contract.test.ts` | test | transform (source-scan) | `src/lib/mcp/isolation-contract.test.ts` | exact |
| `src/lib/mcp/tools/forecast.test.ts` | test | transform | `src/lib/mcp/tools/forecast.test.ts` | exact |
| `src/lib/savings-interest.ts` (optional shared mapper) | utility | transform | `src/components/dashboard/DashboardChartsShell.tsx` (lines 385–409) | role-match |
| `src/components/dashboard/DashboardChartsShell.tsx` (only if extract) | component | transform | self — swap inline map for shared helper | exact |

**Supporting read-only analogs (do not rewrite in this phase unless extract requires):**

| Concern | Analog | Use |
|---------|--------|-----|
| Percent major from bps | `src/lib/savings-rate.ts` | `Number(formatBpsToPercentMajor(bps))` for D-02 |
| SAVINGS + LOCF assembly | `src/app/page.tsx` | filter + `firstHitLocfMap` membership |
| Snapshot LOCF query | `src/lib/mcp/reads/load-net-worth-asof.ts` | `balanceSnapshot.findMany` + `firstHitLocfMap` |
| Interest enumerator | `src/lib/savings-interest.ts` `listInterestSlotsInRange` | call only — do not reimplement math |

## Pattern Assignments

### `src/lib/mcp/tools/accounts.ts` (utility, request-response)

**Analog:** `src/lib/mcp/tools/accounts.ts` (extend in place — nullable catalog keys)

**Imports pattern** (lines 1–5) — add savings-rate helper:
```typescript
import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { isCreditType } from "@/lib/account-type";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { minorToJson } from "@/lib/mcp/serialize";
// ADD: import { formatBpsToPercentMajor } from "@/lib/savings-rate";
```

**Nullable catalog field pattern** (lines 16–45 — mirror `creditLimitMinor`):
```typescript
export type ListAccountRow = {
  id: number;
  name: string;
  type: string;
  currencyCode: string;
  currencyScale: number;
  creditLimitMinor: string | null;
  isCredit: boolean;
  // ADD always-present nullables (D-01/D-02):
  // annualRateBps: number | null;
  // accrualDayOfMonth: number | null;
  // annualRatePercent: number | null;
};

export function serializeListAccountsPayload(
  accounts: ListAccountInput[],
): SerializedListAccountsPayload {
  return {
    accounts: accounts.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      currencyCode: a.currencyCode,
      currencyScale: a.currencyScale,
      creditLimitMinor: minorToJson(a.creditLimitMinor),
      isCredit: isCreditType(a.type),
      // TARGET (from RESEARCH):
      // annualRateBps: a.type === "SAVINGS" ? a.annualRateBps : null,
      // accrualDayOfMonth: a.type === "SAVINGS" ? a.accrualDayOfMonth : null,
      // annualRatePercent:
      //   a.type === "SAVINGS" && a.annualRateBps != null
      //     ? Number(formatBpsToPercentMajor(a.annualRateBps))
      //     : null,
    })),
  };
}
```

**Percent helper pattern** — `src/lib/savings-rate.ts` lines 22–25:
```typescript
/** Display bps as percent major at scale 2 (D-01). */
export function formatBpsToPercentMajor(bps: number): string {
  return formatMinorToMajor(BigInt(bps), 2);
}
// MCP: Number(formatBpsToPercentMajor(bps)) → JSON number (D-02). Never emit string.
```

**Load / Prisma pass-through** (lines 49–65) — extend `ListAccountInput` + map:
```typescript
return serializeListAccountsPayload(
  accounts.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    currencyCode: a.currencyCode,
    currencyScale: a.currency.scale,
    creditLimitMinor: a.creditLimitMinor,
    // ADD: annualRateBps: a.annualRateBps,
    // ADD: accrualDayOfMonth: a.accrualDayOfMonth,
  })),
);
```

**Tool description pattern** (lines 68–80) — extend prose for SAVINGS rate/DOM/percent (D-04); do **not** add SAVISO (D-12):
```typescript
description:
  "List wallet accounts / счета (accounts-only catalog): type, currency, creditLimitMinor, isCredit. " +
  "Metadata only — no live available or debt balances (use get_account_balance).",
// EXTEND: mention annualRateBps / accrualDayOfMonth / annualRatePercent (null unless type === "SAVINGS")
```

**Register / annotations** (unchanged):
```typescript
annotations: {
  readOnlyHint: true,
  openWorldHint: false,
},
```

---

### `src/lib/mcp/tools/accounts.test.ts` (test, transform)

**Analog:** `src/lib/mcp/tools/accounts.test.ts`

**Key-set allow-list pattern** (lines 65–75) — extend with three rate keys:
```typescript
expect(Object.keys(row).sort()).toEqual(
  [
    "creditLimitMinor",
    "currencyCode",
    "currencyScale",
    "id",
    "isCredit",
    "name",
    "type",
    // ADD: "accrualDayOfMonth", "annualRateBps", "annualRatePercent",
  ].sort(),
);
```

**Fixture pattern** (lines 10–27) — add SAVINGS row with bps/DOM; assert `typeof annualRatePercent === "number"` and non-SAVINGS nulls. Keep SQLite-free serialize-only tests (Pitfall 4).

---

### `src/lib/mcp/reads/load-forecast-overlay.ts` (service, transform)

**Primary analog:** `src/components/dashboard/DashboardChartsShell.tsx` (interest → ForecastSlot + concat)
**Secondary:** `src/app/page.tsx` (SAVINGS filter + LOCF); `src/lib/mcp/reads/load-net-worth-asof.ts` (snapshot LOCF query)

**Serialize already supports interest** (lines 31–39) — no change required:
```typescript
export type SerializedForecastEvent = {
  kind: "income" | "grace" | "interest";
  parentId: number;
  plannedAmountMinor: string;
  displayPrimaryMajor: number;
  currencyCode: string;
  accountId?: number;
  accountName?: string;
  dueAsOf?: string;
};
```

**Current membership gap** (lines 322–329) — must become shell order:
```typescript
const built = buildNetWorthForecastSeries({
  anchorPrimaryMinor,
  slots: [...openSlots, ...graceSlots], // TODAY — missing interest
  rates,
  primaryScale: nw.primaryScale,
  today,
  horizonEnd,
});
// TARGET: slots: [...openSlots, ...interestSlots, ...graceSlots]
```

**Interest map + concat (copy from shell)** — `DashboardChartsShell.tsx` lines 385–418:
```typescript
const interestSlots: ForecastSlot[] = listInterestSlotsInRange(
  forecastSavings.accounts.map((row) => ({
    accountId: row.accountId,
    accountName: row.accountName,
    balanceMinor: BigInt(row.balanceMinor),
    annualRateBps: row.annualRateBps,
    accrualDayOfMonth: row.accrualDayOfMonth,
    currencyCode: row.currencyCode,
    currencyScale: row.currencyScale,
    isPrimaryCurrency: row.isPrimaryCurrency,
  })),
  today,
  horizonEnd,
).map((s) => ({
  kind: "interest" as const,
  parentId: s.parentId,
  plannedAsOf: s.plannedAsOf,
  plannedAmountMinor: s.interestMinor,
  currencyCode: s.currencyCode,
  currencyScale: s.currencyScale,
  isPrimaryCurrency: s.isPrimaryCurrency,
  accountId: s.accountId,
  ...(s.accountName !== undefined ? { accountName: s.accountName } : {}),
}));

const built = buildNetWorthForecastSeries({
  anchorPrimaryMinor: anchorMinor,
  slots: [...openSlots, ...interestSlots, ...graceSlots],
  // ...
});
```

**SAVINGS + LOCF assembly (copy from page)** — `page.tsx` lines 314–334:
```typescript
forecastSavings={{
  accounts: accounts
    .filter(
      (a) =>
        a.type === "SAVINGS" &&
        a.annualRateBps != null &&
        a.accrualDayOfMonth != null,
    )
    .map((a) => {
      const locf = locfByAccount.get(a.id);
      return {
        accountId: a.id,
        accountName: a.name,
        balanceMinor: (locf?.amountMinor ?? 0n).toString(),
        annualRateBps: a.annualRateBps!,
        accrualDayOfMonth: a.accrualDayOfMonth!,
        currencyCode: a.currencyCode,
        currencyScale: a.currency.scale,
        isPrimaryCurrency: a.currency.isPrimary,
      };
    }),
}}
```

**LOCF query pattern** — `load-net-worth-asof.ts` lines 107–128 (add parallel queries inside `loadForecastOverlay` Promise.all):
```typescript
prisma.balanceSnapshot.findMany({
  where: { asOfDate: { lte: asOf } },
  orderBy: { asOfDate: "desc" },
  select: {
    accountId: true,
    asOfDate: true,
    amountMinor: true,
  },
}),
// ...
const locfByAccount = firstHitLocfMap(snapshotsLte, (s) => s.accountId);
```

**Grace slot map already in loader** (lines 295–320) — keep; interest is parallel member, not replacement.

**Imports to add** (loader):
```typescript
import { firstHitLocfMap } from "@/lib/locf";
import { listInterestSlotsInRange } from "@/lib/savings-interest";
// OR shared toInterestForecastSlots if extracted
```

**Error / write safety:** never call `balanceSnapshot.create|update|upsert|delete` — enforced by isolation-contract + forecast.test source-scans.

---

### `src/lib/mcp/tools/forecast.ts` (config, request-response)

**Analog:** self — replace A′ closer with triple tag (D-09/D-10)

**Description constant** (lines 10–15) — stale today:
```typescript
export const GET_FORECAST_OVERLAY_DESCRIPTION =
  "Read Капитал forecast overlay / Прогноз: sparse points[] with income + A′ grace forecastEvents. " +
  "Optional horizonEnd (YYYY-MM-DD); omit defaults to today+365 (same as UI 1y/all). " +
  "UI presets 30d/90d/1y are how to pick a date — not tool params. " +
  "INISO-01/GRISO-01: Капитал forecast overlay (Прогноз) is income + A′ grace — do not fold into historical NW LOCF.";
```

**Target prose** (RESEARCH draft — discretion wording OK if tags present):
```typescript
export const GET_FORECAST_OVERLAY_DESCRIPTION =
  "Read Капитал forecast overlay / Прогноз: sparse points[] with income + interest + grace forecastEvents. " +
  "Optional horizonEnd (YYYY-MM-DD); omit defaults to today+365 (same as UI 1y/all). " +
  "UI presets 30d/90d/1y are how to pick a date — not tool params. " +
  "INISO-01/GRISO-01/SAVISO-01: Капитал forecast overlay (Прогноз) is income + interest + grace — do not fold into historical NW LOCF.";
```

**Register / handler body** (lines 17–41) — unchanged shape (`calendarDateToday`, `resolveForecastHorizonEnd`, `loadForecastOverlay`, JSON content).

---

### `src/lib/mcp/create-handler.ts` (config, request-response)

**Analog:** self — mirror forecast triple-tag; drop A′ (Pitfall 3)

**Instructions pattern** (lines 23–35):
```typescript
instructions:
  "Read-only localhost capital MCP (Капитал): wallet_ping, list_accounts, " +
  // ... catalog unchanged ...
  "INISO-01/GRISO-01: Капитал forecast overlay (Прогноз) is income + A′ grace — " +
  "do not fold into historical NW LOCF. " +
  "DISOL-01: Долги side ledger — do not fold into historical NW / Капитал LOCF. " +
  "INISO-01: Доходы side ledger — do not fold into historical NW / Капитал LOCF. " +
  "GRISO-01: Грейс side ledger — do not fold into historical NW / Капитал LOCF.",
// REPLACE overlay closer with INISO-01/GRISO-01/SAVISO-01 + income + interest + grace; no A′.
// Keep DISOL/INISO/GRISO side-ledger one-liners.
```

**Register order** (lines 38–46) — unchanged; no new tool names.

---

### `src/lib/mcp/isolation-contract.test.ts` (test, source-scan)

**Analog:** self — extend CLI-01 asserts (D-11)

**Named-tag assert pattern** (lines 61–64):
```typescript
expect(src).toMatch(/DISOL-01/);
expect(src).toMatch(/INISO-01/);
expect(src).toMatch(/GRISO-01/);
// ADD: expect(src).toMatch(/SAVISO-01/);
// ADD: expect(src).not.toMatch(/A′/);  // or equivalent stale-copy guard
```

**Never-write scan** (lines 22–27) — keep as-is; covers `load-forecast-overlay.ts` after interest wiring:
```typescript
expect(src).not.toMatch(/balanceSnapshot\.(create|update|upsert|delete)/);
expect(src).not.toMatch(/from ["']@\/app\/.*\/actions["']/);
```

---

### `src/lib/mcp/tools/forecast.test.ts` (test, transform)

**Analog:** self — extend serialize fixture + description asserts

**Serialize + kinds fixture** (lines 73–131) — add interest slot; rename/drop “A′” wording:
```typescript
// Existing: slots with kind "income" | "grace"
// ADD slot:
// {
//   kind: "interest",
//   parentId: 9,
//   plannedAsOf: "2026-10-20",
//   plannedAmountMinor: 1_000n,
//   currencyCode: "RUB",
//   currencyScale: 2,
//   isPrimaryCurrency: true,
//   accountId: 9,
//   accountName: "Накопительный",
// }
// expect(kinds).toContain("interest");
// assert plannedAmountMinor string + accountName; no rate fields on event (D-07)
```

**Description / isolation asserts** (lines 182–186):
```typescript
expect(GET_FORECAST_OVERLAY_DESCRIPTION).toMatch(/INISO-01/);
expect(GET_FORECAST_OVERLAY_DESCRIPTION).toMatch(/GRISO-01/);
// ADD: .toMatch(/SAVISO-01/); .not.toMatch(/A′/);
// OPTIONAL Wave 0: source-scan load-forecast-overlay for listInterestSlotsInRange
```

**Horizon / payload keys** (lines 134–170) — keep; isolation meta still forbidden.

---

### `src/lib/savings-interest.ts` (optional utility, transform) — discretionary extract

**Analog map site:** `DashboardChartsShell.tsx` lines 385–409

**Existing enumerator** (lines 45–49) — call; do not rewrite:
```typescript
export function listInterestSlotsInRange(
  accounts: readonly InterestAccountInput[],
  today: string,
  horizonEnd: string,
): InterestForecastSlot[]
```

**Recommended extract** (D-08 / RESEARCH discretion): thin `toInterestForecastSlots(accounts, today, horizonEnd): ForecastSlot[]` wrapping enumerator + `.map` to `kind: "interest"`. Shell + MCP import one function. Depends on `@/lib/nw-forecast` `ForecastSlot` — avoid circular imports (enumerator stays pure; mapper may live in sibling or accept map callback).

---

### `src/components/dashboard/DashboardChartsShell.tsx` (component, transform) — only if extract

**Analog:** self — replace inline `listInterestSlotsInRange(...).map(...)` with shared helper; keep concat `[...openSlots, ...interestSlots, ...graceSlots]`.

---

## Shared Patterns

### Nullable always-emit catalog keys
**Source:** `src/lib/mcp/tools/accounts.ts` (`creditLimitMinor` / `isCredit`)
**Apply to:** MCP-01 rate fields on every `ListAccountRow`
```typescript
creditLimitMinor: minorToJson(a.creditLimitMinor),
isCredit: isCreditType(a.type),
// same shape: always key, null when type !== "SAVINGS"
```

### Isolation in descriptions / instructions only
**Source:** `src/lib/mcp/tools/forecast.ts` + `src/lib/mcp/create-handler.ts` + `isolation-contract.test.ts`
**Apply to:** SAVISO-01 on overlay description + handler instructions; never payload meta; never on `list_accounts` / README
```typescript
// Tags live in GET_FORECAST_OVERLAY_DESCRIPTION + createWalletMcpHandler instructions
expect(payload).not.toHaveProperty("isolation"); // forecast.test.ts:69-70
```

### UI-identical interest membership
**Source:** `page.tsx` filter + `DashboardChartsShell` map/concat
**Apply to:** `loadForecastOverlay`
- Filter: `type === "SAVINGS" && annualRateBps != null && accrualDayOfMonth != null`
- LOCF: `firstHitLocfMap` + `(locf?.amountMinor ?? 0n)`
- Math: `listInterestSlotsInRange` only
- Concat order: income → interest → grace

### Percent as JSON number
**Source:** `src/lib/savings-rate.ts` `formatBpsToPercentMajor`
**Apply to:** `annualRatePercent` serialize
```typescript
Number(formatBpsToPercentMajor(a.annualRateBps)) // string helper → number wire
```

### SQLite-free Vitest + source-scan
**Source:** `accounts.test.ts`, `forecast.test.ts`, `isolation-contract.test.ts`
**Apply to:** all Phase 30 contract work — fixtures for LOCF minors; Orca for live DB / snap count (D-13…D-15)

### MCP tool register skeleton
**Source:** `accounts.ts` / `forecast.ts`
**Apply to:** no new tools — annotations `readOnlyHint: true`, `openWorldHint: false`, content `JSON.stringify(payload)`

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | All planned code files have in-repo analogs. Orca UAT is OPERATOR-driven (not a new source module). |

## Metadata

**Analog search scope:** `src/lib/mcp/**`, `src/lib/savings-*.ts`, `src/lib/mcp/reads/load-net-worth-asof.ts`, `src/app/page.tsx`, `src/components/dashboard/DashboardChartsShell.tsx` (codegraph explore/callers + `git ls-files` tracked-source gate)
**Files scanned:** ~15 tracked sources (MCP tools/reads/tests + page/shell + savings libs)
**Pattern extraction date:** 2026-09-22
**Tracked-source gate:** all named analogs verified via `git ls-files` (non-empty)
