# Pitfalls Research

**Domain:** Adding in-app read-only MCP host (localhost HTTP/SSE / Streamable HTTP) to existing Next.js + Prisma + Docker SQLite Wallet
**Researched:** 2026-09-10
**Confidence:** HIGH (MCP transport/security from official spec + SDK; Docker compose already correct); MEDIUM (CLI client type-string quirks across Cursor vs Claude Code)
**Milestone:** v1.4 Local MCP

## Critical Pitfalls

### Pitfall 1: Docker bind confusion — `0.0.0.0` inside vs publish on host

**What goes wrong:**
MCP “works in container logs” but CLI on host cannot connect — OR LAN/WAN can reach personal finance data. Two opposite mistakes:
1. Bind Node/`HOSTNAME` to `127.0.0.1` **inside** the container → host published port never reaches the process.
2. Change compose `ports` from `127.0.0.1:3000:3000` to `3000:3000` (or `0.0.0.0:3000:3000`) → MCP + whole app exposed on all interfaces.

**Why it happens:**
MCP spec says local servers SHOULD bind localhost. Docker mental model collapses “localhost” with “loopback of the container.” Copy-paste Docker examples publish `0.0.0.0`. Wallet already does the right split (`HOSTNAME=0.0.0.0` in image + `127.0.0.1:3000:3000` in compose) — easy to “fix for MCP.”

**How to avoid:**
- Keep container listen `0.0.0.0:3000`; keep **host publish** locked to `127.0.0.1:3000:3000`.
- Document explicitly: “localhost for clients = host loopback; container still binds all interfaces.”
- Add a compose/regression check (comment + optional CI grep) that forbids unscoped `ports: - "3000:3000"`.
- Prefer same port/path as the web app (`/api/mcp` or `/mcp` on :3000) — do not open a second published port “for MCP.”

**Warning signs:**
- Compose diff removes `127.0.0.1:` prefix
- New `EXPOSE` / second `-p` for MCP
- Docs say “bind MCP to 127.0.0.1” without distinguishing container vs host
- `ss`/`docker port` shows `0.0.0.0:3000->3000` on host

**Phase to address:**
MCP host + Docker wiring (first integration phase) — before tool catalog polish

---

### Pitfall 2: No Origin/Host validation (DNS rebinding) on unauthenticated local HTTP

**What goes wrong:**
Browser on a malicious site rebinds DNS to `127.0.0.1` and calls the MCP endpoint. Spec Security Warning: servers MUST validate `Origin` on Streamable HTTP; SHOULD bind localhost + authenticate. Without checks, read-only tools still **exfiltrate** accounts, balances, debts, income, grace. Tenable WAS-114885 class issue for SSE/HTTP MCP lacking Host/Origin enforcement.

**Why it happens:**
“Single-user local, no auth” feels safe. Read-only milestone lowers urgency. Next.js route handler ships without SDK `hostHeaderValidation` / `localhostHostValidation` / Origin allowlist.

**How to avoid:**
- On every MCP request: validate `Host` ∈ `{localhost,127.0.0.1,[::1]}` (port-agnostic) and reject bad/missing `Origin` per MCP transport rules.
- Use SDK helpers (`hostHeaderValidation` / web-standard equivalents) — do not hand-roll half-checks.
- Optional shared secret header for CLI clients (even local) — cheap defense-in-depth; document in connect docs.
- Never enable wide-open CORS (`Access-Control-Allow-Origin: *`) on MCP just to “make browser clients work.”

**Warning signs:**
- MCP route has zero header checks
- CORS `*` on `/api/mcp`
- “Auth deferred forever” with no Host/Origin either
- Tools answer from `curl` with forged `Host: evil.example`

**Phase to address:**
Same phase as route/transport stand-up (security is not a later hardening pass)

---

### Pitfall 3: Wrong / incomplete transport — legacy SSE-only or missing HTTP methods

**What goes wrong:**
Ship only deprecated HTTP+SSE (`/sse` + `/message`) or Streamable HTTP missing GET/POST/DELETE. Claude Code prefers `type: "http"` (Streamable HTTP); SSE marked deprecated. Some clients fail silently when DELETE (session end) or GET (SSE listen/resume) absent. Docs say “HTTP/SSE” and implement neither correctly.

**Why it happens:**
Training data + old tutorials teach 2024-11-05 SSE. PROJECT wording “HTTP/SSE” read as “SSE transport” instead of “Streamable HTTP that may use SSE streams.” Vercel/`mcp-handler` blogs mix serverless Redis concerns into local Docker.

