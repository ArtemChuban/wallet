# Phase 24: Capital Read Tools - Research

**Researched:** 2026-09-10
**Domain:** In-process MCP read tools over Wallet capital domain (accounts / NW / balances / FX)
**Confidence:** HIGH

## Summary

Phase 24 is a **thin MCP adapter wave**, not new finance math. Phase 23 already mounts Streamable HTTP at `/api/mcp` with localhost Host/Origin/PORT guard, `createWalletMcpHandler` (`@modelcontextprotocol/server@2.0.0` `createMcpHandler` + `responseMode: "json"`), and `wallet_ping`. This phase registers four CAP tools that call the same LOCF + `computeNetWorthRows` path as Капитал (`src/app/page.tsx`), stringify BigInt minors, and surface partial-FX honesty (`isPartial` / `excludeReason`) without agent-side conversion.

**Primary recommendation:** Extend `createWalletMcpHandler` with `src/lib/mcp/tools/{accounts,net-worth,balances,fx}.ts` + shared `serialize.ts` / optional `reads/*` assemblers; reuse `calendarDateToday`, `firstHitLocfMap`, `computeNetWorthRows`, `getBalanceAsOf`/`getRateAsOf` (or batch Maps); set `annotations.readOnlyHint: true` (+ prefer `openWorldHint: false`); replace Phase 23 minimal `instructions` with capital-era English + RU aliases. **No new npm packages.**

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Tool catalog
- **D-01:** Four separate CAP tools: `list_accounts`, `get_net_worth`, `get_account_balance`, `list_fx_rates` (keep `wallet_ping`). — **Reversibility:** costly — renaming published MCP tool surface breaks CLI agents once connected
- **D-02:** Names match research (no `wallet_` prefix on CAP tools; `wallet_ping` unchanged).
- **D-03:** `list_fx_rates` returns an as-of LOCF snapshot of primary↔other rates (optional `currencyCode` filter). It is honesty/transparency only — agents must **not** convert; all conversion happens server-side inside `get_net_worth` / `get_account_balance`. Tool description must say so.
- **D-04:** `list_accounts` = CAP-01 metadata: type, currency, `creditLimitMinor` + credit flags — no live available/debt (those come from balance tool).

### As-of defaults
- **D-05:** Missing `asOf` defaults to “today” for `get_net_worth`, `get_account_balance`, and `list_fx_rates`.
- **D-06:** “Today” via shared `calendarDateToday` helper — `Europe/Moscow` now; same path later reads settings timezone (pending todo). Do not hardcode today separately in each tool.
- **D-07:** Empty wallet / missing data = success with empty arrays / zero NW + structured honesty flags (`isPartial`, `excludeReason`) — not a tool error.
- **D-08:** Wire format strict `YYYY-MM-DD`; garbage → MCP input validation error; future `asOf` allowed (LOCF ≤ date, same as UI).

### Response shape / money honesty
- **D-09:** Money: minor units as JSON **strings** + `scale` beside them (never number; not major-only).
- **D-10:** `get_net_worth` = full Капитал parity: `totalPrimaryMinor` + `isPartial` + per-account rows with `excludeReason` / contribution (same contract as `computeNetWorthRows`).
- **D-11:** `get_account_balance`: on missing FX/snapshot return success with native fields + `primary* = null` + reason / `conversionOk: false` — never require agent to multiply rates.
- **D-12:** Enrich NW/balance rows with `accountName`, `currencyCode`, type (like `src/app/page.tsx`).

### Annotations this phase
- **D-13:** Set `readOnlyHint: true` on all CAP tools now + short descriptions (honesty / do-not-convert). Full DISOL/INISO/GRISO isolation copy waits Phase 26 (CLI-01).
- **D-14:** Tool descriptions / server instructions: English primary + RU domain aliases in parentheses (e.g. net worth / Капитал).
- **D-15:** Replace Phase 23 minimal instructions with short capital-era text: read-only capital tools; NW is accounts-only (no debts); FX list is not a converter; side ledgers come later.
- **D-16:** No CI path-ban on mutate imports under `src/lib/mcp/**` this phase — enforce read-only via plan/review (reuse domain read libs only; no actions). — **Reversibility:** reversible — CI ban can be added later without API change

### Claude's Discretion
- None — user selected every option (including D-16 against the CI-ban recommendation).

