# Project Research Summary

**Project:** Wallet v1.5 — Сберегательный счет (SAVINGS + interest NW forecast)
**Domain:** Local snapshot-based net-worth tracker — account-type extension + forecast overlay (ADD to existing app)
**Researched:** 2026-09-11
**Confidence:** HIGH

## Executive Summary

Wallet v1.5 adds a first-class `SAVINGS` account type with annual rate + accrual day-of-month, and folds expected monthly interest (`balance × annual%/12`) into the existing Капитал dashed «Прогноз» overlay — same isolation family as income (INISO) and grace (GRISO). Peers (Monarch, YNAB, Empower) push growth into goals/FIRE charts or rely on bank sync; Wallet’s differentiator is DOM-timed interest on the near-horizon capital stair-step, with manual `BalanceSnapshot` as sole historical truth.

**Recommended approach:** zero new npm packages. Extend Prisma `AccountType` + type-gated `annualRateBps` / `accrualDayOfMonth` (CHECK twin of credit/grace), pure `@/lib/savings-interest.ts`, widen `ForecastSlotKind` with `"interest"` (ΔNW > 0 like income, not grace A′=0), wire shell + MCP membership in lockstep, ship SAVISO isolation twin + PARITY-01 in the same milestone. Rate storage locked as integer bps; money path stays bigint minors via `@/lib/money`.

**Key risks:** (1) treating SAVINGS like a side ledger and excluding principal from NW, (2) auto-writing BalanceSnapshot on accrual, (3) folding interest into historical LOCF, (4) “fixing” ÷12 into compound/APY math, (5) shipping UI without MCP. Mitigate with schema-first asset inclusion, future-only overlay slots, never-call/SAVISO tests, CONTEXT-locked formula, and MCP parity after UI read surfaces exist.

## Key Findings

### Recommended Stack

Reuse the shipped stack entirely — Prisma 7.10 + better-sqlite3, Next.js 16 App Router, Zod 4, Vitest 4, recharts 3, mcp-handler + MCP server 2. **Install step is empty.** Capability = schema + `@/lib/*` + MCP description/tool field updates. Prefer in-repo money/dates/nw-forecast/account-type/MCP loaders over new finance libraries.

**Core technologies:**
- **Prisma 7.10 + SQLite CHECK** — `SAVINGS` enum + rate/DOM columns + `Account_savings_rate_invariant` — same path as credit DOM; Enum→TEXT on SQLite
- **`annualRateBps: Int`** — retail % at 2 decimals without Float or FX `RATE_SCALE_E8` overload
- **`@/lib/money` + bigint ÷12** — monthly interest without decimal.js / Float APR
- **recharts existing dashed «Прогноз»** — interest is data-only; no second chart series (legend split OOS)
- **Vitest isolation twins** — SAVISO mirrors `iniso`/`griso` never-calls
- **Existing MCP host** — enrich `list_accounts` + `get_forecast_overlay`; no new packages/write tools

Details: [STACK.md](./STACK.md)

### Expected Features

v1.5 is a **narrow ADD** on capital/debts/income/grace/MCP already shipped. Table stakes = typed SAVINGS + rate/DOM CRUD, asset NW inclusion, simple monthly interest on accrual DOM, dashed overlay, isolation (no auto-snapshot / no past LOCF rewrite), MCP read parity.

**Must have (table stakes):**
- Distinct `SAVINGS` AccountType (not `isSavings` flag on debit) — type lock + clean filters/MCP
- Annual % + accrual DOM (clamp 1–31) — bank payday mental model
- SAVINGS balances in NW like other assets — capital truth via BalanceSnapshot LOCF
- Expected credit `balance × rate / 12` on future accrual dates only — core math
- Interest on dashed «Прогноз» — user-visible value
- SAVISO isolation — forecast never mutates history
- MCP read parity (account fields + interest forecast events) — PARITY-01

**Should have (competitive):**
- DOM-timed interest on capital chart (peers put growth in goals) — differentiator
- Unified overlay stack: income + grace A′ + interest — one dashed line
- Typed savings metadata discipline (mirror FIAT_CREDIT field invariants)
- Isolation regression suite twin

**Defer (v2+ / anti):**
- Auto BalanceSnapshot, compound/daily/min-balance engines, savings goals, rate history, tax/НДФЛ, MCP writes, legend split by kind, timezone picker

