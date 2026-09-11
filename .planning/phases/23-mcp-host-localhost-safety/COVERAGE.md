# API Coverage — Phase 23

External surface: Model Context Protocol via `@modelcontextprotocol/server` (create path) and `mcp-handler@^2` (install-only peer/docs).

| capability | decision | reason |
| --- | --- | --- |
| Streamable HTTP MCP (`createMcpHandler`, json) | INTEGRATE | HOST-01 — in-process `/api/mcp`; same Next lifecycle, no sidecar |
| Tool registration (`wallet_ping` tracer) | INTEGRATE | Phase 23 ships ping-only; later phases add CAP/SIDE on same handler |
| mcp-handler create / SSE responseMode path | OPT-OUT | Upstream gap: create path does not forward `responseMode: json`; keep install-only |
| Remote / non-loopback MCP client access | OPT-OUT | HOST-02 — localhost Host/Origin/port guard; Compose `127.0.0.1:3000:3000` |
| OAuth / auth middleware for MCP | OPT-OUT | Local-only v1.4; no auth surface this phase |
| Third-party hosted MCP bridge | OPT-OUT | In-app host only; bridges deferred if native HTTP fails at connect UAT |
