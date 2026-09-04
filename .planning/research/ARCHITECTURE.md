# Architecture Research

**Domain:** Debts side-ledger beside existing NW stack
**Researched:** 2026-09-04
**Confidence:** HIGH
**Milestone:** v1.1

## Integration Model

Debts are a **parallel domain**. Same app, same SQLite, same Currency/FX — **no writes into Account / BalanceSnapshot / net-worth paths**.

```
Person 1──* Debt *──* DebtRepayment
              │
              └── Currency (FK)
                    └── FxRate (read-only for primary totals)
```

### Suggested schema (conceptual)

**Person:** `id`, `name` (unique), timestamps

**Debt:**
- `personId`, `direction` enum (`I_OWE` | `THEY_OWE`)
- `currencyCode`, `initialAmountMinor` BigInt
- `dueDate` String? YYYY-MM-DD, `note` String?
- `status` enum (`OPEN` | `CLOSED`)
- `closedAt` / `writeOffMinor` optional — amount forgiven on early close (0 if closed by repayment)
- timestamps

**DebtRepayment:**
- `debtId`, `asOfDate` String YYYY-MM-DD, `amountMinor` BigInt
- optional unique `(debtId, asOfDate)` OR allow multiple same day — prefer **allow multiple** (no unique) like real life; order by date then id

### Remaining math (pure)

```
remaining = initialAmountMinor - sum(repayments.amountMinor) - writeOffMinor
```

- Clamp validation: repayment cannot exceed remaining before write-off
- Auto-close when remaining hits 0 after repayment
- Early close: set `writeOffMinor = remaining`, status CLOSED
- Reopen rules: if delete repayment after auto-close → status OPEN again (plan-phase decision; recommend yes)

### Primary totals

For open debts only (or include closed? — **open only** for “я должен / мне должны”):

1. Group by direction
2. For each debt: convert `remaining` via LOCF `rateToPrimaryScaled` (identity if primary currency)
3. Missing FX → exclude from that side’s total + `isPartial` banner (copy NW honesty)

**Hard gate:** `src/app/page.tsx` / `computeNetWorthRows` / `buildNetWorthSeries` must not import debt models.

### App routes

| Route | Role |
|-------|------|
| `/debts` | List people/debts, direction totals hero |
| `/debts/[personId]` or `/debts/debts/[id]` | Detail: history + charts (pick one nesting in plan) |
| actions under `src/app/debts/actions.ts` | createPerson, createDebt, addRepayment, closeDebt, … |

### Chart series

Build pure `buildDebtRemainingSeries` / `buildDebtRepaymentSeries` in `src/lib/` (mirror `historical-series.ts`):

- Start: asOf initial create date or first event — use debt `createdAt` date or first repayment; if no events, flat line at initial until today
- Events: repayments decrease remaining; write-off drops to 0
- Client RangePreset reuse from dashboard charts

### Build order

1. Schema + migration + pure remaining/totals helpers + tests
2. Person + Debt CRUD (RU Dialog) + nav
3. Repayments + close/write-off
4. Charts + primary totals banner
5. Hard regression: NW page unchanged (smoke / unit isolation)

## New vs Modified

| Area | Change |
|------|--------|
| `prisma/schema.prisma` | New models |
| `src/lib/debts.ts` (new) | Remaining, totals, series |
| `src/app/debts/**` (new) | Pages + actions |
| `src/components/debts/**` (new) | Lists, dialogs, charts |
| `src/components/nav.tsx` | One link |
| NW / accounts / FX | **No semantic change** |

## Confidence

**HIGH** — mirrors BalanceSnapshot + FX patterns without coupling.
