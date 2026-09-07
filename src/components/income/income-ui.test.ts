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

  it("hybrid typography: native semibold base mono + primary muted sm mono", () => {
    expect(listSrc).toMatch(/font-mono text-base font-semibold/);
    expect(listSrc).toMatch(/font-mono text-sm text-muted-foreground/);
  });

  it("stats amounts use break-all for long money overflow (UI-SPEC)", () => {
    expect(listSrc).toMatch(
      /break-all[^"'`\n]*font-mono|font-mono[^"'`\n]*break-all/,
    );
  });

  it("partial honesty: compact Итог неполный · нет курса with role=status", () => {
    expect(listSrc).toMatch(/Итог неполный/);
    expect(listSrc).toMatch(/нет курса/);
    expect(listSrc).toMatch(/·/);
    expect(listSrc).toMatch(/role=["']status["']/);
    expect(listSrc).not.toMatch(/Задайте курсы/);
    expect(listSrc).not.toMatch(/Не все долги/);
  });

  it("partial chrome avoids warning/destructive/success-green tokens", () => {
    const partialBlock = listSrc.match(
      /isPartial[\s\S]{0,400}?role=["']status["'][\s\S]{0,200}/,
    );
    expect(partialBlock).not.toBeNull();
    expect(partialBlock![0]).not.toMatch(/bg-warning|text-warning|text-destructive|text-green|bg-green|amber/);
  });

  it("header layout uses gap-4 / text-right stats; no debts hero sizes", () => {
    expect(listSrc).toMatch(/justify-between gap-4/);
    expect(listSrc).toMatch(/items-end gap-2 text-right|text-right[\s\S]{0,80}gap-2/);
    expect(listSrc).not.toMatch(/text-3xl/);
    expect(listSrc).not.toMatch(/@\/components\/ui\/chart/);
  });

  it("page wires computePersonIncomeStats, fxRate, and identity-omit", () => {
    expect(pageSrc).toMatch(/computePersonIncomeStats/);
    expect(pageSrc).toMatch(/fxRate/);
    expect(pageSrc).toMatch(/identityOmit/);
    expect(pageSrc).toMatch(/!domainStats\.isPartial|!.*isPartial/);
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
