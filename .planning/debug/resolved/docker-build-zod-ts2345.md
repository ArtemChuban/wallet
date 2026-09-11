---
status: resolved
trigger: |
  docker build -t wallet-web . fails at builder stage:
  RUN npx prisma generate && npm run build
  TypeScript error TS2345 in src/lib/mcp/tools/income.ts(30,28):
  Argument of type '$ZodIssue' is not assignable to parameter of type 'string | { ... code: "invalid_type" ... }'
  Index signature for type 'string' is missing in type '$ZodIssueInvalidType<unknown>'.
  Prisma generate succeeded (openssl warn only); next build compiled then failed typecheck.
created: 2026-09-11
updated: 2026-09-11T14:02:00+02:00
symptoms_prefilled: true
goal: find_and_fix
---

# Debug Session: docker-build-zod-ts2345

## Symptoms

- **Expected:** `docker build -t wallet-web .` completes successfully (image builds).
- **Actual:** Build fails at Dockerfile builder step `npx prisma generate && npm run build` with exit code 1 after TypeScript typecheck.
- **Errors:**
  - `src/lib/mcp/tools/income.ts(30,28): error TS2345: Argument of type '$ZodIssue' is not assignable...`
  - Prisma openssl detection warnings (non-fatal; generate succeeded).
  - `Failed to type check.`
- **Timeline:** Observed during `docker build -t wallet-web .` on main. Whether local `npm run build` also fails unknown from report.
- **Reproduction:** `docker build -t wallet-web .` from repo root.

## Current Focus

hypothesis: CONFIRMED — $ZodIssue forwarded into ctx.addIssue (Zod 4 expects $ZodSuperRefineIssue)
test: done — human confirmed fixed
expecting: archive session
next_action: archived to resolved/
bug_class: Bohrbug

## Evidence

- timestamp: 2026-09-11T13:54
  checked: knowledge-base.md
  found: file absent — no prior pattern match
  implication: open investigation

- timestamp: 2026-09-11T13:54
  checked: src/lib/mcp/tools/income.ts:26-32
  found: superRefine safeParse(optionalIncomeRangeSchema) then ctx.addIssue(issue) for each ZodError issue
  implication: only site forwarding $ZodIssue into addIssue

- timestamp: 2026-09-11T13:54
  checked: local npx tsc --noEmit
  found: same TS2345 at income.ts(30,28); zod package version 4.5.4
  implication: not docker-only; deterministic Bohrbug in typecheck

- timestamp: 2026-09-11T13:55
  checked: zod v4 RefinementCtx + sibling MCP tools
  found: addIssue expects $ZodSuperRefineIssue; forecast/etc use shared schemas as fields; optionalIncomeRangeSchema already has the paired refine
  implication: nested re-wrap is redundant and type-illegal; direct schema use is correct fix

- timestamp: 2026-09-11T13:55
  checked: common-bug-patterns Type/Coercion + Data Shape
  found: closest match is API contract mismatch (Zod 4 issue input vs output types)
  implication: pattern = wrong type passed to library API

- timestamp: 2026-09-11T13:57
  checked: fix + guardrail
  found: tsc exit 0 after fix; vitest as-of+income PASS(16); stash revert restores TS2345; stash pop clears it; no Stryker
  implication: fix accepted by applicable guardrail signals

- timestamp: 2026-09-11T14:02
  checked: human-verify checkpoint
  found: user response "confirmed fixed"
  implication: end-to-end confirmation; archive session

## Eliminated

- hypothesis: docker/openssl/prisma env-only failure
  evidence: identical TS2345 on local tsc with same zod@4.5.4; prisma generate already succeeded in report
  timestamp: 2026-09-11T13:54

- hypothesis: optionalIncomeRangeSchema itself broken
  evidence: as-of.ts uses ctx.addIssue({ code: "custom", ... }) correctly; as-of.test.ts covers schema; tsc only fails income.ts forward site
  timestamp: 2026-09-11T13:55

## Resolution

- **root_cause:** income.ts forwarded ZodError `$ZodIssue` into `ctx.addIssue` (Zod 4 expects `string | $ZodSuperRefineIssue`); `$ZodIssue` not assignable → TS2345. Nested safeParse of `optionalIncomeRangeSchema` was redundant.
- **fix:** `inputSchema: optionalIncomeRangeSchema` directly; drop nested superRefine/issue forward; regression test guards pattern.
- **oracle_type:** specified (Zod 4 / MCP inputSchema contract)
- **files_changed:**
  - src/lib/mcp/tools/income.ts
  - src/lib/mcp/tools/income.test.ts
- **verification:**
  ```yaml
  target_test: { result: pass, detail: "tsc --noEmit clean; income.test zod-forward guard + as-of/income vitest 16 pass" }
  mutation_check: { result: skipped, reason_if_skipped: "no Stryker in package.json", mutant_killed: n/a }
  no_op_deletion: { result: pass, deletion_justified_by_rca: true, note: "removed redundant illegal issue-forward; validation stays in optionalIncomeRangeSchema" }
  adjacent_tests: { result: pass, detail: "src/lib/mcp/as-of.test.ts + income.test.ts" }
  revert_reconfirm: { result: pass, detail: "stash revert → TS2345 returns; stash pop → tsc clean" }
  guardrail_verdict: accepted
  human_verify: { result: confirmed_fixed, timestamp: "2026-09-11T14:02:00+02:00" }
  ```

## Prevention

- **5-Whys (branched):**
  - code: nested superRefine re-parsed optionalIncomeRangeSchema and forwarded `$ZodIssue` into `ctx.addIssue` → Zod 4 type rejects `$ZodIssue` (expects `$ZodSuperRefineIssue`) → TS2345 blocks `next build`.
  - config/env: docker `npm run build` runs full typecheck; local/dev may skip or mask until image build — same code/types, so not env-only.
  - AND-gate: no — single code defect sufficient; docker only surfaces via CI-like typecheck.
- **why_not_caught:** typecheck gate existed (`tsc` / `next build`) and would catch it, but no regression guard against `$ZodIssue`→`addIssue` forwarding; pattern introduced without sibling-tool consistency check.
- **recurrence_guard:** `src/lib/mcp/tools/income.test.ts` — `list_income uses optionalIncomeRangeSchema as inputSchema (no $ZodIssue→addIssue forward)` asserts direct schema + `not.toMatch(/ctx\.addIssue\(\s*issue\s*\)/)`.
