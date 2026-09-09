import { describe, expect, it } from "vitest";
import {
  assertAccountHasGraceSchedule,
  createCreditGraceObligationSchema,
  updateCreditGraceObligationSchema,
} from "./credit-grace";

describe("createCreditGraceObligationSchema (OBL-01 / D-06…D-08)", () => {
  const base = {
    accountId: "1",
    cycleStartAsOf: "2026-08-21",
    dueAsOf: "2026-09-15",
    amountMajor: "1000.00",
  };

  it("accepts positive amountMajor + optional note (OPEN default)", () => {
    const result = createCreditGraceObligationSchema.safeParse({
      ...base,
      note: "  платёж  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amountMajor).toBe("1000.00");
      expect(result.data.status).toBe("OPEN");
      expect(result.data.note).toBe("платёж");
    }
  });

  it("rejects non-positive amountMajor", () => {
    for (const amountMajor of ["0", "0.00", "-1", ""] as const) {
      const result = createCreditGraceObligationSchema.safeParse({
        ...base,
        amountMajor,
      });
      expect(result.success).toBe(false);
    }
  });

  it("rejects OPEN with closedAsOf set", () => {
    const result = createCreditGraceObligationSchema.safeParse({
      ...base,
      status: "OPEN",
      closedAsOf: "2026-09-10",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain(
        "Дата закрытия только для закрытого обязательства",
      );
    }
  });

  it("CLOSED requires closedAsOf", () => {
    const missing = createCreditGraceObligationSchema.safeParse({
      ...base,
      status: "CLOSED",
    });
    expect(missing.success).toBe(false);
    if (!missing.success) {
      expect(missing.error.issues.map((i) => i.message)).toContain(
        "Укажите дату закрытия",
      );
    }

    const ok = createCreditGraceObligationSchema.safeParse({
      ...base,
      status: "CLOSED",
      closedAsOf: "2026-09-10",
    });
    expect(ok.success).toBe(true);
  });
});

describe("updateCreditGraceObligationSchema (OBL-01 / D-06…D-08)", () => {
  it("accepts positive amount + OPEN without closedAsOf", () => {
    const result = updateCreditGraceObligationSchema.safeParse({
      id: "3",
      amountMajor: "50.5",
      status: "OPEN",
    });
    expect(result.success).toBe(true);
  });

  it("CLOSED requires closedAsOf; OPEN rejects closedAsOf", () => {
    const closedMissing = updateCreditGraceObligationSchema.safeParse({
      id: "3",
      amountMajor: "10",
      status: "CLOSED",
    });
    expect(closedMissing.success).toBe(false);

    const openWithClosed = updateCreditGraceObligationSchema.safeParse({
      id: "3",
      amountMajor: "10",
      status: "OPEN",
      closedAsOf: "2026-09-01",
    });
    expect(openWithClosed.success).toBe(false);

    const closedOk = updateCreditGraceObligationSchema.safeParse({
      id: "3",
      amountMajor: "10",
      status: "CLOSED",
      closedAsOf: "2026-09-01",
    });
    expect(closedOk.success).toBe(true);
  });
});

describe("assertAccountHasGraceSchedule (D-13)", () => {
  it("true only when both DOM days set", () => {
    expect(
      assertAccountHasGraceSchedule({
        statementDayOfMonth: 21,
        dueDayOfMonth: 15,
      }),
    ).toBe(true);
    expect(
      assertAccountHasGraceSchedule({
        statementDayOfMonth: null,
        dueDayOfMonth: 15,
      }),
    ).toBe(false);
    expect(
      assertAccountHasGraceSchedule({
        statementDayOfMonth: 21,
        dueDayOfMonth: null,
      }),
    ).toBe(false);
  });
});
