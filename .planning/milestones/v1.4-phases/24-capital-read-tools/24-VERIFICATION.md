---
phase: 24-capital-read-tools
verified: 2026-09-10T16:20:30Z
status: passed
score: 9/9 must-haves verified
behavior_unverified: 0
overrides_applied: 0
decision_coverage:
  honored: 16
  total: 16
  not_honored: []
behavior_unverified_items: []
human_verification: []
---

# Phase 24: Capital Read Tools Verification Report

**Phase Goal:** External agent can read accounts, net worth, balances, and FX via MCP with the same honesty as Капитал UI
**Verified:** 2026-09-10T16:20:30Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | ------- | ---------- | -------------- |
| 1 | Agent can list accounts with types, currencies, and credit metadata via MCP | ✓ VERIFIED | `registerListAccounts` → `list_accounts`; `loadListAccounts` + `serializeListAccountsPayload` emit type/currencyCode/currencyScale/creditLimitMinor string\|null/isCredit; vitest CAP-01 value asserts; wired in `create-handler.ts` |
| 2 | Agent can get net worth as-of a date via MCP with partial-FX honesty (missing rates surfaced, not invented) | ✓ VERIFIED | `loadNetWorthAsOf` → `firstHitLocfMap` + `computeNetWorthRows` (same as `page.tsx`); serialize keeps `isPartial`/`excludeReason`; vitest: missing FX → `no_fx` + partial, no invented primary; `registerGetNetWorth` |
| 3 | Agent can get an account's native and primary balance as-of a date via MCP | ✓ VERIFIED | `loadAccountBalanceAsOf` → `getBalanceAsOf`/`getRateAsOf` + `convertOtherMinorToPrimaryMinor`; D-11: missing FX → `conversionOk: false`, primary null; vitest balances suite; `registerGetAccountBalance` |
| 4 | Agent can list FX rates / rate-as-of (primary↔other) via MCP | ✓ VERIFIED | `loadFxRatesAsOf` LOCF via `firstHitLocfMap`; `rateScale: 8` + string rates; null LOCF kept; currencyCode filter; `LIST_FX_RATES_DESCRIPTION` forbids convert; vitest CAP-04; `registerListFxRates` |
| 5 | Money/FX JSON uses string minors/rates + scale (D-09) | ✓ VERIFIED | `minorToJson`/`rateToJson` in serialize; CAP payloads pair strings with scale/primaryScale/rateScale; serialize.test + tool tests assert `typeof … === "string"` |
| 6 | Omitted asOf → `calendarDateToday("Europe/Moscow")`; garbage YYYY-MM-DD rejected (D-05/06/08) | ✓ VERIFIED | `as-of.ts` + as-of.test; NW/balances/fx tools use `optionalAsOfSchema` + `resolveAsOf` |
| 7 | Empty / missing data → success empty/zero + honesty flags, not tool error (D-07) | ✓ VERIFIED | Empty accounts `[]`; empty NW total `"0"`; unknown accountId soft `account_not_found`; empty FX `rates: []` — all success payloads in tests |
| 8 | Four CAP tools + `wallet_ping` registered; `readOnlyHint: true`; capital-era instructions (D-01/13/15) | ✓ VERIFIED | `create-handler.ts` registers all five; instructions name tools + accounts-only NW + FX not converter; each CAP tool has `readOnlyHint: true` / `openWorldHint: false` |
| 9 | HOST localhost-guard + MCP route regression still green | ✓ VERIFIED | Guard + route vitest pass (10); compose still `127.0.0.1:3000:3000`; route still guard→`mcp.fetch`; no Host/Origin policy widen |

