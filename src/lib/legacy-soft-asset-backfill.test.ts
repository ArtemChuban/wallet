import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
  "prisma/migrations/20260922140000_legacy_soft_asset_to_asset/migration.sql",
  "utf8",
);

describe("legacy soft-asset → ASSET backfill (debug asset-to-savings-type-readonly)", () => {
  it("UPDATE Account.type to ASSET for FIAT_DEBIT / CRYPTO / CASH only", () => {
    expect(migrationSql).toMatch(
      /UPDATE\s+"Account"\s+SET\s+"type"\s*=\s*'ASSET'/i,
    );
    expect(migrationSql).toMatch(/FIAT_DEBIT/);
    expect(migrationSql).toMatch(/CRYPTO/);
    expect(migrationSql).toMatch(/CASH/);
  });

  it("boundary: WHERE clause lists exactly the three soft-legacy asset aliases", () => {
    const whereMatch = migrationSql.match(
      /WHERE\s+"type"\s+IN\s*\(([^)]+)\)/i,
    );
    expect(whereMatch).not.toBeNull();
    const listed = whereMatch![1]
      .split(",")
      .map((s) => s.trim().replace(/'/g, ""));
    expect(listed.sort()).toEqual(["CASH", "CRYPTO", "FIAT_DEBIT"].sort());
    // Must not rewrite credit or savings rows
    expect(listed).not.toContain("FIAT_CREDIT");
    expect(listed).not.toContain("SAVINGS");
  });
});
