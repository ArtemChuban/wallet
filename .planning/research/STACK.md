# Stack Research

**Domain:** SAVINGS account type + monthly interest NW forecast overlay (v1.5)
**Researched:** 2026-09-11
**Confidence:** HIGH
**Milestone:** v1.5 Сберегательный счет (subsequent — ADD to existing app; do not replace core stack)

## Recommended Stack

### Core Technologies (reuse — do NOT replace / do NOT bump for savings alone)

| Technology | Version (pinned in `package.json`) | Purpose for v1.5 | Why recommended |
|------------|--------------------------------------|------------------|-----------------|
| Prisma | 7.10.0 + `@prisma/adapter-better-sqlite3` 7.10.0 + `better-sqlite3` 13.0.3 | `AccountType.SAVINGS` enum value + nullable rate/DOM columns on `Account` + SQLite CHECK invariant | Same SQLite path as credit DOM; Prisma Enum→TEXT on SQLite (Client validates; DB CHECK for field coupling) |
| Next.js | 16.3.4 App Router | Account CRUD forms + Капитал `/` forecast wiring | Already hosts UI + MCP; no new runtime |
| Zod | 4.5.4 | Create/update schemas for annual % + accrual day; MCP tool `inputSchema` | App-wide validation; MCP Standard Schema peer already satisfied |
| Vitest | 4.1.11 | Pure interest math + SAVISO isolation twin (never-calls BalanceSnapshot / historical NW) | Mirror `griso.test.ts` / `iniso` patterns — no new test runner |
| recharts | 3.10.1 | Existing dashed «Прогноз» `Line` (`strokeDasharray`) | Interest feeds **same** forecast series — no second chart lib / no second dashed Line (legend split OOS) |
| mcp-handler | 2.1.1 | Same `/api/mcp` host | PARITY-01 tools stay in-process; no new transport |
| `@modelcontextprotocol/server` | 2.0.0 | `registerTool` + `readOnlyHint` / `openWorldHint: false` | Extend existing CAP/SIDE tools; no new MCP packages |

### New packages (v1.5)

**None.** Install step is empty. All capability = schema + `@/lib/*` + MCP tool/description updates.

### Supporting Libraries (in-repo — prefer over npm)

| Module | Version | Purpose | When to use |
|--------|---------|---------|-------------|
| `@/lib/money.ts` (`RATE_SCALE_E8`, `parseMajorToMinor`, bigint convert) | — | Exact monthly interest: `balanceMinor × rate / 12` without Float | Always for interest amount → primary forecast slots |
| `@/lib/dates.ts` + existing `clampDayOfMonth` (income/grace) | — | Accrual day-of-month 1–31 clamp on short months | Occurrence dates for forecast slots |
| `@/lib/nw-forecast.ts` | — | Extend `ForecastSlotKind` with `"interest"` (or `"savings"`); ΔNW = +interest (unlike grace A′=0) | Single stair-step «Прогноз» with income + grace + interest |
| `@/lib/account-type.ts` | — | `isAssetType` / labels: SAVINGS is asset-like for historical NW | Soft-read + write-path alongside ASSET |
| `@/lib/mcp/reads/load-forecast-overlay.ts` + `tools/forecast.ts` | — | Page-parity MCP `get_forecast_overlay` events include interest | PARITY-01 same milestone |
| `@/lib/mcp/tools/accounts.ts` (+ optional thin list) | — | Expose `annualRate*` + `accrualDayOfMonth` on savings rows | Agents see same fields as UI |
| SQLite `CHECK` (migration RedefineTables) | — | `Account_savings_rate_invariant`: rate+DOM both set iff `type = 'SAVINGS'`; DOM 1–31 | Twin of `Account_grace_dom_invariant` / credit-limit CHECK |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `prisma migrate dev` | Enum + columns + CHECK | SQLite enum add is TEXT — no ALTER ENUM; RedefineTables when adding CHECK |
| Vitest file-scan / never-calls | SAVISO twin of GRISO/INISO | Ban forecast/savings writers from `computeNetWorthRows` / LOCF history |
| MCP Inspector / existing forecast tests | `get_forecast_overlay` event `kind` includes interest | Keep string bigint minors + FX LOCF honesty |

## Installation

```bash
# v1.5 — no new runtime or dev dependencies
# (schema + domain + MCP only)

# Already present — do not bump for savings alone
# next@16.3.4 prisma@7.10.0 zod@4.5.4 recharts@3.10.1
# mcp-handler@2.1.1 @modelcontextprotocol/server@2.0.0 vitest@4.1.11
```

**Integration sketch (opinionated):**

```prisma
enum AccountType {
  ASSET
  FIAT_DEBIT
  FIAT_CREDIT
  CRYPTO
  CASH
  SAVINGS // NEW — write-path peer of ASSET; NW like asset
}

model Account {
  // …
  /// Annual rate in basis points (850 = 8.50%). Required iff type == SAVINGS.
  annualRateBps       Int?
  /// Accrual day-of-month 1–31 (clamp). Required iff type == SAVINGS.
  accrualDayOfMonth   Int?
}
```

```typescript
// Pure — @/lib/savings-interest.ts (new file; money-only imports)
// monthlyInterestMinor = (balanceMinor * BigInt(annualRateBps)) / (10_000n * 12n)
// Round policy: truncate toward 0 once per accrual slot (document in CONTEXT)

// @/lib/nw-forecast.ts — ForecastSlotKind = "income" | "grace" | "interest"
// interest: primaryMinor = converted interest (ΔNW > 0); grace stays 0n

// MCP — extend get_forecast_overlay description: INISO/GRISO + SAVISO-01
// list_accounts: include annualRateBps + accrualDayOfMonth when type=SAVINGS
```

