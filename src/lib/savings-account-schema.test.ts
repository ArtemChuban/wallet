import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schemaSrc = readFileSync("prisma/schema.prisma", "utf8");
const migrationSrc = readFileSync(
  "prisma/migrations/20260911161446_savings_account/migration.sql",
  "utf8",
);

/**
 * Phase 27 ACCT-01 / D-14 / D-15 — SAVINGS enum + dual Zod/CHECK honesty.
 */
describe("SAVINGS schema + Account_savings_rate_invariant (ACCT-01 / D-14 / D-15)", () => {
  it("prisma schema has SAVINGS enum and annualRateBps / accrualDayOfMonth", () => {
    expect(schemaSrc).toMatch(/SAVINGS/);
    expect(schemaSrc).toMatch(/annualRateBps/);
    expect(schemaSrc).toMatch(/accrualDayOfMonth/);
  });

  it("migration keeps credit + grace CHECKs and adds savings invariant (D-15)", () => {
    expect(migrationSrc).toMatch(/Account_savings_rate_invariant/);
    expect(migrationSrc).toMatch(/Account_credit_limit_invariant/);
    expect(migrationSrc).toMatch(/Account_grace_dom_invariant/);
  });

  it("savings CHECK ties rate+DOM to type SAVINGS (iff)", () => {
    expect(migrationSrc).toMatch(/type\s*=\s*'SAVINGS'/);
    expect(migrationSrc).toMatch(/annualRateBps/);
    expect(migrationSrc).toMatch(/accrualDayOfMonth/);
    expect(migrationSrc).toMatch(/BETWEEN\s+1\s+AND\s+31/i);
  });
});
