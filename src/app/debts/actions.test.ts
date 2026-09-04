import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    person: {
      create: vi.fn(),
    },
  },
  ensureSqlitePragmas: vi.fn(),
}));

import { Prisma } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { createPerson } from "./actions";

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
