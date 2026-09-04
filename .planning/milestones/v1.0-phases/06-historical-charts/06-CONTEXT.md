# Phase 6: Historical Charts - Context

**Gathered:** 2026-09-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver historical net-worth and per-account charts that reuse Phase 3–5 as-of rules: each point is LOCF balance × LOCF FX as of that date (CHART-01, CHART-02, CHART-03). Charts live on the home dashboard (`/`) — NW chart under Капитал, per-account chart via row expand (chart only; balance/FX CRUD stays on `/accounts` and `/currencies/rates`). Not assets vs liabilities breakdown (v2 NW-04), not a dedicated `/history` route, not new balance mutation surfaces on home.

</domain>

<decisions>
## Implementation Decisions

### Chart placement
- **D-01:** Historical **net-worth chart** lives on **`/`** under the Капитал hero (same page as the dashboard). — **Reversibility:** reversible — can extract a dedicated route later without changing series math.
- **D-02:** **Per-account** history chart opens by **expanding the account row on `/`** (not on `/accounts` for this phase).
- **D-03:** Home layout order: **Hero («Капитал») → NW chart → account list**.
- **D-04:** Account expand shows **chart only** — no snapshot history list and no set/delete on home (Phase 5 D-16 stays: mutations remain on `/accounts`).

### Time range & sampling
- **D-05:** Range control uses fixed presets: **30d / 90d / 1y / all**. — **Reversibility:** reversible — presets are UI-only.
- **D-06:** Default preset when opening charts: **30d**.
- **D-07:** Chart points are **event dates + today** — emit a point when a relevant snapshot or FX change affects that series, and always include **today** as an endpoint (not one point per calendar day). — **Reversibility:** costly — densifying to daily later changes series shape and performance assumptions.
- **D-08:** **One shared range** applies to the NW chart and any open account expand (same preset for both).

### Per-account currency & credit
- **D-09:** Per-account chart has a **native ↔ primary toggle**; **default = native**.
- **D-10:** **Hide the toggle** when the account’s currency is the **primary** currency (series is already primary).
- **D-11:** **Credit** accounts plot **both series stacked**: **debt + available** (user: «stacked»).
- **D-12:** In **primary** mode for credit, **both stack segments convert to primary** (not debt-only).

### Sparse / gap UX
- **D-13:** When there is **no includable data** in the window: show **empty chart axes with zero points** (not a copy-only empty state).
- **D-14:** **Partial NW days** (some accounts missing balance or FX): still **plot a point** using only convertible/included accounts; **do not mark** the day as partial (no badge/tooltip). — User: «1, но модель не помечать».
- **D-15:** If the series has **exactly one point**: show **that single point on the axes**, **no line**.
- **D-16:** Per-account **primary** mode: if an event date has **no FX**, **skip that point** (native series may still include it; primary line may break).

### Claude's Discretion
- Chart library choice (none in package.json yet) and component structure under `src/components/dashboard/` or similar.
- Exact Russian labels for range presets (30д / 90д / 1г / всё) and native/primary toggle chrome.
- How “event dates” are unioned for NW (union of all accounts’ balance events + FX events that affect included accounts) vs per-account (that account’s snapshots + FX for its currency when plotting primary).
- Visual styling of stacked credit series; empty-axes treatment details.
- Whether shared range state is URL/searchParams, client state, or cookie — pick the smallest fit with App Router patterns already in the app.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project scope
- `.planning/PROJECT.md` — core value; snapshot-first history; Russian-first UI
- `.planning/REQUIREMENTS.md` — **CHART-01**, **CHART-02**, **CHART-03**; note **NW-04** assets/liabilities chart breakdown is v2
- `.planning/ROADMAP.md` — Phase 6 goal and success criteria (as-of balance × as-of FX; today’s FX must not rewrite earlier points)
- `.planning/STATE.md` — Phases 1–5 money/LOCF/FX/NW contracts

### Prior phase decisions
- `.planning/phases/03-dated-balance-snapshots/03-CONTEXT.md` — LOCF null-before-first; credit available + derived debt; Europe/Moscow today
- `.planning/phases/04-dated-fx/04-CONTEXT.md` — `getRateAsOf` null before first rate (D-15); primary↔other only; forward-effective LOCF
- `.planning/phases/05-net-worth-dashboard/05-CONTEXT.md` — `/` = dashboard; hero «Капитал»; exclude no_balance/no_fx from total; credit primary shows debt; dashboard read-only (D-16); export NW helpers for Phase 6

### Existing schema / code
- `src/lib/net-worth.ts` — `computeNetWorthRows` / contribution rules to reuse per as-of date
- `src/lib/balances.ts` — `getBalanceAsOf`, `creditDebtMinor`, `calendarDateToday`
- `src/lib/fx.ts` — `getRateAsOf`, `convertOtherMinorToPrimaryMinor`
- `src/lib/money.ts` — `formatMinorToMajor`, `RATE_SCALE_E8`
- `src/app/page.tsx` — home dashboard host for hero + list; extend with NW chart + expand
- `src/components/dashboard/DashboardAccountList.tsx` — read-only rows to extend with expand → chart
- `src/components/nav.tsx` — keep three links; no new top-level History nav (D-01)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `computeNetWorthRows` — same include/exclude and credit contribution rules for each historical as-of date
- `getBalanceAsOf` / batch snapshot LOCF — per-date native balances
- `getRateAsOf` / `convertOtherMinorToPrimaryMinor` — per-date FX; null = skip primary point (D-16)
- `creditDebtMinor` — debt segment of stacked credit series
- `DashboardAccountList` — expand affordance for per-account chart (chart-only body)

### Established Patterns
- Server Components fetch + BigInt serialized as string at RSC → client boundary
- Russian UI; `max-w-3xl` shell on home
- LOCF never invents zero/rate before first row (BAL-02 / FX D-15)
- Dashboard mutations forbidden on `/` (Phase 5 D-16)

### Integration Points
- Extend `src/app/page.tsx` layout: hero → chart → list
- Add shared range preset control on home (client island likely)
- New series builder (lib) that samples event dates + today and maps each date through NW/account rules
- Expand row in `DashboardAccountList` to host per-account chart + native/primary toggle
- No new nav item; no chart dependency yet — planner picks library

</code_context>

<specifics>
## Specific Ideas

- Discussion switched to Russian mid-session; UI remains Russian-first.
- Credit chart: user said **«3, stacked»** — both debt and available as a **stack**.
- Partial NW days: user said **«1, но модель не помечать»** — plot partial total, **no** partial badge/model marking.

</specifics>

<deferred>
## Deferred Ideas

- Dedicated `/history` or `/charts` route — not chosen for v1 Phase 6
- Assets vs liabilities breakdown on charts — v2 **NW-04**
- Per-account chart expand on `/accounts` — deferred; Phase 6 uses `/` only
- Snapshot history list / CRUD inside home expand — stays on `/accounts`
- Daily densified calendar sampling — not chosen (event + today instead)

</deferred>

---

*Phase: 6-Historical Charts*
*Context gathered: 2026-09-03*
