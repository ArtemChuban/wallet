# Phase 26: Connect Docs + Policy - Research

**Researched:** 2026-09-11
**Domain:** MCP client connect docs + tool annotation/isolation prose + standing PARITY rule
**Confidence:** HIGH (codebase + Claude/Cursor official docs); MEDIUM (Cursor `type: http` live parse — UAT proves)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Docs home (CLI-02)
- **D-01:** Connect snippets live in **README only** (not OPERATOR.md, not a dedicated `docs/mcp.md`). — **Reversibility:** reversible
- **D-02:** README MCP section = **copy-paste configs only** — no smoke / ping / tools/list steps in README.
- **D-03:** Section language = **English** (match existing README).
- **D-04:** Insert MCP section **after Quick start** (prerequisite “app already on 127.0.0.1:3000” is obvious).
- **D-05:** Documented URL remains `http://127.0.0.1:3000/api/mcp` (Phase 23 D-04).
- **D-06:** Claude Code snippet uses `type: http`; Cursor snippet uses **`type: http` + `url`** (not `streamable-http`, not url-only).

#### Isolation prose (CLI-01)
- **D-07:** Named isolation copy lives in **both** server instructions and per-tool SIDE descriptions. — **Reversibility:** costly — published agent-facing instruction/description surface
- **D-08:** Prose length = **short** (1–2 sentences) with rule name (DISOL-01 / INISO-01 / GRISO-01) + “do not fold into historical NW / Капитал LOCF”.
- **D-09:** **SIDE tools only** get named DISOL/INISO/GRISO (`list_debts`, `list_income`, `list_grace_obligations`, `get_forecast_overlay`). CAP tools get light honesty polish without those names.
- **D-10:** Add `readOnlyHint: true` + `openWorldHint: false` on **`wallet_ping`** (CLI-01: every shipped tool).
- **D-11:** Keep Phase 25 D-06 — isolation messaging in descriptions/instructions only; **no** payload meta fields.

#### PARITY-01 vehicle
- **D-12:** Materialize as existing **PROJECT Constraints** text **plus** a short **AGENTS.md** `BEGIN`/`END` block (same pattern as `wallet-operator`). — **Reversibility:** reversible
- **D-13:** Agent rule = **AGENTS.md only** — do not add a separate `.cursor/rules` duplicate.
- **D-14:** Do **not** mention PARITY in the README MCP section (README = connect only).
- **D-15:** Mark **PARITY-01** (and CLI-01/02 when done) Active checkboxes `[x]` in this phase; Constraints text stays standing.

#### Smoke + mcp-remote
- **D-16:** Phase done-bar requires **live connect for both** Claude Code and Cursor. — **Reversibility:** costly — UAT bar for milestone close
- **D-17:** Document **`mcp-remote` only after a real smoke failure** — do not pre-document in README.
- **D-18:** Dual-client smoke lives in **phase UAT.md only** — do not add smoke steps to OPERATOR.md or README.
- **D-19:** Optional: if Cursor `type: http` fails in UAT, fall back path is deferred note / mcp-remote — not invent a second primary snippet.

### Claude's Discretion
- English README wording, exact snippet shapes (Claude `claude mcp add` vs JSON), AGENTS.md parity block wording, short DISOL/INISO/GRISO sentence templates, CAP light-polish phrasing, server-instructions rewrite structure — planner/researcher may refine from research FEATURES/ARCHITECTURE defaults as long as D-01…D-18 hold.

### Deferred Ideas (OUT OF SCOPE)
- Pre-documenting `mcp-remote` in README — only if UAT fails native http
- OPERATOR.md connect smoke section — explicitly out (D-18)
- Dedicated `docs/mcp.md` — rejected for this phase
- CI mutate-import ban under `src/lib/mcp/**` — still optional later (Phase 24/25 deferred)

