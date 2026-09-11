# Phase 27: SAVINGS schema + CRUD - Research

**Researched:** 2026-09-11
**Domain:** Prisma AccountType extension + type-gated rate/DOM CRUD + asset NW inclusion
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
### Rate input & storage
- **D-01:** UI enters annual rate as a **percent with up to 2 decimal places** (e.g. `16.50`); persist as `annualRateBps` Int (`1650`). — **Reversibility:** costly — Zod + UI + DB column assume bps Int; changing scale fights money path.
- **D-02:** **0% allowed** (account exists; forecast interest later = 0). Null rate **forbidden**.
- **D-03:** **No soft upper cap** — only technical Int limits. Reject negatives (discretion: Zod `min(0)`).
- **D-04:** Both `annualRateBps` and `accrualDayOfMonth` are **always required** for `SAVINGS` (symmetry).

### Accrual day-of-month
- **D-05:** Accrual DOM required on create: Int **1–31**. Reuse `clampDayOfMonth` for calendar display/next-date helpers. — **Reversibility:** costly — SQLite CHECK + Zod type-gate like credit DOM.
- **D-06:** After create, DOM number is **editable**; clearing to **null is forbidden** (always set).
- **D-07:** **No default** day on create — user must pick explicitly.

### Edit / create surface
- **D-08:** Extend **`AccountFormDialog`** — create and edit for SAVINGS include name + rate + DOM. Type and currency stay **immutable after create** (no ASSET ↔ SAVINGS). — **Reversibility:** costly — breaks current name-only edit contract for SAVINGS only; type lock matches ASSET/credit.
- **D-09:** Edit dialog title/copy stays generic **«Изменить счёт»** (do not list editable fields in description).
- **D-10:** Create form: rate + DOM fields are **type-gated** — visible only when type = `SAVINGS` (mirror credit-limit for `FIAT_CREDIT`).

### List / labels
- **D-11:** Russian type label: **«Накопительный»** (via `accountTypeLabel`).
- **D-12:** Account list secondary line under name: **rate %** + **days until next accrual** (`через N дн.` style) — **not** the raw DOM integer. Raw DOM only in create/edit forms.
- **D-13:** Form field labels: **«Годовой %»** and **«День начисления»**.

### Schema / NW (carried from milestone locks — confirm in plan)
- **D-14:** New enum member `AccountType.SAVINGS` (not a flag on ASSET). Soft-read: extend `isAssetType` / `NetWorthAccountType` / `AccountTypeSoft` so principal sums in NW like ASSET; legacy soft-compat unchanged.
- **D-15:** SQLite CHECK twin of credit invariants: rate+DOM present iff type = SAVINGS (else null). Write-path Zod: create types `ASSET | FIAT_CREDIT | SAVINGS`.
- **D-16:** Manual `BalanceSnapshot` path unchanged for SAVINGS — no auto interest write in this phase.

### Claude's Discretion
- Exact Zod/CHECK names, migration packaging, bps↔major % helpers layout.
- Exact Russian copy for «через N дн.» (singular/plural) and list formatting (`16,50%` vs `16.50%`).
- Small pure helper for “next accrual date / days until” using `clampDayOfMonth` + Moscow calendar — **display only**; full monthly interest amount math stays Phase 28.
- Whether edit submit is one server action updating name+rate+DOM together vs split — prefer one coherent update for SAVINGS.
- Reject negative bps even though no soft max.

### Deferred Ideas (OUT OF SCOPE)
- Interest amount math (`balance × rate / 12`), `ForecastSlotKind: "interest"` — Phase 28
- Капитал dashed «Прогноз» wire + SAVISO — Phase 29
- MCP `list_accounts` / forecast parity — Phase 30
- Soft max rate cap, ASSET↔SAVINGS conversion, separate «Проценты» dialog — rejected / not in scope
- Compound/APY, auto BalanceSnapshot, savings goals — PROJECT Out of Scope

