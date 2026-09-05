# Operator Preferences

Cross-runtime agent instructions (Cursor, Claude Code, Codex, Orca). Read on `/gsd-verify-work` and any human-facing UAT.

## UAT / verify-work

**Default: agent-driven UAT. Do not quiz the human through checkpoints.**

1. Start app yourself: `npm run dev` (or reuse already-running `:3000`).
2. Drive UI with **Orca built-in browser** via `orca-ide` (Linux host) / `orca` (inside Orca terminal):
   - `skills get orca-cli` if command surface unknown
   - Prefer `http://localhost:3000/...` — `127.0.0.1` can fail Next.js client hydration in Orca’s browser
   - `tab create --url <url> --json`, then `snapshot` / `click` / `fill` / `screenshot`
3. Mark each UAT checkpoint pass / issue / blocked / skipped in `{phase}-UAT.md` from what you observe.
4. Ask the human **only** when help is truly required:
   - Subjective judgment (visual taste, copy tone)
   - True multi-user / parallel-tab races you cannot safely simulate alone
   - Secrets, physical device, or external accounts you do not have
   - App will not start / Orca browser host unavailable after you tried

Do **not** present one-test-at-a-time conversational UAT when Orca browser + local dev are available. Self-run the suite, then report the summary (and only the blockers that need a human).

## CLI note

On Linux outside an Orca-managed terminal, use `orca-ide` — bare `orca` may be GNOME Orca screen reader.

---
*Added 2026-09-05 — agent-driven UAT via Orca browser*