**How to avoid:**
- Implement **one** MCP endpoint with Streamable HTTP (`WebStandardStreamableHTTPServerTransport` or current `mcp-handler`).
- Export **GET + POST + DELETE** (+ OPTIONS only if you intentionally support browsers).
- Prefer **stateless** mode (`sessionIdGenerator: undefined`) for read-only Wallet — no Redis, no sticky sessions.
- If supporting ancient clients, dual-host legacy SSE **explicitly**; do not make it the only path.
- Connect docs: Claude Code `type: "http"`; Cursor `url` / `streamable-http` — not “stdio command.”

**Warning signs:**
- Only `GET` SSE handler; POST goes 405
- Client log: `MCP server has url but no type` / treated as stdio
- `410 Gone` on `/sse` after upgrading handler major while docs still point there
- Custom Node server added “because SSE needs it” while App Router + Node runtime would suffice

**Phase to address:**
Transport/host phase before any domain tools

---

### Pitfall 4: Reimplement NW / domain math in MCP tools (break DISOL / INISO / GRISO)

**What goes wrong:**
MCP tools invent ad-hoc SQL or copy UI page loaders. Agent reports NW that includes debts, folds income/grace into historical LOCF, or treats grace amount-due as a second liability. Core Value trust dies — agent sounds authoritative with wrong numbers.

**Why it happens:**
MCP tutorials show “tool = prisma.x.findMany.” Faster than importing `@/lib/net-worth`, `@/lib/debts`, `@/lib/nw-forecast`, `@/lib/credit-grace`. Tool authors do not know isolation locks.

**How to avoid:**
- Tools call **existing pure libs** only — same path as pages/charts.
- Hard rules in tool layer: debts never enter NW; income/grace never write BalanceSnapshot; forecast overlays labeled as forecast.
- Add twin tests: MCP tool fixtures assert DISOL/INISO/GRISO (or reuse lib unit tests + thin MCP adapter tests).
- Ban importing `src/app/**/actions.ts` mutate paths from MCP modules.

**Warning signs:**
- MCP package imports Prisma models directly for NW totals
- Tool description says “net worth including debts”
- Grace/income tools return values that change when only historical series code runs
- Duplicate money formatting (floats) instead of minor units from `@/lib/money`

**Phase to address:**
Read-only tool catalog phase (after transport) — with isolation tests in same wave

---

### Pitfall 5: “Read-only” that can still mutate (shared Prisma / actions bleed)

**What goes wrong:**
No write *tools* registered, but handlers import server actions, run `$executeRaw`, or share a helper that upserts “for convenience.” Agent prompt injection / confused tool args still trigger writes. Or a future “just one mutate” lands without auth.

**Why it happens:**
Single Prisma client is write-capable. Code reuse of `actions.ts` is tempting. Read-only enforced only by tool list, not by code boundary.

**How to avoid:**
- MCP module boundary: only functions typed/documented as reads; eslint/path forbid `actions` imports under `mcp/`.
- Prefer `prisma.*.find*` wrappers; no `create`/`update`/`delete` in MCP tree (CI grep).
- Keep milestone lock: write tools OOS; require new milestone for mutates + explicit auth story.

**Warning signs:**
- MCP file imports `revalidatePath` or mutation actions
- SQLite WAL shows writes during MCP-only smoke test
- Tool named `list_*` that calls `upsert`

**Phase to address:**
Tool catalog + CI guard (same phase as Pitfall 4)

---

### Pitfall 6: Client connect docs wrong — `type` missing, path wrong, app not running

**What goes wrong:**
Users (and agents) “connect MCP” but nothing works. Claude Code: JSON with `url` and **no** `type` → treated as stdio → skipped / confusing errors. Cursor: needs full restart after `mcp.json` edit; type string differs (`http` vs `streamable-http` vs `streamableHttp`). Wrong path (`/` instead of `/api/mcp`) → endpoint not found. Docs assume stdio child process (PROJECT out of scope).

**Why it happens:**
Each CLI documents slightly different JSON. Copy from remote SaaS OAuth examples. App must already be up (`docker compose` / `npm run dev`) — unlike stdio MCP that spawns on connect.

**How to avoid:**
- Ship **copy-paste** snippets per client: Claude Code (`type: "http"`, url) and Cursor (documented type + url).
- State prerequisites: Wallet container/dev server healthy; URL `http://127.0.0.1:3000/<exact-path>`.
- Smoke: `curl` initialize POST with correct `Accept` headers; document expected status.
- Never document `command`/`npx` stdio for Wallet MCP in v1.4.

**Warning signs:**
- Docs only show stdio
- Single generic JSON without client names
- Support thread: `command: expected string, received undefined` / `url but no type`
- Works in MCP Inspector, fails in Claude Code due to missing `type`