None additional from discussion beyond roadmap phases.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ACCT-01 | Create/manage `SAVINGS` with name, currency, annual rate, accrual DOM | Schema enum + CHECK; Zod create/update; `AccountFormDialog` type option + gated fields; one update action for SAVINGS name+rate+DOM |
| ACCT-02 | SAVINGS balances in NW totals + history like other assets | Extend `NetWorthAccountType` + `isAssetType`; `computeNetWorthRows` already treats non-credit as asset; manual `upsertBalanceSnapshot` unchanged |
| ACCT-03 | See annual rate + accrual DOM on list/detail and create/edit | Form labels D-13; list secondary = rate% + days-until (not raw DOM); edit form shows editable rate+DOM for SAVINGS |
</phase_requirements>

## Summary

Phase 27 is a **schema-first ADD** on the shipped capital accounts path — zero new npm packages. Twin the v1.3 FIAT_CREDIT pattern: Prisma `AccountType.SAVINGS` + nullable `annualRateBps` / `accrualDayOfMonth`, SQLite CHECK type-gate, Zod write enum `ASSET | FIAT_CREDIT | SAVINGS`, soft-read unions, and UI type-gated fields in `AccountFormDialog` / `AccountList`. Principal enters NW automatically once `NetWorthAccountType` includes `SAVINGS` because `computeNetWorthRows` already sums every non-credit LOCF balance; BalanceSnapshot upsert already allows non-credit ≥0 without type filters.

Do **not** ship interest ÷12, forecast slots, SAVISO suite, or MCP enrichment here (Phases 28–30). Display-only next-accrual countdown may live in a thin pure helper that reuses `clampDayOfMonth` — not `savings-interest.ts` amount math.

**Primary recommendation:** One RedefineTables migration (keep credit+grace CHECKs, add `Account_savings_rate_invariant`) → soft types + Zod → create/update actions → form/list UI → Vitest Wave 0 coverage for CHECK/Zod/NW inclusion.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| `AccountType.SAVINGS` + rate/DOM columns + CHECK | Database / Storage | API / Backend | Persistence + DB honesty; actions enforce Zod twin |
| Create/update SAVINGS (name, rate, DOM) | API / Backend | Browser / Client | Server Actions + Zod; form posts FormData |
| Type-gated create/edit UI | Browser / Client | Frontend Server (SSR) | `AccountFormDialog` client; `/accounts` RSC loads rows |
| List rate% + days-until accrual | Browser / Client | — | Pure calendar helper + list subtitle; no DB write |
| NW totals / history principal | API / Backend | Frontend Server (SSR) | `computeNetWorthRows` / `buildNetWorthSeries`; dashboard page casts types |
| Manual BalanceSnapshot | API / Backend | Browser / Client | Existing upsert; no interest auto-write |
| Interest math / forecast / MCP | — (out of phase) | — | Phases 28–30 |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| prisma / @prisma/client | 7.10.0 (pinned `package.json`) | Schema + migrate Account | Shipped SQLite path; Enum→TEXT |
| better-sqlite3 + adapter | 13.0.3 / 7.10.0 | DB driver | Existing |
| zod | 4.5.4 | Create/update schemas | Existing validations |
| next | 16.3.4 | App Router + Server Actions | Existing accounts surface |
| vitest | 4.1.11 | Unit/action tests | Existing `src/**/*.test.ts` |

### Supporting

