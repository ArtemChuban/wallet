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

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountNameInput = z.infer<typeof updateAccountNameSchema>;
