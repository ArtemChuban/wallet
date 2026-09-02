# Pitfalls Research

**Domain:** Local single-user personal finance / multi-currency net-worth (balance snapshots + dated FX)
**Researched:** 2026-09-02
**Confidence:** MEDIUM

## Critical Pitfalls

### Pitfall 1: Applying today's FX rate to historical chart points

**What goes wrong:**
Net-worth history is recomputed by converting every past native balance with the *current* exchange rate. Charts swing when FX moves even if no account balance changed. Users see phantom gains/losses and lose trust in the trend line. Past "as of date D" totals silently rewrite when a new rate is entered today.

**Why it happens:**
Single "current rate" field feels simpler than a dated rate series. Conversion is done once at write time into primary currency and only that converted number is stored. Chart series is built from stored primary amounts instead of re-converting native balances per point.

**How to avoid:**
- Persist balances only in account native currency; never overwrite history with a converted amount.
- Persist FX as dated rates (effective from date, apply forward / LOCF).
- For any query or chart point at date `D`: convert with the latest rate where `rate.as_of <= D` (project rule: rates apply forward from their date).
- Never use "latest rate overall" for points earlier than that rate's `as_of`.
- Optionally expose a native-currency series so balance change and FX change stay separable.

**Warning signs:**
- Editing today's USDT→RUB rate changes last month's chart points.
- Primary-currency history moves on days with no balance snapshots.
- Two screens disagree for the same historical date after a rate update.

**Phase to address:**
Currency + dated-FX model (before charts). Verification belongs in history/charts phase with fixed fixtures (balance constant, rate changes → only post-rate points move).

---

### Pitfall 2: Floating-point money and rate arithmetic

**What goes wrong:**
Balances, sums, and FX conversions use `number`/`float`/`REAL`. Totals drift (`0.1 + 0.2` class errors), chart points wobble by kopecks, equality checks fail, and JSON round-trips reintroduce IEEE-754 doubles even when the DB used decimals.

**Why it happens:**
JS/TS defaults to IEEE-754. SQLite `REAL` is tempting. FX rates look like "just floats." Crypto (USDT) tempts high-precision floats instead of explicit scale.

**How to avoid:**
- Store money as integer minor units (`BIGINT`) **or** exact decimal (`TEXT` decimal / decimal library) — never `REAL`/`float` for amounts.
- Carry currency code + scale (do not hardcode "always 2 decimals"; allow per-currency exponent).
- Store FX rates as exact decimals with explicit scale (rates need more fractional digits than balances).
- Convert only at boundaries: display, chart series materialization, API responses as string or integer — not bare JSON numbers if clients might parse as float.
- Unit-test: sum of displayed parts equals total; round-trip amount survives DB + API.

**Warning signs:**
- Totals off by 0.01 after multi-account sum + FX.
- Same balance renders differently after save/reload.
- Tests need `toBeCloseTo` for money assertions.

**Phase to address:**
Schema / domain money types (foundation). Ban float money in first persistence PR.

---

### Pitfall 3: Credit-card limit / available credit treated as wealth (double-counting)

**What goes wrong:**
Net worth is inflated because credit **limit** or **available credit** is added as an asset, while outstanding **debt** is missing, half-applied, or also mishandled. Classic wrong mental model: "500k limit means +500k wealth." Correct model for this project: limit is metadata; **outstanding debt subtracts** from net worth; available credit = limit − debt is **not** an asset.

**Why it happens:**
UI stores limit + debt together; easy to sum both or show "available" in the asset total. Confusion between borrowing capacity and owned cash. Snapshot-only model has no purchase/payment ledger to force liability accounting.

**How to avoid:**
- Account type `credit`: fields `credit_limit` (informational) and `outstanding_debt` (liability).
- Net worth formula: `sum(debit/cash/crypto balances in primary) − sum(credit outstanding_debt in primary)`.
- Never add limit or (limit − debt) into assets.
- Paying the card in real life will appear as lower cash *and* lower debt on later snapshots — do not invent a "payment asset."
- UI copy (RU-first): label debt as долг / задолженность; limit as кредитный лимит (не капитал).

**Warning signs:**
- NW jumps by roughly the credit limit when a card account is created with debt = 0.
- Available credit appears on dashboard "assets" row.
- Fixture: limit 500k, debt 250k, cash 100k → NW must reflect cash − debt (not + limit).

**Phase to address:**
Accounts + net-worth calculation (as soon as credit type exists). Add golden fixture in that phase.