### Deferred Ideas (OUT OF SCOPE)
- Side-ledger MCP tools + DISOL/INISO/GRISO enforcement in tool outputs — Phase 25
- Full CLI-01 isolation copy + connect docs — Phase 26
- CI mutate-import ban under `src/lib/mcp/**` — optional hardening later (user deferred)
- Savings account type + interest NW forecast — backlog todo (not CAP)
- Timezone selection in settings — pending todo (feeds D-06 later)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CAP-01 | Agent can list accounts with types, currencies, and credit metadata via MCP | `list_accounts` → Prisma `account.findMany({ include: { currency: true } })`; stringify `creditLimitMinor`; `isCreditType`; no LOCF balances |
| CAP-02 | Agent can get net worth as-of a date via MCP with partial-FX honesty | `get_net_worth` → page-parity batch LOCF + `computeNetWorthRows`; return `totalPrimaryMinor` (string) + `isPartial` + rows with `excludeReason` |
| CAP-03 | Agent can get an account's native and primary balance as-of a date via MCP | `get_account_balance` → `getBalanceAsOf` / LOCF + server `convertOtherMinorToPrimaryMinor` or NW row path; null primary + `conversionOk: false` on miss |
| CAP-04 | Agent can list FX rates / rate-as-of (primary↔other) via MCP | `list_fx_rates` → rates-page LOCF snapshot; optional `currencyCode`; description forbids agent conversion |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| MCP tool registration / protocol | API / Backend (`src/lib/mcp`) | Frontend Server (Next Route Handler already shipped) | Tools run in Node route; no browser |
| Localhost Host/Origin guard | API / Backend | — | Phase 23; do not widen |
| Account metadata list (CAP-01) | API / Backend | Database / Storage | Prisma Account + Currency read |
| Net worth as-of (CAP-02) | API / Backend | Database / Storage | Same assembler as Капитал page + pure `computeNetWorthRows` |
| Account balance as-of (CAP-03) | API / Backend | Database / Storage | BalanceSnapshot LOCF + FX LOCF + money convert |
| FX LOCF list (CAP-04) | API / Backend | Database / Storage | FxRate LOCF ≤ asOf; transparency only |
| Default “today” | API / Backend | — | `calendarDateToday("Europe/Moscow")` — not client clock |
| BigInt → JSON strings | API / Backend | — | MCP `content[].text` JSON; RSC already uses `.toString()` |
| Isolation copy DISOL/… | Deferred Phase 26 | — | D-13/D-15 scaffold only this phase |

## Project Constraints (from .cursor/rules/ + AGENTS.md)

- **No `.cursor/rules/` directory** in this repo — no extra rule files beyond AGENTS/CLAUDE. [VERIFIED: glob]
- **Next.js docs gate:** Read `node_modules/next/dist/docs/` before writing Next-specific code; APIs may differ from training. [VERIFIED: AGENTS.md:1-8]
- **UAT operator:** Before verify-work / UAT, read `.planning/OPERATOR.md`; agent drives `npm run dev` + Orca; ask human only for subjective / hard blockers. [VERIFIED: AGENTS.md:11-16]
- **Code search:** Prefer `codegraph query` / `codegraph explore` for project symbol search (user rule).

## Standard Stack

