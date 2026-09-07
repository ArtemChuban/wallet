import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const listSrc = readFileSync("src/components/income/IncomeList.tsx", "utf8");
const dialogSrc = readFileSync(
  "src/components/income/IncomeFormDialog.tsx",
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
    expect(dialogSrc).toMatch(/DestructiveConfirmStep/);
    expect(dialogSrc).toMatch(/@\/components\/ui\/destructive-confirm-step/);
    expect(dialogSrc).not.toMatch(/window\.confirm/);
    expect(dialogSrc).not.toMatch(/\bconfirm\s*\(/);
  });

  it("IncomeList edit control is Изменить button (not row-click-to-edit)", () => {
    expect(listSrc).toMatch(/Изменить/);
    expect(listSrc).not.toMatch(/role=["']button["']/);
  });
});
