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
