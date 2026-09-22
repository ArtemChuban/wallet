import { describe, expect, it } from "vitest";
import {
  formatBpsToPercentMajor,
  parsePercentToBps,
} from "./savings-rate";

/**
 * Phase 27 ACCT-01 / D-01…D-03 — percent major ↔ annualRateBps Int.
 * Adversarial: must fail if scale drifts from money scale-2 or negatives slip through.
 */
describe("parsePercentToBps (ACCT-01 / D-01 / D-02 / D-03)", () => {
  it("maps 16.50 percent major to 1650 bps", () => {
    expect(parsePercentToBps("16.50")).toBe(1650);
  });

  it("maps 0 percent to annualRateBps 0 (D-02)", () => {
    expect(parsePercentToBps("0")).toBe(0);
  });

  it("rejects negative percent major (D-03)", () => {
    expect(() => parsePercentToBps("-1")).toThrow(/negative/i);
  });

  it("rejects rate above Prisma Int max (D-03)", () => {
    expect(() => parsePercentToBps("21474836.48")).toThrow(/too large/i);
  });
});

describe("formatBpsToPercentMajor (ACCT-01 / D-01)", () => {
  it("formats 1650 bps as display major 16.5 (money strip trailing zeros)", () => {
    expect(formatBpsToPercentMajor(1650)).toBe("16.5");
  });

  it("formats 0 bps as 0", () => {
    expect(formatBpsToPercentMajor(0)).toBe("0");
  });

  it("keeps two-frac when needed (1 bps → 0.01)", () => {
    expect(formatBpsToPercentMajor(1)).toBe("0.01");
  });

  it("parse→format→parse round-trips scale-2 majors (D-01)", () => {
    for (const major of ["0", "0.01", "1", "16.50", "99.99"]) {
      const bps = parsePercentToBps(major);
      expect(parsePercentToBps(formatBpsToPercentMajor(bps))).toBe(bps);
    }
  });
});
