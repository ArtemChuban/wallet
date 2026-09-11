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
