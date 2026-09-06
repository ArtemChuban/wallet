# Milestones

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
