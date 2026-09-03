import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dialogSrc = readFileSync(
  "src/components/currencies/SetRateDialog.tsx",
  "utf8",
);

describe("SetRateDialog formKey + date contract (FX-01)", () => {
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

  it("disables submit while isPending and uses Сохранить курс", () => {
    expect(dialogSrc).toMatch(/isPending/);
    expect(dialogSrc).toMatch(/disabled=\{!canSubmit\}|disabled=\{isPending\}/);
    expect(dialogSrc).toMatch(/Сохранить курс/);
  });

  it("wires direction toggle with toPrimary/fromPrimary and Направление label", () => {
    expect(dialogSrc).toMatch(/toPrimary/);
    expect(dialogSrc).toMatch(/fromPrimary/);
    expect(dialogSrc).toMatch(/Направление/);
    expect(dialogSrc).toMatch(/name=["']direction["']/);
  });

  it("shows catch-all Russian form error message", () => {
    expect(dialogSrc).toMatch(/state\.message/);
  });
});
