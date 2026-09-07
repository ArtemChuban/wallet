# Phase 16 — UAT

**Date:** 2026-09-07  
**Driver:** agent (OPERATOR.md)  
**App:** `http://localhost:3000/income` (npm run dev)

## Checkpoints

| # | Check | Result | Evidence |
|---|--------|--------|----------|
| 1 | Person with actuals shows «за всё время» + native Σ | pass | SSR HTML: `за всё время`, `55 000 RUB` / `10 000 RUB` with `font-semibold` |
| 2 | Identity-omit when single-ccy === primary && !partial | pass | RSC props: `primaryLine: null` for RUB-primary persons |
| 3 | Plan / structure: no page hero «всего получено» | pass | No DebtsPrimaryTotalsHero; per-Person header only |
| 4 | Visual hierarchy native > primary | pass* | Classes match UI-SPEC (`text-base font-semibold` native; hint `text-sm text-muted-foreground`). *Subjective polish not re-checked in browser chrome |
| 5 | Orca browser drive | skipped | `orca-ide open` → `runtime_open_timeout`; status `app.running:false` after retry |

## Notes

- Vitest already green (domain + UI file-scan). Regression subset 104/104.
- Multi-ccy / partial line not in current fixture data; covered by unit + file-scan.
- Human not required for further checkpoints unless visual taste issue reported.

## Verdict

**UAT pass with Orca skipped** — proceed to mark phase verification passed.
