# Phase 26: Connect Docs + Policy - Pattern Map

**Mapped:** 2026-09-11
**Files analyzed:** 18
**Analogs found:** 18 / 18

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `README.md` | config (docs) | transform | self (`## Quick start` → insert before `## Host data contract`) | exact |
| `AGENTS.md` | config (agent prefs) | transform | self (`<!-- BEGIN:wallet-operator -->` block) | exact |
| `.planning/PROJECT.md` | config | transform | self (`### Active` checkboxes + `## Constraints` PARITY text) | exact |
| `.planning/REQUIREMENTS.md` | config | transform | self (CLI-01/02 + PARITY-01 checkboxes + traceability) | exact |
| `src/lib/mcp/create-handler.ts` | config | request-response | self (instructions SIDE one-liners) | exact |
| `src/lib/mcp/tools/wallet-ping.ts` | route (MCP tool) | request-response | `src/lib/mcp/tools/debts.ts` (annotations) + self (handler body) | exact |
| `src/lib/mcp/tools/debts.ts` | route (MCP tool) | request-response | self (`LIST_DEBTS_DESCRIPTION` closer) | exact |
| `src/lib/mcp/tools/income.ts` | route (MCP tool) | request-response | self (`LIST_INCOME_DESCRIPTION`) | exact |
| `src/lib/mcp/tools/grace.ts` | route (MCP tool) | request-response | self (`LIST_GRACE_OBLIGATIONS_DESCRIPTION`) | exact |
| `src/lib/mcp/tools/forecast.ts` | route (MCP tool) | request-response | self (`GET_FORECAST_OVERLAY_DESCRIPTION`) | exact |
| `src/lib/mcp/tools/accounts.ts` | route (MCP tool) | request-response | self (description + annotations already present) | exact |
| `src/lib/mcp/tools/net-worth.ts` | route (MCP tool) | request-response | self (accounts-only honesty line) | exact |
| `src/lib/mcp/tools/balances.ts` | route (MCP tool) | request-response | self | exact |
| `src/lib/mcp/tools/fx.ts` | route (MCP tool) | request-response | self (`LIST_FX_RATES_DESCRIPTION`) | exact |
| `src/lib/mcp/isolation-contract.test.ts` | test | batch | self (flip `not.toMatch` → require rule ids) | exact |
| `src/lib/mcp/tools/{debts,income,grace,forecast}.test.ts` | test | batch | self (description `.toMatch` contracts) | exact |
| `src/lib/mcp/tools/wallet-ping.test.ts` (optional) | test | batch | `src/lib/mcp/isolation-contract.test.ts` source-scan + `fx.test.ts` description export | role-match |
| `.planning/phases/26-connect-docs-policy/26-UAT.md` | config (UAT) | request-response | `.planning/milestones/v1.3-phases/22-graceiso-regression-polish/22-UAT.md` | role-match |

## Pattern Assignments

### `README.md` (config, transform)

**Analog:** self — insert locus after Quick start

**Insert locus** (lines 5–24 Quick start; line 24 starts next section):
```markdown
## Quick start (Docker)
...
SQLite file `./data/wallet.db` remains on the host (bind mount `./data:/data`, `DATABASE_URL=file:/data/wallet.db` in the container).

## Host data contract
```

**Copy pattern (discretion; honor D-01…D-06, D-14):**
- New section title e.g. `## MCP (Claude Code / Cursor)` **between** Quick start end and `## Host data contract`.
- English only; copy-paste configs only — **no** smoke / ping / tools/list / PARITY.
- Prerequisite one-liner pointing at Quick start (`127.0.0.1:3000`).
- URL: `http://127.0.0.1:3000/api/mcp`.
- Claude: `claude mcp add --transport http …` **and/or** JSON with `"type": "http"` + `"url"`.
- Cursor: JSON with `"type": "http"` + `"url"` (D-06; not url-only, not `streamable-http`).
- Do **not** document `mcp-remote` unless UAT already failed (D-17).

---

### `AGENTS.md` (config, transform)

**Analog:** self — `wallet-operator` BEGIN/END

