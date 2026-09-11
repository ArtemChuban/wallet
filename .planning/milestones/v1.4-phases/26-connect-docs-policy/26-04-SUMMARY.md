---
phase: 26-connect-docs-policy
plan: 04
subsystem: docs
tags: [mcp, parity, agents, uat, cli]

requires:
  - phase: 26-01
    provides: CLI-01 tracer (wallet_ping annotations + debts DISOL)
  - phase: 26-02
    provides: SIDE+CAP isolation expand
  - phase: 26-03
    provides: README Claude+Cursor connect snippets
provides:
  - AGENTS.md wallet-mcp-parity BEGIN/END standing rule (PARITY-01)
  - PROJECT Active CLI-01/02 + PARITY-01 checkboxes closed
  - REQUIREMENTS CLI/PARITY complete + Phase 26 traceability
  - 26-UAT.md dual-client live connect scaffold for verify-work
affects:
  - gsd-verify-work
  - phase-26-close

actuals:
  tokens: 1971
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - AGENTS.md BEGIN/END sibling blocks for standing agent prefs (no .cursor/rules)
    - Dual-client MCP smoke owned by phase UAT.md only

key-files:
  created:
    - .planning/phases/26-connect-docs-policy/26-UAT.md
  modified:
    - AGENTS.md
    - .planning/PROJECT.md
    - .planning/REQUIREMENTS.md
    - .planning/phases/26-connect-docs-policy/26-VALIDATION.md

key-decisions:
  - "PARITY-01 vehicle = AGENTS.md BEGIN/END only (D-12/D-13); no .cursor/rules"
  - "mcp-remote mentioned only in UAT deferred_on_http_fail — not pre-documented"
  - "Constraints MCP parity sentence retained while Active checkboxes marked [x]"

patterns-established:
  - "Pattern: standing MCP policy lives in AGENTS.md beside wallet-operator"
  - "Pattern: connect proof = 26-UAT.md dual-client; README stays snippet-only"

requirements-completed: [PARITY-01, CLI-01, CLI-02]

coverage:
  - id: D1
    description: AGENTS.md wallet-mcp-parity BEGIN/END standing rule pointing at PROJECT Constraints
    requirement: PARITY-01
    verification:
      - kind: other
        ref: "grep BEGIN:wallet-mcp-parity END:wallet-mcp-parity PARITY-01 AGENTS.md; no .cursor/rules parity file"
        status: pass
    human_judgment: false
  - id: D2
    description: PROJECT Active + REQUIREMENTS CLI-01/02 and PARITY-01 checkboxes closed; Constraints PARITY text retained
    requirement: PARITY-01
    verification:
      - kind: other
        ref: "grep [x] CLI-01/02 PARITY-01 PROJECT.md + REQUIREMENTS.md; MCP parity (PARITY-01) Constraints"
        status: pass
    human_judgment: false
  - id: D3
    description: 26-UAT.md dual-client Claude+Cursor live connect scaffold (pending verify-work)
    requirement: CLI-02
    verification: []
    human_judgment: true
    rationale: "Live connect requires external Claude Code + Cursor agent CLI against running app — deferred to /gsd-verify-work"

duration: 2min
completed: 2026-09-11
status: complete
---

# Phase 26 Plan 04: PARITY + UAT scaffold Summary

**AGENTS.md wallet-mcp-parity BEGIN/END standing rule, PROJECT/REQUIREMENTS CLI+PARITY checkboxes closed, and 26-UAT.md dual-client connect scaffold for verify-work**

## Performance

- **Duration:** 2 min
- **Started:** 2026-09-11T10:33:06Z
- **Completed:** 2026-09-11T10:35:28Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Materialized PARITY-01 as AGENTS.md `BEGIN:wallet-mcp-parity` / `END:wallet-mcp-parity` beside wallet-operator (no `.cursor/rules`)
- Marked PROJECT Active CLI-01/02 + PARITY-01 `[x]`; REQUIREMENTS PARITY-01 `[x]` + Phase 26 Complete; Constraints PARITY sentence kept
- Authored `26-UAT.md` Claude + Cursor live connect tests (results pending); VALIDATION Manual-Only rows point at it

## Task Commits

Each task was committed atomically:

1. **Task 1: AGENTS.md wallet-mcp-parity BEGIN/END block** - `bd9e1b9` (docs)
2. **Task 2: Mark PROJECT Active + REQUIREMENTS CLI/PARITY complete** - `fb2de53` (docs)
3. **Task 3: Author 26-UAT.md dual-client connect scaffold** - `83b7504` (docs)

**Plan metadata:** `aa2829e` (docs: complete plan)

## Files Created/Modified
- `AGENTS.md` — wallet-mcp-parity standing rule
- `.planning/PROJECT.md` — Active CLI/PARITY checkboxes `[x]`
- `.planning/REQUIREMENTS.md` — PARITY-01 checkbox + Complete traceability
- `.planning/phases/26-connect-docs-policy/26-UAT.md` — dual-client UAT scaffold
- `.planning/phases/26-connect-docs-policy/26-VALIDATION.md` — Manual-Only → 26-UAT.md

## Decisions Made
- Followed D-12/D-13: AGENTS only for parity vehicle
- Followed D-17/D-19: mcp-remote only in UAT deferred-on-fail note
- CLI-01/02 REQUIREMENTS checkboxes were already `[x]` from prior plans; Task 2 closed PARITY-01 + PROJECT Active rows

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 26 plans complete pending `/gsd-verify-work` dual-client smoke (`26-UAT.md` Tests 1–2)
- No README/OPERATOR smoke bleed; connect snippets remain README-only

---
*Phase: 26-connect-docs-policy*
*Completed: 2026-09-11*

## Self-Check: PASSED
