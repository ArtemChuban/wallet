# Phase 31: ASSET ↔ SAVINGS type conversion - Context

**Gathered:** 2026-09-22
**Status:** Ready for planning

<domain>
## Phase Boundary

User can switch an existing account between `ASSET` and `SAVINGS` in account settings (both directions). Into `SAVINGS`: must set annual rate + accrual day-of-month (same invariants as create). Out of `SAVINGS`: rate and accrual day clear so non-SAVINGS CHECK holds. Balance snapshots and historical NW stay — conversion does not write a new snapshot and does not drop history. Other types (`FIAT_CREDIT` and legacy soft aliases) stay immutable.

Does **not** deliver: currency change on edit; create-form type-list changes; MCP write/convert tool; confirm/destructive second step for type change; interest math / overlay / MCP read (Phases 28–30 already shipped).

Supersedes Phase 27 **D-08 type lock** only for the pair `ASSET` ↔ `SAVINGS`. Currency immutability and create-time type choice stay as Phase 27.

</domain>

<decisions>
## Implementation Decisions

### Edit surface & submit
- **D-01:** Type switch lives in the same **`AccountFormDialog` edit** («Изменить счёт») — unlock type select for accounts that are already `ASSET` or `SAVINGS`. — **Reversibility:** costly — reopens Phase 27 D-08 edit contract; Zod + `updateAccount` must accept type.
- **D-02:** **One Submit** updates name + type + rate/DOM together (extend current SAVINGS name+rate+DOM pattern).
- **D-03:** **Currency stays locked** on edit (label only) — conversion is type-only.
- **D-04:** Create form unchanged: still `ASSET | FIAT_CREDIT | SAVINGS`.

### Draft UI (before Submit)
- **D-05:** **Immediate type-gate** in the form: `ASSET`→`SAVINGS` shows empty «Годовой %» / «День начисления»; `SAVINGS`→`ASSET` hides and clears those fields (mirror create type-gate).
- **D-06:** Leaving `SAVINGS` in the draft **always resets** rate/DOM — toggling back to `SAVINGS` starts empty again (no dialog memory of prior draft values).
- **D-07:** On convert to `SAVINGS`, fields start **empty** — user must fill both (mirror create; no prefill; 0% still allowed once entered per Phase 27 D-02).
- **D-08:** Save button stays **enabled** while empty; validation on submit.

### Confirm / copy
- **D-09:** **No** second-step confirm for either direction (no in-dialog confirm; `window.confirm` already banned).
- **D-10:** **No** soft warning hint under the type control when clearing rate/DOM.
- **D-11:** Success message stays **«Сохранено»** (no special “type changed” copy).
- **D-12:** Validation errors for missing rate/DOM reuse create Russian field errors («Укажите годовой процент» / «Укажите день начисления»).

### Allowed type peers & server gate
- **D-13:** For edit of `ASSET` or `SAVINGS`, type select options are **only `ASSET` and `SAVINGS`** (no `FIAT_CREDIT` in the list).
- **D-14:** For `FIAT_CREDIT` and legacy soft types, type remains **read-only label** — no select.
- **D-15:** Server **hard-rejects** forbidden type transitions (forged FormData, etc.) with generic save failure and/or type field error — UI is not the only gate. — **Reversibility:** costly — write-path invariant; tests should lock allowed matrix: only `ASSET`↔`SAVINGS`.
- **D-16:** Conversion **must not** create/update/delete `BalanceSnapshot` or rewrite historical NW (ACCT-04 / roadmap). Clearing rate/DOM is metadata only.

### Claude's Discretion
- Exact Zod/`updateAccount` shape for optional `type` on update; how DB CHECK + Prisma update clear `annualRateBps`/`accrualDayOfMonth` on `SAVINGS`→`ASSET`.
- Exact Russian string for forbidden-transition reject (generic vs `errors.type`).
- Whether type is a visible `<select>` vs equivalent control — must match D-01/D-13.
- No MCP convert/write tool unless planner finds an existing write-account MCP surface that must stay consistent (PARITY-01 is read surfaces; default = UI-only this phase).