### Core (reuse — do not install new packages)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@modelcontextprotocol/server` | 2.0.0 (installed) | `McpServer.registerTool` + `createMcpHandler` | Phase 23 host; `registerTool` config supports `annotations` [VERIFIED: npm ls + mcp.d.ts:150-157] |
| `zod` | 4.5.4 | Tool `inputSchema` (asOf / accountId / currencyCode) | App + MCP peer; same as `wallet_ping` [VERIFIED: package.json / npm ls] |
| Prisma 7 + `@/lib/db` | existing | Account / BalanceSnapshot / FxRate / Currency reads | Single SQLite path |
| `@/lib/net-worth` `computeNetWorthRows` | existing | CAP-02 honesty contract | Pure; tested |
| `@/lib/locf` `firstHitLocfMap` / `locfAmountAsOf` / `locfRateAsOf` | existing | Batch LOCF ≤ asOf | Page parity |
| `@/lib/balances` `getBalanceAsOf` | existing | Single-account LOCF snapshot | CAP-03 |
| `@/lib/fx` `getRateAsOf` + `convertOtherMinorToPrimaryMinor` | existing | Rate LOCF + conversion | CAP-03/04; conversion server-side only |
| `@/lib/dates` `calendarDateToday` | existing | Default asOf (D-06) | Default TZ `"Europe/Moscow"` [VERIFIED: dates.ts:12-26] |
| `@/lib/account-type` `isCreditType` | existing | Credit flags for CAP-01 | `t === "FIAT_CREDIT"` [VERIFIED: account-type.ts:10-12] |
| `@/lib/money` `RATE_SCALE_E8` | existing | Document FX scale beside rate strings | `100000000n` [VERIFIED: money.ts:1-2] |
| Vitest | 4.1.11 | Adapter / serialize / asOf default unit tests | `vitest.config.ts` includes `src/**/*.test.ts` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Existing form `asOfDateSchema` pattern | — | `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` | MCP input; prefer **English** error message (D-14), not copy RU `"Укажите дату"` from form schemas [VERIFIED: validations/balance.ts:3-5] |
| `mcp-handler` | ^2.1.1 | Installed Phase 23 | Do **not** switch create path — Phase 23 uses SDK `createMcpHandler` for `responseMode` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Page-parity batch LOCF Maps | N× `getBalanceAsOf` / `getRateAsOf` in NW | Works for single account; NW must batch like `page.tsx` |
| Shared `src/lib/validations/*` schemas | Duplicate zod in tools | Form schemas have RU messages + write fields — extract regex only or MCP-local schema |
| CI mutate-import ban | Plan/review only | **Locked D-16** — defer CI |

**Installation:**

```bash
# None — Phase 24 adds no packages
```

**Version verification:** `@modelcontextprotocol/server@2.0.0`, `zod@4.5.4`, `vitest@4.1.11`, `next@16.3.4` via `npm ls` / `package.json` this session. [VERIFIED: npm ls]

## Package Legitimacy Audit

> Phase installs **no** new external packages. Audit covers deps already in tree that tools will call.

| Package | Registry | Age / signals | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|---------------|-----------|-------------|---------|-------------|
| `@modelcontextprotocol/server` | npm | published 2026-07-27 | ~2.9M/wk | typescript-sdk | OK | Approved (already installed) |
| `zod` | npm | flagged too-new by seam | ~155M/wk | colinhacks/zod | SUS (too-new) | Keep — already pinned `4.5.4` in app; no new install |
| `vitest` | npm | flagged too-new by seam | ~57M/wk | vitest-dev/vitest | SUS (too-new) | Keep — already pinned; no new install |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** zod, vitest — **no planner install checkpoint** (already in tree; seam “too-new” only). Do not add new packages this phase.

## Architecture Patterns

### System Architecture Diagram

```
CLI agent (tools/call)
    │  Streamable HTTP JSON-RPC
    ▼
/api/mcp  (Phase 23 — unchanged mount)
    │
    ▼
withLocalhostGuard → createWalletMcpHandler().fetch
    │
    ▼
McpServer instructions (capital-era D-15)
    ├── wallet_ping          (keep)
    ├── list_accounts        → prisma Account+Currency → serialize
    ├── get_net_worth        → batch snapshots/rates ≤ asOf → computeNetWorthRows → serialize
    ├── get_account_balance  → LOCF balance + rate → convert OR null primary
    └── list_fx_rates        → LOCF FxRate ≤ asOf (filter?) → serialize (no convert)
    │
    ▼
content: [{ type: "text", text: JSON.stringify(payload) }]
```

### Recommended Project Structure

```
src/lib/mcp/
├── create-handler.ts          # MODIFY — register CAP tools + new instructions
├── localhost-guard.ts         # unchanged
├── serialize.ts               # NEW — bigint/null-safe JSON helpers
├── as-of.ts                   # NEW optional — resolveAsOf(input) via calendarDateToday
├── tools/
│   ├── wallet-ping.ts         # keep
│   ├── accounts.ts            # NEW list_accounts
│   ├── net-worth.ts           # NEW get_net_worth
│   ├── balances.ts            # NEW get_account_balance
│   └── fx.ts                  # NEW list_fx_rates
└── reads/                     # NEW optional page-parity assemblers
    ├── load-net-worth-asof.ts
    ├── load-account-balance-asof.ts
    └── load-fx-rates-asof.ts
```

### Pattern 1: registerTool + annotations (Phase 23 extension)

**What:** Same `server.registerTool(name, config, cb)` as `wallet_ping`; add `annotations: { readOnlyHint: true, openWorldHint: false }`.
**When to use:** All four CAP tools (D-13). Optional: also annotate `wallet_ping` for consistency — not required by CAP IDs.
**Example:**

