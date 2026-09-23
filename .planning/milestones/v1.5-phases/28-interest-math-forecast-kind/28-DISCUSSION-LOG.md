# Phase 28: Interest math + forecast kind - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-21
**Phase:** 28-Interest math + forecast kind
**Areas discussed:** Principal LOCF / compound, Minor rounding ÷12, Phase 28 API surface, Zero-amount slots

---

## Principal LOCF / compound

| Option | Description | Selected |
|--------|-------------|----------|
| Flat today’s LOCF each month | Non-compounding research default | |
| Compound forecast principal | Next month on body + prior forecast interest | ✓ |
| You decide | Default flat | |

**User's choice:** Compound in overlay; monthly DOM credits (not daily); start = this account LOCF today only; independent per SAVINGS; FX later; current Account rate/DOM (discretion).
**Notes:** User wants to see accrual day and real money after credits stay on account. Zero/missing LOCF → no slots.

---

## Minor rounding ÷12

| Option | Description | Selected |
|--------|-------------|----------|
| Truncate toward 0 | bigint discard fraction | ✓ |
| Floor | | |
| Round half-up | | |
| You decide | Truncate | |

**User's choice:** Truncate; `(balance × bps) / (12 × 10000)` one truncate; compound uses truncated minor; truncate→0 → no slot.
**Notes:** —

---

## Phase 28 API surface

| Option | Description | Selected |
|--------|-------------|----------|
| Core only | Formula + kind + tests | |
| Core + membership | Enumerator ready for Phase 29 | |
| You decide | Core + membership (research) | ✓ |

**User's choice:** Discretion → core + membership; nw-forecast kind+window+ΔNW now; parentId=accountId; reuse calendar helpers.
**Notes:** No Dashboard/MCP wire in Phase 28.

---

## Zero-amount slots

| Option | Description | Selected |
|--------|-------------|----------|
| Skip 0% / zero interest | No emit | ✓ |
| Emit Δ=0 calendar | | |
| You decide | Unified interestMinor > 0 | ✓ (rule) |

**User's choice:** 0% → no slots; unified emit only if interestMinor > 0 (discretion).
**Notes:** Aligns with zero balance / truncate→0 skips already chosen.

---

## Claude's Discretion

- Current Account rate/DOM for whole horizon (no rate history)
- Core + membership enumerator deliverable
- nw-forecast interest ΔNW + window in Phase 28
- Reuse `nextAccrualAsOf` / `clampDayOfMonth`
- Unified `interestMinor > 0` membership gate
- Exact export names / horizon arg plumbing

## Deferred Ideas

- ASSET ↔ SAVINGS type conversion in account settings — **separate phase** (user confirmed)
- Phases 29–30 overlay/SAVISO/MCP as roadmap
