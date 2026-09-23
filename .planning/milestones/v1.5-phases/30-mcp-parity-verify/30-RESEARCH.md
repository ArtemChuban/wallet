# Phase 30: MCP PARITY + verify - Research

**Researched:** 2026-09-22
**Domain:** In-app Streamable HTTP MCP read tools — SAVINGS catalog fields + forecast interest membership + SAVISO isolation copy
**Confidence:** HIGH (codebase seams + locked CONTEXT); external MCP SDK docs MEDIUM/LOW (annotations advisory only)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### list_accounts SAVINGS fields
- **D-01:** Always emit `annualRateBps`, `accrualDayOfMonth`, and `annualRatePercent` on every row — values for `SAVINGS`, `null` for other types (mirror `creditLimitMinor`). — **Reversibility:** costly — published MCP catalog shape once agents connect.
- **D-02:** `annualRatePercent` is a JSON **number** (e.g. `16.5`, UI major % up to 2 decimals). `annualRateBps` Int remains source of truth.
- **D-03:** No `isSavings` boolean — agents filter with `type === "SAVINGS"`.
- **D-04:** Update `list_accounts` tool description to mention SAVINGS rate / DOM / percent fields.

#### Forecast overlay interest (MCP)
- **D-05:** Wire interest the **same way as UI**: `loadForecastOverlay` loads today LOCF per SAVINGS (as `/` page → `forecastSavings`), calls `listInterestSlotsInRange`, maps to `ForecastSlot` kind `"interest"`, concats with income + grace into `buildNetWorthForecastSeries`. — **Reversibility:** costly — PARITY-01 agents depend on UI-identical membership/amounts.
- **D-06:** Keep horizon default **today + 365** when `horizonEnd` omitted (Phase 25 D-04).
- **D-07:** `forecastEvents` for interest match grace/UI shape: kind, parentId (= accountId), plannedAmountMinor, displayPrimaryMajor, currencyCode, accountId, accountName. Do **not** put rate on the event (`list_accounts` already has it).
- **D-08:** Shared extract vs inline mirror of shell mapping is planner discretion; numbers must match UI.

#### SAVISO + tool / handler copy
- **D-09:** Add **SAVISO-01** to `get_forecast_overlay` description and `create-handler` server instructions alongside INISO/GRISO. — **Reversibility:** costly — published agent-facing instruction surface.
- **D-10:** Use a **triple tag** on the overlay closer: `INISO-01/GRISO-01/SAVISO-01`. Prose: income + interest + grace; overlay must not fold into historical NW LOCF. Drop stale **«A′»** wording (Phase 29 D-11 grace dips the line).
- **D-11:** Extend `isolation-contract.test.ts` to require `SAVISO-01`. Update forecast tests that assert old «A′» / income+grace-only copy.
- **D-12:** Do **not** put SAVISO on `list_accounts`. Do **not** rewrite README connect section (URL-only; no A′ text there). No isolation meta fields in JSON payloads (Phase 25/26 D-06/D-11).

#### Verify bar
- **D-13:** Done bar = **Vitest contracts** + **Orca UAT** (OPERATOR.md). Nyquist via normal validate-phase, not a separate plan for its own sake.
- **D-14:** Orca must show: `list_accounts` SAVINGS fields; `get_forecast_overlay` with `kind: "interest"`; historical NW / BalanceSnapshot count unchanged by forecast reads. Not a full SIDE-tool smoke.
- **D-15:** Vitest seeds its own SAVINGS + LOCF. Orca: if no накопительный, agent creates one via UI then calls MCP.
- **D-16:** Savings todo stays open until **`/gsd-complete-milestone` v1.5** — do not mark resolved mid Phase 30 (same as Phase 29 C-06). Phase 31 conversion is separate.

### Claude's Discretion
- Exact percent helper (reuse `savings-rate` bps↔percent vs inline).
- Whether to extract shared “SAVINGS → interest ForecastSlot[]” helper used by shell + MCP, or duplicate thin mapping in the loader.
- Exact English+RU wording of the triple-tag sentence (must include SAVISO-01 and drop A′).
- How Orca asserts “no new snaps” (DB count, MCP NW series identity, or both).

### Deferred Ideas (OUT OF SCOPE)
- ASSET ↔ SAVINGS type conversion — Phase 31
- Chart legend split by kind — already deferred in REQUIREMENTS.md
- Settings timezone for MCP `today` — separate todo (reviewed, not folded)
- README connect-docs expansion beyond URL — not needed this phase