```typescript
// Source: node_modules/@modelcontextprotocol/sdk/.../simpleStreamableHttp.js + mcp.d.ts registerTool
server.registerTool(
  "get_net_worth",
  {
    description:
      "Net worth as-of date (Капитал): accounts-only total in primary; partial FX via isPartial/excludeReason. Server converts — do not multiply rates.",
    inputSchema: z.object({
      asOf: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "asOf must be YYYY-MM-DD")
        .optional(),
    }),
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async ({ asOf }) => {
    const asOfDate = asOf ?? calendarDateToday("Europe/Moscow");
    const payload = await loadNetWorthAsOf(asOfDate);
    return { content: [{ type: "text", text: JSON.stringify(payload) }] };
  },
);
```

[VERIFIED: mcp.d.ts:150-157 annotations?: ToolAnnotations; types.js:1173-1210 readOnlyHint/openWorldHint]

### Pattern 2: Page-parity NW assembler

**What:** Copy the Капитал load shape from `page.tsx`: `ensureSqlitePragmas` → parallel accounts + primary currency + snapshots `asOfDate: { lte }` + rates `lte` → `firstHitLocfMap` → `NetWorthAccountInput[]` → `computeNetWorthRows` → enrich with `accountName` / `currencyCode` / type; stringify all bigint fields + include `scale` / `primaryScale` / `rateScale: 8`.
**When to use:** `get_net_worth` only.
**Anti-fork:** Do not recompute inclusion rules in the tool.

[VERIFIED: page.tsx:16-137 computeNetWorthRows wiring; net-worth.ts:28-42 excludeReason union `"none" | "no_balance" | "no_fx"`]

### Pattern 3: Serialize minors as strings

**What:** Central helper e.g. `minorToJson(value: bigint | null): string | null` and always pair with `scale: number`. Rates: `rateToPrimaryScaled.toString()` + `rateScale: 8` (`RATE_SCALE_E8`).
**When to use:** Every money field in tool JSON (D-09). Mirror accounts page / rates page `.toString()` at RSC boundary.

[VERIFIED: page.tsx:194-198 creditLimitMinor.toString(); rates/page.tsx:71 rateToPrimaryScaled.toString(); money.ts:1-2]

### Pattern 4: Empty / partial = success

**What:** Missing snapshots/rates → still HTTP/tool success with empty arrays or zero `totalPrimaryMinor: "0"` + `isPartial: true` / per-row `excludeReason` (D-07). Tool **errors** only for invalid input (bad asOf shape, unknown accountId if planner chooses hard fail — prefer structured not-found success for missing account [ASSUMED] unless discuss locked otherwise; recommend structured `{ error: "account_not_found" }` in success payload OR MCP error — planner pick; prefer success+reason for honesty consistency with D-07/D-11).

### Anti-Patterns to Avoid

- **Twin domain math in tools** — inventing SQL totals or Number FX multiply
- **Agent converter FX tool** — `list_fx_rates` must not offer convert API (D-03)
- **Importing `src/app/**/actions.ts`** from MCP — mutate bleed (D-16: review enforce, no CI)
- **`JSON.stringify` on raw Prisma rows with BigInt** — throws; always serialize first
- **Hardcoding today’s date string** instead of `calendarDateToday` (D-06)
- **Returning live available/debt on `list_accounts`** (D-04)
- **Full DISOL/INISO/GRISO essay** in this phase (Phase 26) — only short capital-era instructions (D-15)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| NW inclusion / credit debt sign | Custom SQL or float math | `computeNetWorthRows` | excludeReason / isPartial / credit debt already locked |
| LOCF pick | Ad-hoc `ORDER BY` loops per tool | `firstHitLocfMap` / `getBalanceAsOf` / `getRateAsOf` / `locf*AsOf` | Same semantics as UI |
| FX convert | Agent or tool-local multiply | `convertOtherMinorToPrimaryMinor` inside NW/balance tools | D-03 / D-11 |
| Calendar today | `new Date().toISOString().slice(0,10)` | `calendarDateToday("Europe/Moscow")` | TZ wrong without helper |
| BigInt JSON | `Number(minor)` | `.toString()` + scale | Precision loss |
| asOf shape | Hand parsers | Zod `/^\d{4}-\d{2}-\d{2}$/` | D-08; MCP validation error |

