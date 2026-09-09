import { z } from "zod";

const accountNameSchema = z.string().trim().min(1).max(120);

/** Write-path only: new accounts are ASSET or FIAT_CREDIT (D-02 soft-compat). */
const accountTypeSchema = z.enum(["ASSET", "FIAT_CREDIT"]);

/** Printable currency code matching Currency.code identity. */
const currencyCodeSchema = z.string().trim().min(1).max(16);

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

/** Create account: type/currency locked after create; credit limit only for FIAT_CREDIT. */
export const createAccountSchema = z
  .object({
    name: accountNameSchema,
    type: accountTypeSchema,
    currencyCode: currencyCodeSchema,
    creditLimitMajor: z.string().optional(),
  })
  .strict()
  .superRefine((val, ctx) => {
    const raw = val.creditLimitMajor;
    const hasLimit =
      typeof raw === "string" && raw.trim().length > 0;

    if (val.type === "FIAT_CREDIT") {
      if (!hasLimit) {
        ctx.addIssue({
          code: "custom",
          path: ["creditLimitMajor"],
          message: "Укажите кредитный лимит",
        });
        return;
      }
      if (!isStrictlyPositiveMajor(raw!)) {
        ctx.addIssue({
          code: "custom",
          path: ["creditLimitMajor"],
          message: "Введите сумму больше 0",
        });
      }
    } else if (hasLimit) {
      ctx.addIssue({
        code: "custom",
        path: ["creditLimitMajor"],
        message: "Лимит только для кредитного счёта",
      });
    }
  });

/** Update account: name only (D-15). */
export const updateAccountNameSchema = z.object({
  name: accountNameSchema,
});

/** Day-of-month 1–31, or null when clearing / omitted (income dayOfMonth range). */
const nullableDayOfMonthSchema = z.preprocess((val) => {
  if (val === "" || val === undefined || val === null) return null;
  return val;
}, z.coerce.number().int().min(1).max(31).nullable());

/**
 * D-02 type gate for grace DOM writes.
 * Null/null schedule is allowed for any type at schema layer; setting DOM requires FIAT_CREDIT.
 */
export function assertGraceDomAllowedForType(
  accountType: string,
  statementDayOfMonth: number | null,
  dueDayOfMonth: number | null,
): boolean {
  const anyDomSet =
    statementDayOfMonth !== null || dueDayOfMonth !== null;
  if (!anyDomSet) return true;
  return accountType === "FIAT_CREDIT";
}

/**
 * Persist dual DOM on FIAT_CREDIT (CYCLE-01 / D-01…D-03).
 * Optional accountType enables Zod-testable non-credit reject (D-02); action also gates from DB.
 */
export const updateGraceScheduleSchema = z
  .object({
    accountId: z.coerce.number().int().positive(),
    statementDayOfMonth: nullableDayOfMonthSchema,
    dueDayOfMonth: nullableDayOfMonthSchema,
    accountType: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    const s = val.statementDayOfMonth;
    const d = val.dueDayOfMonth;
    const sSet = s !== null && s !== undefined;
    const dSet = d !== null && d !== undefined;
    if (sSet !== dSet) {
      ctx.addIssue({
        code: "custom",
        message: "Укажите обе даты или очистите обе",
      });
      return;
    }
    if (
      val.accountType !== undefined &&
      !assertGraceDomAllowedForType(val.accountType, s ?? null, d ?? null)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Даты грейса только для кредитного счёта",
      });
    }
  });

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountNameInput = z.infer<typeof updateAccountNameSchema>;
export type UpdateGraceScheduleInput = z.infer<typeof updateGraceScheduleSchema>;
