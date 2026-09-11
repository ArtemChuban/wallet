---
phase: "26"
slug: "connect-docs-policy"
status: verified
threats_open: 0
asvs_level: 1
created: "2026-09-11"
---

# Phase 26 — Security

> Connect docs + MCP policy. Threat register from 26-01…26-04 PLAN threat models.
> ASVS L1; `security_block_on: high`. Live artifact grep 2026-09-11.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| MCP client → tool descriptions / server instructions | Untrusted agents read prose; may ignore hints | Named DISOL/INISO/GRISO + annotations |
| CAP vs SIDE description surfaces | Wrong SIDE rule ids on CAP mis-teach agents | Description constants only |
| Operator ← README MCP section | Docs steer bind address / transport | `127.0.0.1` + `type: http` snippets |
| Client config → localhost MCP | Mis-documented URL widens exposure | Loopback `/api/mcp` only |
| Agents ← AGENTS.md / PROJECT | Policy text shapes future feature work | PARITY-01 standing rule |
| UAT CLIs → localhost MCP | Live connect proves docs; Host/Origin still gates | Dual-client UAT only |
| Docs/tests → repo | Static contracts; no new network/auth surface | Annotations, tests, planning docs |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-26-01 | Elevation of Privilege | SIDE tools / instructions | medium | mitigate | Named DISOL/INISO/GRISO in `create-handler` instructions + `list_debts`; isolation-contract asserts | closed |
| T-26-02 | Spoofing | wallet_ping annotations | low | accept | Annotations hints only; Host/Origin + no write tools remain real controls | closed |
| T-26-03 | Tampering | Tool JSON payloads | medium | mitigate | D-11 — no isolation meta; debts/income/grace/forecast `not.toHaveProperty("isolation")` | closed |
| T-26-04 | Tampering | CAP descriptions | medium | mitigate | D-09 — CAP tools free of DISOL/INISO/GRISO; SIDE-only named prose | closed |
| T-26-05 | Elevation of Privilege | forecast overlay copy | medium | mitigate | INISO-01/GRISO-01 combined sentence in forecast description + handler | closed |
| T-26-06 | Information Disclosure | tool payloads | low | mitigate | D-11 — isolation stays in descriptions; payload asserts hold | closed |
| T-26-07 | Information Disclosure | README URL | high | mitigate | D-05 — README MCP documents `127.0.0.1` only; no `0.0.0.0` | closed |
| T-26-08 | Tampering | Cursor/Claude transport docs | medium | mitigate | D-06 `type: http` + `url`; no `streamable-http` / pre-doc `mcp-remote` in README | closed |
| T-26-09 | Elevation of Privilege | README scope creep | low | mitigate | D-02/D-14 — connect snippets only; no PARITY/smoke/`wallet_ping` in MCP section | closed |
| T-26-10 | Tampering | PARITY vehicle | medium | mitigate | D-13 AGENTS `wallet-mcp-parity` only; no `.cursor/rules` duplicate | closed |
| T-26-11 | Information Disclosure | UAT docs | medium | mitigate | D-18 smoke in `26-UAT.md` only; loopback URL; OPERATOR free of MCP section | closed |
| T-26-12 | Denial of Service | Premature remote-bridge docs | low | mitigate | D-17/D-19 — UAT notes mcp-remote only after real fail; native HTTP passed | closed |
| T-26-SC | Tampering | npm installs | high | accept | No `package.json` / lockfile changes in Phase 26 commits | closed |

*Status: open · closed*
*Severity: critical > high > medium > low — only open ≥ high count toward threats_open*
*Disposition: mitigate · accept · transfer*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-26-01 | T-26-02 | MCP ToolAnnotations are advisory per spec; real controls remain Host/Origin gate + read-only tool surface (no write tools) | plan disposition | 2026-09-11 |
| AR-26-02 | T-26-SC | Docs/policy + description copy only; zero new packages across 26-01…26-04 | plan disposition | 2026-09-11 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-11 | 13 | 13 | 0 | gsd-secure-phase / gsd-security-auditor |

---

## Evidence

- `src/lib/mcp/create-handler.ts:31–35` — DISOL-01 / INISO-01 / GRISO-01 in server instructions (T-26-01, T-26-05)
- `src/lib/mcp/tools/debts.ts:11` — LIST_DEBTS_DESCRIPTION carries DISOL-01 (T-26-01)
- `src/lib/mcp/tools/income.ts` / `grace.ts` / `forecast.ts` — named INISO/GRISO prose (T-26-01, T-26-05)
- `src/lib/mcp/isolation-contract.test.ts:62–64,67–72` — named-rule + wallet_ping annotation contracts (T-26-01, T-26-02 presence)
- CAP tools `accounts.ts` / `net-worth.ts` / `balances.ts` / `fx.ts` / `wallet-ping.ts` — zero DISOL/INISO/GRISO matches (T-26-04)
- `debts.test.ts` / `income.test.ts` / `grace.test.ts` / `forecast.test.ts` — `expect(payload).not.toHaveProperty("isolation")` (T-26-03, T-26-06)
- `README.md` MCP section (`## MCP` … before Host data contract) — four `127.0.0.1` URLs; two `"type": "http"`; absent: `0.0.0.0`, `streamable-http`, `mcp-remote`, `PARITY`, smoke tokens (T-26-07, T-26-08, T-26-09)
- `AGENTS.md:20–26` — `BEGIN/END:wallet-mcp-parity`; `.cursor/rules` absent (T-26-10)
- `26-UAT.md` — dual-client live connect only; `127.0.0.1`; OPERATOR.md has no MCP section (T-26-11)
- UAT Test 2 passed native `type: http` — no mcp-remote primary docs (T-26-12)
- `git log` Phase 26 commits — no `package.json` / `package-lock.json` (T-26-SC)
- SUMMARY Threat Flags (26-01/02/03): none / mapped; 26-04: no Threat Flags section → no unregistered flags

### Unregistered Flags

none
