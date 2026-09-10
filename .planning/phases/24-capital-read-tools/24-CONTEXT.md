# Phase 24: Capital Read Tools - Context

**Gathered:** 2026-09-10
**Status:** Ready for planning

<domain>
## Phase Boundary

External agent can read accounts, net worth, balances, and FX via MCP with the same honesty as Капитал UI. Requirements: CAP-01…CAP-04. Side-ledger tools (debts/income/grace/forecast) and full DISOL/INISO/GRISO copy are Phase 25–26. Host + localhost guard already shipped in Phase 23 (`wallet_ping` remains).

</domain>

<decisions>
## Implementation Decisions

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

### Reviewed Todos (closed, not folded)
- **Integrate local AI agent via subprocess** — removed from pending 2026-09-10; completed under `todos/completed/` as superseded by v1.4 Local MCP (not folded into Phase 24 scope; milestone already owns the intent).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — CAP-01…CAP-04; OOS writes/chat; CLI-01 deferred Phase 26
- `.planning/ROADMAP.md` — Phase 24 goal + success criteria
- `.planning/PROJECT.md` — v1.4 Local MCP locks; PARITY-01; no subprocess agent

### Prior phase
- `.planning/phases/23-mcp-host-localhost-safety/23-CONTEXT.md` — host layout, `wallet_ping`, localhost guard, D-07 instructions baseline
- `.planning/phases/23-mcp-host-localhost-safety/23-02-SUMMARY.md` — shipped `createWalletMcpHandler` + route

### Research (milestone)
- `.planning/research/SUMMARY.md` — Phase 2 capital tools deliverable; BigInt serialize; scaffold annotations
- `.planning/research/FEATURES.md` — tool table `list_accounts` / `get_net_worth` / `get_account_balance` / `list_fx_rates`
- `.planning/research/ARCHITECTURE.md` — `lib/mcp/tools/*` + `reads/*` + `serialize.ts`; page-parity assemblers
- `.planning/research/PITFALLS.md` — no twin domain math; no agent conversion; log tool name not payloads

### Existing code
- `src/lib/mcp/create-handler.ts` — register tools here / via `tools/*`
- `src/lib/mcp/tools/wallet-ping.ts` — registerTool pattern (`content` JSON text)
- `src/lib/net-worth.ts` — `computeNetWorthRows` honesty contract
- `src/lib/balances.ts` — `getBalanceAsOf` / LOCF path
- `src/lib/fx.ts` — `getRateAsOf`
- `src/lib/dates.ts` — `calendarDateToday`
- `src/app/page.tsx` — Капитал loader enrichment (name/code on rows)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `computeNetWorthRows` / LOCF maps / `getBalanceAsOf` / `getRateAsOf` — call from thin MCP adapters; do not reimplement
- `calendarDateToday` — single “today” source for default asOf
- MCP register pattern from `wallet-ping.ts` + `createWalletMcpHandler`

### Established Patterns
- Domain money is bigint minor; MCP must stringify for JSON
- Partial FX via `excludeReason` / `isPartial` — CAP-02 honesty
- Phase 23: `src/lib/mcp/*` + thin `src/app/api/mcp/route.ts`; Node runtime

### Integration Points
- Extend `createWalletMcpHandler` to register four CAP tools alongside `wallet_ping`
- Prefer `src/lib/mcp/tools/{accounts,net-worth,balances,fx}.ts` + shared serialize/reads per research
- Do not add debts/income/grace tools (Phase 25); do not widen localhost policy

</code_context>

<specifics>
## Specific Ideas

- User explicit: agents must not perform FX conversion; wallet computes primary amounts.
- Timezone settings todo remains separate; MCP must use the same today helper so settings later apply without tool rewrites.
- Subprocess-agent todo closed as completed/superseded by this milestone — do not re-open as pending.

</specifics>

<deferred>
## Deferred Ideas

- Side-ledger MCP tools + DISOL/INISO/GRISO enforcement in tool outputs — Phase 25
- Full CLI-01 isolation copy + connect docs — Phase 26
- CI mutate-import ban under `src/lib/mcp/**` — optional hardening later (user deferred)
- Savings account type + interest NW forecast — backlog todo (not CAP)
- Timezone selection in settings — pending todo (feeds D-06 later)

</deferred>

---

*Phase: 24-Capital Read Tools*
*Context gathered: 2026-09-10*