| Library / module | Version | Purpose | When to Use |
|------------------|---------|---------|-------------|
| `@/lib/money` `parseMajorToMinor` / `formatMinorToMajor` | in-repo | Percent ↔ bps at scale 2 | Parse/format annual % (reuse scale-2, not FX e8) |
| `@/lib/dates` `clampDayOfMonth`, `calendarDateToday`, `addCalendarDays` | in-repo | Accrual calendar display | Days-until helper; Moscow today |
| `@/lib/account-type` | in-repo | Soft labels / `isAssetType` | SAVINGS label + asset soft-read |
| `@/lib/net-worth` | in-repo | NW row math | Extend `NetWorthAccountType` only |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Fields on `Account` | Side `SavingsAccount` table | Rejected — milestone lock; principal is Account+snapshot |
| `annualRateBps` Int | Float / Decimal / FX `RATE_SCALE_E8` | Float drifts; FX scale semantic clash |
| New finance npm | decimal.js / Dinero | Fights bigint money constitution; ÷12 is Phase 28 |
| Split edit actions | One `updateAccount` for SAVINGS | Split adds UI complexity; prefer one form submit |

**Installation:**

```bash
# none — reuse pinned stack
```

**Version verification:** Project pins (`package.json`): prisma `7.10.0`, zod `4.5.4`, vitest `4.1.11`, next `16.3.4`. Registry `npm view` may show newer majors — **do not upgrade** in this phase. [VERIFIED: package.json:28-49]

## Package Legitimacy Audit

> No external packages to install for Phase 27.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| — | — | — | — | — | — | N/A — zero installs |

**Packages removed due to [SLOP] verdict:** none  
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Browser: /accounts                                          │
│  AccountFormDialog (create: type+currency+gated fields)      │
│  AccountList (subtitle: type · CCY · rate% · через N дн.)    │
│  SetBalanceDialog (UNCHANGED — manual snapshot)              │
└───────────────┬──────────────────────────────▲───────────────┘
                │ FormData mutate              │ RSC props
                ▼                              │
┌──────────────────────────────┐   ┌───────────┴───────────────┐
│ Server Actions               │   │ accounts/page.tsx         │
│ createAccount (+ SAVINGS)    │   │ findMany Account + LOCF   │
│ updateAccount (name[+rate+   │   │ serialize rate/DOM ints   │
│   DOM if type=SAVINGS])      │   └───────────┬───────────────┘
│ upsertBalanceSnapshot        │               │
│ (no type exclude; asset path)│               │
└───────────────┬──────────────┘               │
                ▼                              ▼
┌──────────────────────────────┐   ┌───────────────────────────┐
│ SQLite Account               │   │ Капитал page / series     │
│ type TEXT incl. SAVINGS      │──▶│ NetWorthAccountType       │
│ annualRateBps / accrualDOM   │   │ + SAVINGS → asset LOCF    │
│ CHECK savings iff SAVINGS    │   │ historical-series         │
│ BalanceSnapshot (manual)     │   │ (no interest fields)      │
└──────────────────────────────┘   └───────────────────────────┘
```

### Recommended Project Structure

```
prisma/
├── schema.prisma                    # MODIFY — enum SAVINGS; annualRateBps; accrualDayOfMonth
└── migrations/YYYYMMDDHHMMSS_savings_account/
    └── migration.sql                # NEW — RedefineTables + Account_savings_rate_invariant

src/lib/
├── account-type.ts                  # MODIFY — soft union, isAssetType, label «Накопительный»
├── account-type.test.ts             # MODIFY
├── validations/account.ts           # MODIFY — create enum + savings refine; update schema
├── validations/account.test.ts      # MODIFY
├── net-worth.ts                     # MODIFY — NetWorthAccountType |= "SAVINGS"
├── net-worth.test.ts                # MODIFY — SAVINGS sums like ASSET
├── historical-series.ts             # type flows via NetWorthAccountType (likely no logic change)
├── money.ts or savings-rate.ts      # DISCRETION — parsePercentToBps / formatBpsToPercentMajor (scale 2)
├── savings-accrual-display.ts       # NEW (display-only) — nextAccrualAsOf + daysUntil + RU copy
└── dates.ts                         # UNCHANGED reuse clampDayOfMonth / calendarDateToday