### Reviewed Todos (not folded)
- **Add timezone selection to settings** (`.planning/todos/pending/2026-09-05-add-timezone-selection-to-settings.md`) — weak match; MCP keeps Europe/Moscow via existing helper until that todo ships.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MCP-01 | Agent can list accounts via MCP including SAVINGS type with annual rate and accrual day-of-month fields | Extend `ListAccountRow` / `serializeListAccountsPayload` / `loadListAccounts` with `annualRateBps`, `accrualDayOfMonth`, `annualRatePercent` (null for non-SAVINGS); update tool description (D-01…D-04) |
| MCP-02 | Agent can get Капитал forecast overlay via MCP including interest events alongside income and grace | Mirror UI: SAVINGS today-LOCF → `listInterestSlotsInRange` → `ForecastSlot` kind `"interest"` → concat into `buildNetWorthForecastSeries` inside `loadForecastOverlay` (D-05…D-08); serialize already allows `"interest"` |
| PARITY-01 | Standing rule upheld — new user-visible savings read surfaces ship matching MCP read tool fields in the same milestone | Phase 29 shipped UI interest overlay; Phase 30 closes MCP catalog + overlay membership + SAVISO copy so agents match UI in same milestone |
</phase_requirements>

## Summary

Phase 30 is a **thin MCP parity close**, not new math. UI already builds interest overlay via `page.tsx` → `forecastSavings` + `DashboardChartsShell` → `listInterestSlotsInRange` → `buildNetWorthForecastSeries`. MCP `serializeForecastPayload` already accepts `kind: "interest"`. Gap: `loadForecastOverlay` only loads income + grace; `list_accounts` omits rate/DOM/percent; tool/handler copy still says «A′» grace and lacks SAVISO-01.

