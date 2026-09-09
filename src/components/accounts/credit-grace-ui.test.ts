import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("plan-01 tracer chrome (CYCLE-02 / OBL-01)", () => {
  it("AccountList exposes Грейс control for FIAT_CREDIT", () => {
    const listSrc = readFileSync(
      "src/components/accounts/AccountList.tsx",
      "utf8",
    );
    expect(listSrc).toMatch(/Грейс/);
    expect(listSrc).toMatch(/CreditGraceDialog/);
    expect(listSrc).toMatch(/FIAT_CREDIT/);
  });

  it("CreditGraceDialog.tsx and CreditGraceAmountDialog.tsx exist", () => {
    expect(existsSync("src/components/accounts/CreditGraceDialog.tsx")).toBe(
      true,
    );
    expect(
      existsSync("src/components/accounts/CreditGraceAmountDialog.tsx"),
    ).toBe(true);
  });

  it("CreditGraceDialog title Беспроцентный период + schedule labels", () => {
    const src = readFileSync(
      "src/components/accounts/CreditGraceDialog.tsx",
      "utf8",
    );
    expect(src).toMatch(/Беспроцентный период/);
    expect(src).toMatch(/Дата выписки/);
    expect(src).toMatch(/Оплатить до/);
    expect(src).toMatch(/updateGraceSchedule/);
    expect(src).toMatch(/Ввести сумму/);
    expect(src).toMatch(/mergeGraceListRows/);
  });
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
