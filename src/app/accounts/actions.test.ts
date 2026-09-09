import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    account: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    currency: {
      findUnique: vi.fn(),
    },
    balanceSnapshot: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    creditGraceObligation: {
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
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

import { revalidatePath } from "next/cache";
import { calendarDateToday } from "@/lib/balances";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import * as accountActions from "./actions";
import {
  createAccount,
  deleteBalanceSnapshot,
  updateAccountName,
  updateGraceSchedule,
  upsertBalanceSnapshot,
} from "./actions";

describe("accounts/actions exports (D-14 / T-02-10)", () => {
  it("exports create/update/upsert/delete helpers — no account-removal symbols", () => {
    const names = Object.keys(accountActions);
    expect(names).toEqual(
      expect.arrayContaining([
        "createAccount",
        "updateAccountName",
        "updateGraceSchedule",
        "upsertBalanceSnapshot",
        "deleteBalanceSnapshot",
      ]),
    );
    for (const forbidden of [
      "deleteAccount",
      "removeAccount",
      "archiveAccount",
      "destroyAccount",
    ]) {
      expect(names).not.toContain(forbidden);
    }
  });
});

describe("updateAccountName immutability (D-15 / T-02-01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.account.update).mockResolvedValue({} as never);
  });

  it("writes only name — ignores tampered type/currency/limit FormData", async () => {
    const formData = new FormData();
    formData.set("id", "7");
    formData.set("name", "Новое имя");
    formData.set("type", "CRYPTO");
    formData.set("currencyCode", "USDT");
    formData.set("creditLimitMajor", "99999");
    formData.set("creditLimitMinor", "99999");

    const result = await updateAccountName({}, formData);

    expect(result.success).toBe(true);
    expect(prisma.account.update).toHaveBeenCalledTimes(1);
    expect(prisma.account.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { name: "Новое имя" },
    });
    const data = vi.mocked(prisma.account.update).mock.calls[0]![0]!.data;
    expect(Object.keys(data as object)).toEqual(["name"]);
    expect(revalidatePath).toHaveBeenCalledWith("/accounts");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });
});

describe("createAccount types (ACCT-01)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.currency.findUnique).mockResolvedValue({
      code: "RUB",
      name: "Рубль",
      scale: 2,
      isPrimary: true,
    } as never);
    vi.mocked(prisma.account.create).mockResolvedValue({} as never);
  });

  it("persists type ASSET with creditLimitMinor null", async () => {
    const formData = new FormData();
    formData.set("name", "Счёт ASSET");
    formData.set("type", "ASSET");
    formData.set("currencyCode", "RUB");

    const result = await createAccount({}, formData);

    expect(result.success).toBe(true);
    expect(prisma.account.create).toHaveBeenCalledWith({
      data: {
        name: "Счёт ASSET",
        type: "ASSET",
        currencyCode: "RUB",
        creditLimitMinor: null,
      },
    });
  });

  it("D-02: rejects legacy create types FIAT_DEBIT / CRYPTO / CASH", async () => {
    for (const type of ["FIAT_DEBIT", "CRYPTO", "CASH"] as const) {
      vi.mocked(prisma.account.create).mockClear();
      const formData = new FormData();
      formData.set("name", `Счёт ${type}`);
      formData.set("type", type);
      formData.set("currencyCode", "RUB");

      const result = await createAccount({}, formData);

      expect(result.success).toBeUndefined();
      expect(prisma.account.create).not.toHaveBeenCalled();
    }
  });

  it("persists positive creditLimitMinor for FIAT_CREDIT", async () => {
    const formData = new FormData();
    formData.set("name", "Кредитка");
    formData.set("type", "FIAT_CREDIT");
    formData.set("currencyCode", "RUB");
    formData.set("creditLimitMajor", "1000");

    const result = await createAccount({}, formData);

    expect(result.success).toBe(true);
    expect(prisma.account.create).toHaveBeenCalledWith({
      data: {
        name: "Кредитка",
        type: "FIAT_CREDIT",
        currencyCode: "RUB",
        creditLimitMinor: 100000n,
      },
    });
  });
});

