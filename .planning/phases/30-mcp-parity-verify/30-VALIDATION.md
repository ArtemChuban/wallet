---
phase: "30"
slug: "mcp-parity-verify"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-22"
---

# Phase 30 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.11 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib/mcp/tools/accounts.test.ts src/lib/mcp/tools/forecast.test.ts src/lib/mcp/isolation-contract.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds (quick) / ~2–5 min (full) |

---

## Sampling Rate

- **After every task commit:** Run quick MCP trio above
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green + Orca UAT
- **Max feedback latency:** 60 seconds (quick)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 30-W0-01 | 01 | 0 | MCP-01 | T-30-01 | Catalog keys only; no live balances leaked | unit | `npx vitest run src/lib/mcp/tools/accounts.test.ts` | ✅ extend | ⬜ pending |
| 30-W0-02 | 01 | 0 | MCP-02 | T-30-02 | Forecast read never writes BalanceSnapshot | unit | `npx vitest run src/lib/mcp/tools/forecast.test.ts` | ✅ extend | ⬜ pending |
| 30-W0-03 | 01 | 0 | MCP-02 / SAVISO | T-30-02 | Isolation copy names SAVISO-01; no A′ | unit | `npx vitest run src/lib/mcp/isolation-contract.test.ts src/lib/mcp/tools/forecast.test.ts` | ✅ extend | ⬜ pending |
| 30-UAT | verify | — | PARITY-01 | T-30-02 | Overlay visible; snap count unchanged | Orca UAT | per OPERATOR.md | ❌ UAT | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Extend `src/lib/mcp/tools/accounts.test.ts` — SAVINGS field matrix + updated `Object.keys` allow-list
- [ ] Extend `src/lib/mcp/tools/forecast.test.ts` — interest event kind; drop A′ / income+grace-only description expects; optional source-scan for `listInterestSlotsInRange` in loader
- [ ] Extend `src/lib/mcp/isolation-contract.test.ts` — `SAVISO-01` required in create-handler

*Framework already present; gaps are test extensions, not new harness install.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Orca: list_accounts SAVINGS fields + get_forecast_overlay interest + snap count unchanged | PARITY-01 / MCP-01 / MCP-02 | Live MCP + UI drive per OPERATOR.md | Agent: `npm run dev` + Orca; if no накопительный, create via UI then call MCP tools |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
