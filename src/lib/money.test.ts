import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  RATE_SCALE_E8,
  formatMinorToMajor,
  parseMajorToMinor,
} from "./money";

/**
 * Wave 0 + Phase 02 money helpers (D-06 / CURR-01 adjacency).
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

describe("parseMajorToMinor / formatMinorToMajor", () => {
  it("round-trips scales 0, 2, 8, 18 without float", () => {
    const cases: Array<{ scale: number; major: string; minor: bigint }> = [
      { scale: 0, major: "42", minor: 42n },
      { scale: 2, major: "123.45", minor: 12345n },
      { scale: 2, major: "0.01", minor: 1n },
      { scale: 8, major: "1.00000001", minor: 100000001n },
      {
        scale: 18,
        major: "1.000000000000000001",
        minor: 1000000000000000001n,
      },
    ];

    for (const { scale, major, minor } of cases) {
      expect(parseMajorToMinor(major, scale)).toBe(minor);
      expect(formatMinorToMajor(minor, scale)).toBe(major);
    }
  });

  it("rejects scientific notation", () => {
    expect(() => parseMajorToMinor("1e2", 2)).toThrow();
    expect(() => parseMajorToMinor("1E-3", 8)).toThrow();
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