**Block pattern** (lines 11–18):
```markdown
<!-- BEGIN:wallet-operator -->

# Operator prefs (GSD)

Before `/gsd-verify-work` or any UAT: read `.planning/OPERATOR.md`.
Agent drives app (`npm run dev`) + Orca browser (`orca-ide` / `orca`). Ask human only for subjective judgment, true parallel races, or hard blockers.

<!-- END:wallet-operator -->
```

**PARITY delta (D-12/D-13):** Append sibling block after wallet-operator (do **not** add `.cursor/rules`):
```markdown
<!-- BEGIN:wallet-mcp-parity -->

# MCP parity (PARITY-01)

Any new user-visible read surface must ship matching read-only MCP tool(s) in the same milestone/phase — agents stay at UI parity. See `.planning/PROJECT.md` Constraints.

<!-- END:wallet-mcp-parity -->
```

---

### `.planning/PROJECT.md` (config, transform)

**Analog:** self — Active checklist + Constraints

**Active checkboxes** (lines 72–78) — mark CLI/PARITY when done (D-15):
```markdown
### Active

- [ ] HOST-01/02 — ...
- [ ] CAP-01…04 — ...
- [ ] SIDE-01…04 — ...
- [x] CLI-01/02 — readOnlyHint + isolation copy; Claude Code / Cursor connect docs
- [x] PARITY-01 — new user-visible read surfaces always ship matching MCP read tools same phase
```

**Constraints stay standing** (line 129) — do not delete:
```markdown
- **MCP parity (PARITY-01)**: Any new user-visible read surface must expose matching read-only MCP tool(s) in the same milestone/phase — agents stay at UI parity
```

---

### `.planning/REQUIREMENTS.md` (config, transform)

**Analog:** self — requirement checkboxes + phase traceability

**Flip when phase done** (lines 31–33, 81–83):
```markdown
- [x] **CLI-01**: ...
- [x] **CLI-02**: ...
- [x] **PARITY-01**: ...
```
Traceability table: CLI-01/02 + PARITY-01 → Phase 26 Complete (mirror prior req closeouts).

---

### `src/lib/mcp/create-handler.ts` (config, request-response)

**Analog:** self — expand `instructions` SIDE lines with named rules (D-07)

**Current instructions pattern** (lines 20–35):
```typescript
const server = new McpServer(
  { name: "wallet-mcp", version: "1.4.0" },
  {
    instructions:
      "Read-only localhost capital MCP (Капитал): wallet_ping, list_accounts, " +
      "get_net_worth, get_account_balance, list_fx_rates, get_forecast_overlay, " +
      "list_debts, list_income, list_grace_obligations. " +
      // ... CAP honesty ...
      "SIDE: get_forecast_overlay, list_debts, list_income, list_grace_obligations. " +
      "Капитал forecast overlay (Прогноз): income + A′ grace; not historical NW LOCF. " +
      "list_debts is Долги side ledger — not historical NW. " +
      "list_income is Доходы side ledger — not historical NW. " +
      "list_grace_obligations is Грейс side ledger — not historical NW.",
  },
);
```

**Named-rule rewrite (templates from RESEARCH):**
- Keep tool catalog + CAP honesty.
- Replace unnamed SIDE closers with short sentences that include **DISOL-01**, **INISO-01**, **GRISO-01** (forecast may use `INISO-01/GRISO-01`).
- Example: `"DISOL-01: list_debts is Долги side ledger — do not fold into historical NW / Капитал LOCF. "`
- Registration order / imports unchanged.

---

### `src/lib/mcp/tools/wallet-ping.ts` (route, request-response)

**Analog annotations:** `src/lib/mcp/tools/debts.ts` lines 21–24 (same as all CAP/SIDE tools)

**Current ping** (lines 4–21) — **no** annotations:
```typescript
export function registerWalletPing(server: McpServer) {
  server.registerTool(
    "wallet_ping",
    {
      description: "Liveness check for wallet MCP transport",
      inputSchema: z.object({}),
    },
    async () => { /* payload unchanged */ },
  );
}
```

**Add (D-10) — copy annotation shape from debts/accounts:**
```typescript
annotations: {
  readOnlyHint: true,
  openWorldHint: false,
},
```
Keep description + empty Zod + JSON payload shape. Do **not** add isolation rule names (not a SIDE tool).