Details: [FEATURES.md](./FEATURES.md)

### Architecture Approach

No new side-ledger tables. SAVINGS is an `Account` (asset in historical NW); interest is a **forecast-only addend** through membership fold → pure `buildNetWorthForecastSeries`. Historical path (`computeNetWorthRows` / `historical-series`) stays accounts-only — import wall. Multi-month overlay uses **flat** today’s LOCF × rate/12 per slot (non-compounding). UI shell and MCP loader must share membership.

**Major components:**
1. **Account + `AccountType.SAVINGS`** — persist rate/DOM + manual balances; SQLite CHECK type-gate
2. **`savings-interest.ts` (NEW pure)** — monthly minor math + accrual DOM slot expansion; no Prisma/NW
3. **`nw-forecast.ts`** — `ForecastSlotKind += "interest"`; ΔNW = +interest; future-only window
4. **DashboardChartsShell + page + load-forecast-overlay** — membership concat with income/grace
5. **MCP `list_accounts` / `get_forecast_overlay`** — PARITY-01 + SAVISO prose
6. **`saviso.test.ts`** — import bans + golden series identity + never-calls

Suggested build order (deps): schema → pure math → forecast kind → CRUD/UI → Капитал wire → SAVISO → MCP → UAT.

Details: [ARCHITECTURE.md](./ARCHITECTURE.md)

### Critical Pitfalls

1. **SAVINGS principal excluded from NW (side-ledger copy-paste)** — extend `isAssetType` / `NetWorthAccountType`; interest only in forecast builder
2. **Auto BalanceSnapshot on accrual** — overlay-only; SAVISO never-calls on snapshot mutates
3. **Interest folded into past LOCF / fact line** — slots only when accrual `> today`; keep series API free of interest fields
4. **Silent compound/APY vs locked ÷12** — CONTEXT + unit tests; ban `Math.pow` on interest path; label «годовой %»
5. **DOM without `clampDayOfMonth`** — reuse `dates.ts`; Feb/leap fixtures
6. **PARITY-01 skip** — MCP fields + interest events + handler/isolation-contract same milestone
7. **Double-count after manual snap** — future-only membership + UX copy that прогноз ≠ снимок

Details: [PITFALLS.md](./PITFALLS.md)

## Implications for Roadmap

Based on research, suggested phase structure for v1.5:

### Phase 1: Schema + soft types + SAVINGS CRUD
**Rationale:** Unblocks everything; prevents Pitfall 1 (principal vs interest layers) before math exists.
**Delivers:** `AccountType.SAVINGS`, `annualRateBps` + `accrualDayOfMonth`, SQLite CHECK invariant, soft-read/`isAssetType`, Zod create/update (ASSET | FIAT_CREDIT | SAVINGS), account UI type-gated forms, NW hero includes savings principal.
**Addresses:** Distinct type, rate/DOM fields, asset NW inclusion, rate+DOM visible on UI, manual BalanceSnapshot path unchanged.
**Avoids:** Flag-on-debit; rate columns unconstrained; SAVINGS missing from soft unions.

### Phase 2: Pure interest math + forecast kind
**Rationale:** Math and overlay semantics must be locked before UI/MCP wire; avoids compound/APY and DOM traps early.
**Delivers:** `@/lib/savings-interest.ts` (bps×balance÷12 truncate policy, clamp DOM series, future-only membership), `ForecastSlotKind: "interest"` with +ΔNW (not grace 0n), unit tests (÷12, Feb-31, grace regression).
**Uses:** `@/lib/money`, `clampDayOfMonth`, existing `nw-forecast` builder — no new packages.
**Implements:** Pure lib + forecast kind extension (Architecture steps 2–3).
**Avoids:** Pitfalls 4, 5, 7 (formula, clamp, membership gate).

### Phase 3: Капитал overlay wire + SAVISO isolation
**Rationale:** User-visible value + trust wall; shell needs kind from Phase 2; isolation same wave as overlay (not polish).
**Delivers:** `page.tsx` + `DashboardChartsShell` concat interest slots with income/grace; FX LOCF honesty parity; `saviso.test.ts` (import bans, golden identity, never-calls BalanceSnapshot); UX copy «только прогноз».
**Addresses:** Dashed «Прогноз» interest points; isolation twin; FX partial banner for non-primary SAVINGS.
**Avoids:** Pitfalls 2, 3, FX invent, grace A′ regression, UI/MCP membership drift (prefer shared assembler if extracting).

