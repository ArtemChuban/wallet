---
phase: 26-connect-docs-policy
plan: 03
subsystem: docs
tags: [mcp, README, CLI-02, Claude, Cursor, connect]

requires:
  - phase: 23-mcp-host-localhost-safety
    provides: loopback MCP URL http://127.0.0.1:3000/api/mcp
provides:
  - README English MCP section after Quick start with Claude + Cursor type http + url snippets
affects:
  - 26-04 dual-client UAT / verify-work
  - CLI-02 completion

actuals:
  tokens: 228
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - README-only MCP connect snippets (Claude --transport http / type http; Cursor type http + url)

key-files:
  created: []
  modified:
    - README.md

key-decisions:
  - "Shipped both Claude CLI add and JSON mcpServers; Cursor uses identical type http + url JSON"
  - "No mcp-remote / streamable-http / smoke / PARITY in README (D-02/D-14/D-17)"

patterns-established:
  - "Pattern 2: README MCP section between Quick start and Host data contract"

requirements-completed: [CLI-02]

coverage:
  - id: D1
    description: README MCP section after Quick start with Claude and Cursor type http + url for loopback /api/mcp
    requirement: CLI-02
    verification:
      - kind: other
        ref: python3 assert section order + 127.0.0.1:3000/api/mcp + type http
        status: pass
    human_judgment: false
  - id: D2
    description: README MCP slice free of smoke/ping/tools-list/PARITY tokens
    requirement: CLI-02
    verification:
      - kind: other
        ref: python3 banned-token scan on MCP→Host data contract slice
        status: pass
    human_judgment: false

duration: 4min
completed: 2026-09-11
status: complete
---

# Phase 26 Plan 03: README MCP Connect Docs Summary

**English README MCP section after Quick start with Claude `--transport http` / `type: http` and Cursor `type: http` + `url` for `http://127.0.0.1:3000/api/mcp` — connect snippets only.**

## Performance

- **Duration:** 4min
- **Started:** 2026-09-11T10:25:48Z
- **Completed:** 2026-09-11T10:30:00Z
- **Tasks:** 2/2
- **Files modified:** 1

## Accomplishments

- Inserted `## MCP (Claude Code / Cursor)` between Quick start and Host data contract
- Documented prerequisite: wallet already on `127.0.0.1:3000`
- Claude: `claude mcp add --transport http` plus JSON `type`/`url`; Cursor: `.cursor/mcp.json` same shape
- Hygiene pass: no smoke, ping, tools/list, PARITY, mcp-remote, or streamable-http

## Task Commits

1. **Task 1: Insert English README MCP section after Quick start** - `4c12c82` (docs)
2. **Task 2: Guard README MCP section against smoke and policy bleed** - verify-only (no diff; already clean)

**Plan metadata:** `96fd3ae` (docs: complete plan)

## Files Created/Modified

- `README.md` — MCP connect section with Claude + Cursor copy-paste configs

## Decisions Made

- Both Claude CLI one-liner and JSON block shipped (discretion within D-06)
- Cursor primary snippet keeps `"type": "http"` + `"url"` despite official url-only examples (D-06 / D-19)

## Deviations from Plan

None - plan executed exactly as written.

Task 2 required no file edits after Task 1 already met hygiene bans.

## Auth Gates

None.

## Known Stubs

None.

## Threat Flags

None — documented URL remains `127.0.0.1` only (T-26-07 mitigated); no streamable-http / remote-bridge (T-26-08).

## Self-Check: PASSED

- FOUND: README.md MCP section
- FOUND: 4c12c82
