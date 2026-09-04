# Stack Research

**Domain:** Personal debts (counterparties) on existing local NW tracker
**Researched:** 2026-09-04
**Confidence:** HIGH
**Milestone:** v1.1 Долги людям (subsequent — ADD to existing app)

## Recommended Stack

### Core Technologies (reuse — do NOT replace)

| Technology | Version (pinned) | Purpose | Why for debts |
|------------|------------------|---------|---------------|
| Next.js | 16.3.4 App Router | RSC pages + Server Actions | Same CRUD pattern as accounts/currencies |
| Prisma | 7.10.0 + better-sqlite3 13.0.3 | Schema + SQLite | New Person / Debt / DebtRepayment models |
| React | 19.2.8 | Client dialogs/charts | Existing Dialog + formKey remount |
| Zod | 4.5.4 | Action validation | Mirror account/balance schemas |
| recharts | 3.10.1 | Remaining + repayment charts | Reuse chart.tsx / RangePreset patterns |
| Vitest | 4.1.11 | Pure domain tests | remaining = initial − Σ repayments; write-off |

### Supporting Libraries

| Library | Purpose | When to Use |
|---------|---------|-------------|
| `@/lib/money` | INTEGER minor + `convertOtherMinorToPrimaryMinor` | Debt totals in primary; never invent new money math |
| `@/lib/locf` | Dated as-of helpers if needed | Prefer explicit repayment dates for series (not LOCF of balances) |
| shadcn/ui Dialog/Select | Russian CRUD | Person, debt, repayment dialogs |
| lucide-react | Nav icons if needed | Keep nav text-first like today |

### What NOT to add

- No new chart library (recharts already ships CHART-*)
- No decimal.js / money libs — stick to BigInt minor + existing converters
- No ORM swap, no auth, no external debt APIs
- No interest engines

## Installation

No new packages expected for v1.1. If chart composition needs a shared shell, copy `DashboardChartsShell` / `chart.tsx` patterns — do not `npm install` alternatives.

## Integration Notes

- **Nav:** extend `src/components/nav.tsx` links with `/debts` (label «Долги»); active = path prefix like `/accounts`
- **Money:** repayment + initial amounts use Currency.scale of debt currency; primary totals use LOCF FX via `convertOtherMinorToPrimaryMinor` (same as NW rows)
- **Prisma:** migration adds Person, Debt, DebtRepayment; Currency relation on Debt.currencyCode; Restrict on delete like BalanceSnapshot
- **Docker:** no Compose change — migrate-on-start already covers schema

## Confidence

**HIGH** — stack already proven in v1.0; debts are domain + UI only.