### Folded Todos
- **Savings account type with interest NW forecast** (`.planning/todos/pending/2026-09-10-savings-account-type-with-interest-nw-forecast.md`) — milestone seed; this phase is the last ACCT-04 slice after schema/CRUD/interest/overlay/MCP. Resolve/close when Phase 31 ships per todo tooling.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase / milestone scope
- `.planning/ROADMAP.md` — Phase 31 goal, success criteria, depends on Phase 27
- `.planning/REQUIREMENTS.md` — **ACCT-04** (pending); SAVISO / INT already complete
- `.planning/PROJECT.md` — v1.5; no `window.confirm`; Out of Scope auto BalanceSnapshot
- `.planning/STATE.md` — current position Phase 31
- `.planning/OPERATOR.md` — agent-driven UAT

### Prior phase locks (type/rate contracts)
- `.planning/phases/27-savings-schema-crud/27-CONTEXT.md` — D-01…D-16 rate/DOM/CHECK; **D-08 type lock superseded here only for ASSET↔SAVINGS**; currency lock stands; labels «Годовой %» / «День начисления» / «Накопительный»
- `.planning/phases/28-interest-math-forecast-kind/28-CONTEXT.md` — interest math unchanged by conversion
- `.planning/phases/29-kapital-overlay-saviso/29-CONTEXT.md` — SAVISO; overlay reads type/rate — conversion must leave history alone
- `.planning/phases/30-mcp-parity-verify/30-CONTEXT.md` — `list_accounts` emits rate fields; read MCP stays valid after type change

### Code anchors
- `src/components/accounts/AccountFormDialog.tsx` — edit type currently label-only; extend type select + type-gate
- `src/app/accounts/actions.ts` — `updateAccount` ignores client type today; must accept ASSET↔SAVINGS and clear savings fields
- `src/lib/validations/account.ts` — `updateAccountSchema` / create refinements; extend for type transition
- `src/lib/account-type.ts` — soft labels / `isAssetType` (SAVINGS already asset-like for NW)
- `src/lib/savings-rate.ts` — `parsePercentToBps` / display helpers
- `prisma/schema.prisma` — `AccountType`, CHECK rate+DOM iff SAVINGS
- `src/app/accounts/actions.test.ts` / `src/lib/validations/account.test.ts` — extend for conversion matrix

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AccountFormDialog` — create already type-gates rate/DOM; edit must unlock type for ASSET/SAVINGS and reuse that gate
- `updateAccount` + `updateAccountSchema` — extend rather than new action
- Phase 27 Russian field errors and bps parsing — reuse on convert-to-SAVINGS
- `accountTypeLabel` — read-only path for FIAT_CREDIT/legacy

### Established Patterns
- Type + currency immutable after create (Phase 27) — this phase punches a narrow hole for type only
- SQLite CHECK + Zod dual enforcement for type↔field invariants
- No `window.confirm`; destructive UX = in-dialog second step (user chose **no** second step for this metadata clear)
- Manual BalanceSnapshot path unchanged; conversion is account-row metadata update only

### Integration Points
- `/accounts` list + edit dialog; revalidate `/accounts` and `/` after save (already in `updateAccount`)
- Капитал forecast / MCP read pick up new type+rate on next load — no special write in this phase
- List secondary line (rate + «через N дн.») appears/disappears with type after refresh

</code_context>

<specifics>
## Specific Ideas

- Prefer minimal friction: one dialog, one Save, no confirm, no hint, same «Сохранено».
- Draft behavior should not lie: fields visible state matches what Submit will persist.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

### Reviewed Todos (not folded)
- **Add timezone selection to settings** (`.planning/todos/pending/2026-09-05-add-timezone-selection-to-settings.md`) — weak keyword match only; unrelated to ACCT-04.

</deferred>

---

*Phase: 31-asset-savings-type-conversion*
*Context gathered: 2026-09-22*