### Reviewed Todos (not folded)
- **Savings account type with interest NW forecast** — not CLI/PARITY
- **Timezone selection in settings** — unrelated
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CLI-01 | MCP tools declare `readOnlyHint` and isolation rules (DISOL/INISO/GRISO) in server/tool descriptions | Annotate `wallet_ping`; upgrade SIDE descriptions + `create-handler` instructions with named DISOL/INISO/GRISO; CAP light polish only; flip Phase 25 isolation-contract asserts; no payload meta |
| CLI-02 | Docs show Claude Code and Cursor CLI how to connect to localhost MCP URL (copy-paste; app already running) | README section after Quick start; Claude `type: http` / `--transport http`; Cursor `type: http` + `url`; URL `http://127.0.0.1:3000/api/mcp`; no smoke in README |
| PARITY-01 | Standing project rule — new user-visible read surfaces ship matching MCP read tool(s) same milestone/phase | Keep PROJECT Constraints text; add AGENTS.md BEGIN/END block; mark Active checkboxes; no README PARITY; no `.cursor/rules` duplicate |
</phase_requirements>

## Summary

Phase 26 is **docs + prose + policy**, not new finance tools. CAP/SIDE tools already ship `readOnlyHint: true` + `openWorldHint: false` except `wallet_ping`. SIDE descriptions already have unnamed “side ledger; not historical NW” one-liners; Phase 25 deliberately asserted **absence** of `DISOL-01|INISO-01|GRISO-01` in `create-handler` instructions — that assert **must flip** this phase. Connect path is README-only copy-paste; dual-client live smoke is UAT-only.

Claude Code official docs require `"type": "http"` with `url` (url-without-type = stdio misparse). Cursor official docs show remote servers as **url-only**; project lock D-06 still requires `"type": "http"` + `url` — treat Cursor live parse as UAT risk, not an excuse to weaken the snippet.

**Primary recommendation:** (1) annotate `wallet_ping` + inject short named DISOL/INISO/GRISO lines into SIDE tool descriptions and server instructions; (2) insert English README MCP section after Quick start with Claude + Cursor snippets; (3) add AGENTS.md parity BEGIN/END beside wallet-operator and mark PROJECT Active CLI/PARITY checkboxes; (4) prove both clients in `26-UAT.md`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tool `readOnlyHint` / `openWorldHint` | API / Backend | — | Declared on `registerTool` in Next process |
| Named DISOL/INISO/GRISO prose | API / Backend | — | Server `instructions` + SIDE tool `description` strings |
| CAP description polish | API / Backend | — | Same registerTool descriptions; no rule names |
| Claude/Cursor connect snippets | CDN / Static (repo docs) | Browser / Client (operator pastes) | README only; clients consume configs outside app |
| PARITY-01 standing rule | Repo policy (PROJECT + AGENTS) | — | Agent-visible constraint; not runtime MCP |
| Dual-client connect smoke | Browser / Client (CLIs) | Frontend Server (app must be up) | External agents hit localhost `/api/mcp` |

## Project Constraints (from .cursor/rules/)

No `.cursor/rules/` directory in this repo. Standing agent prefs live in `AGENTS.md` BEGIN/END blocks (`nextjs-agent-rules`, `wallet-operator`). D-13 forbids adding a `.cursor/rules` PARITY duplicate — use AGENTS.md only.

