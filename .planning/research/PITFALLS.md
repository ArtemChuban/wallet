# Pitfalls Research

**Domain:** Adding personal debts to existing NW tracker
**Researched:** 2026-09-04
**Confidence:** HIGH
**Milestone:** v1.1

## Critical Pitfalls

### 1. Debts leak into net worth

**Risk:** Convenient “include debts in capital” or shared dashboard math silently changes Core Value.

**Prevention:** No debt imports in `net-worth.ts` / `historical-series.ts` / `page.tsx`. Review checklist + unit tests only on debts lib. Totals live only under `/debts`.

**Phase:** Schema + totals phase; verify in final phase.

### 2. Double-counting credit cards vs personal debts

**Risk:** User models “owe bank” both as FIAT_CREDIT account and as Person debt → confusion (not NW double count if debts excluded, but UX lies).

**Prevention:** Copy in empty state / help: долги людям ≠ кредитная карта. Credit stays on Accounts; personal IOUs on Debts.

**Phase:** UI copy with first debts page.

### 3. Mutable initial amount after repayments

**Risk:** Editing `initialAmountMinor` after payments breaks audit (“remaining” jumps).

**Prevention:** Treat initial as immutable after first repayment (or always immutable). Allow edit note/due/direction only; or force adjust via repayment/write-off.

**Phase:** Debt update actions.

### 4. Over-repayment / negative remaining

**Risk:** No validation → remaining < 0 or float confusion.

**Prevention:** Zod + domain: `amountMinor > 0` and `amountMinor <= remaining` before write. BigInt only.

**Phase:** Repayment actions + tests.

### 5. FX partial totals dishonest

**Risk:** Convert with missing rate as 0 or skip silently without banner.

**Prevention:** Same as NW: exclude + `isPartial` + Russian banner. Primary currency identity path (no FxRate row required).

**Phase:** Totals on `/debts`.

### 6. Unique (debtId, asOfDate) blocks two payments same day

**Risk:** Copying BalanceSnapshot unique constraint prevents realistic repayments.

**Prevention:** Allow multiple repayments per day; order by `asOfDate`, `id`.

**Phase:** Schema.

### 7. Early close without recording write-off

**Risk:** Status CLOSED while sum(repayments) < initial → history lies; reopen/recalc wrong.

**Prevention:** Persist `writeOffMinor` (or closing adjustment repayment with type WRITE_OFF). Series and remaining must include it.

**Phase:** Close action + series builder.

### 8. Cascade delete Person with history

**Risk:** Orphan or wipe audit trail.

**Prevention:** Restrict delete person if any debts; or soft-delete. Prefer Restrict like Account/BalanceSnapshot.

**Phase:** Person delete (if in scope).

### 9. Chart uses “today’s FX” for historical remaining in foreign currency

**Risk:** Remaining chart in primary would rewrite history; user asked remaining + repayment charts — keep **native currency** for debt detail chart; primary only for list totals as-of today.

**Prevention:** Detail charts in debt currency; hero totals primary as-of today only.

**Phase:** Charts.

### 10. Backdated repayment after close

**Risk:** Adding past payment to closed debt leaves status CLOSED with remaining > 0 if write-off not adjusted.

**Prevention:** Rules: reject repayments on CLOSED unless reopen; or recalculate write-off. Prefer reject + “reopen first”.

**Phase:** Repayment actions.

## Warning Signs in Review

- Import from `@/lib/debts` inside `net-worth.ts`
- IEEE number for money in debt forms
- Closing debt only flips status without writeOffMinor
- Totals without partial banner

## Confidence

**HIGH** — pitfalls map directly to locked product decisions (NW exclusion, same-currency pay, write-off close).
