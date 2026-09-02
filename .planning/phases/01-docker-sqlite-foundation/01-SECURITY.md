---
phase: "01"
slug: "docker-sqlite-foundation"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
created: "2026-09-02"
---

# Phase 01 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Developer workstation → npm registry | Package tarballs enter trust zone at install | next, prisma, better-sqlite3, shadcn helpers |
| Repo tree → container image | Scaffold/build artifacts become image layers | source, lockfile, prisma schema; must not include host DB |
| Browser/LAN → Next on :3000 | Untrusted network clients may reach published port | HTTP to health + app |
| Container process → /data SQLite | App UID writes durable finance data | SQLite file via bind mount |
| Env DATABASE_URL → adapter | Path string selects which file is opened | Fixed Compose/host URLs only |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-01-SC | Tampering | npm / image deps (next, prisma, better-sqlite3) | high | mitigate | Pin next@16.3.4, prisma@7.10.0, better-sqlite3@13.0.3 in package.json; Dockerfile rebuilds better-sqlite3 from lockfile only | closed |
| T-01-01 | Information Disclosure | docker-compose.yml ports | high | mitigate | Bind `127.0.0.1:3000:3000` only | closed |
| T-01-02 | Information Disclosure | ./data host DB | medium | mitigate | gitignore `data/*.db`; README + smoke `chmod 700 data` | closed |
| T-01-03 | Tampering | DATABASE_URL / health | high | mitigate | Compose `file:/data/wallet.db`; host default `file:./data/wallet.db`; health GET accepts no path/query | closed |
| T-01-04 | Elevation of Privilege | Dockerfile USER | high | mitigate | `USER node` in runner stage | closed |
| T-01-05 | Tampering / Spoofing | image layers / baked DB | medium | mitigate | Only `data/.gitkeep` tracked; no COPY of `*.db`; migrate-on-start via entrypoint | closed |
| T-01-06 | Tampering | money column types | high | mitigate | Prisma BigInt money/rate fields; money.test.ts rejects Float/Decimal | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

### Verification evidence (ASVS L1)

| Threat ID | Evidence |
|-----------|----------|
| T-01-SC | `package.json` pins; `Dockerfile` `npm ci && npm rebuild better-sqlite3` |
| T-01-01 | `docker-compose.yml:5` `"127.0.0.1:3000:3000"` |
| T-01-02 | `.gitignore` `data/*.db`; `README.md` chmod 700; `scripts/smoke-persist.sh` |
| T-01-03 | `docker-compose.yml` `DATABASE_URL: "file:/data/wallet.db"`; `src/lib/db.ts` default; `src/app/api/health/route.ts` `GET()` no params |
| T-01-04 | `Dockerfile:57` `USER node` |
| T-01-05 | `git ls-files data/` → `.gitkeep` only; Dockerfile COPY list has no `*.db` |
| T-01-06 | `prisma/schema.prisma` BigInt fields; `src/lib/money.test.ts` Float/Decimal negations |

---

## Accepted Risks Log

No accepted risks.

*Accepted risks do not resurface in future audit runs.*

---

## Unregistered Threat Flags

None — SUMMARY.md threat flags map to T-01-SC and T-01-01..05.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-02 | 7 | 7 | 0 | gsd-security-auditor |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-02
