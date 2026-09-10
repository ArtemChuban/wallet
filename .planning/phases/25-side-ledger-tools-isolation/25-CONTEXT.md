# Phase 25: Side-Ledger Tools + Isolation - Context

**Gathered:** 2026-09-10
**Status:** Ready for planning

<domain>
## Phase Boundary

External agent can read Долги / Доходы / Грейс / Капитал forecast overlay via MCP without folding side ledgers into historical NW. Requirements: SIDE-01…SIDE-04. Isolation locks DISOL/INISO/GRISO enforced by adapters + tests. Full CLI-01 isolation prose and connect docs remain Phase 26. Capital tools from Phase 24 stay.

</domain>

<decisions>
## Implementation Decisions

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

### Reviewed Todos
- **Savings account type with interest NW forecast** — reviewed, not folded (backlog; not SIDE / v1.4 MCP).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — SIDE-01…SIDE-04; CLI-01 deferred Phase 26; anti-folding debts/income/grace into historical NW
- `.planning/ROADMAP.md` — Phase 25 goal + success criteria
- `.planning/PROJECT.md` — side ledgers; DISOL/INISO/GRISO; v1.4 Local MCP

### Prior phases
- `.planning/phases/24-capital-read-tools/24-CONTEXT.md` — CAP tool patterns, money serialize, asOf/today, readOnlyHint, D-16 no CI-ban
- `.planning/phases/23-mcp-host-localhost-safety/23-CONTEXT.md` — host layout, `wallet_ping`, localhost guard

### Research (milestone)
- `.planning/research/FEATURES.md` — `list_debts` / `list_income` / `list_grace_obligations` / `get_forecast_overlay`
- `.planning/research/ARCHITECTURE.md` — thin MCP adapters; DISOL/INISO/GRISO read-path rules
- `.planning/research/PITFALLS.md` — no twin domain math; MCP fixture isolation asserts
- `.planning/research/SUMMARY.md` — Phase 3 side-ledger deliverable notes

### Existing code
- `src/lib/mcp/create-handler.ts` — register new SIDE tools; refresh instructions
- `src/lib/mcp/tools/*.ts` — CAP registerTool pattern
- `src/lib/mcp/serialize.ts` — string minors + scale
- `src/lib/debts.ts` — remaining / `computeDebtPrimaryTotals`
- `src/lib/income.ts` — `listAllInRange` / overdue helpers
- `src/lib/credit-grace.ts` — `mergeGraceListRows` / `openGraceForecastMembership`
- `src/lib/nw-forecast.ts` — `buildNetWorthForecastSeries` / `forecastHorizonEnd`
- `src/lib/disol.test.ts` / `src/lib/iniso.test.ts` / `src/lib/griso.test.ts` — isolation twins to extend/reuse
- `src/app/page.tsx` — Капитал forecast loader (OPEN grace, income window) for parity

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- CAP MCP tools + `serialize.ts` / `as-of.ts` / `reads/*` — copy patterns for SIDE adapters
- `buildNetWorthForecastSeries` — forecast tool core (do not reimplement)
- Debt/income/grace domain libs + existing disol/iniso/griso tests

### Established Patterns
- Register in `createWalletMcpHandler`; tools under `src/lib/mcp/tools/`
- Money JSON: string minors + `scale`; English descriptions + RU aliases
- `readOnlyHint: true` already on CAP — apply to SIDE tools

### Integration Points
- Extend handler instructions past “side ledgers come later”
- SIDE-04 wraps forecast series; list tools wrap page-parity loaders
- Do not change localhost guard, Compose publish, or add write tools
- Phase 26 owns full isolation named copy + connect docs

</code_context>

<specifics>
## Specific Ideas

- User locked forecast as Капитал-parity sparse series with free `horizonEnd` and 1y default — agents should not invent overlay math.
- Isolation is proven by tests + short description copy, not by payload meta fields or CI bans.

</specifics>

<deferred>
## Deferred Ideas

- Full named DISOL/INISO/GRISO isolation prose + connect docs — Phase 26 (CLI-01/02)
- CI mutate-import ban under `src/lib/mcp/**` — optional later hardening
- Savings account type + interest NW forecast — backlog todo (not this phase)

### Reviewed Todos (not folded)
- **Savings account type with interest NW forecast** (`.planning/todos/pending/2026-09-10-savings-account-type-with-interest-nw-forecast.md`) — out of SIDE scope; remains backlog

</deferred>

---

*Phase: 25-Side-Ledger Tools + Isolation*
*Context gathered: 2026-09-10*