**Primary recommendation:** (1) extend `list_accounts` serialize/load with three nullable rate fields + description; (2) add SAVINGS+LOCF query + shell-identical interest mapping into `loadForecastOverlay` slots concat `[...openSlots, ...interestSlots, ...graceSlots]`; (3) replace A′ copy with `INISO-01/GRISO-01/SAVISO-01` on forecast description + create-handler; (4) Vitest contract updates + Orca UAT for two tools + snap count unchanged — no new npm packages, no new tool names.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| `list_accounts` SAVINGS metadata fields | API / Backend (`src/lib/mcp/tools/accounts.ts`) | — | Catalog serialize/load; Prisma read of account columns |
| Percent display number from bps | API / Backend (`savings-rate` + serialize) | — | Agents get JSON number; bps remains SoT |
| Forecast interest membership | API / Backend (`load-forecast-overlay.ts`) | Database / Storage (BalanceSnapshot LOCF read) | Same membership as `/` page; never writes snaps |
| Interest math / accrual enumeration | API-free pure lib (`savings-interest.ts`) | — | Already shipped Phase 28; MCP only calls it |
| Sparse series + ΔNW signs | API-free pure lib (`nw-forecast.ts`) | — | Shared by shell + MCP; grace dip already shipped Phase 29 |
| Isolation tags (SAVISO-01) | API / Backend (tool description + create-handler instructions) | — | Descriptions/instructions only — never payload meta |
| Vitest contracts | Test runner | — | Source-scan + pure serialize fixtures |
| Live MCP + UI seed for Orca | Frontend Server (`npm run dev` `/api/mcp`) + Browser (Orca) | — | OPERATOR.md agent-driven UAT |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@modelcontextprotocol/server` | 2.0.0 (locked in tree) | `McpServer` / `registerTool` / `createMcpHandler` | Existing wallet MCP host [VERIFIED: package.json via `npm ls`] |
| `zod` | 4.5.4 | Tool `inputSchema` (unchanged horizon schema) | Existing CAP/SIDE pattern [VERIFIED: `npm ls`] |
| `vitest` | 4.1.11 | Contract + serialize tests | `vitest.config.ts` include `src/**/*.test.ts` [VERIFIED: vitest.config.ts:4-7] |
| Prisma + SQLite | 7.10.0 | Account rate columns + BalanceSnapshot LOCF reads | Schema already has `annualRateBps` / `accrualDayOfMonth` [VERIFIED: prisma/schema.prisma:110-114] |
| Next.js App Router | 16.3.4 | `/api/mcp` route | Existing host [VERIFIED: package.json] |

### Supporting (in-repo — do not reimplement)

| Module | Purpose | When to Use |
|--------|---------|-------------|
| `@/lib/savings-interest` `listInterestSlotsInRange` | Enumerate interest slots from today LOCF | MCP loader + shell |
| `@/lib/savings-rate` `formatBpsToPercentMajor` | bps → percent major string scale 2 | Prefer + `Number(...)` for D-02 JSON number |
| `@/lib/locf` `firstHitLocfMap` | Today LOCF per account | Same as `page.tsx` / `loadNetWorthAsOf` |
| `@/lib/nw-forecast` `buildNetWorthForecastSeries` | Sparse overlay series | Already called by loader |
| `@/lib/dates` `calendarDateToday` / `addCalendarDays` | MCP today + default horizon | Keep Europe/Moscow |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Extend existing `list_accounts` / `get_forecast_overlay` | New MCP tool names | **Forbidden** by phase boundary |
| `Number(formatBpsToPercentMajor(bps))` | Inline `bps/100` | Prefer helper for scale-2 consistency with UI |
| Shared interest→ForecastSlot helper | Duplicate map in loader | Discretion (D-08); extract lowers drift risk |
| Payload `isolation: true` meta | Description tags only | **Forbidden** D-12 / Phase 25-26 |

**Installation:** none — no new packages.

**Version verification:** `@modelcontextprotocol/server@2.0.0`, `vitest@4.1.11`, `zod@4.5.4` via `npm ls` this session.

## Package Legitimacy Audit

> Phase installs **no new external packages**. Existing MCP/Vitest/zod already in tree.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| — | — | — | — | — | N/A | No install |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
Agent (CLI / Orca MCP client)
    │  Streamable HTTP POST
    ▼
/api/mcp ── localhost-guard ── createWalletMcpHandler
    │
    ├─ list_accounts
    │     └─ loadListAccounts → prisma.account (+ currency)
    │           └─ serializeListAccountsPayload
    │                 ├─ existing: id,name,type,currency*,creditLimitMinor,isCredit
    │                 └─ NEW: annualRateBps | null, accrualDayOfMonth | null, annualRatePercent | null
    │
    └─ get_forecast_overlay
          ├─ today = calendarDateToday("Europe/Moscow")
          ├─ horizonEnd = arg ?? today+365
          └─ loadForecastOverlay({ today, horizonEnd })
                ├─ loadNetWorthAsOf(today)          → anchor (accounts-only)
                ├─ income membership (existing)
                ├─ grace membership (existing)
                ├─ NEW: SAVINGS accounts + balanceSnapshot LOCF ≤ today
                │         → listInterestSlotsInRange
                │         → ForecastSlot kind "interest"
                ├─ buildNetWorthForecastSeries({
                │     slots: [...openSlots, ...interestSlots, ...graceSlots]
                │   })
                └─ serializeForecastPayload  (already supports kind "interest")
```

### Recommended Project Structure (touch list)

```
src/lib/mcp/tools/accounts.ts              # ListAccount* types + serialize + description
src/lib/mcp/tools/accounts.test.ts         # SAVINGS field asserts + key set
src/lib/mcp/reads/load-forecast-overlay.ts # interest membership + LOCF query
src/lib/mcp/tools/forecast.ts              # GET_FORECAST_OVERLAY_DESCRIPTION triple tag
src/lib/mcp/tools/forecast.test.ts         # interest events + drop A′ asserts
src/lib/mcp/create-handler.ts              # instructions SAVISO-01 / drop A′
src/lib/mcp/isolation-contract.test.ts     # require SAVISO-01
# optional (discretion):
src/lib/savings-interest.ts OR shared mapper  # extract shell+MCP map if chosen
src/components/dashboard/DashboardChartsShell.tsx  # only if extracting shared helper
```

### Pattern 1: Nullable catalog fields (mirror creditLimitMinor)

**What:** Always emit keys; null for non-applicable types.
**When to use:** MCP-01 rate fields.
**Example (target shape):**

```typescript
// Pattern source: existing ListAccountRow creditLimitMinor [VERIFIED: src/lib/mcp/tools/accounts.ts:16-24]
// Quote: creditLimitMinor: string | null; isCredit: boolean;
// Add (D-01/D-02):
// annualRateBps: number | null;
// accrualDayOfMonth: number | null;
// annualRatePercent: number | null; // Number(formatBpsToPercentMajor(bps)) for SAVINGS
```

