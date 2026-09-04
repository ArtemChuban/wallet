# Phase 1: Docker + SQLite Foundation - Context

**Gathered:** 2026-09-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a runnable local Docker Compose stack for Wallet with durable SQLite on the host: user can start the app, open a minimal UI, and data survives container stop/start. Health/readiness reflects a reachable, migrated database. PLAT-01 only — no currencies, accounts, balances, FX, net worth, or charts yet (those are later phases). Schema stub must lock money/rate column conventions so later phases do not rewrite storage.

</domain>

<decisions>
## Implementation Decisions

### Runtime shape
- **D-01:** Use **Next.js** with `output: 'standalone'` (not the research default of Hono + Vite SPA). — **Reversibility:** costly — framework choice touches Dockerfile, entrypoint, routing, and all later UI/API work.
- **D-02:** SQLite access and mutations live in **Route Handlers / Server Actions** only (no second DB worker process). Prisma migrate runs in the **Docker entrypoint before `next start`**. — **Reversibility:** costly — process topology and migrate lifecycle are Compose/entrypoint contracts.
- **D-03:** **Prisma** is the ORM (not Drizzle). Use Prisma’s SQLite provider with a file DB on the mounted volume. — **Reversibility:** costly — schema, migrations, and all data access follow Prisma.
- **D-04:** **shadcn/ui** is the UI component library on the Next App Router shell (Phase 1 ready page may use it lightly). — **Reversibility:** costly — component and styling conventions for later UI phases.
- **D-05:** Docker image: **multi-stage Node 24 bookworm** build + **bookworm-slim** runtime with Next standalone output (not Alpine). — **Reversibility:** reversible — image base can change with rebuild effort.
- **D-06:** Phase 1 browser proof: minimal **“Wallet OK”** (or Russian equivalent) ready page **plus** a health/readiness signal that the database is reachable and migrated.

### Money column type
- **D-07:** Store account/balance money as **INTEGER minor units**, never IEEE float / REAL. — **Reversibility:** one-way — changing representation later needs a data migration and touches every money field.
- **D-08:** Each currency has a **required `scale`** set at currency create time (no guessed default). — **Reversibility:** one-way — scale is part of how integers map to display amounts; changing scale without migration corrupts history.
- **D-09:** Store FX rates as **INTEGER with fixed scale 10^8** (rate × 10^8). — **Reversibility:** one-way — rate column semantics are a cross-phase contract for FX and charts.

### Claude's Discretion
- **Host data path:** Prefer research default bind-mount `./data:/data` with `DATABASE_PATH` / Prisma `file:` URL under `/data` unless planning finds a blocker.
- **SQLite journal_mode:** Prefer WAL with FK/`busy_timeout` PRAGMAs; document or fall back to DELETE if the host FS (e.g. virtiofs/NFS) proves unsafe — confirm during plan/execute smoke test.
- Exact health route shape, Russian vs English copy on the ready page, and Prisma client singleton patterns — choose standard Next + Prisma practices.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope
- `.planning/PROJECT.md` — Docker + SQLite constraints; single local user; no cloud DB
- `.planning/REQUIREMENTS.md` — **PLAT-01** (Phase 1); money/FX semantics deferred to later reqs but storage rules locked here
- `.planning/ROADMAP.md` — Phase 1 goal and success criteria
- `.planning/STATE.md` — open concerns (journal_mode, money representation) addressed by this context

### Research (defaults overridden where CONTEXT conflicts)
- `.planning/research/SUMMARY.md` — Phase 1 deliverables; pitfall list (esp. float money, Docker volume loss)
- `.planning/research/STACK.md` — stack research; **override:** Next.js + Prisma + shadcn instead of Hono/Vite/Drizzle
- `.planning/research/ARCHITECTURE.md` — persistence layer, migrate-on-start, volume layout
- `.planning/research/PITFALLS.md` — WAL/FS issues; ban float money; persist smoke test

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield application (repo currently has GSD/planning tooling only).

### Established Patterns
- None in app code. Research recommends one Compose `web` service, host bind-mount for SQLite, migrate-on-start, health gated on DB.

### Integration Points
- New app root (Next.js) + `Dockerfile` + `docker-compose.yml` + Prisma schema/migrations + `/data` volume are the Phase 1 surface.
- Later phases plug domain tables and UI routes into this foundation; money INTEGER + rate × 10^8 must appear in the first schema stub.

</code_context>

<specifics>
## Specific Ideas

- User explicitly rejected research Hono + Vite + Drizzle stack in favor of **Next.js + Prisma + shadcn/ui**.
- Ready page should prove UI + DB together, not health-only.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Host path and journal mode left to Claude’s discretion (research defaults), not deferred as new capabilities.

</deferred>

---

*Phase: 1-Docker + SQLite Foundation*
*Context gathered: 2026-09-02*
