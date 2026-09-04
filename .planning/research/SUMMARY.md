# Project Research Summary

**Project:** Wallet
**Domain:** Personal debts side-ledger on local NW tracker
**Researched:** 2026-09-04
**Confidence:** HIGH
**Milestone:** v1.1 Долги людям

## Executive Summary

v1.1 adds **people → debts → dated repayments** as a parallel domain beside the shipped net-worth tracker. No new runtime stack: keep Next 16 / Prisma 7 / SQLite / Zod / recharts / BigInt money. Debts must never enter `computeNetWorthRows` or NW charts; primary totals on «Долги» reuse FX as-of honesty (partial banner). Remaining = initial − Σ repayments − writeOff; early close records forgiveness explicitly.

Recommended build order: schema + pure math → person/debt CRUD + nav → repayments/close → charts + primary totals → NW isolation smoke.

## Key Findings

### Recommended Stack

**No new dependencies.** Reuse pinned Next/Prisma/recharts/Zod and `@/lib/money` converters.

**Core technologies:**
- Prisma models Person / Debt / DebtRepayment — persistence
- Server Actions + Dialog — Russian CRUD (accounts pattern)
- Pure `src/lib/debts.ts` — remaining, totals, series
- recharts — remaining step series + repayment amounts

### Expected Features

**Must have (table stakes):**
- Person entity with multiple debts
- Debt direction, currency, initial, optional due/note
- Same-currency dated repayments + history
- Auto-close at 0 + early write-off
- Charts: remaining over time + repayment amounts (native)
- Primary totals I-owe / they-owe with FX partial honesty
- Nav «Долги»; NW unchanged

**Defer:** filters, interest, cross-currency pay, savings goals, debt↔account linking

### Architecture Approach

Side-ledger with FK to Currency only. Detail charts in debt currency; list hero totals in primary as-of today. Multiple repayments per calendar day allowed.

**Major components:**
1. Schema + migration
2. Domain lib (remaining/totals/series) + Vitest
3. `/debts` UI + actions
4. Nav link; explicit non-coupling to NW

### Critical Pitfalls

1. **Debts leak into NW** — no imports into net-worth paths
2. **Edit initial after payments** — keep initial immutable
3. **Close without writeOffMinor** — audit lies
4. **Missing FX as 0** — use partial banner
5. **Unique repayment per day** — allow multiples

## Implications for Roadmap

Suggested phases (continue numbering after v1.0 phase 7 → start **Phase 8**):

### Phase 8: Debts schema + domain math
**Rationale:** Lock money semantics before UI  
**Delivers:** Person/Debt/DebtRepayment models; remaining/write-off/totals helpers + tests  
**Avoids:** over-repayment, missing write-off, NW coupling

### Phase 9: People + debts CRUD + nav
**Rationale:** Visible section without payments yet  
**Delivers:** `/debts` list, person/debt dialogs, «Долги» nav, RU empty states  
**Avoids:** credit-card confusion via copy

### Phase 10: Repayments + close/write-off
**Rationale:** Core ledger behavior  
**Delivers:** dated repayments, history, auto-close, early forgive  
**Avoids:** closed+backdate traps

### Phase 11: Charts + primary totals
**Rationale:** Needs repayment event stream  
**Delivers:** remaining + repayment charts; I-owe/they-owe primary hero  
**Avoids:** historical primary rewrite; dishonest FX

## Sources

- Existing codebase via codegraph: `net-worth.ts`, `money.ts`, `nav.tsx`, `schema.prisma`, accounts actions/dialogs
- PROJECT.md v1.1 milestone decisions (A2–I22)
- Shipped v1.0 patterns (BalanceSnapshot dating, FX partial totals, recharts)

## Research Gaps

- Exact route nesting (flat vs person detail) — decide in discuss/plan phase
- Whether person delete ships in v1.1 — optional nice-to-have
- Write-off as field vs typed repayment — prefer field + series inclusion

---
*Research completed: 2026-09-04*
*Ready for requirements: yes*