**Phase to address:**
Connect-docs phase after endpoint exists (verify with real Claude Code + Cursor configs)

---

### Pitfall 7: Edge runtime / serverless assumptions break SQLite MCP

**What goes wrong:**
Route set to `runtime = 'edge'` or copied Vercel Fluid/Redis session pattern. `better-sqlite3` / Prisma native bindings fail or sessions evaporate. Or separate MCP sidecar process diverges from app lifecycle (PROJECT: same Next.js process).

**Why it happens:**
Popular “MCP on Next.js SaaS” posts target Vercel. Wallet is Docker **standalone** Node + SQLite file volume.

**How to avoid:**
- Force `runtime = 'nodejs'` on MCP route.
- Stateless Streamable HTTP — no Redis for v1.4.
- Same process as wallet web; lifecycle = compose/`npm run dev` only.
- Do not add custom Express server unless App Router transport proven blocked.

**Warning signs:**
- `next/dist/compiled` edge errors on MCP hit
- New `redis` dependency “for MCP sessions”
- Second container service `mcp:` in compose

**Phase to address:**
Transport/host phase

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip shared-secret auth on localhost | Faster connect | DNS rebinding / LAN mis-publish = full data leak | Only if Host+Origin locked **and** publish is loopback-only; still prefer token |
| Stateless-only (no sessions) | No Redis; simple Docker | No server-push notifications | **Always OK** for read-only v1.4 |
| Dual legacy SSE + Streamable HTTP | Old clients work | Two codepaths, docs drift | Only if a required client cannot speak Streamable HTTP |
| Tools return raw Prisma rows | Fast | Schema leak, wrong semantics, huge payloads | Never for NW/debts/grace — map via lib DTOs |
| Sidecar MCP process | Isolates crashes | Lifecycle/port drift; PROJECT anti-goal | Never in v1.4 |
| Wide CORS for “browser MCP” | Demo in web UI | Browser rebinding surface | Never without Origin allowlist + auth |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Docker Compose publish | `ports: ["3000:3000"]` | `127.0.0.1:3000:3000` only |
| Container `HOSTNAME` | Set `127.0.0.1` “for security” | Keep `0.0.0.0` inside; lock publish on host |
| Claude Code `.mcp.json` | `url` without `type` | `"type": "http"` (+ url to MCP path) |
| Cursor MCP | Edit json, expect hot reload | Quit/restart Cursor; use documented streamable HTTP type |
| MCP SDK transport | Node `StreamableHTTPServerTransport` in Edge route | `WebStandardStreamableHTTPServerTransport` + Node runtime |
| Domain reads | New SQL for NW | Reuse `@/lib/net-worth`, LOCF, debts, income, credit-grace |
| Legacy SSE clients | Only `/sse` | Streamable HTTP primary; legacy optional dual |
| Healthchecks | Health OK ⇒ MCP OK | Separate smoke for MCP initialize + one tool |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Dump full history series in one tool | Agent context blow-up; slow SQLite | Paginate / as-of params; summarize defaults | Dozens of accounts × years of snapshots |
| N+1 Prisma in each tool | Multi-second tool calls | Batch Maps like pages (LOCF maps) | ~10+ accounts with dense snapshots |
| Stateful SSE held open idle | Connection pile-up under HMR/dev | Stateless JSON responses where possible | Dev reload + many CLI reconnects |
| Huge tool JSON with BigInt poorly serialized | Runtime errors / stringly money | Explicit DTO serialization (minor units as string/number policy) | First credit/debt tool call |

Scale note: single-user local — optimize for **correctness + payload size for LLM context**, not multi-tenant QPS.

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| No Origin/Host validation | DNS rebinding → data exfil | Spec MUST Origin; SDK Host allowlist |
| Publish on `0.0.0.0` | LAN peers read finance DB via MCP | Compose loopback publish lock |
| CORS `*` on MCP | Browser malware can call tools | No browser CORS unless allowlisted + auth |
| Rely on “read-only tools” alone | Mutate bleed / future write tools | Code boundary + CI grep |
| Commit bearer token in `.mcp.json` | Token in git | `${ENV}` expansion; local-only secrets |
| Log full tool results | Disk logs hold balances | Log tool name + counts, not payloads |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Docs assume MCP always on | Agent fails mysteriously | Prerequisite: start Wallet; show health + MCP smoke |
| One config snippet for all CLIs | Half of clients never connect | Per-client copy-paste (Claude Code + Cursor) |
| Tool names/descriptions English-only jargon | Agent mis-asks; user confused in RU UI app | Clear tool descriptions; map RU domain terms (Капитал, Долги, Грейс) in docs |
| No “forecast vs fact” in tool text | Agent treats Прогноз as historical NW | Descriptions + fields mark overlay vs LOCF fact |
| Silent empty tool list when DB empty | Feels broken | Empty arrays + hint to seed via UI |

