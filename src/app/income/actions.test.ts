import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    person: {
      create: vi.fn(),
    },
    currency: {
      findUnique: vi.fn(),
    },
    recurringIncome: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    recurringIncomeActual: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    oneTimeIncome: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    oneTimeIncomeActual: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  },
  ensureSqlitePragmas: vi.fn(),
}));

vi.mock("@/lib/money", () => ({
  parseMajorToMinor: vi.fn((major: string) => {
    const n = Number(major);
    if (!Number.isFinite(n)) throw new Error("bad major");
    return BigInt(Math.round(n * 100));
  }),
}));

vi.mock("@/lib/income", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/income")>();
  return {
    ...actual,
    assertOneTimePlanImmutable: vi.fn(actual.assertOneTimePlanImmutable),
  };
});

import { revalidatePath } from "next/cache";
import { assertOneTimePlanImmutable } from "@/lib/income";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { parseMajorToMinor } from "@/lib/money";
import {
  createOneTimeIncome,
  createRecurringIncome,
  deleteOneTimeIncome,
  deleteOneTimeIncomeActual,
  deleteRecurringIncome,
  deleteRecurringIncomeActual,
  updateOneTimeIncome,
  updateRecurringIncome,
  upsertOneTimeIncomeActual,
  upsertRecurringIncomeActual,
} from "./actions";

