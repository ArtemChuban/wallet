import { describe, expect, it } from "vitest";
import {
  assertGraceDomAllowedForType,
  createAccountSchema,
  updateAccountNameSchema,
  updateAccountSchema,
  updateGraceScheduleSchema,
} from "./account";

describe("createAccountSchema (ACCT-01 / QUICK-0i7 ASSET)", () => {
  it("accepts ASSET without creditLimitMajor", () => {
    const result = createAccountSchema.safeParse({
      name: "Счёт",
      type: "ASSET",
      currencyCode: "RUB",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("ASSET");
      expect(result.data.creditLimitMajor).toBeUndefined();
    }
  });

  it("accepts ASSET with any allowed currency code (D-04)", () => {
    for (const currencyCode of ["RUB", "USDT", "EUR"] as const) {
      const result = createAccountSchema.safeParse({
        name: `Счёт ${currencyCode}`,
        type: "ASSET",
        currencyCode,
      });
      expect(result.success).toBe(true);
    }
  });

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

  it("rejects creditLimitMajor when type is ASSET", () => {
    const result = createAccountSchema.safeParse({
      name: "Счёт",
      type: "ASSET",
      currencyCode: "RUB",
      creditLimitMajor: "100",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("Лимит только для кредитного счёта");
    }
  });

  it("D-02: rejects legacy types FIAT_DEBIT / CRYPTO / CASH on create", () => {
    for (const type of ["FIAT_DEBIT", "CRYPTO", "CASH"] as const) {
      const result = createAccountSchema.safeParse({
        name: `Счёт ${type}`,
        type,
        currencyCode: "RUB",
      });
      expect(result.success).toBe(false);
    }
  });

  it("accepts only ASSET and FIAT_CREDIT write types", () => {
    const types = ["ASSET", "FIAT_CREDIT"] as const;
    for (const type of types) {
      const result = createAccountSchema.safeParse({
        name: `Счёт ${type}`,
        type,
        currencyCode: "RUB",
        ...(type === "FIAT_CREDIT" ? { creditLimitMajor: "500" } : {}),
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe(type);
      }
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

describe("createAccountSchema SAVINGS (ACCT-01 / D-01…D-05 / D-07 / D-15)", () => {
  it("accepts SAVINGS with annualRatePercentMajor 16.50 and accrualDayOfMonth 15", () => {
    const result = createAccountSchema.safeParse({
      name: "Накопительный",
      type: "SAVINGS",
      currencyCode: "RUB",
      annualRatePercentMajor: "16.50",
      accrualDayOfMonth: 15,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("SAVINGS");
      expect(result.data.annualRatePercentMajor).toBe("16.50");
      expect(result.data.accrualDayOfMonth).toBe(15);
    }
  });

  it("accepts annualRatePercentMajor 0 for SAVINGS (D-02)", () => {
    const result = createAccountSchema.safeParse({
      name: "Ноль %",
      type: "SAVINGS",
      currencyCode: "RUB",
      annualRatePercentMajor: "0",
      accrualDayOfMonth: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.annualRatePercentMajor).toBe("0");
    }
  });

  it("rejects SAVINGS without annualRatePercentMajor (D-02 / D-04)", () => {
    const result = createAccountSchema.safeParse({
      name: "Без ставки",
      type: "SAVINGS",
      currencyCode: "RUB",
      accrualDayOfMonth: 15,
    });
    expect(result.success).toBe(false);
  });

  it("rejects SAVINGS with empty/whitespace rate (D-02 / D-07)", () => {
    for (const annualRatePercentMajor of ["", "   "] as const) {
      const result = createAccountSchema.safeParse({
        name: "Пустая ставка",
        type: "SAVINGS",
        currencyCode: "RUB",
        annualRatePercentMajor,
        accrualDayOfMonth: 15,
      });
      expect(result.success).toBe(false);
    }
  });

  it("rejects SAVINGS without accrualDayOfMonth (D-04 / D-05 / D-07)", () => {
    const result = createAccountSchema.safeParse({
      name: "Без DOM",
      type: "SAVINGS",
      currencyCode: "RUB",
      annualRatePercentMajor: "16.50",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative annualRatePercentMajor for SAVINGS (D-03)", () => {
    const result = createAccountSchema.safeParse({
      name: "Отрицательный %",
      type: "SAVINGS",
      currencyCode: "RUB",
      annualRatePercentMajor: "-1",
      accrualDayOfMonth: 15,
    });
    expect(result.success).toBe(false);
  });

  it("rejects savings fields when type is ASSET (D-15)", () => {
    const result = createAccountSchema.safeParse({
      name: "Актив",
      type: "ASSET",
      currencyCode: "RUB",
      annualRatePercentMajor: "16.50",
      accrualDayOfMonth: 15,
    });
    expect(result.success).toBe(false);
  });

  it("rejects creditLimitMajor when type is SAVINGS (D-15)", () => {
    const result = createAccountSchema.safeParse({
      name: "Накопительный",
      type: "SAVINGS",
      currencyCode: "RUB",
      annualRatePercentMajor: "16.50",
      accrualDayOfMonth: 15,
      creditLimitMajor: "1000",
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

describe("updateAccountSchema (ACCT-01 / D-06 / D-08)", () => {
  it("accepts name + rate + DOM for SAVINGS edit payload", () => {
    const result = updateAccountSchema.safeParse({
      name: "Накопительный v2",
      annualRatePercentMajor: "12.00",
      accrualDayOfMonth: 10,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Накопительный v2");
      expect(result.data.annualRatePercentMajor).toBe("12.00");
      expect(result.data.accrualDayOfMonth).toBe(10);
    }
  });

  it("accepts name-only (non-SAVINGS edit; action ignores savings cols)", () => {
    const result = updateAccountSchema.safeParse({ name: "Актив" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Актив");
      expect(result.data.annualRatePercentMajor).toBeUndefined();
      expect(result.data.accrualDayOfMonth).toBeUndefined();
    }
  });

  it("rejects empty name", () => {
    expect(updateAccountSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects DOM outside 1–31", () => {
    expect(
      updateAccountSchema.safeParse({
        name: "x",
        annualRatePercentMajor: "1",
        accrualDayOfMonth: 0,
      }).success,
    ).toBe(false);
    expect(
      updateAccountSchema.safeParse({
        name: "x",
        annualRatePercentMajor: "1",
        accrualDayOfMonth: 32,
      }).success,
    ).toBe(false);
  });
});

describe("updateGraceScheduleSchema (CYCLE-01 / D-02 / D-03)", () => {
  it("accepts both statementDayOfMonth 21 and dueDayOfMonth 15", () => {
    const result = updateGraceScheduleSchema.safeParse({
      accountId: 1,
      statementDayOfMonth: 21,
      dueDayOfMonth: 15,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.statementDayOfMonth).toBe(21);
      expect(result.data.dueDayOfMonth).toBe(15);
    }
  });

  it("rejects partial schedule with Russian pairing message (D-03)", () => {
    for (const payload of [
      { accountId: 1, statementDayOfMonth: 21, dueDayOfMonth: null },
      { accountId: 1, statementDayOfMonth: null, dueDayOfMonth: 15 },
      { accountId: 1, statementDayOfMonth: 21 },
    ] as const) {
      const result = updateGraceScheduleSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain("Укажите обе даты или очистите обе");
      }
    }
  });

  it("accepts both null / both omitted as clear intent at schema layer (D-03)", () => {
    const bothNull = updateGraceScheduleSchema.safeParse({
      accountId: 1,
      statementDayOfMonth: null,
      dueDayOfMonth: null,
    });
    expect(bothNull.success).toBe(true);
    if (bothNull.success) {
      expect(bothNull.data.statementDayOfMonth).toBeNull();
      expect(bothNull.data.dueDayOfMonth).toBeNull();
    }

    const omitted = updateGraceScheduleSchema.safeParse({ accountId: 1 });
    expect(omitted.success).toBe(true);
    if (omitted.success) {
      expect(omitted.data.statementDayOfMonth).toBeNull();
      expect(omitted.data.dueDayOfMonth).toBeNull();
    }
  });

  it("rejects DOM outside 1–31", () => {
    for (const day of [0, 32] as const) {
      const result = updateGraceScheduleSchema.safeParse({
        accountId: 1,
        statementDayOfMonth: day,
        dueDayOfMonth: day,
      });
      expect(result.success).toBe(false);
    }
  });

  it("rejects ASSET (non-FIAT_CREDIT) when DOM fields are set (D-02)", () => {
    const result = updateGraceScheduleSchema.safeParse({
      accountId: 1,
      accountType: "ASSET",
      statementDayOfMonth: 21,
      dueDayOfMonth: 15,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("Даты грейса только для кредитного счёта");
    }
  });

  it("assertGraceDomAllowedForType rejects non-credit when DOM set", () => {
    expect(assertGraceDomAllowedForType("ASSET", 21, 15)).toBe(false);
    expect(assertGraceDomAllowedForType("FIAT_DEBIT", 21, 15)).toBe(false);
    expect(assertGraceDomAllowedForType("FIAT_CREDIT", 21, 15)).toBe(true);
    expect(assertGraceDomAllowedForType("ASSET", null, null)).toBe(true);
  });
});
