# T-Bank Platinum — contract notes (Phase 18)

**Source tariff PDF:** `platinum-TP-7.90.pdf` (ТП 7.90, doc id `T-КК-ТП-7.90-260902`)  
**Rules PDF (fetched):** https://cdn.tbank.ru/static/documents/credit_cards-tariff-rules.pdf

## User calendar (this card)

| | DOM | Notes |
|---|-----|--------|
| Statement (выписка) | **21** | Same day every month |
| Pay-by for interest-free | **15 next month** | Inclusive; overdue from the 16th |
| Duration in days | **varies ~22–25** | Not a fixed +N; Feb shorter |

## Interest-free (беспроцентный) — tariff

- Marketing max **до 55 дней** (from purchase processing → min-payment date), **not** statement+55.
- **0%** on purchases/платы in interest-free window; else purchases **29.9%**; cash/cash-like **59.9%**.
- Interest-free holds only if:
  1. Full **«платёж для беспроцентного периода»** for that statement paid by **дата минимального платежа** on that statement  
     (= debt **without** installments + regular installment payment)
  2. At statement formation, no missed **minimum** on the previous statement
- For TP 7.90, deadline = **min-payment date** (not a separate «дата платежа для БП» as on TP 23.X / 7.790).

## Minimum payment

- ≤8% of debt, min 600 ₽; bank-calculated; shown on statement.
- **≠** interest-free amount. Wallet does **not** show/enter minimum in v1.3.

## Explicitly not modeled in v1.3

- APR / penalty (20%) / overlimit fee / insurance %
- Cash advances / cash-like ops
- Auto-detect «missed min voids next grace»
- Installment schedule engine (user includes installment slice in one manual field if needed)
