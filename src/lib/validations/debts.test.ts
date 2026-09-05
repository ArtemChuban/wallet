import { describe, expect, it } from "vitest";
import {
  createDebtSchema,
  createDebtWithNewPersonSchema,
  createPersonSchema,
  createRepaymentSchema,
  createSizeChangeSchema,
  deleteRepaymentSchema,
  deleteSizeChangeSchema,
  forgiveRemainingSchema,
  renamePersonSchema,
  updateDebtMetaSchema,
} from "./debts";

describe("createPersonSchema", () => {
  it("accepts trimmed non-empty name", () => {
    const result = createPersonSchema.safeParse({ name: "  Иван  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Иван");
    }
  });

  it("rejects empty/whitespace name", () => {
    for (const name of ["", "   "] as const) {
      expect(createPersonSchema.safeParse({ name }).success).toBe(false);
    }
  });
});

describe("renamePersonSchema", () => {
  it("accepts personId and non-empty name", () => {
    const result = renamePersonSchema.safeParse({
      personId: "2",
      name: "Пётр",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.personId).toBe(2);
      expect(result.data.name).toBe("Пётр");
    }
  });
});

describe("createDebtSchema (DEBT-03)", () => {
  it("accepts direction I_OWE|THEY_OWE, currencyCode, positive initial major, optional dueDate and note", () => {
    const result = createDebtSchema.safeParse({
      personId: "1",
      direction: "I_OWE",
      currencyCode: "RUB",
      initialAmountMajor: "1000.50",
      dueDate: "2026-12-01",
      note: "за обед",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.personId).toBe(1);
      expect(result.data.direction).toBe("I_OWE");
      expect(result.data.currencyCode).toBe("RUB");
      expect(result.data.initialAmountMajor).toBe("1000.50");
      expect(result.data.dueDate).toBe("2026-12-01");
      expect(result.data.note).toBe("за обед");
    }
  });

  it("accepts THEY_OWE without optional fields", () => {
    const result = createDebtSchema.safeParse({
      personId: 3,
      direction: "THEY_OWE",
      currencyCode: "USD",
      initialAmountMajor: "50",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-positive initial major", () => {
    for (const initialAmountMajor of ["0", "-10", "", "   "] as const) {
      const result = createDebtSchema.safeParse({
        personId: 1,
        direction: "I_OWE",
        currencyCode: "RUB",
        initialAmountMajor,
      });
      expect(result.success).toBe(false);
    }
  });

  it("rejects invalid direction", () => {
    const result = createDebtSchema.safeParse({
      personId: 1,
      direction: "WE_OWE",
      currencyCode: "RUB",
      initialAmountMajor: "10",
    });
    expect(result.success).toBe(false);
  });
});

describe("createDebtWithNewPersonSchema (D-06)", () => {
  it("accepts person name + debt fields without personId", () => {
    const result = createDebtWithNewPersonSchema.safeParse({
      name: "  Анна  ",
      direction: "I_OWE",
      currencyCode: "RUB",
      initialAmountMajor: "10",
      dueDate: "2026-10-01",
      note: "тест",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Анна");
      expect(result.data.direction).toBe("I_OWE");
      expect(result.data).not.toHaveProperty("personId");
    }
  });

  it("rejects non-positive initial with Russian message", () => {
    const result = createDebtWithNewPersonSchema.safeParse({
      name: "Анна",
      direction: "I_OWE",
      currencyCode: "RUB",
      initialAmountMajor: "0",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("Введите сумму больше 0");
    }
  });
});

describe("updateDebtMetaSchema (DEBT-03 / D-03)", () => {
  it("accepts note/dueDate/direction edits", () => {
    const result = updateDebtMetaSchema.safeParse({
      debtId: "5",
      direction: "THEY_OWE",
      dueDate: "2027-01-15",
      note: "обновлено",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.debtId).toBe(5);
      expect(result.data.direction).toBe("THEY_OWE");
    }
  });

  it("has no initialAmount/initialMajor field", () => {
    const shape = updateDebtMetaSchema.shape;
    expect(shape).not.toHaveProperty("initialAmountMajor");
    expect(shape).not.toHaveProperty("initialAmountMinor");
    expect(shape).not.toHaveProperty("initialAmount");
  });

  it("rejects unknown initial-amount keys via .strict()", () => {
    const result = updateDebtMetaSchema.safeParse({
      debtId: 1,
      initialAmountMajor: "999",
    });
    expect(result.success).toBe(false);
  });
});

describe("createRepaymentSchema", () => {
  it("accepts positive amount major, asOfDate, optional note", () => {
    const result = createRepaymentSchema.safeParse({
      debtId: "4",
      amountMajor: "250.00",
      asOfDate: "2026-09-01",
      note: "часть",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.debtId).toBe(4);
      expect(result.data.amountMajor).toBe("250.00");
      expect(result.data.asOfDate).toBe("2026-09-01");
    }
  });

  it("rejects malformed asOfDate with Russian message", () => {
    for (const asOfDate of ["2026/09/01", "09-01-2026", "not-a-date", ""] as const) {
      const result = createRepaymentSchema.safeParse({
        debtId: 1,
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

  it("rejects empty amountMajor", () => {
    const result = createRepaymentSchema.safeParse({
      debtId: 1,
      amountMajor: "   ",
      asOfDate: "2026-09-01",
    });
    expect(result.success).toBe(false);
  });
});

describe("createSizeChangeSchema", () => {
  it("accepts signed delta major and asOfDate", () => {
    const result = createSizeChangeSchema.safeParse({
      debtId: 2,
      deltaMajor: "-100.50",
      asOfDate: "2026-09-02",
      note: "скидка",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.deltaMajor).toBe("-100.50");
      expect(result.data.asOfDate).toBe("2026-09-02");
    }
  });

  it("rejects empty deltaMajor", () => {
    const result = createSizeChangeSchema.safeParse({
      debtId: 1,
      deltaMajor: "",
      asOfDate: "2026-09-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects malformed asOfDate with Russian message", () => {
    const result = createSizeChangeSchema.safeParse({
      debtId: 1,
      deltaMajor: "10",
      asOfDate: "2026.09.01",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("Укажите дату");
    }
  });
});

describe("deleteRepaymentSchema (REPAY-03 / T-10-03)", () => {
  it("coerces positive int id", () => {
    const result = deleteRepaymentSchema.safeParse({ id: "12" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(12);
    }
  });

  it("rejects non-positive id", () => {
    for (const id of [0, -1, "0", "-3"] as const) {
      expect(deleteRepaymentSchema.safeParse({ id }).success).toBe(false);
    }
  });

  it("rejects smuggled keys via .strict()", () => {
    const result = deleteRepaymentSchema.safeParse({
      id: 1,
      debtId: 99,
    });
    expect(result.success).toBe(false);
  });
});

describe("deleteSizeChangeSchema (REPAY-03 / T-10-03)", () => {
  it("coerces positive int id", () => {
    const result = deleteSizeChangeSchema.safeParse({ id: "8" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(8);
    }
  });

  it("rejects smuggled keys via .strict()", () => {
    const result = deleteSizeChangeSchema.safeParse({
      id: 1,
      extra: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("forgiveRemainingSchema (DEBT-05 / T-10-02)", () => {
  it("accepts debtId, asOfDate, optional note — no delta", () => {
    const result = forgiveRemainingSchema.safeParse({
      debtId: "3",
      asOfDate: "2026-09-01",
      note: "прощение",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.debtId).toBe(3);
      expect(result.data.asOfDate).toBe("2026-09-01");
      expect(result.data.note).toBe("прощение");
    }
  });

  it("rejects smuggled deltaMajor via .strict() (T-10-02)", () => {
    const result = forgiveRemainingSchema.safeParse({
      debtId: 1,
      asOfDate: "2026-09-01",
      deltaMajor: "-999",
    });
    expect(result.success).toBe(false);
  });
});
