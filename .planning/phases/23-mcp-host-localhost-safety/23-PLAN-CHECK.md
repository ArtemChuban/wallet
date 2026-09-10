# Phase 23 Plan Check

**Checked:** 2026-09-10
**Plans:** 23-01, 23-02
**Gate:** Revision (gsd-plan-checker)
**Verdict:** ISSUES FOUND — 1 blocker, 2 warnings

## Goal (ROADMAP)

Running wallet exposes in-process Streamable HTTP MCP on localhost only — same Next lifecycle, no sidecar.

**Requirements:** HOST-01, HOST-02

### Coverage Summary

| Requirement | Plans | Status |
|-------------|-------|--------|
| HOST-01 | 01, 02 | Covered |
| HOST-02 | 01, 02 | Covered |

### ROADMAP success criteria → tasks

| Criterion | Coverage |
|-----------|----------|
| `/api/mcp` in-process, no sidecar/spawn | 02 tracer + prohibitions |
| Curl/Inspector initialize on loopback | 02 smoke (D-13); Inspector optional |
| Non-localhost Host/Origin rejected | 02 guard + Vitest matrix |
| Compose `127.0.0.1:3000:3000` | 02 checklist (D-14); unchanged |

### Plan Summary

| Plan | Tasks | Files | Wave | depends_on | Status |
|------|-------|-------|------|------------|--------|
| 01 | 3 | 5 | 1 | [] | Structure valid; SUS gate + Wave 0 + install |
| 02 | 3 | 7 | 2 | ["23-01"] | Structure valid; tracer → expand → smoke |

Estimates: 01 = 20k / budget 100k (ok); 02 = 45k / budget 100k (ok). Confidence high (n=8).

---

## Dimension results

| # | Dimension | Result |
|---|-----------|--------|
| 1 | Requirement coverage | PASS — HOST-01/02 in both frontmatters; tasks map |
| 2 | Task completeness | PASS — files/action/verify/done (checkpoint N/A files); read_first + acceptance_criteria + fails_when present |
| 3 | Dependency correctness | PASS — `23-01`→`23-02` acyclic; wave 1→2; phase-plan-index resolves |
| 3b | Undeclared coupling | PASS — different waves |
| 4 | Key links planned | PASS — guard→fetch, SDK createMcpHandler+responseMode, wallet_ping only |
| 5 | Scope sanity | PASS — 3 tasks/plan; ≤7 files; estimates in budget |
| 6 | Verification derivation | PASS — user-observable truths; artifacts + key_links |
| 7 | Context compliance | PASS — D-01…D-16 referenced; deferred (CAP/SIDE/CLI/DISOL) excluded; anti-spawn in prohibitions |
| 7b | Scope reduction | PASS — no silent v1/static/stub-of-decision; Wave 0 `it.todo` intentional |
| 7c | Architectural tier | PASS — route/guard Frontend Server; ping in-process; Compose deploy-only |
| 8 | Nyquist | PASS — VALIDATION.md exists; Wave 0 stubs in 01; all tasks `<automated>`; no watch; sampling continuous; fails_when stated (probe not injected → 8f presence judged from plans) |
| 9 | Cross-plan data contracts | PASS — 01 deps/stubs → 02 SDK create + green tests; no conflicting transforms |
| 10 | .cursor/rules/ | SKIPPED (no `.cursor/rules/`); AGENTS.md Next-docs hint → warning below |
| 11 | Research resolution | **FAIL** — see blocker |
| 12 | Pattern compliance | PASS w/ warning — PATTERNS.md in read_first; stubs cite health/account-type; create-handler/wallet-ping analogs weakly named in action |

### Extra gates (user prompt)

| Gate | Result |
|------|--------|
| threat_model present | PASS (both plans; T-23-01…05 + T-23-SC) |
| prohibitions | PASS (isolation/scope anti-goals) |
| artifacts section | PASS (phase + plan) |
| RESEARCH: SDK createMcpHandler not mcp-handler create for responseMode | PASS (01 SUS ack + 02 interface/action) |
| tracer-first shape | PASS (01 foundation → 02 tracer → expand → curl/Compose) |

