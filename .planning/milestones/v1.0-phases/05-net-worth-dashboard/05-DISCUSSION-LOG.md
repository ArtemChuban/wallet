# Phase 5: Net Worth Dashboard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-03
**Phase:** 5-net-worth-dashboard
**Areas discussed:** Dashboard placement, Headline NW layout, Incomplete data, Account list layout

---

## Dashboard placement

| Option | Description | Selected |
|--------|-------------|----------|
| Replace `/` | NW dashboard is home; remove «Готовность» nav (Phase 2 D-19) | ✓ |
| New `/dashboard` | Keep `/` as readiness; add separate nav link | |
| You decide | Planner picks best fit | |

**User's choice:** Replace `/`
**Notes:** Drop readiness page; DB errors on dashboard if broken. Nav label «Главная». Order: Главная → Валюты → Счета.

---

## Headline NW layout

| Option | Description | Selected |
|--------|-------------|----------|
| Single hero only | Big «Капитал: X RUB» | ✓ |
| Split only | Assets / liabilities, no combined headline | |
| Both | Hero total plus assets/liabilities lines | |

**User's choice:** Single hero only; label «Капитал»; currency code only (RUB); no as-of date on hero.
**Notes:** Assets/liabilities split deferred (NW-04 v2).

---

## Incomplete data

| Option | Description | Selected |
|--------|-------------|----------|
| Exclude no balance | Account without snapshot excluded from total | ✓ |
| Exclude no FX | Exclude from total; «—» + «нет курса» in primary column | ✓ |
| Partial + warning | Prominent warning when total is partial | ✓ |
| Empty CTA | No accounts → empty state + link to create on /accounts | ✓ |

**User's choice:** Exclude incomplete accounts from total; partial total with prominent warning; empty state with CTA.
**Notes:** Did not require «Задать курс» link for missing FX.

---

## Account list layout

| Option | Description | Selected |
|--------|-------------|----------|
| Flat list | All accounts in one list | ✓ |
| Columns | Name + native + primary | ✓ |
| Credit display | Native: available+debt; primary: debt only | ✓ |
| Read-only | No history expand or edit on dashboard | ✓ |

**User's choice:** Flat read-only list; native + primary columns; credit debt-only in primary column.

---

## Claude's Discretion

None explicitly requested — user chose concrete options throughout.

## Deferred Ideas

- Charts (Phase 6), NW-04 breakdown, dashboard history/edit, dedicated `/dashboard` route, FX deep link on missing rate
