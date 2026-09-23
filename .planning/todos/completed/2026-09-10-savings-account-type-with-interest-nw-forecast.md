---
audit_acknowledged:
  milestone: v1.5
  at: 2026-09-23
---

completed: 2026-09-22
---
created: 2026-09-10T12:35:00.000Z
title: Savings account type with interest NW forecast
area: general
severity: minor
resolves_phase: 27
files: []
captured_during: phase-23-discuss
audit_acknowledged:
  milestone: v1.4
  at: 2026-09-11
---

## Problem

Нужен новый вид счёта — сберегательный: можно указать процент и дату зачисления процента; прогноз должен отражаться на графике NW (Капитал «Прогноз»).

## Solution

TBD — новый account type (или флаг на существующем), поля rate + interest accrual date/schedule; вклад в dashed «Прогноз» overlay без переписывания historical LOCF. Отдельная фаза/milestone — не v1.4 MCP.
