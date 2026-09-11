---
phase: 26-connect-docs-policy
verified: 2026-09-11T10:39:54Z
status: human_needed
score: 8/8 must-haves verified
behavior_unverified: 0
overrides_applied: 0
decision_coverage:
  honored: 19
  total: 19
  not_honored: []
unverified_prohibitions:
  - "MUST NOT add isolation fields on tool JSON payloads — LLM-judge: held (payload not.toHaveProperty isolation in SIDE tests); human review recommended"
  - "MUST NOT put connect smoke in README/OPERATOR; MUST NOT create docs/mcp.md; MUST NOT .cursor/rules PARITY duplicate; MUST NOT pre-document mcp-remote — LLM-judge: held via grep; human review recommended"
human_verification:
  - test: "Claude Code live MCP connect per 26-UAT.md Test 1"
    expected: "Claude connects with type http to http://127.0.0.1:3000/api/mcp; tools list includes wallet_ping"
    why_human: "Live dual-client connect (D-16) needs real CLI + running app; cannot prove from source/docs alone. 26-UAT status pending."
  - test: "Cursor agent CLI live MCP connect per 26-UAT.md Test 2"
    expected: "Cursor connects with type http + url to same MCP URL; tools include wallet_ping. On native http fail: record + defer mcp-remote (D-17/D-19), do not invent second primary README snippet"
    why_human: "External Cursor MCP client behavior; UAT scaffold only (result: pending)."
---

# Phase 26: Connect Docs + Policy Verification Report

**Phase Goal:** Claude Code / Cursor CLI can connect with copy-paste configs; tools declare read-only + isolation; PARITY standing rule is project-visible
**Verified:** 2026-09-11T10:39:54Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | Every shipped MCP tool declares `readOnlyHint`; DISOL/INISO/GRISO named isolation in server instructions + SIDE tool descriptions (roadmap SC1 / CLI-01; D-07…D-10) | ✓ VERIFIED | All 9 tool files under `src/lib/mcp/tools/*.ts` have `readOnlyHint: true` + `openWorldHint: false`. `create-handler.ts` instructions contain DISOL-01, INISO-01, GRISO-01. SIDE: debts/income/grace/forecast descriptions carry named do-not-fold prose. `isolation-contract.test.ts` asserts named-rule presence + ping annotations (11/11 pass). |
| 2 | Docs show Claude Code (`type: http`) and Cursor (`type: http` + `url`) copy-paste configs for `http://127.0.0.1:3000/api/mcp` with app-already-running prerequisite (roadmap SC2 / CLI-02) | ✓ VERIFIED | README `## MCP` sits after Quick start, before Host data contract. Prerequisite one-liner; Claude CLI + JSON; Cursor JSON; both `"type": "http"` + url. |
| 3 | PARITY-01 materialized as standing project constraint/rule (roadmap SC3) | ✓ VERIFIED | `AGENTS.md` `BEGIN:wallet-mcp-parity`…`END:wallet-mcp-parity` points at PROJECT Constraints; PROJECT Constraints retain MCP parity (PARITY-01) sentence. |
| 4 | CAP tool descriptions stay free of SIDE isolation rule ids; light honesty polish only (D-09) | ✓ VERIFIED | accounts/net-worth/balances/fx/wallet-ping have zero DISOL-01/INISO-01/GRISO-01 matches; CAP copy keeps accounts-only / do-not-multiply-rates honesty. |
| 5 | Full `src/lib/mcp` vitest suite green including isolation-contract | ✓ VERIFIED | `npx vitest run src/lib/mcp` → 12 files, **67/67 passed**. |
| 6 | PROJECT Active CLI-01/02 + PARITY-01 checkboxes done; REQUIREMENTS CLI/PARITY Complete + Phase 26 traceability (D-15) | ✓ VERIFIED | PROJECT Active `[x]` CLI-01/02 + PARITY-01; REQUIREMENTS `[x]` + trace table Phase 26 Complete. |
| 7 | `26-UAT.md` documents dual-client live connect only — not README/OPERATOR smoke (D-16, D-18) | ✓ VERIFIED | UAT file exists with Claude + Cursor live steps; README/OPERATOR have no connect smoke procedures. **Live results still `pending`.** |
| 8 | README MCP section has no smoke/ping/tools-list steps, no PARITY, no mcp-remote / streamable-http (D-02, D-14, D-17) | ✓ VERIFIED | Python slice check: no PARITY, mcp-remote, streamable-http, wallet_ping, tools/list in MCP section. |