### Pattern 2: UI-identical interest membership

**What:** Copy shell mapping after LOCF assembly matching `page.tsx` filter.
**When to use:** MCP-02 inside `loadForecastOverlay`.

UI filter + LOCF [VERIFIED: src/app/page.tsx:314-334]:

```typescript
// Quote from page.tsx forecastSavings assembly:
// a.type === "SAVINGS" &&
// a.annualRateBps != null &&
// a.accrualDayOfMonth != null
// balanceMinor: (locf?.amountMinor ?? 0n).toString()
```

Shell map [VERIFIED: src/components/dashboard/DashboardChartsShell.tsx:385-413]:

```typescript
// Quote:
// kind: "interest" as const,
// parentId: s.parentId,
// plannedAsOf: s.plannedAsOf,
// plannedAmountMinor: s.interestMinor,
// slots: [...openSlots, ...interestSlots, ...graceSlots],
```

Loader today [VERIFIED: src/lib/mcp/reads/load-forecast-overlay.ts:322-329]:

```typescript
// Quote:
// const built = buildNetWorthForecastSeries({
//   anchorPrimaryMinor,
//   slots: [...openSlots, ...graceSlots],
```

**Must become** `[...openSlots, ...interestSlots, ...graceSlots]` with interestSlots from enumerator.

### Pattern 3: Isolation in descriptions only

**What:** Named tags in tool description + server instructions; payload remains free of isolation meta.
**When to use:** SAVISO-01 (D-09…D-12).

Current stale closer [VERIFIED: src/lib/mcp/tools/forecast.ts:11-15]:

```typescript
// Quote:
// "Read Капитал forecast overlay / Прогноз: sparse points[] with income + A′ grace forecastEvents. " +
// "INISO-01/GRISO-01: Капитал forecast overlay (Прогноз) is income + A′ grace — do not fold into historical NW LOCF.";
```

**Recommended draft (discretion — must include SAVISO-01, drop A′):**

```text
Read Капитал forecast overlay / Прогноз: sparse points[] with income + interest + grace forecastEvents.
Optional horizonEnd (YYYY-MM-DD); omit defaults to today+365 (same as UI 1y/all).
UI presets 30d/90d/1y are how to pick a date — not tool params.
INISO-01/GRISO-01/SAVISO-01: Капитал forecast overlay (Прогноз) is income + interest + grace — do not fold into historical NW LOCF.
```

Mirror the triple-tag sentence in `create-handler.ts` instructions (replace A′ lines).

### Anti-Patterns to Avoid

- **New tool names / isSavings boolean** — locked out (D-03, phase boundary).
- **Rate on forecastEvents** — agents use `list_accounts` (D-07).
- **SAVISO on list_accounts or README rewrite** — D-12.
- **Payload isolation meta** — D-12.
- **Hand-rolling interest math** — use `listInterestSlotsInRange`.
- **Assuming grace forecastPrimaryMinor is flat** — Phase 29 already dipped grace [CITED: 29-RESEARCH.md Pitfall 4].
- **Resolving savings todo mid-phase** — D-16.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Monthly interest / accrual days | Custom loop in MCP | `listInterestSlotsInRange` | Compound chain + DOM clamp already tested |
| Percent major from bps | Ad-hoc `/100` | `formatBpsToPercentMajor` then `Number` | Scale-2 UI parity |
| Today LOCF map | Ad-hoc reduce | `firstHitLocfMap` + snapshots `asOfDate <= today` | Same as page / NW loader |
| Horizon default | Hardcoded date | `resolveForecastHorizonEnd` | Already D-04 |
| Isolation enforcement | Payload flags | Description + source-scan tests | Phase 25/26 contract |

**Key insight:** Phase 30 is glue + copy + tests. Domain math and serialize path for `"interest"` already exist.

## Common Pitfalls

### Pitfall 1: annualRatePercent type mismatch
**What goes wrong:** Emit string `"16.50"` from `formatBpsToPercentMajor` instead of JSON number.
**Why it happens:** Helper returns string [VERIFIED: src/lib/savings-rate.ts:22-25] quote: `export function formatBpsToPercentMajor(bps: number): string`.
**How to avoid:** `annualRatePercent: a.annualRateBps == null ? null : Number(formatBpsToPercentMajor(a.annualRateBps))` (D-02). Assert `typeof === "number"` in Vitest.
**Warning signs:** Agents parse percent as string; catalog schema drift.

