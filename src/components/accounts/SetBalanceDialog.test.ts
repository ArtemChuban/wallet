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

  it("uses type=date asOfDate with today default and max", () => {
    expect(dialogSrc).toMatch(/type=["']date["']/);
    expect(dialogSrc).toMatch(/name=["']asOfDate["']/);
    expect(dialogSrc).toMatch(/defaultValue=\{today\}/);
    expect(dialogSrc).toMatch(/max=\{today\}/);
  });

  it("disables submit while isPending and uses Сохранить баланс", () => {
    expect(dialogSrc).toMatch(/isPending/);
    expect(dialogSrc).toMatch(/disabled=\{isPending\}/);
    expect(dialogSrc).toMatch(/Сохранить баланс/);
  });
});
