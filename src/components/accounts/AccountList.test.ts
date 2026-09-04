import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const listSrc = readFileSync(
  "src/components/accounts/AccountList.tsx",
  "utf8",
);

describe("AccountList snapshot delete confirm (D-17 / PERSON-02)", () => {
  it("does not use a browser native confirm API", () => {
    expect(listSrc).not.toMatch(/window\.confirm/);
    expect(listSrc).not.toMatch(/\bconfirm\s*\(/);
  });

  it("uses UI-SPEC Russian snapshot confirm copy template", () => {
    expect(listSrc).toMatch(/Удалить снимок за/);
    expect(listSrc).toMatch(/Это нельзя отменить/);
  });

  it("reuses DestructiveConfirmStep for in-dialog second step", () => {
    expect(listSrc).toMatch(/DestructiveConfirmStep/);
  });
});
