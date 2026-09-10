# Feature Research

**Domain:** In-app read-only MCP host for local personal-finance apps (Wallet v1.4)
**Researched:** 2026-09-10
**Confidence:** HIGH (PROJECT.md locks + Wallet domain libs); MEDIUM (ecosystem peers + client transport quirks)

**Scope:** MCP host capabilities only — tool surface, connect docs, localhost HTTP/SSE. Do **not** re-list accounts/balances/FX/debts/income/grace product features (already shipped v1.0–v1.3); they appear only as **tool dependencies**.

## How local finance MCP usually works

Peers (Beancount / GnuCash / Firefly MCP):

1. **Process model** — most ship **stdio**: client spawns a sidecar that opens the ledger file / talks to an API. HTTP used when the data plane is already a long-lived service (Firefly HTTP+OAuth).
2. **Read surface** — small set of typed tools: list accounts, balances / net worth as-of, optional income statement, filtered transactions / BQL. Explicit **read-only** (file `mode=ro`, no write tools, path not in tool args).
3. **Safety** — no shell; isolate data path via env; annotate `readOnlyHint: true`; bound result size.
4. **Primitives** — **tools** are what agents actually call; resources/prompts optional polish.

**Wallet lock (differs from peer default):** data lives in the **already-running** Next.js + SQLite Docker app on `127.0.0.1:3000`. MCP is **in-process HTTP/SSE**, not a stdio sidecar and not an app-spawned agent. External Claude Code / Cursor CLI connect **to** the wallet; wallet does not spawn them.

## Feature Landscape

### Table Stakes (Users / agents expect these)

Missing any of these → MCP host feels broken for v1.4.

| Feature | Why Expected | Complexity | Notes / Wallet deps |
|---------|--------------|------------|---------------------|
| In-app MCP endpoint on same Next lifecycle | Peers that are “always-on apps” expose HTTP; PROJECT: same process as wallet | MEDIUM–HIGH | Route under app (e.g. `/mcp`); live with `npm run dev` / Docker; reuse Prisma/`src/lib/*` |
| Streamable HTTP (+ SSE response capability) | Spec default for network MCP (2025-03-26+); clients POST JSON-RPC, accept JSON or SSE | MEDIUM | Prefer Streamable HTTP over deprecated dual-endpoint HTTP+SSE; keep SSE answers when client asks |
| Bind localhost only (`127.0.0.1`) | Spec SHOULD; Docker already maps `127.0.0.1:3000:3000` | LOW | Never publish `0.0.0.0` for MCP; DNS-rebinding Host/Origin checks |
| Read-only tools covering all shipped domains | Finance MCP peers always expose capital + side ledgers agents ask about | MEDIUM | Thin wrappers over existing libs — see tool map below |
| `list_accounts` (or equiv.) | Every peer starts here | LOW | Account + currency metadata; types already in schema |
| `get_balances` / `get_net_worth` as-of date | Table-stakes “how rich am I?” | LOW–MEDIUM | Deps: `getBalanceAsOf` / LOCF Maps + `computeNetWorthRows`; return `isPartial` honesty |
| `list_fx_rates` / rate-as-of | Wallet FX is manual dated; agents need conversion context | LOW | Dep: `getRateAsOf` / FX Maps; primary↔other only |
| `list_debts` + primary totals | Parallel ledger; agents will ask “кому должен” | LOW–MEDIUM | Deps: `remainingMinor*`, `computeDebtPrimaryTotals`; **never fold into NW** (DISOL-01) |
| `list_income` / planned vs actual / overdue | Side ledger + forecast questions | MEDIUM | Deps: `listAllInRange`, `isIncomeOverdue`; actual ≠ BalanceSnapshot (INISO-01) |
| `list_grace` / open obligations | v1.3 domain; “что платить по грейсу” | MEDIUM | Deps: `mergeGraceListRows`, `openGraceForecastMembership`; GRISO-01 |
| Tool annotations `readOnlyHint: true` | Clients use hints for auto-approve UX; defaults assume destructive | LOW | Also `openWorldHint: false` (closed local DB); annotations ≠ security |
| Server instructions / tool descriptions with isolation rules | Agents invent NW from debts/income without explicit DISOL/INISO/GRISO copy | LOW | Document in MCP `instructions` + each tool description |
| Connect docs: Claude Code + Cursor CLI → localhost URL | PROJECT Active requirement; HTTP clients need copy-paste config | LOW–MEDIUM | Claude: `type: "http"` + `url`; Cursor: `url` in `mcp.json`; note “app must already be running” |
| Health / “MCP up” discoverability | Operators need to know endpoint before wiring clients | LOW | Reuse `/api/health` pattern; docs state exact path + port |

