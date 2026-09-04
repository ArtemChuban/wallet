import { z } from "zod";

const asOfDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату");

const personNameSchema = z.string().trim().min(1).max(120);

const currencyCodeSchema = z.string().trim().min(1).max(16);

const debtDirectionSchema = z.enum(["I_OWE", "THEY_OWE"]);

const optionalNoteSchema = z.string().trim().max(500).optional();

const optionalDueDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату")
  .optional()
  .or(z.literal("").transform(() => undefined));

const MAJOR_NON_EMPTY = /^([+-]?)(\d+)(?:\.(\d+))?$/;

/** True when major decimal string represents a strictly positive amount. */
function isStrictlyPositiveMajor(major: string): boolean {
  const trimmed = major.trim();
  if (!trimmed || /[eE]/.test(trimmed)) return false;
  const match = MAJOR_NON_EMPTY.exec(trimmed);
  if (!match) return false;
  if (match[1] === "-") return false;
  const intPart = match[2] ?? "0";
  const frac = match[3] ?? "";
  const digits = `${intPart}${frac}`.replace(/^0+/, "");
  return digits.length > 0;
}

/** True when major string is non-empty decimal (sign allowed; zero-delta rejected in domain). */
function isNonEmptyMajor(major: string): boolean {
  const trimmed = major.trim();
  if (!trimmed || /[eE]/.test(trimmed)) return false;
  return MAJOR_NON_EMPTY.test(trimmed);
}

/** Create person: trimmed non-empty name. */
export const createPersonSchema = z
  .object({
    name: personNameSchema,
  })
  .strict();

/** Rename person. */
export const renamePersonSchema = z
  .object({
    personId: z.coerce.number().int().positive(),
    name: personNameSchema,
  })
  .strict();

/**
 * Create debt: shape only. Positive initial major required (D-03).
 * Remaining / status rules stay in debts.ts asserts (Phase 9–10 actions).
 */
export const createDebtSchema = z
  .object({
    personId: z.coerce.number().int().positive(),
    direction: debtDirectionSchema,
    currencyCode: currencyCodeSchema,
    initialAmountMajor: z.string().trim().min(1, "Введите корректную сумму"),
    dueDate: optionalDueDateSchema,
    note: optionalNoteSchema,
  })
  .strict()
  .superRefine((val, ctx) => {
    if (!isStrictlyPositiveMajor(val.initialAmountMajor)) {
      ctx.addIssue({
        code: "custom",
        path: ["initialAmountMajor"],
        message: "Введите сумму больше 0",
      });
    }
  });

/**
 * Compound create: new person name + debt fields (no personId) — D-06.
 */
export const createDebtWithNewPersonSchema = z
  .object({
    name: personNameSchema,
    direction: debtDirectionSchema,
    currencyCode: currencyCodeSchema,
    initialAmountMajor: z.string().trim().min(1, "Введите корректную сумму"),
    dueDate: optionalDueDateSchema,
    note: optionalNoteSchema,
  })
  .strict()
  .superRefine((val, ctx) => {
    if (!isStrictlyPositiveMajor(val.initialAmountMajor)) {
      ctx.addIssue({
        code: "custom",
        path: ["initialAmountMajor"],
        message: "Введите сумму больше 0",
      });
    }
  });

/**
 * Update debt meta only — no initial amount fields (DEBT-03 / D-03).
 * Direction / dueDate / note editable; principal changes via size-change events.
 */
export const updateDebtMetaSchema = z
  .object({
    debtId: z.coerce.number().int().positive(),
    direction: debtDirectionSchema.optional(),
    dueDate: optionalDueDateSchema,
    note: optionalNoteSchema,
  })
  .strict();

/**
 * Record repayment: shape only. Over-repay checks stay in assertRepaymentAmount.
 */
export const createRepaymentSchema = z
  .object({
    debtId: z.coerce.number().int().positive(),
    amountMajor: z.string().trim().min(1, "Введите корректную сумму"),
    asOfDate: asOfDateSchema,
    note: optionalNoteSchema,
  })
  .strict()
  .superRefine((val, ctx) => {
    if (!isStrictlyPositiveMajor(val.amountMajor)) {
      ctx.addIssue({
        code: "custom",
        path: ["amountMajor"],
        message: "Введите сумму больше 0",
      });
    }
  });

/**
 * Size-change event: signed major string; empty rejected here.
 * Zero-delta and remaining floor stay in assertSizeDelta (domain).
 */
export const createSizeChangeSchema = z
  .object({
    debtId: z.coerce.number().int().positive(),
    deltaMajor: z.string().trim().min(1, "Введите корректную сумму"),
    asOfDate: asOfDateSchema,
    note: optionalNoteSchema,
  })
  .strict()
  .superRefine((val, ctx) => {
    if (!isNonEmptyMajor(val.deltaMajor)) {
      ctx.addIssue({
        code: "custom",
        path: ["deltaMajor"],
        message: "Введите корректную сумму",
      });
    }
  });

export type CreatePersonInput = z.infer<typeof createPersonSchema>;
export type RenamePersonInput = z.infer<typeof renamePersonSchema>;
export type CreateDebtInput = z.infer<typeof createDebtSchema>;
export type CreateDebtWithNewPersonInput = z.infer<
  typeof createDebtWithNewPersonSchema
>;
export type UpdateDebtMetaInput = z.infer<typeof updateDebtMetaSchema>;
export type CreateRepaymentInput = z.infer<typeof createRepaymentSchema>;
export type CreateSizeChangeInput = z.infer<typeof createSizeChangeSchema>;