describe("upsertBalanceSnapshot (BAL-01 / D-09 / D-12)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(calendarDateToday).mockReturnValue("2026-09-03");
    vi.mocked(prisma.account.findUnique).mockResolvedValue({
      id: 1,
      name: "Дебет",
      type: "FIAT_DEBIT",
      currencyCode: "RUB",
      creditLimitMinor: null,
      currency: { code: "RUB", name: "Рубль", scale: 2, isPrimary: true },
    } as never);
    vi.mocked(prisma.balanceSnapshot.upsert).mockResolvedValue({} as never);
  });

  it("rejects future asOfDate with Russian message (D-12 / T-03-01)", async () => {
    const formData = new FormData();
    formData.set("accountId", "1");
    formData.set("amountMajor", "100");
    formData.set("asOfDate", "2026-09-04");

    const result = await upsertBalanceSnapshot({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.errors?.asOfDate).toEqual(["Дата не может быть в будущем"]);
    expect(prisma.balanceSnapshot.upsert).not.toHaveBeenCalled();
  });

  it("upserts on accountId_asOfDate and revalidates (D-09)", async () => {
    const formData = new FormData();
    formData.set("accountId", "1");
    formData.set("amountMajor", "250.50");
    formData.set("asOfDate", "2026-09-01");

    const result = await upsertBalanceSnapshot({}, formData);

    expect(result.success).toBe(true);
    expect(prisma.balanceSnapshot.upsert).toHaveBeenCalledWith({
      where: {
        accountId_asOfDate: { accountId: 1, asOfDate: "2026-09-01" },
      },
      update: { amountMinor: 25050n },
      create: {
        accountId: 1,
        asOfDate: "2026-09-01",
        amountMinor: 25050n,
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/accounts");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });
});

describe("upsertBalanceSnapshot credit available (D-05–D-07 / T-03-06)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(calendarDateToday).mockReturnValue("2026-09-03");
    vi.mocked(prisma.account.findUnique).mockResolvedValue({
      id: 2,
      name: "Кредитка",
      type: "FIAT_CREDIT",
      currencyCode: "RUB",
      creditLimitMinor: 500000n,
      currency: { code: "RUB", name: "Рубль", scale: 2, isPrimary: true },
    } as never);
    vi.mocked(prisma.balanceSnapshot.upsert).mockResolvedValue({} as never);
  });

  it("rejects available above credit limit with UI-SPEC Russian message", async () => {
    const formData = new FormData();
    formData.set("accountId", "2");
    formData.set("amountMajor", "5000.01");
    formData.set("asOfDate", "2026-09-03");

    const result = await upsertBalanceSnapshot({}, formData);

    expect(result.errors?.amountMajor).toEqual([
      "Введите сумму от 0 до кредитного лимита",
    ]);
    expect(prisma.balanceSnapshot.upsert).not.toHaveBeenCalled();
  });

  it("rejects negative available", async () => {
    const formData = new FormData();
    formData.set("accountId", "2");
    formData.set("amountMajor", "-1");
    formData.set("asOfDate", "2026-09-03");

    const result = await upsertBalanceSnapshot({}, formData);

    expect(result.errors?.amountMajor).toEqual([
      "Введите сумму от 0 до кредитного лимита",
    ]);
    expect(prisma.balanceSnapshot.upsert).not.toHaveBeenCalled();
  });

  it("persists available in amountMinor only — no debt field (D-05 / T-03-07)", async () => {
    const formData = new FormData();
    formData.set("accountId", "2");
    formData.set("amountMajor", "3000");
    formData.set("asOfDate", "2026-09-03");
    formData.set("debtMajor", "2000");
    formData.set("debtMinor", "200000");

    const result = await upsertBalanceSnapshot({}, formData);

    expect(result.success).toBe(true);
    expect(prisma.balanceSnapshot.upsert).toHaveBeenCalledTimes(1);
    const args = vi.mocked(prisma.balanceSnapshot.upsert).mock.calls[0]![0]!;
    expect(args.create).toEqual({
      accountId: 2,
      asOfDate: "2026-09-03",
      amountMinor: 300000n,
    });
    expect(args.update).toEqual({ amountMinor: 300000n });
    expect(Object.keys(args.create as object).sort()).toEqual([
      "accountId",
      "amountMinor",
      "asOfDate",
    ]);
    expect(Object.keys(args.update as object)).toEqual(["amountMinor"]);
  });
});

describe("deleteBalanceSnapshot (BAL-01 / D-10 / D-11)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.balanceSnapshot.delete).mockResolvedValue({} as never);
  });

  it("deletes by validated id and revalidates", async () => {
    const formData = new FormData();
    formData.set("id", "42");

    const result = await deleteBalanceSnapshot(formData);

    expect(result.success).toBe(true);
    expect(prisma.balanceSnapshot.delete).toHaveBeenCalledWith({
      where: { id: 42 },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/accounts");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("returns Russian error on invalid id", async () => {
    const formData = new FormData();
    formData.set("id", "0");

    const result = await deleteBalanceSnapshot(formData);

    expect(result.success).toBeUndefined();
    expect(result.message).toBe(
      "Не удалось удалить снимок. Попробуйте снова.",
    );
    expect(prisma.balanceSnapshot.delete).not.toHaveBeenCalled();
  });

  it("returns Russian error when prisma delete fails", async () => {
    vi.mocked(prisma.balanceSnapshot.delete).mockRejectedValue(
      new Error("not found"),
    );
    const formData = new FormData();
    formData.set("id", "99");

    const result = await deleteBalanceSnapshot(formData);

    expect(result.success).toBeUndefined();
    expect(result.message).toBe(
      "Не удалось удалить снимок. Попробуйте снова.",
    );
  });
});