Additional project directives affecting this phase:
- Prefer **codegraph** for project search (user rule).
- Next.js APIs may differ — check `node_modules/next/dist/docs/` before Next code changes (AGENTS.md); this phase is mostly MCP/docs, not Next API churn.
- Before UAT: read `.planning/OPERATOR.md` — agent drives app; dual-client MCP smoke is CLI-based (Claude + Cursor agent), not Orca DOM.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@modelcontextprotocol/server` | **2.0.0** (`^2.0.0` in package.json) | `McpServer` / `registerTool` / annotations | Already hosts all tools [VERIFIED: package.json:19] |
| Vitest | **4.1.11** (installed; registry latest may differ) | Description/annotation/source contracts | Existing MCP test pattern [VERIFIED: package.json:49] |
| Claude Code CLI | **2.1.268** (this host) | Live HTTP MCP client UAT | Official `--transport http` / `type: http` [CITED: code.claude.com/docs/en/mcp] |
| Cursor Agent CLI (`agent`) | **2026.09.10-fd3934a** (this host) | Live MCP client UAT | Shares editor `mcp.json`; `agent mcp list` / `list-tools` [CITED: cursor.com/docs/cli/mcp] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Existing tool description exports (`LIST_*_DESCRIPTION`) | in-repo | Assertable prose contracts | Extend regexes for DISOL/INISO/GRISO |
| `src/lib/mcp/isolation-contract.test.ts` | in-repo | Flip named-rule presence asserts | Required Wave 0 / first task |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| README-only snippets | `docs/mcp.md` or OPERATOR smoke | Rejected D-01 / D-18 |
| Cursor url-only (matches Cursor docs) | `type: http` + `url` | Locked D-06; url-only is fallback only after UAT fail (D-19) |
| `.cursor/rules` PARITY file | AGENTS.md BEGIN/END | Rejected D-13 |
| Pre-document `mcp-remote` | Document only after fail | Locked D-17 |

**Installation:** none — no new npm packages.

**Version verification:** `@modelcontextprotocol/server` → `2.0.0` via `npm view` this session. Vitest already pinned `4.1.11` in package.json (registry may report newer; do not bump in this phase).

## Package Legitimacy Audit

> No new packages. Gate run on already-present stack for hygiene.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `@modelcontextprotocol/server` | npm | since 2026-07-27 publish signal | ~2.9M/wk | github.com/modelcontextprotocol/typescript-sdk | OK | Already installed — Approved |
| `vitest` | npm | seam flagged “too-new” | ~57M/wk | github.com/vitest-dev/vitest | SUS (too-new) | Already installed — **do not reinstall**; no checkpoint needed for existing pin |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** vitest (already in tree; ignore for this phase)

## Architecture Patterns

### System Architecture Diagram

```
[Operator] --paste--> README snippets
                         |
         +---------------+----------------+
         |                                |
         v                                v
  Claude Code                      Cursor / agent CLI
  (type:http + url)                (type:http + url → mcp.json)
         |                                |
         +---------------+----------------+
                         |
                         v
              http://127.0.0.1:3000/api/mcp
                         |
                         v
              createWalletMcpHandler()
                 | instructions (named DISOL/INISO/GRISO)
                 | tools/* registerTool
                 |   CAP: readOnlyHint + honesty (no rule names)
                 |   SIDE: readOnlyHint + named rule sentences
                 |   wallet_ping: readOnlyHint + openWorldHint false
                         |
                         v
              read adapters / SQLite (unchanged)

PARITY-01: PROJECT.md Constraints + AGENTS.md BEGIN/END
           (agents read before new UI-read work)
```

### Recommended Project Structure

```
README.md                          # NEW section after Quick start (CLI-02)
AGENTS.md                          # NEW BEGIN/END parity block (PARITY-01)
.planning/PROJECT.md               # Mark Active CLI/PARITY checkboxes [x]
.planning/REQUIREMENTS.md          # Mark CLI-01/02 + PARITY-01 [x] when done
src/lib/mcp/create-handler.ts      # Named isolation in instructions
src/lib/mcp/tools/wallet-ping.ts   # annotations
src/lib/mcp/tools/{debts,income,grace,forecast}.ts  # named SIDE prose
src/lib/mcp/tools/{accounts,net-worth,balances,fx}.ts  # light CAP polish only
src/lib/mcp/isolation-contract.test.ts  # FLIP: require DISOL/INISO/GRISO
.planning/phases/26-…/26-UAT.md    # Dual-client smoke only (D-18)
```

### Pattern 1: Named SIDE isolation sentence
**What:** Replace unnamed “Side ledger … not historical NW” with 1–2 sentences that include the rule id.
**When to use:** `list_debts`, `list_income`, `list_grace_obligations`, `get_forecast_overlay` + matching lines in server instructions.
**Recommended templates (discretion, honor D-08):**

| Tool | Rule id(s) | Template |
|------|------------|----------|
| `list_debts` | DISOL-01 | `DISOL-01: Долги side ledger — do not fold into historical NW / Капитал LOCF.` |
| `list_income` | INISO-01 | `INISO-01: Доходы side ledger — do not fold into historical NW / Капитал LOCF.` |
| `list_grace_obligations` | GRISO-01 | `GRISO-01: Грейс side ledger — do not fold into historical NW / Капитал LOCF.` |
| `get_forecast_overlay` | INISO-01 + GRISO-01 | `INISO-01/GRISO-01: Капитал forecast overlay (Прогноз) is income + A′ grace — do not fold into historical NW LOCF.` |

Keep English primary + RU domain aliases already present in the longer description body.

### Pattern 2: Claude + Cursor README snippets
**What:** Copy-paste configs only; prerequisite implied by Quick start above.
**Recommended shapes (discretion):**

Claude (CLI + JSON):
```bash
claude mcp add --transport http wallet http://127.0.0.1:3000/api/mcp
```
```json
{
  "mcpServers": {
    "wallet": {
      "type": "http",
      "url": "http://127.0.0.1:3000/api/mcp"
    }
  }
}
```
[CITED: code.claude.com/docs/en/mcp — `claude mcp add --transport http`; JSON `"type":"http"` + `"url"`]

Cursor (`.cursor/mcp.json` or `~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "wallet": {
      "type": "http",
      "url": "http://127.0.0.1:3000/api/mcp"
    }
  }
}
```
[Locked D-06; Cursor docs show url-only examples — see Pitfalls]

One-line prerequisite: “Wallet must already be running on `127.0.0.1:3000` (Quick start above).”

### Pattern 3: AGENTS.md parity block
**What:** Mirror `wallet-operator` BEGIN/END.
**Recommended skeleton:**
```markdown
<!-- BEGIN:wallet-mcp-parity -->

# MCP parity (PARITY-01)

Any new user-visible read surface must ship matching read-only MCP tool(s) in the same milestone/phase — agents stay at UI parity. See `.planning/PROJECT.md` Constraints.

<!-- END:wallet-mcp-parity -->
```
[VERIFIED pattern: AGENTS.md:11-18 `<!-- BEGIN:wallet-operator -->` … `<!-- END:wallet-operator -->`]

### Anti-Patterns to Avoid
- **Smoke steps in README:** Violates D-02 / D-18 — UAT owns proof.
- **Named rules on CAP tools:** Violates D-09.
- **Payload fields like `isolation: "DISOL-01"`:** Violates D-11 / Phase 25 D-06.
- **Pre-documenting mcp-remote:** Violates D-17.
- **Leaving isolation-contract `not.toMatch(/DISOL-01|…/)`:** Phase 25 gate will fail CLI-01 — must invert.
- **Documenting `localhost` as primary URL:** Prefer `127.0.0.1` (Phase 23 / D-05).
- **`.cursor/rules` PARITY duplicate:** Violates D-13.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MCP transport bridge | Custom stdio proxy | Native HTTP clients; `mcp-remote` only after UAT fail | D-17; app stays Streamable HTTP |
| Isolation enforcement via JSON meta | Payload flags | Description + instructions + existing disol/iniso/griso tests | D-11 |
| Connect discoverability | `/api/health` MCP advertising | README + running app | Phase 23 D-16 unchanged |
| Annotation schema | Custom hint fields | MCP `ToolAnnotations` `readOnlyHint` / `openWorldHint` | Spec hints already in SDK |
| PARITY enforcement CI | New linter this phase | Standing PROJECT + AGENTS text | D-12 scope |

**Key insight:** Phase is surface polish + docs + policy; reuse Phase 23–25 MCP host/tools unchanged except copy/annotations/tests.

## Common Pitfalls

### Pitfall 1: Isolation-contract still forbids named rules
**What goes wrong:** Executor adds DISOL-01 prose; `isolation-contract.test.ts` fails on `not.toMatch(/DISOL-01|INISO-01|GRISO-01/)`.
**Why it happens:** Phase 25 explicitly deferred named essay [VERIFIED: src/lib/mcp/isolation-contract.test.ts:61-62 — `expect(src).not.toMatch(/DISOL-01|INISO-01|GRISO-01/);`].
**How to avoid:** First task flips that assert to **require** all three ids in instructions + SIDE description exports.
**Warning signs:** Red vitest on isolation-contract after prose edit.

### Pitfall 2: Claude JSON without `type`
**What goes wrong:** Server skipped; “url but no type” / treated as stdio.
**Why it happens:** Claude treats url-only as stdio [CITED: code.claude.com/docs/en/mcp].
**How to avoid:** Snippets always include `"type": "http"`.
**Warning signs:** `claude mcp list` shows Failed / skipped.

### Pitfall 3: Cursor `type: http` vs url-only docs
**What goes wrong:** Cursor CLI/parser rejects or ignores unexpected `type` (historical `streamable-http` pain in milestone research).
**Why it happens:** Official Cursor remote examples are url-only [CITED: cursor.com/docs/mcp]; D-06 still locks `type: http` + `url`.
**How to avoid:** Ship D-06 snippet; UAT with `agent mcp list` / `list-tools`; on fail use D-19 deferred note / mcp-remote — do not invent second primary README snippet.
**Warning signs:** Connected in Claude, fails in Cursor (or vice versa).

### Pitfall 4: Treating annotations as security
**What goes wrong:** Assume `readOnlyHint` blocks writes.
**Why it happens:** Spec marks annotations as **hints** only [VERIFIED: node_modules/@modelcontextprotocol/sdk/dist/cjs/spec.types.d.ts:1100-1105 — `NOTE: all properties in ToolAnnotations are **hints**.`].
**How to avoid:** Keep Host/Origin + no write tools + isolation walls; annotations for client UX only.
**Warning signs:** Plan claims “readOnlyHint enforces read-only.”

### Pitfall 5: App not running during UAT
**What goes wrong:** Both clients fail connect; false mcp-remote conclusion.
**Why it happens:** MCP is in-process on running Next app.
**How to avoid:** `npm run dev` (or Docker) before smoke; README states prerequisite.
**Warning signs:** Connection refused to `:3000`.

### Pitfall 6: PARITY mentioned in README
**What goes wrong:** Connect section polluted with policy.
**Why it happens:** Temptation to document everything in one place.
**How to avoid:** D-14 — README connect only; PARITY in PROJECT + AGENTS.

## Code Examples

### wallet_ping annotations (CLI-01 / D-10)
```typescript
// Pattern source: CAP tools + SDK example
// [VERIFIED: node_modules/@modelcontextprotocol/sdk/dist/esm/examples/server/simpleStreamableHttp.js:53-56]
// annotations: { title: '...', readOnlyHint: true, openWorldHint: false }
server.registerTool(
  "wallet_ping",
  {
    description: "Liveness check for wallet MCP transport",
    inputSchema: z.object({}),
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
  },
  async () => { /* unchanged payload */ },
);
```

Current `wallet_ping` has **no** annotations block [VERIFIED: src/lib/mcp/tools/wallet-ping.ts:4-21].

### SIDE description upgrade (CLI-01 / D-07–D-09)
```typescript
// Evolve existing export — keep EN+RU body; end with named rule
export const LIST_DEBTS_DESCRIPTION =
  "List Долги / debts with remainingMinor and colocated primary totals " +
  "(iOwePrimaryMinor / theyOwePrimaryMinor / isPartial). " +
  "Optional includeClosed (default false = OPEN only, DebtsList focus). " +
  "DISOL-01: Долги side ledger — do not fold into historical NW / Капитал LOCF.";