#### Suggested v1.4 tool map (names illustrative)

| Tool | Returns | Depends on (existing) |
|------|---------|------------------------|
| `list_accounts` | accounts + types + currencies | Prisma account/currency reads |
| `get_net_worth` | rows + `totalPrimaryMinor` + `isPartial` as-of | `computeNetWorthRows`, balance+FX LOCF |
| `get_account_balance` | native + primary as-of | `getBalanceAsOf` / batch Maps |
| `list_fx_rates` | dated primary↔other rates | FX tables / `getRateAsOf` |
| `list_debts` | people/debts + remaining + status | `debts.ts` remaining/status |
| `get_debt_totals` | I-owe / they-owe primary + partial | `computeDebtPrimaryTotals` |
| `list_income` | plans/facts in range + overdue flags | `income.ts` occurrence helpers |
| `list_grace_obligations` | open/closed cycles + due + overdue | `credit-grace.ts` |
| `get_forecast_overlay` *(optional P1 if thin)* | income + grace points on horizon | `buildNetWorthForecastSeries`, grace membership |

Keep count **small (~6–10)** — peers that stay usable stay narrow; Firefly-style 140-tool dumps are anti-pattern for Wallet.

### Differentiators (Advantage for *this* app)

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| In-process host (no stdio sidecar, no ledger-file path) | One Docker process = UI + tools; no second SQLite opener / no `BEANCOUNT_FILE` env dance | MEDIUM | Aligns with “CLI stays external” decision |
| Domain-honest tool contracts | Agents get DISOL/INISO/GRISO baked into schemas (debts≠NW; income/grace≠historical LOCF) | LOW–MEDIUM | Rare vs Beancount “one ledger = truth” |
| Forecast overlay tool (income + A′ grace) | Answers “what happens to NW next?” without inventing BalanceSnapshots | MEDIUM | Dep: `nw-forecast.ts` + grace membership; dashed «Прогноз» parity |
| Dual-client connect guide with transport reality | Claude Code HTTP + Cursor URL/SSE quirks documented up front | LOW | Cursor CLI has reported SSE POST 405 — prefer Streamable `/mcp`; document `mcp-remote` stdio bridge as fallback only |
| Partial-FX / exclude reasons in tool JSON | Same honesty as UI banners — agents don’t invent rates | LOW | Mirror `isPartial` / exclude fields from NW + debt totals |
| Russian-aware field labels in descriptions (optional) | Matches Russian-first product vocabulary agents see in UI | LOW | Descriptions can bilingual; response keys stay stable English identifiers |

