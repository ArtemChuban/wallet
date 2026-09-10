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

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 24-W0-01 | 01 | 0 | D-09 | — | N/A | unit | `npx vitest run src/lib/mcp/serialize.test.ts` | ❌ W0 | ⬜ pending |
| 24-W0-02 | 01 | 0 | D-05/06/08 | — | N/A | unit | `npx vitest run src/lib/mcp/as-of.test.ts` | ❌ W0 | ⬜ pending |
| 24-01-xx | 01+ | 1+ | CAP-01 | T-24-01 | read-only tool; no mutate imports | unit | `npx vitest run src/lib/mcp/tools/accounts.test.ts` | ❌ W0 | ⬜ pending |
| 24-02-xx | 01+ | 1+ | CAP-02 | T-24-02 | partial FX honesty; no invented rates | unit | `npx vitest run src/lib/mcp/tools/net-worth.test.ts` | ❌ W0 | ⬜ pending |
| 24-03-xx | 01+ | 1+ | CAP-03 | T-24-02 | null primary + reason; no agent convert | unit | `npx vitest run src/lib/mcp/tools/balances.test.ts` | ❌ W0 | ⬜ pending |
| 24-04-xx | 01+ | 1+ | CAP-04 | T-24-02 | FX transparency only | unit | `npx vitest run src/lib/mcp/tools/fx.test.ts` | ❌ W0 | ⬜ pending |
| 24-host | * | * | HOST regression | T-24-01 | localhost guard unchanged | unit | `npx vitest run src/app/api/mcp/route.test.ts src/lib/mcp/localhost-guard.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

*Planner MUST refine Task IDs to match final PLAN.md task numbering.*

---

## Wave 0 Requirements

- [ ] `src/lib/mcp/serialize.ts` + `serialize.test.ts` — BigInt/null helpers (D-09)
- [ ] `src/lib/mcp/as-of.ts` + `as-of.test.ts` — default today + YYYY-MM-DD regex (D-05/06/08)
- [ ] `src/lib/mcp/tools/{accounts,net-worth,balances,fx}.test.ts` — CAP-01…04 Wave 0 stubs / fixtures
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

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 90s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