**Key insight:** MCP layer is transport + serialize + descriptions. Domain truth already lives in `@/lib/*`.

## Common Pitfalls

### Pitfall 1: Reimplement NW / break partial honesty
**What goes wrong:** Tool returns invented rates or folds debts into NW.
**Why it happens:** Prisma `findMany` tutorials; Phase 25 domains tempt early.
**How to avoid:** Call `computeNetWorthRows` only; debts never in CAP tools (Phase 25).
**Warning signs:** No `excludeReason` field; debts in NW payload.

### Pitfall 2: BigInt JSON throw / Number coercion
**What goes wrong:** `JSON.stringify` throws on bigint; or agents get imprecise floats.
**Why it happens:** Prisma returns BigInt for money columns.
**How to avoid:** `serialize.ts` before stringify; D-09 strings + scale.
**Warning signs:** 500 on tools/call; `primaryDisplayMinor: 12345` as number.

### Pitfall 3: Default asOf drift across tools
**What goes wrong:** One tool uses UTC date, another Moscow → mismatched NW vs FX list.
**Why it happens:** Inline `new Date()` per file.
**How to avoid:** Single `resolveAsOf(optional)` wrapping `calendarDateToday("Europe/Moscow")` (D-06).
**Warning signs:** Different defaults in three handlers.

### Pitfall 4: Treating annotations as security
**What goes wrong:** Rely on `readOnlyHint` to prevent writes.
**Why it happens:** Spec-looking field names.
**How to avoid:** Annotations = UX hints only [CITED: blog.modelcontextprotocol.io/posts/2026-03-16-tool-annotations/]; enforce RO by not registering mutate tools + review (D-16).
**Warning signs:** CI/docs claim “MCP cannot write because readOnlyHint”.

### Pitfall 5: list_fx_rates as converter
**What goes wrong:** Agents multiply `rateToPrimaryScaled` incorrectly (forget E8 / scales).
**Why it happens:** Tool looks like a rate table for DIY convert.
**How to avoid:** Description: not a converter; primary amounts only from `get_net_worth` / `get_account_balance` (D-03).
**Warning signs:** Tool named `convert_fx` or description omits ban.

### Pitfall 6: Rejecting future asOf
**What goes wrong:** Validation mirrors write actions (`asOfDate > today` reject) and blocks LOCF preview.
**Why it happens:** Copying Server Action rules.
**How to avoid:** D-08 — future allowed; LOCF ≤ date.
**Warning signs:** Error “date cannot be in the future” on MCP read.

## Code Examples

### Resolve asOf (D-05/D-06/D-08)

```typescript
// Source: src/lib/dates.ts calendarDateToday + validations/balance.ts regex pattern
import { z } from "zod";
import { calendarDateToday } from "@/lib/dates";

export const optionalAsOfSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "asOf must be YYYY-MM-DD")
  .optional();

export function resolveAsOf(asOf?: string): string {
  return asOf ?? calendarDateToday("Europe/Moscow");
}
```

### Net worth excludeReason contract (verbatim)

From `src/lib/net-worth.ts:28-42`:

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

Serialize bigint fields to strings; keep `excludeReason` / `includedInTotal` / `isPartial` as-is.

### Account type enum (CAP-01)

From `prisma/schema.prisma:12-18`:

```prisma
enum AccountType {
  ASSET
  FIAT_DEBIT
  FIAT_CREDIT
  CRYPTO
  CASH
}
```

Credit flag: `isCreditType(type)` → `type === "FIAT_CREDIT"` [VERIFIED: account-type.ts:10-12].

### Suggested tool I/O sketch (planner → executor)

| Tool | Input | Success payload (sketch) |
|------|-------|---------------------------|
| `list_accounts` | `{}` | `{ accounts: [{ id, name, type, currencyCode, currencyScale, creditLimitMinor: string\|null, isCredit }] }` |
| `get_net_worth` | `{ asOf? }` | `{ asOf, primaryCurrencyCode, primaryScale, totalPrimaryMinor: string, isPartial, rows: [...computeNetWorthRows + name/type/currency] }` |
| `get_account_balance` | `{ accountId, asOf? }` | `{ asOf, accountId, accountName, type, currencyCode, currencyScale, nativeAmountMinor: string\|null, primaryAmountMinor: string\|null, primaryScale, conversionOk, excludeReason? }` |
| `list_fx_rates` | `{ asOf?, currencyCode? }` | `{ asOf, primaryCurrencyCode, rateScale: 8, rates: [{ currencyCode, asOfDate, rateToPrimaryScaled: string }\| null locf] }` |

