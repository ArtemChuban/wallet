import { describe, expect, it } from "vitest";
import { deleteBalanceSchema, setBalanceSchema } from "./balance";

describe("setBalanceSchema (BAL-01)", () => {
  it("accepts accountId, amountMajor, and past/today asOfDate YYYY-MM-DD", () => {
    const result = setBalanceSchema.safeParse({
      accountId: "3",
      amountMajor: "1000.50",
      asOfDate: "2026-09-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accountId).toBe(3);
      expect(result.data.amountMajor).toBe("1000.50");
      expect(result.data.asOfDate).toBe("2026-09-01");
    }
  });

  it("accepts today-shaped asOfDate string", () => {
    const result = setBalanceSchema.safeParse({
      accountId: 1,
      amountMajor: "0",
      asOfDate: "2026-09-03",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty/whitespace amountMajor with Russian message", () => {
    for (const amountMajor of ["", "   "] as const) {
      const result = setBalanceSchema.safeParse({
        accountId: 1,
        amountMajor,
        asOfDate: "2026-09-01",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain("Введите корректную сумму");
      }
    }
  });

  it("rejects malformed asOfDate with Russian message", () => {
    for (const asOfDate of ["2026/09/01", "09-01-2026", "not-a-date", ""] as const) {
      const result = setBalanceSchema.safeParse({
        accountId: 1,
        amountMajor: "10",
        asOfDate,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain("Укажите дату");
      }
    }
  });

  it("rejects non-positive accountId", () => {
    for (const accountId of [0, -1, "0", "-2"] as const) {
      const result = setBalanceSchema.safeParse({
        accountId,
        amountMajor: "10",
        asOfDate: "2026-09-01",
      });
      expect(result.success).toBe(false);
    }
  });
});

describe("deleteBalanceSchema", () => {
  it("accepts positive snapshot id", () => {
    const result = deleteBalanceSchema.safeParse({ id: "12" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(12);
    }
  });

  it("rejects non-positive id", () => {
    expect(deleteBalanceSchema.safeParse({ id: 0 }).success).toBe(false);
    expect(deleteBalanceSchema.safeParse({ id: -1 }).success).toBe(false);
  });
});