## "Looks Done But Isn't" Checklist

- [ ] **Transport:** GET+POST+DELETE on single MCP path — verify with client initialize, not only browser GET
- [ ] **Runtime:** `nodejs` (not edge) — verify Prisma tool call succeeds in Docker image
- [ ] **Publish:** compose still `127.0.0.1:3000:3000` — verify host listen address
- [ ] **Rebinding:** Host/Origin rejection tested with forged headers
- [ ] **Read-only guard:** CI/path ban on mutate imports under MCP tree
- [ ] **Domain honesty:** NW tool matches Капитал (DISOL); income/grace not in historical LOCF (INISO/GRISO)
- [ ] **Client docs:** Claude Code `type: http` snippet + Cursor snippet; both smoke-tested
- [ ] **No stdio spawn:** docs never tell app to launch agent subprocess
- [ ] **Path accuracy:** documented URL equals real route (no `/mcp` vs `/api/mcp` drift)
- [ ] **DTO money:** no float drift; minor units policy documented for agents

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Accidental `0.0.0.0` publish | LOW | Revert compose; restart; rotate any optional token; check LAN exposure window |
| Missing Origin/Host checks | MEDIUM | Patch middleware; add tests; bump SDK if needed |
| Wrong transport only SSE | MEDIUM | Add Streamable HTTP endpoint; update docs; keep SSE temporarily if needed |
| Bad NW tool math | HIGH | Delete ad-hoc SQL; wire libs; add isolation tests; tell users to distrust prior agent answers |
| Mutate bleed | HIGH | Audit DB/migrations; restore SQLite backup from `./data`; tighten boundaries |
| Docs/`type` confusion | LOW | Fix snippets; re-run client connect UAT |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|--------|------------------|--------------|
| Docker bind / publish | MCP host + Docker wiring | `docker port` shows `127.0.0.1`; host CLI connects; forged LAN assumption documented |
| Origin/Host / rebinding | MCP host + Docker wiring | Unit/integration: bad Host/Origin → 4xx; good localhost → initialize OK |
| Incomplete Streamable HTTP | MCP host transport | Claude Code + Cursor initialize; GET/POST/DELETE present |
| Edge/Redis/sidecar | MCP host transport | Single compose service; nodejs runtime; no redis dep |
| Domain math reuse / isolation | Read-only tools | Tool outputs match UI fixtures; DISOL/INISO/GRISO tests green |
| Mutate bleed | Read-only tools | CI grep + MCP-only smoke leaves DB mtime/hash unchanged |
| Client connect docs | Connect docs / UAT | Fresh Claude Code + Cursor configs from docs succeed |

Suggested roadmap order: **(1) host+transport+localhost safety → (2) read-only tools on libs + isolation tests → (3) connect docs + multi-client UAT**. Do not ship tools before Host/Origin and publish locks.

## Sources

- MCP Spec (2025-03-26) Transports — Streamable HTTP Security Warning (Origin validation, localhost bind, auth): https://modelcontextprotocol.io/specification/2025-03-26/basic/transports — confidence HIGH (official)
- MCP TypeScript SDK `@modelcontextprotocol/sdk` — `hostHeaderValidation` / `localhostHostValidation`; `WebStandardStreamableHTTPServerTransport` (in-tree via shadcn dep + npm 1.30.0) — confidence HIGH
- Claude Code MCP docs — HTTP vs deprecated SSE; `type` required with `url`: https://code.claude.com/docs/en/mcp — confidence HIGH (official)
- Cursor MCP docs — stdio / SSE / Streamable HTTP; `url` remote config: https://cursor.com/docs/mcp — confidence HIGH (official)
- Tenable WAS-114885 — MCP SSE DNS rebinding without Origin/Host checks — confidence MEDIUM (vendor advisory)
- Wallet `docker-compose.yml` — existing `127.0.0.1:3000:3000` + `HOSTNAME=0.0.0.0` pattern — confidence HIGH (codebase)
- Wallet PROJECT.md v1.4 locks — in-app host, read-only, no subprocess, no write tools — confidence HIGH
- Community Next.js MCP posts (stateless sessionIdGenerator, GET/POST/DELETE) — confidence MEDIUM (cross-checked with spec)

---
*Pitfalls research for: in-app localhost MCP host on Next.js Docker SQLite Wallet*
*Researched: 2026-09-10*
