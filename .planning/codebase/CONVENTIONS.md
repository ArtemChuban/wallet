# Coding Conventions

**Analysis Date:** 2026-09-05

## Operator / UAT

Agent-driven UAT is mandatory. Full rules: `.planning/OPERATOR.md`.

- Start app: `npm run dev`
- Drive UI: Orca built-in browser (`orca-ide` on Linux host / `orca` inside Orca)
- Ask human only for subjective judgment, true parallel races, or hard blockers
- Config pointers: `workflow.uat_driver=orca-cli`, `workflow.uat_operator_doc=.planning/OPERATOR.md`

## UI constitution

Never `window.confirm` for destructive actions — in-dialog second step with Russian copy (see PROJECT.md).
