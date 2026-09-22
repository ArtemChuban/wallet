-- Backfill soft-legacy asset aliases to canonical ASSET (QUICK-0i7 deferred rewrite).
-- Unlocks Phase 31 ASSET↔SAVINGS edit Select for originally-«Актив» rows.
-- FIAT_CREDIT unchanged. SAVINGS unchanged. CHECK invariants: non-credit, rate/DOM null.
UPDATE "Account"
SET "type" = 'ASSET'
WHERE "type" IN ('FIAT_DEBIT', 'CRYPTO', 'CASH');
