import { describe, expect, it } from "vitest";
import { deleteFxRateSchema, setFxRateSchema } from "./fx";

describe("setFxRateSchema (FX-01)", () => {
  it("accepts currencyCode, rateMajor, asOfDate YYYY-MM-DD, direction toPrimary|fromPrimary", () => {
    const result = setFxRateSchema.safeParse({
      currencyCode: "USD",
      rateMajor: "90.00",
      asOfDate: "2026-01-01",
      direction: "toPrimary",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currencyCode).toBe("USD");
      expect(result.data.rateMajor).toBe("90.00");
      expect(result.data.asOfDate).toBe("2026-01-01");
      expect(result.data.direction).toBe("toPrimary");
    }
  });

  it("defaults direction to toPrimary when omitted", () => {
    const result = setFxRateSchema.safeParse({
      currencyCode: "USD",
      rateMajor: "90",
      asOfDate: "2026-01-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.direction).toBe("toPrimary");
    }
  });

  it("accepts fromPrimary direction", () => {
    const result = setFxRateSchema.safeParse({
      currencyCode: "USD",
      rateMajor: "0.01111111",
      asOfDate: "2026-01-01",
      direction: "fromPrimary",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.direction).toBe("fromPrimary");
    }
  });

  it("rejects empty/whitespace rateMajor with Russian message", () => {
    for (const rateMajor of ["", "   "] as const) {
      const result = setFxRateSchema.safeParse({
        currencyCode: "USD",
        rateMajor,
        asOfDate: "2026-01-01",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain("Введите курс");
      }
    }
  });

  it("rejects malformed asOfDate with Russian message", () => {
    for (const asOfDate of ["2026/01/01", "01-01-2026", "not-a-date", ""] as const) {
      const result = setFxRateSchema.safeParse({
        currencyCode: "USD",
        rateMajor: "90",
        asOfDate,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain("Укажите дату");
      }
    }
  });
});

describe("deleteFxRateSchema", () => {
  it("accepts positive rate id", () => {
    const result = deleteFxRateSchema.safeParse({ id: "12" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(12);
    }
  });

  it("rejects non-positive id", () => {
    expect(deleteFxRateSchema.safeParse({ id: 0 }).success).toBe(false);
    expect(deleteFxRateSchema.safeParse({ id: -1 }).success).toBe(false);
  });
});
