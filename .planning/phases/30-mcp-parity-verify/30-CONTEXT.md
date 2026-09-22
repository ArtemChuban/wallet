# Phase 30: MCP PARITY + verify - Context

**Gathered:** 2026-09-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Agents see the same SAVINGS read surfaces as the UI (PARITY-01): `list_accounts` exposes rate + accrual day; `get_forecast_overlay` includes `interest` events alongside income and grace; MCP descriptions/instructions name SAVISO-01 with INISO/GRISO; Vitest + Orca verify overlay parity and historical NW unchanged without new snaps.

Does **not** deliver: ASSET ↔ SAVINGS conversion (Phase 31), new MCP tool names, payload isolation meta fields, connect-docs README rewrite, chart legend split by kind, auto BalanceSnapshot.

</domain>

<decisions>
## Implementation Decisions

### list_accounts SAVINGS fields
- **D-01:** Always emit `annualRateBps`, `accrualDayOfMonth`, and `annualRatePercent` on every row — values for `SAVINGS`, `null` for other types (mirror `creditLimitMinor`). — **Reversibility:** costly — published MCP catalog shape once agents connect.
- **D-02:** `annualRatePercent` is a JSON **number** (e.g. `16.5`, UI major % up to 2 decimals). `annualRateBps` Int remains source of truth.
- **D-03:** No `isSavings` boolean — agents filter with `type === "SAVINGS"`.
- **D-04:** Update `list_accounts` tool description to mention SAVINGS rate / DOM / percent fields.

### Forecast overlay interest (MCP)
- **D-05:** Wire interest the **same way as UI**: `loadForecastOverlay` loads today LOCF per SAVINGS (as `/` page → `forecastSavings`), calls `listInterestSlotsInRange`, maps to `ForecastSlot` kind `"interest"`, concats with income + grace into `buildNetWorthForecastSeries`. — **Reversibility:** costly — PARITY-01 agents depend on UI-identical membership/amounts.
- **D-06:** Keep horizon default **today + 365** when `horizonEnd` omitted (Phase 25 D-04).
- **D-07:** `forecastEvents` for interest match grace/UI shape: kind, parentId (= accountId), plannedAmountMinor, displayPrimaryMajor, currencyCode, accountId, accountName. Do **not** put rate on the event (`list_accounts` already has it).
- **D-08:** Shared extract vs inline mirror of shell mapping is planner discretion; numbers must match UI.

### SAVISO + tool / handler copy
- **D-09:** Add **SAVISO-01** to `get_forecast_overlay` description and `create-handler` server instructions alongside INISO/GRISO. — **Reversibility:** costly — published agent-facing instruction surface.
- **D-10:** Use a **triple tag** on the overlay closer: `INISO-01/GRISO-01/SAVISO-01`. Prose: income + interest + grace; overlay must not fold into historical NW LOCF. Drop stale **«A′»** wording (Phase 29 D-11 grace dips the line).
- **D-11:** Extend `isolation-contract.test.ts` to require `SAVISO-01`. Update forecast tests that assert old «A′» / income+grace-only copy.
- **D-12:** Do **not** put SAVISO on `list_accounts`. Do **not** rewrite README connect section (URL-only; no A′ text there). No isolation meta fields in JSON payloads (Phase 25/26 D-06/D-11).

### Verify bar
- **D-13:** Done bar = **Vitest contracts** + **Orca UAT** (OPERATOR.md). Nyquist via normal validate-phase, not a separate plan for its own sake.
- **D-14:** Orca must show: `list_accounts` SAVINGS fields; `get_forecast_overlay` with `kind: "interest"`; historical NW / BalanceSnapshot count unchanged by forecast reads. Not a full SIDE-tool smoke.
- **D-15:** Vitest seeds its own SAVINGS + LOCF. Orca: if no накопительный, agent creates one via UI then calls MCP.
- **D-16:** Savings todo stays open until **`/gsd-complete-milestone` v1.5** — do not mark resolved mid Phase 30 (same as Phase 29 C-06). Phase 31 conversion is separate.

### Claude's Discretion
- Exact percent helper (reuse `savings-rate` bps↔percent vs inline).
- Whether to extract shared “SAVINGS → interest ForecastSlot[]” helper used by shell + MCP, or duplicate thin mapping in the loader.
- Exact English+RU wording of the triple-tag sentence (must include SAVISO-01 and drop A′).
- How Orca asserts “no new snaps” (DB count, MCP NW series identity, or both).

