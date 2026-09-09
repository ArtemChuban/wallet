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

describe("plan-02 close/reopen confirm + collapsed CLOSED (OBL-02)", () => {
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

describe("plan-03 overdue chrome (OBL-03 / D-07)", () => {
  it("grace dialog has overdue interest hint via isGraceOverdue", () => {
    const src = readFileSync(
      "src/components/accounts/CreditGraceDialog.tsx",
      "utf8",
    );
    expect(src).toMatch(/isGraceOverdue/);
    expect(src).toMatch(/Срок оплаты прошёл/);
    expect(src).toMatch(/bg-warning\/15/);
    expect(src).toMatch(/text-warning-foreground/);
  });

  it("просрочено chip near Грейс; no warning on account name", () => {
    const listSrc = readFileSync(
      "src/components/accounts/AccountList.tsx",
      "utf8",
    );
    expect(listSrc).toMatch(/просрочено/);
    expect(listSrc).toMatch(/Грейс/);
    const nameBlock = listSrc.match(
      /title=\{account\.name\}[\s\S]{0,120}/,
    )?.[0];
    expect(nameBlock).toBeTruthy();
    expect(nameBlock).not.toMatch(/warning/);
    expect(listSrc).not.toMatch(
      /title=\{account\.name\}[\s\S]{0,200}bg-warning/,
    );
  });
});

describe("plan-03 UX-01 + clear schedule (OBL-03 / UX-01 / D-14)", () => {
  it("AccountList credit debt label is Задолженность", () => {
    const listSrc = readFileSync(
      "src/components/accounts/AccountList.tsx",
      "utf8",
    );
    expect(listSrc).toMatch(/Задолженность/);
    expect(listSrc).not.toMatch(/\bдолг\b/);
  });

  it("amount dialog shows UX-01 disclaimer", () => {
    expect(existsSync("src/components/accounts/CreditGraceAmountDialog.tsx")).toBe(
      true,
    );
    const src = readFileSync(
      "src/components/accounts/CreditGraceAmountDialog.tsx",
      "utf8",
    );
    expect(src).toMatch(/Платёж для беспроцентного/);
    expect(src).toMatch(/Это не/);
    expect(src).toMatch(/Задолженность/);
  });

  it("clear schedule control + no DOM autofill 21/15", () => {
    const src = readFileSync(
      "src/components/accounts/CreditGraceDialog.tsx",
      "utf8",
    );
    expect(src).toMatch(/Очистить расписание/);
    expect(src).not.toMatch(/defaultValue=\{?["']?21/);
    expect(src).not.toMatch(/defaultValue=\{?["']?15/);
    expect(src).not.toMatch(/defaultValue=.15/);
  });

  it("grace dialog never embeds snapshot LOCF debt amount", () => {
    const src = readFileSync(
      "src/components/accounts/CreditGraceDialog.tsx",
      "utf8",
    );
    expect(src).not.toMatch(/creditDebtMinor/);
    expect(src).not.toMatch(/locf/);
    expect(src).not.toMatch(/Задолженность/);
  });

  it("grace button gated to FIAT_CREDIT; no native confirm in grace files", () => {
    const listSrc = readFileSync(
      "src/components/accounts/AccountList.tsx",
      "utf8",
    );
    expect(listSrc).toMatch(/FIAT_CREDIT/);
    expect(listSrc).toMatch(/CreditGraceDialog/);
    for (const file of [
      "src/components/accounts/CreditGraceDialog.tsx",
      "src/components/accounts/CreditGraceAmountDialog.tsx",
    ]) {
      const src = readFileSync(file, "utf8");
      expect(src).not.toMatch(/\bconfirm\s*\(/);
      expect(src).not.toMatch(/window\.confirm/);
    }
  });
});