### Pitfall 2: Interest concat order / membership drift vs UI
**What goes wrong:** MCP amounts or event days differ from dashed Прогноз.
**Why it happens:** Different LOCF (omit 0 default), wrong filter, or concat order `{income,grace,interest}` vs shell `{income,interest,grace}`.
**How to avoid:** Same filter as page; same map as shell; prefer shared helper (discretion) or golden fixture shared with shell expectations.
**Warning signs:** Orca UI tooltip interest ≠ MCP `plannedAmountMinor`.

### Pitfall 3: Leaving A′ in create-handler while fixing forecast.ts
**What goes wrong:** Isolation-contract / agents still learn “neutral grace”.
**Why it happens:** Copy duplicated in two files [VERIFIED: create-handler.ts:31-32 has A′].
**How to avoid:** Update both; isolation-contract requires `SAVISO-01`; forecast.test drops A′ asserts.
**Warning signs:** `rg "A′" src/lib/mcp` still hits.

### Pitfall 4: Vitest “seed” misread as Prisma DB fixture
**What goes wrong:** Plan invents DB harness; existing MCP tests are SQLite-free.
**Why it happens:** D-15 wording “seeds its own SAVINGS + LOCF”.
**How to avoid:** Interpret as **fixture** `InterestAccountInput.balanceMinor` / serialize inputs simulating LOCF; source-scan proves loader calls enumerator. Live LOCF = Orca (D-15).
**Warning signs:** New SQLite test DB only for this phase.

### Pitfall 5: Forecast read creates BalanceSnapshot
**What goes wrong:** SAVISO violated.
**Why it happens:** Accidental mutate import.
**How to avoid:** Keep never-write source scans on forecast MCP files; Orca snap count before/after `get_forecast_overlay`.
**Warning signs:** Snapshot count increases after overlay-only session.

### Pitfall 6: Marking savings todo complete
**What goes wrong:** Premature milestone closure (D-16).
**How to avoid:** Leave pending todo until `/gsd-complete-milestone` v1.5.

## Code Examples

### list_accounts serialize extension (target)

```typescript
// Build on [VERIFIED: src/lib/mcp/tools/accounts.ts:33-46]
// After creditLimitMinor / isCredit, always set:
annualRateBps: a.type === "SAVINGS" ? a.annualRateBps : null,
accrualDayOfMonth: a.type === "SAVINGS" ? a.accrualDayOfMonth : null,
annualRatePercent:
  a.type === "SAVINGS" && a.annualRateBps != null
    ? Number(formatBpsToPercentMajor(a.annualRateBps))
    : null,
```

Prisma already returns columns; `loadListAccounts` must pass them into `ListAccountInput` (extend input type).

### Interest events via existing serialize

`SerializedForecastEvent.kind` already includes `"interest"` [VERIFIED: src/lib/mcp/reads/load-forecast-overlay.ts:31-39]:

```typescript
// Quote:
// kind: "income" | "grace" | "interest";
// parentId: number;
// plannedAmountMinor: string;
// displayPrimaryMajor: number;
// currencyCode: string;
// accountId?: number;
// accountName?: string;
```

No serialize change required if builder receives interest slots.

### Isolation-contract extension

```typescript
// Extend [VERIFIED: src/lib/mcp/isolation-contract.test.ts:61-64]
// Quote today:
// expect(src).toMatch(/DISOL-01/);
// expect(src).toMatch(/INISO-01/);
// expect(src).toMatch(/GRISO-01/);
// Add: expect(src).toMatch(/SAVISO-01/);
```

Also assert `GET_FORECAST_OVERLAY_DESCRIPTION` and create-handler lack `A′`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Forecast MCP = income + A′ grace only | Income + interest + grace; grace dips NW | Phase 29 builder; Phase 30 MCP membership+copy | Agents see full Прогноз |
| Isolation tags DISOL/INISO/GRISO | + SAVISO-01 on overlay | Phase 30 | Triple tag |
| list_accounts metadata without rates | + rate/DOM/percent nullables | Phase 30 | MCP-01 |

**Deprecated/outdated:**
- «A′» grace wording in MCP descriptions — remove this phase (D-10).
- Assumption that MCP forecast numbers are still grace-flat — already false since Phase 29.

## Discretion Recommendations