---

### Pitfall 4: Balance snapshot backdating with wrong as-of / LOCF semantics

**What goes wrong:**
Backdated snapshots overwrite "current" balance, insert into the wrong place in history, or use nearest-*future* rate/balance. Charts invent zeros before first snapshot, or a backdated correction silently changes only "today" while historical points stay wrong. System time (`recorded_at`) is confused with valid time (`as_of`).

**Why it happens:**
Single `balance` column per account instead of a snapshot series. `ORDER BY date` without defining "latest on or before D." Upsert by account id instead of `(account_id, as_of_date)`.

**How to avoid:**
- Model: append-only (or upsert-by-date) `balance_snapshots(account_id, as_of_date, amount_native, ...)`.
- As-of query for date `D`: `MAX(as_of_date) WHERE as_of_date <= D` per account (LOCF). If none → account contributes nothing / explicit gap — **not** 0 unless user entered 0.
- Backdating = insert/update snapshot at that `as_of_date`; all queries with `D >= that date` see it until a later snapshot.
- Keep `created_at` separate from `as_of_date`.
- Disallow or clearly handle multiple snapshots same calendar day (pick one rule: one per day, last write wins, or timestamp granularity).

**Warning signs:**
- Backdate to Jan 1 changes only the "current" card, not January chart segment.
- Chart shows 0 NW for months before first snapshot instead of "no data."
- Re-saving today's balance deletes yesterday's point.

**Phase to address:**
Balance snapshot domain (before charts). Charts phase only consumes the as-of API — does not invent its own date logic.

---

### Pitfall 5: SQLite in Docker — wrong mount path, WAL on bad FS, silent data loss

**What goes wrong:**
DB file lives in container writable layer → data vanishes on recreate. Volume mounted on wrong path → app still writes ephemeral DB. Bind mount on Docker Desktop/virtiofs/NFS with WAL → locking/`database disk image is malformed` corruption. Directory not writable → cannot create `-wal`/`-shm`/journal sidecars.

**Why it happens:**
Compose mounts `./data` while app writes `/app/prisma/dev.db` (or similar). WAL enabled by default without considering host FS. Desire to edit DB on host via bind mount on macOS/Windows Docker.

**How to avoid:**
- Single config for DB path; mount **that directory** (named volume preferred for reliability; bind mount OK on native Linux ext4/xfs if user wants host-visible file — document the tradeoff).
- Ensure process user can create sidecars in the DB directory.
- One writer connection model for this single-user app.
- On non-local FS (virtiofs/NFS/CIFS): use `journal_mode=DELETE` (rollback), not WAL — per sqlite.org WAL requirement that all processes share memory on one host.
- Smoke test: write balance → `docker compose down && up` → data still there.
- Backup story: copy DB file only after checkpoint / clean close (or use SQLite backup API).

**Warning signs:**
- Empty DB after rebuild.
- `disk I/O error` / `database is locked` / `malformed` on host-mounted path.
- `-wal`/`-shm` appear on host but main file not updating as expected.

**Phase to address:**
Docker + persistence foundation (first runnable milestone). Re-verify after any path or ORM change.

---

### Pitfall 6: Chart series mixes balance LOCF with mismatched FX policy

**What goes wrong:**
Each chart point uses correct LOCF balances but one global FX rate; or interpolates FX linearly between dates; or converts then interpolates balances in primary space. Result: smooth-looking lies — jumps on wrong days, or FX and balance changes inseparable.

**Why it happens:**
Chart libraries want a dense `{x, y}` array; developers precompute primary amounts once. Linear interpolation feels "nicer" than step functions. Rate gaps filled with "today" or average.

**How to avoid:**
- For each sample date `D` in the series: LOCF balances at `D`, LOCF FX at `D`, convert, then plot (step/hold, not linear interpolate across FX).
- Sample dates = union of balance snapshot dates and FX rate dates (plus range endpoints) — or daily calendar if desired, still LOCF.
- Missing FX before first rate: omit conversion / show gap / block with "set rate" — do not invent 1:1 or today's rate.
- Document: primary-currency chart = translation view; native chart = local balance truth.

**Warning signs:**
- Dense daily chart moves smoothly between monthly snapshots without step holds.
- Adding an FX rate mid-range reshapes the entire curve, not only from that date forward.
- No fixture test: flat native USDT + step FX change ⇒ primary series is piecewise constant with a single jump on rate date.

**Phase to address:**
History/charts phase, with domain as-of helpers already frozen.

