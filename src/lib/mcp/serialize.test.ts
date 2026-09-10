import { describe, expect, it } from "vitest";
import { RATE_SCALE_E8 } from "@/lib/money";
import { minorToJson, rateToJson } from "./serialize";

/**
 * MCP money JSON helpers (D-09).
 * Minors and rates are strings — never JS number — so agents keep exact scale.
 */
describe("minorToJson", () => {
  it("returns null for null", () => {
    expect(minorToJson(null)).toBeNull();
  });

  it("stringifies bigint minors without Number coercion", () => {
    expect(minorToJson(123n)).toBe("123");
    expect(minorToJson(0n)).toBe("0");
    expect(minorToJson(-50n)).toBe("-50");
    // Larger than Number.MAX_SAFE_INTEGER — must stay exact as string
    expect(minorToJson(9007199254740993n)).toBe("9007199254740993");
  });

  it("never returns a number type", () => {
    const out = minorToJson(42n);
    expect(typeof out).toBe("string");
    expect(Number.isInteger(out as unknown as number)).toBe(false);
  });
});

describe("rateToJson", () => {
  it("stringifies rateToPrimaryScaled bigint", () => {
    expect(rateToJson(100000000n)).toBe("100000000");
    expect(rateToJson(123456789n)).toBe("123456789");
  });

  it("documents RATE_SCALE_E8 pairing for callers (rateScale 8)", () => {
    // Callers pair rateScale: 8 with rateToJson output (RATE_SCALE_E8 = 10^8)
    expect(RATE_SCALE_E8).toBe(100000000n);
    expect(String(RATE_SCALE_E8).length - 1).toBe(8);
  });

  it("never returns a number type", () => {
    const out = rateToJson(1n);
    expect(typeof out).toBe("string");
  });
});
