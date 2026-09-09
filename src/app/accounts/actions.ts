"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { calendarDateToday } from "@/lib/balances";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { formatMinorToMajorExact, parseMajorToMinor } from "@/lib/money";
import { dueAsOfForCycle } from "@/lib/credit-grace";
import {
  assertGraceDomAllowedForType,
  createAccountSchema,
  updateAccountNameSchema,
  updateGraceScheduleSchema,
} from "@/lib/validations/account";
import {
  deleteBalanceSchema,
  setBalanceSchema,
} from "@/lib/validations/balance";
import {
  assertAccountHasGraceSchedule,
  createCreditGraceObligationSchema,
  updateCreditGraceObligationSchema,
} from "@/lib/validations/credit-grace";

export type AccountActionState = {
  errors?: {
    name?: string[];
    type?: string[];
    currencyCode?: string[];
    creditLimitMajor?: string[];
    accountId?: string[];
    id?: string[];
    statementDayOfMonth?: string[];
    dueDayOfMonth?: string[];
    amountMajor?: string[];
    cycleStartAsOf?: string[];
    dueAsOf?: string[];
    note?: string[];
    status?: string[];
    closedAsOf?: string[];
  };
  message?: string;
  success?: boolean;
};

const DUPLICATE_CYCLE_MESSAGE =
  "Обязательство за этот цикл уже есть — измените сумму в существующей строке";

export type BalanceActionState = {
  errors?: {
    accountId?: string[];
    amountMajor?: string[];
    asOfDate?: string[];
  };
  message?: string;
  success?: boolean;
};

function isUniqueNameViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

/** Count fractional digits in a major decimal string (0 if none). */
function fracDigitCount(major: string): number {
  const m = /^[+-]?\d+(?:\.(\d+))?$/.exec(major.trim());
  return m?.[1]?.length ?? 0;
}

/** Create typed account; creditLimitMinor only for FIAT_CREDIT (D-09, D-10). */
export async function createAccount(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const creditRaw = formData.get("creditLimitMajor");
  const creditLimitMajor =
    typeof creditRaw === "string" && creditRaw.trim() !== ""
      ? creditRaw
      : undefined;

  const validated = createAccountSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    currencyCode: formData.get("currencyCode"),
    creditLimitMajor,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, type, currencyCode } = validated.data;

  try {
    await ensureSqlitePragmas();

    const currency = await prisma.currency.findUnique({
      where: { code: currencyCode },
    });
    if (!currency) {
      return {
        errors: { currencyCode: ["Валюта не найдена"] },
      };
    }

    let creditLimitMinor: bigint | null = null;
    if (type === "FIAT_CREDIT") {
      const major = validated.data.creditLimitMajor!;
      if (fracDigitCount(major) > currency.scale) {
        return {
          errors: {
            creditLimitMajor: [
              `Не больше ${currency.scale} знаков после запятой`,
            ],
          },
        };
      }
      try {
        creditLimitMinor = parseMajorToMinor(major, currency.scale);
      } catch (err) {
        const msg =
          err instanceof Error && err.message === "too many fractional digits"
            ? `Не больше ${currency.scale} знаков после запятой`
            : "Некорректная сумма";
        return { errors: { creditLimitMajor: [msg] } };
      }
      if (creditLimitMinor <= 0n) {
        return {
          errors: { creditLimitMajor: ["Введите сумму больше 0"] },
        };
      }
    }

    await prisma.account.create({
      data: {
        name,
        type,
        currencyCode,
        creditLimitMinor,
      },
    });
  } catch (error) {
    if (isUniqueNameViolation(error)) {
      return { errors: { name: ["Счёт с таким названием уже есть"] } };
    }
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  revalidatePath("/accounts");
  revalidatePath("/");
  return { success: true, message: "Сохранено" };
}

