# Phase 17 — UAT

**Date:** 2026-09-07  
**Driver:** agent (Orca browser) + localhost:3000

## Checkpoints

| # | Check | Result | Notes |
|---|--------|--------|-------|
| 1 | `/` loads Капитал | pass | NW 924 155.55 RUB |
| 2 | 30д: no «Прогноз» when no open slots in horizon | pass | Sep 15 filled; Oct 15 outside 30d → hide series (D-08) |
| 3 | 90д: legend «Прогноз» + future axis | pass | Axis → 06.12.2026; ticks 15.10 / 15.11 |
| 4 | Partial banner «Прогноз неполный» | skipped | No missing-FX fixture in current DB |
| 5 | Tooltip split fact/forecast | skipped | AX snapshot doesn't expose recharts tooltip hover well |

## Summary

Automated + Orca smoke: forecast overlay appears when horizon contains open recurring slots; hidden on 30д when none. Human optional for tooltip hover / FX partial chrome with crafted data.

**Overall:** pass (core FCST visual path)