**Score:** 8/8 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ------ | ------ | ------- |
| `src/lib/mcp/tools/wallet-ping.ts` | CLI-01 annotations | ✓ VERIFIED | readOnlyHint true, openWorldHint false |
| `src/lib/mcp/create-handler.ts` | Named DISOL/INISO/GRISO instructions | ✓ VERIFIED | Short SIDE sentences with rule ids |
| `src/lib/mcp/tools/debts.ts` | DISOL-01 description | ✓ VERIFIED | LIST_DEBTS_DESCRIPTION |
| `src/lib/mcp/isolation-contract.test.ts` | Presence contracts | ✓ VERIFIED | Flipped from Phase 25 absence asserts |
| `src/lib/mcp/tools/income.ts` | INISO-01 | ✓ VERIFIED | LIST_INCOME_DESCRIPTION |
| `src/lib/mcp/tools/grace.ts` | GRISO-01 | ✓ VERIFIED | LIST_GRACE_OBLIGATIONS_DESCRIPTION |
| `src/lib/mcp/tools/forecast.ts` | INISO-01/GRISO-01 | ✓ VERIFIED | No FORECAST-01 invented |
| `README.md` | Claude + Cursor snippets | ✓ VERIFIED | Section order + URL |
| `AGENTS.md` | wallet-mcp-parity block | ✓ VERIFIED | Beside wallet-operator |
| `.planning/PROJECT.md` | Active checkboxes + Constraints | ✓ VERIFIED | CLI/PARITY closed |
| `.planning/REQUIREMENTS.md` | CLI/PARITY complete | ✓ VERIFIED | Traceability table |
| `26-UAT.md` | Dual-client UAT scaffold | ✓ VERIFIED | status: pending — scaffold only |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `isolation-contract.test.ts` | `create-handler.ts` instructions | toMatch DISOL-01/INISO-01/GRISO-01 | ✓ WIRED | Manual: asserts present; suite green (gsd path-form key_links failed — non-path `from`) |
| `wallet-ping.ts` | ToolAnnotations | readOnlyHint + openWorldHint false | ✓ WIRED | Source + isolation-contract D-10 test |
| `LIST_INCOME_DESCRIPTION` | agent honesty | INISO-01 sentence | ✓ WIRED | income.ts + income.test assert |
| `LIST_GRACE_OBLIGATIONS_DESCRIPTION` | agent honesty | GRISO-01 | ✓ WIRED | grace.ts + grace.test |
| `GET_FORECAST_OVERLAY_DESCRIPTION` | overlay membership | INISO-01/GRISO-01 | ✓ WIRED | forecast.ts + forecast.test |
| README MCP section | `http://127.0.0.1:3000/api/mcp` | copy-paste configs | ✓ WIRED | Both client snippets |
| `AGENTS.md` wallet-mcp-parity | PROJECT Constraints PARITY-01 | standing rule | ✓ WIRED | Block cites `.planning/PROJECT.md` Constraints |
| `26-UAT.md` | MCP URL | Claude + Cursor live connect | ✓ WIRED (scaffold) | Steps reference URL; **results pending** |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| README MCP snippets | static docs | authoring | N/A (docs) | ✓ FLOWING (static contract) |
| Tool descriptions | DESCRIPTION constants | source exports → registerTool | Agent-facing copy | ✓ FLOWING |
| create-handler instructions | instructions string | createMcpHandler | Server instructions | ✓ FLOWING |
| PARITY AGENTS block | standing text | AGENTS.md | Agent-visible rule | ✓ FLOWING |