---

### Pitfall 7: Inconsistent FX pair direction / primary-only model drift

**What goes wrong:**
Rates stored as `USDT per RUB` in one place and `RUB per USDT` in another; inversion bugs flip NW by orders of magnitude. Or code starts storing arbitrary cross pairs while product is primary↔other only, then charts pick the wrong edge.

**Why it happens:**
UI label "курс" ambiguous. Copy-paste from bank apps that quote the inverse. No single canonical representation in schema.

**How to avoid:**
- Schema: one canonical form, e.g. `rate = primary_units per 1 unit of other` (document in UI).
- All conversions go through one function `toPrimary(amount, currency, asOf)`.
- Reject or ignore non-primary pairs in v1.
- Property test: convert to primary and (if ever) back within documented rounding.

**Warning signs:**
- USDT balance of ~100 displays as millions or fractions of RUB after a "rate update."
- Two rate entry screens disagree on which side is "1."

**Phase to address:**
Dated-FX phase; lock conversion helper before any chart work.

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store only converted primary balance | Simpler schema | History corrupts on FX edits; cannot show native | Never for this product |
| Single "current rate" row | Fast MVP | No as-of charts | Never if historical charts are in scope |
| `number` for money in TS | Less typing | Silent drift, bad tests | Never for persisted amounts |
| Soft-delete snapshots by overwriting one row | Less UI | No real history | Never |
| Bind-mount DB on Docker Desktop for "easy files" | Host visibility | WAL corruption risk | Only with DELETE journal + docs; prefer named volume or Linux bind |
| Linear interpolate chart gaps | Pretty line | False continuous wealth | Prefer step/LOCF; polish later if needed |
| Credit limit in asset sum "for motivation" | Feels rich | Lies about NW | Never |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Manual FX entry | One rate, no date | Dated rate; effective forward from `as_of` |
| Future auto FX API (out of scope v1) | Overwrite manual history | Insert dated observations; never rewrite past points |
| Docker volume | Mount repo root or wrong subpath | Mount exact DB directory; path from one env var |
| SQLite WAL | Enable always | Local FS only; otherwise DELETE journal |
| Chart library | Feed pre-converted volatile series | Feed per-date computed points from domain layer |
| GnuCash/Firefly lessons | Assume "nearest" price = "on or before" | Explicitly choose **latest on or before** `D` (matches product language) |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Recompute all history from scratch on every paint with nested loops | UI lag on dashboard | Index `(account_id, as_of_date)`, `(currency, as_of_date)`; compute series in one pass | Hundreds of snapshots × currencies — still fine if indexed; worry only if daily spam for decades |
| Dense daily points for 10y without need | Huge payloads | Sample at event dates (snapshots ∪ rates) | Mobile chart with 3650 points unnecessary |
| Opening many SQLite connections in serverless/multi-process | Locks / corruption | Single long-lived process writer for Docker app | Second container sharing same file |

At single-user personal scale, correctness dominates performance — do not skip LOCF correctness for speed.

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing Docker port beyond localhost | Anyone on LAN reads finances | Bind `127.0.0.1` only unless user opts in |
| World-readable DB on host bind mount | Other OS users read balances | Restrict directory permissions (e.g. `0700`) |
| Shipping sample/demo DB in image | Accidental "reset" to demo on volume miss | Empty volume + migrate on start; no baked personal data |
| Logging full balances to stdout | Leaks in shared logs | Log counts/ids, not amounts, in default config |

(No multi-user auth in v1 — keep threat model local.)

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Rate edit without saying which dates change | Panic when history moves | Confirm: "Applies from DATE forward" |
| Backdate control hidden | Wrong history forever | Explicit "as of date" on every balance save (default today) |
| Showing limit as big positive number near NW | Thinks richer than is | Separate "Лимит" vs "Долг" vs "Капитал" |
| Chart gap shown as zero | False "went bankrupt" | Empty state / break in line / "нет данных" |
| Primary vs native toggle unclear | Misread FX noise as spending | Dual series or clear subtitle "в RUB по курсу на дату" |

## "Looks Done But Isn't" Checklist