| Topic | Recommendation | Rationale |
|-------|----------------|-----------|
| Percent helper | Reuse `formatBpsToPercentMajor` + `Number` | Matches UI scale-2; avoids inline drift |
| Shared interest mapper | **Extract** thin `toInterestForecastSlots(accounts, today, horizonEnd)` used by shell + MCP | D-08 numbers-must-match; single map site |
| Triple-tag prose | Draft above (income + interest + grace; no A′) | Satisfies D-09/D-10 |
| Orca “no new snaps” | **Both:** `BalanceSnapshot` count before/after overlay call **and** spot-check `get_net_worth` unchanged | Cheap; catches write + accidental NW mutate |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Orca/agent can invoke MCP tools against live `/api/mcp` (initialize + tools/call) without new transport work | Environment / Verify | Planner may need explicit curl/JSON-RPC steps in UAT plan |
| A2 | D-15 “Vitest seeds” means fixture LOCF minors, not Prisma seed harness | Pitfalls / Validation | Overbuilt Wave 0 DB test infra |
| A3 | `Number("16.50") === 16.5` is acceptable JSON shape for D-02 | Standard Stack | Strict 2-decimal number display unlikely for JSON number |

**If empty besides A\*:** Core implementation claims are file-verified.

## Open Questions (RESOLVED)

1. **Shared helper location**
   - What we know: Shell map is inline in `DashboardChartsShell`; MCP needs same map (D-05/D-08).
   - What's unclear: Prefer `savings-interest.ts` vs `mcp/reads/` vs leave duplicated.
   - Recommendation: Extract next to enumerator (`savings-interest.ts` or sibling) so shell + MCP import one function.
   - **RESOLVED:** Inline mirror in `load-forecast-overlay` (D-08 / `30-01` tracer action). No shell extract unless executor later needs it for DRY; numbers must still match UI.

2. **Integration vs pure Vitest for loader membership**
   - What we know: All current MCP tool tests are SQLite-free.
   - What's unclear: Whether planner wants a thin source-scan that `load-forecast-overlay.ts` contains `listInterestSlotsInRange` + pure slot→serialize test only.
   - Recommendation: Pure + source-scan; Orca for live DB.
   - **RESOLVED:** SQLite-free fixtures + source-scan for `listInterestSlotsInRange` in loader (`30-01`); live membership / BalanceSnapshot snap count via Orca UAT (`30-02`).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vitest / Next | ✓ | v24.5.0 | — |
| npm | scripts | ✓ | 10.9.3 | — |
| `npm run test` / vitest | D-13 contracts | ✓ | 4.1.11 | — |
| `npm run dev` :3000 | Orca UAT | ✓ (run at verify) | Next 16.3.4 | — |
| `orca-ide` | OPERATOR UAT | ✓ | on PATH | — |
| codegraph | research (done) | ✓ | indexed | — |
| New npm packages | — | N/A | — | none needed |

**Missing dependencies with no fallback:** none

**Missing dependencies with fallback:** none

Step 2.6: external tools identified and probed — no blockers.

## Validation Architecture

> `workflow.nyquist_validation: true` in `.planning/config.json`.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.1.11 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run src/lib/mcp/tools/accounts.test.ts src/lib/mcp/tools/forecast.test.ts src/lib/mcp/isolation-contract.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MCP-01 | SAVINGS rows emit rate/DOM/percent; others null; keys always present | unit | `npx vitest run src/lib/mcp/tools/accounts.test.ts` | ✅ extend |
| MCP-01 | Tool description mentions SAVINGS rate/DOM/percent | unit (string/source) | same file or isolation-adjacent | ❌ Wave 0 assert |
| MCP-02 | Serialized points include `kind: "interest"` events with accountName / plannedAmountMinor | unit | `npx vitest run src/lib/mcp/tools/forecast.test.ts` | ✅ extend (add interest slot fixture) |
| MCP-02 | Loader wires enumerator (source contains `listInterestSlotsInRange`) | unit source-scan | forecast.test or isolation | ❌ Wave 0 |
| MCP-02 / SAVISO | Description + create-handler have SAVISO-01; no A′ | unit | `npx vitest run src/lib/mcp/isolation-contract.test.ts src/lib/mcp/tools/forecast.test.ts` | ✅ extend |
| PARITY-01 | No new tool names; same surfaces as UI fields | review + tests | catalog keys vs UI | manual/plan check |
| SAVISO live | Forecast read does not increase BalanceSnapshot count | Orca UAT | manual per OPERATOR.md | ❌ UAT Wave |