```

Current unnamed closer [VERIFIED: src/lib/mcp/tools/debts.ts:7-11 — `"Side ledger (Долги); not historical net worth / Капитал LOCF."`].

### Server instructions named rules (D-07)
Expand SIDE lines in `create-handler.ts` instructions string so each of DISOL-01 / INISO-01 / GRISO-01 appears (forecast may cite INISO-01/GRISO-01). Current instructions already list tools + unnamed side-ledger one-liners [VERIFIED: src/lib/mcp/create-handler.ts:23-34].

### Isolation-contract flip
```typescript
// BEFORE (Phase 25): expect(src).not.toMatch(/DISOL-01|INISO-01|GRISO-01/);
// AFTER (Phase 26):
expect(src).toMatch(/DISOL-01/);
expect(src).toMatch(/INISO-01/);
expect(src).toMatch(/GRISO-01/);
// Also assert SIDE description exports + wallet_ping annotations via source scan
```

### README insert locus
Insert new `## MCP (Claude Code / Cursor)` (name discretionary) **after** Quick start block ending at Docker stop / host DB note, **before** `## Host data contract` [VERIFIED: README.md:5-24 Quick start; line 24 `## Host data contract`].

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Unnamed SIDE one-liners | Named DISOL/INISO/GRISO sentences | Phase 25→26 | CLI-01 complete |
| No connect docs | README Claude + Cursor snippets | Phase 26 | CLI-02 |
| PARITY only in PROJECT Constraints | PROJECT + AGENTS BEGIN/END | Phase 26 | Agent-visible standing rule |
| SSE / stdio sidecar peers | Streamable HTTP on running app | v1.4 research | No mcp-remote primary |