---

## Dimension 8: Nyquist Compliance

| Task | Plan | Wave | Automated Command | Failing Direction | Status |
|------|------|------|-------------------|-------------------|--------|
| SUS checkpoint | 01 | 1 | RESEARCH exists + mcp-handler token | RESEARCH missing / token absent | ✅ |
| Wave 0 stubs | 01 | 1 | vitest stub files | missing files / non-zero / hard-fail | ✅ |
| Install deps | 01 | 1 | package.json + node_modules assert | dep/^2 missing | ✅ |
| Tracer | 02 | 2 | file markers + vitest | missing markers / vitest fail | ✅ |
| Expand matrix | 02 | 2 | vitest MCP files | non-zero / remaining todos | ✅ |
| Curl + Compose | 02 | 2 | compose grep + no CORS + npm test (+ human curl) | compose/CORS/suite fail | ✅ |

Sampling: Wave 1 3/3; Wave 2 3/3 → ✅  
Wave 0: localhost-guard.test.ts + route.test.ts planned in 01 → ✅  
Failing directions: stated on all runnable verifies → ✅  
Overall: ✅ PASS (Dim 8); Dim 11 still fails phase

---

## ISSUES FOUND

**Phase:** 23-mcp-host-localhost-safety  
**Plans checked:** 2  
**Issues:** 1 blocker(s), 2 warning(s), 0 info

### Blockers (must fix)

**1. [research_resolution] RESEARCH.md Open Questions not marked resolved**
- Plan: null (phase research)
- File: `23-RESEARCH.md`
- Unresolved (formal): missing Host port; mcp-handler install vs import; 403 JSON schema
- Note: Recommendations + plan `<assumptions>` A1–A3 already lock answers; marker hygiene only
- Fix: Rename to `## Open Questions (RESOLVED)` and mark each item `RESOLVED: …` (A1 reject missing port; install both / SDK create; `{ error, reason }` body)

### Warnings (should fix)

**1. [pattern_compliance] Plan 02 tracer action weak-cites PATTERNS analogs for create-handler / wallet-ping**
- Plan: 02
- Task: tracer
- Expected: name `src/lib/db.ts` (factory) and/or `src/lib/validations/balance.ts` (zod tool) / RESEARCH Patterns 1–2 for No-Analog MCP mount
- Fix: One sentence in `<action>` or `<read_first>` naming those analogs (PATTERNS already in read_first)

**2. [claude_md_compliance] AGENTS.md Next docs not in Plan 02 read_first**
- Plan: 02
- Task: tracer (route.ts)
- Rule: read `node_modules/next/dist/docs/` before route/runtime code
- Fix: Add relevant Next route/runtime doc path to `<read_first>`

### Structured Issues

```yaml
issues:
  - dimension: research_resolution
    severity: blocker
    plan: null
    description: "23-RESEARCH.md ## Open Questions lacks (RESOLVED) suffix and inline RESOLVED markers (missing Host port; mcp-handler install vs import; 403 schema)"
    fix_hint: "Mark section ## Open Questions (RESOLVED) and each item RESOLVED per A1–A3 already assumed in plans"
  - dimension: pattern_compliance
    severity: warning
    plan: "02"
    task: 1
    description: "Tracer action does not name PATTERNS analogs for create-handler.ts / wallet-ping.ts"
    fix_hint: "Cite db.ts / validations/balance.ts or RESEARCH Patterns 1–2 in action"
  - dimension: claude_md_compliance
    severity: warning
    plan: "02"
    task: 1
    description: "Plan 02 tracer omits Next dist docs from read_first despite AGENTS.md"
    fix_hint: "Add node_modules/next/dist/docs/… route handler doc to read_first"
```

### Recommendation

1 blocker — revise RESEARCH.md Open Questions markers (plans themselves already encode resolutions). Optional: tighten Plan 02 read_first/action for patterns + Next docs. Re-run plan-checker after RESEARCH edit.
