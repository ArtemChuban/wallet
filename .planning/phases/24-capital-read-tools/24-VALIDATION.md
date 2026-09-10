---
phase: "24"
slug: "capital-read-tools"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-10"
---

# Phase 24 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.11 |
| **Config file** | `vitest.config.ts` (`include: ["src/**/*.test.ts"]`) |
| **Quick run command** | `npx vitest run src/lib/mcp/` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30–90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/mcp/`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 90 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status | fails_when |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|------------|
| 24-01-T1 | 01 | 1 | CAP-01…04 W0 | — | N/A | unit | `npx vitest run src/lib/mcp/tools/accounts.test.ts src/lib/mcp/tools/net-worth.test.ts src/lib/mcp/tools/balances.test.ts src/lib/mcp/tools/fx.test.ts` | ❌ W0 | ⬜ pending | stub missing / vitest non-zero / hard-fail poison |
| 24-01-T2 | 01 | 1 | D-09 | T-24-01 | string minors | unit | `npx vitest run src/lib/mcp/serialize.test.ts` | ❌ W0 | ⬜ pending | vitest non-zero / "0 passed" |
| 24-01-T3 | 01 | 1 | D-05/06/08 | T-24-04 | zod asOf | unit | `npx vitest run src/lib/mcp/as-of.test.ts` | ❌ W0 | ⬜ pending | vitest non-zero / today bypass |
| 24-02-T1 | 02 | 2 | CAP-02 | T-24-02 | computeNetWorthRows honesty | unit | `npx vitest run src/lib/mcp/tools/net-worth.test.ts src/lib/mcp/as-of.test.ts src/lib/mcp/serialize.test.ts` | ❌ W0 | ⬜ pending | markers absent / vitest non-zero |
| 24-02-T2 | 02 | 2 | CAP-02 | T-24-02 | adapter parity | unit | `npx vitest run src/lib/mcp/tools/net-worth.test.ts src/lib/mcp/localhost-guard.test.ts src/app/api/mcp/route.test.ts` | ❌ W0 | ⬜ pending | vitest non-zero / CAP-02 todo left |
| 24-03-T1 | 03 | 3 | CAP-01 | T-24-01 | metadata-only list | unit | `npx vitest run src/lib/mcp/tools/accounts.test.ts` | ❌ W0 | ⬜ pending | list_accounts missing / vitest non-zero |
| 24-03-T2 | 03 | 3 | CAP-03 | T-24-02 | conversionOk false | unit | `npx vitest run src/lib/mcp/tools/balances.test.ts` | ❌ W0 | ⬜ pending | markers missing / vitest non-zero |
| 24-03-T3 | 03 | 3 | CAP-01+03 | T-24-03 | handler wire | unit | `npx vitest run src/lib/mcp/tools/accounts.test.ts src/lib/mcp/tools/balances.test.ts src/lib/mcp/tools/net-worth.test.ts src/app/api/mcp/route.test.ts` | — | ⬜ pending | register markers missing / vitest non-zero |
| 24-04-T1 | 04 | 4 | CAP-04 | T-24-02 | FX transparency | unit | `npx vitest run src/lib/mcp/tools/fx.test.ts` | ❌ W0 | ⬜ pending | markers missing / vitest non-zero |
| 24-04-T2 | 04 | 4 | CAP-01…04 | T-24-03 | full catalog | unit | `npx vitest run src/lib/mcp/ src/app/api/mcp/route.test.ts` | — | ⬜ pending | CAP register missing / suite non-zero |
| 24-host | * | * | HOST regression | T-24-01 | localhost guard unchanged | unit | `npx vitest run src/app/api/mcp/route.test.ts src/lib/mcp/localhost-guard.test.ts` | ✅ | ⬜ pending | vitest non-zero |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/mcp/serialize.ts` + `serialize.test.ts` — BigInt/null helpers (D-09) — Plan 01 T2
- [ ] `src/lib/mcp/as-of.ts` + `as-of.test.ts` — default today + YYYY-MM-DD regex (D-05/06/08) — Plan 01 T3
- [ ] `src/lib/mcp/tools/{accounts,net-worth,balances,fx}.test.ts` — CAP-01…04 Wave 0 stubs — Plan 01 T1
- [ ] Prefer testing read assemblers with fixtures (no live SQLite) — mirror `net-worth.test.ts` style
- [ ] Framework install: none — Vitest already present

Existing domain tests (`src/lib/net-worth.test.ts`, `balances.test.ts`, `fx.test.ts`) remain math source of truth; MCP tests assert adapter parity + serialization.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Agent tools/list shows four CAP tools + ping | CAP-01…04 | Needs running app + MCP client | Start app; curl MCP initialize + tools/list; confirm names |
| Agent get_net_worth matches Капитал UI for same asOf | CAP-02 | Cross-surface parity | Compare MCP JSON total/isPartial to UI for fixture wallet |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (planned in 24-01)
- [x] No watch-mode flags
- [x] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter (after Wave 0 executes)

**Approval:** pending — plans authored; Wave 0 not yet executed
