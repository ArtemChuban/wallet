import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  RATE_SCALE_E8,
  formatChartNumber,
  formatMajorForDisplay,
  formatMinorToMajor,
  formatMinorToMajorExact,
  formatRateScaled,
  invertRateScaled,
  parseMajorToMinor,
  parseRateToScaled,
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
      expect(parseMajorToMinor(formatMinorToMajor(minor, scale), scale)).toBe(
        minor,
      );
      expect(formatMinorToMajorExact(minor, scale).includes(" ")).toBe(false);
    }
  });

  it("rejects scientific notation", () => {
    expect(() => parseMajorToMinor("1e2", 2)).toThrow();
    expect(() => parseMajorToMinor("1E-3", 8)).toThrow();
  });

  it("strips trailing frac zeros and groups thousands for display", () => {
    expect(formatMinorToMajor(6000n, 8)).toBe("0.00006");
    expect(formatMinorToMajor(90_00000000n, 8)).toBe("90");
    expect(formatMinorToMajor(123_456_789_12n, 2)).toBe("123 456 789.12");
    expect(formatMinorToMajor(-1_234_50n, 2)).toBe("-1 234.5");
    expect(formatMinorToMajor(1_000_000n, 0)).toBe("1 000 000");
    expect(formatMajorForDisplay("123456.789123")).toBe("123 456.789123");
    expect(formatMajorForDisplay("0.0006000")).toBe("0.0006");
  });

  it("parseMajorToMinor accepts display grouping spaces", () => {
    expect(parseMajorToMinor("123 456.789123", 6)).toBe(123_456_789_123n);
    expect(parseMajorToMinor("1\u00A0234.5", 1)).toBe(12345n);
  });
});

describe("formatChartNumber", () => {
  it("groups thousands and strips trailing zeros", () => {
    expect(formatChartNumber(123456.789123)).toBe("123 456.789123");
    expect(formatChartNumber(0.0006)).toBe("0.0006");
    expect(formatChartNumber(90)).toBe("90");
    expect(formatChartNumber(0)).toBe("0");
  });
});

describe("parseRateToScaled / formatRateScaled / invertRateScaled", () => {
  it("round-trips rate at scale 8", () => {
    const scaled = parseRateToScaled("90.00");
    expect(scaled).toBe(90_00000000n);
    expect(formatRateScaled(scaled)).toBe("90");
    expect(formatMinorToMajorExact(scaled, 8)).toBe("90.00000000");
  });

  it("invertRateScaled uses integer truncation toward zero", () => {
    const scaled = parseRateToScaled("90.00");
    const inverted = invertRateScaled(scaled);
    expect(inverted).toBe(1111111n);
    expect(formatRateScaled(inverted)).toBe("0.01111111");
  });

  it("invertRateScaled rejects rate less than or equal to 0n", () => {
    expect(() => invertRateScaled(0n)).toThrow();
    expect(() => invertRateScaled(-1n)).toThrow();
  });

  it("parseRateToScaled rejects invalid major strings", () => {
    expect(() => parseRateToScaled("")).toThrow();
    expect(() => parseRateToScaled("1e2")).toThrow();
  });
});

describe("schema conventions", () => {
  it("locks BigInt money/rate fields and required Currency.scale", () => {
    const schema = readFileSync("prisma/schema.prisma", "utf8");
    expect(schema).toMatch(/amountMinor\s+BigInt/);
    expect(schema).toMatch(/rateToPrimaryScaled\s+BigInt/);
    expect(schema).toMatch(/creditLimitMinor\s+BigInt/);
    expect(schema).toMatch(/scale\s+Int/);
    expect(schema).not.toMatch(/\bFloat\b/);
    expect(schema).not.toMatch(/\bDecimal\b/);
  });
});