describe("updateGraceSchedule (CYCLE-01 / D-02 / D-14)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ensureSqlitePragmas).mockResolvedValue(undefined);
    vi.mocked(prisma.account.update).mockResolvedValue({} as never);
    vi.mocked(prisma.creditGraceObligation.count).mockResolvedValue(0);
  });

  it("D-02: ASSET + dual DOM → error; account.update not called", async () => {
    vi.mocked(prisma.account.findUnique).mockResolvedValue({
      id: 3,
      type: "ASSET",
      statementDayOfMonth: null,
      dueDayOfMonth: null,
    } as never);

    const formData = new FormData();
    formData.set("accountId", "3");
    formData.set("statementDayOfMonth", "21");
    formData.set("dueDayOfMonth", "15");

    const result = await updateGraceSchedule({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.message).toBe("Даты грейса только для кредитного счёта");
    expect(prisma.account.update).not.toHaveBeenCalled();
    expect(prisma.creditGraceObligation.create).not.toHaveBeenCalled();
    expect(prisma.creditGraceObligation.update).not.toHaveBeenCalled();
  });

  it("D-14: FIAT_CREDIT clear while OPEN > 0 → error; update not called", async () => {
    vi.mocked(prisma.account.findUnique).mockResolvedValue({
      id: 4,
      type: "FIAT_CREDIT",
      statementDayOfMonth: 21,
      dueDayOfMonth: 15,
    } as never);
    vi.mocked(prisma.creditGraceObligation.count).mockResolvedValue(2);

    const formData = new FormData();
    formData.set("accountId", "4");
    formData.set("statementDayOfMonth", "");
    formData.set("dueDayOfMonth", "");

    const result = await updateGraceSchedule({}, formData);

    expect(result.success).toBeUndefined();
    expect(result.message).toBe(
      "Нельзя очистить график при открытых обязательствах грейса",
    );
    expect(prisma.creditGraceObligation.count).toHaveBeenCalledWith({
      where: { accountId: 4, status: "OPEN" },
    });
    expect(prisma.account.update).not.toHaveBeenCalled();
  });

  it("FIAT_CREDIT + DOM 21/15 → success; updates only DOM fields (D-01)", async () => {
    vi.mocked(prisma.account.findUnique).mockResolvedValue({
      id: 5,
      type: "FIAT_CREDIT",
      statementDayOfMonth: null,
      dueDayOfMonth: null,
    } as never);

    const formData = new FormData();
    formData.set("accountId", "5");
    formData.set("statementDayOfMonth", "21");
    formData.set("dueDayOfMonth", "15");

    const result = await updateGraceSchedule({}, formData);

    expect(result.success).toBe(true);
    expect(prisma.account.update).toHaveBeenCalledTimes(1);
    expect(prisma.account.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { statementDayOfMonth: 21, dueDayOfMonth: 15 },
    });
    const data = vi.mocked(prisma.account.update).mock.calls[0]![0]!.data;
    expect(Object.keys(data as object).sort()).toEqual([
      "dueDayOfMonth",
      "statementDayOfMonth",
    ]);
    expect(prisma.creditGraceObligation.create).not.toHaveBeenCalled();
    expect(prisma.creditGraceObligation.update).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/accounts");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("D-14: FIAT_CREDIT clear with zero OPEN → success; both null", async () => {
    vi.mocked(prisma.account.findUnique).mockResolvedValue({
      id: 6,
      type: "FIAT_CREDIT",
      statementDayOfMonth: 21,
      dueDayOfMonth: 15,
    } as never);
    vi.mocked(prisma.creditGraceObligation.count).mockResolvedValue(0);

    const formData = new FormData();
    formData.set("accountId", "6");
    formData.set("statementDayOfMonth", "");
    formData.set("dueDayOfMonth", "");

    const result = await updateGraceSchedule({}, formData);

    expect(result.success).toBe(true);
    expect(prisma.account.update).toHaveBeenCalledWith({
      where: { id: 6 },
      data: { statementDayOfMonth: null, dueDayOfMonth: null },
    });
    expect(prisma.creditGraceObligation.create).not.toHaveBeenCalled();
    expect(prisma.creditGraceObligation.update).not.toHaveBeenCalled();
  });
});

describe("createCreditGraceObligation (OBL-01 / Plan 01 T3)", () => {
  it.todo("creates OPEN obligation with server-frozen dueAsOf");
  it.todo("P2002 → UI-SPEC Russian duplicate cycle message");
  it.todo("never calls balanceSnapshot upsert/delete (GRISO)");
});

describe.skip("updateCreditGraceObligation (OBL-01 / Plan 02)", () => {
  it.todo("updates amount/note on OPEN without rewriting cycle keys");
});

describe.skip("closeCreditGraceObligation (OBL-02 / Plan 02)", () => {
  it.todo("closes with closedAsOf; no balanceSnapshot writes");
});

describe.skip("reopenCreditGraceObligation (OBL-02 / Plan 02)", () => {
  it.todo("reopens CLOSED → OPEN clearing closedAsOf");
});
