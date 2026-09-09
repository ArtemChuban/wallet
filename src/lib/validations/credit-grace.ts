import { z } from "zod";

/**
 * Credit grace obligation Zod — Phase 20 write-path ready (D-05…D-08, D-13, D-16).
 *
 * D-13: reject create when account schedule absent (both DOMs unset) — action-level
 * rule; use assertAccountHasGraceSchedule before prisma create.
 *
 * D-16: duplicate (accountId, cycleStartAsOf) maps to Prisma P2002 unique violation;
 * Phase 20 action should surface a Russian duplicate-cycle error (not silent overwrite).
 */

const asOfDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату");

const optionalNoteSchema = z.preprocess(
  (val) =>
    val === "" || val === undefined || val === null ? undefined : val,
  z.string().trim().max(500).optional(),
);

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

const amountMajorField = z
  .string()
  .trim()
  .min(1, "Введите корректную сумму");

const graceStatusSchema = z.enum(["OPEN", "CLOSED"]);

/**
 * D-13 helper: both statementDayOfMonth and dueDayOfMonth must be set before
 * creating an obligation (null schedule ⇒ no create).
 */
export function assertAccountHasGraceSchedule(account: {
  statementDayOfMonth: number | null;
  dueDayOfMonth: number | null;
}): boolean {
  return (
    account.statementDayOfMonth != null && account.dueDayOfMonth != null
  );
}

function refineClosedAsOfPairing(
  val: { status: "OPEN" | "CLOSED"; closedAsOf?: string | null },
  ctx: z.RefinementCtx,
) {
  const closedSet =
    typeof val.closedAsOf === "string" && val.closedAsOf.length > 0;
  if (val.status === "CLOSED" && !closedSet) {
    ctx.addIssue({
      code: "custom",
      path: ["closedAsOf"],
      message: "Укажите дату закрытия",
    });
  }
  if (val.status === "OPEN" && closedSet) {
    ctx.addIssue({
      code: "custom",
      path: ["closedAsOf"],
      message: "Дата закрытия только для закрытого обязательства",
    });
  }
}

function refinePositiveAmountMajor(
  val: { amountMajor: string },
  ctx: z.RefinementCtx,
) {
  if (!isStrictlyPositiveMajor(val.amountMajor)) {
    ctx.addIssue({
      code: "custom",
      path: ["amountMajor"],
      message: "Введите сумму больше 0",
    });
  }
}

const optionalClosedAsOfSchema = z.preprocess(
  (val) => (val === "" || val === undefined ? undefined : val),
  asOfDateSchema.optional(),
);

/**
 * Create obligation: amount required (D-06), dueAsOf present (D-05),
 * OPEN|CLOSED + closedAsOf pairing (D-07, D-08), note optional.
 */
export const createCreditGraceObligationSchema = z
  .object({
    accountId: z.coerce.number().int().positive(),
    cycleStartAsOf: asOfDateSchema,
    dueAsOf: asOfDateSchema,
    amountMajor: amountMajorField,
    status: graceStatusSchema.default("OPEN"),
    closedAsOf: optionalClosedAsOfSchema,
    note: optionalNoteSchema,
  })
  .strict()
  .superRefine((val, ctx) => {
    refinePositiveAmountMajor(val, ctx);
    refineClosedAsOfPairing(val, ctx);
  });

/**
 * Update obligation — amount / status / closedAsOf / note; cycle keys frozen (D-05).
 */
export const updateCreditGraceObligationSchema = z
  .object({
    id: z.coerce.number().int().positive(),
    amountMajor: amountMajorField,
    status: graceStatusSchema,
    closedAsOf: optionalClosedAsOfSchema,
    note: optionalNoteSchema,
  })
  .strict()
  .superRefine((val, ctx) => {
    refinePositiveAmountMajor(val, ctx);
    refineClosedAsOfPairing(val, ctx);
  });

export type CreateCreditGraceObligationInput = z.infer<
  typeof createCreditGraceObligationSchema
>;
export type UpdateCreditGraceObligationInput = z.infer<
  typeof updateCreditGraceObligationSchema
>;
