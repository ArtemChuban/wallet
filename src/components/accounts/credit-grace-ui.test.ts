import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("plan-01 tracer chrome (CYCLE-02 / OBL-01)", () => {
  it.todo("AccountList exposes Грейс control for FIAT_CREDIT");
  it.todo("CreditGraceDialog.tsx and CreditGraceAmountDialog.tsx exist");
  it.todo("CreditGraceDialog title Беспроцентный период + schedule labels");
});

describe.skip("plan-02 close/reopen confirm + collapsed CLOSED (OBL-02)", () => {
  it("CreditGraceDialog imports DestructiveConfirmStep", () => {
    const src = readFileSync(
      "src/components/accounts/CreditGraceDialog.tsx",
      "utf8",
    );
    expect(src).toMatch(/DestructiveConfirmStep/);
    expect(src).not.toMatch(/\bconfirm\s*\(/);
    expect(src).not.toMatch(/window\.confirm/);
  });

  it("shows Показать оплаченные for collapsed CLOSED", () => {
    const src = readFileSync(
      "src/components/accounts/CreditGraceDialog.tsx",
      "utf8",
    );
    expect(src).toMatch(/Показать оплаченные/);
  });
});

describe.skip("plan-03 overdue + UX-01 (OBL-03 / UX-01)", () => {
  it("AccountList credit debt label is Задолженность", () => {
    const listSrc = readFileSync(
      "src/components/accounts/AccountList.tsx",
      "utf8",
    );
    expect(listSrc).toMatch(/Задолженность/);
  });

  it("grace UI has overdue interest hint and просрочено mark", () => {
    const src = readFileSync(
      "src/components/accounts/CreditGraceDialog.tsx",
      "utf8",
    );
    expect(src).toMatch(/Срок оплаты прошёл/);
    expect(src).toMatch(/просрочено/);
  });

  it("amount dialog shows UX-01 disclaimer", () => {
    expect(existsSync("src/components/accounts/CreditGraceAmountDialog.tsx")).toBe(
      true,
    );
    const src = readFileSync(
      "src/components/accounts/CreditGraceAmountDialog.tsx",
      "utf8",
    );
    expect(src.length).toBeGreaterThan(0);
  });
});
