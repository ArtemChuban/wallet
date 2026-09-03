import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dialogSrc = readFileSync(
  "src/components/accounts/SetBalanceDialog.tsx",
  "utf8",
);

describe("SetBalanceDialog formKey + date contract (BAL-01)", () => {
  it("remounts form body via formKey on open", () => {
    expect(dialogSrc).toMatch(
      /const\s*\[\s*formKey\s*,\s*setFormKey\s*\]\s*=\s*useState/,
    );
    expect(dialogSrc).toMatch(/if\s*\(\s*next\s*\)\s*setFormKey/);
    expect(dialogSrc).toMatch(/key=\{formKey\}/);
  });

  it("uses DD.MM.YYYY display with hidden YYYY-MM-DD asOfDate", () => {
    expect(dialogSrc).toMatch(/formatAsOfDisplay/);
    expect(dialogSrc).toMatch(/parseAsOfDisplay/);
    expect(dialogSrc).toMatch(/name=["']asOfDate["']/);
    expect(dialogSrc).toMatch(/type=["']hidden["']/);
    expect(dialogSrc).toMatch(/placeholder=["']ДД\.ММ\.ГГГГ["']/);
    expect(dialogSrc).not.toMatch(/type=["']date["']/);
  });

  it("disables submit while isPending and uses Сохранить баланс", () => {
    expect(dialogSrc).toMatch(/isPending/);
    expect(dialogSrc).toMatch(/disabled=\{isPending\}/);
    expect(dialogSrc).toMatch(/Сохранить баланс/);
  });

  it("wraps long account names in description (no layout blowout)", () => {
    expect(dialogSrc).toMatch(/break-all/);
    expect(dialogSrc).toMatch(/overflow-wrap:anywhere|overflow-hidden/);
  });
});