### Phase 4: MCP PARITY-01 + verify
**Rationale:** PARITY-01 requires UI read surface first; thin final phase after overlay exists.
**Delivers:** `list_accounts` rate/DOM fields; `get_forecast_overlay` `kind: "interest"` events; handler instructions + isolation-contract SAVISO prose; Nyquist/Orca UAT (overlay visible; historical NW unchanged without new snaps).
**Addresses:** MCP read parity for new surfaces.
**Avoids:** Pitfall 6 (UI without agents); write tools.

### Phase Ordering Rationale

- Schema/CRUD before forecast — principal must sit in NW before interest is an overlay addend.
- Pure math + kind before shell wire — membership needs `interest` semantics and ÷12 lock.
- Overlay + SAVISO together — never-calls must land with the path that could write snapshots.
- MCP last-in-milestone but same release — after UI reads exist; descriptions cite SAVISO alongside INISO/GRISO.
- Grouping mirrors income/grace precedent: type-gated Account fields → pure slot lib → forecast builder → shell/MCP twins → isolation suite.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2:** Principal LOCF policy for interest amount (today-anchor vs as-of accrual date) — FEATURES flags as phase research; ARCHITECTURE defaults today-anchor flat.
- **Phase 2:** Exact truncate/round policy for `balanceMinor × bps / (10000×12)` — STACK sketches truncate toward 0; lock in CONTEXT.
- **Phase 3:** Whether to extract shared `assembleForecastSlots` now or keep duplicated shell/MCP membership (third caller not yet present).

Phases with standard patterns (skip research-phase):
- **Phase 1:** Prisma enum + CHECK RedefineTables + soft-read — twin of credit grace DOM migration.
- **Phase 3 isolation / Phase 4 MCP:** Clone `iniso`/`griso` + existing `load-forecast-overlay` / `isolation-contract` patterns — well documented in-repo.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Repo `package.json` + schema + money/forecast paths verified; industry bps MEDIUM only |
| Features | HIGH | PROJECT.md locks + income/grace code; competitor DOM overlay MEDIUM |
| Architecture | HIGH | Seams verified (shell, MCP loader, CHECK migrations); ecosystem overlay≠history MEDIUM |
| Pitfalls | HIGH | Isolation/integration from shipped twins; APR÷12 vs APY MEDIUM web |

**Overall confidence:** HIGH

### Gaps to Address

- **Interest principal as-of policy:** today LOCF vs as-of each accrual slot — resolve in Phase 2 plan/CONTEXT before coding.
- **Round/truncate policy:** document once in CONTEXT; Vitest golden minors.
- **Overdue accrual UX:** P2 after validation — not in v1.5 launch checklist.
- **Shared membership helper:** extract only if shell/MCP drift appears during Phase 3; optional in plan.
- **Rate ≥0 vs >0:** product lock for zero-rate savings — confirm in discuss/plan if not already locked.

## Sources

### Primary (HIGH confidence)
- Existing wallet `package.json`, `prisma/schema.prisma`, `Account_grace_dom_invariant` migration
- `@/lib/nw-forecast.ts`, `DashboardChartsShell`, MCP `load-forecast-overlay` / `get_forecast_overlay` / `list_accounts`
- `iniso.test.ts`, `griso.test.ts`, `mcp/isolation-contract.test.ts`
- `.planning/PROJECT.md` v1.5 locks (SAVINGS, ÷12, overlay-only, no auto-snapshot, PARITY-01)
- Prisma 7 SQLite connector docs (Enum→TEXT)

### Secondary (MEDIUM confidence)
- Industry integer minors + basis-point APR practice (Axiom / DEV bigint interest examples)
- Monarch Goals compound growth; YNAB/Empower lack DOM capital overlay
- Sber накопительный daily/min-balance engines (why full bank engine is anti-feature)
- Gerald APY monthly ≠ rate÷12 — reinforces do-not-silently-fix locked formula
- NetWorthCast / wealthtrajectory — dated snapshots + separate projection overlays

### Tertiary (LOW confidence)
- None material for roadmap — competitor help pages partially blocked; treated as MEDIUM synthesis only

---
*Research completed: 2026-09-11*
*Ready for roadmap: yes*
