# Phase 28: Interest math + forecast kind - Context

**Gathered:** 2026-09-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Pure monthly interest math + forecast membership for SAVINGS, and `ForecastSlotKind: "interest"` with +ΔNW in `buildNetWorthForecastSeries` (unit-tested). Ready for Phase 29 Капитал/MCP wire.

Does **not** deliver: Dashboard/shell overlay concat, SAVISO suite, FX partial banner UX, MCP tools (Phases 29–30), ASSET↔SAVINGS type conversion (separate future phase), auto BalanceSnapshot, APY/`Math.pow` rate conversion.

</domain>

<decisions>
## Implementation Decisions

### Compound forecast (overrides research “flat today LOCF each month”)
- **D-01:** Forecast shows **monthly** credits on accrual DOM (not daily). User sees **which day** interest arrives and **how much**; NW stair-steps on those credits. — **Reversibility:** costly — membership + chart semantics assume discrete monthly slots.
- **D-02:** **Compound in overlay:** each slot = `(runningPrincipal × annualRateBps) / (12 × 10000)` truncated; after credit, running principal += that interest for the next month. Start principal = **this account’s LOCF balance as of today** only. — **Reversibility:** costly — overrides `.planning/research/SUMMARY.md` “flat non-compounding” default; tests and enumerator must encode growth chain. Per-slot formula remains ÷12 (not APY/`Math.pow`).
- **D-03:** Income/grace overlay amounts **do not** enter the interest principal base. — **Reversibility:** reversible locally.
- **D-04:** Multiple SAVINGS accounts compound **independently**; NW sums their Δ. — **Reversibility:** reversible.

### Rate / calendar / currency inputs
- **D-05:** All future slots in a run use **current** `Account.annualRateBps` + `accrualDayOfMonth` (no rate history in v1.5). — **Reversibility:** costly if rate history added later.
- **D-06:** Interest computed in **account-currency minor**; FX LOCF conversion stays Phase 29 overlay assembly (same pattern as income slots). — **Reversibility:** costly if primary math is inlined early.
- **D-07:** Accrual dates via **reuse** of `nextAccrualAsOf` / `clampDayOfMonth` (one calendar truth with list countdown). Membership is **future-only**: `plannedAsOf > today` (income-style window). — **Reversibility:** costly — SC #2/#4 + `slotInWindow`.

### Rounding & zero membership
- **D-08:** Truncate toward **0**; single division: `(balanceMinor × annualRateBps) / (12 × 10000)`. — **Reversibility:** costly — golden tests lock truncate.
- **D-09:** Compound chain feeds **truncated** interest only (no fractional remainder carry across months).
- **D-10:** Emit a slot **only if** `interestMinor > 0` after truncate. Covers: missing/zero LOCF balance, `annualRateBps === 0`, sub-minor months. No zero-amount calendar placeholders.

### Phase 28 API surface
- **D-11:** Deliver **`src/lib/savings-interest.ts`**: monthly interest helper + compound membership enumerator over `[today, horizon]` (research name sketch: `listInterestSlotsInRange` / equivalent) — pure, no Prisma/NW imports. — **Reversibility:** costly — Phase 29/30 callers depend on this API.
- **D-12:** Extend `ForecastSlotKind` with `"interest"`; `slotInWindow` like income (`> today`); builder ΔNW = **+displayPrimary** (not grace `0n`). Unit-test builder path in Phase 28. **Do not** wire DashboardChartsShell / page / MCP loaders here (Phase 29+). — **Reversibility:** costly — SC #3.
- **D-13:** `ForecastSlot.parentId` for interest = **`accountId`**. Optional `accountId` / `accountName` metadata may mirror grace for later tooltips (Phase 29 discretion).

### Claude's Discretion
- Exact helper/export names inside `savings-interest.ts` (must satisfy D-02, D-07–D-11).
- Whether `savings-accrual-display.ts` re-exports shared calendar bits vs interest importing display helpers — prefer no second calendar implementation.
- Horizon argument shape (caller passes `horizonEnd` like grace membership; Phase 29 supplies preset horizon).
- Micro-details of sorting/stable order when multiple accounts share an accrual date.
- Ban `Math.pow` / APY conversion on interest path in tests (label stays «годовой %» / ÷12).

