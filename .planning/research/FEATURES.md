# Features Research

**Domain:** Personal IOU tracking (people → debts → repayments)
**Researched:** 2026-09-04
**Confidence:** HIGH
**Milestone:** v1.1

## Feature Categories

### People (counterparties)

| Feature | Tier | Complexity | Notes |
|---------|------|------------|-------|
| Create/rename/list people | Table stakes | Low | Separate entity; many debts per person |
| Delete person | Differentiator / defer | Med | Block if open debts; or cascade policy — decide in plan |
| Merge people | Anti-feature v1.1 | High | Defer |

### Debts

| Feature | Tier | Complexity | Notes |
|---------|------|------------|-------|
| Direction: I owe / they owe me | Table stakes | Low | Enum on Debt |
| Currency + initial amount (minor) | Table stakes | Low | Existing Currency FK; BigInt |
| Optional due date + note | Table stakes | Low | due nullable YYYY-MM-DD |
| Remaining = initial − Σ repayments − writeOff | Table stakes | Med | Pure function; single source of truth |
| Open / closed status | Table stakes | Low | Auto close at 0; early close with forgive |
| Edit initial after payments | Defer / careful | Med | Prefer immutable initial; edit note/due only if possible |
| Filters / search | Out of scope v1.1 | Low | User chose single list |

### Repayments

| Feature | Tier | Complexity | Notes |
|---------|------|------------|-------|
| Partial repayment same currency + asOfDate | Table stakes | Med | Backdating like BalanceSnapshot |
| Repayment history list | Table stakes | Low | Chronological |
| Delete/edit repayment | Should have | Med | Recalc remaining; reopen if was closed by zero |
| Cross-currency repayment | Out of scope | High | User deferred |
| Link repayment to account balance change | Anti-feature v1.1 | High | Would mix NW and debts |

### Charts & totals

| Feature | Tier | Complexity | Notes |
|---------|------|------------|-------|
| Chart: remaining over time | Table stakes | Med | Step series from initial + dated repayments/write-off |
| Chart: repayment amounts | Table stakes | Low | Bar/line of payment events |
| Totals I-owe / they-owe in primary | Table stakes | Med | FX as-of today; partial banner if missing rate |
| Debts in NW / Капитал | Anti-feature | — | Explicitly excluded |

### Navigation / UX

| Feature | Tier | Complexity | Notes |
|---------|------|------------|-------|
| Nav «Долги» → `/debts` | Table stakes | Low | Separate section |
| Person detail with nested debts | Should have | Med | Or flat list grouped by person |
| Empty states RU | Table stakes | Low | Same pattern as RateList / accounts |

## Table Stakes vs Differentiators

**Must ship (v1.1):**
- Person CRUD (at least create/list/rename)
- Debt CRUD with direction, currency, initial, optional due/note
- Dated same-currency repayments + history
- Remaining math + auto-close + early write-off
- Dual chart (remaining + payments)
- Primary totals with FX honesty (partial if no rate)
- Debts never touch `computeNetWorthRows`

**Nice if cheap:**
- Delete repayment; reopen debt if remaining > 0
- Person delete when no open debts
- Grouped list by person

**Defer:**
- Filters, interest, cross-currency pay, savings goals, NW integration, account delete polish

## Dependencies on Existing

- Currency + primary + FxRate LOCF for G15 totals
- money.ts conversion helpers
- recharts chart shell patterns from Phase 6
- Server Action + Zod + Dialog patterns from Phase 2–3
