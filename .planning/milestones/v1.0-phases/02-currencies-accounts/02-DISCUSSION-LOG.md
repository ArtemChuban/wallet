# Phase 2: Currencies + Accounts - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-02
**Phase:** 2-Currencies + Accounts
**Areas discussed:** Primary currency rules, Currency create & identity, Credit fields in Phase 2, Accounts ↔ currency binding, UI / nav shape

---

## Primary currency rules

| Option | Description | Selected |
|--------|-------------|----------|
| Flag on Currency | boolean isPrimary; enforce exactly one | |
| App setting row | separate primaryCurrencyCode config | |
| Seed in migration + edit from app | User freeform | ✓ (then revised edits) |
| No switch in v1 | Seeded primary stays primary | ✓ |
| Allow promote another | Switch primary later | |
| Seed RUB / Рубль / scale 2 | | ✓ |
| Never delete primary | | ✓ |

**User's choice:** Seed primary in migration; no switch; never delete primary. Initially wanted editable name/code/scale; later revised to **name only** (aligned with all currencies).
**Notes:** Seed values locked as RUB / Рубль / scale 2.

---

## Currency create & identity

| Option | Description | Selected |
|--------|-------------|----------|
| Free short string codes | uniqueness only | ✓ |
| Uppercase 3–8 guard | | |
| Strict ISO-4217 | | |
| Scale picker 0/2/8 | | |
| Free integer 0–18 | | ✓ |
| Always editable after create | | |
| Editable until first balance | | |
| Name only after create | code+scale locked | ✓ |
| Block delete if accounts use | | |
| No currency delete at all | User freeform | ✓ |

**User's choice:** Free codes; scale 0–18; name-only edit; no delete for any currency. Primary also name-only (not code/scale).
**Notes:** «нельзя удалять валюты»; «основную тоже не меняем тогда, только название».

---

## Credit fields in Phase 2

| Option | Description | Selected |
|--------|-------------|----------|
| Limit only now; debt via Phase 3 balances | | ✓ |
| Limit + currentDebt on Account now | | |
| Limit + debt forever on Account | | |
| Limit required > 0 | | ✓ |
| Limit optional | | |
| Change limit anytime | | |
| Dated limit history | | |
| Limit locked after create | User: нельзя менять пока; future maybe | ✓ |
| Type locked after create | | ✓ |
| Allow type change | | |

**User's choice:** Option 1 debt model; required limit > 0; immutable limit + type in v1.
**Notes:** Detailed Russian explanation requested before choosing debt placement.

---

## Accounts ↔ currency binding

| Option | Description | Selected |
|--------|-------------|----------|
| Currency required, locked forever | | ✓ |
| Editable until first balance | | |
| Always editable currency | | |
| Hard delete accounts | | |
| No delete in v1 | | ✓ |
| Delete if empty | | |
| Name only editable | | ✓ |
| Name + notes | | |
| Globally unique names | | ✓ |
| Allow duplicate names | | |

**User's choice:** Locked currency; no account delete; name-only edit; unique names.
**Notes:** Archive deferred (ACCT-04).

---

## UI / nav shape

| Option | Description | Selected |
|--------|-------------|----------|
| `/currencies` + `/accounts` routes | | ✓ |
| Settings hub | | |
| Accounts main, currencies nested | | |
| Separate create/edit pages | | |
| List + Dialog/Sheet | | ✓ |
| Keep ready home + nav links | | ✓ |
| Redirect `/` → `/accounts` | | |
| Home as hub cards | | |
| All Russian UI | + Latin codes RUB/USDT | ✓ |

**User's choice:** Two routes; Dialog/Sheet; keep ready page; full Russian chrome with Latin currency codes.
**Notes:** «1, но коды используем RUB, USDT».

---

## Claude's Discretion

- Dialog vs Sheet, nav chrome details, Prisma enum/field naming, primary representation, credit-limit money input helpers.

## Deferred Ideas

- Editable credit limit after create (possibly dated)
- Account archive (ACCT-04)
- Primary switch
- Currency/account delete
- Available credit display (Phase 5)
- NW dashboard replacing home (Phase 5)
