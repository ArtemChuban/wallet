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
    },
    currency: {
      findUnique: vi.fn(),
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

import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { parseMajorToMinor } from "@/lib/money";
import {
  createDebt,
  createPerson,
  deleteDebt,
  deletePerson,
  renamePerson,
  updateDebtMeta,
} from "./actions";

describe("createPerson (PERSON-01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.person.create).mockResolvedValue({} as never);
  });

  it("validates, creates trimmed name, revalidates /debts only", async () => {
    const formData = new FormData();
    formData.set("name", "  Иван  ");

    const result = await createPerson({}, formData);

    expect(result.success).toBe(true);
    expect(ensureSqlitePragmas).toHaveBeenCalled();
    expect(prisma.person.create).toHaveBeenCalledWith({
      data: { name: "Иван" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/debts");
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

  it("validates, updates trimmed name only, revalidates /debts only", async () => {
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

describe("deletePerson (PERSON-02)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.debt.count).mockResolvedValue(0);
    vi.mocked(prisma.person.delete).mockResolvedValue({} as never);
  });

  it("blocks delete when debts remain and does not call person.delete", async () => {
    vi.mocked(prisma.debt.count).mockResolvedValue(2);

    const formData = new FormData();
    formData.set("personId", "3");

    const result = await deletePerson(formData);

    expect(result.success).toBeUndefined();
    expect(result.message).toBe("Нельзя удалить человека, пока есть долги");
    expect(prisma.person.delete).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("returns same blocked message on repeated delete when debts remain", async () => {
    vi.mocked(prisma.debt.count).mockResolvedValue(1);

    const formData = new FormData();
    formData.set("personId", "3");

    const first = await deletePerson(formData);
    const second = await deletePerson(formData);

    expect(first.message).toBe("Нельзя удалить человека, пока есть долги");
    expect(second.message).toBe("Нельзя удалить человека, пока есть долги");
    expect(prisma.person.delete).not.toHaveBeenCalled();
  });

  it("deletes person when debt count is 0 and revalidates /debts", async () => {
    vi.mocked(prisma.debt.count).mockResolvedValue(0);

    const formData = new FormData();
    formData.set("personId", "3");

    const result = await deletePerson(formData);

    expect(result.success).toBe(true);
    expect(ensureSqlitePragmas).toHaveBeenCalled();
    expect(prisma.debt.count).toHaveBeenCalledWith({
      where: { personId: 3 },
    });
    expect(prisma.person.delete).toHaveBeenCalledWith({
      where: { id: 3 },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/debts");
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
