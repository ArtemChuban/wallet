import { describe, expect, it } from "vitest";
import {
  createOneTimeIncomeSchema,
  createOneTimeIncomeWithNewPersonSchema,
  createRecurringIncomeSchema,
  createRecurringIncomeWithNewPersonSchema,
  updateOneTimeIncomeSchema,
  updateRecurringIncomeSchema,
  upsertRecurringIncomeActualSchema,
} from "./income";

const recurringBase = {
  personId: "1",
  currencyCode: "RUB",
  plannedAmountMajor: "1000.50",
  dayOfMonth: 15,
  startAsOf: "2026-09-01",
};

const oneTimeBase = {
  personId: 1,
  currencyCode: "USD",
  plannedAmountMajor: "50",
  plannedAsOf: "2026-09-15",
};

describe("createRecurringIncomeSchema (SRC-01)", () => {
  it("accepts personId, currencyCode, positive major, dayOfMonth, startAsOf, optional note", () => {
    const result = createRecurringIncomeSchema.safeParse({
      ...recurringBase,
      note: "зарплата",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.personId).toBe(1);
      expect(result.data.currencyCode).toBe("RUB");
      expect(result.data.plannedAmountMajor).toBe("1000.50");
      expect(result.data.dayOfMonth).toBe(15);
      expect(result.data.startAsOf).toBe("2026-09-01");
      expect(result.data.note).toBe("зарплата");
    }
  });

  it("accepts dayOfMonth 1 and 31", () => {
    for (const dayOfMonth of [1, 31] as const) {
      const result = createRecurringIncomeSchema.safeParse({
        ...recurringBase,
        dayOfMonth,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.dayOfMonth).toBe(dayOfMonth);
      }
    }
  });

  it("rejects dayOfMonth 0 and 32", () => {
    for (const dayOfMonth of [0, 32] as const) {
      const result = createRecurringIncomeSchema.safeParse({
        ...recurringBase,
        dayOfMonth,
      });
      expect(result.success).toBe(false);
    }
  });

  it("requires startAsOf YYYY-MM-DD", () => {
    const missing = createRecurringIncomeSchema.safeParse({
      personId: 1,
      currencyCode: "RUB",
      plannedAmountMajor: "10",
      dayOfMonth: 10,
    });
    expect(missing.success).toBe(false);

    for (const startAsOf of ["2026/09/01", "09-01-2026", ""] as const) {
      const bad = createRecurringIncomeSchema.safeParse({
        ...recurringBase,
        startAsOf,
      });
      expect(bad.success).toBe(false);
    }
  });

  it("rejects zero/negative/empty plannedAmountMajor", () => {
    for (const plannedAmountMajor of ["0", "-10", "", "   "] as const) {
      const result = createRecurringIncomeSchema.safeParse({
        ...recurringBase,
        plannedAmountMajor,
      });
      expect(result.success).toBe(false);
    }
  });

  it("duplicate create payloads remain valid Zod (idempotency is action-layer)", () => {
    const a = createRecurringIncomeSchema.safeParse(recurringBase);
    const b = createRecurringIncomeSchema.safeParse(recurringBase);
    expect(a.success).toBe(true);
    expect(b.success).toBe(true);
  });
});

describe("createRecurringIncomeWithNewPersonSchema (D-07)", () => {
  it("accepts name instead of personId", () => {
    const result = createRecurringIncomeWithNewPersonSchema.safeParse({
      name: "  Анна  ",
      currencyCode: "RUB",
      plannedAmountMajor: "10",
      dayOfMonth: 5,
      startAsOf: "2026-09-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Анна");
      expect(result.data).not.toHaveProperty("personId");
    }
  });
});

describe("createOneTimeIncomeSchema (SRC-02)", () => {
  it("accepts plannedAsOf + positive major without note", () => {
    const result = createOneTimeIncomeSchema.safeParse(oneTimeBase);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.plannedAsOf).toBe("2026-09-15");
      expect(result.data.note).toBeUndefined();
    }
  });

  it("maps empty note to undefined", () => {
    const result = createOneTimeIncomeSchema.safeParse({
      ...oneTimeBase,
      note: "",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.note).toBeUndefined();
    }
  });

  it("rejects non-positive plannedAmountMajor", () => {
    for (const plannedAmountMajor of ["0", "-1", ""] as const) {
      expect(
        createOneTimeIncomeSchema.safeParse({
          ...oneTimeBase,
          plannedAmountMajor,
        }).success,
      ).toBe(false);
    }
  });

  it("requires plannedAsOf YYYY-MM-DD", () => {
    expect(
      createOneTimeIncomeSchema.safeParse({
        personId: 1,
        currencyCode: "RUB",
        plannedAmountMajor: "10",
      }).success,
    ).toBe(false);
  });
});