### Sampling Rate

- **Per task commit:** quick MCP trio above
- **Per wave merge:** `npm test`
- **Phase gate:** full suite green + Orca UAT before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] Extend `accounts.test.ts` — SAVINGS field matrix + updated `Object.keys` allow-list
- [ ] Extend `forecast.test.ts` — interest event kind; drop A′ / income+grace-only description expects; optional source-scan for `listInterestSlotsInRange` in loader
- [ ] Extend `isolation-contract.test.ts` — `SAVISO-01` required in create-handler
- [ ] UAT file at verify time — list_accounts fields, interest events, snap count (not Wave 0 code)

None — framework already present; gaps are test **extensions**, not new harness install.

## Security Domain

> `security_enforcement` enabled (ASVS level 1).

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Local single-user; localhost MCP guard only |
| V3 Session Management | no | Stateless MCP (`legacy: "stateless"`) |
| V4 Access Control | yes | `withLocalhostGuard` on `/api/mcp` — unchanged |
| V5 Input Validation | yes | Existing zod `horizonEnd` schema — unchanged |
| V6 Cryptography | no | No new crypto |

### Known Threat Patterns for wallet MCP reads

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Agent treats annotations as enforcement | Elevation | `readOnlyHint` advisory only [CITED: ts.sdk.modelcontextprotocol.io/v2/servers/tools]; keep never-write source scans |
| Forecast/interest path writes BalanceSnapshot | Tampering | Source-scan + Orca count; SAVISO-01 copy |
| Catalog leaks unexpected PII fields | Information Disclosure | Metadata-only list_accounts; no live balances |
| Non-loopback MCP access | Spoofing | Existing localhost Host/Origin guard |

## Project Constraints (from .cursor/rules/ + AGENTS.md)

- **No `.cursor/rules/` directory** in this repo (verified empty/absent).
- **AGENTS.md PARITY-01:** Any new user-visible read surface must ship matching read-only MCP tool(s) in the same milestone/phase.
- **AGENTS.md OPERATOR:** Before `/gsd-verify-work` / UAT read `.planning/OPERATOR.md`; agent drives `npm run dev` + Orca; ask human only for subjective / hard blockers.
- **Next.js:** Read `node_modules/next/dist/docs/` before novel Next APIs (this phase should not need new Next APIs).

## Sources

### Primary (HIGH confidence)

- `src/lib/mcp/tools/accounts.ts` — ListAccountRow / serialize / description
- `src/lib/mcp/reads/load-forecast-overlay.ts` — loader membership gap; serialize interest kind
- `src/lib/mcp/tools/forecast.ts` — A′ description
- `src/lib/mcp/create-handler.ts` — instructions A′ / missing SAVISO
- `src/lib/mcp/isolation-contract.test.ts` — INISO/GRISO asserts
- `src/components/dashboard/DashboardChartsShell.tsx:385-413` — interest slot map + concat order
- `src/app/page.tsx:314-334` — forecastSavings LOCF assembly
- `src/lib/savings-interest.ts:18-49` — InterestAccountInput / listInterestSlotsInRange
- `src/lib/savings-rate.ts:22-25` — formatBpsToPercentMajor returns string
- `prisma/schema.prisma:110-114` — annualRateBps / accrualDayOfMonth
- `.planning/phases/30-mcp-parity-verify/30-CONTEXT.md` — locked decisions
- codegraph explore/callers for `listInterestSlotsInRange` / `loadForecastOverlay`

### Secondary (MEDIUM confidence)

- Phase 29 RESEARCH — MCP blast radius / A′ lag pitfall
- MCP TypeScript SDK tools docs — annotations advisory [CITED: https://ts.sdk.modelcontextprotocol.io/v2/servers/tools]
- MCP spec tools annotations [CITED: https://modelcontextprotocol.io/specification/2025-06-18/server/tools]

### Tertiary (LOW confidence)

- WebSearch digest on registerTool annotations (training/community blogs mixed) — do not drive design beyond “hints are advisory”

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — reuse pinned in-tree packages; no installs
- Architecture: HIGH — call chains read from page, shell, loader, serialize
- Pitfalls: HIGH — A′ lag and membership drift confirmed in current sources

**Research date:** 2026-09-22
**Valid until:** 2026-10-22 (stable in-repo MCP surface; re-check if MCP SDK major bumps)
