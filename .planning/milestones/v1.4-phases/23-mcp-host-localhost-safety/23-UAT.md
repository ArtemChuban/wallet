---
status: complete
phase: 23-mcp-host-localhost-safety
source:
  - 23-01-SUMMARY.md
  - 23-02-SUMMARY.md
started: "2026-09-11T10:51:00Z"
updated: "2026-09-11T10:54:00Z"
---

## Current Test

[testing complete]

## Tests

### 1. mcp-handler SUS legitimacy (human gate)
expected: Human confirmed mcp-handler@^2 legitimacy; install-only while SDK owns responseMode
result: pass
source: prior_human
coverage_id: D1
notes: Approved in Plan 01 SUMMARY key-decisions / resume-signal before install

### 2. Wave 0 Vitest stubs green
expected: localhost-guard Host/Origin/port matrix + /api/mcp route smoke pass
result: pass
source: automated
coverage_id: D2

### 3. package.json MCP deps present
expected: mcp-handler@^2 and @modelcontextprotocol/server@^2 with node_modules present
result: pass
source: automated
coverage_id: D3

### 4. In-process /api/mcp Streamable HTTP + wallet tools
expected: initialize returns serverInfo wallet-mcp 1.4.0; tools/list includes wallet_ping
result: pass
source: automated
coverage_id: D1
evidence: |
  2026-09-11T10:51Z curl Host 127.0.0.1:3000 → SSE initialize ok;
  tools/list includes wallet_ping (+ CAP/SIDE tools from later phases)

### 5. Localhost guard rejects non-loopback
expected: Host evil.example:3000 → HTTP 403 reason bad_host
result: pass
source: automated
coverage_id: D2
evidence: "2026-09-11T10:51Z curl → 403 {\"error\":\"Forbidden\",\"reason\":\"bad_host\"}"

### 6. Compose loopback publish + curl harvest
expected: docker-compose publishes 127.0.0.1:3000:3000; initialize UAT harvest ok
result: pass
coverage_id: D3
evidence: |
  grep L5 match; live initialize + tools/list + bad_host 403 confirmed agent-driven 2026-09-11

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none]
