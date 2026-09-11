---
phase: "23"
slug: "mcp-host-localhost-safety"
status: verified
threats_open: 0
asvs_level: 1
created: "2026-09-11"
---

# Phase 23 — Security

> MCP Host + Localhost Safety. Threat register from 23-01/23-02 PLAN `<threat_model>`.
> ASVS L1; `security_block_on: high` — only open ≥ high count toward `threats_open`.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|-----------------|
| npm registry → `node_modules` | Untrusted package tarballs into app supply chain | `mcp-handler@^2`, `@modelcontextprotocol/server@^2` |
| External CLI/browser → Next `/api/mcp` | Untrusted Host/Origin/body into Node process | Headers + JSON-RPC body |
| Next process → MCP tool handlers | In-process tool dispatch (guard first) | `mcp.fetch` after `withLocalhostGuard` |
| Host network → container publish | Compose bind controls LAN reachability | `127.0.0.1:3000:3000` only |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-23-01 | Spoofing | localhost-guard Host/Origin (DNS rebinding) | high | mitigate | Allowlist via SDK `validateHostHeader` + `localhostAllowedHostnames`; route calls `withLocalhostGuard` before `mcp.fetch` | closed |
| T-23-02 | Information Disclosure | `docker-compose.yml` ports / LAN | high | mitigate | Host publish remains `"127.0.0.1:3000:3000"` (no `0.0.0.0` widen) | closed |
| T-23-03 | Spoofing | Host port vs `PORT` | high | mitigate | `hostPortOk` requires explicit Host port === `process.env.PORT` default `3000`; wrong/missing → `bad_host` | closed |
| T-23-04 | Spoofing | CSRF foreign Origin | high | mitigate | `validateOriginHeader` + `localhostAllowedOrigins`; non-loopback Origin → 403 `bad_origin`; missing Origin allowed | closed |
| T-23-05 | Elevation of Privilege | CORS widen on `/api/mcp` | medium | mitigate | No `Access-Control-*` headers under `src/` (incl. MCP route/lib) | closed |
| T-23-SC | Tampering | npm install mcp-handler | high | mitigate | Plan 01 blocking-human SUS legitimacy gate; pins `mcp-handler@^2.1.1`, `@modelcontextprotocol/server@^2.0.0` | closed |

*Status: open · closed*
*Severity: critical > high > medium > low — only open ≥ high count toward threats_open*
*Disposition: mitigate · accept · transfer*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| — | — | No accepted-disposition threats in Phase 23 register | — | — |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open (blocking ≥ high) | Run By |
|------------|---------------|--------|--------------------------|--------|
| 2026-09-11 | 6 | 6 | 0 | gsd-security-auditor / secure-phase |

---

## Evidence

### T-23-01 (Host allowlist + route gate)
- `src/lib/mcp/localhost-guard.ts`: `validateHostHeader(host, localhostAllowedHostnames())`; fail → 403 `{ error: "Forbidden", reason: "bad_host" }`
- `src/app/api/mcp/route.ts`: `withLocalhostGuard(req)` then `mcp.fetch(req)`
- Tests: `localhost-guard.test.ts` evil Host; `route.test.ts` bad Host skips `handler.fetch`
- UAT 2026-09-11: Host `evil.example:3000` → 403 `bad_host`

### T-23-02 (Compose loopback publish)
- `docker-compose.yml` L5: `"127.0.0.1:3000:3000"`
- VERIFICATION + UAT: grep match confirmed

### T-23-03 (PORT equality)
- `localhost-guard.ts` `hostPortOk`: `new URL(\`http://${hostHeader}\`).port === listenPort()`
- Tests: `127.0.0.1:9999` and missing-port `127.0.0.1` → `bad_host`

### T-23-04 (Origin CSRF)
- `localhost-guard.ts`: `validateOriginHeader(origin, localhostAllowedOrigins())`; fail → `bad_origin`
- Test: good Host + `Origin: https://evil.com` → 403 `bad_origin`; missing Origin pass; loopback Origin pass

### T-23-05 (no CORS)
- Repo grep `Access-Control` under `src/`: **zero matches**
- Plan 02 smoke verify forbade `Access-Control-Allow` in MCP sources

### T-23-SC (supply chain)
- `23-01-SUMMARY.md`: human resume-signal approved mcp-handler@^2 + server@^2 before install
- `package.json`: `"mcp-handler": "^2.1.1"`, `"@modelcontextprotocol/server": "^2.0.0"`
- Create path uses SDK `createMcpHandler` (not mcp-handler create) — `create-handler.ts`

### Unregistered Flags
- `23-02-SUMMARY.md` ## Threat Flags: none beyond plan `<threat_model>` — no `unregistered_flag`

### ASVS L1 note
Mitigations present at cited boundaries (grep/read). Live UAT/VERIFICATION corroborate Host reject + Compose bind; unit matrix covers Host/Origin/port.