describe("createOneTimeIncomeWithNewPersonSchema (D-07)", () => {
  it("accepts name instead of personId", () => {
    const result = createOneTimeIncomeWithNewPersonSchema.safeParse({
      name: "Пётр",
      currencyCode: "EUR",
      plannedAmountMajor: "20",
      plannedAsOf: "2026-10-01",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Пётр");
      expect(result.data).not.toHaveProperty("personId");
    }
  });
});

describe("updateRecurringIncomeSchema (A1)", () => {
  it("accepts amount + schedule + note; omits person/currency from shape", () => {
    const result = updateRecurringIncomeSchema.safeParse({
      id: "3",
      plannedAmountMajor: "200",
      dayOfMonth: 28,
      startAsOf: "2026-01-01",
      note: "обновлено",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(3);
    }
    const shape = updateRecurringIncomeSchema.shape;
    expect(shape).not.toHaveProperty("personId");
    expect(shape).not.toHaveProperty("currencyCode");
    expect(shape).not.toHaveProperty("kind");
  });

  it("rejects smuggled personId/currencyCode via .strict()", () => {
    expect(
      updateRecurringIncomeSchema.safeParse({
        id: 1,
        personId: 9,
        plannedAmountMajor: "10",
        dayOfMonth: 1,
        startAsOf: "2026-01-01",
      }).success,
    ).toBe(false);
    expect(
      updateRecurringIncomeSchema.safeParse({
        id: 1,
        currencyCode: "USD",
        plannedAmountMajor: "10",
        dayOfMonth: 1,
        startAsOf: "2026-01-01",
      }).success,
    ).toBe(false);
  });
});

describe("updateOneTimeIncomeSchema (A1)", () => {
  it("accepts amount + plannedAsOf + note; omits person/currency", () => {
    const result = updateOneTimeIncomeSchema.safeParse({
      id: 2,
      plannedAmountMajor: "30",
      plannedAsOf: "2026-11-01",
    });
    expect(result.success).toBe(true);
    const shape = updateOneTimeIncomeSchema.shape;
    expect(shape).not.toHaveProperty("personId");
    expect(shape).not.toHaveProperty("currencyCode");
    expect(shape).not.toHaveProperty("kind");
  });

  it("rejects smuggled personId via .strict()", () => {
    expect(
      updateOneTimeIncomeSchema.safeParse({
        id: 1,
        personId: 2,
        plannedAmountMajor: "10",
        plannedAsOf: "2026-01-01",
      }).success,
    ).toBe(false);
  });
});

describe("upsertRecurringIncomeActualSchema (ACT-01 / D-19)", () => {
  const base = {
    recurringIncomeId: "1",
    plannedAsOf: "2026-08-31",
    actualAmountMajor: "1000.50",
    actualAsOf: "2026-09-01",
  };

  it("accepts positive major + dates + optional note", () => {
    const result = upsertRecurringIncomeActualSchema.safeParse({
      ...base,
      note: "факт",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recurringIncomeId).toBe(1);
      expect(result.data.plannedAsOf).toBe("2026-08-31");
      expect(result.data.actualAmountMajor).toBe("1000.50");
      expect(result.data.actualAsOf).toBe("2026-09-01");
      expect(result.data.note).toBe("факт");
    }
  });

  it("rejects zero/negative/empty actualAmountMajor", () => {
    for (const actualAmountMajor of ["0", "-10", "", "   "] as const) {
      expect(
        upsertRecurringIncomeActualSchema.safeParse({
          ...base,
          actualAmountMajor,
        }).success,
      ).toBe(false);
    }
  });

  it("requires recurringIncomeId, plannedAsOf, actualAsOf YYYY-MM-DD", () => {
    expect(
      upsertRecurringIncomeActualSchema.safeParse({
        actualAmountMajor: "10",
        plannedAsOf: "2026-08-31",
        actualAsOf: "2026-09-01",
      }).success,
    ).toBe(false);
    for (const plannedAsOf of ["2026/08/31", ""] as const) {
      expect(
        upsertRecurringIncomeActualSchema.safeParse({
          ...base,
          plannedAsOf,
        }).success,
      ).toBe(false);
    }
    for (const actualAsOf of ["09-01-2026", ""] as const) {
      expect(
        upsertRecurringIncomeActualSchema.safeParse({
          ...base,
          actualAsOf,
        }).success,
      ).toBe(false);
    }
  });

  it("accepts future actualAsOf (D-19 — no repayment-style upper bound)", () => {
    const result = upsertRecurringIncomeActualSchema.safeParse({
      ...base,
      actualAsOf: "2099-12-31",
    });
    expect(result.success).toBe(true);
  });
});