### Anti-Features (Seem good, wrong for v1.4)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Write / mutate MCP tools | “Agent can log a repayment” | PROJECT Out of Scope; breaks trust for first host slice | Read-only only; mutate later if ever |
| App-spawned local agent / subprocess | Old “in-app assistant” idea | Superseded; lifecycle + security mess | External CLI → localhost MCP |
| In-app chat / «Ассистент» UI | Familiar chat UX | Scope + product distraction from capital UI | CLI connects; no chat surface |
| Stdio-only MCP server | “That’s how most MCP tutorials work” | Client would spawn second process; fights Docker single-app model | Streamable HTTP on running app |
| Bind `0.0.0.0` / LAN exposure | “Use from phone” | DNS rebinding + accidental public finance data | `127.0.0.1` only |
| Raw SQL / Prisma / “query anything” tool | Power-user flexibility | Injection + schema footguns; peers that do BQL still constrain read-only | Typed domain tools only |
| Transaction / spend / category tools | Beancount/GnuCash table stakes elsewhere | Wallet has **no** tx ledger (Out of Scope) | Don’t fake; point agents at balances/NW |
| 50–140 micro-tools (Firefly-style) | Completeness theater | Context bloat; hard to maintain annotations | 6–10 domain tools |
| Resources-only catalog (no tools) | Spec purity | Many agents/tool-routers are tool-first | Tools first; resources optional for docs/schema later |
| OAuth / multi-user auth for MCP | “Proper remote MCP” | Single local user; no cloud | Localhost trust boundary; optional later token if needed |
| Auto-approve cloud agent reach into wallet | Convenience | Exfiltrates personal NW off-machine | Local CLI only in docs |
| MCP that rewrites historical NW from income/grace | “Consistent numbers” | Violates INISO/GRISO | Forecast overlay tool only |

## Feature Dependencies

```
App running (Docker / npm run dev) on 127.0.0.1:3000
    └──requires──> In-app Streamable HTTP MCP endpoint
                       ├──requires──> MCP SDK server + route wiring
                       ├──requires──> Localhost bind + Host/Origin checks
                       └──requires──> Read-only tool handlers
                              ├──requires──> Accounts + currencies (v1.0)
                              ├──requires──> Balances LOCF + computeNetWorthRows (v1.0)
                              ├──requires──> FX as-of (v1.0)
                              ├──requires──> Debts remaining + primary totals (v1.1) ──conflicts──> folding into NW
                              ├──requires──> Income occurrences / overdue (v1.2) ──conflicts──> writing BalanceSnapshot
                              ├──requires──> Grace list / open membership (v1.3) ──conflicts──> historical LOCF rewrite
                              └──enhances──> nw-forecast overlay tool (v1.2+v1.3)

Connect docs
    └──requires──> Stable public URL path + example Claude Code + Cursor configs
    └──enhances──> Transport notes (Streamable HTTP preferred; SSE/legacy fallback)

readOnlyHint annotations ──enhances──> Client UX (auto-approve reads)
Server instructions (DISOL/INISO/GRISO) ──enhances──> All domain tools
```

### Dependency Notes

- **MCP endpoint requires running app:** Unlike stdio peers, nothing to spawn — docs must say “start wallet first.”
- **Domain tools require shipped libs:** No new finance math in v1.4 — wrap `src/lib/{net-worth,balances,fx,debts,income,credit-grace,nw-forecast}.ts`.
- **Debts/income/grace conflict with NW mutation:** Tool responses must keep isolation flags explicit so agents don’t “fix” DISOL/INISO/GRISO.
- **Connect docs enhance adoption but don’t block tool implementation:** Can ship endpoint + tools, then docs in same milestone (both Active requirements).
- **Forecast tool enhances but can trail:** Core capital/debt/income/grace reads are enough for MVP; forecast is the capital-foresight differentiator.

## MVP Definition

### Launch With (v1.4)

- [ ] In-app Streamable HTTP MCP on localhost (same process as Next)
- [ ] Read-only tools: accounts, NW/balances as-of, FX, debts+totals, income, grace
- [ ] `readOnlyHint: true` + isolation copy in server/tool descriptions
- [ ] Connect docs: Claude Code (`type: http`) + Cursor (`url`) → `http://127.0.0.1:3000/...`
- [ ] Localhost-only binding documented and enforced

### Add After Validation (v1.4.x / next)

- [ ] `get_forecast_overlay` if not in initial slice — trigger: agents keep recomputing forecast badly from raw tools
- [ ] Optional MCP resource for “domain rules” markdown — trigger: repeated DISOL mistakes
- [ ] Cursor `mcp-remote` bridge note only if Streamable HTTP fails in target CLI — trigger: real UAT fail
- [ ] Bounded pagination/`limit` on list tools — trigger: large debt/income histories