**Rate storage decision (locked recommendation):** store **`annualRateBps: Int`** (1 bps = 0.01%). Why not reuse `RATE_SCALE_E8`: FX scale means “primary per 1 other,” not percent — overloading confuses MCP/UI. Why not `Float`/`Decimal`: wallet money path is bigint-only; industry default for APR is integer bps. UI parses percent major string (e.g. `8.5`) → `850` via Zod + integer scale-2 helper (mirror `parseMajorToMinor` at scale 2, or thin `parsePercentToBps`).

## Alternatives Considered

| Recommended | Alternative | When alternative wins |
|-------------|-------------|------------------------|
| **Zero new npm** + Prisma fields on `Account` | Separate `SavingsAccount` / interest ledger tables | Only if later auto BalanceSnapshot / accrual journal ships — OOS for v1.5 |
| `annualRateBps: Int` | `annualRateScaled BigInt` @ 1e8 fraction | If rates need >2 decimal places (e.g. 8.125%) — not needed for RU retail savings UI |
| Extend `buildNetWorthForecastSeries` + one dashed Line | Second recharts series / chart library | Never for v1.5 — product is one «Прогноз» overlay; legend split deferred |
| Extend `list_accounts` + `get_forecast_overlay` | New sidecar MCP package / write tools | Never — PARITY-01 read-only; same handler |
| Integer bigint monthly ÷12 | `decimal.js` / Dinero / finance-js | Only if compound/daily engines enter scope (explicitly OOS) |
| SAVINGS as asset-like NW | Side ledger like income/debts | Wrong — savings **balance** already in NW; only **interest expectation** is overlay |

## What NOT to Use

| Avoid | Why | Use instead |
|-------|-----|-------------|
| `decimal.js`, `big.js`, Dinero, `currency.js` | New money stack fights existing bigint minors; monthly ÷12 is exact with bps | `@/lib/money` + bps Int |
| `Float` / `Number` APR fields in Prisma | Silent drift; breaks money constitution | `annualRateBps Int` |
| Compound / daily accrual libraries | Explicit OOS (simple annual%÷12 only) | One pure helper + Vitest |
| Auto `BalanceSnapshot` on accrual day | Locked OOS — forecast overlay only (SAVISO) | Manual balances stay source of truth |
| New chart package / second dashed Line | Clutters Капитал; legend split deferred | Same `forecast` key + interest slots |
| New MCP packages / mutate tools | Host already shipped; writes deferred | Extend `registerTool` read-only |
| Treating SAVINGS as income side ledger | Balance already capital; would double-count if folded wrong | Asset NW + interest overlay only |
| Storing rate as FX `rateToPrimaryScaled` | Semantic collision with FX LOCF | Dedicated `annualRateBps` |

## Stack Patterns by Variant

**If SAVINGS in primary currency:**
- Interest minor stays native; forecast slot `isPrimaryCurrency: true` — no FX gate

**If SAVINGS in other currency:**
- Same FX LOCF honesty as income slots — missing rate → partial banner / exclude slot (do not invent)

**If write-path account types:**
- Extend Zod write enum: `ASSET | FIAT_CREDIT | SAVINGS` (keep rejecting legacy FIAT_DEBIT/CRYPTO/CASH creates)
- Soft-read: add `SAVINGS` to `AccountTypeSoft` + `isAssetType` (+ `NetWorthAccountType`)

**If MCP surface:**
- Prefer enriching `list_accounts` + `get_forecast_overlay` over a third SIDE tool unless UI gains a dedicated savings page (v1.5 is account-type + overlay — accounts list is enough)
- Description copy must name **SAVISO-01** (twin of INISO/GRISO): interest forecast never folds into historical NW LOCF

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Prisma 7.10.0 SQLite | Enum `SAVINGS` as TEXT + Int columns | Official map Enum→TEXT; enforce allowed values in Client + CHECK for rate/DOM coupling |
| Zod 4.5.4 | mcp-handler / MCP server tool schemas | No bump |
| recharts 3.10.1 | Existing `NetWorthHistoryChart` forecast Line | Interest is data-only change |
| Vitest 4.1.11 | Isolation file-scan tests | Same pattern as `griso.test.ts` |
| Node 24 Docker image | better-sqlite3 native | Unchanged |

## Sources

- Existing wallet `package.json` + `prisma/schema.prisma` + `Account_grace_dom_invariant` migration — **HIGH** (repo)
- `@/lib/nw-forecast.ts`, `NetWorthHistoryChart` dashed «Прогноз», MCP `get_forecast_overlay` — **HIGH** (repo patterns for income/grace overlay)
- Prisma 7 SQLite docs — Enum→TEXT; Client runtime validation; migrate for schema changes — **HIGH** ([prisma.io SQLite connector](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/sqlite))
- Industry money practice: integer minors + basis-point rates; avoid IEEE754 for APR — **MEDIUM** (cross-checked web: Axiom Labs currency guide, DEV accrued-interest bigint examples; classify-confidence websearch --verified → MEDIUM)
- PROJECT.md v1.5 scope: no auto snapshot, no compound engine, PARITY-01 MCP — **HIGH** (product lock)

---
*Stack research for: Wallet v1.5 SAVINGS + interest NW forecast*
*Researched: 2026-09-11*
