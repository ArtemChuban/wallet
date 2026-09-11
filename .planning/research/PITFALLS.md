# Pitfalls Research

**Domain:** Adding SAVINGS account type + monthly interest forecast overlay to existing Wallet (INISO/GRISO walls, LOCF NW, PARITY-01 MCP)
**Researched:** 2026-09-11
**Confidence:** HIGH (isolation/integration pitfalls from shipped INISO/GRISO/forecast code); MEDIUM (APR/APY industry math vs user-locked annual%÷12)
**Milestone:** v1.5 Сберегательный счет

## Critical Pitfalls

### Pitfall 1: Treating SAVINGS like income/grace side ledger (exclude principal from NW)

**What goes wrong:**
Implementer copies DISOL/INISO mental model and keeps SAVINGS out of `computeNetWorthRows` / LOCF — or puts principal only in forecast. Hero NW understates capital. Or inverse: treats interest like balance and writes it into historical series.

**Why it happens:**
v1.2–v1.3 trained the team that “new money domain = side ledger, never LOCF.” SAVINGS breaks that pattern: **principal is a real account asset** (BalanceSnapshot LOCF); **interest accrual is forecast-only**. Two layers, one type name.

**How to avoid:**
- Extend `AccountType` + `isAssetType` / `NetWorthAccountType` so SAVINGS contributes like ASSET/FIAT_DEBIT/CASH/CRYPTO.
- Interest slots only enter `buildNetWorthForecastSeries` (new `ForecastSlotKind`, e.g. `"interest"`), never `BuildNetWorthSeriesInput`.
- Schema: rate + accrual DOM nullable and **required iff SAVINGS** (mirror FIAT_CREDIT ↔ creditLimitMinor CHECK pattern).

**Warning signs:**
- `isAssetType("SAVINGS") === false`
- SAVINGS missing from `NetWorthAccountType` union
- Interest fields on RecurringIncome-like tables instead of Account
- Past LOCF totals change when rate/DOM edited with no new snapshots

**Phase to address:**
Account type / schema phase (first) — before forecast math

---

### Pitfall 2: Auto BalanceSnapshot on accrual day (breaks user lock + INISO twin)

**What goes wrong:**
Cron, server action, or “helpful” UI writes `balanceSnapshot.upsert` when accrual DOM arrives. Historical LOCF jumps without user edit. Overlay + fact double-count. Violates PROJECT Out of Scope: “Auto BalanceSnapshot when savings interest accrues — deferred.”

**Why it happens:**
Banks post interest to balance; natural instinct is mirror that. Income actual already ≠ BalanceSnapshot (ISO-01) — easy to “fix” for savings by writing the snapshot income refused.

**How to avoid:**
- Ship forecast overlay only; accrual never calls `balanceSnapshot.create|update|upsert|delete`.
- Clone GRISO never-call pattern: SAVINGS create/update actions + any interest helper assert zero BalanceSnapshot mutates (file-scan + action tests).
- New isolation id (e.g. SAVISO-01) twin of `iniso.test.ts` / `griso.test.ts`: import bans on `net-worth.ts` / `historical-series.ts`; `nw-forecast.ts` still bans prisma/BalanceSnapshot.

**Warning signs:**
- Interest helper imports `@/app/accounts/actions` or prisma BalanceSnapshot
- Accrual date “mark received” button that upserts balance
- Past series golden identity fails when SAVINGS rate fixtures present

**Phase to address:**
Interest forecast + isolation regression phase (same wave as overlay wire) — not deferred polish

---

### Pitfall 3: Folding interest into `buildNetWorthSeries` / past LOCF

**What goes wrong:**
Interest for accrual dates ≤ today baked into fact line. Chart “history” includes expected interest never snapshotted. Breaks Core Value (“history you can trust”) and INISO/GRISO contract that forecast is overlay-only.

**Why it happens:**
`mergeFactAndForecast` already merges on dates; tempting shortcut is mutate fact points or pass interest into series builder. `ForecastSlotKind` today is only `"income" | "grace"` — wrong kind semantics (grace ΔNW=0) hide the bug until UAT.

