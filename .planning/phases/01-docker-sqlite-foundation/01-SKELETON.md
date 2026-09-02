# Walking Skeleton — Wallet

**Phase:** 1
**Generated:** 2026-09-02

## Capability Proven End-to-End

A local user can `docker compose up`, open http://127.0.0.1:3000/, see «Кошелёк готов» with DB readiness, and keep `./data/wallet.db` across container stop/start.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16.3.4 App Router, `output: 'standalone'` | Locked D-01; UI + Route Handlers in one process |
| Data layer | SQLite file on host bind-mount `./data:/data` via Prisma 7.10.0 + `@prisma/adapter-better-sqlite3` | Locked D-03; PLAT-01 host persistence |
| Auth | None (single local user) | PROJECT.md / v1 scope |
| Deployment target | Local Docker Compose (Node 24 bookworm build, bookworm-slim runner) | Locked D-05; native better-sqlite3 |
| Directory layout | `src/app` routes, `src/lib` db/money, `prisma/` schema+migrations, `docker/` entrypoint | RESEARCH structure; greenfield |
| Money storage | INTEGER/`BigInt` minor units; required `Currency.scale`; FX `BigInt` × 10^8 (`RATE_SCALE_E8`) | Locked D-07–D-09 |
| UI kit | shadcn/ui on App Router | Locked D-04 |
| Migrate lifecycle | `prisma migrate deploy` in container entrypoint before `node server.js` | Locked D-02 |

## Stack Touched in Phase 1

- [ ] Project scaffold (framework, build, lint, test runner)
- [ ] Routing — at least one real route
- [ ] Database — at least one real read AND one real write
- [ ] UI — at least one interactive element wired to the API
- [ ] Deployment — running on dev environment OR documented local full-stack run command

## Out of Scope (Deferred to Later Slices)

- Currencies CRUD UI and primary-currency rules (Phase 2)
- Account types and credit limit/debt UX (Phase 2)
- Dated balance snapshots and LOCF reads (Phase 3)
- Dated FX pairs and conversion UX (Phase 4)
- Net-worth dashboard math (Phase 5)
- Historical charts (Phase 6)
- Auth, multi-user, cloud sync, bank sync, auto FX APIs

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: Currencies + typed accounts CRUD
- Phase 3: Dated balance snapshots + LOCF
- Phase 4: Dated FX primary ↔ other
- Phase 5: Current net-worth dashboard
- Phase 6: Historical NW and per-account charts