Exact field names are planner-discretion as long as D-09…D-12 hold; prefer stable English keys.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Stdio finance MCP sidecar | In-app Streamable HTTP | v1.4 / Phase 23 | Tools share Prisma + domain libs |
| mcp-handler create for responseMode | SDK `createMcpHandler` | Phase 23 decision | Keep this create path |
| Float money in APIs | BigInt minor + string JSON | Wallet v1.0 | MCP must stringify |
| Annotations absent on `wallet_ping` | CAP tools set `readOnlyHint` | Phase 24 | Client auto-approve UX |

**Deprecated/outdated:**
- Dual-endpoint HTTP+SSE-only MCP — not used; Streamable JSON mode already set
- Agent-side FX conversion — forbidden by D-03

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Missing `accountId` for `get_account_balance` should return structured success reason rather than hard MCP error | Pattern 4 | Planner must lock error vs success-not-found |
| A2 | `openWorldHint: false` alongside required `readOnlyHint` is desirable | Pattern 1 | Harmless if omitted; UX only |
| A3 | `list_accounts` need not return grace DOM fields (`statementDayOfMonth` / `dueDayOfMonth`) | CAP-01 / D-04 | If agents need DOM, add later or Phase 25 |
| A4 | English zod messages for MCP (not RU form copy) | Standard Stack | Slight inconsistency with form i18n; D-14 prefers English primary |

**If empty table were required for zero assumptions:** N/A — four low-risk assumptions above need planner defaults, not user re-discuss (discretion was none on larger options).

## Open Questions

1. **Missing account on `get_account_balance`**
   - What we know: D-07 empty/missing data → success + honesty flags for NW/FX emptiness; D-11 covers missing FX/snapshot
   - What's unclear: unknown `accountId` — error vs `{ error: "account_not_found" }`
   - Recommendation: success payload with `error: "account_not_found"` and null amounts (keep tool surface soft); document in PLAN

2. **Whether to annotate `wallet_ping`**
   - What we know: D-13 says all CAP tools
   - Recommendation: optional one-liner in same plan for consistency; not CAP-blocking

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vitest / Next | ✓ | v24.5.0 | — |
| npm | scripts | ✓ | 10.9.3 | — |
| `@modelcontextprotocol/server` | tools | ✓ | 2.0.0 | — |
| Zod / Vitest / Prisma | tools + tests | ✓ | pinned | — |
| Running app `:3000` | curl tools/list smoke | optional for unit | — | Unit tests without live server; smoke when `npm run dev` |

**Missing dependencies with no fallback:** none

**Missing dependencies with fallback:** live MCP smoke — fallback = Vitest adapter tests + Phase 23 curl pattern when app up

Step 2.6: external tools beyond code — only Node/npm (available). Graphify disabled (`gsd_run graphify status` → disabled).

## Validation Architecture

> `workflow.nyquist_validation` is true in `.planning/config.json`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.11 |
| Config file | `vitest.config.ts` (`include: ["src/**/*.test.ts"]`) |
| Quick run command | `npx vitest run src/lib/mcp/` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CAP-01 | `list_accounts` returns type/currency/creditLimitMinor string/isCredit; no balance fields | unit | `npx vitest run src/lib/mcp/tools/accounts.test.ts` | ❌ Wave 0 |
| CAP-02 | `get_net_worth` matches `computeNetWorthRows` isPartial/excludeReason; bigint→string | unit | `npx vitest run src/lib/mcp/tools/net-worth.test.ts` | ❌ Wave 0 |
| CAP-03 | missing FX → `conversionOk: false`, primary null, native present | unit | `npx vitest run src/lib/mcp/tools/balances.test.ts` | ❌ Wave 0 |
| CAP-04 | LOCF ≤ asOf; filter currencyCode; description/annotations present | unit | `npx vitest run src/lib/mcp/tools/fx.test.ts` | ❌ Wave 0 |
| D-05/06 | omit asOf → `calendarDateToday("Europe/Moscow")` | unit | `npx vitest run src/lib/mcp/as-of.test.ts` | ❌ Wave 0 |
| D-08 | garbage asOf → validation fail | unit | same as-of / tool tests | ❌ Wave 0 |
| D-09 | serialize helpers never emit number minors | unit | `npx vitest run src/lib/mcp/serialize.test.ts` | ❌ Wave 0 |
| HOST regression | route still exports GET/POST/DELETE + guard | unit | `npx vitest run src/app/api/mcp/route.test.ts src/lib/mcp/localhost-guard.test.ts` | ✅ |