describe("createRecurringIncome (SRC-01 tracer)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.currency.findUnique).mockResolvedValue({
      code: "RUB",
      scale: 2,
    } as never);
    vi.mocked(prisma.recurringIncome.create).mockResolvedValue({} as never);
    vi.mocked(parseMajorToMinor).mockImplementation((major: string) => {
      const n = Number(major);
      if (!Number.isFinite(n)) throw new Error("bad major");
      return BigInt(Math.round(n * 100));
    });
  });

  it("rejects invalid dayOfMonth without Prisma write", async () => {
    const formData = new FormData();
    formData.set("personId", "1");
    formData.set("currencyCode", "RUB");
    formData.set("plannedAmountMajor", "100");
    formData.set("dayOfMonth", "0");
    formData.set("startAsOf", "2026-09-01");

    const result = await createRecurringIncome({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.errors?.dayOfMonth).toBeDefined();
    expect(prisma.recurringIncome.create).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects non-positive amount without Prisma write", async () => {
    const formData = new FormData();
    formData.set("personId", "1");
    formData.set("currencyCode", "RUB");
    formData.set("plannedAmountMajor", "0");
    formData.set("dayOfMonth", "15");
    formData.set("startAsOf", "2026-09-01");

    const result = await createRecurringIncome({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.errors?.plannedAmountMajor).toEqual([
      "Введите сумму больше 0",
    ]);
    expect(prisma.recurringIncome.create).not.toHaveBeenCalled();
  });

  it("persists recurring income for existing person and revalidates /income only", async () => {
    const formData = new FormData();
    formData.set("personId", "5");
    formData.set("currencyCode", "RUB");
    formData.set("plannedAmountMajor", "50.00");
    formData.set("dayOfMonth", "25");
    formData.set("startAsOf", "2026-09-07");

    const result = await createRecurringIncome({}, formData);

    expect(result.success).toBe(true);
    expect(ensureSqlitePragmas).toHaveBeenCalled();
    expect(prisma.recurringIncome.create).toHaveBeenCalledWith({
      data: {
        personId: 5,
        currencyCode: "RUB",
        plannedAmountMinor: 5000n,
        dayOfMonth: 25,
        startAsOf: "2026-09-07",
        note: null,
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/income");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });

  it("creates nested person+recurring when personId absent", async () => {
    vi.mocked(prisma.person.create).mockResolvedValue({} as never);

    const formData = new FormData();
    formData.set("name", "  Работодатель  ");
    formData.set("currencyCode", "RUB");
    formData.set("plannedAmountMajor", "100");
    formData.set("dayOfMonth", "1");
    formData.set("startAsOf", "2026-01-01");

    const result = await createRecurringIncome({}, formData);

    expect(result.success).toBe(true);
    expect(prisma.person.create).toHaveBeenCalledWith({
      data: {
        name: "Работодатель",
        recurringIncomes: {
          create: {
            currencyCode: "RUB",
            plannedAmountMinor: 10000n,
            dayOfMonth: 1,
            startAsOf: "2026-01-01",
            note: null,
          },
        },
      },
    });
    expect(prisma.recurringIncome.create).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/income");
  });

  it("second identical create inserts another row (idempotency = insert)", async () => {
    const formData = new FormData();
    formData.set("personId", "5");
    formData.set("currencyCode", "RUB");
    formData.set("plannedAmountMajor", "50");
    formData.set("dayOfMonth", "25");
    formData.set("startAsOf", "2026-09-07");

    await createRecurringIncome({}, formData);
    await createRecurringIncome({}, formData);

    expect(prisma.recurringIncome.create).toHaveBeenCalledTimes(2);
  });
});

describe("createOneTimeIncome (SRC-02)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.currency.findUnique).mockResolvedValue({
      code: "RUB",
      scale: 2,
    } as never);
    vi.mocked(prisma.oneTimeIncome.create).mockResolvedValue({} as never);
    vi.mocked(parseMajorToMinor).mockImplementation((major: string) => {
      const n = Number(major);
      if (!Number.isFinite(n)) throw new Error("bad major");
      return BigInt(Math.round(n * 100));
    });
  });

  it("persists plannedAsOf + optional note and revalidates /income", async () => {
    const formData = new FormData();
    formData.set("personId", "2");
    formData.set("currencyCode", "RUB");
    formData.set("plannedAmountMajor", "10.50");
    formData.set("plannedAsOf", "2026-10-01");
    formData.set("note", "бонус");

    const result = await createOneTimeIncome({}, formData);

    expect(result.success).toBe(true);
    expect(prisma.oneTimeIncome.create).toHaveBeenCalledWith({
      data: {
        personId: 2,
        currencyCode: "RUB",
        plannedAmountMinor: 1050n,
        plannedAsOf: "2026-10-01",
        note: "бонус",
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/income");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });

  it("maps empty note to null", async () => {
    const formData = new FormData();
    formData.set("personId", "2");
    formData.set("currencyCode", "RUB");
    formData.set("plannedAmountMajor", "10");
    formData.set("plannedAsOf", "2026-10-01");
    formData.set("note", "");

    const result = await createOneTimeIncome({}, formData);

    expect(result.success).toBe(true);
    expect(prisma.oneTimeIncome.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ note: null }),
    });
  });

  it("second identical create inserts another row", async () => {
    const formData = new FormData();
    formData.set("personId", "2");
    formData.set("currencyCode", "RUB");
    formData.set("plannedAmountMajor", "10");
    formData.set("plannedAsOf", "2026-10-01");

    await createOneTimeIncome({}, formData);
    await createOneTimeIncome({}, formData);

    expect(prisma.oneTimeIncome.create).toHaveBeenCalledTimes(2);
  });
});

describe("updateRecurringIncome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.currency.findUnique).mockResolvedValue({
      code: "RUB",
      scale: 2,
    } as never);
    vi.mocked(prisma.recurringIncome.findUnique).mockResolvedValue({
      id: 9,
      currencyCode: "RUB",
      plannedAmountMinor: 5000n,
      dayOfMonth: 25,
      startAsOf: "2026-01-01",
      note: null,
    } as never);
    vi.mocked(prisma.recurringIncome.update).mockResolvedValue({} as never);
    vi.mocked(parseMajorToMinor).mockImplementation((major: string) => {
      const n = Number(major);
      if (!Number.isFinite(n)) throw new Error("bad major");
      return BigInt(Math.round(n * 100));
    });
  });

  it("updates amount/schedule/note and ignores smuggled person/currency", async () => {
    const formData = new FormData();
    formData.set("id", "9");
    formData.set("plannedAmountMajor", "60");
    formData.set("dayOfMonth", "10");
    formData.set("startAsOf", "2026-02-01");
    formData.set("note", "upd");
    formData.set("personId", "999");
    formData.set("currencyCode", "USD");

    const result = await updateRecurringIncome({}, formData);

    expect(result.success).toBe(true);
    expect(prisma.recurringIncome.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: {
        plannedAmountMinor: 6000n,
        dayOfMonth: 10,
        startAsOf: "2026-02-01",
        note: "upd",
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/income");
  });
});

