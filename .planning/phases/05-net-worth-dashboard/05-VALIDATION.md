---
phase: "5"
slug: "net-worth-dashboard"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-09-03"
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.11 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run src/lib/net-worth.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run src/lib/net-worth.test.ts` (or `-t` filter for touched cases)
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-00-01 | 01 | 0 | NW-01 | — | Pure aggregation: assets − credit debt | unit | `npx vitest run src/lib/net-worth.test.ts -t "sums asset"` | ❌ W0 | ⬜ pending |
| 05-00-02 | 01 | 0 | NW-01, ACCT-03 | — | Credit debt reduces total; available not in sum | unit | `npx vitest run src/lib/net-worth.test.ts -t "subtracts credit debt"` | ❌ W0 | ⬜ pending |
| 05-00-03 | 01 | 0 | NW-01 | — | Missing balance/FX excluded; isPartial flag | unit | `npx vitest run src/lib/net-worth.test.ts -t "excludes"` | ❌ W0 | ⬜ pending |
| 05-00-04 | 01 | 0 | NW-03 | — | Primary currency identity (no FX row) | unit | `npx vitest run src/lib/net-worth.test.ts -t "primary currency"` | ❌ W0 | ⬜ pending |
| 05-00-05 | 01 | 0 | NW-02, ACCT-03 | — | Native column semantics per account type | unit | `npx vitest run src/lib/net-worth.test.ts -t "nativeDisplay\|available"` | ❌ W0 | ⬜ pending |
| 05-W1 | 01 | 1 | NW-01–03 | — | Dashboard RSC + nav + list chrome | unit+grep | `npm test -- --run src/lib/net-worth.test.ts && grep -q 'Главная' src/components/nav.tsx && grep -q 'Капитал' src/app/page.tsx` | ❌ W0 | ⬜ pending |
| 05-W2 | 02 | 2 | NW-01–03, ACCT-03 | — | Partial warning + empty state + credit rows | unit+manual | `npm test` + human UI on `/` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/net-worth.ts` — pure aggregation API for rows + total + `isPartial`
- [ ] `src/lib/net-worth.test.ts` — matrix covering NW-01–03, ACCT-03, primary identity, mixed portfolio
- [ ] `src/app/page.tsx` — replace readiness stub with dashboard RSC
- [ ] `src/components/dashboard/DashboardAccountList.tsx` — read-only list
- [ ] `src/components/nav.tsx` — Главная first; remove Готовность
- [ ] Framework install: none — vitest already present

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Nav order «Главная» · «Валюты» · «Счета» | NW-01 | Visual nav chrome | Open `/`, confirm nav order and active «Главная» |
| Partial-warning callout when accounts excluded | NW-01 | Visual treatment | Create account without balance or FX; confirm «Итог неполный» banner |
| Empty state CTA | NW-01 | Visual CTA | With zero accounts, confirm «Перейти к счетам» links to `/accounts` |
| Credit row native available+debt / primary debt only | ACCT-03 | Row layout | Credit account with LOCF: native shows available+debt; primary shows debt only |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
