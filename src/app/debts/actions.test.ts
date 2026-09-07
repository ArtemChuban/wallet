import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    person: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    debt: {
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    debtRepayment: {
      create: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    debtSizeChange: {
      create: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    recurringIncome: {
      count: vi.fn(),
    },
    oneTimeIncome: {
      count: vi.fn(),
    },
    currency: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  ensureSqlitePragmas: vi.fn(),
}));

vi.mock("@/lib/balances", () => ({
  calendarDateToday: vi.fn(() => "2026-09-03"),
}));

vi.mock("@/lib/money", () => ({
  parseMajorToMinor: vi.fn((major: string) => {
    const n = Number(major);
    if (!Number.isFinite(n)) throw new Error("bad major");
    return BigInt(Math.round(n * 100));
  }),
}));

import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { calendarDateToday } from "@/lib/balances";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { parseMajorToMinor } from "@/lib/money";
import {
  createDebt,
  createPerson,
  createRepayment,
  createSizeChange,
  deleteDebt,
  deletePerson,
  deleteRepayment,
  deleteSizeChange,
  forgiveRemaining,
  renamePerson,
  updateDebtMeta,
} from "./actions";

describe("createPerson (PERSON-01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.person.create).mockResolvedValue({} as never);
  });

  it("validates, creates trimmed name, revalidates /debts and /income", async () => {
    const formData = new FormData();
    formData.set("name", "  Иван  ");

    const result = await createPerson({}, formData);

    expect(result.success).toBe(true);
    expect(ensureSqlitePragmas).toHaveBeenCalled();
    expect(prisma.person.create).toHaveBeenCalledWith({
      data: { name: "Иван" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/debts");
    expect(revalidatePath).toHaveBeenCalledWith("/income");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });

  it("maps P2002 unique name to Russian field error", async () => {
    vi.mocked(prisma.person.create).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
        meta: { target: ["name"] },
      }),
    );

    const formData = new FormData();
    formData.set("name", "Иван");

    const result = await createPerson({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.errors?.name).toEqual([
      "Человек с таким именем уже есть",
    ]);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("renamePerson (PERSON-01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.person.update).mockResolvedValue({} as never);
  });

  it("validates, updates trimmed name only, revalidates /debts and /income", async () => {
    const formData = new FormData();
    formData.set("personId", "7");
    formData.set("name", "  Петр  ");

    const result = await renamePerson({}, formData);

    expect(result.success).toBe(true);
    expect(ensureSqlitePragmas).toHaveBeenCalled();
    expect(prisma.person.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { name: "Петр" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/debts");
    expect(revalidatePath).toHaveBeenCalledWith("/income");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });

  it("maps P2002 unique name to Russian field error", async () => {
    vi.mocked(prisma.person.update).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "test",
        meta: { target: ["name"] },
      }),
    );

    const formData = new FormData();
    formData.set("personId", "7");
    formData.set("name", "Иван");

    const result = await renamePerson({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.errors?.name).toEqual([
      "Человек с таким именем уже есть",
    ]);
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("deletePerson (PERSON-02 / D-16)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.debt.count).mockResolvedValue(0);
    vi.mocked(prisma.recurringIncome.count).mockResolvedValue(0);
    vi.mocked(prisma.oneTimeIncome.count).mockResolvedValue(0);
    vi.mocked(prisma.person.delete).mockResolvedValue({} as never);
  });

  it("blocks delete when debts remain and does not call person.delete", async () => {
    vi.mocked(prisma.debt.count).mockResolvedValue(2);

    const formData = new FormData();
    formData.set("personId", "3");

    const result = await deletePerson(formData);

    expect(result.success).toBeUndefined();
    expect(result.message).toBe(
      "Нельзя удалить человека, пока есть долги или доходы",
    );
    expect(prisma.person.delete).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("blocks delete when income remains even if debt count is 0", async () => {
    vi.mocked(prisma.debt.count).mockResolvedValue(0);
    vi.mocked(prisma.recurringIncome.count).mockResolvedValue(1);
    vi.mocked(prisma.oneTimeIncome.count).mockResolvedValue(0);

    const formData = new FormData();
    formData.set("personId", "3");

    const result = await deletePerson(formData);

    expect(result.success).toBeUndefined();
    expect(result.message).toBe(
      "Нельзя удалить человека, пока есть долги или доходы",
    );
    expect(prisma.person.delete).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns same blocked message on repeated delete when debts remain", async () => {
    vi.mocked(prisma.debt.count).mockResolvedValue(1);

    const formData = new FormData();
    formData.set("personId", "3");

    const first = await deletePerson(formData);
    const second = await deletePerson(formData);

    expect(first.message).toBe(
      "Нельзя удалить человека, пока есть долги или доходы",
    );
    expect(second.message).toBe(
      "Нельзя удалить человека, пока есть долги или доходы",
    );
    expect(prisma.person.delete).not.toHaveBeenCalled();
  });

  it("deletes person when debt and income counts are 0 and dual-revalidates", async () => {
    vi.mocked(prisma.debt.count).mockResolvedValue(0);
    vi.mocked(prisma.recurringIncome.count).mockResolvedValue(0);
    vi.mocked(prisma.oneTimeIncome.count).mockResolvedValue(0);

    const formData = new FormData();
    formData.set("personId", "3");

    const result = await deletePerson(formData);

    expect(result.success).toBe(true);
    expect(ensureSqlitePragmas).toHaveBeenCalled();
    expect(prisma.debt.count).toHaveBeenCalledWith({
      where: { personId: 3 },
    });
    expect(prisma.recurringIncome.count).toHaveBeenCalledWith({
      where: { personId: 3 },
    });
    expect(prisma.oneTimeIncome.count).toHaveBeenCalledWith({
      where: { personId: 3 },
    });
    expect(prisma.person.delete).toHaveBeenCalledWith({
      where: { id: 3 },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/debts");
    expect(revalidatePath).toHaveBeenCalledWith("/income");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });

  it("maps P2003 race to Russian delete failure copy", async () => {
    vi.mocked(prisma.debt.count).mockResolvedValue(0);
    vi.mocked(prisma.person.delete).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Foreign key constraint", {
        code: "P2003",
        clientVersion: "test",
      }),
    );

    const formData = new FormData();
    formData.set("personId", "3");

    const result = await deletePerson(formData);

    expect(result.success).toBeUndefined();
    expect(result.message).toBe(
      "Не удалось удалить. Попробуйте снова.",
    );
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("createDebt (DEBT-01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.currency.findUnique).mockResolvedValue({
      code: "RUB",
      name: "Рубль",
      scale: 2,
      isPrimary: true,
    } as never);
    vi.mocked(prisma.debt.create).mockResolvedValue({} as never);
    vi.mocked(prisma.person.create).mockResolvedValue({} as never);
    vi.mocked(parseMajorToMinor).mockImplementation((major: string) => {
      const n = Number(major);
      if (!Number.isFinite(n)) throw new Error("bad major");
      return BigInt(Math.round(n * 100));
    });
  });

  it("creates debt for existing person with parsed minors and revalidates /debts", async () => {
    const formData = new FormData();
    formData.set("personId", "5");
    formData.set("direction", "I_OWE");
    formData.set("currencyCode", "RUB");
    formData.set("initialAmountMajor", "100.50");
    formData.set("openedAsOf", "2026-09-01");
    formData.set("dueDate", "2026-12-01");
    formData.set("note", "за обед");

    const result = await createDebt({}, formData);

    expect(result.success).toBe(true);
    expect(ensureSqlitePragmas).toHaveBeenCalled();
    expect(prisma.currency.findUnique).toHaveBeenCalledWith({
      where: { code: "RUB" },
    });
    expect(parseMajorToMinor).toHaveBeenCalledWith("100.50", 2);
    expect(prisma.debt.create).toHaveBeenCalledWith({
      data: {
        personId: 5,
        direction: "I_OWE",
        currencyCode: "RUB",
        initialAmountMinor: 10050n,
        openedAsOf: "2026-09-01",
        dueDate: "2026-12-01",
        note: "за обед",
        status: "OPEN",
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/debts");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });

  it("rejects non-positive initial amount with Russian validation", async () => {
    const formData = new FormData();
    formData.set("personId", "5");
    formData.set("direction", "THEY_OWE");
    formData.set("currencyCode", "RUB");
    formData.set("initialAmountMajor", "0");
    formData.set("openedAsOf", "2026-09-01");

    const result = await createDebt({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.errors?.initialAmountMajor).toEqual([
      "Введите сумму больше 0",
    ]);
    expect(prisma.debt.create).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("creates person + debt atomically via nested write (D-06)", async () => {
    const formData = new FormData();
    formData.set("name", "  Мария  ");
    formData.set("direction", "THEY_OWE");
    formData.set("currencyCode", "RUB");
    formData.set("initialAmountMajor", "250");
    formData.set("openedAsOf", "2026-08-15");
    formData.set("note", "займ");

    const result = await createDebt({}, formData);

    expect(result.success).toBe(true);
    expect(prisma.person.create).toHaveBeenCalledWith({
      data: {
        name: "Мария",
        debts: {
          create: {
            direction: "THEY_OWE",
            currencyCode: "RUB",
            initialAmountMinor: 25000n,
            openedAsOf: "2026-08-15",
            dueDate: undefined,
            note: "займ",
            status: "OPEN",
          },
        },
      },
    });
    expect(prisma.debt.create).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/debts");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });
});

describe("updateDebtMeta immutability (DEBT-01 / D-09)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.debt.update).mockResolvedValue({} as never);
  });

  it("writes only direction/dueDate/note — ignores smuggled initial/person/currency", async () => {
    const formData = new FormData();
    formData.set("debtId", "9");
    formData.set("direction", "THEY_OWE");
    formData.set("dueDate", "2027-01-15");
    formData.set("note", "обновлено");
    formData.set("initialAmountMajor", "99999");
    formData.set("initialAmountMinor", "99999");
    formData.set("personId", "42");
    formData.set("currencyCode", "USD");

    const result = await updateDebtMeta({}, formData);

    expect(result.success).toBe(true);
    expect(ensureSqlitePragmas).toHaveBeenCalled();
    expect(prisma.debt.update).toHaveBeenCalledTimes(1);
    expect(prisma.debt.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: {
        direction: "THEY_OWE",
        dueDate: "2027-01-15",
        note: "обновлено",
      },
    });
    const data = vi.mocked(prisma.debt.update).mock.calls[0]![0]!.data;
    expect(Object.keys(data as object).sort()).toEqual(
      ["direction", "dueDate", "note"].sort(),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/debts");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });

  it("never passes smuggled openedAsOf to prisma.debt.update (D-09 / T-11-02)", async () => {
    const formData = new FormData();
    formData.set("debtId", "9");
    formData.set("direction", "I_OWE");
    formData.set("dueDate", "2027-06-01");
    formData.set("note", "meta");
    formData.set("openedAsOf", "2020-01-01");

    const result = await updateDebtMeta({}, formData);

    expect(result.success).toBe(true);
    expect(prisma.debt.update).toHaveBeenCalledTimes(1);
    const data = vi.mocked(prisma.debt.update).mock.calls[0]![0]!.data as Record<
      string,
      unknown
    >;
    expect(data).not.toHaveProperty("openedAsOf");
    expect(Object.keys(data).sort()).toEqual(
      ["direction", "dueDate", "note"].sort(),
    );
  });
});

describe("deleteDebt (DEBT-01 / D-13)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.debt.delete).mockResolvedValue({} as never);
  });

  it("deletes debt by id and revalidates /debts", async () => {
    const formData = new FormData();
    formData.set("debtId", "11");

    const result = await deleteDebt(formData);

    expect(result.success).toBe(true);
    expect(ensureSqlitePragmas).toHaveBeenCalled();
    expect(prisma.debt.delete).toHaveBeenCalledWith({
      where: { id: 11 },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/debts");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });

  it("rejects invalid debtId without calling delete", async () => {
    const formData = new FormData();
    formData.set("debtId", "abc");

    const result = await deleteDebt(formData);

    expect(result.success).toBeUndefined();
    expect(result.message).toBe(
      "Не удалось удалить. Попробуйте снова.",
    );
    expect(prisma.debt.delete).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("createRepayment (REPAY-01 / DEBT-04)", () => {
  const openDebtLedger = {
    id: 9,
    initialAmountMinor: 10000n,
    openedAsOf: "2026-08-01",
    repayments: [] as { amountMinor: bigint; asOfDate: string }[],
    sizeChanges: [] as { deltaMinor: bigint; asOfDate: string }[],
    currency: { scale: 2 },
    status: "OPEN" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(calendarDateToday).mockReturnValue("2026-09-03");
    vi.mocked(parseMajorToMinor).mockImplementation((major: string) => {
      const n = Number(major);
      if (!Number.isFinite(n)) throw new Error("bad major");
      return BigInt(Math.round(n * 100));
    });
    vi.mocked(prisma.debt.findUniqueOrThrow).mockResolvedValue(
      openDebtLedger as never,
    );
    vi.mocked(prisma.debtRepayment.create).mockResolvedValue({} as never);
    vi.mocked(prisma.debt.update).mockResolvedValue({} as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      if (typeof fn !== "function") {
        throw new Error("expected interactive $transaction callback");
      }
      return fn(prisma);
    });
  });

  it("creates partial repayment, keeps OPEN, revalidates /debts only", async () => {
    const formData = new FormData();
    formData.set("debtId", "9");
    formData.set("amountMajor", "30.00");
    formData.set("asOfDate", "2026-09-01");
    formData.set("note", "часть");

    const result = await createRepayment({}, formData);

    expect(result.success).toBe(true);
    expect(ensureSqlitePragmas).toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(parseMajorToMinor).toHaveBeenCalledWith("30.00", 2);
    expect(prisma.debtRepayment.create).toHaveBeenCalledWith({
      data: {
        debtId: 9,
        asOfDate: "2026-09-01",
        amountMinor: 3000n,
        note: "часть",
      },
    });
    expect(prisma.debt.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: { status: "OPEN" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/debts");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });

  it("sets status CLOSED when repayment equals remaining", async () => {
    const formData = new FormData();
    formData.set("debtId", "9");
    formData.set("amountMajor", "100.00");
    formData.set("asOfDate", "2026-09-01");

    const result = await createRepayment({}, formData);

    expect(result.success).toBe(true);
    expect(prisma.debtRepayment.create).toHaveBeenCalledWith({
      data: {
        debtId: 9,
        asOfDate: "2026-09-01",
        amountMinor: 10000n,
        note: undefined,
      },
    });
    expect(prisma.debt.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: { status: "CLOSED" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/debts");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });

  it("rejects over-repayment without writing (T-10-01)", async () => {
    const formData = new FormData();
    formData.set("debtId", "9");
    formData.set("amountMajor", "150.00");
    formData.set("asOfDate", "2026-09-01");

    const result = await createRepayment({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.errors?.amountMajor).toEqual([
      "Сумма больше остатка долга",
    ]);
    expect(prisma.debtRepayment.create).not.toHaveBeenCalled();
    expect(prisma.debt.update).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects future asOfDate with Russian message", async () => {
    const formData = new FormData();
    formData.set("debtId", "9");
    formData.set("amountMajor", "10.00");
    formData.set("asOfDate", "2026-09-10");

    const result = await createRepayment({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.errors?.asOfDate).toEqual([
      "Дата не может быть в будущем",
    ]);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.debtRepayment.create).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects backdated repay that makes chronological remaining < 0 (CR-01)", async () => {
    // Write-order remaining includes later size-up; chrono at asOfDate does not.
    vi.mocked(prisma.debt.findUniqueOrThrow).mockResolvedValue({
      id: 9,
      initialAmountMinor: 10000n,
      openedAsOf: "2026-08-01",
      repayments: [] as { amountMinor: bigint; asOfDate: string }[],
      sizeChanges: [
        { deltaMinor: 10000n, asOfDate: "2026-08-20" },
      ],
      currency: { scale: 2 },
      status: "OPEN" as const,
    } as never);

    const formData = new FormData();
    formData.set("debtId", "9");
    formData.set("amountMajor", "150.00");
    formData.set("asOfDate", "2026-08-10");

    const result = await createRepayment({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.errors?.amountMajor).toEqual([
      "Сумма больше остатка долга",
    ]);
    expect(prisma.debtRepayment.create).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects asOfDate before openedAsOf (CR-02)", async () => {
    const formData = new FormData();
    formData.set("debtId", "9");
    formData.set("amountMajor", "10.00");
    formData.set("asOfDate", "2026-07-01");

    const result = await createRepayment({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.errors?.asOfDate).toEqual([
      "Дата не может быть раньше даты открытия",
    ]);
    expect(prisma.debtRepayment.create).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("maps P2025 not-found to refresh RU and revalidates /debts (G-10-5)", async () => {
    vi.mocked(prisma.debt.findUniqueOrThrow).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Record to find does not exist", {
        code: "P2025",
        clientVersion: "test",
      }),
    );

    const formData = new FormData();
    formData.set("debtId", "9");
    formData.set("amountMajor", "10.00");
    formData.set("asOfDate", "2026-09-01");

    const result = await createRepayment({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.message).toBe(
      "Долг или запись не найдены. Обновите страницу.",
    );
    expect(result.message).not.toBe(
      "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    );
    expect(prisma.debtRepayment.create).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/debts");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });
});

describe("deleteRepayment (REPAY-03 / DEBT-04)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      if (typeof fn !== "function") {
        throw new Error("expected interactive $transaction callback");
      }
      return fn(prisma);
    });
  });

  it("reopens OPEN when remaining > 0 after delete and revalidates /debts only", async () => {
    vi.mocked(prisma.debtRepayment.findUnique).mockResolvedValue({
      id: 42,
      debtId: 9,
      amountMinor: 10000n,
    } as never);
    vi.mocked(prisma.debtRepayment.delete).mockResolvedValue({} as never);
    vi.mocked(prisma.debt.findUniqueOrThrow).mockResolvedValue({
      id: 9,
      initialAmountMinor: 10000n,
      repayments: [] as { amountMinor: bigint }[],
      sizeChanges: [] as { deltaMinor: bigint }[],
      status: "CLOSED",
    } as never);
    vi.mocked(prisma.debt.update).mockResolvedValue({} as never);

    const formData = new FormData();
    formData.set("id", "42");

    const result = await deleteRepayment(formData);

    expect(result.success).toBe(true);
    expect(prisma.debtRepayment.delete).toHaveBeenCalledWith({
      where: { id: 42 },
    });
    expect(prisma.debt.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: { status: "OPEN" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/debts");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });

  it("returns refresh RU on missing id and revalidates /debts (G-10-5)", async () => {
    vi.mocked(prisma.debtRepayment.findUnique).mockResolvedValue(null);

    const formData = new FormData();
    formData.set("id", "999");

    const result = await deleteRepayment(formData);

    expect(result.success).toBeUndefined();
    expect(result.message).toBe(
      "Долг или запись не найдены. Обновите страницу.",
    );
    expect(prisma.debtRepayment.delete).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/debts");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });

  it("rejects invalid id without calling delete or revalidate", async () => {
    const formData = new FormData();
    formData.set("id", "abc");

    const result = await deleteRepayment(formData);

    expect(result.success).toBeUndefined();
    expect(result.message).toBe(
      "Не удалось удалить. Попробуйте снова.",
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("then createRepayment on same debt still succeeds (G-10-5)", async () => {
    vi.mocked(prisma.debtRepayment.findUnique).mockResolvedValue({
      id: 42,
      debtId: 9,
      amountMinor: 3000n,
    } as never);
    vi.mocked(prisma.debtRepayment.delete).mockResolvedValue({} as never);
    vi.mocked(prisma.debt.findUniqueOrThrow)
      .mockResolvedValueOnce({
        id: 9,
        initialAmountMinor: 10000n,
        repayments: [] as { amountMinor: bigint }[],
        sizeChanges: [] as { deltaMinor: bigint }[],
        status: "OPEN",
      } as never)
      .mockResolvedValueOnce({
        id: 9,
        initialAmountMinor: 10000n,
        repayments: [] as { amountMinor: bigint }[],
        sizeChanges: [] as { deltaMinor: bigint }[],
        currency: { scale: 2 },
        status: "OPEN",
      } as never);
    vi.mocked(prisma.debt.update).mockResolvedValue({} as never);
    vi.mocked(prisma.debtRepayment.create).mockResolvedValue({} as never);
    vi.mocked(calendarDateToday).mockReturnValue("2026-09-03");
    vi.mocked(parseMajorToMinor).mockImplementation((major: string) => {
      const n = Number(major);
      if (!Number.isFinite(n)) throw new Error("bad major");
      return BigInt(Math.round(n * 100));
    });

    const deleteFd = new FormData();
    deleteFd.set("id", "42");
    const deleted = await deleteRepayment(deleteFd);
    expect(deleted.success).toBe(true);

    const createFd = new FormData();
    createFd.set("debtId", "9");
    createFd.set("amountMajor", "20.00");
    createFd.set("asOfDate", "2026-09-01");
    const created = await createRepayment({}, createFd);

    expect(created.success).toBe(true);
    expect(prisma.debtRepayment.create).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/debts");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });
});

describe("createSizeChange (DEBT-05 / D-08)", () => {
  const openDebtLedger = {
    id: 9,
    initialAmountMinor: 10000n,
    openedAsOf: "2026-08-01",
    repayments: [] as { amountMinor: bigint; asOfDate: string }[],
    sizeChanges: [] as { deltaMinor: bigint; asOfDate: string }[],
    currency: { scale: 2 },
    status: "OPEN" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(calendarDateToday).mockReturnValue("2026-09-03");
    vi.mocked(parseMajorToMinor).mockImplementation((major: string) => {
      const n = Number(major);
      if (!Number.isFinite(n)) throw new Error("bad major");
      return BigInt(Math.round(n * 100));
    });
    vi.mocked(prisma.debt.findUniqueOrThrow).mockResolvedValue(
      openDebtLedger as never,
    );
    vi.mocked(prisma.debtSizeChange.create).mockResolvedValue({} as never);
    vi.mocked(prisma.debt.update).mockResolvedValue({} as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      if (typeof fn !== "function") {
        throw new Error("expected interactive $transaction callback");
      }
      return fn(prisma);
    });
  });

  it("creates up delta, keeps OPEN, revalidates /debts only", async () => {
    const formData = new FormData();
    formData.set("debtId", "9");
    formData.set("deltaMajor", "25.00");
    formData.set("asOfDate", "2026-09-01");
    formData.set("note", "доп");

    const result = await createSizeChange({}, formData);

    expect(result.success).toBe(true);
    expect(prisma.debtSizeChange.create).toHaveBeenCalledWith({
      data: {
        debtId: 9,
        asOfDate: "2026-09-01",
        deltaMinor: 2500n,
        note: "доп",
      },
    });
    expect(prisma.debt.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: { status: "OPEN" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/debts");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });

  it("rejects over-floor down without writing (T-10-01)", async () => {
    vi.mocked(prisma.debt.findUniqueOrThrow).mockResolvedValue({
      ...openDebtLedger,
      repayments: [{ amountMinor: 8000n, asOfDate: "2026-08-15" }],
    } as never);

    const formData = new FormData();
    formData.set("debtId", "9");
    formData.set("deltaMajor", "-50.00");
    formData.set("asOfDate", "2026-09-01");

    const result = await createSizeChange({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.errors?.deltaMajor).toEqual([
      "Изменение сделало бы остаток отрицательным",
    ]);
    expect(prisma.debtSizeChange.create).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects future asOfDate", async () => {
    const formData = new FormData();
    formData.set("debtId", "9");
    formData.set("deltaMajor", "10.00");
    formData.set("asOfDate", "2026-09-10");

    const result = await createSizeChange({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.errors?.asOfDate).toEqual([
      "Дата не может быть в будущем",
    ]);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects asOfDate before openedAsOf (CR-02)", async () => {
    const formData = new FormData();
    formData.set("debtId", "9");
    formData.set("deltaMajor", "10.00");
    formData.set("asOfDate", "2026-07-15");

    const result = await createSizeChange({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.errors?.asOfDate).toEqual([
      "Дата не может быть раньше даты открытия",
    ]);
    expect(prisma.debtSizeChange.create).not.toHaveBeenCalled();
  });

  it("maps P2025 not-found to refresh RU and revalidates /debts (G-10-5)", async () => {
    vi.mocked(prisma.debt.findUniqueOrThrow).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Record to find does not exist", {
        code: "P2025",
        clientVersion: "test",
      }),
    );

    const formData = new FormData();
    formData.set("debtId", "9");
    formData.set("deltaMajor", "10.00");
    formData.set("asOfDate", "2026-09-01");

    const result = await createSizeChange({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.message).toBe(
      "Долг или запись не найдены. Обновите страницу.",
    );
    expect(result.message).not.toBe(
      "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    );
    expect(prisma.debtSizeChange.create).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/debts");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });
});

describe("forgiveRemaining (DEBT-05 / T-10-02)", () => {
  const openDebtLedger = {
    id: 9,
    initialAmountMinor: 10000n,
    openedAsOf: "2026-08-01",
    repayments: [] as { amountMinor: bigint; asOfDate: string }[],
    sizeChanges: [] as { deltaMinor: bigint; asOfDate: string }[],
    status: "OPEN" as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(calendarDateToday).mockReturnValue("2026-09-03");
    vi.mocked(prisma.debt.findUniqueOrThrow).mockResolvedValue(
      openDebtLedger as never,
    );
    vi.mocked(prisma.debtSizeChange.create).mockResolvedValue({} as never);
    vi.mocked(prisma.debt.update).mockResolvedValue({} as never);
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      if (typeof fn !== "function") {
        throw new Error("expected interactive $transaction callback");
      }
      return fn(prisma);
    });
  });

  it("writes −remaining size-change, sets CLOSED, ignores smuggled delta (T-10-02)", async () => {
    const formData = new FormData();
    formData.set("debtId", "9");
    formData.set("asOfDate", "2026-09-01");
    formData.set("note", "прощение");
    formData.set("deltaMajor", "-1.00");

    const result = await forgiveRemaining({}, formData);

    expect(result.success).toBe(true);
    expect(prisma.debtSizeChange.create).toHaveBeenCalledWith({
      data: {
        debtId: 9,
        asOfDate: "2026-09-01",
        deltaMinor: -10000n,
        note: "прощение",
      },
    });
    expect(prisma.debt.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: { status: "CLOSED" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/debts");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });

  it("rejects remaining 0 without writing", async () => {
    vi.mocked(prisma.debt.findUniqueOrThrow).mockResolvedValue({
      ...openDebtLedger,
      repayments: [{ amountMinor: 10000n, asOfDate: "2026-08-15" }],
    } as never);

    const formData = new FormData();
    formData.set("debtId", "9");
    formData.set("asOfDate", "2026-09-01");

    const result = await forgiveRemaining({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.message).toBe("Нечего прощать — остаток уже 0");
    expect(prisma.debtSizeChange.create).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects future asOfDate", async () => {
    const formData = new FormData();
    formData.set("debtId", "9");
    formData.set("asOfDate", "2026-09-10");

    const result = await forgiveRemaining({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.errors?.asOfDate).toEqual([
      "Дата не может быть в будущем",
    ]);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects asOfDate before openedAsOf (CR-02)", async () => {
    const formData = new FormData();
    formData.set("debtId", "9");
    formData.set("asOfDate", "2026-07-01");

    const result = await forgiveRemaining({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.errors?.asOfDate).toEqual([
      "Дата не может быть раньше даты открытия",
    ]);
    expect(prisma.debtSizeChange.create).not.toHaveBeenCalled();
  });

  it("maps assertSizeDelta OVER_FLOOR to actionable Russian (G-10-5)", async () => {
    vi.mocked(prisma.$transaction).mockRejectedValue(new Error("OVER_FLOOR"));

    const formData = new FormData();
    formData.set("debtId", "9");
    formData.set("asOfDate", "2026-09-01");

    const result = await forgiveRemaining({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.errors?.deltaMajor).toEqual([
      "Изменение сделало бы остаток отрицательным",
    ]);
    expect(result.message).toBe(
      "Изменение сделало бы остаток отрицательным",
    );
    expect(result.message).not.toBe(
      "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    );
    expect(prisma.debtSizeChange.create).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("maps P2025 not-found to refresh RU and revalidates /debts (G-10-5)", async () => {
    vi.mocked(prisma.debt.findUniqueOrThrow).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Record to find does not exist", {
        code: "P2025",
        clientVersion: "test",
      }),
    );

    const formData = new FormData();
    formData.set("debtId", "9");
    formData.set("asOfDate", "2026-09-01");

    const result = await forgiveRemaining({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.message).toBe(
      "Долг или запись не найдены. Обновите страницу.",
    );
    expect(result.message).not.toBe(
      "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    );
    expect(prisma.debtSizeChange.create).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/debts");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });
});

describe("deleteSizeChange (D-06 / DEBT-05)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.$transaction).mockImplementation(async (fn) => {
      if (typeof fn !== "function") {
        throw new Error("expected interactive $transaction callback");
      }
      return fn(prisma);
    });
  });

  it("reopens OPEN after deleting forgive size-change and revalidates /debts only", async () => {
    vi.mocked(prisma.debtSizeChange.findUnique).mockResolvedValue({
      id: 7,
      debtId: 9,
      deltaMinor: -10000n,
    } as never);
    vi.mocked(prisma.debtSizeChange.delete).mockResolvedValue({} as never);
    vi.mocked(prisma.debt.findUniqueOrThrow).mockResolvedValue({
      id: 9,
      initialAmountMinor: 10000n,
      repayments: [] as { amountMinor: bigint }[],
      sizeChanges: [] as { deltaMinor: bigint }[],
      status: "CLOSED",
    } as never);
    vi.mocked(prisma.debt.update).mockResolvedValue({} as never);

    const formData = new FormData();
    formData.set("id", "7");

    const result = await deleteSizeChange(formData);

    expect(result.success).toBe(true);
    expect(prisma.debtSizeChange.delete).toHaveBeenCalledWith({
      where: { id: 7 },
    });
    expect(prisma.debt.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: { status: "OPEN" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/debts");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });

  it("rejects invalid id without delete or revalidate", async () => {
    const formData = new FormData();
    formData.set("id", "abc");

    const result = await deleteSizeChange(formData);

    expect(result.success).toBeUndefined();
    expect(result.message).toBe(
      "Не удалось удалить. Попробуйте снова.",
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns refresh RU on missing id and revalidates /debts (G-10-5)", async () => {
    vi.mocked(prisma.debtSizeChange.findUnique).mockResolvedValue(null);

    const formData = new FormData();
    formData.set("id", "999");

    const result = await deleteSizeChange(formData);

    expect(result.success).toBeUndefined();
    expect(result.message).toBe(
      "Долг или запись не найдены. Обновите страницу.",
    );
    expect(prisma.debtSizeChange.delete).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/debts");
    expect(revalidatePath).not.toHaveBeenCalledWith("/");
  });
});
