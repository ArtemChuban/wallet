---
phase: "30"
slug: "mcp-parity-verify"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: validated
nyquist_compliant: false
wave_0_complete: true
created: "2026-09-22"
validated: "2026-09-22"
---

# Phase 30 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.11 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib/mcp/tools/accounts.test.ts src/lib/mcp/tools/forecast.test.ts src/lib/mcp/isolation-contract.test.ts src/lib/mcp/phase-30-parity-gate.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds (quick) / ~2–5 min (full) |

---

## Sampling Rate

- **After every task commit:** Run quick MCP quartet above
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green + Orca UAT
- **Max feedback latency:** 60 seconds (quick)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 30-W0-01 | 01 | 0 | MCP-01 | T-30-01 | Catalog keys only; no live balances leaked | unit | `npx vitest run src/lib/mcp/tools/accounts.test.ts` | ✅ | ✅ green |
| 30-W0-02 | 01 | 0 | MCP-02 | T-30-02 | Forecast read never writes BalanceSnapshot | unit | `npx vitest run src/lib/mcp/tools/forecast.test.ts` | ✅ | ✅ green |
| 30-W0-03 | 01 | 0 | MCP-02 / SAVISO | T-30-02 | Isolation copy names SAVISO-01; no A′ | unit | `npx vitest run src/lib/mcp/isolation-contract.test.ts src/lib/mcp/tools/forecast.test.ts` | ✅ | ✅ green |
| 30-02-01 | 02 | 2 | PARITY-01 / D-16 | T-30-02 | COVERAGE no-external + savings todo still pending | unit | `npx vitest run src/lib/mcp/phase-30-parity-gate.test.ts` | ✅ | ❌ red (D-16) |
| 30-UAT | verify | — | PARITY-01 | T-30-02 | Overlay visible; snap count unchanged | Orca UAT | per OPERATOR.md | ❌ UAT | ⚠️ manual |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky/manual*

---

## Wave 0 Requirements

- [x] Extend `src/lib/mcp/tools/accounts.test.ts` — SAVINGS field matrix + updated `Object.keys` allow-list
- [x] Extend `src/lib/mcp/tools/forecast.test.ts` — interest event kind; drop A′ / income+grace-only description expects; source-scan for `listInterestSlotsInRange` in loader
- [x] Extend `src/lib/mcp/isolation-contract.test.ts` — `SAVISO-01` required in create-handler

*Framework already present; Wave 0 contracts green (25/25 on MCP trio).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Orca: list_accounts SAVINGS fields + get_forecast_overlay interest + snap count unchanged | PARITY-01 / MCP-01 / MCP-02 | Live MCP + UI drive per OPERATOR.md | Agent: `npm run dev` + Orca; evidence in `30-UAT.md` |
| D-16 savings todo must remain under `.planning/todos/pending/` until `/gsd-complete-milestone` v1.5 | PARITY-01 / D-16 | **ESCALATED** — file currently under `completed/`; auditor cannot move todos | Developer: restore `2026-09-10-savings-account-type-with-interest-nw-forecast.md` to `pending/`; re-run `npx vitest run src/lib/mcp/phase-30-parity-gate.test.ts` |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter — **blocked on D-16** (todo prematurely completed)

**Approval:** validated partial 2026-09-22 (Nyquist audit)

---

## Validation Audit 2026-09-22

| Metric | Count |
|--------|-------|
| Gaps found | 4 |
| Resolved | 3 |
| Escalated | 1 |

### Gap detail

| Gap | Requirement | Action | Result |
|-----|-------------|--------|--------|
| 30-W0-01 | MCP-01 catalog matrix | Re-ran existing `accounts.test.ts` | FILLED — green |
| 30-W0-02 | MCP-02 interest + never-write | Re-ran existing `forecast.test.ts` | FILLED — green |
| 30-W0-03 | SAVISO-01 isolation | Re-ran existing `isolation-contract.test.ts` | FILLED — green |
| 30-02-01 / D-16 | Savings todo stays pending | Added `phase-30-parity-gate.test.ts`; assert pending path | ESCALATED — todo at `completed/`; test red after 1/3 |

### Debug iterations (D-16)

| Iteration | Error type | Action | Result |
|-----------|------------|--------|--------|
| 1 | Assertion: pending path missing | Confirmed file at `.planning/todos/completed/…`; requirement D-16 unmet | ESCALATE (impl/artifact) |

### Recommendation

Restore savings todo to `.planning/todos/pending/` (do not mark resolved until `/gsd-complete-milestone` v1.5). Then:

```bash
npx vitest run src/lib/mcp/phase-30-parity-gate.test.ts
```

Expect 2/2 pass → set `nyquist_compliant: true`.