---

### `src/lib/mcp/tools/debts.ts` (route, request-response)

**Analog:** self — export + registerTool already correct; upgrade closer only

**Description export** (lines 6–11):
```typescript
export const LIST_DEBTS_DESCRIPTION =
  "List Долги / debts with remainingMinor and colocated primary totals " +
  "(iOwePrimaryMinor / theyOwePrimaryMinor / isPartial). " +
  "Optional includeClosed (default false = OPEN only, DebtsList focus). " +
  "Side ledger (Долги); not historical net worth / Капитал LOCF.";
```

**Upgrade last sentence →** `DISOL-01: Долги side ledger — do not fold into historical NW / Капитал LOCF.`  
Keep EN+RU body; keep `annotations` + loader call; **no** payload meta (D-11).

---

### `src/lib/mcp/tools/income.ts` (route, request-response)

**Analog:** self — same SIDE description upgrade pattern as debts

**Current closer** (lines 11–14): `"Side ledger (Доходы); not historical net worth / Капитал LOCF."`  
**→** `INISO-01: Доходы side ledger — do not fold into historical NW / Капитал LOCF.`

---

### `src/lib/mcp/tools/grace.ts` (route, request-response)

**Analog:** self

**Current closer** (lines 7–10): `"Side ledger (Грейс); not historical net worth / Капитал LOCF."`  
**→** `GRISO-01: Грейс side ledger — do not fold into historical NW / Капитал LOCF.`

---

### `src/lib/mcp/tools/forecast.ts` (route, request-response)

**Analog:** self

**Current closer** (lines 11–15): `"Капитал forecast overlay (Прогноз): income + A′ grace; not historical NW LOCF."`  
**→** named `INISO-01/GRISO-01: … do not fold into historical NW LOCF.` (D-09 SIDE list; no FORECAST-01).

---

### CAP tools light polish (`accounts.ts`, `net-worth.ts`, `balances.ts`, `fx.ts`)

**Analog:** self — already have `readOnlyHint` / `openWorldHint`

**Do:**
- Optional 1-line honesty clarity (e.g. accounts-only / transparency / do not multiply rates) if wording weak.
- **Do not** inject DISOL/INISO/GRISO (D-09).

**Annotation pattern to preserve** (`accounts.ts` 76–79 / `net-worth.ts` 17–20 / `balances.ts` 18–21 / `fx.ts` 22–25):
```typescript
annotations: {
  readOnlyHint: true,
  openWorldHint: false,
},
```

**FX exported description contract** (`fx.ts` 7–11) — keep `LIST_FX_RATES_DESCRIPTION` export if tests assert it.

---

### `src/lib/mcp/isolation-contract.test.ts` (test, batch)

**Analog:** self — flip Phase 25 deferred-named-prose gate

**Must flip** (lines 61–62):
```typescript
// BEFORE (Phase 25):
expect(src).not.toMatch(/DISOL-01|INISO-01|GRISO-01/);

// AFTER (Phase 26):
expect(src).toMatch(/DISOL-01/);
expect(src).toMatch(/INISO-01/);
expect(src).toMatch(/GRISO-01/);
```

**Keep** BalanceSnapshot / actions import walls (lines 21–41) and catalog asserts (43–60).

**Extend (CLI-01):** source-scan `wallet-ping.ts` for `readOnlyHint` + `openWorldHint` (same `readFileSync` + `toMatch` style as create-handler block). Optionally assert SIDE description exports contain rule ids via reading tool files.

---

### SIDE tool tests (`debts.test.ts`, `income.test.ts`, `grace.test.ts`, `forecast.test.ts`)

**Analog:** self — description contract `it` blocks

**debts.test.ts** (182–184) — update regexes:
```typescript
expect(LIST_DEBTS_DESCRIPTION).toMatch(/Side ledger \(Долги\)/);
expect(LIST_DEBTS_DESCRIPTION).toMatch(/not historical net worth/);
// → require DISOL-01 + do-not-fold / historical NW language
expect(LIST_DEBTS_DESCRIPTION).toMatch(/DISOL-01/);
expect(LIST_DEBTS_DESCRIPTION).toMatch(/not fold into historical NW|not historical/);
```

