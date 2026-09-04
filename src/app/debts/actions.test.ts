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
    },
  },
  ensureSqlitePragmas: vi.fn(),
}));

import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { createPerson, deletePerson, renamePerson } from "./actions";

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