**Score:** 9/9 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | ----------- | ------ | ------- |
| `src/lib/mcp/serialize.ts` | BigInt/null JSON helpers | ✓ VERIFIED | `minorToJson` / `rateToJson`; tests green |
| `src/lib/mcp/as-of.ts` | optionalAsOf + resolveAsOf | ✓ VERIFIED | zod YYYY-MM-DD; Moscow today |
| `src/lib/mcp/reads/load-net-worth-asof.ts` | page-parity NW assembler | ✓ VERIFIED | prisma LOCF batch → `computeNetWorthRows` → serialize |
| `src/lib/mcp/tools/net-worth.ts` | `get_net_worth` | ✓ VERIFIED | thin register + resolveAsOf |
| `src/lib/mcp/tools/accounts.ts` | `list_accounts` | ✓ VERIFIED | metadata-only serialize + prisma findMany |
| `src/lib/mcp/reads/load-account-balance-asof.ts` | balance + convert honesty | ✓ VERIFIED | assemble + domain getBalance/getRate |
| `src/lib/mcp/tools/balances.ts` | `get_account_balance` | ✓ VERIFIED | register + resolveAsOf |
| `src/lib/mcp/reads/load-fx-rates-asof.ts` | FX LOCF snapshot | ✓ VERIFIED | non-primary currencies + null honesty |
| `src/lib/mcp/tools/fx.ts` | `list_fx_rates` | ✓ VERIFIED | D-03 description export + register |
| `src/lib/mcp/create-handler.ts` | full CAP catalog + D-15 text | ✓ VERIFIED | 5 registers; capital-era instructions |

**Artifacts:** 10/10 verified (exists + substantive + wired)

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | --- | --- | ------ | ------- |
| `create-handler.ts` | four CAP registers + ping | direct calls | ✓ WIRED | L28–32; codegraph callers of `createWalletMcpHandler` → `route.ts` |
| `registerGetNetWorth` | `loadNetWorthAsOf` | handler | ✓ WIRED | codegraph: calls resolveAsOf + loadNetWorthAsOf |
| `loadNetWorthAsOf` | `computeNetWorthRows` | LOCF batch inputs | ✓ WIRED | codegraph callees include computeNetWorthRows + firstHitLocfMap |
| `registerGetAccountBalance` | `loadAccountBalanceAsOf` | handler | ✓ WIRED | balances.ts → reads assembler |
| `loadAccountBalanceAsOf` | `convertOtherMinorToPrimaryMinor` | when FX present | ✓ WIRED | assemble path; getBalanceAsOf/getRateAsOf callees |
| `registerListAccounts` | `prisma.account.findMany` | loadListAccounts | ✓ WIRED | include currency; isCreditType |
| `registerListFxRates` | `loadFxRatesAsOf` | firstHitLocfMap | ✓ WIRED | FxRate `lte` asOf |
| `resolveAsOf` | CAP asOf tools | optional input | ✓ WIRED | net-worth, balances, fx |

**Wiring:** 8/8 (gsd `verify.key-links` false-negatives: plan `from:` symbols not paths — manual/codegraph used)

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `list_accounts` | `accounts[]` | `prisma.account.findMany` | Live catalog when tool runs | ✓ FLOWING |
| `get_net_worth` | `totalPrimaryMinor` / rows | LOCF snapshots/rates + `computeNetWorthRows` | Same honesty path as Капитал page | ✓ FLOWING |
| `get_account_balance` | native/primary minors | `getBalanceAsOf` + `getRateAsOf` + convert | Real LOCF; null primary on missing FX | ✓ FLOWING |
| `list_fx_rates` | `rates[]` | FxRate LOCF map | Real rates or null fields | ✓ FLOWING |
| Adapter unit tests | fixtures | pure serialize/assemble | Prove contracts without SQLite | ✓ FLOWING (oracle = domain math) |

No hollow props / static empty stubs on production paths.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| Full MCP tree | `npx vitest run src/lib/mcp src/app/api/mcp` | 37 passed / 0 failed | ✓ PASS |
| CAP honesty suites | vitest accounts/net-worth/balances/fx (+ serialize/as-of) | included in 37 | ✓ PASS |
| HOST regression | `vitest localhost-guard + route` | 10 passed (subset of 37) | ✓ PASS |
| Tool name registration | grep `registerTool("` under `tools/` | list_accounts, get_net_worth, get_account_balance, list_fx_rates, wallet_ping | ✓ PASS |
| Live tools/list curl | needs `:3000` | not run (no server start in verify) | ? SKIP — registration proven statically; Phase 23 already proved transport |

