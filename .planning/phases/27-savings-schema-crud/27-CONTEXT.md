# Phase 27: SAVINGS schema + CRUD - Context

**Gathered:** 2026-09-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create and manage `SAVINGS` accounts with annual rate + accrual day-of-month; principal balances count in net worth like other assets via existing manual `BalanceSnapshot` path.

Does **not** deliver: interest ÷12 math / `ForecastSlotKind: "interest"` (Phase 28), Капитал «Прогноз» overlay + SAVISO (Phase 29), MCP PARITY (Phase 30).

</domain>

<decisions>
## Implementation Decisions

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

### Folded Todos
- **Savings account type with interest NW forecast** (`.planning/todos/pending/2026-09-10-savings-account-type-with-interest-nw-forecast.md`) — milestone seed. Phase 27 covers schema+CRUD slice; interest overlay / MCP remain Phases 28–30. Mark todo resolved when v1.5 ships or split-complete per todo tooling.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase / milestone scope
- `.planning/ROADMAP.md` — Phase 27 success criteria (ACCT-01…03)
- `.planning/REQUIREMENTS.md` — ACCT-01, ACCT-02, ACCT-03; v1.5 locks (distinct SAVINGS; no auto snapshot)
- `.planning/PROJECT.md` — v1.5 goal; Out of Scope (auto BalanceSnapshot, compound engines)
- `.planning/STATE.md` — current position Phase 27

### Research
- `.planning/research/SUMMARY.md` — `annualRateBps` + CHECK + soft-read + build order
- `.planning/research/ARCHITECTURE.md` — Account extension sketch; no side-ledger table
- `.planning/research/FEATURES.md` — table stakes; RU накопительный mental model
- `.planning/research/PITFALLS.md` — principal excluded from NW; unconstrained rate columns

### Prior patterns (do not reopen)
- `.planning/milestones/v1.3-phases/19-schema-pure-grace-domain-math/19-CONTEXT.md` — type-gated DOM + CHECK + Zod discipline
- `.planning/milestones/v1.3-quick/260908-0i7-merge-debit-crypto-and-cash-account-type/260908-0i7-CONTEXT.md` — ASSET soft-compat; write enum discipline

### Code anchors
- `prisma/schema.prisma` — `AccountType`, `Account` fields + CHECKs
- `src/lib/account-type.ts` — soft labels / `isAssetType`
- `src/lib/validations/account.ts` — create/update Zod; day-of-month schema
- `src/lib/dates.ts` — `clampDayOfMonth`
- `src/lib/net-worth.ts` / `src/lib/historical-series.ts` — asset inclusion
- `src/components/accounts/AccountFormDialog.tsx` — create/edit UI
- `src/components/accounts/AccountList.tsx` — list secondary line pattern (credit limit)
- `src/app/accounts/actions.ts` — server actions
- `.planning/OPERATOR.md` — agent-driven UAT

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AccountFormDialog` / `AccountList` — extend type options + type-gated fields; list subtitle pattern already used for credit limit
- `account-type.ts` — add SAVINGS to soft union + Russian label «Накопительный»
- `validations/account.ts` — extend write enum + savings field refine (mirror FIAT_CREDIT creditLimit / DOM)
- `clampDayOfMonth` in `dates.ts` — next accrual date / days-until list helper
- `isAssetType` / `NetWorthAccountType` — must include SAVINGS so principal hits NW

### Established Patterns
- Type immutable after create; currency immutable; credit metadata type-gated
- Edit historically name-only — **exception for SAVINGS**: name + rate + DOM in same dialog (D-08)
- SQLite CHECK + Zod dual enforcement for type↔field invariants
- Soft-read legacy FIAT_DEBIT/CRYPTO/CASH still asset; new writes ASSET | FIAT_CREDIT | SAVINGS

### Integration Points
- `/accounts` list + dialogs; NW dashboard already sums asset types — no new NW page
- Balance snapshot dialogs unchanged
- MCP list_accounts enrichment is Phase 30 — do not block Phase 27 on MCP

</code_context>

<specifics>
## Specific Ideas

- List line: percent + countdown to next accrual («через N дн.»), **not** raw day-of-month number
- Form labels locked: «Годовой %», «День начисления»
- Type chip/label: «Накопительный»

</specifics>

<deferred>
## Deferred Ideas

- Interest amount math (`balance × rate / 12`), `ForecastSlotKind: "interest"` — Phase 28
- Капитал dashed «Прогноз» wire + SAVISO — Phase 29
- MCP `list_accounts` / forecast parity — Phase 30
- Soft max rate cap, ASSET↔SAVINGS conversion, separate «Проценты» dialog — rejected / not in scope
- Compound/APY, auto BalanceSnapshot, savings goals — PROJECT Out of Scope

None additional from discussion beyond roadmap phases.

</deferred>

---

*Phase: 27-SAVINGS schema + CRUD*
*Context gathered: 2026-09-11*