**How to avoid:**
- Membership: interest slots only when accrual sample date **> today** (same gate as income in `slotInWindow` / `load-forecast-overlay`).
- Addend: interest uses **positive** primary minor (like income), never grace `0n`.
- Keep `buildNetWorthSeries` API free of interest/rate fields; extend INISO-style type-level `AssertNever` forbidden keys.
- Wire both `DashboardChartsShell` and `loadForecastOverlay` from one membership helper — MCP/UI parity.

**Warning signs:**
- Solid NW line jumps on future accrual dates without BalanceSnapshot
- `kind === "grace"` used for interest “because tooltip”
- MCP `get_forecast_overlay` description still says only “income + A′ grace”

**Phase to address:**
Forecast overlay integration phase

---

### Pitfall 4: Silent “correct” compound/APY/daily engine vs locked annual%÷12

**What goes wrong:**
Implement `(1+r)^(1/12)-1`, daily APR/365, or interest-on-forecast-interest across horizon. Numbers disagree with user lock (`balance × annual%/12`). UI shows APY language while math is simple monthly.

**Why it happens:**
Industry material warns “don’t divide APY by 12” (compound monthly factor differs). Banks often accrue daily on nominal rate. Engineers “fix” the locked simple formula. Multi-month overlay then compounds projected interest into next month’s base without a product decision.

**How to avoid:**
- Lock formula in CONTEXT + unit tests: `interestMinor = balanceLocfMinor * annualRate / 12` (exact bigint/scale rules spelled once).
- OOS: compound/daily engines (already in PROJECT Out of Scope).
- Label: «годовой %» matching ÷12 — do not label APY unless formula changes.
- Multi-month base: default **each slot from current LOCF principal** (non-compounding forecast). If product later wants compound-in-overlay, explicit CONTEXT lock + tests — not silent.

**Warning signs:**
- Float `Math.pow` in interest path
- Tests assert APY monthly factor instead of ÷12
- Horizon forecast grows faster than 12× single month interest on fixed LOCF

**Phase to address:**
Interest math design / CONTEXT lock before implementation; verified in overlay unit tests

---

### Pitfall 5: Day-of-month without `clampDayOfMonth` (31 → Feb)

**What goes wrong:**
Accrual on DOM 31 skips February or throws invalid dates. Forecast missing months; user thinks rate broken.

**Why it happens:**
Income (`listAllInRange`) and grace dual-DOM already clamp; new savings path reinvents calendar math.

**How to avoid:**
- Reuse `@/lib/dates` `clampDayOfMonth` exactly like `income.ts` / `credit-grace.ts`.
- Vitest: DOM 31 × Feb non-leap + leap fixtures.
- Validate DOM 1–31 at write; clamp only at occurrence expand.

**Warning signs:**
- Raw `new Date(y, m, day)` without clamp
- Missing Feb fixture in savings forecast tests
- Occurrences hole in short months

**Phase to address:**
Interest slot generation (with math phase)

---

### Pitfall 6: PARITY-01 skip — UI SAVINGS/forecast without MCP

**What goes wrong:**
Ship account form + dashed Прогноз; agents still see old `AccountType` / forecast kinds. AGENTS.md PARITY-01 violated; SIDE isolation copy stale (no SAVISO).

**Why it happens:**
v1.4 made MCP feel “done.” Forecast tool description hardcodes “income + A′ grace.” `isolation-contract.test.ts` catalog freeze omits savings.

**How to avoid:**
- Same milestone: `list_accounts` (or fields) expose rate + accrual DOM; `get_forecast_overlay` includes interest events; update `create-handler` instructions + named SAVISO/INISO/GRISO prose.
- Extend SIDE never-write scans to new loaders/tools.
- Do not invent FORECAST-01 — follow Pattern 1 combined rule ids in descriptions.

**Warning signs:**
- UI chart shows interest tooltips; MCP points lack `kind: "interest"`
- CAP/SIDE description tests fail after type extend
- Docs connect guide omit savings fields

**Phase to address:**
Final MCP parity phase of milestone (or same phase as overlay if thin)

---

### Pitfall 7: Double-count after user manually snapshots accrued interest

**What goes wrong:**
User updates BalanceSnapshot when bank posts interest → LOCF anchor rises. Overlay still adds “this month’s” interest if membership includes today/past or compounds on raised base incorrectly → dashed line overshoots.

