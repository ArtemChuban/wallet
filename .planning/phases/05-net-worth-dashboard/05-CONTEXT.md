# Phase 5: Net Worth Dashboard - Context

**Gathered:** 2026-09-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the current net-worth dashboard: true net worth (assets minus credit-card outstanding debt) in the primary currency, plus per-account balances in native currency and converted to primary (NW-01, NW-02, NW-03, ACCT-03). Uses LOCF balance as of today and LOCF FX as of today — same rules as Phases 3–4. Available credit is displayed on credit accounts but never counts as an asset. Phase 5 replaces the home readiness page and ships read-only dashboard UI plus NW aggregation helpers — not historical charts (Phase 6), not balance/FX CRUD (existing routes), not export or assets-vs-liabilities chart breakdown (v2 NW-04).

</domain>

<decisions>
## Implementation Decisions

### Dashboard placement & nav
- **D-01:** Replace **`/`** with the net-worth dashboard; remove the «Готовность» nav item (Phase 2 D-19). — **Reversibility:** costly — `/` is the default landing; reverting splits home vs dashboard again.
- **D-02:** Drop the standalone DB readiness page — if the database is unavailable, show a Russian error on the dashboard (no separate status screen). — **Reversibility:** reversible — readiness UI can return without schema changes.
- **D-03:** Nav label for `/` is **«Главная»**.
- **D-04:** Nav order: **«Главная»** first, then **«Валюты»**, then **«Счета»**.

### Headline net worth
- **D-05:** Show **one hero number only** — no assets/liabilities split on the dashboard in this phase (NW-04 deferred to v2).
- **D-06:** Hero label: **«Капитал»** (not «Чистый капитал»).
- **D-07:** Primary currency display uses **code only** next to the amount (e.g. `1 234 567,89 RUB`), consistent with account list formatting.
- **D-08:** **No as-of date** on the hero number — «current» means LOCF as of today (Europe/Moscow) without extra subtitle.

### Incomplete / partial data
- **D-09:** Account with **no balance snapshot** is **excluded from the capital total** and still listed on the dashboard where applicable.
- **D-10:** Non-primary account with **no FX rate** is **excluded from the capital total**; primary column shows **«—»** plus a **«нет курса»** hint (no link requirement in v1 — rates CRUD stays on `/currencies/rates`).
- **D-11:** When one or more accounts are excluded, show a **partial total** with a **prominent warning** until all accounts with balances can be converted and included (honest partial NW, not silent omission).
- **D-12:** **No accounts** → empty state with **CTA to create an account** (link/action toward `/accounts`).

### Account list on dashboard
- **D-13:** **Flat list** — all accounts in one list (same mental model as `/accounts`, not grouped by type or currency).
- **D-14:** Row columns: **account name + balance in native currency + balance in primary currency** (NW-02 + NW-03).
- **D-15:** **Credit accounts:** in the native column show **available + debt** (mirror Phase 3 list semantics); in the **primary column show debt only** (the amount that reduces net worth). Available credit never appears as a positive asset in either column or the total (ACCT-03).
- **D-16:** Dashboard account list is **read-only** — no expandable history, no set-balance or edit actions; mutations remain on **`/accounts`**.

### Claude's Discretion
- Exact Russian copy for partial-total warning, «нет курса», and empty-state CTA; warning visual treatment (banner vs callout).
- NW aggregation module placement (`src/lib/net-worth.ts` or extend `balances.ts` / `fx.ts`); batch LOCF queries mirroring `/accounts` and `/currencies/rates` pages.
- Reuse `formatMinorToMajor`, `convertOtherMinorToPrimaryMinor`, `creditDebtMinor`, `calendarDateToday`; new dashboard components vs slim read-only variant of account row markup.
- Primary-currency accounts: identity conversion (no FX row); asset types (debit/crypto/cash) contribute positive native balance to NW; credit contributes negative debt in primary only.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope
- `.planning/PROJECT.md` — core value (true NW in primary + native); snapshot-first; credit debt reduces NW
- `.planning/REQUIREMENTS.md` — **NW-01**, **NW-02**, **NW-03**, **ACCT-03** (Phase 5); note **NW-04** assets/liabilities chart breakdown is v2
- `.planning/ROADMAP.md` — Phase 5 goal and success criteria
- `.planning/STATE.md` — Phases 1–4 money/LOCF/FX contracts

### Prior phase decisions
- `.planning/phases/02-currencies-accounts/02-CONTEXT.md` — D-19 home → NW dashboard; Russian UI; primary RUB seeded forever
- `.planning/phases/03-dated-balance-snapshots/03-CONTEXT.md` — LOCF null-before-first; credit available + debt display; Europe/Moscow today
- `.planning/phases/04-dated-fx/04-CONTEXT.md` — `getRateAsOf` null before first rate (D-15); `convertOtherMinorToPrimaryMinor`; amount×rate UI belongs Phase 5

### Existing schema / code
- `src/lib/balances.ts` — `getBalanceAsOf`, `creditDebtMinor`, `calendarDateToday`
- `src/lib/fx.ts` — `getRateAsOf`, `convertOtherMinorToPrimaryMinor`
- `src/lib/money.ts` — `formatMinorToMajor`, `RATE_SCALE_E8`
- `src/app/page.tsx` — replace with dashboard (currently readiness stub)
- `src/components/nav.tsx` — update links/labels/order per D-01–D-04
- `src/components/accounts/AccountList.tsx` — row/display patterns to mirror for credit available+debt (read-only subset on dashboard)
- `src/app/accounts/page.tsx` — batch LOCF query pattern for reuse

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `convertOtherMinorToPrimaryMinor` — tested conversion at scale 8; use for non-primary → primary column and NW sum
- `creditDebtMinor` — debt derivation for credit rows and NW liability side
- `getBalanceAsOf` / batch snapshot LOCF on `/accounts` — same «today» semantics for dashboard
- `getRateAsOf` + rates batch on `/currencies/rates` — LOCF FX per currency code for today
- `AccountList` `LocfDisplay` — credit available+debt formatting to reuse or extract for dashboard rows

### Established Patterns
- Server Components fetch + serialize BigInt as string at RSC boundary
- Russian UI labels; `max-w-3xl` page width on list pages
- LOCF never invents zero before first snapshot or rate (BAL-02 / D-15)
- Nav: three top-level areas after Phase 5 (Главная, Валюты, Счета)

### Integration Points
- Replace `src/app/page.tsx` with NW dashboard Server Component
- Update `src/components/nav.tsx` — «Главная» first, remove readiness link
- New dashboard list component (read-only) fed by aggregated account+LOCF+FX data
- Export NW helper(s) for Phase 6 charts to reuse same as-of rules

</code_context>

<specifics>
## Specific Ideas

- Discussion language: Russian for user-facing questions; UI remains Russian-first.
- User chose «Главная» over «Капитал» for nav (hero label stays «Капитал»).
- Partial NW must warn visibly when totals omit accounts missing balance or FX.

</specifics>

<deferred>
## Deferred Ideas

- Historical net-worth and per-account charts — Phase 6 (CHART-01–03)
- Assets vs liabilities breakdown on charts — v2 NW-04
- Amount convert / rate calculator on rates tab — explicitly deferred Phase 4; not required on dashboard
- Expandable balance history or inline edit on dashboard — editing stays on `/accounts`
- Dedicated `/dashboard` route or retained DB readiness page — not chosen
- FX missing-state deep link «Задать курс» — user chose hint only, not required link

</deferred>

---

*Phase: 5-Net Worth Dashboard*
*Context gathered: 2026-09-03*
