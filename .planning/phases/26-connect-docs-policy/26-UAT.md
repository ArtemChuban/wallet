---
status: pending
phase: 26-connect-docs-policy
source:
  - 26-01-SUMMARY.md
  - 26-02-SUMMARY.md
  - 26-03-SUMMARY.md
  - 26-04-SUMMARY.md
started: null
updated: null
---

## Current Test

[not started — run via `/gsd-verify-work`]

## Preconditions

- Wallet already running on `127.0.0.1:3000` (`npm run dev` or Docker). Do **not** start from README/OPERATOR smoke — those stay snippet/driver-only.
- Connect configs: README MCP section (Claude `type: http`; Cursor `type: http` + `url`) → `http://127.0.0.1:3000/api/mcp`.

## Tests

### 1. Claude Code live MCP connect
expected: Claude Code connects with `type: http` to `http://127.0.0.1:3000/api/mcp`; tools list includes wallet tools including `wallet_ping`
steps: |
  1. Ensure app is up on 127.0.0.1:3000.
  2. Add/connect per README: `claude mcp add --transport http wallet http://127.0.0.1:3000/api/mcp` (or equivalent config).
  3. `claude mcp list` (or client tool visibility) — server `wallet` connected.
  4. List tools — expect wallet domain tools including `wallet_ping`.
result: pending
coverage_id: D2

### 2. Cursor agent CLI live MCP connect
expected: Cursor agent CLI connects with `type: http` + `url` to `http://127.0.0.1:3000/api/mcp`; tools list includes wallet tools including `wallet_ping`
steps: |
  1. Ensure app is up on 127.0.0.1:3000.
  2. Use README Cursor snippet (`type: http`, `url: http://127.0.0.1:3000/api/mcp`) in project `.cursor/mcp.json` or user config.
  3. `agent mcp list` / list-tools — server connected.
  4. Confirm tools include `wallet_ping` and other wallet read tools.
result: pending
coverage_id: D2
deferred_on_http_fail: |
  If Cursor `type: http` fails in live UAT: record failure here and open a deferred note for remote-bridge / mcp-remote fallback.
  Do **not** invent a second primary README snippet on the pass path (D-17, D-19).

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps

[none yet]

## Notes

- Dual-client live connect is the phase done-bar (D-16). Proof lives **only** in this file — not README, not OPERATOR.md (D-18).
- No mcp-remote pre-documentation until Test 2 records a real native `type: http` failure (D-17).
