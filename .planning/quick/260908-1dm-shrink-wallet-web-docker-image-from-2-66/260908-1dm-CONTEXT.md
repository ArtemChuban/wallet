# Quick Task 260908-1dm: Shrink wallet-web Docker image from ~2.66GB — Context

**Gathered:** 2026-09-08
**Status:** Ready for planning

<domain>
## Task Boundary

Shrink wallet-web Docker image from ~2.66GB — maximize final image size reduction (standalone Next.js, prune node_modules in runner, alpine/slim, multi-stage hygiene). Baseline observed: `wallet-web:latest` ≈ 2.66GB after current multi-stage Dockerfile that COPYs full builder `node_modules` into runner.

</domain>

<decisions>
## Implementation Decisions

### Runner node_modules strategy
- Primary: minimal runtime set — Next standalone output + `src/generated` + only packages required for `prisma migrate deploy` and `better-sqlite3` (no full node_modules COPY from builder).
- Fallback if primary fails (app won't start / migrate / native binding broken): `npm ci --omit=dev` in runner (or equivalent production install), still smaller than copying builder node_modules.

### Base image
- Primary: try `node:24-alpine` for smaller base (accept musl + native rebuild risk for better-sqlite3).
- Fallback if alpine fails (build/runtime/native): keep `node:24-bookworm-slim`.

### Prisma migrate in runtime
- Migrate stays inside the container (entrypoint continues to run `prisma migrate deploy`). Prisma CLI (and its deps) remain in the runner image.
- Required: measure and surface how much image size grows specifically because of Prisma CLI / migrate tooling (before vs after / with vs without CLI footprint) so the operator can see the cost of keeping migrate in-image.

### Claude's Discretion
- Exact file/path list for the "minimal runtime" package set
- How to stage alpine vs slim fallback in Dockerfile (ARG switches, documented comments, or dual targets)
- How to measure Prisma CLI size contribution (dive/docker history/`du` in layer, or build variant without CLI for delta)
- Whether build-stage stays bookworm while only runner tries alpine

</decisions>

<specifics>
## Specific Ideas

- Current pain: `COPY --from=builder /app/node_modules ./node_modules` in runner (full deps).
- Prefer max shrink with graceful fallbacks rather than one brittle approach.
- Keep migrate-in-entrypoint; quantify Prisma CLI size tax explicitly in SUMMARY/verification.

</specifics>

<canonical_refs>
## Canonical References

- `Dockerfile` (current multi-stage: bookworm deps/builder, bookworm-slim runner)
- `docker/entrypoint.sh`
- Next.js `output: 'standalone'` (existing build)

</canonical_refs>
