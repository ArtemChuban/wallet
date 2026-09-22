---
status: complete
---

# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## docker-build-zod-ts2345 — Zod 4 TS2345: $ZodIssue forwarded into ctx.addIssue
- **Date:** 2026-09-11
- **Error patterns:** TS2345, $ZodIssue, ctx.addIssue, Failed to type check, docker build, income.ts, invalid_type
- **Root cause(s):** income.ts forwarded ZodError `$ZodIssue` into `ctx.addIssue` (Zod 4 expects `string | $ZodSuperRefineIssue`); nested safeParse of `optionalIncomeRangeSchema` was redundant
- **Fix:** use `optionalIncomeRangeSchema` directly as `inputSchema`; drop nested superRefine/issue forward; add regression test
- **Files changed:** src/lib/mcp/tools/income.ts, src/lib/mcp/tools/income.test.ts
- **Why not caught:** typecheck gate existed (`tsc` / `next build`) but no regression guard against `$ZodIssue`→`addIssue` forwarding; pattern introduced without sibling-tool consistency check
- **Recurrence guard:** regression test `src/lib/mcp/tools/income.test.ts`: `list_income uses optionalIncomeRangeSchema as inputSchema (no $ZodIssue→addIssue forward)`
---

## asset-to-savings-type-readonly — Asset-labeled accounts stay type-readonly until ASSET backfill
- **Date:** 2026-09-22
- **Error patterns:** Актив, Сберегательный, type readonly, Изменить, canConvertType, FIAT_DEBIT, soft-legacy, ASSET, SAVINGS
- **Root cause(s):** QUICK-0i7 soft-compat left FIAT_DEBIT/CRYPTO/CASH rows labeled «Актив»; Phase 31 canConvertType unlocks only exact ASSET|SAVINGS
- **Fix:** Prisma migration backfill FIAT_DEBIT|CRYPTO|CASH → ASSET; regression source-scan test
- **Files changed:** prisma/migrations/20260922140000_legacy_soft_asset_to_asset/migration.sql, src/lib/legacy-soft-asset-backfill.test.ts
- **Why not caught:** no gate existed for this class — Phase 31 UAT seeded only canonical ASSET rows; soft-legacy labeled-Актив path never verified for conversion unlock
- **Recurrence guard:** migration `prisma/migrations/20260922140000_legacy_soft_asset_to_asset/migration.sql` + regression test `src/lib/legacy-soft-asset-backfill.test.ts`
---