### Probe Execution

| Probe | Command | Result | Status |
| ----- | ------- | ------ | ------ |
| — | — | No phase probes declared | N/A |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ---------- | ----------- | ------ | -------- |
| CAP-01 | 24-01, 24-03 | List accounts + credit metadata | ✓ SATISFIED | accounts tool + tests; REQUIREMENTS.md checkbox still unchecked (doc drift) |
| CAP-02 | 24-01, 24-02 | NW as-of + partial FX honesty | ✓ SATISFIED | load-net-worth-asof + tests; checkbox unchecked in REQUIREMENTS |
| CAP-03 | 24-01, 24-03 | Native + primary balance as-of | ✓ SATISFIED | balances path + conversionOk tests; checkbox unchecked |
| CAP-04 | 24-01, 24-04 | FX rates as-of | ✓ SATISFIED | fx tool + tests; REQUIREMENTS marked Complete |

**Orphaned requirements:** none for Phase 24 (CAP-01…04 all claimed by plans).

### Decision Coverage

All trackable CONTEXT.md decisions are honored by shipped artifacts. (16/16 honored, 0 not_honored — non-blocking gate)

### Test Quality Audit

| Test File | Linked Req | Active | Skipped | Circular | Assertion Level | Verdict |
|-----------|-----------|--------|---------|----------|-----------------|---------|
| `tools/accounts.test.ts` | CAP-01 | 3 | 0 | no | Value (keys + string creditLimit) | PASS |
| `tools/net-worth.test.ts` | CAP-02 | 4 | 0 | no | Behavioral (parity w/ computeNetWorthRows) | PASS |
| `tools/balances.test.ts` | CAP-03 | 4 | 0 | no | Value (conversionOk / account_not_found) | PASS |
| `tools/fx.test.ts` | CAP-04 | 5 | 0 | no | Value + description contract | PASS |
| `serialize.test.ts` / `as-of.test.ts` | D-09/05–08 | all | 0 | no | Value | PASS |

**Disabled tests on requirements:** 0
**Circular patterns detected:** 0 (NW tests use shared `computeNetWorthRows` as intentional oracle — same domain function as UI, not a capture script)
**Insufficient assertions:** 0 blockers; note: no integration test invokes `registerTool` handlers against live prisma — adapters + domain libs covered; acceptable for this phase

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| — | — | No TBD/FIXME/XXX in `src/lib/mcp` | — | — |
| — | — | No side-ledger / convert_fx tools | — | Prohibitions held |
| — | — | No mutate/action imports under mcp | — | Read-only surface |
| `.planning/REQUIREMENTS.md` | CAP-01…03 | Checkboxes still Pending while code ships | ℹ️ Info | Doc hygiene; not a code gap |

### Prohibitions (judgment / code scan)

| Statement | Status | Evidence |
| --------- | ------ | -------- |
| MUST NOT register side-ledger MCP tools | held | Only five tools under `tools/` |
| MUST NOT expose convert_fx / agent multiply API | held | No convert tool; FX description forbids |
| MUST NOT widen localhost Host/Origin | held | Guard + compose unchanged; tests green |
| MUST NOT reimplement computeNetWorthRows in tool | held | Single call site in load-net-worth-asof |
| MUST NOT invent FX when missing | held | null rate → excludeReason / conversionOk false |
| MUST NOT return live available/debt from list_accounts | held | Key-set test; no LOCF amounts |
| MUST NOT add CI mutate-import ban / new npm pkgs | held | D-16 defer; deps unchanged set |

### Human Verification

N/A — Infrastructure/API MCP adapter phase. Success criteria verified by adapter vitest + static registration wiring + HOST regression. No user-facing UI UAT required for phase gate.

Optional (VALIDATION manual, non-blocking): live `tools/list` when app up; spot-compare MCP NW total vs Капитал UI for same asOf.

### Gaps Summary

None. Phase goal achieved in codebase: four CAP read tools + ping on Streamable HTTP MCP with Капитал honesty contracts.

---

_Verified: 2026-09-10T16:20:30Z_
_Verifier: Claude (gsd-verifier)_
