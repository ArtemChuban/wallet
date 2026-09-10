# Phase 22: GRACEISO regression + polish - Context

**Gathered:** 2026-09-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Prove historical NW and `BalanceSnapshot` stay grace-free: automated GRISO regression (file-scan + past-series golden identity) as the twin of INISO, suitable for v1.3 milestone close. Light polish = gate hygiene (REQUIREMENTS/ROADMAP checkbox sync after green suite), not new UI features or RU redesign.

Does **not** deliver: new grace product behavior, APR / min / cash modeling, chart legend доходы vs обязательства, timezone/settings work, AI-agent integration.

</domain>

<decisions>
## Implementation Decisions

### Carried locks (do not re-open)
- **C-01:** Grace is forecast overlay only; never rewrites historical NW LOCF / `computeNetWorthRows` / `buildNetWorthSeries` (PROJECT + GRISO-01; Phase 18–21). — **Reversibility:** one-way — Core Value trust.
- **C-02:** Grace config / amount-due / early-close actions never write `BalanceSnapshot` (ROADMAP SC1; Phase 19–20 comments already assert). — **Reversibility:** one-way.
- **C-03:** A′ NW-neutral and OPEN membership rules stay as Phase 21; this phase does not change overlay math — only proves isolation walls. — **Reversibility:** costly if reopened.

### Suite twin layout
- **D-01:** Add dedicated **`src/lib/griso.test.ts`** mirroring `src/lib/iniso.test.ts` structure (describe `GRISO-01 isolation`): import walls on NW math + `nw-forecast` bans + past-series golden identity. — **Reversibility:** reversible — test file layout.
- **D-02:** Keep / expand **action write-gates** in `src/app/accounts/actions.test.ts` for grace mutations (schedule / amount / close / related) — same split as income: `iniso.test.ts` + `income/actions.test.ts`. Do not collapse everything into one file. — **Reversibility:** reversible.
- **D-03:** Milestone-close bar = green GRISO suite (file-scan + golden) covering ROADMAP SC 1–3; planner may fold existing partial GRISO smokes (`credit-grace.test.ts`, actions GRISO cases) into or alongside the twin without deleting coverage. — **Reversibility:** reversible.

### Write-path scan scope
- **D-04:** **Grace mutation surfaces** (accounts actions that update schedule / obligations / early close): must not call `balanceSnapshot` upsert/delete; source must not reference `BalanceSnapshot` write APIs; prisma test double has no BalanceSnapshot write surface for those paths (mirror income ISO action tests). — **Reversibility:** costly — product isolation.
- **D-05:** **`src/lib/net-worth.ts` and `src/lib/historical-series.ts`:** must not import `credit-grace` or `nw-forecast` (and must not match those module paths). Twin of INISO’s income/`nw-forecast` ban on those files. — **Reversibility:** costly.
- **D-06:** **`src/lib/nw-forecast.ts`:** keep INISO bans (no prisma / `BalanceSnapshot` / net-worth / historical-series). Grace slots as pure inputs remain allowed (Phase 21). — **Reversibility:** costly.
- **D-07:** **`src/lib/credit-grace.ts`:** must not import prisma `BalanceSnapshot`, `net-worth`, or `historical-series`. — **Reversibility:** costly.
- **D-08:** **Do not** ban the string `BalanceSnapshot` from legitimate account UI (`AccountList`, `SetBalanceDialog`, balance upsert actions). Scope is grace write-path + NW math walls, not global string ban. — **Reversibility:** reversible.

### Golden identity shape
- **D-09:** Past-series golden identity = **INISO style**: call `buildNetWorthSeries` twice with identical account/snapshot/rate inputs; conceptual grace fixture is **void / never passed** into the API; outputs bitwise-identical. Assert public input keys exclude grace/obligation/forecast fields (extend INISO forbidden-key list with grace synonyms: e.g. `grace`, `obligation`, `creditGrace`). — **Reversibility:** reversible — test design.
- **D-10:** Include at least one fixture set with a **credit account** + snapshots so LOCF still account-only when grace data “exists” conceptually. — **Reversibility:** reversible.
- **D-11:** No requirement to run DB integration for golden — pure unit inputs like INISO. Action write-gates cover mutation isolation. — **Reversibility:** reversible.

### Polish / close-out
- **D-12:** **Polish = gate hygiene**, not product polish: after suite green, mark **GRISO-01** in REQUIREMENTS + Phase 22 ROADMAP progress; sync STATE. No broad RU copy audit unless a test/UAT finds a break. — **Reversibility:** reversible.
- **D-13:** **Orca UAT:** agent-driven smoke only if phase verification/OPERATOR gate requires live check for milestone close; primary evidence is automated GRISO suite. No new UI chrome for isolation. — **Reversibility:** reversible.