### Folded Todos
- **Savings account type with interest NW forecast** (`.planning/todos/pending/2026-09-10-savings-account-type-with-interest-nw-forecast.md`) — entire v1.5 milestone (Phases 27–30) closes this todo. Schema/CRUD = 27; this phase = interest math + kind; overlay/SAVISO = 29; MCP = 30. Mark todo **resolved when v1.5 ships** (not mid-phase).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase / milestone scope
- `.planning/ROADMAP.md` — Phase 28 success criteria (INT-01 math + interest kind; future-only)
- `.planning/REQUIREMENTS.md` — INT-01; Out of Scope (auto snapshot, compound *engines* as product feature ≠ this overlay compound chain); map INT-02/03 + SAVISO to Phase 29
- `.planning/PROJECT.md` — v1.5 goal; math `баланс × ставка / 12`; no auto BalanceSnapshot
- `.planning/STATE.md` — current position Phase 28

### Research (CONTEXT overrides flat multi-month policy)
- `.planning/research/SUMMARY.md` — build order; `savings-interest.ts`; kind += interest; **override** “flat today’s LOCF × rate/12 per slot (non-compounding)” with D-02 compound chain
- `.planning/research/ARCHITECTURE.md` — membership fold; `ForecastSlotKind`; import wall; Phase 28 deliverable sketch
- `.planning/research/PITFALLS.md` — principal vs interest layers; no past LOCF rewrite; no silent APY

### Prior phase locks
- `.planning/phases/27-savings-schema-crud/27-CONTEXT.md` — bps, DOM, SAVINGS schema; display-only accrual countdown; interest math deferred here
- `.planning/milestones/v1.2-phases/17-nw-forecast-overlay-isolation/17-CONTEXT.md` — overlay membership, horizon, FX honesty, INISO import wall
- `.planning/milestones/v1.3-phases/19-schema-pure-grace-domain-math/19-CONTEXT.md` — pure domain-math phase pattern
- `.planning/milestones/v1.3-phases/21-kapital-forecast-integration/21-CONTEXT.md` — shell membership concat pattern (Phase 29 analog)

### Code anchors
- `src/lib/nw-forecast.ts` — `ForecastSlotKind`, `slotInWindow`, ΔNW branch (`grace` → 0n; interest → +amount)
- `src/lib/savings-accrual-display.ts` — `nextAccrualAsOf` / countdown (reuse calendar)
- `src/lib/savings-rate.ts` — bps ↔ percent helpers
- `src/lib/dates.ts` — `clampDayOfMonth`, calendar helpers
- `src/lib/money.ts` — bigint minors
- `src/lib/credit-grace.ts` — `openGraceForecastMembership` shape analog
- `src/lib/income.ts` — recurring occurrence / future-only pattern
- `.planning/OPERATOR.md` — agent-driven UAT (later phases)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `nextAccrualAsOf` + `clampDayOfMonth` — accrual date series for membership
- `ForecastSlot` / `buildNetWorthForecastSeries` — extend kind; interest uses income ΔNW path
- `openGraceForecastMembership` — pure membership(today, horizonEnd) analog for interest enumerator
- `parsePercentToBps` / `annualRateBps` — rate already on Account from Phase 27

### Established Patterns
- Pure lib first (Phase 19/13 style): no Prisma, no `net-worth` / `historical-series` imports from interest module
- Import wall: historical NW stays accounts-only; interest only via forecast slots
- Future-only income window (`plannedAsOf > today`); grace differs — interest **matches income**

### Integration Points
- Phase 28: `savings-interest.ts` + `nw-forecast.ts` (+ tests)
- Phase 29: `DashboardChartsShell` / page + MCP `load-forecast-overlay` concat interest slots + SAVISO
- LOCF balance input: caller supplies today’s account LOCF minor (page/MCP in 29; tests inject fixtures in 28)

</code_context>

<specifics>
## Specific Ideas

- User mental model: monthly bank credit day + amount visible; money “stays on account” so next month compounds — forecast must match that, not daily drip.
- Ban silent APY conversion; UI rate remains annual % / ÷12 per month on growing forecast principal.

</specifics>

<deferred>
## Deferred Ideas

- **ASSET ↔ SAVINGS type conversion in account settings** — Phase 31 (ACCT-04). Reopens Phase 27 D-08 type immutability for this pair only. Not Phase 28–30.
- Капитал dashed «Прогноз» wire + FX partial banner + SAVISO — Phase 29
- MCP list_accounts / forecast interest events + PARITY-01 — Phase 30
- Rate history, auto BalanceSnapshot, daily/min-balance engines, legend split by kind — PROJECT / REQUIREMENTS Out of Scope

</deferred>

---

*Phase: 28-Interest math + forecast kind*
*Context gathered: 2026-09-21*
