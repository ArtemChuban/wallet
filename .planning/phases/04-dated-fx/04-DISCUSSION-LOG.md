# Phase 4: Dated FX - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-03
**Phase:** 4-Dated FX
**Areas discussed:** Где жить FX UI, Как вводить курс, Список и история, Нет курса на дату

---

## Где жить FX UI

### Q1 — Where does FX UI live?

| Option | Description | Selected |
|--------|-------------|----------|
| Separate `/fx` + nav «Курсы» | Top-level page like Валюты/Счета | |
| Inside «Валюты» | Nested under currencies | ✓ |
| You decide | Agent chooses | |

**User's choice:** Inside «Валюты»

### Q2 — How on currencies page?

| Option | Description | Selected |
|--------|-------------|----------|
| Section below currency list | Single scroll | |
| Tabs «Валюты» \| «Курсы» | Two modes | ✓ |
| Expand per non-primary currency | History in currency row | |
| You decide | Agent chooses | |

**User's choice:** Tabs

### Q3 — Default tab

| Option | Description | Selected |
|--------|-------------|----------|
| Валюты | Familiar list first | |
| Курсы | Rates-first | ✓ |
| Remember last | localStorage | |
| You decide | Agent chooses | |

**User's choice:** Курсы

### Q4 — Tab URL shape

| Option | Description | Selected |
|--------|-------------|----------|
| Query `?tab=` | `/currencies?tab=rates` | |
| Path | `/currencies/rates` + `/currencies` | ✓ |
| Client state only | No URL | |
| You decide | Agent chooses | |

**User's choice:** Path `/currencies/rates`

---

## Как вводить курс

### Q1 — Direction UI

| Option | Description | Selected |
|--------|-------------|----------|
| Only «1 other = N primary» | Matches stub | |
| Only «1 primary = N other» | Inverse; convert on save | |
| Direction toggle | UI both ways; DB always rateToPrimary | ✓ |
| You decide | Agent chooses | |

**User's choice:** Toggle

### Q2 — Default direction

| Option | Description | Selected |
|--------|-------------|----------|
| «1 other = N primary» | Matches storage | ✓ |
| «1 primary = N other» | Bank-style inverse | |
| Remember last | localStorage | |
| You decide | Agent chooses | |

**User's choice:** «1 other = N primary»

### Q3 — Which other currencies in picker

| Option | Description | Selected |
|--------|-------------|----------|
| All non-primary | Even without accounts | ✓ |
| Only currencies with ≥1 account | Less noise | |
| You decide | Agent chooses | |

**Notes:** User asked for clarification; explained picker lists the “other” side of primary↔other.

**User's choice:** All non-primary

### Q4 — Date default / future

| Option | Description | Selected |
|--------|-------------|----------|
| Today Europe/Moscow; no future | Mirror Phase 3 | ✓ |
| Today; future allowed | Pre-set rates | |
| No default | User must type date | |
| You decide | Agent chooses | |

**User's choice:** Today Moscow; no future

---

## Список и история

### Q1 — List shape

| Option | Description | Selected |
|--------|-------------|----------|
| Per-currency rows + expand history | Like accounts/balances | ✓ |
| One chronological list | All rate rows | |
| Pair cards without expand | History in Dialog/Sheet | |
| You decide | Agent chooses | |

**User's choice:** Per-currency + expand

### Q2 — Same date same pair

| Option | Description | Selected |
|--------|-------------|----------|
| Upsert overwrite | One rate per (currency, date) | ✓ |
| Reject duplicate | Error; edit via history | |
| You decide | Agent chooses | |

**User's choice:** Upsert overwrite

### Q3 — Where delete

| Option | Description | Selected |
|--------|-------------|----------|
| History expand only | Mirror Phase 3 D-11 | ✓ |
| History + Dialog | Also when editing date | |
| No delete in v1 | Overwrite only | |
| You decide | Agent chooses | |

**User's choice:** History only

### Q4 — No rates yet

| Option | Description | Selected |
|--------|-------------|----------|
| «Нет курса» + set action | Explicit empty | ✓ |
| Hide row until first rate | Add via button only | |
| You decide | Agent chooses | |

**User's choice:** «Нет курса» + set

---

## Нет курса на дату

### Q1 — Missing LOCF return

| Option | Description | Selected |
|--------|-------------|----------|
| `null` | Like balance before first snapshot | ✓ |
| Throw error | Hard fail convert | |
| Identity / invent 1 | Unsafe for other FX | |
| You decide | Agent chooses | |

**User's choice:** `null`

### Q2 — Primary → primary

| Option | Description | Selected |
|--------|-------------|----------|
| Always ×1, no FX row | Primary has no self-rate | ✓ |
| Also via FX table | Uniform but odd | |
| You decide | Agent chooses | |

**User's choice:** Identity ×1

### Q3 — Convert preview UI in Phase 4

| Option | Description | Selected |
|--------|-------------|----------|
| CRUD + helper only | Amount UI in Phase 5 | ✓ |
| Mini preview calculator on rates tab | Prove convert in UI | |
| You decide | Agent chooses | |

**Notes:** User asked for clarification; explained difference between storing rates vs showing N USDT → M RUB calculator.

**User's choice:** CRUD + helper only

### Q4 — Rate value constraints

| Option | Description | Selected |
|--------|-------------|----------|
| Only > 0 | Reject zero/negative | ✓ |
| ≥ 0 | Zero allowed | |
| You decide | Agent chooses | |

**User's choice:** > 0 only

---

## Claude's Discretion

None selected as “You decide” — all questions got explicit user picks. Discretion left for Prisma naming, Zod/actions copy details, expand affordance, rate parse helpers placement (noted in CONTEXT.md).

## Deferred Ideas

- FX-03 API fetch (v2)
- Convert preview / NW UI (Phase 5)
- Charts (Phase 6)
- Live FX / non-primary pairs (out of scope)