**Deprecated/outdated:**
- Claude SSE as primary remote transport — docs prefer HTTP; SSE auto-fallback exists but not our primary snippet [CITED: code.claude.com/docs/en/mcp]
- Cursor `"type": "streamable-http"` as documented primary — milestone research flags CLI parse risk; D-06 forbids it

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Cursor accepts `"type":"http"` alongside `url` on this host’s agent CLI | Pitfall 3 / UAT | Must apply D-19 (deferred mcp-remote note) without changing primary README until fail proven |
| A2 | Forecast overlay should cite **both** INISO-01 and GRISO-01 (not invent FORECAST-01) | Pattern 1 | Wrong rule name confuses agents; discretionary — confirm in plan if needed |
| A3 | Marking REQUIREMENTS.md checkboxes is in-scope with D-15 Active checkboxes | PARITY/CLI closeout | Checklist drift if only PROJECT updated |

**If empty:** N/A — table has items needing UAT/discretion confirmation.

## Open Questions

1. **Cursor `type: http` acceptance**
   - What we know: Official Cursor docs show url-only; D-06 locks type+url; Claude requires type.
   - What's unclear: This machine’s Cursor agent parser behavior.
   - Recommendation: Plan UAT first with D-06 snippet; on fail record in UAT + deferred note — do not weaken README preemptively (D-17/D-19).

