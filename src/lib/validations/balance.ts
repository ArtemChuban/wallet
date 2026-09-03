import { z } from "zod";

const asOfDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату");

/** Set balance: shape only. Future-date + credit 0..limit stay in Server Actions (Plan 02). */
export const setBalanceSchema = z
  .object({
    accountId: z.coerce.number().int().positive(),
    amountMajor: z.string().trim().min(1, "Введите корректную сумму"),
    asOfDate: asOfDateSchema,
  })
  .strict();

/** Delete a single BalanceSnapshot by id. */
export const deleteBalanceSchema = z
  .object({
    id: z.coerce.number().int().positive(),
  })
  .strict();

export type SetBalanceInput = z.infer<typeof setBalanceSchema>;
export type DeleteBalanceInput = z.infer<typeof deleteBalanceSchema>;