### Sampling Rate

- **Per task commit:** `npx vitest run src/lib/mcp/`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/lib/mcp/serialize.ts` + `serialize.test.ts` — BigInt/null helpers (REQ money honesty)
- [ ] `src/lib/mcp/as-of.ts` + `as-of.test.ts` — default today + regex (D-05/06/08)
- [ ] `src/lib/mcp/tools/{accounts,net-worth,balances,fx}.test.ts` — CAP-01…04 with mocked prisma/reads or pure assembler fixtures
- [ ] Prefer testing read assemblers with fixtures (no live SQLite) — mirror `net-worth.test.ts` style
- [ ] Framework install: none — Vitest already present

Existing domain tests (`src/lib/net-worth.test.ts`, `balances.test.ts`, `fx.test.ts`) remain the math source of truth; MCP tests assert adapter parity + serialization, not re-prove LOCF.

## Security Domain

> `security_enforcement` enabled (ASVS level 1).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no (localhost single-user; Phase 23 Host/Origin) | Existing guard — do not widen |
| V3 Session Management | no | Stateless MCP (`legacy: "stateless"`) |
| V4 Access Control | partial | Loopback only; no multi-user ACL |
| V5 Input Validation | yes | Zod asOf / accountId / currencyCode on tools |
| V6 Cryptography | no new crypto | Reuse money BigInt math — never hand-roll FX |

### Known Threat Patterns for MCP capital reads

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| DNS rebinding exfil | Information Disclosure | Phase 23 Host/Origin/PORT guard — unchanged |
| Prompt-injected mutate via MCP | Tampering | No write tools; do not import actions (D-16 review) |
| Agent invents FX / NW | Spoofing / Elevation of trust | Partial honesty fields; server-side convert only; tool copy |
| Logging PII/payloads | Information Disclosure | Log tool **name** not money payloads [CITED: .planning/research/PITFALLS.md] |
| Annotation-as-auth | Spoofing | Treat hints as UX only |

## Sources

### Primary (HIGH confidence)

- Installed SDK: `node_modules/@modelcontextprotocol/sdk/dist/esm/server/mcp.d.ts` (`registerTool` + `annotations`)
- Installed SDK: `types.js` `ToolAnnotationsSchema` (`readOnlyHint`, `openWorldHint`, defaults)
- Installed example: `simpleStreamableHttp.js` annotations usage
- In-repo: `src/lib/mcp/create-handler.ts`, `tools/wallet-ping.ts`, `src/app/api/mcp/route.ts`
- In-repo: `src/lib/net-worth.ts`, `balances.ts`, `fx.ts`, `dates.ts`, `locf.ts`, `account-type.ts`, `money.ts`
- In-repo: `src/app/page.tsx`, `src/app/currencies/rates/page.tsx`, `src/app/accounts/page.tsx`
- In-repo: `prisma/schema.prisma` Account / FxRate / BalanceSnapshot
- Milestone research: `.planning/research/{SUMMARY,FEATURES,ARCHITECTURE,PITFALLS,STACK}.md` (distilled; Phase 23 create-path supersedes STACK’s mcp-handler sketch)
- Phase 23: `23-02-SUMMARY.md` — shipped host + ping pattern

### Secondary (MEDIUM confidence)

- [MCP Tool Annotations blog](https://blog.modelcontextprotocol.io/posts/2026-03-16-tool-annotations/) — hints not security; recommend `readOnlyHint` + `openWorldHint: false` for closed DB
- [MCP tools spec 2025-03-26](https://modelcontextprotocol.io/specification/2025-03-26/server/tools) — annotations untrusted unless trusted server

### Tertiary (LOW confidence)

- None material for planning

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — packages already installed; no new deps
- Architecture: HIGH — page + Phase 23 patterns verified in source
- Pitfalls: HIGH — milestone PITFALLS + domain locks + BigInt/JSON verified

**Research date:** 2026-09-10
**Valid until:** 2026-10-10 (30 days; MCP SDK surface stable for this pinned 2.0.0)
