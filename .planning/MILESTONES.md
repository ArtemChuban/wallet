# Milestones

## v1.3 Кредитка (Shipped: 2026-09-10)

**Closeout:** override_closeout  
**Known verification overrides:** 0 newly acknowledged, 2 carried forward from a prior close (see STATE.md Deferred Items)  
**Audit:** tech_debt (Nyquist VALIDATION draft on phases 19–22; 10/10 reqs satisfied)  
**Phases completed:** 5 phases, 13 plans, 31 tasks  
**Git range:** `v1.2` → `v1.3` (~160 commits, 136 files, +20k/−1k)  
**Timeline:** 2026-09-08 → 2026-09-10 (~2.5 days)

**Key accomplishments:**

- Bank contract → dual DOM + A′ locks (CONT-01 / Phase 18)
- Prisma dual DOM + CreditGraceObligation + pure next-month due math (CYCLE-01 / Phase 19)
- «Грейс» CRUD: schedule, amount due, early close, overdue, debt≠grace RU (Phases 20)
- Капитал «Прогноз» A′ ΔNW=0 + FX honesty banner (GRFCST-01/02 / Phase 21)
- GRISO twin suite — grace never touches BalanceSnapshot / historical LOCF (Phase 22)
- Audit 10/10 reqs · integration 15/15 · flows 6/6

---

## v1.2 Доходы (Shipped: 2026-09-08)

**Closeout:** verified_closeout  
**Known verification overrides:** 0 newly acknowledged, 4 carried forward from a prior close (see STATE.md Deferred Items)  
**Phases completed:** 5 phases, 14 plans, 39 tasks  
**Git range:** `ce71852` → `fb33b76` (~112 files, +22k/−861)  
**Timeline:** 2026-09-07 → 2026-09-08 (~1 day)

**Key accomplishments:**

- Four-model income side ledger + freeze-aware occurrences + DOM clamp (Phases 13)
- «Доходы» nav/CRUD with Person Restrict + DestructiveConfirmStep (Phase 14)
- Plan vs actual + overdue «заполни» + variance chrome (Phase 15)
- Per-Person hybrid income stats via FX LOCF honesty (Phase 16)
- Капитал dashed «Прогноз» overlay; INISO keeps historical NW income-free (Phase 17)
- Nyquist VALIDATION compliant for phases 13–17; audit 9/9 REQ + 5/5 flows

---

## v1.1 Долги людям (Shipped: 2026-09-07)

**Closeout:** override_closeout  
**Known verification overrides:** 5 newly acknowledged, 0 carried forward (see STATE.md Deferred Items)  
**Phases completed:** 5 phases, 18 plans, 46 tasks  
**Git range:** `f23fcd5` → `ef65ec4`  
**Timeline:** 2026-09-04 → 2026-09-07 (4 days)

**Key accomplishments:**

- Person/Debt/event Prisma models + BigInt remaining/status helpers; DISOL-01 keeps debts out of NW
- `/debts` people + debts CRUD, «Долги» nav, in-dialog DestructiveConfirmStep (app-wide)
- Dated repayments, size-changes, early forgive, auto-close at zero, mixed timeline
- Stale concurrent writes map to refresh RU (P2025 + forgive error surface)
- Native principal stack chart + primary «Я должен» / «Мне должны» totals with FX honesty
- Phase 12: router.refresh shells, UI-home for DestructiveConfirmStep, Nyquist 10–12 closed

---

## v1.0 MVP (Shipped: 2026-09-04)

**Closeout:** verified_closeout  
**Known verification overrides:** 0 newly acknowledged, 0 carried forward  
**Phases completed:** 7 phases, 24 plans, 65 tasks  
**Git range:** `57d2922` → `HEAD` (~247 files, +48k lines planning+app)  
**LOC:** ~16k TypeScript/TSX  
**Timeline:** 2026-09-02 → 2026-09-04 (3 days)

**Key accomplishments:**

- Docker + SQLite foundation: Next 16 / Prisma 7, migrate-on-start Compose, host-volume persist smoke (PLAT-01)
- Currencies + typed accounts: RUB primary seed, four account types, credit-limit metadata, Russian Dialog CRUD
- Dated balance snapshots with LOCF as-of reads; dated FX primary↔other with forward-effective rates
- Net-worth dashboard («Капитал») with native/primary rows, credit debt/available, partial-total honesty
- Historical NW + per-account charts (as-of balance × as-of FX) via recharts
- Shared `locf.ts` consolidation + Nyquist VALIDATION closed for phases 3–6 (153 tests)

### Residual tech debt (from milestone audit)

- Nav «Валюты» lands on `/currencies/rates` not `/currencies` (discoverability)
- Some FieldControl / restart / empty-CTA smokes remain human-only
- Account delete deferred to ACCT-04 (intentional v1 scope)

---
