"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { calendarDateToday } from "@/lib/balances";
import {
  assertRepaymentAmount,
  assertSizeDelta,
  currentPrincipalMinor,
  remainingMinor,
  statusForRemaining,
} from "@/lib/debts";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { parseMajorToMinor } from "@/lib/money";
import {
  createDebtSchema,
  createDebtWithNewPersonSchema,
  createPersonSchema,
  createRepaymentSchema,
  createSizeChangeSchema,
  deleteRepaymentSchema,
  deleteSizeChangeSchema,
  forgiveRemainingSchema,
  renamePersonSchema,
  updateDebtMetaSchema,
} from "@/lib/validations/debts";

export type PersonActionState = {
  errors?: {
    name?: string[];
    personId?: string[];
  };
  message?: string;
  success?: boolean;
};

export type DebtActionState = {
  errors?: {
    personId?: string[];
    name?: string[];
    direction?: string[];
    currencyCode?: string[];
    initialAmountMajor?: string[];
    amountMajor?: string[];
    deltaMajor?: string[];
    asOfDate?: string[];
    dueDate?: string[];
    note?: string[];
    debtId?: string[];
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

function isForeignKeyViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  );
}

/** Count fractional digits in a major decimal string (0 if none). */
function fracDigitCount(major: string): number {
  const m = /^[+-]?\d+(?:\.(\d+))?$/.exec(major.trim());
  return m?.[1]?.length ?? 0;
}

async function resolveInitialMinor(
  currencyCode: string,
  initialAmountMajor: string,
): Promise<
  | { ok: true; initialAmountMinor: bigint }
  | { ok: false; state: DebtActionState }
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
  if (fracDigitCount(initialAmountMajor) > currency.scale) {
    return {
      ok: false,
      state: {
        errors: {
          initialAmountMajor: [
            `Не больше ${currency.scale} знаков после запятой`,
          ],
        },
      },
    };
  }
  try {
    const initialAmountMinor = parseMajorToMinor(
      initialAmountMajor,
      currency.scale,
    );
    return { ok: true, initialAmountMinor };
  } catch (err) {
    const msg =
      err instanceof Error && err.message === "too many fractional digits"
        ? `Не больше ${currency.scale} знаков после запятой`
        : "Некорректная сумма";
    return {
      ok: false,
      state: { errors: { initialAmountMajor: [msg] } },
    };
  }
}