/** Update account name only — ignore tampered type/currency/limit (D-15, T-02-01). */
export async function updateAccountName(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const idRaw = formData.get("id");
  if (typeof idRaw !== "string" || !/^\d+$/.test(idRaw.trim())) {
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }
  const id = Number(idRaw.trim());
  if (!Number.isInteger(id) || id <= 0) {
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  const validated = updateAccountNameSchema.safeParse({
    name: formData.get("name"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  try {
    await ensureSqlitePragmas();
    await prisma.account.update({
      where: { id },
      data: { name: validated.data.name },
    });
  } catch (error) {
    if (isUniqueNameViolation(error)) {
      return { errors: { name: ["Счёт с таким названием уже есть"] } };
    }
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  revalidatePath("/accounts");
  revalidatePath("/");
  return { success: true, message: "Сохранено" };
}

/**
 * Persist dual DOM schedule on FIAT_CREDIT only (CYCLE-01 / D-01 / D-02).
 * Clears both null only when zero OPEN obligations (D-14). Never mutates obligation rows (D-04 / D-05).
 */
export async function updateGraceSchedule(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const validated = updateGraceScheduleSchema.safeParse({
    accountId: formData.get("accountId"),
    statementDayOfMonth: formData.get("statementDayOfMonth"),
    dueDayOfMonth: formData.get("dueDayOfMonth"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { accountId, statementDayOfMonth, dueDayOfMonth } = validated.data;

  try {
    await ensureSqlitePragmas();

    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) {
      return {
        message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
      };
    }

    if (
      !assertGraceDomAllowedForType(
        account.type,
        statementDayOfMonth,
        dueDayOfMonth,
      )
    ) {
      return { message: "Даты грейса только для кредитного счёта" };
    }

    if (account.type !== "FIAT_CREDIT") {
      return { message: "Даты грейса только для кредитного счёта" };
    }

    const clearing =
      statementDayOfMonth === null && dueDayOfMonth === null;
    if (clearing) {
      const openCount = await prisma.creditGraceObligation.count({
        where: { accountId, status: "OPEN" },
      });
      if (openCount > 0) {
        return {
          message:
            "Нельзя очистить график при открытых обязательствах грейса",
        };
      }
    }

    await prisma.account.update({
      where: { id: accountId },
      data: {
        statementDayOfMonth,
        dueDayOfMonth,
      },
    });
  } catch {
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  revalidatePath("/accounts");
  revalidatePath("/");
  return { success: true, message: "Сохранено" };
}

/**
 * Create OPEN grace obligation with positive amount (OBL-01 / D-05…D-09).
 * Server freezes dueAsOf via dueAsOfForCycle — ignores client spoof (T-20-02).
 * Never writes BalanceSnapshot (T-20-03 / GRISO).
 */
export async function createCreditGraceObligation(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const validated = createCreditGraceObligationSchema.safeParse({
    accountId: formData.get("accountId"),
    cycleStartAsOf: formData.get("cycleStartAsOf"),
    dueAsOf: formData.get("dueAsOf"),
    amountMajor: formData.get("amountMajor"),
    status: formData.get("status") || undefined,
    closedAsOf: formData.get("closedAsOf") || undefined,
    note: formData.get("note") || undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { accountId, cycleStartAsOf, amountMajor, note } = validated.data;

  try {
    await ensureSqlitePragmas();

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { currency: true },
    });
    if (!account) {
      return {
        message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
      };
    }

    if (account.type !== "FIAT_CREDIT") {
      return { message: "Обязательства грейса только для кредитного счёта" };
    }

    if (!assertAccountHasGraceSchedule(account)) {
      return {
        message:
          "Укажите день выписки и день оплаты — как в банке. Циклы появятся после сохранения.",
      };
    }

    const dueAsOf = dueAsOfForCycle(cycleStartAsOf, account.dueDayOfMonth!);

    if (fracDigitCount(amountMajor) > account.currency.scale) {
      return {
        errors: {
          amountMajor: [
            `Не больше ${account.currency.scale} знаков после запятой`,
          ],
        },
      };
    }

    let amountMinor: bigint;
    try {
      amountMinor = parseMajorToMinor(amountMajor, account.currency.scale);
    } catch (err) {
      const msg =
        err instanceof Error && err.message === "too many fractional digits"
          ? `Не больше ${account.currency.scale} знаков после запятой`
          : "Некорректная сумма";
      return { errors: { amountMajor: [msg] } };
    }

    if (amountMinor <= 0n) {
      return { errors: { amountMajor: ["Введите сумму больше 0"] } };
    }

    await prisma.creditGraceObligation.create({
      data: {
        accountId,
        cycleStartAsOf,
        dueAsOf,
        amountMinor,
        status: "OPEN",
        note: note ?? null,
      },
    });
  } catch (error) {
    if (isUniqueNameViolation(error)) {
      return { message: DUPLICATE_CYCLE_MESSAGE };
    }
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  revalidatePath("/accounts");
  revalidatePath("/");
  return { success: true, message: "Сохранено" };
}

/**
 * Update OPEN obligation amount/note only — cycleStartAsOf/dueAsOf frozen (D-10).
 * Never writes BalanceSnapshot (T-20-03 / GRISO).
 */
export async function updateCreditGraceObligation(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const validated = updateCreditGraceObligationSchema.safeParse({
    id: formData.get("id"),
    amountMajor: formData.get("amountMajor"),
    status: "OPEN",
    closedAsOf: undefined,
    note: formData.get("note") || undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { id, amountMajor, note } = validated.data;

  try {
    await ensureSqlitePragmas();

    const obligation = await prisma.creditGraceObligation.findUnique({
      where: { id },
      include: { account: { include: { currency: true } } },
    });
    if (!obligation) {
      return {
        message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
      };
    }

    if (obligation.account.type !== "FIAT_CREDIT") {
      return { message: "Обязательства грейса только для кредитного счёта" };
    }

    if (obligation.status !== "OPEN") {
      return {
        message: "Изменить сумму можно только для обязательства «К оплате»",
      };
    }

    const scale = obligation.account.currency.scale;
    if (fracDigitCount(amountMajor) > scale) {
      return {
        errors: {
          amountMajor: [`Не больше ${scale} знаков после запятой`],
        },
      };
    }

    let amountMinor: bigint;
    try {
      amountMinor = parseMajorToMinor(amountMajor, scale);
    } catch (err) {
      const msg =
        err instanceof Error && err.message === "too many fractional digits"
          ? `Не больше ${scale} знаков после запятой`
          : "Некорректная сумма";
      return { errors: { amountMajor: [msg] } };
    }

    if (amountMinor <= 0n) {
      return { errors: { amountMajor: ["Введите сумму больше 0"] } };
    }

    await prisma.creditGraceObligation.update({
      where: { id },
      data: {
        amountMinor,
        note: note ?? null,
      },
    });
  } catch {
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  revalidatePath("/accounts");
  revalidatePath("/");
  return { success: true, message: "Сохранено" };
}

/**
 * Early close OPEN → CLOSED with editable closedAsOf (D-11 / OBL-02).
 * Thin wrapper over update semantics; never writes BalanceSnapshot.
 */
export async function closeCreditGraceObligation(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const idProbe = updateCreditGraceObligationSchema.safeParse({
    id: formData.get("id"),
    amountMajor: "1",
    status: "CLOSED",
    closedAsOf: formData.get("closedAsOf") || undefined,
  });

  if (!idProbe.success) {
    return { errors: idProbe.error.flatten().fieldErrors };
  }

  const { id, closedAsOf } = idProbe.data;

  try {
    await ensureSqlitePragmas();

    const obligation = await prisma.creditGraceObligation.findUnique({
      where: { id },
      include: { account: { include: { currency: true } } },
    });
    if (!obligation) {
      return {
        message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
      };
    }

    if (obligation.account.type !== "FIAT_CREDIT") {
      return { message: "Обязательства грейса только для кредитного счёта" };
    }

    if (obligation.status !== "OPEN") {
      return {
        message: "Отметить оплаченным можно только обязательство «К оплате»",
      };
    }

    const amountMajor = formatMinorToMajorExact(
      obligation.amountMinor,
      obligation.account.currency.scale,
    );
    const validated = updateCreditGraceObligationSchema.safeParse({
      id,
      amountMajor,
      status: "CLOSED",
      closedAsOf,
      note: obligation.note ?? undefined,
    });
    if (!validated.success) {
      return { errors: validated.error.flatten().fieldErrors };
    }

    await prisma.creditGraceObligation.update({
      where: { id },
      data: {
        status: "CLOSED",
        closedAsOf: validated.data.closedAsOf!,
      },
    });
  } catch {
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  revalidatePath("/accounts");
  revalidatePath("/");
  return { success: true, message: "Сохранено" };
}

/**
 * Reopen CLOSED → OPEN clearing closedAsOf (D-12 / OBL-02).
 * Never writes BalanceSnapshot.
 */
export async function reopenCreditGraceObligation(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const idRaw = formData.get("id");
  const idNum =
    typeof idRaw === "string" || typeof idRaw === "number"
      ? Number(idRaw)
      : Number.NaN;
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return { errors: { id: ["Укажите обязательство"] } };
  }

  try {
    await ensureSqlitePragmas();

    const obligation = await prisma.creditGraceObligation.findUnique({
      where: { id: idNum },
      include: { account: { include: { currency: true } } },
    });
    if (!obligation) {
      return {
        message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
      };
    }

    if (obligation.account.type !== "FIAT_CREDIT") {
      return { message: "Обязательства грейса только для кредитного счёта" };
    }

    if (obligation.status !== "CLOSED") {
      return {
        message: "Вернуть к оплате можно только оплаченное обязательство",
      };
    }

    const amountMajor = formatMinorToMajorExact(
      obligation.amountMinor,
      obligation.account.currency.scale,
    );
    const validated = updateCreditGraceObligationSchema.safeParse({
      id: idNum,
      amountMajor,
      status: "OPEN",
      closedAsOf: undefined,
      note: obligation.note ?? undefined,
    });
    if (!validated.success) {
      return { errors: validated.error.flatten().fieldErrors };
    }

    await prisma.creditGraceObligation.update({
      where: { id: idNum },
      data: {
        status: "OPEN",
        closedAsOf: null,
      },
    });
  } catch {
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  revalidatePath("/accounts");
  revalidatePath("/");
  return { success: true, message: "Сохранено" };
}

/** Upsert dated balance snapshot (BAL-01); LOCF read on list (BAL-02). */
export async function upsertBalanceSnapshot(
  _prev: BalanceActionState,
  formData: FormData,
): Promise<BalanceActionState> {
  const validated = setBalanceSchema.safeParse({
    accountId: formData.get("accountId"),
    amountMajor: formData.get("amountMajor"),
    asOfDate: formData.get("asOfDate"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { accountId, amountMajor, asOfDate } = validated.data;
  const today = calendarDateToday();
  if (asOfDate > today) {
    return {
      errors: { asOfDate: ["Дата не может быть в будущем"] },
    };
  }

  try {
    await ensureSqlitePragmas();

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { currency: true },
    });
    if (!account) {
      return {
        message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
      };
    }

    if (fracDigitCount(amountMajor) > account.currency.scale) {
      return {
        errors: {
          amountMajor: [
            `Не больше ${account.currency.scale} знаков после запятой`,
          ],
        },
      };
    }

    let amountMinor: bigint;
    try {
      amountMinor = parseMajorToMinor(amountMajor, account.currency.scale);
    } catch (err) {
      const msg =
        err instanceof Error && err.message === "too many fractional digits"
          ? `Не больше ${account.currency.scale} знаков после запятой`
          : "Некорректная сумма";
      return { errors: { amountMajor: [msg] } };
    }

    if (account.type === "FIAT_CREDIT") {
      const limit = account.creditLimitMinor ?? 0n;
      if (amountMinor < 0n || amountMinor > limit) {
        return {
          errors: {
            amountMajor: ["Введите сумму от 0 до кредитного лимита"],
          },
        };
      }
    } else if (amountMinor < 0n) {
      return { errors: { amountMajor: ["Введите корректную сумму"] } };
    }

    await prisma.balanceSnapshot.upsert({
      where: { accountId_asOfDate: { accountId, asOfDate } },
      update: { amountMinor },
      create: { accountId, asOfDate, amountMinor },
    });
  } catch {
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  revalidatePath("/accounts");
  revalidatePath("/");
  return { success: true, message: "Сохранено" };
}

/** Delete one BalanceSnapshot by id (history only — D-10, D-11). */
export async function deleteBalanceSnapshot(
  formData: FormData,
): Promise<BalanceActionState> {
  const validated = deleteBalanceSchema.safeParse({
    id: formData.get("id"),
  });

  if (!validated.success) {
    return {
      message: "Не удалось удалить снимок. Попробуйте снова.",
    };
  }

  try {
    await ensureSqlitePragmas();
    await prisma.balanceSnapshot.delete({
      where: { id: validated.data.id },
    });
  } catch {
    return {
      message: "Не удалось удалить снимок. Попробуйте снова.",
    };
  }

  revalidatePath("/accounts");
  revalidatePath("/");
  return { success: true, message: "Удалено" };
}
