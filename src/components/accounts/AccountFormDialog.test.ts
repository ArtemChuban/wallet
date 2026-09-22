import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const dialogSrc = readFileSync(
  "src/components/accounts/AccountFormDialog.tsx",
  "utf8",
);

describe("AccountFormDialog controlled name (ACCT-01 / G-02-2 / 02-05-02)", () => {
  it("binds account-name Input from mount-init useState — no defaultValue", () => {
    expect(dialogSrc).toMatch(
      /const\s*\[\s*name\s*,\s*setName\s*\]\s*=\s*useState/,
    );
    expect(dialogSrc).toMatch(/id=["']account-name["']/);
    expect(dialogSrc).toMatch(/value=\{name\}/);
    expect(dialogSrc).toMatch(/onChange=\{/);
    expect(dialogSrc.match(/defaultValue/g) ?? []).toHaveLength(0);
  });
});

describe("AccountFormDialog edit ASSET↔SAVINGS unlock (ACCT-04 / 31-02)", () => {
  it("canConvertType uses exact ASSET|SAVINGS peer check — not isAssetType", () => {
    expect(dialogSrc).toMatch(/canConvertType/);
    expect(dialogSrc).toMatch(
      /account\.type\s*===\s*["']ASSET["']\s*\|\|\s*account\.type\s*===\s*["']SAVINGS["']/,
    );
    // Unlock must not soft-match legacy aliases via isAssetType
    const unlockBlock = dialogSrc.slice(
      dialogSrc.indexOf("canConvertType"),
      dialogSrc.indexOf("canConvertType") + 400,
    );
    expect(unlockBlock).not.toMatch(/isAssetType/);
  });

  it("CONVERT_TYPE_OPTIONS is ASSET+SAVINGS only (no FIAT_CREDIT)", () => {
    expect(dialogSrc).toMatch(/CONVERT_TYPE_OPTIONS/);
    const convertBlockMatch = dialogSrc.match(
      /CONVERT_TYPE_OPTIONS\s*=\s*\[[\s\S]*?\]\s*as const/,
    );
    expect(convertBlockMatch).not.toBeNull();
    const convertBlock = convertBlockMatch![0];
    expect(convertBlock).toMatch(/["']ASSET["']/);
    expect(convertBlock).toMatch(/["']SAVINGS["']/);
    expect(convertBlock).not.toMatch(/FIAT_CREDIT/);
  });

  it("showSavingsFields keys off draft accountType === SAVINGS in edit", () => {
    expect(dialogSrc).toMatch(/showSavingsFields/);
    // Draft gate (create and edit) — not frozen account?.type only
    expect(dialogSrc).toMatch(/accountType\s*===\s*["']SAVINGS["']/);
    expect(dialogSrc).not.toMatch(
      /showSavingsFields\s*=\s*[\s\S]*?mode\s*===\s*["']edit["']\s*&&\s*account\?\.type\s*===\s*["']SAVINGS["']/,
    );
  });

  it("convertible edit DialogDescription is Валюта не меняется.", () => {
    expect(dialogSrc).toMatch(/Валюта не меняется\./);
    expect(dialogSrc).toMatch(/Тип и валюта не меняются\./);
  });

  it("leave-SAVINGS onValueChange clears annual rate and DOM", () => {
    expect(dialogSrc).toMatch(/setAnnualRate\(["']["']\)/);
    expect(dialogSrc).toMatch(/setAccrualDom\(["']["']\)/);
    expect(dialogSrc).toMatch(/next\s*!==\s*["']SAVINGS["']/);
  });

  it("create TYPE_OPTIONS still includes FIAT_CREDIT (D-04)", () => {
    const createBlockMatch = dialogSrc.match(
      /(?:^|\n)const TYPE_OPTIONS\s*=\s*\[[\s\S]*?\]\s*as const/,
    );
    expect(createBlockMatch).not.toBeNull();
    expect(createBlockMatch![0]).toMatch(/FIAT_CREDIT/);
  });

  it("edit convert Select maps CONVERT_TYPE_OPTIONS not TYPE_OPTIONS", () => {
    expect(dialogSrc).toMatch(
      /mode\s*===\s*["']create["']\s*\?\s*TYPE_OPTIONS\s*:\s*CONVERT_TYPE_OPTIONS/,
    );
  });
});