**Why it happens:**
Forecast-not-fact UX inherited from income, but savings principal **is** the same account users edit. Mental model blur: “I already recorded interest.”

**How to avoid:**
- Strict future-only slots (`accrualAsOf > today`).
- Copy near rate fields / overlay: прогноз ожидаемых процентов; факт — только снимок баланса.
- Optional later (OOS now): suppress next accrual once snapshot lands on accrual day — needs CONTEXT; do not invent without lock.

**Warning signs:**
- Hinge today includes interest addend
- UAT: snapshot + same-day overlay both bump NW
- Tooltip interest on dates ≤ today

**Phase to address:**
Overlay membership + UX copy; UAT checklist

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Reuse `kind: "income"` for interest slots | No ForecastSlotKind widen | Wrong tooltips, MCP honesty, grace filters | Never |
| Flag on FIAT_DEBIT instead of SAVINGS enum | Skip migration | Rate/DOM on debit cards; CHECK hell; soft-read chaos | Never — user lock SAVINGS type |
| Skip SAVISO twin; “INISO covers forecast” | Faster ship | Interest regresses into LOCF unnoticed | Never — retros: twins scale |
| Compound-in-overlay without CONTEXT | “More realistic” chart | Diverges from ÷12 lock; hard to unwind | Never in v1.5 |
| Soft-revalidate skip on `/` after SAVINGS edit | Faster actions | Капитал lag (known income tradeoff) | Only if CONTEXT locks UX; prefer revalidate `/` |
| One-off grep instead of isolation-contract extend | Quick PR | MCP write sneak / catalog drift | Never for SIDE surfaces |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `nw-forecast.ts` | Import account/prisma to “read rate” | Pure slots in; loaders expand SAVINGS → slots |
| `historical-series.ts` / `net-worth.ts` | Import savings interest helper | Keep import ban; SAVISO scan |
| `DashboardChartsShell` vs `loadForecastOverlay` | Wire interest only in UI shell | Shared membership helper; both callers |
| FX LOCF | Invent rate for foreign SAVINGS interest | Same gate as income: exclude + partial banner + `excludedMissingFxCurrencies` |
| Prisma CHECK | Rate columns on all accounts unconstrained | SAVINGS ↔ (annualRate + accrualDOM) invariant like credit limit |
| Soft-read ASSET merge | Forget SAVINGS in `AccountTypeSoft` / labels | Extend soft unions + RU label («Сберегательный») |
| Grace A′ | Interest ΔNW=0 by copy-paste | Interest adds; grace stays 0n |
| MCP `isolation-contract` | Leave forecast description income+grace only | Update description + handler catalog same phase |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Per-day N account interest loop without date set | Slow Капитал preset switch | Sparse dates only (today, horizon, accrual days) like current forecast | Dozens of SAVINGS × 365 samples |
| Re-query all snapshots per accrual month | Loader latency | One LOCF balance per SAVINGS account for slot amounts | Many accounts + long horizon |
| Client recomputes interest in chart + server MCP diverge | Parity bugs | Single pure builder; UI/MCP adapters only | First second client |

Local single-user SQLite — scale risk low; correctness > micro-opt.

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| MCP write tool “apply interest” | Agent mutates balances | Keep read-only; never-call scans |
| Expose rate fields without readOnlyHint refresh | Agent confusion, not exfil | Annotations + SAVISO prose |
| LAN publish “for testing savings UI” | Finance data exposure | Unrelated to savings — keep 127.0.0.1 compose lock |

Domain risk is **data integrity / agent honesty**, not new auth surface.

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No copy that interest ≠ auto balance | User waits for balance to change | Explicit «только прогноз»; manual снимок |
| Rate shown as APY | Expects bank compound match | «Годовая ставка» + simple monthly math |
| Interest looks like income in tooltip | Confuses зарплата vs вклад | Distinct kind + RU block («Проценты») |
| SAVINGS create missing rate/DOM | Silent zero forecast | Required fields on create; validate |
| Credit-like fields on SAVINGS form | User enters limit/grace | Type-gated form sections |
| Chart legend still income-only (known OOS) | Hard to split sources | Accept OOS; tooltip kind must still distinguish |

## "Looks Done But Isn't" Checklist

