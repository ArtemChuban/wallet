# Phase 18: Bank contract study + discuss locks - Context

**Gathered:** 2026-09-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Document T-Bank Platinum (ТП 7.90) grace rules from the user-supplied tariff and lock cycle / overlay / vocabulary decisions so Phase 19+ can plan schema and UI without re-asking. Delivers CONT-01 only: CONTEXT + contract notes — **no** Prisma schema, **no** UI, **no** forecast wiring in this phase.

Does **not** deliver: obligation CRUD, Капитал chart changes, APR engine, minimum-payment tracking, cash-advance modeling.

</domain>

<decisions>
## Implementation Decisions

### Bank contract + cycle math
- **D-01:** Cycle **start** = statement (выписка) formation date; this card uses fixed **DOM 21**. — **Reversibility:** costly — schedule fields and cycle keys assume statement-anchored months.
- **D-02:** Interest-free **due** = **DOM 15 of the next month**, always (not a fixed `+N` calendar days). N varies (~22–25; shorter in February). «До 55 дней» in the tariff is marketing max from early-period purchase → due, **not** statement+55. — **Reversibility:** one-way — RESEARCH defaulted to `graceDurationDays` alone; product truth is **dual DOM** (statement day + due day next month). Duration may be derived for display; do not treat a single stored N as the sole source of truth for this bank.
- **D-03:** Month-end for statement DOM uses **`clampDayOfMonth`** (same as income). Due DOM 15 never needs clamp.
- **D-04:** `dueAsOf` = the 15th **inclusive**; overdue / highlight from the **16th** (Moscow calendar day, app convention).
- **D-05:** Amount due = **one manual field**: full «платёж для беспроцентного периода» from the statement (debt without installments + regular installment payment). No second field for installments; user copies bank total.
- **D-06:** Changing statement day in the bank app is **out of design scope** for v1.3 — account stores editable DOM fields; change = manual edit; no history migration engine.

### Interest-free vs revolving OOS
- **D-07:** On missed due: **overdue highlight** + short RU hint that the bank may charge interest — **no** APR/penalty math in-app.
- **D-08:** Cash / cash-like ops (59.9%): **fully OOS** — no modeling, no special type.
- **D-09:** Bank rule «missed minimum voids next interest-free»: **not modeled** (would need minimum amount / triad UI).
- **D-10:** Penalty 20%, overlimit fee, insurance %: **all OOS**. Wallet tracks grace payoff amount + forecast visibility only.

### NW overlay (Option A′)
- **D-11:** Reject naive Option A dip (`−grace` on «Прогноз» while credit **Задолженность** already reduces NW). Lock **A′ NW-neutral pay**: at `dueAsOf`, obligation is **visible**, forecast **NW delta = 0** (debt offset / pay-from-assets semantics). — **Reversibility:** costly — Phase 21 chart/tests and signed-slot design depend on this; differs from research default “cash-out dip”.
- **D-12:** Visibility at zero NW delta = **tooltip / point detail** on due (not a second chart series in v1.3).
- **D-13:** Same-day income + grace: **one** signed cumulative «Прогноз» series; tooltip **distinguishes** income vs obligation.

### RU vocabulary
- **D-14:** Snapshot credit debt label: **«Задолженность»**.
- **D-15:** Manual grace amount label: **«Платёж для беспроцентного»** (align with bank wording; not «минимальный платёж»).
- **D-16:** Minimum payment: **not shown** in UI for v1.3.
- **D-17:** Schedule fields: **«Дата выписки»** + **«Оплатить до»**.
- **D-18:** Obligation UX status: **«К оплате»** / **«Оплачено»**; overdue = highlight, not a separate persisted status enum required by discuss.
- **D-19:** Chart tooltip copy: **«Платёж для беспроцентного»** + пояснение **«NW без изменения (оплата карты)»**.

### Claude's Discretion
- Exact microcopy for overdue interest hint (D-07) — keep short, match Debts/Income tone.
- Implementation of NW-neutral offset (literal `+debt` leg vs membership-only slot with 0 delta) — research/plan choose simplest correct approach under D-11–D-13.
- Whether Phase 19 stores `statementDayOfMonth` + `dueDayOfMonth` vs anchor date + dual DOM ints — must satisfy D-02; prefer dual DOM over sole `graceDurationDays`.

