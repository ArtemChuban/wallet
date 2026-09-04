"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { ensureSqlitePragmas, prisma } from "@/lib/db";
import { createPersonSchema } from "@/lib/validations/debts";

export type PersonActionState = {
  errors?: {
    name?: string[];
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