- [ ] **SAVINGS in NW:** `isAssetType` + `NetWorthAccountType` + LOCF contribution — verify hero includes savings principal
- [ ] **Interest overlay:** dashed Прогноз moves on accrual DOM — verify fact LOCF unchanged without new snapshot
- [ ] **SAVISO twin:** `saviso.test.ts` (or named twin) import bans + golden identity + never-calls — verify suite green
- [ ] **Formula ÷12:** unit tests on known minors — verify no APY/`pow` path
- [ ] **DOM clamp:** 31×Feb fixtures — verify occurrence dates
- [ ] **FX partial:** non-primary SAVINGS interest — verify banner + exclude count
- [ ] **MCP parity:** forecast events + account fields + handler instructions — verify isolation-contract
- [ ] **Grace unbroken:** A′ still ΔNW=0 with interest slots present — verify nw-forecast tests
- [ ] **No auto snapshot:** accrual actions — verify zero `balanceSnapshot.*` mutates
- [ ] **UI/MCP same membership:** shell + `loadForecastOverlay` — verify shared helper

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Auto snapshots already written | MEDIUM | Stop writer; document manual cleanup; add never-call tests before next mutate |
| Interest folded into historical series | HIGH | Revert series API; restore golden identity; re-overlay only |
| Wrong compound math shipped | MEDIUM | Flip formula + regenerate tests; CONTEXT note honesty of prior forecasts |
| SAVINGS excluded from NW | LOW | Fix `isAssetType` / type unions; add regression test |
| MCP/UI drift | LOW | Port membership helper; update descriptions; PARITY checklist |
| Double-count UX confusion | LOW | Tighten membership > today; improve copy |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| SAVINGS principal vs interest layers | Phase: schema + account type | Asset inclusion tests; CHECK invariant; form type gate |
| Auto BalanceSnapshot | Phase: account CRUD / interest actions | Never-call ×N + SAVISO file scan |
| Fold into past LOCF | Phase: forecast overlay wire | Golden identity; chart fact≠forecast without snaps |
| ÷12 vs APY/compound | Phase: math + CONTEXT lock | Pure unit tests; code ban on `pow` interest |
| DOM clamp | Phase: slot expansion | Feb/leap fixtures |
| Double-count after manual snap | Phase: membership + UX | Future-only slots; UAT script |
| PARITY-01 / MCP copy | Phase: MCP parity | isolation-contract + forecast.test kind |
| FX honesty | Phase: overlay wire | Partial banner parity with income |
| Break grace A′ | Phase: overlay wire | Existing grace ΔNW=0 tests still green |

**Suggested phase order (dependency):**
1. Schema/type/UI CRUD for SAVINGS (principal in NW) — avoids Pitfall 1
2. Pure interest math + slot expand (clamp, ÷12, future-only) — avoids 4, 5, 7
3. Overlay wire (shell + MCP loader) + kind/tooltips — avoids 3, FX, grace regress
4. SAVISO twin + never-calls — locks Pitfall 2
5. PARITY-01 descriptions/catalog — locks Pitfall 6

## Sources

- Shipped isolation twins: `src/lib/iniso.test.ts`, `src/lib/griso.test.ts`, `src/lib/mcp/isolation-contract.test.ts`
- Forecast overlay: `src/lib/nw-forecast.ts`, `src/lib/mcp/reads/load-forecast-overlay.ts`, `src/components/dashboard/DashboardChartsShell.tsx`
- Account type soft-read: `src/lib/account-type.ts`, `src/lib/net-worth.ts`, `prisma/schema.prisma`
- PROJECT.md v1.5 locks: SAVINGS type; annual%/12; forecast only; no auto BalanceSnapshot; PARITY-01
- Retrospective: isolation twins scale (v1.2–v1.4); forecast = overlay not LOCF mutation
- Web (MEDIUM): APY monthly ≠ rate÷12 compound factor — [Gerald APY monthly](https://joingerald.com/learn/saving--investing/calculate-apy-monthly-step-by-step); reinforces **do not silently “fix”** locked ÷12
- codegraph: callers of `buildNetWorthForecastSeries` (UI shell + MCP loader only)

---
*Pitfalls research for: Wallet v1.5 savings account + interest NW forecast*
*Researched: 2026-09-11*