### Folded Todos
- **Savings account type with interest NW forecast** (`.planning/todos/pending/2026-09-10-savings-account-type-with-interest-nw-forecast.md`) — Phase 30 is the MCP slice of this milestone seed. Resolve only at v1.5 milestone complete (D-16), not when Phase 30 plans finish.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase / milestone scope
- `.planning/ROADMAP.md` — Phase 30 success criteria (MCP-01, MCP-02, PARITY-01; Orca/Nyquist verify)
- `.planning/REQUIREMENTS.md` — MCP-01, MCP-02, PARITY-01; SAVISO-01/02 already Complete in Phase 29
- `.planning/PROJECT.md` — PARITY-01 constraint; v1.5 MCP read tools; SAVISO twin of INISO/GRISO
- `.planning/STATE.md` — current position Phase 30
- `.planning/OPERATOR.md` — agent-driven UAT / Orca
- `AGENTS.md` — standing PARITY-01 block

### Prior decisions (do not reopen)
- `.planning/phases/29-kapital-overlay-saviso/29-CONTEXT.md` — UI interest overlay + D-11 grace dip; C-05 deferred MCP to Phase 30
- `.planning/phases/28-interest-math-forecast-kind/28-CONTEXT.md` — `listInterestSlotsInRange`, compound chain, kind `"interest"`
- `.planning/phases/27-savings-schema-crud/27-CONTEXT.md` — `annualRateBps`, accrual DOM, «Накопительный»
- `.planning/milestones/v1.4-phases/25-side-ledger-tools-isolation/25-CONTEXT.md` — sparse overlay, horizon D-04, isolation in descriptions only
- `.planning/milestones/v1.4-phases/26-connect-docs-policy/26-CONTEXT.md` — named DISOL/INISO/GRISO in instructions + tool descriptions

### Code anchors
- `src/lib/mcp/tools/accounts.ts` — `list_accounts` / `ListAccountRow` (add rate fields)
- `src/lib/mcp/reads/load-forecast-overlay.ts` — wire interest membership; serialize already allows kind `"interest"`
- `src/lib/mcp/tools/forecast.ts` — `GET_FORECAST_OVERLAY_DESCRIPTION` (A′ → triple tag)
- `src/lib/mcp/create-handler.ts` — server instructions SIDE closers
- `src/lib/mcp/isolation-contract.test.ts` — require SAVISO-01
- `src/lib/savings-interest.ts` — `listInterestSlotsInRange`
- `src/lib/savings-rate.ts` — bps ↔ percent helpers
- `src/components/dashboard/DashboardChartsShell.tsx` — UI interest concat pattern to mirror
- `src/app/page.tsx` — `forecastSavings` LOCF assembly for MCP parity

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `listInterestSlotsInRange` — pure enumerator; shell already consumes it.
- `serializeForecastPayload` / `SerializedForecastEvent` — already includes `kind: "interest"`.
- `ListAccountRow` + `creditLimitMinor` null pattern — template for rate/DOM/percent nulls.
- Isolation one-liner pattern on SIDE tools + `isolation-contract.test.ts` presence asserts.

### Established Patterns
- Isolation messaging in descriptions/instructions only — never payload meta.
- Money minors as JSON strings; display majors as numbers (`displayPrimaryMajor`).
- Forecast tool: optional `horizonEnd`; default today+365; UI presets are description hints only.
- English primary tool prose + RU domain aliases (Капитал, Прогноз, счета).

### Integration Points
- `loadForecastOverlay` currently fetches income + grace only — add SAVINGS LOCF query + interest slots before `buildNetWorthForecastSeries`.
- `loadListAccounts` prisma select must include `annualRateBps` / `accrualDayOfMonth`.
- Forecast + accounts Vitest suites and isolation-contract need SAVINGS/interest/SAVISO asserts.
- Orca UAT against live `http://127.0.0.1:3000/api/mcp`.

</code_context>

<specifics>
## Specific Ideas

- Agents should not need a second tool to learn the rate: catalog carries bps + percent; events carry amounts + accountName only.
- Stale «A′ grace» copy must die in the same phase that ships interest — agents otherwise learn the wrong line semantics.
- Full SIDE smoke is out of scope; two MCP reads are enough for PARITY proof.

</specifics>

<deferred>
## Deferred Ideas

- ASSET ↔ SAVINGS type conversion — Phase 31
- Chart legend split by kind — already deferred in REQUIREMENTS.md
- Settings timezone for MCP `today` — separate todo (reviewed, not folded)
- README connect-docs expansion beyond URL — not needed this phase

### Reviewed Todos (not folded)
- **Add timezone selection to settings** (`.planning/todos/pending/2026-09-05-add-timezone-selection-to-settings.md`) — weak match; MCP keeps Europe/Moscow via existing helper until that todo ships.

</deferred>

---

*Phase: 30-MCP PARITY + verify*
*Context gathered: 2026-09-22*