2. **Forecast rule naming**
   - What we know: D-09 lists `get_forecast_overlay` among SIDE tools that get named rules.
   - What's unclear: Single id vs INISO+GRISO pair.
   - Recommendation: Use `INISO-01/GRISO-01` combined sentence (matches overlay membership).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | App + vitest | ✓ | v24.5.0 | — |
| npm / vitest | Unit contracts | ✓ | npm 10.9.3 / vitest 4.1.11 | — |
| Claude Code CLI | Dual-client UAT | ✓ | 2.1.268 | — |
| Cursor Agent CLI (`agent`) | Dual-client UAT | ✓ | 2026.09.10-fd3934a | — |
| Cursor IDE GUI | Optional | ✗ | — | Use `agent` CLI (sufficient per Cursor MCP CLI docs) |
| Running wallet `:3000` | Connect smoke | probe at UAT | — | `npm run dev` / Docker compose |
| `mcp-remote` | Fallback only | not required | — | Install only after documented native fail |

**Missing dependencies with no fallback:** none for planning/execution of code+docs.

**Missing dependencies with fallback:** Cursor IDE GUI → `agent` CLI.

Step 2.6 note: Phase depends on external CLIs for UAT (D-16); both present on this host.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.11 |
| Config file | `vitest.config.ts` (`include: ["src/**/*.test.ts"]`) |
| Quick run command | `npx vitest run src/lib/mcp/isolation-contract.test.ts src/lib/mcp/tools/wallet-ping.ts` — note: add `wallet-ping.test.ts` |
| Full suite command | `npx vitest run src/lib/mcp` (plus disol/iniso/griso if touched) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLI-01 | Every tool has `readOnlyHint: true` (source scan incl. wallet_ping) | unit | `npx vitest run src/lib/mcp/isolation-contract.test.ts` | ✅ extend |
| CLI-01 | SIDE descriptions contain DISOL-01 / INISO-01 / GRISO-01 as mapped | unit | `npx vitest run src/lib/mcp/tools/debts.test.ts src/lib/mcp/tools/income.test.ts src/lib/mcp/tools/grace.test.ts src/lib/mcp/tools/forecast.test.ts` | ✅ update regexes |
| CLI-01 | Server instructions contain named rules | unit | `npx vitest run src/lib/mcp/isolation-contract.test.ts` | ✅ flip assert |
| CLI-01 | No payload isolation meta fields | unit | existing serialize / D-06 style asserts | ✅ keep |
| CLI-02 | README contains both client configs + URL | unit or smoke | optional: small `readme-mcp.test.ts` reading README.md | ❌ Wave 0 optional |
| CLI-02 / D-16 | Claude + Cursor live connect | manual UAT | `26-UAT.md` steps via `claude mcp` + `agent mcp` | ❌ create at verify |
| PARITY-01 | AGENTS.md BEGIN/END block present | unit optional | source string test or manual verify | ❌ optional |
| PARITY-01 | PROJECT Active checkboxes marked | docs | manual / plan done | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run src/lib/mcp/isolation-contract.test.ts` (+ touched tool `*.test.ts`)
- **Per wave merge:** `npx vitest run src/lib/mcp`
- **Phase gate:** Full MCP suite green + dual-client UAT pass before `/gsd-verify-work` close

### Wave 0 Gaps
- [ ] Flip `isolation-contract.test.ts` Phase 25 “no DISOL/INISO/GRISO” assert → require named rules + `wallet_ping` annotations source scan
- [ ] Update SIDE description regexes in debts/income/grace/forecast tests to expect rule ids (not only “Side ledger”)
- [ ] Optional `wallet-ping.test.ts` or fold ping annotation assert into isolation-contract
- [ ] Create `26-UAT.md` at verify-work with dual-client steps only (not Wave 0 code)
- [ ] Optional README string test — low value if UAT covers connect; skip unless planner wants Nyquist doc coverage

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Localhost Host/Origin already Phase 23; no new auth |
| V3 Session Management | no | Stateless MCP (`legacy: "stateless"`) unchanged |
| V4 Access Control | partial | Loopback-only URL in docs; never document `0.0.0.0` |
| V5 Input Validation | yes | Existing Zod tool schemas unchanged; docs are static |
| V6 Cryptography | no | — |

### Known Threat Patterns for local MCP docs + isolation copy

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Agent folds debts/income/grace into NW | Elevation / Tampering (logical) | Named DISOL/INISO/GRISO in instructions+descriptions + existing twin/MCP walls |
| Docs push LAN bind | Information Disclosure | Keep `127.0.0.1` URL only (D-05) |
| Rely on readOnlyHint as authz | Spoofing / Tampering | Spec: annotations are hints only; no write tools + Host/Origin |
| Premature mcp-remote / stdio bridge docs | Tampering surface | D-17 — only after real fail |

## Sources

### Primary (HIGH confidence)
- `src/lib/mcp/create-handler.ts`, `tools/*.ts`, `isolation-contract.test.ts` — current instructions/annotations/asserts
- Claude Code MCP docs — https://code.claude.com/docs/en/mcp — `--transport http`, `"type":"http"` required with url
- MCP SDK `ToolAnnotations` — `node_modules/@modelcontextprotocol/sdk/dist/cjs/spec.types.d.ts` — hints-only semantics
- SDK example — `simpleStreamableHttp.js` annotations `{ readOnlyHint: true, openWorldHint: false }`
- `.planning/REQUIREMENTS.md` / `PROJECT.md` / `26-CONTEXT.md` — requirement + decision locks

### Secondary (MEDIUM confidence)
- Cursor MCP docs — https://cursor.com/docs/mcp — remote `url` examples (often omit `type`)
- Cursor CLI MCP — https://cursor.com/docs/cli/mcp — `agent mcp list` / `list-tools`
- `.planning/research/{SUMMARY,STACK,ARCHITECTURE,FEATURES,PITFALLS}.md` — milestone connect guidance; mcp-remote-on-fail

### Tertiary (LOW confidence)
- Milestone research Cursor `streamable-http` CLI parse failures (forum-era) — treat as UAT risk flag only

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new deps; CLIs present and versioned on host
- Architecture: HIGH — thin edits to known MCP files + README/AGENTS/PROJECT
- Pitfalls: HIGH for Claude type/isolation-contract flip; MEDIUM for Cursor type:http acceptance

**Research date:** 2026-09-11
**Valid until:** 2026-10-11 (30 days; re-check Claude/Cursor MCP docs if UAT blocked)
