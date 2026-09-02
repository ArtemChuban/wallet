import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { RATE_SCALE_E8 } from "./money";

/**
 * Wave 0 RED tests (Plan 01).
 * GREEN when Plan 03 lands src/lib/money.ts and prisma/schema.prisma.
 *
 * Schema conventions (D-07–D-09):
 * - Money and FX rate columns are BigInt (SQLite INTEGER), never Float/REAL
 * - Currency.scale is required (no DB default)
 * - FX rates use RATE_SCALE_E8 = 10^8
 */
describe("money conventions", () => {
  it("exports RATE_SCALE_E8 as 100000000n", () => {
    expect(RATE_SCALE_E8).toBe(100000000n);
  });
});

describe("schema conventions", () => {
  it("locks BigInt money/rate fields and required Currency.scale", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    expect(schema).toMatch(/amountMinor\s+BigInt/);
    expect(schema).toMatch(/rateToPrimaryScaled\s+BigInt/);
    expect(schema).toMatch(/scale\s+Int/);
    expect(schema).not.toMatch(/\bFloat\b/);
    expect(schema).not.toMatch(/\bDecimal\b/);
  });
});
