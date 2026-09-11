# Phase 26: Connect Docs + Policy - Context

**Gathered:** 2026-09-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Claude Code / Cursor can connect with copy-paste configs; every shipped MCP tool declares `readOnlyHint` plus named DISOL/INISO/GRISO isolation copy where applicable; PARITY-01 is materialized as a standing project-visible rule. Requirements: CLI-01, CLI-02, PARITY-01. No new finance tools, no write tools, no `/api/health` MCP discoverability change.

</domain>

<decisions>
## Implementation Decisions

### Docs home (CLI-02)
- **D-01:** Connect snippets live in **README only** (not OPERATOR.md, not a dedicated `docs/mcp.md`). — **Reversibility:** reversible
- **D-02:** README MCP section = **copy-paste configs only** — no smoke / ping / tools/list steps in README.
- **D-03:** Section language = **English** (match existing README).
- **D-04:** Insert MCP section **after Quick start** (prerequisite “app already on 127.0.0.1:3000” is obvious).
- **D-05:** Documented URL remains `http://127.0.0.1:3000/api/mcp` (Phase 23 D-04).
- **D-06:** Claude Code snippet uses `type: http`; Cursor snippet uses **`type: http` + `url`** (not `streamable-http`, not url-only).

### Isolation prose (CLI-01)
- **D-07:** Named isolation copy lives in **both** server instructions and per-tool SIDE descriptions. — **Reversibility:** costly — published agent-facing instruction/description surface
- **D-08:** Prose length = **short** (1–2 sentences) with rule name (DISOL-01 / INISO-01 / GRISO-01) + “do not fold into historical NW / Капитал LOCF”.
- **D-09:** **SIDE tools only** get named DISOL/INISO/GRISO (`list_debts`, `list_income`, `list_grace_obligations`, `get_forecast_overlay`). CAP tools get light honesty polish without those rule names.
- **D-10:** Add `readOnlyHint: true` + `openWorldHint: false` on **`wallet_ping`** (CLI-01: every shipped tool).
- **D-11:** Keep Phase 25 D-06 — isolation messaging in descriptions/instructions only; **no** payload meta fields.

### PARITY-01 vehicle
- **D-12:** Materialize as existing **PROJECT Constraints** text **plus** a short **AGENTS.md** `BEGIN`/`END` block (same pattern as `wallet-operator`). — **Reversibility:** reversible
- **D-13:** Agent rule = **AGENTS.md only** — do not add a separate `.cursor/rules` duplicate.
- **D-14:** Do **not** mention PARITY in the README MCP section (README = connect only).
- **D-15:** Mark **PARITY-01** (and CLI-01/02 when done) Active checkboxes `[x]` in this phase; Constraints text stays standing.

### Smoke + mcp-remote
- **D-16:** Phase done-bar requires **live connect for both** Claude Code and Cursor. — **Reversibility:** costly — UAT bar for milestone close
- **D-17:** Document **`mcp-remote` only after a real smoke failure** — do not pre-document in README.
- **D-18:** Dual-client smoke lives in **phase UAT.md only** — do not add smoke steps to OPERATOR.md or README.
- **D-19:** Optional: if Cursor `type: http` fails in UAT, fall back path is deferred note / mcp-remote — not invent a second primary snippet.

### Claude's Discretion
- English README wording, exact snippet shapes (Claude `claude mcp add` vs JSON), AGENTS.md parity block wording, short DISOL/INISO/GRISO sentence templates, CAP light-polish phrasing, server-instructions rewrite structure — planner/researcher may refine from research FEATURES/ARCHITECTURE defaults as long as D-01…D-18 hold.

### Reviewed Todos
- **Savings account type with interest NW forecast** — reviewed, not folded (backlog; not CLI/PARITY).
- **Timezone selection in settings** — reviewed, not folded (unrelated; weak keyword match).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap
- `.planning/REQUIREMENTS.md` — CLI-01, CLI-02, PARITY-01; OOS writes/chat/stdio/`0.0.0.0`
- `.planning/ROADMAP.md` — Phase 26 goal + success criteria
- `.planning/PROJECT.md` — Constraints MCP parity (PARITY-01); Active checklist CLI/PARITY

### Prior phases
- `.planning/phases/25-side-ledger-tools-isolation/25-CONTEXT.md` — D-06 no payload meta; D-08 deferred full named prose → this phase
- `.planning/phases/24-capital-read-tools/24-CONTEXT.md` — readOnlyHint on CAP; EN+RU aliases; D-16 no CI mutate ban
- `.planning/phases/23-mcp-host-localhost-safety/23-CONTEXT.md` — URL prefer `127.0.0.1`; D-16 no `/api/health` discoverability

### Research (milestone)
- `.planning/research/SUMMARY.md` — Phase 4 connect docs deliverable; mcp-remote only on real fail
- `.planning/research/FEATURES.md` — readOnlyHint + dual-client connect; openWorldHint false
- `.planning/research/ARCHITECTURE.md` — Claude `type: http` / Cursor `url` table; OPERATOR/README doc targets (this phase overrides: README-only per D-01)

### Existing code / docs
- `README.md` — insert MCP section after Quick start
- `AGENTS.md` — add PARITY BEGIN/END block beside wallet-operator
- `src/lib/mcp/create-handler.ts` — expand server instructions with named isolation
- `src/lib/mcp/tools/*.ts` — SIDE description polish + `wallet_ping` annotations
- `.planning/OPERATOR.md` — UAT driver prefs; do not add connect smoke here (D-18)

### External (verify at UAT)
- Claude Code MCP docs — `type: http` / `--transport http`
- Cursor MCP docs — remote `url` in `mcp.json`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- All CAP/SIDE tools already set `readOnlyHint: true` + `openWorldHint: false` except `wallet_ping`
- SIDE tools already have short “side ledger; not historical NW” one-liners — upgrade to named DISOL/INISO/GRISO
- `create-handler.ts` instructions already list tools + side-ledger one-liners — expand with rule names
- README Quick start already documents loopback `127.0.0.1:3000`

### Established Patterns
- Tool descriptions: English primary + RU domain aliases
- Isolation in copy/tests, not JSON meta (Phase 25 D-06)
- AGENTS.md uses `<!-- BEGIN:... -->` blocks for standing agent prefs

### Integration Points
- Docs: README section only
- Policy: PROJECT Active checkboxes + AGENTS parity block
- Code: handler instructions + tool description/annotation edits under `src/lib/mcp/`
- Verify: phase UAT dual-client connect (agent-driven per OPERATOR)

</code_context>

<specifics>
## Specific Ideas

- User locked dual-client live smoke even though README stays snippet-only — UAT owns the proof.
- User deferred almost all wording/placement details to Claude within the locks above.
- Discussion questions were in Russian by user request; CONTEXT stays English for downstream agents.

</specifics>

<deferred>
## Deferred Ideas

- Pre-documenting `mcp-remote` in README — only if UAT fails native http
- OPERATOR.md connect smoke section — explicitly out (D-18)
- Dedicated `docs/mcp.md` — rejected for this phase
- CI mutate-import ban under `src/lib/mcp/**` — still optional later (Phase 24/25 deferred)

### Reviewed Todos (not folded)
- **Savings account type with interest NW forecast** (`.planning/todos/pending/2026-09-10-savings-account-type-with-interest-nw-forecast.md`) — not CLI/PARITY
- **Timezone selection in settings** (`.planning/todos/pending/2026-09-05-add-timezone-selection-to-settings.md`) — unrelated

</deferred>

---

*Phase: 26-Connect Docs + Policy*
*Context gathered: 2026-09-11*
