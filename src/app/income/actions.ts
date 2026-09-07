"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { assertOneTimePlanImmutable } from "@/lib/income";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { parseMajorToMinor } from "@/lib/money";
import {
  createOneTimeIncomeSchema,
  createOneTimeIncomeWithNewPersonSchema,
  createRecurringIncomeSchema,
  createRecurringIncomeWithNewPersonSchema,
  updateOneTimeIncomeSchema,
  updateRecurringIncomeSchema,
  upsertOneTimeIncomeActualSchema,
  upsertRecurringIncomeActualSchema,
  deleteOneTimeIncomeActualSchema,
  deleteRecurringIncomeActualSchema,
} from "@/lib/validations/income";

export type IncomeActionState = {
  errors?: {
    personId?: string[];
    name?: string[];
    currencyCode?: string[];
    plannedAmountMajor?: string[];
    actualAmountMajor?: string[];
    dayOfMonth?: string[];
    startAsOf?: string[];
    plannedAsOf?: string[];
    actualAsOf?: string[];
    recurringIncomeId?: string[];
    oneTimeIncomeId?: string[];
    note?: string[];
    id?: string[];
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

async function resolvePlannedMinor(
  currencyCode: string,
  plannedAmountMajor: string,
): Promise<
  | { ok: true; plannedAmountMinor: bigint }
  | { ok: false; state: IncomeActionState }
> {
  const currency = await prisma.currency.findUnique({
    where: { code: currencyCode },
  });
  if (!currency) {
    return {
      ok: false,
      state: { errors: { currencyCode: ["Валюта не найдена"] } },
    };
  }
  if (fracDigitCount(plannedAmountMajor) > currency.scale) {
    return {
      ok: false,
      state: {
        errors: {
          plannedAmountMajor: [
            `Не больше ${currency.scale} знаков после запятой`,
          ],
        },
      },
    };
  }
  try {
    const plannedAmountMinor = parseMajorToMinor(
      plannedAmountMajor,
      currency.scale,
    );
    return { ok: true, plannedAmountMinor };
  } catch (err) {
    const msg =
      err instanceof Error && err.message === "too many fractional digits"
        ? `Не больше ${currency.scale} знаков после запятой`
        : "Некорректная сумма";
    return {
      ok: false,
      state: { errors: { plannedAmountMajor: [msg] } },
    };
  }
}

/**
 * Create recurring income for existing person, or compound new-person+income (SRC-01 / D-07).
 * Branch: personId present → createRecurringIncomeSchema; else name → nested person+recurring.
 * revalidatePath("/income") only — never dashboard root (UI-01).
 */
export async function createRecurringIncome(
  _prev: IncomeActionState,
  formData: FormData,
): Promise<IncomeActionState> {
  const personIdRaw = formData.get("personId");
  const hasPersonId =
    typeof personIdRaw === "string" && personIdRaw.trim() !== "";

  try {
    await ensureSqlitePragmas();

    if (hasPersonId) {
      const validated = createRecurringIncomeSchema.safeParse({
        personId: personIdRaw,
        currencyCode: formData.get("currencyCode"),
        plannedAmountMajor: formData.get("plannedAmountMajor"),
        dayOfMonth: formData.get("dayOfMonth"),
        startAsOf: formData.get("startAsOf"),
        note: formData.get("note") ?? undefined,
      });

      if (!validated.success) {
        return { errors: validated.error.flatten().fieldErrors };
      }

      const {
        personId,
        currencyCode,
        plannedAmountMajor,
        dayOfMonth,
        startAsOf,
        note,
      } = validated.data;

      const resolved = await resolvePlannedMinor(
        currencyCode,
        plannedAmountMajor,
      );
      if (!resolved.ok) return resolved.state;

      await prisma.recurringIncome.create({
        data: {
          personId,
          currencyCode,
          plannedAmountMinor: resolved.plannedAmountMinor,
          dayOfMonth,
          startAsOf,
          note: note ?? null,
        },
      });
    } else {
      const validated = createRecurringIncomeWithNewPersonSchema.safeParse({
        name: formData.get("name"),
        currencyCode: formData.get("currencyCode"),
        plannedAmountMajor: formData.get("plannedAmountMajor"),
        dayOfMonth: formData.get("dayOfMonth"),
        startAsOf: formData.get("startAsOf"),
        note: formData.get("note") ?? undefined,
      });

      if (!validated.success) {
        return { errors: validated.error.flatten().fieldErrors };
      }

      const {
        name,
        currencyCode,
        plannedAmountMajor,
        dayOfMonth,
        startAsOf,
        note,
      } = validated.data;

      const resolved = await resolvePlannedMinor(
        currencyCode,
        plannedAmountMajor,
      );
      if (!resolved.ok) return resolved.state;

      await prisma.person.create({
        data: {
          name,
          recurringIncomes: {
            create: {
              currencyCode,
              plannedAmountMinor: resolved.plannedAmountMinor,
              dayOfMonth,
              startAsOf,
              note: note ?? null,
            },
          },
        },
      });
    }
  } catch (error) {
    if (isUniqueNameViolation(error)) {
      return { errors: { name: ["Человек с таким именем уже есть"] } };
    }
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  revalidatePath("/income");
  return { success: true, message: "Сохранено" };
}

/**
 * Create one-time income for existing person, or compound new-person+income (SRC-02 / D-07).
 */
export async function createOneTimeIncome(
  _prev: IncomeActionState,
  formData: FormData,
): Promise<IncomeActionState> {
  const personIdRaw = formData.get("personId");
  const hasPersonId =
    typeof personIdRaw === "string" && personIdRaw.trim() !== "";

  try {
    await ensureSqlitePragmas();

    if (hasPersonId) {
      const validated = createOneTimeIncomeSchema.safeParse({
        personId: personIdRaw,
        currencyCode: formData.get("currencyCode"),
        plannedAmountMajor: formData.get("plannedAmountMajor"),
        plannedAsOf: formData.get("plannedAsOf"),
        note: formData.get("note") ?? undefined,
      });

      if (!validated.success) {
        return { errors: validated.error.flatten().fieldErrors };
      }

      const {
        personId,
        currencyCode,
        plannedAmountMajor,
        plannedAsOf,
        note,
      } = validated.data;

      const resolved = await resolvePlannedMinor(
        currencyCode,
        plannedAmountMajor,
      );
      if (!resolved.ok) return resolved.state;

      await prisma.oneTimeIncome.create({
        data: {
          personId,
          currencyCode,
          plannedAmountMinor: resolved.plannedAmountMinor,
          plannedAsOf,
          note: note ?? null,
        },
      });
    } else {
      const validated = createOneTimeIncomeWithNewPersonSchema.safeParse({
        name: formData.get("name"),
        currencyCode: formData.get("currencyCode"),
        plannedAmountMajor: formData.get("plannedAmountMajor"),
        plannedAsOf: formData.get("plannedAsOf"),
        note: formData.get("note") ?? undefined,
      });

      if (!validated.success) {
        return { errors: validated.error.flatten().fieldErrors };
      }

      const { name, currencyCode, plannedAmountMajor, plannedAsOf, note } =
        validated.data;

      const resolved = await resolvePlannedMinor(
        currencyCode,
        plannedAmountMajor,
      );
      if (!resolved.ok) return resolved.state;

      await prisma.person.create({
        data: {
          name,
          oneTimeIncomes: {
            create: {
              currencyCode,
              plannedAmountMinor: resolved.plannedAmountMinor,
              plannedAsOf,
              note: note ?? null,
            },
          },
        },
      });
    }
  } catch (error) {
    if (isUniqueNameViolation(error)) {
      return { errors: { name: ["Человек с таким именем уже есть"] } };
    }
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  revalidatePath("/income");
  return { success: true, message: "Сохранено" };
}

/**
 * Update recurring amount/schedule/note only — person/currency locked via .strict().
 */
export async function updateRecurringIncome(
  _prev: IncomeActionState,
  formData: FormData,
): Promise<IncomeActionState> {
  const validated = updateRecurringIncomeSchema.safeParse({
    id: formData.get("id"),
    plannedAmountMajor: formData.get("plannedAmountMajor"),
    dayOfMonth: formData.get("dayOfMonth"),
    startAsOf: formData.get("startAsOf"),
    note: formData.get("note") ?? undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { id, plannedAmountMajor, dayOfMonth, startAsOf, note } =
    validated.data;

  try {
    await ensureSqlitePragmas();
    const existing = await prisma.recurringIncome.findUnique({
      where: { id },
      select: { currencyCode: true },
    });
    if (!existing) {
      return {
        message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
      };
    }

    const resolved = await resolvePlannedMinor(
      existing.currencyCode,
      plannedAmountMajor,
    );
    if (!resolved.ok) return resolved.state;

    await prisma.recurringIncome.update({
      where: { id },
      data: {
        plannedAmountMinor: resolved.plannedAmountMinor,
        dayOfMonth,
        startAsOf,
        note: note ?? null,
      },
    });
  } catch {
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  revalidatePath("/income");
  return { success: true, message: "Сохранено" };
}

/**
 * Update one-time amount/plannedAsOf/note; assertOneTimePlanImmutable when actual exists.
 */
export async function updateOneTimeIncome(
  _prev: IncomeActionState,
  formData: FormData,
): Promise<IncomeActionState> {
  const validated = updateOneTimeIncomeSchema.safeParse({
    id: formData.get("id"),
    plannedAmountMajor: formData.get("plannedAmountMajor"),
    plannedAsOf: formData.get("plannedAsOf"),
    note: formData.get("note") ?? undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { id, plannedAmountMajor, plannedAsOf, note } = validated.data;

  try {
    await ensureSqlitePragmas();
    const existing = await prisma.oneTimeIncome.findUnique({
      where: { id },
      select: {
        currencyCode: true,
        plannedAsOf: true,
        plannedAmountMinor: true,
        actuals: { select: { id: true }, take: 1 },
      },
    });
    if (!existing) {
      return {
        message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
      };
    }

    const resolved = await resolvePlannedMinor(
      existing.currencyCode,
      plannedAmountMajor,
    );
    if (!resolved.ok) return resolved.state;

    const hasActual = existing.actuals.length > 0;
    assertOneTimePlanImmutable(hasActual, {
      plannedAsOf: existing.plannedAsOf,
      plannedAmountMinor: existing.plannedAmountMinor,
    }, {
      plannedAsOf,
      plannedAmountMinor: resolved.plannedAmountMinor,
    });

    await prisma.oneTimeIncome.update({
      where: { id },
      data: {
        plannedAmountMinor: resolved.plannedAmountMinor,
        plannedAsOf,
        note: note ?? null,
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "one-time plan fields are immutable after an actual exists"
    ) {
      return {
        message:
          "Нельзя изменить план: уже есть факт получения. Сумма и дата плана зафиксированы.",
      };
    }
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  revalidatePath("/income");
  return { success: true, message: "Сохранено" };
}

/**
 * Delete recurring income definition; Cascade removes actuals via schema.
 */
export async function deleteRecurringIncome(
  formData: FormData,
): Promise<IncomeActionState> {
  const idRaw = formData.get("id");
  const id =
    typeof idRaw === "string" && /^\d+$/.test(idRaw.trim())
      ? Number(idRaw.trim())
      : NaN;

  if (!Number.isInteger(id) || id <= 0) {
    return { message: "Не удалось удалить. Попробуйте снова." };
  }

  try {
    await ensureSqlitePragmas();
    await prisma.recurringIncome.delete({ where: { id } });
  } catch {
    return { message: "Не удалось удалить. Попробуйте снова." };
  }

  revalidatePath("/income");
  return { success: true, message: "Удалено" };
}

/**
 * Delete one-time income definition; Cascade removes actuals via schema.
 */
export async function deleteOneTimeIncome(
  formData: FormData,
): Promise<IncomeActionState> {
  const idRaw = formData.get("id");
  const id =
    typeof idRaw === "string" && /^\d+$/.test(idRaw.trim())
      ? Number(idRaw.trim())
      : NaN;

  if (!Number.isInteger(id) || id <= 0) {
    return { message: "Не удалось удалить. Попробуйте снова." };
  }

  try {
    await ensureSqlitePragmas();
    await prisma.oneTimeIncome.delete({ where: { id } });
  } catch {
    return { message: "Не удалось удалить. Попробуйте снова." };
  }

  revalidatePath("/income");
  return { success: true, message: "Удалено" };
}

/**
 * Upsert recurring income actual for a plan slot (ACT-01 / D-04 / D-19).
 * Slot key = plannedAsOf; never mutates definition plan columns.
 * Future actualAsOf allowed — no repayment-style today upper bound.
 * revalidatePath("/income") only — never dashboard root or NW ledger writes.
 */
export async function upsertRecurringIncomeActual(
  _prev: IncomeActionState,
  formData: FormData,
): Promise<IncomeActionState> {
  const validated = upsertRecurringIncomeActualSchema.safeParse({
    recurringIncomeId: formData.get("recurringIncomeId"),
    plannedAsOf: formData.get("plannedAsOf"),
    actualAmountMajor: formData.get("actualAmountMajor"),
    actualAsOf: formData.get("actualAsOf"),
    note: formData.get("note") ?? undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const {
    recurringIncomeId,
    plannedAsOf,
    actualAmountMajor,
    actualAsOf,
    note,
  } = validated.data;

  try {
    await ensureSqlitePragmas();

    const parent = await prisma.recurringIncome.findUnique({
      where: { id: recurringIncomeId },
      include: { currency: { select: { scale: true } } },
    });
    if (!parent) {
      return {
        message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
      };
    }

    if (fracDigitCount(actualAmountMajor) > parent.currency.scale) {
      return {
        errors: {
          actualAmountMajor: [
            `Не больше ${parent.currency.scale} знаков после запятой`,
          ],
        },
      };
    }

    let amountMinor: bigint;
    try {
      amountMinor = parseMajorToMinor(
        actualAmountMajor,
        parent.currency.scale,
      );
    } catch (err) {
      const msg =
        err instanceof Error && err.message === "too many fractional digits"
          ? `Не больше ${parent.currency.scale} знаков после запятой`
          : "Некорректная сумма";
      return { errors: { actualAmountMajor: [msg] } };
    }

    await prisma.recurringIncomeActual.upsert({
      where: {
        recurringIncomeId_plannedAsOf: {
          recurringIncomeId,
          plannedAsOf,
        },
      },
      update: {
        amountMinor,
        actualAsOf,
        note: note ?? null,
      },
      create: {
        recurringIncomeId,
        plannedAsOf,
        amountMinor,
        actualAsOf,
        note: note ?? null,
      },
    });
  } catch {
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  revalidatePath("/income");
  return { success: true, message: "Сохранено" };
}

/**
 * Upsert one-time income actual for the plan slot (ACT-01 / D-04 / D-19).
 * Server asserts plannedAsOf === definition.plannedAsOf (T-15-03).
 * Future actualAsOf allowed — no repayment-style today upper bound.
 * revalidatePath("/income") only — never dashboard root or NW ledger writes.
 */
export async function upsertOneTimeIncomeActual(
  _prev: IncomeActionState,
  formData: FormData,
): Promise<IncomeActionState> {
  const validated = upsertOneTimeIncomeActualSchema.safeParse({
    oneTimeIncomeId: formData.get("oneTimeIncomeId"),
    plannedAsOf: formData.get("plannedAsOf"),
    actualAmountMajor: formData.get("actualAmountMajor"),
    actualAsOf: formData.get("actualAsOf"),
    note: formData.get("note") ?? undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const {
    oneTimeIncomeId,
    plannedAsOf,
    actualAmountMajor,
    actualAsOf,
    note,
  } = validated.data;

  try {
    await ensureSqlitePragmas();

    const parent = await prisma.oneTimeIncome.findUnique({
      where: { id: oneTimeIncomeId },
      include: { currency: { select: { scale: true } } },
    });
    if (!parent) {
      return {
        message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
      };
    }

    if (plannedAsOf !== parent.plannedAsOf) {
      return {
        errors: {
          plannedAsOf: ["Дата плана должна совпадать с планом дохода"],
        },
      };
    }

    if (fracDigitCount(actualAmountMajor) > parent.currency.scale) {
      return {
        errors: {
          actualAmountMajor: [
            `Не больше ${parent.currency.scale} знаков после запятой`,
          ],
        },
      };
    }

    let amountMinor: bigint;
    try {
      amountMinor = parseMajorToMinor(
        actualAmountMajor,
        parent.currency.scale,
      );
    } catch (err) {
      const msg =
        err instanceof Error && err.message === "too many fractional digits"
          ? `Не больше ${parent.currency.scale} знаков после запятой`
          : "Некорректная сумма";
      return { errors: { actualAmountMajor: [msg] } };
    }

    await prisma.oneTimeIncomeActual.upsert({
      where: {
        oneTimeIncomeId_plannedAsOf: {
          oneTimeIncomeId,
          plannedAsOf,
        },
      },
      update: {
        amountMinor,
        actualAsOf,
        note: note ?? null,
      },
      create: {
        oneTimeIncomeId,
        plannedAsOf,
        amountMinor,
        actualAsOf,
        note: note ?? null,
      },
    });
  } catch {
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  revalidatePath("/income");
  return { success: true, message: "Сохранено" };
}

/**
 * Delete a single RecurringIncomeActual by id (D-04).
 * revalidatePath("/income") only.
 */
export async function deleteRecurringIncomeActual(
  formData: FormData,
): Promise<IncomeActionState> {
  const validated = deleteRecurringIncomeActualSchema.safeParse({
    id: formData.get("id"),
  });

  if (!validated.success) {
    return { message: "Не удалось удалить. Попробуйте снова." };
  }

  const { id } = validated.data;

  try {
    await ensureSqlitePragmas();
    await prisma.recurringIncomeActual.delete({ where: { id } });
  } catch {
    return { message: "Не удалось удалить. Попробуйте снова." };
  }

  revalidatePath("/income");
  return { success: true, message: "Удалено" };
}

/**
 * Delete a single OneTimeIncomeActual by id (D-04).
 * revalidatePath("/income") only.
 */
export async function deleteOneTimeIncomeActual(
  formData: FormData,
): Promise<IncomeActionState> {
  const validated = deleteOneTimeIncomeActualSchema.safeParse({
    id: formData.get("id"),
  });

  if (!validated.success) {
    return { message: "Не удалось удалить. Попробуйте снова." };
  }

  const { id } = validated.data;

  try {
    await ensureSqlitePragmas();
    await prisma.oneTimeIncomeActual.delete({ where: { id } });
  } catch {
    return { message: "Не удалось удалить. Попробуйте снова." };
  }

  revalidatePath("/income");
  return { success: true, message: "Удалено" };
}