describe("updateOneTimeIncome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.currency.findUnique).mockResolvedValue({
      code: "RUB",
      scale: 2,
    } as never);
    vi.mocked(parseMajorToMinor).mockImplementation((major: string) => {
      const n = Number(major);
      if (!Number.isFinite(n)) throw new Error("bad major");
      return BigInt(Math.round(n * 100));
    });
  });

  it("invokes assertOneTimePlanImmutable when actual exists and rejects plan change", async () => {
    vi.mocked(prisma.oneTimeIncome.findUnique).mockResolvedValue({
      id: 4,
      currencyCode: "RUB",
      plannedAmountMinor: 1000n,
      plannedAsOf: "2026-10-01",
      note: null,
      actuals: [{ id: 1 }],
    } as never);

    const formData = new FormData();
    formData.set("id", "4");
    formData.set("plannedAmountMajor", "20");
    formData.set("plannedAsOf", "2026-11-01");

    const result = await updateOneTimeIncome({}, formData);

    expect(assertOneTimePlanImmutable).toHaveBeenCalled();
    expect(result.success).toBeUndefined();
    expect(result.message).toBeTruthy();
    expect(prisma.oneTimeIncome.update).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("updates when no actual exists", async () => {
    vi.mocked(prisma.oneTimeIncome.findUnique).mockResolvedValue({
      id: 4,
      currencyCode: "RUB",
      plannedAmountMinor: 1000n,
      plannedAsOf: "2026-10-01",
      note: null,
      actuals: [],
    } as never);
    vi.mocked(prisma.oneTimeIncome.update).mockResolvedValue({} as never);

    const formData = new FormData();
    formData.set("id", "4");
    formData.set("plannedAmountMajor", "20");
    formData.set("plannedAsOf", "2026-11-01");
    formData.set("note", "");

    const result = await updateOneTimeIncome({}, formData);

    expect(result.success).toBe(true);
    expect(prisma.oneTimeIncome.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: {
        plannedAmountMinor: 2000n,
        plannedAsOf: "2026-11-01",
        note: null,
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/income");
  });
});

describe("deleteRecurringIncome / deleteOneTimeIncome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.recurringIncome.delete).mockResolvedValue({} as never);
    vi.mocked(prisma.oneTimeIncome.delete).mockResolvedValue({} as never);
  });

  it("deletes recurring definition and revalidates /income", async () => {
    const formData = new FormData();
    formData.set("id", "8");

    const result = await deleteRecurringIncome(formData);

    expect(result.success).toBe(true);
    expect(prisma.recurringIncome.delete).toHaveBeenCalledWith({
      where: { id: 8 },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/income");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });

  it("deletes one-time definition and revalidates /income", async () => {
    const formData = new FormData();
    formData.set("id", "3");

    const result = await deleteOneTimeIncome(formData);

    expect(result.success).toBe(true);
    expect(prisma.oneTimeIncome.delete).toHaveBeenCalledWith({
      where: { id: 3 },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/income");
  });
});

describe("upsertRecurringIncomeActual (ACT-01 / D-04)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.recurringIncome.findUnique).mockResolvedValue({
      id: 1,
      currencyCode: "RUB",
      plannedAmountMinor: 100_000n,
      currency: { scale: 2 },
    } as never);
    vi.mocked(prisma.recurringIncomeActual.upsert).mockResolvedValue(
      {} as never,
    );
    vi.mocked(parseMajorToMinor).mockImplementation((major: string) => {
      const n = Number(major);
      if (!Number.isFinite(n)) throw new Error("bad major");
      return BigInt(Math.round(n * 100));
    });
  });

  it("rejects non-positive actualAmountMajor without Prisma upsert", async () => {
    const formData = new FormData();
    formData.set("recurringIncomeId", "1");
    formData.set("plannedAsOf", "2026-08-31");
    formData.set("actualAmountMajor", "0");
    formData.set("actualAsOf", "2026-09-01");

    const result = await upsertRecurringIncomeActual({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.errors?.actualAmountMajor).toBeDefined();
    expect(prisma.recurringIncomeActual.upsert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("upserts on recurringIncomeId_plannedAsOf and revalidates /income only", async () => {
    const formData = new FormData();
    formData.set("recurringIncomeId", "1");
    formData.set("plannedAsOf", "2026-08-31");
    formData.set("actualAmountMajor", "1200.50");
    formData.set("actualAsOf", "2099-01-15");
    formData.set("note", "получено");

    const result = await upsertRecurringIncomeActual({}, formData);

    expect(result.success).toBe(true);
    expect(prisma.recurringIncome.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: { currency: { select: { scale: true } } },
    });
    expect(prisma.recurringIncomeActual.upsert).toHaveBeenCalledWith({
      where: {
        recurringIncomeId_plannedAsOf: {
          recurringIncomeId: 1,
          plannedAsOf: "2026-08-31",
        },
      },
      update: {
        amountMinor: 120050n,
        actualAsOf: "2099-01-15",
        note: "получено",
      },
      create: {
        recurringIncomeId: 1,
        plannedAsOf: "2026-08-31",
        amountMinor: 120050n,
        actualAsOf: "2099-01-15",
        note: "получено",
      },
    });
    expect(prisma.recurringIncome.update).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/income");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });

  it("fails closed when parent recurring income missing", async () => {
    vi.mocked(prisma.recurringIncome.findUnique).mockResolvedValue(null);

    const formData = new FormData();
    formData.set("recurringIncomeId", "99");
    formData.set("plannedAsOf", "2026-08-31");
    formData.set("actualAmountMajor", "10");
    formData.set("actualAsOf", "2026-09-01");

    const result = await upsertRecurringIncomeActual({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.message).toBeTruthy();
    expect(prisma.recurringIncomeActual.upsert).not.toHaveBeenCalled();
  });
});

describe("upsertOneTimeIncomeActual (ACT-01 / D-04)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.oneTimeIncome.findUnique).mockResolvedValue({
      id: 4,
      currencyCode: "RUB",
      plannedAsOf: "2026-10-01",
      plannedAmountMinor: 1000n,
      currency: { scale: 2 },
    } as never);
    vi.mocked(prisma.oneTimeIncomeActual.upsert).mockResolvedValue(
      {} as never,
    );
    vi.mocked(parseMajorToMinor).mockImplementation((major: string) => {
      const n = Number(major);
      if (!Number.isFinite(n)) throw new Error("bad major");
      return BigInt(Math.round(n * 100));
    });
  });

  it("rejects when plannedAsOf differs from definition plannedAsOf", async () => {
    const formData = new FormData();
    formData.set("oneTimeIncomeId", "4");
    formData.set("plannedAsOf", "2026-11-01");
    formData.set("actualAmountMajor", "10");
    formData.set("actualAsOf", "2026-09-01");

    const result = await upsertOneTimeIncomeActual({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.errors?.plannedAsOf ?? result.message).toBeTruthy();
    expect(prisma.oneTimeIncomeActual.upsert).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("upserts on oneTimeIncomeId_plannedAsOf and allows future actualAsOf", async () => {
    const formData = new FormData();
    formData.set("oneTimeIncomeId", "4");
    formData.set("plannedAsOf", "2026-10-01");
    formData.set("actualAmountMajor", "15.50");
    formData.set("actualAsOf", "2099-06-01");
    formData.set("note", "факт");

    const result = await upsertOneTimeIncomeActual({}, formData);

    expect(result.success).toBe(true);
    expect(prisma.oneTimeIncome.findUnique).toHaveBeenCalledWith({
      where: { id: 4 },
      include: { currency: { select: { scale: true } } },
    });
    expect(prisma.oneTimeIncomeActual.upsert).toHaveBeenCalledWith({
      where: {
        oneTimeIncomeId_plannedAsOf: {
          oneTimeIncomeId: 4,
          plannedAsOf: "2026-10-01",
        },
      },
      update: {
        amountMinor: 1550n,
        actualAsOf: "2099-06-01",
        note: "факт",
      },
      create: {
        oneTimeIncomeId: 4,
        plannedAsOf: "2026-10-01",
        amountMinor: 1550n,
        actualAsOf: "2099-06-01",
        note: "факт",
      },
    });
    expect(prisma.oneTimeIncome.update).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/income");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });

  it("fails closed when parent one-time income missing", async () => {
    vi.mocked(prisma.oneTimeIncome.findUnique).mockResolvedValue(null);

    const formData = new FormData();
    formData.set("oneTimeIncomeId", "99");
    formData.set("plannedAsOf", "2026-10-01");
    formData.set("actualAmountMajor", "10");
    formData.set("actualAsOf", "2026-09-01");

    const result = await upsertOneTimeIncomeActual({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.message).toBeTruthy();
    expect(prisma.oneTimeIncomeActual.upsert).not.toHaveBeenCalled();
  });
});

describe("deleteRecurringIncomeActual / deleteOneTimeIncomeActual (D-04)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.recurringIncomeActual.delete).mockResolvedValue(
      {} as never,
    );
    vi.mocked(prisma.oneTimeIncomeActual.delete).mockResolvedValue(
      {} as never,
    );
  });

  it("deletes recurring actual by id and revalidates /income only", async () => {
    const formData = new FormData();
    formData.set("id", "12");

    const result = await deleteRecurringIncomeActual(formData);

    expect(result.success).toBe(true);
    expect(prisma.recurringIncomeActual.delete).toHaveBeenCalledWith({
      where: { id: 12 },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/income");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });

  it("deletes one-time actual by id and revalidates /income only", async () => {
    const formData = new FormData();
    formData.set("id", "7");

    const result = await deleteOneTimeIncomeActual(formData);

    expect(result.success).toBe(true);
    expect(prisma.oneTimeIncomeActual.delete).toHaveBeenCalledWith({
      where: { id: 7 },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/income");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });

  it("rejects invalid id without Prisma delete", async () => {
    const formData = new FormData();
    formData.set("id", "0");

    const result = await deleteRecurringIncomeActual(formData);

    expect(result.success).toBeUndefined();
    expect(result.message).toBeTruthy();
    expect(prisma.recurringIncomeActual.delete).not.toHaveBeenCalled();
  });
});

describe("income actions isolation (UI-01)", () => {
  it("actions.ts never references BalanceSnapshot or net-worth/historical-series imports", () => {
    const src = readFileSync("src/app/income/actions.ts", "utf8");
    expect(src).not.toMatch(/BalanceSnapshot/);
    expect(src).not.toMatch(/@\/lib\/(?:net-worth|historical-series)/);
    expect(src).not.toMatch(/revalidatePath\("\/"\)/);
  });
});