- [ ] **Dated FX:** Chart point at past date uses rate `as_of <= D`, not latest rate — verify with fixture where only FX changes
- [ ] **Native storage:** DB holds native amounts; primary is computed — verify column types / no sole `amount_primary` history table
- [ ] **Money type:** No float in schema or domain math — verify migrations + unit tests without `toBeCloseTo` for money
- [ ] **Credit NW:** Limit excluded from assets; debt subtracted — verify golden NW fixture
- [ ] **Snapshot LOCF:** Backdated snapshot affects `D >= as_of` only — verify three-date fixture
- [ ] **Docker persist:** Data survives `compose down/up` and image rebuild — verify mounted path equals app DB dir
- [ ] **WAL/FS policy:** Documented journal mode for bind mounts — verify README + compose comments
- [ ] **Gap handling:** No silent zero before first snapshot / before first FX — verify empty chart semantics
- [ ] **Pair direction:** One conversion helper; UI labels match schema — verify inverse-rate test
- [ ] **Same-day snapshots/rates:** Defined uniqueness rule — verify second write same day

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| History rewritten by current FX | HIGH if only primary stored | If natives kept: rebuild series. If only primary: history unrecoverable — restore backup |
| Float corruption in DB | MEDIUM | Migrate to integer/decimal; re-enter suspicious balances |
| Credit limit in NW | LOW | Fix formula; no data migration if limit stored separately |
| Wrong snapshot semantics | MEDIUM | Migrate to snapshot table; user may re-enter history |
| Docker data loss | HIGH | Restore from host backup/copy; fix mount; add smoke test |
| WAL corruption on virtiofs | HIGH | Restore backup; switch to named volume or DELETE journal; `PRAGMA integrity_check` |
| Inverted FX | LOW–MEDIUM | Fix helper; re-save rates; recount charts |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Float money | Foundation / schema | Migration types + money round-trip tests |
| Docker SQLite volume / WAL | Foundation / Docker | Persist smoke test; integrity_check; docs for bind mounts |
| Snapshot LOCF + backdating | Balance snapshots | Three-date backdate fixture |
| Credit limit vs debt NW | Accounts + net worth | Golden: cash − debt, limit ignored |
| Dated FX forward application | Currencies + FX | Rate change moves only points on/after rate date |
| FX pair direction | Currencies + FX | Inverse-rate property / UI label check |
| Chart FX×balance composition | History / charts | Flat native + step FX fixture; no full-curve rewrite |
| Gap vs zero UX | History / charts + UI polish | Empty-state screenshot / assertion |
| Localhost exposure / DB perms | Docker harden / ship | Compose binds 127.0.0.1; dir mode check |

Suggested ordering rationale: **persist money correctly → snapshot as-of → credit NW → dated FX → charts**. Charts last so they cannot invent a second FX policy.

## Sources

- SQLite WAL documentation — network FS / shared-memory requirement ([sqlite.org/wal.html](https://www.sqlite.org/wal.html)) — **MEDIUM** (official docs; cross-checked with field reports)
- OpenClaw / Sonarr issues — WAL + Docker Desktop/virtiofs/CIFS corruption ([openclaw#120549](https://github.com/openclaw/openclaw/issues/120549), [Sonarr#1886](https://github.com/Sonarr/Sonarr/issues/1886)) — **MEDIUM** (cross-checked with sqlite.org)
- Docker persistence workshop — volume must cover DB path ([docs.docker.com](https://docs.docker.com/get-started/workshop/05_persisting_data/)) — **MEDIUM**
- PortfolioPilot / TrackWorth / MyMoneyViz / Freenance — FX rewriting history vs native + time-stamped conversion — **MEDIUM** (independent product writeups agree; not academic)
- Fintech Engineering Handbook / money representation articles — no float money; minor units or decimal — **MEDIUM**
- Stitch Money / SwitchWize / LegalClarity — credit limit ≠ asset; outstanding balance = liability — **MEDIUM**
- GnuCash Price Editor / pricedb — one price per day; report price sources latest / nearest / nearest-before — **MEDIUM** (official docs)
- Firefly III docs/issues — foreign amount vs primary budget conversion gaps — **MEDIUM** (official + maintainer statements; budgets out of Wallet v1 scope but FX-display lesson applies)
- Blnk Finance — snapshot + as-of reconstruction patterns — **LOW–MEDIUM** (useful analogy; Wallet has snapshots without intervening transactions)

**Overall confidence:** MEDIUM — critical claims cross-checked across official docs (SQLite, GnuCash) and multiple independent finance-tracking sources; no Context7 library docs required for this pitfalls-only dimension. Phase-level research should re-verify journal-mode choice against the chosen Docker host OS when implementing.

---
*Pitfalls research for: local multi-currency net-worth (balance snapshots + dated FX)*
*Researched: 2026-09-02*
