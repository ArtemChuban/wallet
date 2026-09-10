# Phase 23: MCP Host + Localhost Safety - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-10
**Phase:** 23-MCP Host + Localhost Safety
**Areas discussed:** Localhost allowlist, Host-phase tool surface, Reject behavior, Done bar / smoke

---

## Localhost allowlist

| Option | Description | Selected |
|--------|-------------|----------|
| 127.0.0.1 only | Strict IPv4 loopback | |
| 127.0.0.1 + localhost | Human-friendly | |
| 127.0.0.1 + localhost + [::1] | Full loopback | ✓ |
| You decide | | |

**User's choice:** Full loopback Host allowlist
**Notes:** —

| Option | Description | Selected |
|--------|-------------|----------|
| Same allowlist; missing Origin OK | curl/CLI friendly | |
| Origin required | Breaks curl without -H | |
| Validate Origin only if present | | |
| You decide | | ✓ |

**User's choice:** Claude discretion → same allowlist; missing OK; non-loopback Origin reject

| Option | Description | Selected |
|--------|-------------|----------|
| Any port on loopback | Dev flexibility | |
| Only app PORT | | ✓ |
| You decide | | |

**User's choice:** Only app PORT (default 3000)

| Option | Description | Selected |
|--------|-------------|----------|
| Always 127.0.0.1 URL | | |
| Always localhost URL | | |
| Both OK in smoke; docs Phase 26 → 127.0.0.1 | | ✓ |

**User's choice:** Both smoke; docs prefer 127.0.0.1

---

## Host-phase tool surface

| Option | Description | Selected |
|--------|-------------|----------|
| wallet_ping only | | (via discretion) |
| ping + version meta | | |
| Empty registry | | |
| You decide | | ✓ |

**User's choice:** Claude → wallet_ping only

| Option | Description | Selected |
|--------|-------------|----------|
| { ok: true } | | |
| + service | | |
| + service + timestamp | | ✓ |
| You decide | | |

**User's choice:** `{ ok, service: "wallet-mcp", timestamp }`

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal instructions | No isolation copy yet | ✓ |
| Isolation hints now | | |
| Empty | | |
| You decide | | |

**User's choice:** Minimal instructions

| Option | Description | Selected |
|--------|-------------|----------|
| src/lib/mcp/ + thin route | | (via discretion) |
| All in route.ts | | |
| You decide | | ✓ |

**User's choice:** Claude → research layout `src/lib/mcp/*`

---

## Reject behavior

| Option | Description | Selected |
|--------|-------------|----------|
| 403 | | ✓ |
| 401 | | |
| 404 | Hide MCP | |
| You decide | | |

**User's choice:** 403

| Option | Description | Selected |
|--------|-------------|----------|
| { error: forbidden } | | |
| JSON reason bad_host/bad_origin | | ✓ |
| Empty body | | |
| You decide | | |

**User's choice:** JSON with reason

| Option | Description | Selected |
|--------|-------------|----------|
| No log | | |
| Warn with Host/Origin | | (via discretion) |
| Counter only | | |
| You decide | | ✓ |

**User's choice:** Claude → warn log with values

| Option | Description | Selected |
|--------|-------------|----------|
| No CORS | | (via discretion) |
| Reflect loopback Origin | | |
| You decide | | ✓ |

**User's choice:** Claude → no CORS headers

---

## Done bar / smoke

| Option | Description | Selected |
|--------|-------------|----------|
| curl initialize enough | | (via discretion) |
| curl + Inspector required | | |
| Vitest only | | |
| You decide | | ✓ |

**User's choice:** Claude → curl required; Inspector optional; Vitest guard+route

| Option | Description | Selected |
|--------|-------------|----------|
| Assert compose in test | | |
| Manual UAT checklist | | ✓ |
| Both | | |
| You decide | | |

**User's choice:** Manual UAT for Compose publish

| Option | Description | Selected |
|--------|-------------|----------|
| Guard unit + route smoke mock | | ✓ |
| Guard unit only | | |
| No new tests | | |
| You decide | | |

**User's choice:** Guard + route Vitest

| Option | Description | Selected |
|--------|-------------|----------|
| Leave /api/health alone | | (via discretion) |
| Add mcp path to health | | |
| You decide | | ✓ |

**User's choice:** Claude → do not change health

---

## Claude's Discretion

Origin policy; wallet_ping-only + lib layout; reject logging; no CORS; UAT bar (curl + optional Inspector); leave `/api/health` unchanged.

## Deferred Ideas

- Savings account type with interest + NW forecast (todo filed mid-discuss)
- CAP/SIDE/CLI/PARITY → phases 24–26
- Folded superseded subprocess-agent todo as anti-goal