No hollow UI data paths in this phase (docs/policy + annotation copy).

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| isolation-contract + ping annotations | `npx vitest run src/lib/mcp/isolation-contract.test.ts` | 11/11 passed | ✓ PASS |
| debts DISOL description | `npx vitest run …/debts.test.ts -t "list_debts description has D-08"` | 1 passed | ✓ PASS |
| Full mcp suite | `npx vitest run src/lib/mcp` | 67/67 passed | ✓ PASS |
| README section order/URL | python3 assert qs < mcp < host + URL + type http | README MCP section OK | ✓ PASS |
| Dual-client live connect | (needs running app + Claude/Cursor) | 26-UAT pending | ? SKIP → human |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No phase-declared `probe-*.sh` | SKIPPED |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| CLI-01 | 26-01, 26-02, 26-04 | readOnlyHint + DISOL/INISO/GRISO in descriptions | ✓ SATISFIED | Annotations on all tools; named SIDE + handler prose; tests green |
| CLI-02 | 26-03, 26-04 | Docs Claude/Cursor connect configs | ✓ SATISFIED (docs) | README MCP section. **Live connect UAT pending** — see Human Verification |
| PARITY-01 | 26-04 | Standing rule new read surface → MCP tools same phase | ✓ SATISFIED | AGENTS block + PROJECT Constraints + Active `[x]` |

No orphaned Phase 26 requirements outside plans.

### Decision Coverage

All trackable CONTEXT.md decisions honored by shipped artifacts (19/19). Non-blocking gate.

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| isolation-contract.test.ts | CLI-01 | 11 | 0 | no | Value (toMatch rule ids / annotations) | PASS |
| debts/income/grace/forecast *.test.ts | CLI-01 | description asserts embedded | 0 skip markers | no | Value | PASS |
| Full src/lib/mcp | CLI-01 | 67 | 0 | no | Mixed behavioral + value | PASS |

**Disabled tests on requirements:** 0
**Circular patterns detected:** 0
**Insufficient assertions:** 0 (description contracts are value-level; live client connect is UAT, not unit)

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No TBD/FIXME/XXX in phase MCP sources | — | — |
| 26-UAT.md | frontmatter | status: pending; both tests result: pending | ⚠️ Warning | Done-bar D-16 not live-proven |

### Human Verification Required

### 1. Claude Code live MCP connect

**Test:** Ensure app on `127.0.0.1:3000`. Add per README (`claude mcp add --transport http wallet http://127.0.0.1:3000/api/mcp`). List server/tools.
**Expected:** Server connected; tools include `wallet_ping` and wallet read tools.
**Why human:** Live CLI + MCP session; 26-UAT Test 1 still `pending`.

### 2. Cursor agent CLI live MCP connect

**Test:** Install README Cursor snippet (`type: http` + `url`) in `.cursor/mcp.json` or user mcp.json. `agent mcp list` / list-tools.
**Expected:** Connected; tools include `wallet_ping`. On native http fail: record in UAT + defer mcp-remote — do not ship second primary README snippet (D-17/D-19).
**Why human:** External Cursor client; 26-UAT Test 2 still `pending`.

### Gaps Summary

No code/docs gaps for roadmap success criteria or plan must-haves. Phase goal’s **automated** contract holds.

**Blocking only for phase close / D-16 done-bar:** dual-client live UAT in `26-UAT.md` (both tests pending). Not a `gaps_found` code miss — routes to `human_needed`.

Next: run `/gsd-verify-work` UAT path (or agent-driven per OPERATOR) against Tests 1–2; mark 26-UAT results; then re-verify if desired.

---

_Verified: 2026-09-11T10:39:54Z_
_Verifier: Claude (gsd-verifier)_