src/app/accounts/
├── actions.ts                       # MODIFY — create SAVINGS; coherent update for SAVINGS
├── actions.test.ts                  # MODIFY
└── page.tsx                         # MODIFY — pass annualRateBps + accrualDayOfMonth to list

src/components/accounts/
├── AccountFormDialog.tsx            # MODIFY — TYPE_OPTIONS; gated fields; edit title D-09
└── AccountList.tsx                  # MODIFY — SAVINGS subtitle rate + countdown
```

### Pattern 1: Type-gated Account columns (credit → savings)

**What:** Nullable columns valid only for one `AccountType`, dual-enforced by SQLite CHECK + Zod.  
**When to use:** SAVINGS rate+DOM (mirror FIAT_CREDIT creditLimit / grace DOM).  
**Example CHECK sketch** (names discretionary; semantics locked D-15):

```sql
-- Twin of Account_grace_dom_invariant / Account_credit_limit_invariant
-- [VERIFIED pattern: prisma/migrations/20260909090903_credit_grace_dual_dom/migration.sql:15-37]
CONSTRAINT "Account_savings_rate_invariant" CHECK (
  (
    type = 'SAVINGS'
    AND annualRateBps IS NOT NULL
    AND annualRateBps >= 0
    AND accrualDayOfMonth IS NOT NULL
    AND accrualDayOfMonth BETWEEN 1 AND 31
  )
  OR (
    type != 'SAVINGS'
    AND annualRateBps IS NULL
    AND accrualDayOfMonth IS NULL
  )
)
```

**Migration packaging:** Copy RedefineTables from grace migration — recreate `new_Account` with **all** existing CHECKs (`Account_credit_limit_invariant`, `Account_grace_dom_invariant`) **plus** savings CHECK; INSERT old columns only; DROP/RENAME; recreate `Account_name_key`. [VERIFIED: prisma/migrations/20260909090903_credit_grace_dual_dom/migration.sql:1-45]

### Pattern 2: Soft-read asset inclusion

**What:** Write enum excludes legacy `FIAT_DEBIT|CRYPTO|CASH`; soft unions still treat them as assets; add `SAVINGS` to soft + write.  
**When to use:** NW / labels / list.  
**Verified current unions:**

```typescript
// [VERIFIED: src/lib/account-type.ts:3-22]
export type AccountTypeSoft =
  | "ASSET"
  | "FIAT_CREDIT"
  | "FIAT_DEBIT"
  | "CRYPTO"
  | "CASH";

export function isAssetType(t: string): boolean {
  return (
    t === "ASSET" ||
    t === "FIAT_DEBIT" ||
    t === "CRYPTO" ||
    t === "CASH"
  );
}

// [VERIFIED: src/lib/net-worth.ts:7-12]
export type NetWorthAccountType =
  | "ASSET"
  | "FIAT_DEBIT"
  | "FIAT_CREDIT"
  | "CRYPTO"
  | "CASH";
