"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import {
  createPersonSchema,
  renamePersonSchema,
} from "@/lib/validations/debts";

export type PersonActionState = {
  errors?: {
    name?: string[];
    personId?: string[];
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