/** Create person with unique trimmed name (PERSON-01). */
export async function createPerson(
  _prev: PersonActionState,
  formData: FormData,
): Promise<PersonActionState> {
  const validated = createPersonSchema.safeParse({
    name: formData.get("name"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name } = validated.data;

  try {
    await ensureSqlitePragmas();
    await prisma.person.create({
      data: { name },
    });
  } catch (error) {
    if (isUniqueNameViolation(error)) {
      return { errors: { name: ["Человек с таким именем уже есть"] } };
    }
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  revalidatePath("/debts");
  return { success: true, message: "Сохранено" };
}

/** Rename person name only (PERSON-01 / D-08). */
export async function renamePerson(
  _prev: PersonActionState,
  formData: FormData,
): Promise<PersonActionState> {
  const validated = renamePersonSchema.safeParse({
    personId: formData.get("personId"),
    name: formData.get("name"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { personId, name } = validated.data;

  try {
    await ensureSqlitePragmas();
    await prisma.person.update({
      where: { id: personId },
      data: { name },
    });
  } catch (error) {
    if (isUniqueNameViolation(error)) {
      return { errors: { name: ["Человек с таким именем уже есть"] } };
    }
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  revalidatePath("/debts");
  return { success: true, message: "Сохранено" };
}

/**
 * Delete person only when debt count is 0 (PERSON-02 / D-07).
 * Never cascade-deletes debts from this action.
 */
export async function deletePerson(
  formData: FormData,
): Promise<PersonActionState> {
  const personIdRaw = formData.get("personId");
  const personId =
    typeof personIdRaw === "string" && /^\d+$/.test(personIdRaw.trim())
      ? Number(personIdRaw.trim())
      : NaN;

  if (!Number.isInteger(personId) || personId <= 0) {
    return {
      message: "Не удалось удалить. Попробуйте снова.",
    };
  }

  try {
    await ensureSqlitePragmas();
    const debtCount = await prisma.debt.count({
      where: { personId },
    });
    if (debtCount > 0) {
      return { message: "Нельзя удалить человека, пока есть долги" };
    }
    await prisma.person.delete({
      where: { id: personId },
    });
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      return { message: "Не удалось удалить. Попробуйте снова." };
    }
    return {
      message: "Не удалось удалить. Попробуйте снова.",
    };
  }

  revalidatePath("/debts");
  return { success: true, message: "Удалено" };
}

/**
 * Create debt for existing person, or compound new-person+debt (D-06 / DEBT-01).
 * Branch: personId present → createDebtSchema; else name → nested person+debt.
 */
export async function createDebt(
  _prev: DebtActionState,
  formData: FormData,
): Promise<DebtActionState> {
  const personIdRaw = formData.get("personId");
  const hasPersonId =
    typeof personIdRaw === "string" && personIdRaw.trim() !== "";

  try {
    await ensureSqlitePragmas();

    if (hasPersonId) {
      const validated = createDebtSchema.safeParse({
        personId: personIdRaw,
        direction: formData.get("direction"),
        currencyCode: formData.get("currencyCode"),
        initialAmountMajor: formData.get("initialAmountMajor"),
        dueDate: formData.get("dueDate") ?? undefined,
        note: formData.get("note") ?? undefined,
      });

      if (!validated.success) {
        return { errors: validated.error.flatten().fieldErrors };
      }

      const {
        personId,
        direction,
        currencyCode,
        initialAmountMajor,
        dueDate,
        note,
      } = validated.data;

      const resolved = await resolveInitialMinor(
        currencyCode,
        initialAmountMajor,
      );
      if (!resolved.ok) return resolved.state;

      await prisma.debt.create({
        data: {
          personId,
          direction,
          currencyCode,
          initialAmountMinor: resolved.initialAmountMinor,
          dueDate,
          note,
          status: "OPEN",
        },
      });
    } else {
      const validated = createDebtWithNewPersonSchema.safeParse({
        name: formData.get("name"),
        direction: formData.get("direction"),
        currencyCode: formData.get("currencyCode"),
        initialAmountMajor: formData.get("initialAmountMajor"),
        dueDate: formData.get("dueDate") ?? undefined,
        note: formData.get("note") ?? undefined,
      });

      if (!validated.success) {
        return { errors: validated.error.flatten().fieldErrors };
      }

      const {
        name,
        direction,
        currencyCode,
        initialAmountMajor,
        dueDate,
        note,
      } = validated.data;

      const resolved = await resolveInitialMinor(
        currencyCode,
        initialAmountMajor,
      );
      if (!resolved.ok) return resolved.state;

      await prisma.person.create({
        data: {
          name,
          debts: {
            create: {
              direction,
              currencyCode,
              initialAmountMinor: resolved.initialAmountMinor,
              dueDate,
              note,
              status: "OPEN",
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

  revalidatePath("/debts");
  return { success: true, message: "Сохранено" };
}

/**
 * Update debt meta only — direction / dueDate / note (D-09 / T-09-01).
 * Smuggled initial/person/currency FormData fields are ignored via schema.strict.
 */
export async function updateDebtMeta(
  _prev: DebtActionState,
  formData: FormData,
): Promise<DebtActionState> {
  const validated = updateDebtMetaSchema.safeParse({
    debtId: formData.get("debtId"),
    direction: formData.get("direction") ?? undefined,
    dueDate: formData.get("dueDate") ?? undefined,
    note: formData.get("note") ?? undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { debtId, direction, dueDate, note } = validated.data;

  try {
    await ensureSqlitePragmas();
    await prisma.debt.update({
      where: { id: debtId },
      data: {
        ...(direction !== undefined ? { direction } : {}),
        dueDate: dueDate ?? null,
        note: note ?? null,
      },
    });
  } catch {
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  revalidatePath("/debts");
  return { success: true, message: "Сохранено" };
}

/**
 * Delete debt; Cascade removes repayments and size-change history (D-13).
 */
export async function deleteDebt(
  formData: FormData,
): Promise<DebtActionState> {
  const debtIdRaw = formData.get("debtId");
  const debtId =
    typeof debtIdRaw === "string" && /^\d+$/.test(debtIdRaw.trim())
      ? Number(debtIdRaw.trim())
      : NaN;

  if (!Number.isInteger(debtId) || debtId <= 0) {
    return {
      message: "Не удалось удалить. Попробуйте снова.",
    };
  }

  try {
    await ensureSqlitePragmas();
    await prisma.debt.delete({
      where: { id: debtId },
    });
  } catch {
    return {
      message: "Не удалось удалить. Попробуйте снова.",
    };
  }

  revalidatePath("/debts");
  return { success: true, message: "Удалено" };
}

/**
 * Record same-currency repayment; sync Debt.status from remaining (REPAY-01 / DEBT-04).
 * revalidatePath("/debts") only — never dashboard root (DISOL-01 / T-10-04).
 */
export async function createRepayment(
  _prev: DebtActionState,
  formData: FormData,
): Promise<DebtActionState> {
  const validated = createRepaymentSchema.safeParse({
    debtId: formData.get("debtId"),
    amountMajor: formData.get("amountMajor"),
    asOfDate: formData.get("asOfDate"),
    note: formData.get("note") ?? undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { debtId, amountMajor, asOfDate, note } = validated.data;
  const today = calendarDateToday();
  if (asOfDate > today) {
    return {
      errors: { asOfDate: ["Дата не может быть в будущем"] },
    };
  }

  try {
    await ensureSqlitePragmas();
    await prisma.$transaction(async (tx) => {
      const debt = await tx.debt.findUniqueOrThrow({
        where: { id: debtId },
        include: {
          repayments: { select: { amountMinor: true } },
          sizeChanges: { select: { deltaMinor: true } },
          currency: { select: { scale: true } },
        },
      });

      if (fracDigitCount(amountMajor) > debt.currency.scale) {
        throw new Error("too many fractional digits");
      }

      let amountMinor: bigint;
      try {
        amountMinor = parseMajorToMinor(amountMajor, debt.currency.scale);
      } catch (err) {
        if (
          err instanceof Error &&
          err.message === "too many fractional digits"
        ) {
          throw err;
        }
        throw new Error("bad amount");
      }

      const remainingBefore = remainingMinor(
        debt.initialAmountMinor,
        debt.sizeChanges.map((s) => s.deltaMinor),
        debt.repayments.map((r) => r.amountMinor),
      );

      try {
        assertRepaymentAmount(amountMinor, remainingBefore);
      } catch (err) {
        if (
          err instanceof Error &&
          err.message === "repayment exceeds remaining"
        ) {
          throw new Error("OVER_REPAY");
        }
        if (
          err instanceof Error &&
          err.message === "repayment amount must be > 0"
        ) {
          throw new Error("AMOUNT_NOT_POSITIVE");
        }
        throw err;
      }

      await tx.debtRepayment.create({
        data: {
          debtId,
          asOfDate,
          amountMinor,
          note,
        },
      });

      const remainingAfter = remainingBefore - amountMinor;
      await tx.debt.update({
        where: { id: debtId },
        data: { status: statusForRemaining(remainingAfter) },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "OVER_REPAY") {
      return {
        errors: { amountMajor: ["Сумма больше остатка долга"] },
      };
    }
    if (error instanceof Error && error.message === "AMOUNT_NOT_POSITIVE") {
      return {
        errors: { amountMajor: ["Введите сумму больше 0"] },
      };
    }
    if (
      error instanceof Error &&
      error.message === "too many fractional digits"
    ) {
      return {
        errors: {
          amountMajor: ["Некорректная сумма"],
        },
      };
    }
    if (error instanceof Error && error.message === "bad amount") {
      return { errors: { amountMajor: ["Некорректная сумма"] } };
    }
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  revalidatePath("/debts");
  return { success: true, message: "Сохранено" };
}

/**
 * Delete repayment by id; recompute remaining + status (reopen OPEN when > 0).
 * revalidatePath("/debts") only on success (REPAY-03 / T-10-03 / T-10-04).
 */
export async function deleteRepayment(
  formData: FormData,
): Promise<DebtActionState> {
  const validated = deleteRepaymentSchema.safeParse({
    id: formData.get("id"),
  });

  if (!validated.success) {
    return {
      message: "Не удалось удалить. Попробуйте снова.",
    };
  }

  const { id } = validated.data;

  try {
    await ensureSqlitePragmas();
    await prisma.$transaction(async (tx) => {
      const repayment = await tx.debtRepayment.findUnique({
        where: { id },
        select: { id: true, debtId: true },
      });
      if (!repayment) {
        throw new Error("REPAYMENT_NOT_FOUND");
      }

      await tx.debtRepayment.delete({
        where: { id: repayment.id },
      });

      const debt = await tx.debt.findUniqueOrThrow({
        where: { id: repayment.debtId },
        include: {
          repayments: { select: { amountMinor: true } },
          sizeChanges: { select: { deltaMinor: true } },
        },
      });

      const remaining = remainingMinor(
        debt.initialAmountMinor,
        debt.sizeChanges.map((s) => s.deltaMinor),
        debt.repayments.map((r) => r.amountMinor),
      );

      await tx.debt.update({
        where: { id: debt.id },
        data: { status: statusForRemaining(remaining) },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "REPAYMENT_NOT_FOUND") {
      return {
        message: "Не удалось удалить. Попробуйте снова.",
      };
    }
    return {
      message: "Не удалось удалить. Попробуйте снова.",
    };
  }

  revalidatePath("/debts");
  return { success: true, message: "Удалено" };
}

/**
 * Manual size-change (signed delta); sync Debt.status from remaining (DEBT-05 / D-08).
 * revalidatePath("/debts") only — never dashboard root (DISOL-01 / T-10-04).
 */
export async function createSizeChange(
  _prev: DebtActionState,
  formData: FormData,
): Promise<DebtActionState> {
  const validated = createSizeChangeSchema.safeParse({
    debtId: formData.get("debtId"),
    deltaMajor: formData.get("deltaMajor"),
    asOfDate: formData.get("asOfDate"),
    note: formData.get("note") ?? undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { debtId, deltaMajor, asOfDate, note } = validated.data;
  const today = calendarDateToday();
  if (asOfDate > today) {
    return {
      errors: { asOfDate: ["Дата не может быть в будущем"] },
    };
  }

  try {
    await ensureSqlitePragmas();
    await prisma.$transaction(async (tx) => {
      const debt = await tx.debt.findUniqueOrThrow({
        where: { id: debtId },
        include: {
          repayments: { select: { amountMinor: true } },
          sizeChanges: { select: { deltaMinor: true } },
          currency: { select: { scale: true } },
        },
      });

      if (fracDigitCount(deltaMajor) > debt.currency.scale) {
        throw new Error("too many fractional digits");
      }

      let deltaMinor: bigint;
      try {
        deltaMinor = parseMajorToMinor(deltaMajor, debt.currency.scale);
      } catch (err) {
        if (
          err instanceof Error &&
          err.message === "too many fractional digits"
        ) {
          throw err;
        }
        throw new Error("bad amount");
      }

      const sizeDeltas = debt.sizeChanges.map((s) => s.deltaMinor);
      const repaymentAmounts = debt.repayments.map((r) => r.amountMinor);
      const principal = currentPrincipalMinor(
        debt.initialAmountMinor,
        sizeDeltas,
      );
      const sumRepayments = repaymentAmounts.reduce((sum, a) => sum + a, 0n);

      try {
        assertSizeDelta(deltaMinor, principal, sumRepayments);
      } catch (err) {
        if (
          err instanceof Error &&
          err.message === "size change would make remaining < 0"
        ) {
          throw new Error("OVER_FLOOR");
        }
        if (
          err instanceof Error &&
          err.message === "size delta must not be 0"
        ) {
          throw new Error("DELTA_ZERO");
        }
        throw err;
      }

      await tx.debtSizeChange.create({
        data: {
          debtId,
          asOfDate,
          deltaMinor,
          note,
        },
      });

      const remainingAfter = remainingMinor(
        debt.initialAmountMinor,
        [...sizeDeltas, deltaMinor],
        repaymentAmounts,
      );
      await tx.debt.update({
        where: { id: debtId },
        data: { status: statusForRemaining(remainingAfter) },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "OVER_FLOOR") {
      return {
        errors: {
          deltaMajor: ["Изменение сделало бы остаток отрицательным"],
        },
      };
    }
    if (error instanceof Error && error.message === "DELTA_ZERO") {
      return {
        errors: { deltaMajor: ["Изменение не может быть нулевым"] },
      };
    }
    if (
      error instanceof Error &&
      error.message === "too many fractional digits"
    ) {
      return {
        errors: { deltaMajor: ["Некорректная сумма"] },
      };
    }
    if (error instanceof Error && error.message === "bad amount") {
      return { errors: { deltaMajor: ["Некорректная сумма"] } };
    }
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  revalidatePath("/debts");
  return { success: true, message: "Сохранено" };
}

/**
 * Early close: server sets deltaMinor = −remaining (DEBT-05 / T-10-02).
 * Client deltaMajor ignored/absent. revalidatePath("/debts") only.
 */
export async function forgiveRemaining(
  _prev: DebtActionState,
  formData: FormData,
): Promise<DebtActionState> {
  const validated = forgiveRemainingSchema.safeParse({
    debtId: formData.get("debtId"),
    asOfDate: formData.get("asOfDate"),
    note: formData.get("note") ?? undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { debtId, asOfDate, note } = validated.data;
  const today = calendarDateToday();
  if (asOfDate > today) {
    return {
      errors: { asOfDate: ["Дата не может быть в будущем"] },
    };
  }

  try {
    await ensureSqlitePragmas();
    await prisma.$transaction(async (tx) => {
      const debt = await tx.debt.findUniqueOrThrow({
        where: { id: debtId },
        include: {
          repayments: { select: { amountMinor: true } },
          sizeChanges: { select: { deltaMinor: true } },
        },
      });

      const sizeDeltas = debt.sizeChanges.map((s) => s.deltaMinor);
      const repaymentAmounts = debt.repayments.map((r) => r.amountMinor);
      const remainingBefore = remainingMinor(
        debt.initialAmountMinor,
        sizeDeltas,
        repaymentAmounts,
      );

      if (remainingBefore === 0n) {
        throw new Error("NOTHING_TO_FORGIVE");
      }

      const deltaMinor = -remainingBefore;
      const principal = currentPrincipalMinor(
        debt.initialAmountMinor,
        sizeDeltas,
      );
      const sumRepayments = repaymentAmounts.reduce((sum, a) => sum + a, 0n);
      assertSizeDelta(deltaMinor, principal, sumRepayments);

      await tx.debtSizeChange.create({
        data: {
          debtId,
          asOfDate,
          deltaMinor,
          note,
        },
      });

      await tx.debt.update({
        where: { id: debtId },
        data: { status: "CLOSED" },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "NOTHING_TO_FORGIVE") {
      return {
        message: "Нечего прощать — остаток уже 0",
      };
    }
    return {
      message: "Не удалось сохранить. Проверьте поля и попробуйте снова.",
    };
  }

  revalidatePath("/debts");
  return { success: true, message: "Сохранено" };
}

/**
 * Delete size-change by id; recompute remaining + status (reopen OPEN when > 0).
 * revalidatePath("/debts") only on success (D-06 / T-10-03 / T-10-04).
 */
export async function deleteSizeChange(
  formData: FormData,
): Promise<DebtActionState> {
  const validated = deleteSizeChangeSchema.safeParse({
    id: formData.get("id"),
  });

  if (!validated.success) {
    return {
      message: "Не удалось удалить. Попробуйте снова.",
    };
  }

  const { id } = validated.data;

  try {
    await ensureSqlitePragmas();
    await prisma.$transaction(async (tx) => {
      const sizeChange = await tx.debtSizeChange.findUnique({
        where: { id },
        select: { id: true, debtId: true },
      });
      if (!sizeChange) {
        throw new Error("SIZE_CHANGE_NOT_FOUND");
      }

      await tx.debtSizeChange.delete({
        where: { id: sizeChange.id },
      });

      const debt = await tx.debt.findUniqueOrThrow({
        where: { id: sizeChange.debtId },
        include: {
          repayments: { select: { amountMinor: true } },
          sizeChanges: { select: { deltaMinor: true } },
        },
      });

      const remaining = remainingMinor(
        debt.initialAmountMinor,
        debt.sizeChanges.map((s) => s.deltaMinor),
        debt.repayments.map((r) => r.amountMinor),
      );

      await tx.debt.update({
        where: { id: debt.id },
        data: { status: statusForRemaining(remaining) },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SIZE_CHANGE_NOT_FOUND") {
      return {
        message: "Не удалось удалить. Попробуйте снова.",
      };
    }
    return {
      message: "Не удалось удалить. Попробуйте снова.",
    };
  }

  revalidatePath("/debts");
  return { success: true, message: "Удалено" };
}