```

**NW behavior note:** `rowFor` uses `isCreditType`; all other types contribute positive LOCF. [VERIFIED: src/lib/net-worth.ts:89-153] Adding `"SAVINGS"` to the union + casting from Prisma is enough for ACCT-02 — also extend `isAssetType` for soft-read honesty (Pitfall 1 warning sign).

### Pattern 3: Type-gated form fields + coherent SAVINGS edit

**What:** Create shows credit limit only for `FIAT_CREDIT`; mirror for SAVINGS rate+DOM. Edit today is name-only via `updateAccountName`. [VERIFIED: src/components/accounts/AccountFormDialog.tsx:100-111,243-263] [VERIFIED: src/app/accounts/actions.ts:158-201]

**Recommendation (discretion):** Replace/extend with one `updateAccount` action:
- Always validate/update `name`
- If DB `account.type === "SAVINGS"`, require + persist `annualRateBps` + `accrualDayOfMonth` (never null)
- If not SAVINGS, ignore/reject rate/DOM fields; keep credit limit display read-only
- Title/description: **«Изменить счёт»** (D-09); drop “только название”

### Pattern 4: Percent ↔ bps at money scale 2

**What:** UI string `16.50` → Int `1650` via `parseMajorToMinor(s, 2)` then convert bigint→number within Prisma Int range; reverse with `formatMinorToMajor(BigInt(bps), 2)`.  
**Why:** Reuses money parser (no Float); 0% → `0` allowed (D-02).  
**Technical max:** Prisma `Int` / SQLite INTEGER client bound ≈ `2147483647` bps (~21M%) — no soft cap (D-03). [CITED: prisma.io/docs/orm/overview/databases/sqlite — Int→INTEGER; enum→TEXT]

### Pattern 5: Days-until next accrual (display only)

**What:** Pure helper (new small module — **not** Phase 28 interest amount file):
1. Parse `today` YYYY-MM-DD (inject from page `calendarDateToday()` / Moscow)
2. Candidate = `clampDayOfMonth(y, m, accrualDayOfMonth)`
3. If candidate `< today` → next calendar month clamp; if candidate `=== today` → show **«сегодня»** (recommended UX); if `>` today → day delta
4. Day delta: UTC date math consistent with `addCalendarDays` (no existing `daysBetween` in `dates.ts` — add local helper)

**List copy (discretion):** Prefer compact `через N дн.` for N≥1 (CONTEXT); full pluralization optional. Rate list: prefer **dot** `16.50%` to match money/form input (avoid comma parse confusion); comma only if display-only formatter never round-trips.

### Anti-Patterns to Avoid

- **Flag `isSavings` on ASSET:** Locked distinct type (D-14 / REQUIREMENTS Out of Scope)
- **Excluding SAVINGS from NW “like income”:** Principal is asset (Pitfall 1)
- **Auto BalanceSnapshot on accrual:** OOS / D-16
- **Shipping `savings-interest` ÷12 here:** Phase 28
- **MCP list_accounts fields in Phase 27:** Roadmap Phase 30; CONTEXT says do not block 27 on MCP (milestone PARITY still Phase 30)
- **Default accrual day on create:** Forbidden (D-07)
- **Editable type/currency after create:** Forbidden (D-08)
- **Raw DOM integer on list secondary line:** Forbidden (D-12)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Money/percent parse | Custom float parse | `parseMajorToMinor(_, 2)` | Scientific notation / frac digit rules already tested |
| Short-month DOM | Manual Feb tables | `clampDayOfMonth` | Same as income/grace |
| SQLite column add + CHECK | Ad-hoc ALTER hope | RedefineTables migration twin | Existing Account CHECKs require full recreate |
| NW contribution rules | Duplicate LOCF math | `computeNetWorthRows` | Already asset-vs-credit |
| Interest monthly amount | Custom ÷12 in Phase 27 | Defer Phase 28 | Scope wall |

**Key insight:** Phase 27 success = typed Account metadata + UI + soft NW inclusion. Forecast/interest is a later overlay on the same Account row.

## Common Pitfalls

### Pitfall 1: SAVINGS principal excluded from NW
**What goes wrong:** Hero/history understate capital.  
**Why:** Side-ledger muscle memory from income/grace.  
**How to avoid:** Extend `NetWorthAccountType` + `isAssetType`; add `net-worth.test.ts` case type `"SAVINGS"`.  
**Warning signs:** `isAssetType("SAVINGS") === false`; union missing SAVINGS.

### Pitfall 2: Migration drops credit/grace CHECKs
**What goes wrong:** Credit invariants silently disappear.  
**Why:** Copy-paste incomplete `new_Account` CREATE.  
**How to avoid:** Paste both existing CHECK blocks from latest Account migration, then add savings CHECK.  
**Warning signs:** Migration SQL missing `Account_credit_limit_invariant` or `Account_grace_dom_invariant`.

### Pitfall 3: Edit path still name-only for SAVINGS
**What goes wrong:** ACCT-01/03 fail; rate/DOM stuck after create.  
**Why:** Current `updateAccountName` + dialog description.  
**How to avoid:** Coherent update action + form fields when `account.type === "SAVINGS"`.  
**Warning signs:** Edit form has no «Годовой %».

### Pitfall 4: Zod allows null rate or rate on ASSET
**What goes wrong:** CHECK fails at runtime or dirty rows.  
**Why:** Optional fields without type refine.  
**How to avoid:** Mirror creditLimit `superRefine`: SAVINGS requires both; non-SAVINGS forbids both.  
**Warning signs:** Create ASSET with `annualRateBps` succeeds in unit tests.

### Pitfall 5: Accrual countdown uses raw DOM or wrong calendar
**What goes wrong:** «через 31 дн.» nonsense in February; list shows `день 31`.  
**Why:** Skipping clamp / using local TZ Date.  
**How to avoid:** `clampDayOfMonth` + injected Moscow `today` string; UTC helpers only.  
**Warning signs:** List shows integer DOM; Feb 31 → March 3 skip.

### Pitfall 6: Scope creep into interest/MCP
**What goes wrong:** Phase bloated; PARITY half-done.  
**Why:** AGENTS.md MCP parity wording + SUMMARY build order.  
**How to avoid:** Honor CONTEXT deferred list; Phase 30 owns MCP-01/PARITY-01 in same milestone.

## Code Examples

### Zod create refine (mirror credit)

```typescript
// Pattern from [VERIFIED: src/lib/validations/account.ts:5-63]
// Extend: accountTypeSchema = z.enum(["ASSET", "FIAT_CREDIT", "SAVINGS"])
// Add annualRatePercentMajor?: string, accrualDayOfMonth?: number|null
// superRefine:
//   SAVINGS: require percent (0 allowed) + DOM 1–31; reject creditLimit
//   FIAT_CREDIT: existing credit limit rules; reject savings fields
//   ASSET: reject credit + savings fields
```

### bps helpers (discretion layout)

```typescript
// Recommended — reuse money scale-2
import { parseMajorToMinor, formatMinorToMajor } from "@/lib/money";

