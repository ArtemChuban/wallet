# Requirements: Wallet v1.4 Local MCP

**Defined:** 2026-09-10
**Core Value:** At any moment, see true net worth (assets minus credit-card debt) in the primary currency and in each account's original currency, with history you can trust over time.

## v1.4 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Host

- [x] **HOST-01**: Running wallet app exposes in-process Streamable HTTP MCP at `/api/mcp` (same Next.js lifecycle as the UI; no sidecar, no agent subprocess)
- [x] **HOST-02**: MCP accepts only localhost clients (Host/Origin guard + Compose host publish stays `127.0.0.1`)

### Capital (read-only)

- [x] **CAP-01**: Agent can list accounts with types, currencies, and credit metadata via MCP
- [x] **CAP-02**: Agent can get net worth as-of a date via MCP with partial-FX honesty
- [x] **CAP-03**: Agent can get an account's native and primary balance as-of a date via MCP
- [x] **CAP-04**: Agent can list FX rates / rate-as-of (primary↔other) via MCP

### Side ledgers (read-only)

- [x] **SIDE-01**: Agent can list debts and debt primary totals via MCP without folding debts into NW (DISOL-01)
- [x] **SIDE-02**: Agent can list income (plan/actual/overdue) via MCP without writing BalanceSnapshot (INISO-01)
- [x] **SIDE-03**: Agent can list grace obligations via MCP without rewriting historical NW LOCF (GRISO-01)
- [x] **SIDE-04**: Agent can get Капитал forecast overlay (income + A′ grace) via MCP

### Client / policy

- [x] **CLI-01**: MCP tools declare `readOnlyHint` and isolation rules (DISOL/INISO/GRISO) in server/tool descriptions
- [x] **CLI-02**: Docs show Claude Code and Cursor CLI how to connect to the localhost MCP URL (copy-paste configs; app must already be running)
- [ ] **PARITY-01**: Standing project rule — any new user-visible read surface ships matching MCP read tool(s) in the same milestone/phase (recorded in PROJECT Constraints)

## Future Requirements

Deferred beyond v1.4. Tracked but not in this roadmap.

### Writes / UX

- **WRITE-01**: MCP mutate tools (create/update balances, debts, income, grace) with explicit confirm gates
- **CHAT-01**: In-app «Ассистент» chat UI over the same MCP
- **SMOKE-01**: Hard-gated curl/initialize smoke as a release check (optional now; docs-only in v1.4)

### Host hardening

- **AUTH-MCP-01**: Optional shared-secret / bearer for local MCP beyond Host/Origin

## Out of Scope

Explicitly excluded for v1.4.

| Feature | Reason |
|---------|--------|
| Write / mutate MCP tools | Trust read path first; PROJECT Out of Scope |
| App-spawned agent subprocess | Superseded by external CLI → localhost MCP |
| In-app chat / «Ассистент» UI | CLI connects; capital UI stays primary |
| Stdio-only MCP server | Fights Docker single-app model; HTTP on running app |
| Publish MCP on `0.0.0.0` / LAN | Accidental finance data exposure |
| Raw SQL / “query anything” tool | Injection + schema footguns; typed domain tools only |
| Transaction / spend / category tools | No tx ledger in Wallet |
| OAuth / multi-user MCP auth | Single local user |
| Folding debts/income/grace into historical NW via MCP | Violates DISOL/INISO/GRISO |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| HOST-01 | Phase 23 | Complete |
| HOST-02 | Phase 23 | Complete |
| CAP-01 | Phase 24 | Complete |
| CAP-02 | Phase 24 | Complete |
| CAP-03 | Phase 24 | Complete |
| CAP-04 | Phase 24 | Complete |
| SIDE-01 | Phase 25 | Complete |
| SIDE-02 | Phase 25 | Complete |
| SIDE-03 | Phase 25 | Complete |
| SIDE-04 | Phase 25 | Complete |
| CLI-01 | Phase 26 | Complete |
| CLI-02 | Phase 26 | Complete |
| PARITY-01 | Phase 26 | Pending |

**Coverage:**

- v1.4 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-09-10*
*Last updated: 2026-09-10 after v1.4 roadmap*
