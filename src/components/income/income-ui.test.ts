import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const listSrc = readFileSync("src/components/income/IncomeList.tsx", "utf8");
const pageSrc = readFileSync("src/app/income/page.tsx", "utf8");
const formDialogSrc = readFileSync(
  "src/components/income/IncomeFormDialog.tsx",
  "utf8",
);
const factDialogSrc = readFileSync(
  "src/components/income/IncomeFactDialog.tsx",
  "utf8",
);

describe("income UI destructive confirm (UI-01)", () => {
  it("IncomeList imports DestructiveConfirmStep and avoids native confirm", () => {
    expect(listSrc).toMatch(/DestructiveConfirmStep/);
    expect(listSrc).toMatch(/@\/components\/ui\/destructive-confirm-step/);
    expect(listSrc).not.toMatch(/window\.confirm/);
    expect(listSrc).not.toMatch(/\bconfirm\s*\(/);
  });

  it("IncomeFormDialog imports DestructiveConfirmStep and avoids native confirm", () => {
    expect(formDialogSrc).toMatch(/DestructiveConfirmStep/);
    expect(formDialogSrc).toMatch(
      /@\/components\/ui\/destructive-confirm-step/,
    );
    expect(formDialogSrc).not.toMatch(/window\.confirm/);
    expect(formDialogSrc).not.toMatch(/\bconfirm\s*\(/);
  });

  it("IncomeList edit control is Изменить button (not row-click-to-edit)", () => {
    expect(listSrc).toMatch(/Изменить/);
    expect(listSrc).not.toMatch(/role=["']button["']/);
  });
});

describe("income fact / overdue chrome (ACT-02 / ACT-03)", () => {
  it("IncomeList has overdue badge + fact CTA labels + получено", () => {
    expect(listSrc).toMatch(/заполни/);
    expect(listSrc).toMatch(/Заполни/);
    expect(listSrc).toMatch(/Внести факт/);
    expect(listSrc).toMatch(/Изменить факт/);
    expect(listSrc).toMatch(/получено/);
    expect(listSrc).toMatch(/IncomeFactDialog/);
  });

  it("overdue chip uses warning tokens, not destructive text classes", () => {
    expect(listSrc).toMatch(/bg-warning\/15/);
    expect(listSrc).toMatch(/text-warning-foreground/);
    expect(listSrc).not.toMatch(
      /заполни[\s\S]{0,120}text-destructive|text-destructive[\s\S]{0,120}заполни/,
    );
  });

  it("IncomeFactDialog uses DestructiveConfirmStep and avoids native confirm", () => {
    expect(factDialogSrc).toMatch(/DestructiveConfirmStep/);
    expect(factDialogSrc).toMatch(
      /@\/components\/ui\/destructive-confirm-step/,
    );
    expect(factDialogSrc).not.toMatch(/window\.confirm/);
    expect(factDialogSrc).not.toMatch(/\bconfirm\s*\(/);
  });

  it("fact dialog and list do not import chart UI", () => {
    expect(listSrc).not.toMatch(/@\/components\/ui\/chart/);
    expect(listSrc).not.toMatch(/\brecharts\b/);
    expect(factDialogSrc).not.toMatch(/@\/components\/ui\/chart/);
    expect(factDialogSrc).not.toMatch(/\brecharts\b/);
  });
});

describe("counterparty stats", () => {
  it("Person header shows all-time window hint", () => {
    expect(listSrc).toMatch(/за всё время/);
  });

  it("partial honesty copy present (Итог неполный or нет курса)", () => {
    expect(
      /Итог неполный|нет курса/.test(listSrc),
    ).toBe(true);
  });

  it("page wires computePersonIncomeStats and fxRate load", () => {
    expect(pageSrc).toMatch(/computePersonIncomeStats/);
    expect(pageSrc).toMatch(/fxRate/);
  });

  it("forbids DebtsPrimaryTotalsHero on income page (no page hero)", () => {
    expect(pageSrc).not.toMatch(/DebtsPrimaryTotalsHero/);
    expect(pageSrc).not.toMatch(/всего получено/);
    expect(listSrc).not.toMatch(/DebtsPrimaryTotalsHero/);
  });

  it("keeps DestructiveConfirmStep / no browser native confirm", () => {
    expect(listSrc).toMatch(/DestructiveConfirmStep/);
    expect(listSrc).not.toMatch(/window\.confirm/);
  });
});