### Folded Todos
- **Improve credit account type (limit, grace period, statement-date forecasting)** (`.planning/todos/pending/2026-09-05-improve-credit-account-type-with-limit-grace-period-and-fore.md`) — folded into v1.3 / Phase 18 contract study; grace + forecast intent absorbed by milestone requirements CONT-01…GRISO-01. Complete/close this todo when committing context.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase / milestone scope
- `.planning/ROADMAP.md` — Phase 18 success criteria (contract study, cycle locks, overlay A/B, RU vocab)
- `.planning/REQUIREMENTS.md` — CONT-01; Out of Scope (no APR engine, no min/statement/full triad, no snapshot-derived due)
- `.planning/PROJECT.md` — v1.3 goal; manual amount; overlay-only; contract gate
- `.planning/STATE.md` — pending Phase 18 locks (this file resolves them)

### Contract artifacts (this phase)
- `.planning/phases/18-bank-contract-study-discuss-locks/18-CONTRACT-NOTES.md` — distilled rules + user calendar (21 → 15 next)
- `.planning/phases/18-bank-contract-study-discuss-locks/platinum-TP-7.90.pdf` — user tariff sheet ТП 7.90
- `.planning/phases/18-bank-contract-study-discuss-locks/platinum-TP-7.90.txt` — extracted text
- https://cdn.tbank.ru/static/documents/credit_cards-tariff-rules.pdf — «Беспроцентный период» / «Льготный период» definitions; TP 7.90 uses min-payment date as interest-free deadline

### Research (adjust where this CONTEXT overrides)
- `.planning/research/SUMMARY.md` — architecture sketch; **override** default overlay A dip → A′ NW-neutral (D-11); **override** sole duration-days → dual DOM (D-02)
- `.planning/research/ARCHITECTURE.md` — Account grace fields + obligation child; `nw-forecast` signed slots
- `.planning/research/PITFALLS.md` — stock/flow double-count; calendar operators; skip-contract risk

### Prior phase locks
- `.planning/milestones/v1.2-phases/17-nw-forecast-overlay-isolation/17-CONTEXT.md` — forecast membership, FX LOCF honesty, INISO / no BalanceSnapshot from side ledgers
- `.planning/OPERATOR.md` — agent-driven UAT (later phases)

### Code anchors (for later phases; not implemented in 18)
- `src/lib/nw-forecast.ts` — extend for grace slots under D-11–D-13
- `src/lib/dates.ts` — `clampDayOfMonth`, `addCalendarDays` (due may be DOM next month, not +N)
- `src/lib/net-worth.ts` / `src/lib/historical-series.ts` — must stay grace-free (GRISO)
- `src/lib/account-type.ts` / Prisma `Account` FIAT_CREDIT — grace config home
- `src/lib/iniso.test.ts` — pattern to mirror as GRACEISO

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `nw-forecast.ts` + `DashboardChartsShell` / `NetWorthHistoryChart` — Phase 21 merge point for A′ tooltips
- `clampDayOfMonth` / Moscow calendar helpers in `dates.ts` — statement DOM advance
- Credit account UI (`AccountFormDialog`, limit/debt snapshots) — Phase 20 attaches schedule + amount fields
- INISO / DISOL isolation tests — template for GRACEISO

### Established Patterns
- Side ledgers never write `BalanceSnapshot`; forecast is overlay-only
- Manual amounts in minor units + Zod; Russian-first labels
- DestructiveConfirmStep (no `window.confirm`) for early close later

### Integration Points
- Grace config on FIAT_CREDIT `Account`; obligations as child rows keyed by cycle start (research sketch)
- Капитал `/` forecast series — income + grace coexistence per D-13
- Phase 18 itself: docs only under `.planning/phases/18-bank-contract-study-discuss-locks/`

</code_context>

<specifics>
## Specific Ideas

- Real card calendar: **выписка 21-го**, **оплатить до 15-го следующего месяца**.
- User explicitly required fixing double-count while keeping “slot at due” spirit → A′ NW-neutral + tooltip.
- Bank PDF path originally `/home/artem/Downloads/platinum.pdf`; copied into phase dir for agents.

</specifics>

<deferred>
## Deferred Ideas

None new — discussion stayed inside Phase 18 / CONT-01. APR engine, minimum triad, cash modeling, statement-date migration remain milestone Out of Scope.

</deferred>

---

*Phase: 18-Bank contract study + discuss locks*
*Context gathered: 2026-09-08*
