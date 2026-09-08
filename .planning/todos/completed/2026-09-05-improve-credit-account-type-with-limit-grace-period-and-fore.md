completed: 2026-09-08
---
created: 2026-09-05T12:35:50.289Z
title: Improve credit account type (limit, grace period, statement-date forecasting)
area: general
severity: major
resolves_phase: 18
files: []
audit_acknowledged:
  milestone: v1.1
  at: 2026-09-06
---

## Fold note (Phase 18 / CONT-01)

Folded into **v1.3 Кредитка** / **Phase 18 CONT-01** (bank contract study + discuss locks). Intent absorbed by milestone requirements CONT-01…GRISO-01 and CONTEXT locks D-01…D-19 (dual DOM + A′ NW-neutral). Schema/UI land in Phases 19–21. File remains under `todos/completed/` — not pending.

## Problem

Сейчас у кредитной карты есть кредитный лимит, но не учитывается беспроцентный (льготный) период до определённой даты выписки: если потрачено N за расчётный месяц, эту сумму нужно вернуть к определённой дате, иначе начисляются проценты. Пользователь хочет видеть, сколько нужно будет оплатить до следующей даты выписки, и как капитал будет меняться в будущем с учётом этих дат/сумм (то есть элемент прогноза, а не только текущего состояния). Пользователь готов предоставить полный договор с банком по кредитке для полного контекста при планировании этой задачи.

## Solution

Absorbed by Phase 18 CONTEXT: dual DOM schedule (statement + due next month), one manual «Платёж для беспроцентного», A′ NW-neutral forecast overlay. Implementation = Phases 19–21.