Mirror for:
- `income.test.ts` → `INISO-01`
- `grace.test.ts` → `GRISO-01`
- `forecast.test.ts` → `INISO-01` + `GRISO-01` (and keep `Прогноз` / LOCF asserts)

**Keep** `not.toHaveProperty("isolation")` payload asserts (D-11) — e.g. debts.test.ts lines 90–91.

---

### `src/lib/mcp/tools/wallet-ping.test.ts` (optional test)

**Analog:** `isolation-contract.test.ts` source-scan + `fx.test.ts` export-import style

No existing ping test file. Prefer folding annotation assert into `isolation-contract.test.ts` (RESEARCH Wave 0). If separate file:
```typescript
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("wallet_ping annotations (CLI-01)", () => {
  it("declares readOnlyHint + openWorldHint false", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/lib/mcp/tools/wallet-ping.ts"),
      "utf8",
    );
    expect(src).toMatch(/readOnlyHint:\s*true/);
    expect(src).toMatch(/openWorldHint:\s*false/);
  });
});
```

---

### `26-UAT.md` (config, request-response)

**Analog:** `.planning/milestones/v1.3-phases/22-graceiso-regression-polish/22-UAT.md` (frontmatter + Tests + Summary)

**Structure** (22-UAT lines 1–52):
```markdown
---
status: ...
phase: 26-connect-docs-policy
...
---

## Current Test
...

## Tests

### 1. ...
expected: ...
result: ...
```

**Phase 26 content deltas (D-16/D-18):**
- Dual-client **live** connect only — Claude Code + Cursor/`agent` against `http://127.0.0.1:3000/api/mcp`.
- App must be running (`npm run dev` / Docker) before smoke.
- **Do not** put these steps in README or OPERATOR.md.
- On Cursor `type: http` fail → record deferred mcp-remote note (D-19); do not invent second primary README snippet in UAT pass path.

## Shared Patterns

### MCP `registerTool` annotations
**Source:** `src/lib/mcp/tools/debts.ts` (21–24) — identical on all CAP/SIDE tools  
**Apply to:** `wallet-ping.ts` (only tool missing them)
```typescript
annotations: {
  readOnlyHint: true,
  openWorldHint: false,
},
```
Annotations are **hints only** (spec) — not authz.

### Named SIDE isolation prose (DISOL/INISO/GRISO)
**Source evolve:** SIDE tool `*_DESCRIPTION` exports + `create-handler.ts` `instructions`  
**Apply to:** debts / income / grace / forecast + matching server instruction lines  
**Rules:** 1–2 sentences; rule id required; “do not fold into historical NW / Капитал LOCF”; EN primary + existing RU aliases; **no** payload meta fields.

### AGENTS.md BEGIN/END standing prefs
**Source:** `AGENTS.md` wallet-operator (11–18)  
**Apply to:** new `wallet-mcp-parity` block only (D-13 forbids `.cursor/rules` duplicate)

### Vitest source-scan contracts
**Source:** `src/lib/mcp/isolation-contract.test.ts`  
**Apply to:** instruction rule-id presence, optional ping annotations, SIDE description exports  
**Pattern:** `readFileSync(resolve(process.cwd(), file), "utf8")` + `expect(src).toMatch(...)`

### Docs placement
**README:** connect snippets only after Quick start  
**PROJECT/AGENTS:** PARITY standing rule  
**UAT:** dual-client smoke only  
**Never:** OPERATOR.md connect smoke; README PARITY; pre-doc mcp-remote

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | All phase files have tracked analogs (self or sibling). Optional `readme-mcp.test.ts` skipped (RESEARCH: low value) — no prior README string-test pattern; use UAT for CLI-02. |

## Metadata

**Analog search scope:** `src/lib/mcp/**`, `README.md`, `AGENTS.md`, `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/milestones/**/*-UAT.md`; codegraph explore `MCP tool registerTool annotations readOnlyHint`
**Files scanned:** ~35 MCP + docs + archived UAT
**Tracked-source gate:** all named analogs verified via `git ls-files`
**Pattern extraction date:** 2026-09-11