export function parsePercentToBps(major: string): number {
  const minor = parseMajorToMinor(major, 2); // 16.50 → 1650n
  if (minor < 0n) throw new Error("negative rate");
  if (minor > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("rate too large");
  const n = Number(minor);
  if (!Number.isSafeInteger(n) || n > 2147483647) throw new Error("rate too large");
  return n;
}

export function formatBpsToPercentMajor(bps: number): string {
  return formatMinorToMajor(BigInt(bps), 2); // display; form may use Exact
}
```

### next accrual display sketch

```typescript
import { addCalendarDays, clampDayOfMonth } from "@/lib/dates";

export function nextAccrualAsOf(today: string, dayOfMonth: number): string {
  const [ys, ms] = today.split("-");
  const y = Number(ys);
  const m = Number(ms);
  const thisMonth = clampDayOfMonth(y, m, dayOfMonth);
  if (thisMonth >= today) return thisMonth;
  const next = addCalendarDays(`${y}-${String(m).padStart(2, "0")}-01`, 32);
  const [ny, nm] = next.split("-");
  return clampDayOfMonth(Number(ny), Number(nm), dayOfMonth);
}
```

### Prisma schema fields

```prisma
// Extend [VERIFIED: prisma/schema.prisma:12-18,97-113]
enum AccountType {
  ASSET
  FIAT_DEBIT
  FIAT_CREDIT
  CRYPTO
  CASH
  SAVINGS
}

model Account {
  // …
  /// Annual rate in bps (1650 = 16.50%). Required iff type == SAVINGS.
  annualRateBps       Int?
  /// Accrual DOM 1–31. Required iff type == SAVINGS.
  accrualDayOfMonth   Int?
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate debit/crypto/cash writes | Write ASSET \| FIAT_CREDIT (+ SAVINGS now) | QUICK-0i7 + v1.5 | Soft-read legacy; new writes narrow |
| Name-only account edit | SAVINGS edit name+rate+DOM | Phase 27 D-08 | Breaks prior edit contract for SAVINGS only |
| Side ledgers for new money domains | SAVINGS is Account asset | v1.5 lock | Interest later = forecast overlay only |

**Deprecated/outdated:**
- Flag-on-debit savings: rejected
- Float APR columns: rejected

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Compact list copy `через N дн.` + «сегодня» on accrual day is acceptable RU UX | Pattern 5 / Discretion | User wants full pluralization or always next-month on accrual day |
| A2 | List rate display uses money-style dot (`16.50%`) not `16,50%` | Pattern 5 | Product prefers comma retail formatting |
| A3 | `parsePercentToBps` via `parseMajorToMinor(_, 2)` lives in thin helper (not money.ts) | Standard Stack | Planner may colocate in money.ts — low risk |
| A4 | No `daysBetween` needed beyond local helper in savings display module | Pattern 5 | Could instead extend dates.ts — preference only |

**If this table is empty:** — not empty; confirm A1–A2 only if UAT copy feels wrong.

## Open Questions

1. **MCP timing vs AGENTS.md parity wording**
   - What we know: CONTEXT + REQUIREMENTS map MCP-01/PARITY-01 → Phase 30; Phase 27 UI will show rate/DOM.
   - What's unclear: Whether any interim MCP stub is desired mid-milestone.
   - Recommendation: **Do not** implement MCP in Phase 27 plans; Phase 30 closes parity in same milestone.

2. **Edit description string for non-SAVINGS**
   - What we know: D-09 locks title «Изменить счёт»; forbids listing fields.
   - What's unclear: Exact muted description when only name is editable.
   - Recommendation: Short generic e.g. «Тип и валюта не меняются.» (discretion) — no field inventory.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | build/test | ✓ | v24.5.0 | — |
| npm | scripts | ✓ | 10.9.3 | — |
| prisma CLI (via npm) | migrate | ✓ | 7.10.0 pinned | — |
| SQLite (better-sqlite3) | runtime | ✓ | 13.0.3 | — |
| Vitest | validation | ✓ | 4.1.11 | — |

**Missing dependencies with no fallback:** none  
**Missing dependencies with fallback:** none  

Step 2.6: external tools available; no blockers.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.1.11 |
| Config file | `vitest.config.ts` (`include: ["src/**/*.test.ts"]`) |
| Quick run command | `npx vitest run src/lib/account-type.test.ts src/lib/validations/account.test.ts src/lib/net-worth.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ACCT-01 | Zod accepts SAVINGS with rate+DOM; rejects missing/null; rejects savings fields on ASSET | unit | `npx vitest run src/lib/validations/account.test.ts` | ✅ extend |
| ACCT-01 | createAccount persists bps+DOM; update SAVINGS name+rate+DOM; no snapshot side effects | unit (mocked prisma) | `npx vitest run src/app/accounts/actions.test.ts` | ✅ extend |
| ACCT-02 | `computeNetWorthRows` includes SAVINGS LOCF like ASSET | unit | `npx vitest run src/lib/net-worth.test.ts` | ✅ extend |
| ACCT-02 | Soft `isAssetType("SAVINGS")` true; label «Накопительный» | unit | `npx vitest run src/lib/account-type.test.ts` | ✅ extend |
| ACCT-03 | Form/list source gates + RU labels (optional UI scan twin of credit-grace-ui) | unit/source | `npx vitest run src/components/accounts/` | ❌ Wave 0 optional |
| ACCT-03 | nextAccrual / days-until clamp Feb-31 | unit | `npx vitest run src/lib/savings-accrual-display.test.ts` | ❌ Wave 0 |
| D-16 | upsertBalanceSnapshot still works for SAVINGS type (non-credit ≥0 path) | unit | existing balance action tests + one SAVINGS fixture | ✅ extend lightly |

### Sampling Rate
- **Per task commit:** quick vitest subset above
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] Extend `src/lib/validations/account.test.ts` — SAVINGS create/update refine cases (ACCT-01)
- [ ] Extend `src/lib/account-type.test.ts` — SAVINGS label + `isAssetType` (ACCT-02/03)
- [ ] Extend `src/lib/net-worth.test.ts` — SAVINGS inclusion (ACCT-02)
- [ ] New `src/lib/savings-accrual-display.test.ts` — clamp + today/next month (ACCT-03)
- [ ] Extend `src/app/accounts/actions.test.ts` — create/update SAVINGS; assert no BalanceSnapshot calls on metadata update
- [ ] Optional: UI source scan for «Годовой %» / «День начисления» / «Накопительный»

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Local single-user app |
| V3 Session Management | no | — |
| V4 Access Control | no | No multi-tenant ACL |
| V5 Input Validation | yes | Zod create/update + SQLite CHECK |
| V6 Cryptography | no | Rates not secrets; no new crypto |

### Known Threat Patterns for account CRUD + SQLite

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Tampered type/currency on edit | Tampering | Server ignores client type/currency; load type from DB (existing pattern) |
| Negative / absurd rate | Tampering | Zod `>= 0` + CHECK `annualRateBps >= 0`; Int bound |
| Savings fields on non-SAVINGS | Tampering | Zod refine + CHECK null-iff-non-SAVINGS |
| Accrual DOM out of 1–31 | Tampering | Zod + CHECK BETWEEN 1 AND 31 |
| Interest auto-write snapshot | Elevation / integrity | Out of scope; no interest writer in this phase |

## Project Constraints (from .cursor/rules/)

No `.cursor/rules/` directory present.

From `AGENTS.md` (project instructions):
- Next.js docs under `node_modules/next/dist/docs/` before novel Next APIs
- Before UAT: `.planning/OPERATOR.md`; agent drives `npm run dev` + Orca
- MCP parity standing rule: new user-visible read surfaces need MCP in **same milestone** — satisfied by Phase 30 mapping, **not** by expanding Phase 27

## Sources

### Primary (HIGH confidence)
- `prisma/schema.prisma` — AccountType + Account fields [VERIFIED this session]
- `prisma/migrations/20260909090903_credit_grace_dual_dom/migration.sql` — RedefineTables + CHECK twin [VERIFIED]
- `src/lib/account-type.ts`, `validations/account.ts`, `net-worth.ts`, `dates.ts`, `money.ts` [VERIFIED]
- `src/components/accounts/AccountFormDialog.tsx`, `AccountList.tsx`, `src/app/accounts/actions.ts` [VERIFIED]
- `.planning/phases/27-savings-schema-crud/27-CONTEXT.md` — locks D-01…D-16
- `.planning/research/SUMMARY.md`, `ARCHITECTURE.md`, `STACK.md`, `PITFALLS.md` — milestone ground

### Secondary (MEDIUM confidence)
- [CITED: https://www.prisma.io/docs/orm/overview/databases/sqlite] — Enum→TEXT; Int→INTEGER; no DB enum enforce
- [CITED: Investopedia basis point; Modern Treasury / fintech integer fixed-point articles] — bps/integer rate practice aligns with D-01 (product already locked)

### Tertiary (LOW confidence)
- Exact RU pluralization preference beyond CONTEXT discretion — confirm in UAT if needed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — pinned package.json + zero new deps + milestone STACK
- Architecture: HIGH — credit CHECK/Zod/UI twins verified in-repo
- Pitfalls: HIGH — milestone PITFALLS + concrete code warning signs

**Research date:** 2026-09-11  
**Valid until:** 2026-10-11 (stable in-repo patterns; re-check if Account schema migrates again)
