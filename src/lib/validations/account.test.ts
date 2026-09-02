import { describe, expect, it } from "vitest";
import {
  createAccountSchema,
  updateAccountNameSchema,
} from "./account";

describe("createAccountSchema (ACCT-01 / ACCT-02)", () => {
  it("accepts FIAT_CREDIT with positive creditLimitMajor", () => {
    const result = createAccountSchema.safeParse({
      name: "Кредитка",
      type: "FIAT_CREDIT",
      currencyCode: "RUB",
      creditLimitMajor: "1000.00",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("FIAT_CREDIT");
      expect(result.data.creditLimitMajor).toBe("1000.00");
    }
  });

  it("rejects FIAT_CREDIT without creditLimitMajor", () => {
    const result = createAccountSchema.safeParse({
      name: "Кредитка",
      type: "FIAT_CREDIT",
      currencyCode: "RUB",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("Укажите кредитный лимит");
    }
  });

  it("rejects FIAT_CREDIT with empty/whitespace creditLimitMajor", () => {
    for (const creditLimitMajor of ["", "   "] as const) {
      const result = createAccountSchema.safeParse({
        name: "Кредитка",
        type: "FIAT_CREDIT",
        currencyCode: "RUB",
        creditLimitMajor,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain("Укажите кредитный лимит");
      }
    }
  });

  it("rejects creditLimitMajor of exactly 0 with Russian message", () => {
    for (const creditLimitMajor of ["0", "0.00", "0.0"] as const) {
      const result = createAccountSchema.safeParse({
        name: "Кредитка",
        type: "FIAT_CREDIT",
        currencyCode: "RUB",
        creditLimitMajor,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain("Введите сумму больше 0");
      }
    }
  });

  it("accepts smallest positive major for scale-style input", () => {
    const result = createAccountSchema.safeParse({
      name: "Кредитка",
      type: "FIAT_CREDIT",
      currencyCode: "RUB",
      creditLimitMajor: "0.01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-credit types with creditLimitMajor", () => {
    for (const type of ["FIAT_DEBIT", "CRYPTO", "CASH"] as const) {
      const result = createAccountSchema.safeParse({
        name: "Счёт",
        type,
        currencyCode: "RUB",
        creditLimitMajor: "100",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain("Лимит только для кредитного счёта");
      }
    }
  });

  it("accepts FIAT_DEBIT/CRYPTO/CASH without credit limit", () => {
    for (const type of ["FIAT_DEBIT", "CRYPTO", "CASH"] as const) {
      const result = createAccountSchema.safeParse({
        name: `Счёт ${type}`,
        type,
        currencyCode: "RUB",
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects debt field on create payload", () => {
    const result = createAccountSchema.safeParse({
      name: "Кредитка",
      type: "FIAT_CREDIT",
      currencyCode: "RUB",
      creditLimitMajor: "1000",
      debtMajor: "50",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateAccountNameSchema (ACCT-01 / D-15)", () => {
  it("accepts name only", () => {
    const result = updateAccountNameSchema.safeParse({ name: "Новое имя" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: "Новое имя" });
      expect(Object.keys(result.data)).toEqual(["name"]);
    }
  });

  it("rejects empty name", () => {
    expect(updateAccountNameSchema.safeParse({ name: "" }).success).toBe(false);
    expect(updateAccountNameSchema.safeParse({ name: "  " }).success).toBe(false);
  });
});
