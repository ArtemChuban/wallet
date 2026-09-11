<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:wallet-operator -->

# Operator prefs (GSD)

Before `/gsd-verify-work` or any UAT: read `.planning/OPERATOR.md`.
Agent drives app (`npm run dev`) + Orca browser (`orca-ide` / `orca`). Ask human only for subjective judgment, true parallel races, or hard blockers.

<!-- END:wallet-operator -->

<!-- BEGIN:wallet-mcp-parity -->

# MCP parity (PARITY-01)

Any new user-visible read surface must ship matching read-only MCP tool(s) in the same milestone/phase — agents stay at UI parity. See `.planning/PROJECT.md` Constraints.

<!-- END:wallet-mcp-parity -->