### Future Consideration (v2+)

- [ ] Write tools (with confirmations) — defer until read path trusted
- [ ] In-app chat UI — still Out of Scope unless product flips
- [ ] Auth token on localhost — if LAN/share ever opens
- [ ] Stdio adapter package — only if a client cannot do HTTP

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| In-app Streamable HTTP endpoint | HIGH | MEDIUM–HIGH | P1 |
| Localhost bind + rebinding guards | HIGH | LOW | P1 |
| Accounts + NW/balances + FX tools | HIGH | LOW–MEDIUM | P1 |
| Debts + income + grace read tools | HIGH | MEDIUM | P1 |
| `readOnlyHint` + isolation instructions | HIGH | LOW | P1 |
| Claude Code + Cursor connect docs | HIGH | LOW | P1 |
| Forecast overlay tool | MEDIUM | MEDIUM | P2 |
| MCP resources for rules/schema | LOW–MEDIUM | LOW | P3 |
| Write tools / chat UI / stdio sidecar | — | HIGH | Anti / defer |

**Priority key:**
- P1: Must have for v1.4 launch
- P2: Should have when thin
- P3: Nice later

## Competitor Feature Analysis

| Feature | mcp-beancount (RO) | gnucash-mcp (RO) | Firefly III MCP | Wallet v1.4 approach |
|---------|--------------------|------------------|-----------------|----------------------|
| Transport | stdio (typical) | stdio | stdio or HTTP | **In-app HTTP/SSE** (app already up) |
| Accounts / balances / NW | ✓ | ✓ | ✓ (via many tools) | ✓ via few typed tools |
| Transactions / BQL | ✓ | ✓ | ✓ | **Anti** — no tx ledger |
| Side ledgers (debts/income/grace) | N/A (one book) | N/A | budgets/piggy etc. | ✓ explicit tools + isolation |
| Writes | ✗ (good) | ✗ (good) / other forks ✓ | many | **✗ deferred** |
| Connect docs | env + Claude Desktop | Claude Desktop | HTTP OAuth guides | Claude Code + Cursor CLI localhost |
| Safety | file path env, allowlist | SQLite `mode=ro` | OAuth/PAT | localhost + RO tools + annotations |

## Sources

- MCP Streamable HTTP transport (spec): https://modelcontextprotocol.io/specification/2025-11-25/basic/transports — confidence MEDIUM (websearch/official, verified against SDK notes)
- MCP TypeScript SDK server transports: https://ts.sdk.modelcontextprotocol.io/server — confidence MEDIUM
- Claude Code MCP servers (HTTP `type` + `url`): https://code.claude.com/docs/en/mcp-servers — confidence MEDIUM
- Cursor CLI MCP: https://cursor.com/docs/cli/mcp — confidence MEDIUM; Cursor SSE/HTTP agent quirks: forum reports — confidence LOW–MEDIUM (treat as risk flag in docs)
- mekanics/mcp-beancount tool set (RO NW/balances/query): https://github.com/mekanics/mcp-beancount — confidence MEDIUM
- michMartineau/gnucash-mcp (RO SQLite tools): https://github.com/michMartineau/gnucash-mcp — confidence MEDIUM
- daften/fireflyiii-mcp (large tool surface / HTTP): https://github.com/daften/fireflyiii-mcp — confidence MEDIUM (anti-pattern for size)
- MCP tool annotations (`readOnlyHint`): https://blog.modelcontextprotocol.io/posts/2026-03-16-tool-annotations/ — confidence MEDIUM
- Wallet locks: `.planning/PROJECT.md` v1.4 Local MCP; domain libs under `src/lib/` — confidence HIGH

---
*Feature research for: Wallet in-app read-only MCP host (v1.4)*
*Researched: 2026-09-10*