### Claude's Discretion
- Exact test case names / describe nesting inside `griso.test.ts` (mirror INISO naming with GRISO prefixes).
- Whether to relocate thin smokes from `credit-grace.test.ts` into `griso.test.ts` or leave both (prefer leave + add twin; avoid coverage loss).
- Exact list of grace action function names under write-gate (research reads `accounts/actions.ts`).
- File naming: `griso.test.ts` locked (matches GRISO-01 / INISO `iniso.test.ts` short prefix).

### Reviewed Todos (not folded)
- «Add timezone selection to settings» — out of scope (weak milestone keyword match).
- «Integrate local AI agent via subprocess» — out of scope.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone / phase scope
- `.planning/ROADMAP.md` — Phase 22 goal + success criteria (SC1–3); GRISO-01
- `.planning/REQUIREMENTS.md` — GRISO-01; OOS antithesis (no historical LOCF from grace; no auto snapshot on close)
- `.planning/PROJECT.md` — historical NW grace-unaffected; Core Value; INISO precedent
- `.planning/STATE.md` — current position Phase 22

### Prior isolation pattern (MUST twin)
- `.planning/milestones/v1.2-phases/17-nw-forecast-overlay-isolation/17-CONTEXT.md` — ISO-01 / INISO D-17; file-scan + golden
- `src/lib/iniso.test.ts` — canonical suite shape to mirror
- `src/app/income/actions.test.ts` — action file-scan / no BalanceSnapshot write pattern
- `src/lib/disol.test.ts` — older isolation scan ancestor (optional read)

### Prior grace decisions
- `.planning/phases/18-bank-contract-study-discuss-locks/18-CONTEXT.md` — overlay A′ locks
- `.planning/phases/19-schema-pure-grace-domain-math/19-CONTEXT.md` — obligation identity; NW must stay grace-free
- `.planning/phases/20-obligation-crud-cycle-ui/20-CONTEXT.md` — CRUD write paths; no snapshot
- `.planning/phases/21-kapital-forecast-integration/21-CONTEXT.md` — forecast overlay; GRACEISO deferred here

### Operator / conventions
- `.planning/OPERATOR.md` — agent-driven UAT if verification asks
- `.planning/codebase/CONVENTIONS.md` — UAT + no `window.confirm`

### Code anchors
- `src/lib/net-worth.ts` / `src/lib/historical-series.ts` — must stay grace-free (import walls + golden)
- `src/lib/nw-forecast.ts` — overlay only; INISO bans remain
- `src/lib/credit-grace.ts` — pure domain; no snapshot / NW series imports
- `src/app/accounts/actions.ts` — grace mutations + legitimate `upsertBalanceSnapshot` (do not conflate)
- `src/lib/credit-grace.test.ts` — existing GRISO smoke (fold/leave per discretion)
- `src/app/accounts/actions.test.ts` — existing GRISO never-calls cases (expand)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/iniso.test.ts` — copy structure for GRISO file-scan + golden + API key / type wall
- Income `actions.test.ts` BalanceSnapshot absence checks — template for grace mutation gates
- Partial GRISO asserts already in `accounts/actions.test.ts` and `credit-grace.test.ts`

### Established Patterns
- Side ledgers never write `BalanceSnapshot`; forecast is overlay-only
- Isolation proven by static file-scan + pure golden identity (no DB for series)
- Short-prefix isolation test files: `disol` / `iniso` → `griso`

### Integration Points
- No new runtime integration — tests + checklist sync only
- Verification must not regress Phase 21 forecast behavior while adding walls

</code_context>

<specifics>
## Specific Ideas

- User deferred all gray areas to Claude (`Сам реши все эти вопросы`) — decisions above are discretionary locks for planner/researcher.
- Twin fidelity to INISO preferred over inventing a new isolation architecture.

</specifics>

<deferred>
## Deferred Ideas

- Chart legend доходы vs обязательства — already beyond v1.3 in REQUIREMENTS Deferred.
- Timezone settings todo / local AI agent todo — not folded.
- Broad RU microcopy polish pass — out of scope unless a failure forces a fix.

None else — discussion stayed within GRACEISO regression + gate hygiene.

</deferred>

---

*Phase: 22-GRACEISO regression + polish*
*Context gathered: 2026-09-10*
